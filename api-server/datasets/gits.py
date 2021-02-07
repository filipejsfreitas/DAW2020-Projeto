#!python3

from uuid import uuid4
from datetime import datetime
from typing import Union
import base64

import urllib3
import os
import json
import random

import pandas as pd

import bagit
import tempfile
import zipfile
import io
import shutil


GITHUB_USERNAME = 'filipejsfreitas'
GITHUB_API_TOKEN = '2db2ace14a34a0ddd50ac261ef5d1a44814c57f6'

MAIN_URL = 'https://api.github.com'
HEADERS = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'urllib3'
}


http = urllib3.PoolManager(headers=HEADERS)


if GITHUB_API_TOKEN is not None and GITHUB_USERNAME is not None:
    HEADERS['Authorization'] = 'Basic ' + base64.b64encode((GITHUB_USERNAME + ':' + GITHUB_API_TOKEN).encode('utf-8')).decode('ascii') # GitHub Basic Authentication Token to get higher rate limits


def check_and_download_repo(user, repo, uc, tipo: str):
    print(f'Checking repo {user}/{repo}')

    if os.path.exists(os.path.join('files', f'{user}-{repo}.zip')):
        return None

    resp = http.request_encode_url('GET', MAIN_URL + f'/repos/{user}/{repo}', headers=dict(HEADERS))
    data: dict = json.loads(resp.data.decode('utf-8'))
    resp.close()

    print('Remaining rate limits: ' + resp.headers["x-ratelimit-remaining"])

    if 'id' not in data.keys() or data['size'] == 0:
        # Repo doesn't exist!
        return None
    
    # Repo exists!

    # Download repo bytes
    zipball = download_repo(user, repo)

    # Extract the repository to a temporary directory
    tmp_dir = tempfile.mkdtemp()

    root_dir = None
    files = []
    with zipfile.ZipFile(io.BytesIO(zipball)) as zip:
        for member in zip.infolist():
            if not root_dir and member.is_dir():
                root_dir = member.filename[:-1]

            if not member.is_dir() and not 'node_modules' in member.filename:
                try:
                    extracted_path = zip.extract(member, tmp_dir)
                except:
                    return None
                
                components = member.filename.split('/')[1:]
                new_path = os.path.join(tmp_dir, *components[:-1])

                if not os.path.exists(new_path):
                    os.makedirs(new_path)

                shutil.move(extracted_path, os.path.join(new_path, components[-1]))
                files.append('/'.join(components))
        
        shutil.rmtree(os.path.join(tmp_dir, root_dir))
    
    del zipball

    # Create resource description
    resource = {
        'title': uc + ' - ' + tipo,
        'subtitle': 'TPCs de ' + user if tipo == 'TPCs' else 'Teste de avaliação de ' + user,
        'description': 'TPCs de ' + user if tipo == 'TPCs' else 'Teste de avaliação de ' + user,
        'type': 'Trabalhos de Casa' if tipo == 'TPCs' else 'Teste de avaliação',
        'createdAt': data['updated_at'],
        'tags': [uc, tipo],
        'files': files,
        'authors': [user]
    }

    with open(os.path.join(tmp_dir, 'info.json'), 'w', encoding='utf-8') as f:
        json.dump(resource, f)
    
    bagit.make_bag(tmp_dir, processes=4, checksum=['sha256'])

    # Fix spacing on the created manifest file
    # manifest_file_path = os.path.join(tmp_dir, 'manifest-sha256.txt')

    # manifest_entries = []
    # with open(manifest_file_path, 'r') as f:
    #     manifest_entries = f.readlines()
    
    # os.unlink(manifest_file_path)

    # with open(manifest_file_path, 'w', newline='\n') as f:
    #     f.writelines([ x.replace('  ', ' ') for x in manifest_entries])

    # Create and Write zip to files\ folder
    if not os.path.exists('files'):
        os.mkdir('files')
    
    with zipfile.ZipFile(os.path.join('files', f'{user}-{repo}.zip'), 'w') as zipf:
        zipdir(tmp_dir, zipf)

    # Delete temp dir
    shutil.rmtree(tmp_dir)

    return resource


def download_repo(user, repo):
    resp = http.request_encode_url('GET', MAIN_URL + f'/repos/{user}/{repo}/zipball', headers=dict(HEADERS))
    data: bytes = resp.data
    resp.close()

    return data


def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in os.walk(path):
        for file in files:
            ziph.write(os.path.join(root, file), os.path.relpath(os.path.join(root, file), path))


if __name__ == '__main__':
    df_daw = pd.read_csv('daw-gits.csv')
    df_pri = pd.read_csv('pri-gits.csv')
    
    df_daw['UC'] = 'DAW2020'
    df_pri['UC'] = 'PRI2020'

    df = df_daw.append(df_pri)

    resources: list = []

    try:
        for git, uc in df[['Git', 'UC']].values:
            components: list = [x.strip() for x in git.strip()[len('https://github.com/'):].split('/') if len(x) > 0]
            
            if len(components) < 2:
                components.append(uc)
            
            user, mainRepo = components

            data = check_and_download_repo(user, mainRepo, uc, 'TPCs')
            if data is not None:
                resources.append(data)
                print('Downloaded repo ' + user + '/' + mainRepo)

            data = check_and_download_repo(user, uc + '-Teste', uc, 'Teste')
            if data is not None:
                resources.append(data)
                print('Downloaded repo ' + user + '/' + uc + '-Teste')
    except KeyboardInterrupt:
        print('Download ended because of CTRL+C')
        pass

    print('Downloaded ' + str(len(resources)) + ' resources')

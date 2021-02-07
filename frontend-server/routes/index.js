const express = require('express');
const router = express.Router();
const axios = require('axios').default;
const fs = require('fs');
const jwt = require('jsonwebtoken')
const moment = require('moment')
const { promisify } = require('util')
const archiver = require('archiver');
const BagIt = require('bagit-fs')
const streamBuffers = require('stream-buffers')
const unzipper = require('unzipper')
const crypto = require('crypto')


const User = require('../controllers/user')

const { v4: uuidv4 } = require('uuid');

const multer = require('multer')
const path = require('path')

const upload = multer({ dest: './uploads' })

/* GET home page. */
router.get('/', function (req, res, next) {
  const Token = req.cookies.token

  User.ultimos_adicionados(Token)
    .then(dados => {

      if (Token) {
        let ex = {
          "token": true,
          "recs": dados.data
        }
        res.render('index', { resource: ex , user:req.user})
      } else {
        let ex = {
          "token": false,
          "recs": dados.data
        }
        res.render('index', { resource: ex })
      }
    })
    .catch(err => {
      res.render('error', { error: err })
    })

})
  ;

router.get('/admission', async function (req, res, next) {
  const { data: types } = await axios.get(`${process.env.API_URL}/resourceTypes`)
  res.render('admission', { types , user:req.user});
});

router.post('/admission', upload.array('myFiles'), function (req, res, next) {

  const Token = req.cookies.token

  if (Token) {

    req.body.authors = []
    if (Array.isArray(req.body.authorname)) {
      req.body.authorname.forEach(a => {
        req.body.authors.push(a)
      })
    } else {
      req.body.authors.push(req.body.authorname)
    }
    if (!Array.isArray(req.body.tags)) {
      let tag = req.body.tags
      req.body.tags = [tag]
    }
    delete req.body.authorname
    console.log(req.body)
    User.admission(req.body, Token)
      .then(dados => {
        //4n idRecurso = 5678
        idRecurso = dados.data.resource.id

        req.body.files = []

        console.log(req.body)
        console.log(req.files)

        let d = new Date().toISOString().substr(0, 10)
        let ano = d.substr(0, 4)
        let mes = d.substr(5, 2)
        let dia = d.substr(8, 2)



        const publicpath = '/fileStore/' + ano + '/' + mes + '/' + dia + '/' + idRecurso + '/';
        const dirp = __dirname + '/../public/fileStore/' + ano + '/' + mes + '/' + dia + '/' + idRecurso + '/';
        fs.mkdir(dirp, { recursive: true }, (err) => {
          if (err) {
            return console.error(err);
          }
          console.log('Directory created successfully!');

          req.files.forEach(async f => {

            let oldPath = f.path
            let newPath = dirp + f.originalname
            req.body.files.push({ "filename": f.originalname, "path": publicpath + f.originalname })

            await promisify(fs.rename)(oldPath, newPath)
          })

          console.log(req.body)

          axios.post(process.env.API_URL + '/resources/' + idRecurso + '/files?token=' + req.cookies.token, req.body)
            .then(resp => res.redirect('/'))
            .catch(error => res.render('error', { error }))
        })
        //falta ver como queres fazer a 2º parte mandar o body completo ou só os files
        //console.log(req.body)
        //res.redirect('/');
      })
      .catch(err => {
        res.render('error', { error: err })
      })
  } else {
    res.status(401).jsonp({ error: "token inexistente ou inválido" })
  }
});

///promise all esta a dar um erro
router.get('/resource/:id', function (req, res, next) {
  let nameMap = new Map()
  User.resource(req.params.id, req.cookies.token)
    .then(({ data }) => {
      data.resource.comments = data.resource.comments.map(c => ({
        ...c,
        createdAt: moment(c.createdAt),
        replies: c.replies.map(r => ({ ...r, createdAt: moment(r.createdAt) }))
      }));

      res.render('resource', { resource: data.resource , user:req.user})
    })
    .catch(err => {
      res.render('error', { error: err })
    })
});

router.get('/delete/:id', function (req, res) {
    axios.delete(process.env.API_URL + '/resources/' + req.params.id + '?token=' + req.cookies.token,)
    .then(dados => {
      let ano = moment(dados.data.resource.dateUploaded).format('YYYY')
      let mes = moment(dados.data.resource.dateUploaded).format('M')
      let dia = moment(dados.data.resource.dateUploaded).format('D')

      const dirpath = __dirname + '/../public/fileStore/' + ano + '/' + mes + '/' + dia + '/' + req.params.id + '/';

      fs.rmdir(dirpath, { recursive: true }, (err) => {
        if (err) {
          res.render('error', { error: err })
        }
        
        res.redirect('/')
       });
      
    })
    .catch(err => {
      res.render('error', { error: err })
    })
});

router.get('/changeresource/:id', async (req, res) => {
  try {
    const { data: types } = await axios.get(`${process.env.API_URL}/resourceTypes`)
    const dados = await User.resource(req.params.id, req.cookies.token)
    console.log(dados.data)

    res.render('changeresource', { resource: dados.data.resource, types: types, user:req.user })
  } catch (error) {
    res.render('error', { error })
  }
});

router.post('/changeresource/:id', upload.array('myFiles'), (req, res) => {
  req.body.authors = []
  req.body.files = []

  if (Array.isArray(req.body.authorname)) {
    req.body.authorname.forEach(a => {
      if (a !== '') {
        req.body.authors.push(a)
      }
    })
  } else {
    req.body.authors.push(req.body.authorname)
  }
  if (!Array.isArray(req.body.tags)) {
    let tag = req.body.tags
    req.body.tags = [tag]
  }
  if (!Array.isArray(req.body.oldfiles)) {
    let old = req.body.oldfiles
    req.body.oldfiles = [old]
  }

  const index = req.body.tags.indexOf('');
  if (index > -1) {
    req.body.tags.splice(index, 1);
  }
  console.log(req.body)
  console.log(req.files)


  let ano = moment(req.body.dateUploaded).format('YYYY')
  let mes = moment(req.body.dateUploaded).format('M')
  let dia = moment(req.body.dateUploaded).format('D')

  const Token = req.cookies.token
  console.log(Token)

  if (Token) {



    User.resource(req.params.id, req.cookies.token)
      .then(dados => {
        req.body.oldfiles.forEach(of => {
          dados.data.files.forEach(f => {
            if (of == f.filename) {
              req.body.files.push(f)
            }
          })
        })
        delete req.body.authorname
        delete req.body.oldfiles
        console.log(req.body)

        let idRecurso = req.params.id

        const publicpath = '/fileStore/' + ano + '/' + mes + '/' + dia + '/' + idRecurso + '/';
        const dirp = __dirname + '/../public/fileStore/' + ano + '/' + mes + '/' + dia + '/' + idRecurso + '/';
        fs.mkdir(dirp, { recursive: true }, (err) => {
          if (err) {
            return console.error(err);
          }
          console.log('Directory created successfully!');

          req.files.forEach(async f => {

            let oldPath = f.path
            let newPath = dirp + f.originalname
            req.body.files.push({ "filename": f.originalname, "path": publicpath + f.originalname })

            await promisify(fs.rename)(oldPath, newPath)
          })

          console.log(req.body)

          axios.post(process.env.API_URL + '/resources/' + idRecurso + '/files?token=' + req.cookies.token, req.body)
            .then(resp => res.redirect('/'))
            .catch(error => res.render('error', { error }))
        })
      })
      .catch(err => {
        res.render('error', { error: err })
      })
  }

  else {
    res.status(401).jsonp({ error: "token inexistente ou inválido" })
  }
});

// eta a receber o post não esta a fazer nada com ele quando a api funcionar 
//obtemos a identidade do utilizador atraves do token

router.post('/comment/:id', function (req, res, next) {
  console.log(req.body)
  User.post_comment(req.params.id, req.body, req.cookies.token)
    .then(dados => {
      res.redirect('/resource/' + req.params.id + '#comments-logout')
    })
    .catch(err => {
      res.render('error', { error: err })
    })
});
// pensei que o id seria do tipo idrecurso/idpost
router.post('/reply/:idrec/:idcom', function (req, res, next) {
  console.log(req.params.idrec)
  console.log(req.params.idcom)
  console.log(req.body)
  User.post_reply(req.params.idrec, req.params.idcom, req.body, req.cookies.token)
    .then(dados => {
      console.log(dados)
      res.redirect('/resource/' + req.params.idrec + '#comments-logout')
    })
    .catch(err => {
      res.render('error', { error: err })
    })

});

router.get('/searchresults', function (req, res, next) {
  const resPerPage = 10;
  req.body.page = req.query.page
  req.body.limit = resPerPage
  req.body.search = req.query.search
  if (req.query.type) {
    req.body.type = req.query.type.split(' ')
    var link = '/searchresults?search=' + req.query.search + '&type=' + req.query.type
  } else {
    var link = '/searchresults?search=' + req.query.search
  }
  console.log(JSON.stringify(req.body))
  User.advanced_search(req.cookies.token, req.body, resPerPage,req.query.page)
    .then(resposta => {
      totalresults = resposta.count
      console.log(resposta)
      res.render('searchresults', {
        resource: resposta.data,
        currentpage: req.query.page,
        pages: Math.ceil(totalresults / resPerPage),
        numOfResults: totalresults,
        link: link,
        title: "Resultados da Pesquisa",
        user:req.user
      })
    })
    .catch(err => {
      res.render('error', { error: err })
    })
});

router.get('/personalarea', function (req, res) {
  const resPerPage = 10;
  if (req.query.page) {
    req.body.page = req.query.page
  }
  else {
    req.body.page = 1
  }
  let link = '/personalarea?'
  const payload = jwt.decode(req.cookies.token)
  User.personal_area(req.cookies.token, payload.uid, resPerPage, parseInt(req.body.page))
    .then(({ data }) => {
      totalresults = data.totalCount

      res.render('searchresults', {
        resource: data.resources,
        currentpage: req.body.page,
        pages: Math.ceil(totalresults / resPerPage),
        numOfResults: totalresults,
        link: link,
        personal: true,
        title: "Área Pessoal",
        user:req.user
      })
    })
    .catch(err => {
      res.render('error', { error: err })
    })
});

router.get('/advancedsearch', async function (req, res, next) {
  const { data: types } = await axios.get(`${process.env.API_URL}/resourceTypes`)

  res.render('search', { types , user:req.user})
});

router.post('/search', function (req, res, next) {
  console.log(req.body)
  res.redirect('/searchresults?page=1&search=' + req.body.search)
});

router.post('/advancedsearch', function (req, res, next) {

  if (req.body.type) {
    let temp = ''
    if (Array.isArray(req.body.type)) {
      req.body.type.forEach(t => {
        temp = temp + t + ' '
      })
      temp = temp.splice(0, -1)
      req.body.type = temp
    }
    res.redirect('/searchresults?page=1&search=' + req.body.search + '&type=' + req.body.type)
  }
  else {
    res.redirect('/searchresults?page=1&search=' + req.body.search)
  }

});

router.get('/searchtag/:tag', function (req, res, next) {
  const resPerPage = 10;
  if (req.query.page) {
    req.body.page = req.query.page
  }
  else {
    req.body.page = 1
  }
  let link = '/searchtag/' + req.params.tag + '?'

  User.tag_search(req.cookies.token, req.params.tag, resPerPage, parseInt(req.body.page))
    .then(({ list, count: totalResults }) => {

      res.render('searchresults', {
        resource: list,
        currentpage: req.body.page,
        pages: Math.ceil(totalResults / resPerPage),
        numOfResults: totalResults,
        link: link,
        title: "Resultados Pesquisa",
        user:req.user
      })
    })
    .catch(error => {
      res.render('error', { error })
    })
});

router.get('/:id/bagit', async (req, res) => {
  try {
    // Fetch resource information from backend
    const { data: { resource } } = await User.resource(req.params.id, req.cookies.token);

    let resourceConverted = {
      title: resource.title,
      subtitle: resource.subtitle,
      description: resource.description,
      type: resource.type.name,
      createdAt: resource.createdAt,
      tags: resource.tags.map(t => t.name),
      files: resource.files.map(f => f.filename),
      authors: resource.authors.map(a => a.name)
    }

    const resourceData = JSON.stringify(resourceConverted);

    // Create a new bag for the resource
    const bagFolder = await fs.promises.mkdtemp(path.join('uploads', 'Bag - ' + resource.title + ' - '))
    const zipfileFolder = await fs.promises.mkdtemp(path.join('uploads', 'Zip - ' + resource.title + ' - '))
    const zipfilePath = path.join(zipfileFolder, resource.title + '.zip')
    const bag = BagIt(bagFolder, 'sha256', {})

    // Write the metadata to the info.json file
    const resourceDataBuffer = new streamBuffers.ReadableStreamBuffer()
    resourceDataBuffer.put(resourceData)
    resourceDataBuffer.stop()
    resourceDataBuffer.pipe(bag.createWriteStream('info.json'))

    // Write the resource's files to the bag
    for (let file of resource.files) {
      await fs.promises.mkdir(path.join(bagFolder, 'data', ...file.filename.split('/').slice(0, -1)), { recursive: true })
      fs.createReadStream('public/' + file.path).pipe(bag.createWriteStream(file.filename))
    }

    // Wait for the bag to be fully written
    bag.finalize(async () => {
      // Compress bag into zip file
      const zipfile = fs.createWriteStream(zipfilePath)
      const archive = archiver('zip')
      archive.pipe(zipfile)

      archive.on('warning', err => {
        if (err.code === 'ENOENT') {
          console.error('While bagging resource ' + resource.id + ', failed to bag: ' + err.path + ' as file does not exist');
        } else {
          throw err;
        }
      });

      archive.on('error', err => { throw err });

      zipfile.on('error', err => { throw err })
      zipfile.on('warning', err => { throw err })

      zipfile.on('close', async () => {
        await fs.promises.rm(bagFolder, { recursive: true, force: true })

        res.download(zipfilePath, async (err) => {
          await fs.promises.rm(zipfileFolder, { recursive: true, force: true })
        })
      })

      archive.directory(`${bagFolder}`, false)

      await archive.finalize();
    })
  } catch (error) {
    res.status(500).render('error', { error })
  }
})

router.get('/upload', (req, res) => {
  res.render('upload-bag.pug')
})

router.post('/upload', upload.array('bags'), async (req, res) => {
  let errors = [];
  
  for (let file of req.files) {
    try {
      // file.path, file.originalname
      const bagFolder = await fs.promises.mkdtemp(path.join('uploads', 'Bag - upload - '))

      await fs.createReadStream(file.path)
        .pipe(unzipper.Extract({ path: bagFolder }))
        .promise()

      const bag = BagIt(bagFolder, 'sha256', {})
      const resourceData = JSON.parse(await promisify(bag.readFile.bind(bag))('info.json', 'utf-8'))

      const { data: { resource } } = await axios.post(process.env.API_URL + '/resources?token=' + req.cookies.token, {
        title: resourceData.title,
        subtitle: resourceData.subtitle,
        description: resourceData.description,
        type: resourceData.type,
        createdAt: resourceData.createdAt,
        tags: resourceData.tags,
        authors: resourceData.authors
      })

      const idRecurso = resource.id;
      const ano = moment().format('YYYY')
      const mes = moment().format('M')
      const dia = moment().format('D')

      const publicpath = '/fileStore/' + ano + '/' + mes + '/' + dia + '/' + idRecurso + '/';
      const dirp = __dirname + '/../public/fileStore/' + ano + '/' + mes + '/' + dia + '/' + idRecurso + '/';

      function readFileFromBag(fName) {
        return new Promise((resolve, reject) => {
          const newPath = dirp + fName

          const resourceFileStream = fs.createReadStream(path.join(bagFolder, 'data', fName), { emitClose: true })
          const outputFileStream = fs.createWriteStream(newPath, { emitClose: true })

          outputFileStream.on('close', () => resolve({ filename: fName, path: publicpath + fName }))

          bag.getManifestEntry(fName, (err, entry) => {
            if(err) {
              reject(new Error('Could not read manifest for file ' + fName))
              return
            }

            const checksum = entry?.checksum

            const digest = crypto.createHash('sha256')

            resourceFileStream.on('data', data => {
              digest.update(data)
  
              outputFileStream.write(data, err => {
                if(err) reject(err)
              })
            })
  
            resourceFileStream.on('end', () => {
              if (checksum !== digest.digest('hex')) {
                reject(new Error('Bag corrupted on file ' + fName))
                return
              }
  
              outputFileStream.end()
            })
          })
        })
      };

      const files = []
      let failed = false;
      for (const fName of resourceData.files) {
        try {
          await fs.promises.mkdir(path.join(dirp, ...fName.split('/').slice(0, -1)), { recursive: true })
          files.push(await readFileFromBag(fName))
        } catch (error) {
          errors.push(error);
          failed = true;

          break;
        }
      }

      try {
        if(!failed) {
          await axios.post(process.env.API_URL + '/resources/' + idRecurso + '/files?token=' + req.cookies.token, { files })
        }
      } catch (error) {
        errors.push(error)
      }

      await fs.promises.rm(bagFolder, { recursive: true, force: true })
      await fs.promises.rm(file.path, { recursive: true, force: true })
    } catch(error) {
      errors.push(error)
    }
  }

  if(errors.length > 0) {
    return res.status(500).jsonp({ errors })
  } else {
    res.redirect('/personalarea')
  }
})

// Override BagIt's implementation of readManifest as it is a disaster at handling files with spaces in the name
BagIt.prototype.readManifest = function (cb) {
  fs.readFile(this.manifest, 'utf-8', function (err, data) {
    if (err) return cb(err)

    const entries = data.split('\n').map(function (line) {
      line = line.replace('  ', ' ').split(' ')
      return { checksum: line[0], name: line.slice(1).join(' ') }
    })

    cb(null, entries)
  })
}

module.exports = router;

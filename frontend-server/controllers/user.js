
const axios = require('axios').default;


module.exports.login = async body => {
  let resposta = await axios.post(process.env.API_URL + '/auth/login', body);

  return resposta;
}

module.exports.register = async body => {
  let resposta = await axios.post(process.env.API_URL + '/auth/register', body);

  return resposta;
}
//ir consultar um recurso
module.exports.resource = async function (id, token) {
  let body = {
    "token": token
  }
  let resposta = await axios.get(process.env.API_URL + '/resources/' + id + '?token=' + token, body);
  return resposta;
}

//obter informaçoes pessoais
module.exports.get_info = async function (token) {
  let resposta = await axios.get(process.env.API_URL + '/auth?token=' + token);
  return resposta;
}

//alterar informações pessoais que vão no body
module.exports.change_info = async function (token, body) {
  let resposta = await axios.put(process.env.API_URL + '/auth?token=' + token, body);
  return resposta;
}

//postar uma resposta a um comentario que vai no body
module.exports.post_reply = async function (idrec, idcom, body, token) {
  
  let resposta = await axios.post(`${process.env.API_URL}/resources/${idrec}/comments/${idcom}/replies?token=${token}`, [body.addReply])
  return resposta;
}

//postar um comentario que vai no body
module.exports.post_comment = async function (idrec, body, token) {
  
  let resposta = await axios.post(`${process.env.API_URL}/resources/${idrec}/comments?token=${token}`, [body.addComment])
  return resposta;
}
//criar um novo recurso retornar o id deste não envio nada só quero o id de volta o link nao esta definido
module.exports.admission = async function (body, token) {
  let resposta = await axios.post(process.env.API_URL + '/resources?token='+token, body);
  return resposta;
}

//utilizado para enviar a informação a preencher no conteudo criado anteriormente
module.exports.admission_content = async function (body, token) {
  let resposta = await axios.post(process.env.API_URL + '/..........?token=' + token, body);

  return resposta;
}
//fornecer uma lista dos talvez 5 ultimos recursos publicos adicionados para aparecer na pagina inicial
module.exports.ultimos_adicionados = async function (token) {
  let resposta = await axios.get(process.env.API_URL + '/resources?token='+token);

  return resposta;
}


//listar todos os recursos de um utilizador para apresentar na sua area pessoal
module.exports.personal_area = async function (token, userId, limit, page) {
  let resposta = await axios.get(process.env.API_URL + '/users/' + userId + '/resources?skip=' + ((page - 1) * limit) + '&limit=' + limit + '&token=' + token);

  return resposta;
}
//listar os recursos que correspondem a procura e nas categorias selecionadas no body
module.exports.advanced_search = async function (token, body, limit, page) {
  let { data } = await axios.post(process.env.API_URL + `/resources/search?skip=${((page - 1) * limit)}&limit=${limit}&token=${token}`, body);

  return { data: data.resources, count: data.totalCount }
}

module.exports.tag_search = async function (token, tag, limit, page) {
  let { data } = await axios.get(process.env.API_URL + '/tags/' + tag + '/resources?token=' + token + '&limit=' + limit + '&skip=' + ((page - 1) * limit));

  return {
    list: data.resources,
    count: data.totalCount
  };
}

module.exports.logout = function (token) {
  return axios.post(process.env.API_URL + '/auth/logout?token=' + token);
}

module.exports.change_password = async function (body, token) {
  let resposta = await axios.get(process.env.API_URL + '/auth?token=' + token, { password: body.newpassword });
  return resposta;
}

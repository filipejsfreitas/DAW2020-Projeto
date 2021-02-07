var express = require('express');
var router = express.Router();

var passport = require('passport')
var passwordHash = require('password-hash');
var axios = require('axios');
var User = require('../controllers/user')
const e = require('express');

/* GET users listing. */

router.get('/logout', function (req, res) {
  if (!req.cookies.token) {
    res.redirect('/')
  }

  User.logout(req.cookies.token)
    .then(dados => {
      if (dados.data.success) {
        res.clearCookie('token').redirect('/');
      } else {
        res.send('Erro ao fazer logout')
      }
    })
    .catch(e => {
      console.log(JSON.stringify(e.response.data))
      if (e.response && e.response.status === 400 && e.response.data.error.name === 'not_logged_in') {
        return res.clearCookie('token').redirect('/')
      }

      res.render('error', { error: e })
    })
});

router.get('/login', function (req, res) {
  res.render('login');
});

router.post('/login', function (req, res) {
  User.login(req.body)
    .then(dados => {
      res.cookie('token', dados.data.token, {
        expires: new Date(Date.now() + process.env.JWT_DURATION),
        secure: false, // set to true if your using https
        httpOnly: true
      });
      res.redirect('/')
    })
    .catch(e => res.render('error', { error: e }))
})

router.get('/register', function (req, res, next) {
  res.render('register');
});

router.post('/register', function (req, res) {
  let user = {
    "name": req.body.name,
    "email": req.body.email,
    "password": req.body.password,
    "role": "user",
    "affiliation": req.body.affiliation
  }
  console.log(user)

  User.register(user)
    .then(resp => {
      res.redirect('/users/login')
    })
    .catch(error => {
      res.render('error', { error })
    })

})

router.get('/changepassword', function (req, res, next) {
  res.render('changepassword');
});


router.post('/changepassword', function (req, res) {
  if (req.body.newpassword !== req.body.confirmnewpassword) {
    return res.render('changepassword');
  }

  User.change_password(req.body, req.cookies.token)
    .then(resp => {
      res.redirect('/')
    })
    .catch(err => {
      res.render('error', err)
    })

})


router.get('/changeinfo', function (req, res) {
  User.get_info(req.cookies.token)
    .then(dados => {
      res.render('changeinfo', { resource: dados.data })
    })
    .catch(e => res.render('error', { error: e }))
});

router.post('/changeinfo', function (req, res) {
  User.change_info(req.cookies.token, req.body)
    .then(dados => {
      res.redirect('/')
    })
    .catch(e => res.render('error', { error: e }))
});

module.exports = router;

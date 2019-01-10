var express = require('express');
var router = express.Router();
var Datastore = require('nedb');
var users = new Datastore({ filename: '/bin/users.db', autoload: true });
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config');

var verfiyToken = require('../api/verifytoken')



/* GET users listing. */
router.post('/register', function(req, res) {
  var hashedPassword = bcrypt.hashSync(req.body.password, 8);

  users.insert({
    username: req.body.username,
    password: hashedPassword,
    role: req.body.role
  }, function(err, user) {
    if(err) {
      return res.status(500).send('Problem during registration');
    }

    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400
    });

    res.status(200).send({ 
      auth: true, token: token 
    });
  })
});

router.get('/users', function(req, res) {
  users.find(req.query, {password: 0}, function(err, users) {
    res.json(users)
  })
})

router.get('/user', verfiyToken, function(req, res, next){
  users.findOne({ _id: req.userId },{ password: 0 }, function(err, user) {
      if(err) {
        return res.status(500).send('There was a problem finding the user');
      }

      if(!user) {
        return res.status(404).send('No user found')
      }

      res.status(200).send(user)
    });
});

router.post('/login', function(req, res) {
  users.findOne({ username: req.body.username }, function(err, user) {
    if(err) {
      return res.status(200).send('Server error encountered');
    }

    if(!user) {
      return res.status(404).send('User not found');
    }

    var passwordisValid = bcrypt.compareSync(req.body.password, user.password);

    if (!passwordisValid) {
      return res.status(401).send({
        auth: false,
        token: null
      })
    }

    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400
    });

    res.status(200).send({
      auth: true,
      token: token
    })
  })
})

router.get('/logout', function(req, res){
  res.status(200).send({ 
    auth: false,
    token: null
  })
})

module.exports = router;

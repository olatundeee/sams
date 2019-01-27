var express = require('express');
var router = express.Router();
var Datastore = require('nedb');
var path = require('path');
var users = new Datastore({ filename: path.join(__dirname, 'bin/users.db'), autoload: true });
var families = new Datastore({ filename: path.join(__dirname, 'bin/families.db'), autoload: true });
var students = new Datastore({ filename: path.join(__dirname, 'bin/students.db'), autoload: true });
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var config = require('../config');

var verfiyToken = require('../api/verifytoken');
//var verifyRole = require('../api/verifyrole');



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

    /**
    var token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: 86400
    });
     */
    res.status(200).send({ 
      auth: true
      //, token: token 
    });
  })
});

router.get('/users', function(req, res) {
  users.find(req.query, {password: 0}, function(err, users) {
    res.json(users)
  })
})

router.get('/user/:id',/* verfiyToken,*/ function(req, res){
  users.findOne({ username: req.params.id }, function(err, user) {
      if(err) {
        return res.status(500).send('There was a problem finding the user');
      }

      if(!user) {
        return res.status(404).send('No user found for'+ ' ' + req.params.username)
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
    });
  })
})

router.get('/logout', function(req, res){
  res.status(200).send({ 
    auth: false,
    token: null
  })
})

router.get('/families', function(req, res) {
  families.find(req.query, {password: 0}, function(err, families) {
    res.json(families)
  })
})

router.get('/students', function(req, res) {
  students.find(req.query, {password: 0}, function(err, families) {
    res.json(families)
  })
});

router.post('/families', function(req, res) {
  families.insert({
    name: req.body.name,
    email: req.body.email,
    tel_no_1: req.body.telephone1,
    tel_no_2: req.body.telephone2
  }, function(err, user) {
    if(err) {
      return res.status(500).send('Problem during registration');
    }

    res.status(200).send(user);
  })
});


router.get('/:name/members', function(req, res){
  families.find({
      name: req.params.name
  }, {
    email: 0,
    tel_no_1: 0,
    tel_no_2: 0
  }, function(err, family) {
    if(err) {
      return res.status(500).send('There was a problem finding the family');
    }

    if(!family) {
      return res.status(404).send('No family found for'+ ' ' + req.params.family);
    }



    res.status(200).json(family);
  });
})

router.put('/members', function(req, res) {
  console.log(req.body);


  var family = req.body.family;
  var name = req.body.name;
  var role = req.body.role;
  var address = req.body.address;
  var telno = req.body.telno;
  var image = req.body.image;

  families.update({
    name: family
  }, { $push: {
    members:{
      name: name,
      role: role,
      address: address,
      tel_no: telno,
      image: image
    }
  }
  }, {upsert: true}, function(err, member) {
    if(err) {
      return res.sendStatus(500).send('Problem during member registration');
    }

    res.sendStatus(200);
    console.log(member);
  })
})




module.exports = router;

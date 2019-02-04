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
    role: 'User'
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
  students.find(req.query, function(err, students) {
    res.json(students)
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
  var email = req.body.email;
  var address = req.body.address;
  var telno = req.body.telno;
  var image = req.body.image;

  families.update({
    name: family
  }, { $push: {
    members:{
      name: name,
      role: role,
      email: email,
      address: address,
      tel_no: telno,
      image: image
    }
  }
  }, {upsert: true}, function(err, member) {

    if (req.body.role === 'Student') {
      students.insert({
        family: family,
        name: name,
        role: role,
        email: email,
        address: address,
        tel_no: telno,
        image: image
      }, function(err, student) {
        if(err) {
          return res.sendStatus(500).send('Problem during member registration');
        }
      })
    }

    if(err) {
      return res.sendStatus(500).send('Problem during member registration');
    }

    res.sendStatus(200).send(member);
  })
})

router.put('/edit-members', function(req, res) {
  console.log(req.body);

  families.update({
    _id: req.body._id,
    'members.name': req.body.membername
  }, {
    $set: {
      'members' : {
        'name': req.body.name,
        'role': req.body.role,
        'address': req.body.address,
        'image': req.body.image,
        'tel_no': req.body.telno
      }
    }
  }, function(err) {
    if(err) {
      return res.sendStatus(500).send('Was not able to delete');
      console.log(err)
    } else {
      return res.sendStatus(200);
    }
  })
})

router.get('/family/:id', function(req, res, next) {
  families.remove({
    _id: req.params.id
  }, {}, function(err) {
    if(err) {
      return res.sendStatus(500).send('Was not able to delete');
    } else {
      return res.sendStatus(200);
    }
  })
})

router.get('/:family/:name', function(req, res, next) {
  families.update({
    _id: req.params.family
  }, {
    $pull: {
      'members' : {
        name: req.params.name
      }
    }
  }, function(err) {
    
    students.findOne({
      name: req.params.name
    }, function(err, student) {
      console.log(student);

      if (student) {
        students.remove({
          name: student.name,
          family: student.family
        }, function(err){
          if(err) {
            return res.sendStatus(500).send('Was not able to delete');
          }
        })
      }
    })

    if(err) {
      return res.sendStatus(500).send('Was not able to delete');
    } else {
      return res.sendStatus(200);
    }
  })
})

router.delete('/user/:id', function(req, res) {
  users.remove({
    _id: req.params.id
  }, {}, function(err) {
    if(err) {
      return res.sendStatus(500).send('Was not able to delete');
    } else {
      return res.sendStatus(200);
    }
  })
})

router.put('/edit-users', function(req, res) {
  console.log(req.body);
  users.update({
    _id: req.body._id
  }, {
    username: req.body.username,
    password: req.body.password,
    role: 'User'
  }, {}, function(err) {
    if(err) {
      return res.sendStatus(500);
    }

    return res.sendStatus(200);
  })
})

router.put('/edit-family', function(req, res) {
  console.log(req.body);

  families.update({
    _id: req.body._id
  }, {
    name: req.body.name,
    email: req.body.email,
    tel_no_1: req.body.telephone1,
    tel_no_2: req.body.telephone2
  }, {}, function(err){
    if(err) {
      return res.sendStatus(500);
    }

    return res.sendStatus(200);
  })
})

module.exports = router;

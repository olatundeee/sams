var express = require('express');
var router = express.Router();
var Datastore = require('nedb');
var path = require('path');
var users = new Datastore({ filename: path.join(__dirname, 'bin/users.db'), autoload: true });
var families = new Datastore({ filename: path.join(__dirname, 'bin/families.db'), autoload: true });
var members = new Datastore({ filename: path.join(__dirname, 'bin/members.db'), autoload: true });
var students = new Datastore({ filename: path.join(__dirname, 'bin/students.db'), autoload: true });
var studentsDailyStatus = new Datastore({ filename: path.join(__dirname, 'bin/students-daily-status.db'), autoload: true });
var session = new Datastore({ filename: path.join(__dirname, 'bin/session.db'), autoload: true });
var studentClass = new Datastore({ filename: path.join(__dirname, 'bin/class.db'), autoload: true });
var assignedTeacher = new Datastore({ filename: path.join(__dirname, 'bin/assigned-teacher.db'), autoload: true });
var recentActivity = new Datastore({ filename: path.join(__dirname, 'bin/recent-activity.db'), autoload: true });
var multer = require('multer');
var uploadDir = './uploads';
var upload = multer({dest: uploadDir}).single('photo');
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
    role: 'User',
    assigned: 'false'
  }, function(err, user) {

        if(err) {
          return res.status(500).send('Problem during registration');
        }
    
        /**
        var token = jwt.sign({ id: user._id }, config.secret, {
          expiresIn: 86400
        });
        */
        res.status(200).json({ 
          auth: true,
          userId: user._id
        });
      })
    })

router.get('/users', function(req, res) {
  users.find({
    role: 'User'
  }, {password: 0}, function(err, users) {
    res.json(users)
  })
})

router.get('/admin', function(req, res) {
  users.find({
    role: 'administrator'
  }, {password: 0}, function(err, users) {
    res.json(users)
  })
})

router.post('/addadmin', function(req, res) {
  console.log(req.body);

  users.update({
    _id: req.body.userId
  }, {
    $set: {
      role: 'administrator'
    }
  }, function(err) {
    if(err) {
      return res.sendStatus(500);
    }

    res.sendStatus(200);
  })
})

router.post('/removeadmin', function(req, res) {
  console.log(req.body);

  users.update({
    _id: req.body.userId
  }, {
    $set: {
      role: 'User'
    }
  }, function(err) {
    if(err) {
      return res.sendStatus(500);
    }

    res.sendStatus(200);
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
      token: token,
      user: user
    });
  })
})

router.post('/getclassname', function(req, res) {
  console.log(req.body);

  users.find({
    _id: req.body.userId
  }, function(err, user) {
    studentClass.find({
      _id: user[0].classId
    }, function(err, oneclass) {
      if(err) {
        return res.sendStatus(500);
      }

      res.json(oneclass);
    })
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
  members.find({
    role: 'Student'
  }, function(err, students) {
    res.json(students)
  })
});

router.get('/students-to-assign', function(req, res) {
  members.find({
    role: 'Student',
    assigned: 'false'
  }, function(err, students) {
    res.send(students);
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


router.get('/:name/:familyId', function(req, res){
  console.log(req.params.name, req.params.familyId)

  members.find({
    family: req.params.name,
    familyId: req.params.familyId
  }, function(err, user) {
    if(err) {
      return res.sendStatus(500)
    }

    res.json(user);
  })
})

router.put('/members', function(req, res) {
  console.log(req.body);


  var family = req.body.family;
  var familyId = req.body.familyId;
  var name = req.body.name;
  var role = req.body.role;
  var email = req.body.email;
  var address = req.body.address;
  var telno = req.body.telno;
  var image = req.body.image;
  var dateofbirth = req.body.dateofbirth;
  var bloodgroup = req.body.bloodgroup;
  var genotype = req.body.genotype;
  var allergies= req.body.allergies;

  members.insert({
    family: family,
      familyId: familyId,
      name: name,
      role: role,
      email: email,
      address: address,
      tel_no: telno,
      assigned: 'false',
      className: '',
      classId: '',
      dateofbirth,
      bloodgroup,
      genotype,
      allergies
  }, function(err, member) {
    if(err) {
      return res.sendStatus(500);
    }

    res.json(member);
    /*upload(req, res, function(err) {
      if (err) {
        // An error occurred when uploading
        console.log(err);
        return res.status(422).send("an Error occured")
      }  
     // No error occured.
      path = req.file.path;
      return res.send("Upload Completed for "+path);
    })*/
  })



})

router.put('/edit-members', function(req, res) {
  console.log(req.body);

  members.update({
    name: req.body.membername,
    family: req.body.family,
    familyId: req.body._id,
  }, {
    family: req.body.family,
    familyId: req.body._id,
    name: req.body.name,
    role: req.body.role,
    email: req.body.email,
    address: req.body.address,
    tel_no: req.body.telno,
    assigned: req.body.assigned,
    className: req.body.className,
    classId: req.body.classId
  }, function(err) {
    if(err) {
      return res.sendStatus(500);
    }

    res.sendStatus(200);
  })
})

router.post('/delete-family', function(req, res) {
  console.log(req.body.familyId);

  families.remove({
    _id: req.body.familyId
  }, function(err) {
    members.remove({
      familyId: req.body.familyId
    }, function(err) {
      if(err) {
        return res.sendStatus(500);
      }

      res.sendStatus(200);
    })
  })
})

router.get('/:family/:name/:familyName', function(req, res, next) {
  console.log(req.params.family, req.params.name, req.params.familyName)

  members.remove({
    familyId: req.params.family,
    name: req.params.name,
    family: req.params.familyName
  }, function(err) {
    if(err) {
      return res.sendStatus(500)
    }

    res.sendStatus(200);
  })
})

router.delete('/user/:id', function(req, res) {
  users.find({
    _id: req.params.id
  }, function(err, user) {
    studentClass.update({
      teacher: req.params.id,
      teachersName: user.username
    }, {
      $unset: {
        teacher: req.params.id,
        teachersName: user.username
      }
    } ,function(err) {
      users.remove({
        _id: req.params.id
      }, function(err) {
        if(err) {
          return res.sendStatus(500)
        }

        res.sendStatus(200);
      })
    })
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

router.post('/new-session', function(req, res) {
  console.log(req.body);

  session.insert({
    year: req.body.year,
    status: req.body.status
  }, function(err, session) {
    if(err) {
      return res.sendStatus(500);
    }

    return res.sendStatus(200);
  })
})

router.get('/session', function(req, res) {
  session.find(req.query, function(err, session) {
    if(err) {
      return res.sendStatus(500);
    }

    return res.json(session);
  })
})

router.get('/teachers', function(req, res) {
  users.find({
    role: 'User',
    assigned: 'false'
  }, {
    password: 0
  }, function(err, user) {
    res.json(user);
  })
})

router.post('/newclass', function(req, res) {
  console.log(req.body);
  studentClass.insert({
    name: req.body.name,
    sessionId: req.body.sessionId
  }, function(err, Class) {
    if(err) {
      return res.sendStatus(500)
    }

    res.json(Class);
  })
})

router.post('/new', function(req, res) {
  console.log(req.body.id);

  studentClass.find({
    sessionId: req.body.id
  }, function(err, allclass) {
    if(err) {
      return res.sendStatus(500);
    }

    res.json(allclass);
  })
})

router.put('/teacher', function(req, res) {
  console.log(req.body.userId, req.body.year, req.body.classId);

  users.find({
    _id: req.body.userId
  }, function(err, user) {
    users.update({
      _id: req.body.userId
    }, {
        $set: {
          username: user[0].username,
          fullname: user[0].fullname,
          password: user[0].password,
          role: user[0].role,
          assigned: 'true',
          session: req.body.year,
          classId: req.body.classId
        }
    }, {
      upsert: true
    }, function(err, user) {
      if(err) {
        console.log('Error:', err);
        return res.sendStatus(500);
      }
  
      res.json(user);
    })
  })
});

router.post('/oneteacher', function(req, res) {
  console.log(req.body);

  users.find({
    classId: req.body.classId,
    assigned: 'true'
  }, function(err, user) {
    if(err) {
      return res.sendStatus(500)
    }

    res.send(user);
  })
})

router.post('/removeteacher', function(req, res) {
  console.log(req.body.classId);

  users.find({
    classId: req.body.classId
  }, function(err, user) {
    users.update({
      classId: req.body.classId
    }, {
      username: user[0].username,
      password: user[0].password,
      role: user[0].role,
      assigned: 'false',
      session: '',
      classId: ''
    }, function(err) {
      if (err) {
        return res.sendStatus(500)
      }

      res.sendStatus(200);
    })
  })
})

router.put('/assign-student', function(req, res) {
  console.log(req.body.student, req.body.className, req.body.classId);

  members.update({
    name: req.body.student.name,
    family: req.body.student.family,
    familyId: req.body.student.familyId,
  }, {
    family: req.body.student.family,
    familyId: req.body.student.familyId,
    name: req.body.student.name,
    role: req.body.student.role,
    email: req.body.student.email,
    address: req.body.student.address,
    tel_no: req.body.student.telno,
    assigned: 'true',
    className: req.body.className,
    classId: req.body.classId
  }, function(err) {
    if(err) {
      return res.sendStatus(500);
    }

    res.sendStatus(200);
  })
})


router.post('/student-by-class', function(req, res) {
  console.log(req.body.classname, req.body.classId)

  members.find({
    className: req.body.classname,
    classId: req.body.classId,
    assigned: 'true'
  }, function(err, students) {
    if(err) {
      return res.sendStatus(500)
    }

    res.json(students);
  })
})

router.post('/remove-from-class', function(req, res) {
  console.log(req.body.student);

  members.update({
    family: req.body.student.family,
    familyId: req.body.student.familyId,
    name: req.body.student.name,
    className: req.body.student.className,
    classId: req.body.student.classId,
    assigned: 'true'
  }, {
      family: req.body.student.family,
      familyId: req.body.student.familyId,
      name: req.body.student.name,
      role: req.body.student.role,
      email: req.body.student.email,
      address: req.body.student.address,
      className: '',
      classId: '',
      assigned: 'false'
  }, function(err, student) {
    if(err) {
      return res.sendStatus(500)
    }

    res.sendStatus(200);
  })
})

router.post('/remove-class', function(req, res) {
  console.log(req.body.oneclass);

  studentClass.remove({
    _id: req.body.oneclass._id,
    name: req.body.oneclass.name
  }, function(err) {
    users.find({
      classId: req.body.oneclass._id
    }, function(err, user) {
      users.update({
        _id: user[0]._id
      }, {
          username: user[0].username,
          password: user[0].password,
          role: user[0].role,
          assigned: 'false',
          session: '',
          classId: ''
      }, {
        upsert: true
      }, function(err, user) {
        members.find({
          classId: req.body.oneclass._id
        }, function(err, member) {
          members.update({
            classId: req.body.oneclass._id
          }, {
              $set:
              {
                assigned: 'false',
                className: '',
                classId: ''
              }
          }, function(err) {
            if(err) {
              return res.sendStatus(500);
            }

            res.sendStatus(200);
          })
        })
      })
    })
  })
})

router.post('/add-teacher-profile', function(req, res) {
  console.log(req.body);

  users.update({
    _id: req.body.userId
  }, {
    $set: {
      fullname: req.body.teacher.name,
      email: req.body.teacher.email,
      telephone1: req.body.teacher.telephone1,
      telephone2: req.body.teacher.telephone2
    }
  }, {
    upsert: true
  }, function(err, user) {
    if(err) {
      res.sendStatus(500);
    }

    res.sendStatus(200);
  })
})

router.post('/get-teacher-details', function(req, res){
  console.log(req.body);

  users.find({
    _id: req.body.userId
  }, function(err, user) {
    if(err) {
      return res.sendStatus(500);
    }

    res.json(user);
  })
})

router.post('/get-teacher-class', function(req, res) {
  console.log(req.body);

  users.find({
    _id: req.body.userId
  }, function(err, user) {
    console.log(user);

    members.find({
      classId: user[0].classId
    }, function(err, user) {
      if (err) {
        return res.sendStatus(500);
      }

      res.json(user)
    })
  })
})

router.post('/update-daily-status', function(req, res) {
  console.log(req.body);

  if (req.body.dropoffstatus === 'Dropped Off' && req.body.pickupstatus === null) {
    studentsDailyStatus.find({
      dropoffstatus: req.body.dropoffstatus,
      currentDate: req.body.currentDate,
      family: req.body.family,
      familyId: req.body.familyId,
      studentName: req.body.studentName,
      studentId: req.body.studentId
    }, function(err, studentStatus) {
      if (err) {
        console.log(err);
      }
  
      if (studentStatus.length === 0) {
        users.findOne({
          _id: req.body.userId
        }, function(err, user) {
          var teacherName = user.fullname
          console.log(user)
  
          studentClass.findOne({
            _id: user.classId
          }, function(err, oneclass) {
            console.log(oneclass)
            var className = oneclass.name
  
            console.log(req.body, teacherName, className)
              studentsDailyStatus.insert({
                dropoffstatus: req.body.dropoffstatus,
                pickupstatus: req.body.pickupstatus,
                currentDate: req.body.currentDate,
                dropofftime: req.body.currentTime,
                family: req.body.family,
                familyId: req.body.familyId,
                studentName: req.body.studentName,studentId: req.body.studentId,
                teacherId: req.body.userId,
                teacherName: teacherName,
                className: className,
                dropofffamilyMember:{
                  familyMemberName: req.body.familyMemberName,familyMemberId: req.body.familyMemberId,familyMemberRole: req.body.familyMemberRole
                }
              }, function (err) {
                if(err) {
                  return res.sendStatus(500);
                }
  
                var studentStatusMessage = 'Registration Successful'
                
                res.json(studentStatusMessage);
              })
          })
        })
      }
  
      if(studentStatus.length > 0) {
      console.log(studentStatus)
  
      var statusToLowerCase = studentStatus[0].status.toLowerCase();
  
      var studentStatusMessage = `${studentStatus[0].studentName} already registered as ${statusToLowerCase} for today`;
  
      return res.json(studentStatusMessage);
      }
    })
  } else {
    if (req.body.pickupstatus === 'Picked Up' && req.body.dropoffstatus === null) {
      studentsDailyStatus.find({
        pickupstatus: req.body.pickupstatus,
        currentDate: req.body.currentDate,
        family: req.body.family,
        familyId: req.body.familyId,
        studentName: req.body.studentName,
        studentId: req.body.studentId
      }, function(err, studentStatus) {
        if (err) {
          console.log(err);
        }
    
        if (studentStatus.length === 0) {
          users.findOne({
            _id: req.body.userId
          }, function(err, user) {
            var teacherName = user.fullname
            console.log(user)
    
            studentClass.findOne({
              _id: user.classId
            }, function(err, oneclass) {
              console.log(oneclass)
              var className = oneclass.name
    
              console.log(req.body, teacherName, className)
                studentsDailyStatus.update({
                  dropoffstatus: 'Dropped Off',
                  currentDate: req.body.currentDate,
                  studentId: req.body.studentId,
                  className: className,
                  teacherId: req.body.userId
                }, {
                  $set: {
                    pickupstatus: req.body.pickupstatus,
                    pickuptime: req.body.currentTime,
                    pickupfamilyMember: {
                      familyMemberName: req.body.familyMemberName,
                      familyMemberId: req.body.familyMemberId,
                      familyMemberRole: req.body.familyMemberRole
                    }
                  }
                }, function (err, student) {
                  if(err) {
                    return res.sendStatus(500);
                  }
    
                  var studentStatusMessage = 'Registration Successful'
                  
                  res.json(studentStatusMessage);
                })
            })
          })
        }
    
        if(studentStatus.length > 0) {
        console.log(studentStatus)
    
        var statusToLowerCase = studentStatus[0].status.toLowerCase();
    
        var studentStatusMessage = `${studentStatus[0].studentName} already registered as ${statusToLowerCase} for today`;
    
        return res.json(studentStatusMessage);
        }
      })
    }
  }
})

router.post('/students-in-class', function(req, res) {
  console.log(req.body)

  studentsDailyStatus.find({
    dropoffstatus: req.body.status,
    currentDate: req.body.currentDateString,
    teacherId: req.body.userId
  }, function(err, students){
    if(err) {
      return res.sendStatus(500);
    }

    res.json(students);
  })
})

router.post('/recent-activities', function(req, res) {
  recentActivity.find({
    currentDate: req.body.currentDateString,
    className: req.body.className
  }).limit(5).exec( function(err, studentsStatus) {
    if (err) {
      return res.sendStatus(500);
    }

    res.json(studentsStatus);
  })
})

router.post('/recent-drop-off', function(req, res) {
  console.log(req.body);

  recentActivity.find({
    currentDate: req.body.currentDateString
  }).limit(5).exec(function(err, studentsStatus) {
    if (err) {
      return res.sendStatus(500);
    }

    res.json(studentsStatus);
  });
})

router.get('/total-recent-activity', function(req, res) {
  console.log(req.body)
  studentsDailyStatus.find({}, function(err, studentsStatus) {
    if (err) {
      return res.sendStatus(500);
    }

    res.json(studentsStatus);
  });
})

router.get('/all-reports', function(req, res) {
  studentsDailyStatus.find({}, function(err, studentsStatus) {
    if (err) {
      return res.sendStatus(500);
    }

    res.json(studentsStatus);
  })
})

router.post('/update-recent-activity', function(req, res) {
  console.log(req.body);

  if (req.body.pickupstatus === 'Picked Up' && req.body.dropoffstatus === null) {
    var status = 'Picked Up'
  } else {
    if (req.body.pickupstatus === null && req.body.dropoffstatus === 'Dropped Off') {
      var status = 'Dropped Off'
    }
  }

  recentActivity.insert({
    status: status,
    currentDate: req.body.currentDate,
    currentTime: req.body.currentTime,
    family: req.body.family,
    familyId: req.body.familyId,
    studentName: req.body.studentName,
    studentId: req.body.studentId,
    familyMember: {
      familyMemberName: req.body.familyMemberName,
      familyMemberId: req.body.familyMemberId,
      familyMemberRole: req.body.familyMemberRole
    },
    teacherId: req.body.userId,
    className: req.body.className
  })
})

module.exports = router;

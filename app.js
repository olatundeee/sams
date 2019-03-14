var createError = require('http-errors');
var express = require('express');
var router = express.Router();
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors')
var Datastore = require('nedb');
var users = new Datastore({ filename: '../bin/users', autoload: true })



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.post('/register', usersRouter);
app.post('/families', usersRouter);
app.get('/users', usersRouter);
app.get('/admin', usersRouter);
app.get('/user/:id', usersRouter);
app.post('/login', usersRouter);
app.get('/logout', usersRouter);
app.get('/families', usersRouter);
app.get('/students', usersRouter);
app.get('/students-to-assign', usersRouter);
app.get('/:name/:familyId', usersRouter);
app.put('/members', usersRouter);
app.put('/edit-members', usersRouter);
app.post('/delete-family', usersRouter);
app.get('/:family/:name/:familyName', usersRouter);
app.delete('/user/:id', usersRouter);
app.put('/edit-users', usersRouter);
app.put('/edit-family', usersRouter);
app.post('/new-session', usersRouter);
app.get('/session', usersRouter);
app.get('/teachers', usersRouter);
app.post('/new', usersRouter);
app.post('/newclass', usersRouter);
app.put('/teacher', usersRouter);
app.post('/oneteacher', usersRouter);
app.post('/removeteacher', usersRouter);
app.put('/assign-student', usersRouter);
app.post('/student-by-class', usersRouter);
app.post('/remove-from-class', usersRouter);
app.post('/remove-class', usersRouter);
app.post('/addadmin', usersRouter);
app.post('/removeadmin', usersRouter);
app.post('/getclassname', usersRouter);
app.post('/add-teacher-profile', usersRouter);
app.post('/get-teacher-details', usersRouter);
app.post('/get-teacher-class', usersRouter);
app.post('/update-daily-status', usersRouter);
app.post('/students-in-class', usersRouter);
app.post('/recent-activities', usersRouter);
app.post('/recent-drop-off', usersRouter);
app.get('/total-recent-activity', usersRouter);
app.get('/all-reports', usersRouter);
app.post('/update-recent-activity', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

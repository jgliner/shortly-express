var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var extAppFn = require('./app/appHelpers');

var app = express();

var loggedIn = false;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/', 
function(req, res) {
  if (loggedIn) {
    res.render('index', {loggedIn: loggedIn});
  } 
  else {
    loggedIn = false;
    res.render('login', {loggedIn: loggedIn});
  }
});

app.get('/create', 
function(req, res) {
  if (loggedIn) {
    res.render('index', {loggedIn: loggedIn});
  }
  else {
    loggedIn = false;
    res.render('login', {loggedIn: loggedIn});
  }
});

app.get('/signup', 
function(req, res) {
  loggedIn = false;
  res.render('signup', {loggedIn: loggedIn});
});

app.get('/login', 
function(req, res) {
  loggedIn = false;
  res.render('login', {loggedIn: loggedIn});
});

app.get('/links',
function(req, res) {
  if (loggedIn) {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  }
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  extAppFn.encrypt(username, password, function(username, salt, hash) {
    salt = salt.slice(7);
    hash = hash.slice(29);
    var dbObj = {username: username, password: hash, salt: salt};
    db.tableInsert(dbObj, function(result) {
      if (result) {
        loggedIn = true;
      }
      else {
        loggedIn = false;
      }
    });
    res.redirect('/');
  });
});

app.post('/login', function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  db.tableRead(username, function(userData) {
    extAppFn.auth(username, password, userData, function(hash, saltyHash) {
      if (hash === saltyHash) {
        loggedIn = username;
        console.log(username, 'Logged In!');
        res.redirect('/');
      }
      else {
        loggedIn = false;
        res.redirect('/login');
      }
    });
  });
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);

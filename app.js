
var path = require('path');
var express = require('express');
var helpers = require('./helpers');
var routes = require('./routes');
var settings = require('./settings');
var app = module.exports = express.createServer();

app.configure(function() {
  app.set('port', 3000);
  app.set('view engine', 'ejs');
  app.set('view options', {
    layout: true,
    settings: settings,
    status: 200,
    username: '',
    page: ''
  });
  app.set('views', settings.TEMPLATE_DIR);
  app.use(express.logger({format:':method :url'}));
  app.use(express.bodyParser());
  app.use(function(req, res, next) {
    if (!path.extname(req.url))
      res.contentType('xhtml');
    next();
  });
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

app.configure('development', function() {
  app.set('port', 8080);
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(app.router);
  app.use(express.static(settings.STATIC_DIR));
});

app.helpers({
  get_title: helpers.get_title
});

routes.forEach(function(route) {
  var path = route[0];
  var callback = route[1];
  app.get(path, callback);
  app.post(path, callback);
});

if (!module.parent)
  app.listen(app.settings.port);

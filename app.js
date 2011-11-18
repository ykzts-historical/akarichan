
var express = require('express');
var routes = require('./routes');
var settings = require('./settings');
var app = module.exports = express.createServer();

app.configure(function() {
  app.set('port', 3000);
  app.set('view engine', 'ejs');
  app.set('view options', {layout: false});
  app.set('views', settings.TEMPLATE_DIR);
  app.use(app.router);
  app.use(express.static(settings.STATIC_DIR));
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
});

routes.forEach(function(route) {
  var path = route[0];
  var callback = route[1];
  app.get(path, callback);
  app.post(path, callback);
});

if (!module.parent)
  app.listen(app.settings.port);

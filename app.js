
var express = require('express');
var routes = require('./routes');
var settings = require('./settings');

var port = process.env.PORT || 3000;
var app = express.createServer();
app.configure(function() {
  app.use(app.router);
  app.set('view engine', 'ejs');
  app.set('view options', {layout: false});
  app.set('views', settings.TEMPLATE_DIR);
});

app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(express.static(settings.STATIC_DIR));
});

app.configure('production', function() {
  app.use(express.errorHandler());
  app.use(express.static(settings.STATIC_DIR));
});

for (var path in routes) {
  var callback = routes[path];
  app.get(path, callback);
}

app.listen(port);

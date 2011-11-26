
var path = require('path');
var express = require('express');
var RedisStore = require('connect-redis')(express);
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
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: 'secret keys',
    store: new RedisStore()
  }));
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
  app.use(express.logger({format:':method :url'}));
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(app.router);
  app.use(express.static(settings.STATIC_DIR));
});

app.helpers(helpers);

routes.forEach(function(route) {
  var _path = route[0];
  var callback = route[1];
  app.get(_path, callback);
  app.post(_path, callback);
});

if (require.main === module)
  app.listen(app.settings.port);

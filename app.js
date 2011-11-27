
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
});

app.configure('production', function() {
  app.use(express.errorHandler());
    app.use(express.session({
    secret: 'secret keys',
    store: new RedisStore(),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000
    }
  }));
  app.use(function(req, res, next) {
    res.contentType('xhtml');
    next();
  });
});

app.configure('development', function() {
  app.set('port', 8080);
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(express.logger({format:':method :url'}));
  app.use(express.favicon());
  app.use(express.static(settings.STATIC_DIR));
  app.use(express.session({
    secret: 'secret keys'
  }));
  app.use(function(req, res, next) {
    if (!res.getHeader('content-type'))
      res.contentType('xhtml');
    next();
  });
});

app.configure('production', 'development', function() {
  app.use(app.router);
});

app.helpers(helpers);

routes.forEach(function(route) {
  var path = route[0];
  var callback = route[1];
  app.get(path, callback);
  app.post(path, callback);
});

if (require.main === module)
  app.listen(app.settings.port);

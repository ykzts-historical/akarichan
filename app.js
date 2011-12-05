
const express = require('express');
const RedisStore = require('connect-redis')(express);
const helpers = require('./helpers');
const routes = require('./routes');
const settings = require('./settings');

var app = module.exports = express.createServer();

app.configure(function() {
  app.set('port', settings.PORT);
  app.set('view engine', 'ejs');
  app.set('view options', {
    layout: true,
    settings: settings,
    status: 200,
    username: '',
    page: ''
  });
  app.set('views', settings.TEMPLATE_DIR);
  app.set('strict routing', true);
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
  app.use(express.csrf());
  app.use(app.router);
});

app.helpers(helpers);
app.dynamicHelpers({
  session: function(req, res) {
    return req.session;
  }
});

routes.forEach(function(route) {
  var methods = Array.isArray(route[0]) ?
    route[0]: [route[0]];
  var path = route[1];
  var callback = route[2];
  methods.forEach(function(method) {
    app[method.toLowerCase()](path, callback);
  });
});

if (require.main === module)
  app.listen(app.settings.port);

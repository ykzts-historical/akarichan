
var url = require('url');
var tumblr = require('../lib/tumblr');
var settings = require('../settings');

exports.index = function(req, res) {
  var session = req.session;
  var id = req.params.id;
  var reblog_key = req.query.reblog_key;
  var options = {
    protocol: 'reblog:',
    consumer_key: settings.TUMBLR.CONSUMER_KEY,
    secret_key: settings.TUMBLR.SECRET_KEY,
    id: id,
    reblog_key: reblog_key
  };

  if (!(session.oauth && session.userinfo)) {
    res.redirect('/_oauth/signin?back=' + encodeURIComponent(req.url));
    return;
  };

  ['access_token', 'access_token_secret'].forEach(function(key) {
    options[key] = session.oauth[key];
  });
  options.hostname = (function(blogs) {
    var len = blogs.length;
    return url.parse(blogs[len-1].url).hostname;
  })(session.userinfo.user.blogs);

  tumblr.request(options, function(tum) {
    tum.on('data', function(data) {
      res.json(data);
    }).on('error', function(error) {
      res.json(error);
    });
  }).end();
};

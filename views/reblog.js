
const url = require('url');
const tumblr = require('../lib/tumblr');
const settings = require('../settings');

exports.index = function(req, res) {
  var session = req.session;
  var id = req.params.id;
  var reblog_key = req.body.reblog_key;
  var options = {
    protocol: 'reblog:',
    consumer_key: settings.TUMBLR.CONSUMER_KEY,
    secret_key: settings.TUMBLR.SECRET_KEY,
    id: id,
    reblog_key: reblog_key
  };

  if (!(session.oauth && session.user)) {
    res.redirect('/_oauth/signin?back=' + encodeURIComponent(req.url));
    return;
  };

  ['access_token', 'access_token_secret'].forEach(function(key) {
    options[key] = session.oauth[key];
  });
  options.hostname = url.parse(req.session.blog_url).hostname;

  tumblr.request(options, function(tum) {
    tum.on('data', function(data) {
      res.json(data);
    }).on('error', function(error) {
      res.json(error);
    });
  }).end();
};

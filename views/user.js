
var tumblr = require('../lib/tumblr');
var utils = require('../lib/utils');
var settings = require('../settings');
var views = require('./index');

exports.index = function(req, res) {
  var oauth = req.session.oauth || {};
  var username = req.params.username || false;
  var hostname = req.params.hostname || false;
  var page = (req.query.page || 1) * 1;

  var options = {
    consumer_key: settings.TUMBLR.CONSUMER_KEY,
    secret_key: settings.TUMBLR.SECRET_KEY,
    type: 'photo',
    limit: 20,
    page: page
  };

  if (hostname) {
    options.hostname = hostname;
  } else {
    options.username = username;
  }

  if (username === '_dashboard') {
    if (oauth.access_token && oauth.access_token_secret) {
      options.access_token = oauth.access_token;
      options.access_token_secret = oauth.access_token_secret;
    } else {
      res.redirect('/_oauth/signin');
      return;
    }
  }

  tumblr.request(options, function(tum) {
    tum.on('data', function(data) {
      var posts = data.response.posts || [];
      var sections = posts.map(utils.section_simplify);
      if (!sections.length) {
        tum.emit('error');
        return;
      }
      res.render('user', {
        username: username || hostname,
        page: page,
        sections: sections
      });
    }).on('error', function(e) {
      views.http404(req, res);
    });
  }).end();
};

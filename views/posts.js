
const tumblr = require('../lib/tumblr');
const utils = require('../lib/utils');
const settings = require('../settings');
const views = require('./index');

exports.index = function(req, res) {
  var session = req.session;
  var oauth = session.oauth || {};
  var blog_url = req.session.blog_url || null;
  var username = req.params.username || false;
  var hostname = req.params.hostname || false;
  var page = (req.query.page || 1) * 1;

  var options = {
    protocol: 'posts:',
    consumer_key: settings.TUMBLR.CONSUMER_KEY,
    secret_key: settings.TUMBLR.SECRET_KEY,
    type: 'photo',
    limit: 20,
    page: page
  };

  if (hostname) {
    options.hostname = hostname;
  } else if (username === '_dashboard') {
    if (oauth.access_token && oauth.access_token_secret) {
      options.protocol = 'dashboard:';
      options.access_token = oauth.access_token;
      options.access_token_secret = oauth.access_token_secret;
    } else {
      res.redirect('/_oauth/signin?back=' + encodeURIComponent(req.url));
      return;
    }
  } else if (username.indexOf('.') < 0) {
    options.hostname = username + '.tumblr.com';
  }

  tumblr.request(options, function(tum) {
    tum.on('data', function(data) {
      var posts = data.response.posts || [];
      var articles = posts.map(utils.post_simplify, {blog_url: blog_url});
      if (!articles.length) {
        tum.emit('error');
        return;
      }
      res.render('posts', {
        username: username || hostname,
        page: page,
        articles: articles
      });
    }).on('error', function(e) {
      views.http404(req, res);
    });
  }).end();
};

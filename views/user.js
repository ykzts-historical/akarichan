
var Tumblr = require('../lib/tumblr');
var utils = require('../lib/utils');
var settings = require('../settings');
var views = require('./index');

var tum = exports.tum = new Tumblr(
  settings.TUMBLR.API_KEY, settings.TUMBLR.API_SECRET_KEY);

exports.index = function(req, res) {
  var session = req.session;
  var username = req.params.username;
  var format = req.params.format || 'html';
  var page = (req.query.page || 1) * 1;

  if (username === '_dashboard') {
    if (!session.oauth) {
      res.redirect('/_oauth/signin');
      return;
    }
    tum.dashboard = true;
    tum.access_token = session.oauth.access_token;
    tum.access_token_secret = session.oauth.access_token_secret;
  } else {
    tum.hostname = username;
    if (username.indexOf('.') < 0)
      tum.hostname += '.tumblr.com';
  }
  tum.limit = 20;
  tum.type = 'photo';
  tum.page = page;

  tum.on('data', function(data) {
    var posts = data.response.posts || [];
    var sections = posts.map(function(post, num) {
      var section = utils.section_simplify(post);
      section.num = num + 1;
      return section;
    });
    if (!sections.length) {
      views.http404(req, res);
      return;
    }
    res.render('user', {
      username: username,
      page: page,
      sections: sections
    });
  }).on('error', function(err) {
    views.http404(req, res);
  }).end();
};

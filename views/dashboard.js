
var url = require('url');
var views = require('./index');
var oa = require('./oauth').oa;
var utils = require('../lib/utils');

var LIMIT = 20;

module.exports = function(req, res) {
  var page = req.query.page || 1;
  var oauth = req.session.oauth;
  if (!(oa && oauth)) {
    res.redirect('/_oauth/signin');
    return;
  }
  var access_token = oauth.access_token;
  var access_token_secret = oauth.access_token_secret;
  var uri = url.format({
    protocol: 'http',
    hostname: 'api.tumblr.com',
    pathname: '/v2/user/dashboard',
    query: {
      limit: LIMIT,
      offset: LIMIT * (page - 1),
      type: 'photo'
    }
  });
  oa.get(uri, access_token, access_token_secret,
    function(err, data) {
      var posts = JSON.parse(data).response.posts || [];
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
        username: '_dashboard',
        page: page,
        sections: sections
      });
    }
  );
};

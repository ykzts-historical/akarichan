
var views = require('../views');

module.exports = [
  ['/', views.index],
  ['/_redirector', function(req, res) {
    var username = req.query.tumblr_username;
    res.redirect('/' + username);
  }],
  ['/_oauth/:action(sign(in|out))', views.oauth.login],
  ['/_reblog/:id(\\d+)', views.reblog],
  ['/(:username([^_][^/.]+|_dashboard)|/:hostname([^_][^/]+))', views.posts]
];


var views = require('../views');

module.exports = [
  ['GET', '/', views.index],
  ['GET', '/_redirector', function(req, res) {
    var username = req.query.tumblr_username;
    res.redirect('/' + username);
  }],
  ['GET', '/_oauth/:action(sign(in|out))', views.oauth.login],
  [['GET', 'POST'], '/_settings', views.settings],
  [['GET', 'POST'], '/_reblog/:id(\\d+)', views.reblog],
  ['GET', '/(:username([^_][^/.]+|_dashboard)|/:hostname([^_][^/]+))', views.posts]
];

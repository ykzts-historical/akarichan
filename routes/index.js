
var views = require('../views');

module.exports = [
  ['/', views.index],
  ['/post-method', function(req, res) {
    var username = req.body.tumblr_username;
    res.redirect('/' + username);
  }],
  ['/_oauth/:action(sign(in|out))', views.oauth.login],
  ['/:username([^_][^\/\.]+|_dashboard)', views.user],
  ['/:hostname([^_][^\/]+)', views.user]
];

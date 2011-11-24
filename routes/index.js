
var views = require('../views');

module.exports = [
  ['/', views.index],
  ['/post-method', function(req, res) {
    var username = req.body.tumblr_username;
    res.redirect('/' + username);
  }],
  ['/_oauth/sign(in|out)', views.oauth.login],
  ['/_dashboard', views.dashboard],
  ['/:username', views.user]
];

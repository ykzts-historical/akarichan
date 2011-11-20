
var views = require('./views');

module.exports = [
  ['/', views.index],
  ['/post-method', function(req, res) {
    var username = req.body.tumblr_username;
    res.redirect('/' + username);
  }],
  ['/:username', views.user]
];

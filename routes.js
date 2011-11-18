
var views = require('./views');

module.exports = [
  ['/', views.index],
  ['/:username', views.user]
];

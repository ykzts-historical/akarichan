
var views = require('./views');

module.exports = {
  '/': views.index,
  '/:username.:format?': views.user
};

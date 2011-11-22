
var _ = (function() {
  try {
    return require('./TUMBLR_API_KEYS');
  } catch(e) {
    return {};
  }
})();

module.exports = {
  TITLE: 'tumblr photos viewer',
  TEMPLATE_DIR: __dirname + '/templates',
  STATIC_DIR: __dirname + '/public',
  TUMBLR: {
    API_HOST: 'api.tumblr.com',
    API_KEY: _.TUMBLR_API_KEY,
    API_SECRET_KEY: _.TUMBLR_API_SECRET_KEY
  }
};

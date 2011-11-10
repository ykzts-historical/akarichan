
var fs = require('fs');
var tumblr_api_keys = fs.readFileSync(__dirname + '/TUMBLR_API_KEYS').toString().split('\n');

module.exports = {
  TITLE: 'tumblr photos viewer',
  TEMPLATE_DIR: __dirname + '/templates',
  STATIC_DIR: __dirname + '/public',
  TUMBLR: {
    API_HOST: 'api.tumblr.com',
    API_KEY: tumblr_api_keys[0],
    API_SECRET_KEY: tumblr_api_keys[1]
  }
};

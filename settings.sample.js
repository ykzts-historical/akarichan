
module.exports = {
  TITLE: 'tumblr photos viewer',
  PORT: 8080,
  TEMPLATE_DIR: __dirname + '/templates',
  STATIC_URI: '',
  STATIC_DIR: __dirname + '/public',
  TUMBLR: {
    CONSUMER_KEY: process.env.TUMBLR_CONSUMER_KEY,
    SECRET_KEY: process.env.TUMBLR_SECRET_KEY
  }
};

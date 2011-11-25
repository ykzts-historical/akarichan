
module.exports = {
  TITLE: 'tumblr photos viewer',
  TEMPLATE_DIR: __dirname + '/templates',
  STATIC_DIR: __dirname + '/public',
  TUMBLR: {
    CONSUMER_KEY: process.env.TUMBLR_CONSUMER_KEY,
    SECRET_KEY: process.env.TUMBLR_SECRET_KEY
  }
};

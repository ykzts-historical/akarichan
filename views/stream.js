
const tumblr = require('../lib/tumblr');
const utils = require('../lib/utils');
const settings = require('../settings');
const views = require('./index');

exports.index = function(req, res) {
  var session = req.session;
  var oauth = session.oauth || {};
  var blog_url = req.session.blog_url || null;
  var since_id = req.query.since_id || 0;
  var options = {
    protocol: 'dashboard:',
    consumer_key: settings.TUMBLR.CONSUMER_KEY,
    secret_key: settings.TUMBLR.SECRET_KEY,
    type: 'photo',
    since_id: since_id,
    access_token: oauth.access_token,
    access_token_secret: oauth.access_token_secret
  };
  if (!oauth.access_token) {
    views.http404(req, res);
    return;
  }
  res.setHeader('Content-type', 'text/event-stream');
  setInterval(function() {
    tumblr.request(options, function(tum) {
      tum.on('data', function(data) {
        var posts = data.response.posts || [];
        var articles = posts.map(utils.post_simplify, {blog_url: blog_url});
        //if (!articles.length) {
        //  return;
        //}
        //options.since_id = articles[0].id;
        var body = '';
        var values = {
          id: options.since_id,
          data: JSON.stringify(articles)
        };
        for (var key in values) {
          body += [key, values[key]].join(': ') + '\n';
        }
        res.write('\n' + body + '\n');
      });
    }).end();
  }, 60 * 1000);
};

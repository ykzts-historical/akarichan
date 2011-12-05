
const Tumblr = require('../lib/tumblr').Tumblr;
const settings = require('../settings');

exports.login = function(req, res) {
  var session = req.session;
  switch (req.params.action) {
    case 'signout':
      req.session.destroy(function(err) {
        res.redirect('/');
      });
      break;
    case 'signin':
      if (!session.oauth) {
        get_request_token(req, res);
      } else if (req.query.oauth_verifier) {
        get_access_token(req, res);
      } else {
        delete session.oauth;
        res.redirect('/');
      }
      break;
    default:
      res.redirect('/');
      break;
  }
};

function get_request_token(req, res) {
  var session = req.session;
  var back = req.query.back || '/';
  var tum = init_tumblr();
  tum.get_request_token(function(token, token_secret, authorize_uri) {
    session.oauth = {};
    session.oauth.back = back;
    session.oauth.token = token;
    session.oauth.token_secret = token_secret;
    res.redirect(authorize_uri);
  });
  return;
}

function get_access_token(req, res) {
  var session = req.session;
  var back = session.oauth.back;
  var tum = init_tumblr();
  var token = session.oauth.token;
  var token_secret = session.oauth.token_secret;
  var verifier = session.oauth.verifier = req.query.oauth_verifier;
  tum.get_access_token(token, token_secret, verifier,
    function(access_token, access_token_secret) {
      session.oauth.access_token = access_token;
      session.oauth.access_token_secret = access_token_secret;
      tum.get_userinfo(function(data) {
        var user = session.user = data.response.user;
        var blogs = user.blogs;
        session.blog_url = blogs[blogs.length-1].url;
        res.redirect(back);
      });
    }
  );
}

function init_tumblr() {
  return new Tumblr({
    consumer_key: settings.TUMBLR.CONSUMER_KEY,
    secret_key: settings.TUMBLR.SECRET_KEY
  });
}


var Tumblr = require('../lib/tumblr').Tumblr;
var settings = require('../settings');

exports.login = function(req, res) {
  var session = req.session;
  var tum = new Tumblr(settings.TUMBLR.CONSUMER_KEY, settings.TUMBLR.SECRET_KEY);
  if (!session.oauth) {
    tum.oauth_callback = 'http://desire.sh/_oauth/signin';
    tum.get_request_token(function(token, token_secret, authorize_uri) {
      session.oauth = {};
      session.oauth.token = token;
      session.oauth.token_secret = token_secret;
      res.redirect(authorize_uri);
    });
    return;
  }
  var token = session.oauth.token;
  var token_secret = session.oauth.token_secret;
  var verifier = session.oauth.verifier = req.query.oauth_verifier;
  tum.get_access_token(token, token_secret, verifier,
    function(access_token, access_token_secret) {
      session.oauth.access_token = access_token;
      session.oauth.access_token_secret = access_token_secret;
      tum.get_userinfo(function(data) {
        session.userinfo = data.response;
        res.redirect('/_dashboard');
      });
    }
  );
};

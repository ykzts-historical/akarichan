
var tumblr = require('../lib/tumblr');
var settings = require('../settings');

const TUMBLR_AUTHORIZE_URI = 'http://www.tumblr.com/oauth/authorize';

var oa = (new tumblr.Tumblr(
  settings.TUMBLR.CONSUMER_KEY,
  settings.TUMBLR.SECRET_KEY
)).oa;

exports.login = function(req, res) {
  var session = req.session;
  if (!session.oauth) {
    oa.getOAuthRequestToken(function(err, token, token_secret) {
      session.oauth = {};
      session.oauth.token = token;
      session.oauth.token_secret = token_secret;
      res.redirect(TUMBLR_AUTHORIZE_URI + '?oauth_token=' + token);
    });
    return;
  }
  var token = session.oauth.token;
  var token_secret = session.oauth.token_secret;
  var verifier = session.oauth.verifier = req.query.oauth_verifier;
  oa.getOAuthAccessToken(token, token_secret, verifier,
    function(err, access_token, access_token_secret) {
      session.oauth.access_token = access_token;
      session.oauth.access_token_secret = access_token_secret;
      oa.get('http://api.tumblr.com/v2/user/info', access_token, access_token_secret,
        function(err2, data) {
          req.session.user_info = JSON.parse(data).response.user;
          res.redirect('/_dashboard');
        }
      );
    }
  );
};

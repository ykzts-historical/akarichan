
var OAuth = require('oauth').OAuth;
var settings = require('../settings');

const TUMBLR_REQUEST_TOKEN_URI = 'http://www.tumblr.com/oauth/request_token';
const TUMBLR_ACCESS_TOKEN_URI = 'http://www.tumblr.com/oauth/access_token';
const TUMBLR_AUTHORIZE_URI = 'http://www.tumblr.com/oauth/authorize';

var oa = exports.oa = new OAuth(
  TUMBLR_REQUEST_TOKEN_URI,
  TUMBLR_ACCESS_TOKEN_URI,
  settings.TUMBLR.API_KEY,
  settings.TUMBLR.API_SECRET_KEY,
  '1.0',
  null,
  'HMAC-SHA1'
);

exports.login = function(req, res) {
  if (!req.session.oauth) {
    oa.getOAuthRequestToken(function(err, token, token_secret) {
      req.session.oa = oa;
      req.session.oauth = {
        token: token,
        token_secret: token_secret
      };
      res.redirect(TUMBLR_AUTHORIZE_URI + '?oauth_token=' + token);
    });
    return;
  }
  var token = req.session.oauth.token;
  var token_secret = req.session.oauth.token_secret;
  var verifier = req.session.oauth.verifier = req.query.oauth_verifier;
  oa.getOAuthAccessToken(token, token_secret, verifier,
    function(err, access_token, access_token_secret) {
      req.session.oauth.access_token = access_token;
      req.session.oauth.access_token_secret = access_token_secret;
      oa.get('http://api.tumblr.com/v2/user/info', access_token, access_token_secret,
        function(err2, data) {
          req.session.user_info = JSON.parse(data).response.user;
          res.redirect('/_dashboard');
        }
      );
    }
  );
};

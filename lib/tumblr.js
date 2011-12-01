(function() {
  var util = require('util');
  var url = require('url');
  var querystring = require('querystring');
  var http = require('http');
  var EventEmitter = require('events').EventEmitter;
  var OAuth = require('oauth').OAuth;

  const HOSTNAME = 'api.tumblr.com';
  const REQUEST_TOKEN_URI = 'http://www.tumblr.com/oauth/request_token';
  const ACCESS_TOKEN_URI = 'http://www.tumblr.com/oauth/access_token';
  const AUTHORIZE_URI = 'http://www.tumblr.com/oauth/authorize';

  function Tumblr(consumer_key, secret_key) {
    this.protocol = 'posts:';
    this.consumer_key = consumer_key;
    this.secret_key = secret_key;
    this.access_token = null;
    this.access_token_secret = null;
    this.oauth_callback = '';

    this.id = 0;
    this.hostname = '';
    this.page = 1;
    this.type = '';
    this.limit = 10;
    this.reblog_key = '';
  };

  util.inherits(Tumblr, EventEmitter);
  exports.Tumblr = Tumblr;

  (function($) {
    $.end = function() {
      var self = this;
      var callback = function(data) {
        self.emit('data', data);
      };
      if (this.protocol.slice(-1) !== ':')
        this.protocol += ':';
      switch (this.protocol) {
        case 'posts:':
          this.get_posts(callback);
          break;
        case 'dashboard:':
          this.get_dashboard(callback);
          break;
        case 'reblog:':
          this.reblog(callback);
          break;
      }
      return this;
    };

    $.reblog = function(callback) {
      var oa = this.setup_oauth();
      var path = ['/v2/blog', this.hostname, 'post/reblog'];
      var query = {
        id: this.id,
        reblog_key: this.reblog_key
      };
      var uri = url.format({
        protocol: 'http:',
        hostname: HOSTNAME,
        pathname: path.join('/')
      });
      oa.post(uri, this.access_token, this.access_token_secret, query,
        function(err, data) {
          callback(JSON.parse(data));
        }
      );
    };

    $.get_dashboard = function(callback) {
      var self = this;
      var oa = this.setup_oauth();
      var query = {
        limit: this.limit,
        offset: this.limit * (this.page - 1),
        reblog_info: 'true',
        notes_info: 'true'
      };
      if (this.type)
        query.type = this.type;
      var uri = url.format({
        protocol: 'http:',
        hostname: HOSTNAME,
        pathname: '/v2/user/dashboard',
        query: query
      });
      oa.get(uri, this.access_token, this.access_token_secret,
        function(err, data) {
          callback(JSON.parse(data));
	}
      );
    };

    $.get_posts = function (callback) {
      var self = this;
      var path = ['/v2/blog', this.hostname, 'posts'];
      var query = {
        limit: this.limit,
        offset: this.limit * (this.page - 1),
        api_key: this.consumer_key,
        reblog_info: 'true',
        notes_info: 'true'
      };
      if (this.type)
        path.push(this.type);
      if (this.id)
        query.id = this.id;
      var options = {
        hostname: HOSTNAME,
        path: [
          path.join('/'),
          querystring.stringify(query)
        ].join('?'),
        method: 'GET'
      };
      var req = http.request(options, function(res) {
        var data = '';
        res.setEncoding('utf-8');
        res.on('data', function(chunk) {
          data += chunk;
        }).on('end', function() {
          callback(JSON.parse(data));
        });
      });
      req.end();
    };

    $.get_userinfo = function(callback) {
      var oa = this.setup_oauth();
      var uri = 'http://' + HOSTNAME + '/v2/user/info';
      oa.post(uri, this.access_token, this.access_token_secret, {},
        function(err, data) {
          callback(JSON.parse(data));
        }
      );
    };

    $.get_request_token = function(callback) {
      var oa = this.setup_oauth();
      oa.getOAuthRequestToken(function(err, token, token_secret, results) {
        var query = {
          oauth_token: token
        };
        var uri = [AUTHORIZE_URI, querystring.stringify(query)].join('?');
        callback(token, token_secret, uri);
      });
    };

    $.get_access_token = function(token, token_secret, verifier, callback) {
      var self = this;
      var oa = this.setup_oauth();
      oa.getOAuthAccessToken(token, token_secret, verifier,
        function(err, access_token, access_token_secret) {
          self.access_token = access_token;
          self.access_token_secret = access_token_secret;
          callback(access_token, access_token_secret);
        }
      );
    };

    $.setup_oauth = function() {
      return new OAuth(
        REQUEST_TOKEN_URI, ACCESS_TOKEN_URI,
        this.consumer_key, this.secret_key,
        '1.0', this.oauth_callback || null, 'HMAC-SHA1'
      );
    };
  })(Tumblr.prototype);

  exports.request = function(options, callback) {
    var tum = new Tumblr(options.consumer_key, options.secret_key);
    delete options.consumer_key;
    delete options.secret_key;
    if (options.username === '_dashboard') {
      options.protocol = 'dashboard:';
    } else if (!options.hostname && options.username) {
      options.hostname = options.username;
      if (options.hostname.indexOf('.') < 0)
        options.hostname += '.tumblr.com';
    }
    ['consumer_key', 'secret_key', 'username'].forEach(function(key) {
      if (options[key])
        delete options[key];
    });
    for (key in options)
      tum[key] = options[key];
    callback(tum);
    return tum;
  };
}).call(this);

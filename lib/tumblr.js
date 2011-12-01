(function() {
  const util = require('util');
  const url = require('url');
  const querystring = require('querystring');
  const http = require('http');
  const EventEmitter = require('events').EventEmitter;
  const OAuth = require('oauth').OAuth;

  const HOSTNAME = 'api.tumblr.com';
  const REQUEST_TOKEN_URI = 'http://www.tumblr.com/oauth/request_token';
  const ACCESS_TOKEN_URI = 'http://www.tumblr.com/oauth/access_token';
  const AUTHORIZE_URI = 'http://www.tumblr.com/oauth/authorize';

  exports.Tumblr = Tumblr;

  function Tumblr(consumer_key, secret_key) {
    return new Request({
      consumer_key: consumer_key,
      secret_key: secret_key
    });
  }

  exports.Request = Request;
  util.inherits(Request, EventEmitter);

  function Request(options, callback) {
    if (!options.protocol)
      options.protocol = 'posts:';
    this.protocol = options.protocol + (options.protocol.slice(-1) !== ':' ? ':' : '');
    this.consumer_key = options.consumer_key;
    this.secret_key = options.secret_key;
    this.access_token = options.access_token || null;
    this.access_token_secret = options.access_token_secret || null;
    this.id = options.id || 0;
    this.hostname = options.hostname || '';
    this.type = options.type || '';
    this.limit = options.limit || 10;
    this.page = options.page || 1;
    this.reblog_key = options.reblog_key || null;
    if (callback)
      this.on('response', callback);
  }

  (function($) {
    $.get_posts = function(callback) {
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
        method: 'GET',
        hostname: HOSTNAME,
        path: [path.join('/'), querystring.stringify(query)].join('?')
      };
      var req = http.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          callback(data);
        });
      });
      req.end();
    };

    $.get_dashboard = function(callback) {
      var oa = this.setup_oauth();
      var query = {
        limit: this.limit,
        offset: this.limit * (this.page - 1),
        reblog_info: 'true',
        notes_info: 'true'
      };
      if (this.type)
        query.type = this.type;
      var uri = get_api_uri('/user/dashboard', query);
      oa.get(uri, this.access_token, this.access_token_secret,
        function(err, data) {
          callback(data);
        }
      );
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
          callback(data);
        }
      );
    };

    $.get_userinfo = function(callback) {
      var oa = this.setup_oauth();
      var uri = get_api_uri('/user/info', {});
      console.log(uri);
      oa.post(uri, this.access_token, this.access_token_secret, {},
        function(err, data) {
          callback(JSON.parse(data));
        }
      );
    };

    $.get_request_token = function(callback) {
      var oa = this.setup_oauth();
      oa.getOAuthRequestToken(function(err, token, token_secret) {
        var query = {
          oauth_token: token
        };
        var uri = [AUTHORIZE_URI, querystring.stringify(query)].join('?');
        callback(token, token_secret, uri);
      });
    };

    $.get_access_token = function(token, token_secret, verifier, callback) {
      var oa = this.setup_oauth();
      oa.getOAuthAccessToken(token, token_secret, verifier,
        function(err, access_token, access_token_secret) {
	  this.access_token = access_token;
          this.access_token_secret = access_token_secret;
          callback(access_token, access_token_secret);
	}.bind(this)
      );
    };

    $.end = function() {
      var res = new Response();
      var callback = function(data) {
        res.emit('data', JSON.parse(data));
      };
      switch (this.protocol.slice(0, -1)) {
        case 'posts':
          this.get_posts(callback);
          break;
        case 'dashboard':
          this.get_dashboard(callback);
          break;
        case 'reblog':
          this.reblog(callback);
          break;
      }
      this.emit('response', res);
      return this;
    };

    $.setup_oauth = function() {
      return new OAuth(
        REQUEST_TOKEN_URI, ACCESS_TOKEN_URI,
        this.consumer_key, this.secret_key,
        '1.0', null, 'HMAC-SHA1'
      );
    };

    function get_api_uri(pathname, query) {
      var url_obj = {
        protocol: 'http:',
        hostname: HOSTNAME,
        pathname: '/v2' + pathname,
        query: query
      };
      return url.format(url_obj);
    }
  })(Request.prototype);

  exports.Response = Response;
  util.inherits(Response, EventEmitter);

  function Response() {}

  exports.request = function(options, callback) {
    return new Request(options, callback);
  };
})();

(function() {
  const util = require('util');
  const url = require('url');
  const querystring = require('querystring');
  const http = require('http');
  const EventEmitter = require('events').EventEmitter;
  const OAuth = require('oauth').OAuth;

  const PROTOCOLS = ['posts', 'dashboard', 'reblog'];
  const HOSTNAME = 'api.tumblr.com';
  const REQUEST_TOKEN_URI = 'http://www.tumblr.com/oauth/request_token';
  const ACCESS_TOKEN_URI = 'http://www.tumblr.com/oauth/access_token';
  const AUTHORIZE_URI = 'http://www.tumblr.com/oauth/authorize';

  exports.Tumblr = Tumblr;
  util.inherits(Tumblr, EventEmitter);

  function Tumblr(options) {
    options = this.options = options || {};
    if (!options.protocol)
      options.protocol = 'posts:';
    options.protocol = options.protocol + (options.protocol.slice(-1) !== ':' ? ':' : '');
    options.consumer_key = options.consumer_key;
    options.secret_key = options.secret_key;
    options.access_token = options.access_token || null;
    options.access_token_secret = options.access_token_secret || null;
    options.id = options.id || 0;
    options.hostname = options.hostname || '';
    options.type = options.type || '';
    options.limit = options.limit || 10;
    options.page = options.page || 1;
    options.reblog_key = options.reblog_key || null;
    for (var key in options)
      this[key] = options[key];
  }

  (function($) {
    $.get_userinfo = function(callback) {
      var oa = this.setup_oauth();
      var uri = get_api_uri('/user/info', {});
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

    $.setup_oauth = function() {
      return new OAuth(
        REQUEST_TOKEN_URI, ACCESS_TOKEN_URI,
        this.consumer_key, this.secret_key,
        '1.0', null, 'HMAC-SHA1'
      );
    };
  })(Tumblr.prototype);

  exports.Request = Request;
  util.inherits(Request, Tumblr);

  function Request(options, callback) {
    Tumblr.call(this, options);
    if (callback)
      this.on('response', callback);
  }

  (function($) {
    $.end = function() {
      var res = new Response(this.options);
      this.emit('response', res);
      return this;
    };
  })(Request.prototype);

  exports.Response = Response;
  util.inherits(Response, Tumblr);

  function Response(options) {
    var self = this;
    Tumblr.call(this, options);
    var callback = function(data) {
      self.emit('data', JSON.parse(data));
    };
    this.init();
    if (this.protocol)
      this.emit(this.protocol.slice(0, -1), callback);
  }

  (function($) {
    $.init = function() {
      PROTOCOLS.forEach(function(protocol) {
        this.on(protocol, this[protocol]);
      }, this);
    };

    $.posts = function(callback) {
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

    $.dashboard = function(callback) {
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
  })(Response.prototype);

  exports.request = function(options, callback) {
    return new Request(options, callback);
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
})();

(function() {
  var util = require('util');
  var url = require('url');
  var querystring = require('querystring');
  var http = require('http');
  var EventEmitter = require('events').EventEmitter;
  var OAuth = require('oauth').OAuth;

  const HOST_NAME = 'api.tumblr.com';
  const REQUEST_TOKEN_URI = 'http://www.tumblr.com/oauth/request_token';
  const ACCESS_TOKEN_URI = 'http://www.tumblr.com/oauth/access_token';
  const AUTHORIZE_URI = 'http://www.tumblr.com/oauth/authorize';

  function Tumblr(consumer_key, secret_key) {
    this.consumer_key = consumer_key;
    this.secret_key = secret_key;
    this.access_token = null;
    this.access_token_secret = null;

    this.oa = new OAuth(
      REQUEST_TOKEN_URI, ACCESS_TOKEN_URI,
      this.consumer_key, this.secret_key,
      '1.0', null, 'HMAC-SHA1'
    );

    this.init();
  };

  util.inherits(Tumblr, EventEmitter);
  exports.Tumblr = Tumblr;

  (function($) {
    $.init = function() {
      this.dashboard = false;
      this.hostname = '';
      this.page = 1;
      this.type = '';
      this.limit = 10;
    };

    $.end = function() {
      if (!(this.dashboard || this.hostname))
        this.emit('error', 'required hostname');
      if (this.dashboard) {
        if (!(this.access_token && this.access_token_secret))
          this.emit('error', 'required access token');
        this.get_dashboard();
      } else if (this.hostname) {
        this.get_posts();
      }
      return this;
    };

    $.get_dashboard = function() {
      var self = this;
      var query = {
        limit: this.limit,
        offset: this.limit * (this.page - 1)
      };
      if (this.type)
        query.type = this.type;
      var uri = url.format({
        protocol: 'http:',
        hostname: HOST_NAME,
        pathname: '/v2/user/dashboard',
        query: query
      });
      this.oa.get(uri, this.access_token, this.access_token_secret,
        function(err, data) {
          self.emit('data', JSON.parse(data));
	}
      );
    };

    $.get_posts = function () {
      var self = this;
      var path = ['/v2/blog', this.hostname, 'posts'];
      var query = {
        limit: this.limit,
        offset: this.limit * (this.page - 1),
        api_key: this.consumer_key
      };
      if (this.type)
        path.push(this.type);
      var options = {
        hostname: HOST_NAME,
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
          self.emit('data', JSON.parse(data));
        });
      });
      req.end();
    };
  })(Tumblr.prototype);

  exports.request = function(options, callback) {
    var tum = new Tumblr(options.consumer_key, options.secret_key);
    delete options.consumer_key;
    delete options.secret_key;
    if (options.username === '_dashboard') {
      options.dashboard = true;
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

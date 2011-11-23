(function() {
  var url = require('url');
  var path = require('path');
  var JSONHttpRequest = require('./JSONHttpRequest');

  const API_HOST_NAME = 'api.tumblr.com';

  function Tumblr(api_key, api_secret_key) {
    if (!api_key)
      throw new Error('API key is indispensability argument.');
    this.api_key = api_key;
    this.api_secret_key = api_secret_key || null;
    this.hostname = '';
    this.page = 1;
    this.type = '';
    this.limit = 20;
    this.callback = {
      data: function() {},
      error: function() {}
    };
  };

  (function($) {
    $.on = function(type, func) {
      this.callback[type] = func;
      return this;
    };

    $.send = function() {
      var uri = this.get_api_uri();
      if (!uri)
        return false;
      var req = new JSONHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState !== 4)
          return;
        if (req.status === 200) {
          var json = req.responseJSON;
          this.callback.data(json);
        } else {
          this.callback.error(req);
        }
      }.bind(this);
      req.open('GET', uri);
      req.send(null);
      return true;
    };

    $.get_api_uri = function() {
      if (!(this.hostname && this.page))
        return null;
      var uri_path = path.join('/v2/blog', this.hostname, 'posts');
      if (this.type)
        uri_path = path.join(uri_path, this.type);
      return url.format({
        protocol: 'http',
        host: API_HOST_NAME,
        pathname: uri_path,
        query: {
          limit: this.limit,
          offset: this.limit * (this.page - 1),
          api_key: this.api_key
        }
      });
    };
  })(Tumblr.prototype);

  exports.request = function request(options, func) {
    var tum = new Tumblr(options.api_key, options.api_secret_key);
    if (!options.hostname && options.username) {
      options.hostname = options.username + '.tumblr.com';
      delete options.username;
    }
    for (option in options)
      tum[option] = options[option];
    func(tum);
    return tum;
  };
})();

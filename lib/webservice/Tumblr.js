(function() {
  var url = require('url');
  var path = require('path');
  var JSONHttpRequest = require('../JSONHttpRequest');

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
    this.callback = function() {};
  };

  (function($) {
    $.set_username = function(username) {
      this.hostname = username + '.tumblr.com';
      return this.hostname;
    };

    $.send = function() {
      var uri = this.get_api_uri();
      if (!uri)
        return false;
      var req = new JSONHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState !== 4)
          return;
        var json = req.responseJSON;
        this.callback(json);
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

  module.exports = Tumblr;
})();

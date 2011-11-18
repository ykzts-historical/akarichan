(function() {
  var querystring = require('querystring');
  var JSONHttpRequest = require('../JSONHttpRequest');
  var settings = require('../../settings');

  function Tumblr() {
    this.hostname = '';
    this.page = 1;
    this.type = '';
    this.limit = 20;

    this.callback = null;
  };

  (function($) {
    $.send_request = function() {
      var self = this;
      if (!this.callback)
        return;
      var uri = this.get_api_uri();
      var callback = function(json) {
        self.callback(json);
      };

      var req = new JSONHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState !== 4)
          return;
        var json = req.responseJSON;
        callback(json);
      };
      req.open('GET', uri);
      req.send(null);
    };

    $.set_username = function(username) {
      this.hostname = username + '.tumblr.com';
    };

    $.get_api_uri = function() {
      var uri = [
        'http://',
        settings.TUMBLR.API_HOST,
        '/v2/blog/',
        this.hostname,
        '/posts'
      ].join('');
      var query = {
        limit: this.limit,
        offset: this.limit * (this.page - 1),
        api_key: settings.TUMBLR.API_KEY
      };
      if (this.type)
        uri += '/' + this.type;
      return [uri, querystring.stringify(query)].join('?');
    };
  })(Tumblr.prototype);

  module.exports = Tumblr;
})();

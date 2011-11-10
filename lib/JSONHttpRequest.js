(function() {
  var http = require('http');

  function JSONHttpRequest() {
    this.method = 'GET';
    this.uri = null;
    this.status = null;
    this.readyState = 0;
    this.onreadystatechange = function() {};
    this.responseJSON = null;
  };

  (function($) {
    $.open = function(method, uri) {
      this.method = method;
      this.uri = uri;
      this.ready_state_change(1);
    };

    $.send = function() {
      var self = this;

      callback = function(json) {
        self.status = 200;
        self.responseJSON = json;
        self.ready_state_change(4);
        return;
      };

      this.ready_state_change(2);
      self.http_request(callback);

      return;
    };

    $.ready_state_change = function(ready_state) {
      this.readyState = ready_state;
      this.onreadystatechange();

      return;
    };

    $.http_request = function(callback) {
      var url_obj = require('url').parse(this.uri);
      var options = {
        host: url_obj.hostname,
        port: url_obj.port,
        path: url_obj.pathname + (url_obj.search || ''),
        method: this.method
      };
      var req = http.request(options, function(res) {
        var data = '';
        res.on('data', function(chunk) {
          data += chunk;
          return;
        }).on('end', function() {
          data.replace(/\{[\w\W]+\}/, function(json) {
            callback(JSON.parse(json));
            return;
          });
        });
      });
      req.end();
      return;
    };
  })(JSONHttpRequest.prototype);

  module.exports = JSONHttpRequest;
})();

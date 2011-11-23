
var fs = require('fs');
var tumblr = require('../lib/tumblr');
var utils = require('../lib/utils');
var views = require('./index');
var settings = require('../settings');

module.exports = function(req, res) {
  var username = req.params.username;
  var format = req.params.format || 'html';
  var page = (req.query.page || 1) * 1;

  tumblr.request({
    api_key: settings.TUMBLR.API_KEY,
    type: 'photo',
    limit: 20,
    username: username,
    page: page
  }, function(req) {
    req.on('data', function(json) {
      var posts = json.response.posts || [];
      var sections = posts.map(function(post, num) {
        var section = utils.section_simplify(post);
        section.num = num + 1;
        return section;
      });
      if (!sections.length) {
        views.http404(req, res);
        return;
      }
      res.render('user', {
        username: username,
        page: page,
        sections: sections
      });
    }).on('error', function(json) {
      views.http404(req, res);
    });
  }).send();
};

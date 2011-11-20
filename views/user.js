
var fs = require('fs');
var PhotosViewer = require('../lib/PhotosViewer');
var views = require('./index');
var settings = require('../settings');

var pv = new PhotosViewer();

module.exports = function(req, res) {
  var username = req.params.username;
  var format = req.params.format || 'html';
  var page = (req.query.page || 1) * 1;

  pv.get(username, page, function(sections) {
    if (!sections.length) {	
      views.http404(req, res);
    }
    res.render('user', {
      username: username,
      page: page,
      sections: sections
    });
  });
};

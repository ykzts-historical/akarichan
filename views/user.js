
var fs = require('fs');
var PhotosViewer = require('../lib/PhotosViewer');
var settings = require('../settings');

var pv = new PhotosViewer();

module.exports = function(req, res) {
  var username = req.params.username;
  var format = req.params.format || 'html';
  var page = (req.query.page || 1) * 1;

  pv.get(username, page, function(sections) {
    if (!sections.length) {	
      res.render('404', {status: 404});
      return;
    }
    res.render('user', {
      username: username,
      page: page,
      sections: sections
    });
  });
};

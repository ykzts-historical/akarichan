
var fs = require('fs');
var path = require('path');
var settings = require('../settings');

exports.index = function(req, res) {
  res.render('index');
};

exports.http404 = function(req, res) {
  res.render('404', {status: 404});
};

fs.readdirSync(__dirname).forEach(function(file) {
  if (file === path.basename(__filename))
    return;
  var func_name = path.basename(file, '.js');
  exports[func_name] = require('./' + func_name);
});


var settings = require('./settings');

exports.get_title = function() {
  var title = [];
  var status = this.status;
  var username = this.username;
  var page = this.page;
  if (status === 404)
    return '404 Not found.';
  if (page)
    title.push(page);
  if (username)
    title.push(username);
  title.push(settings.TITLE);
  return title.join(' < ');
};

exports.next_page = function() {
  var username = this.username;
  var page = this.page;
  if (!(username && page))
    return '';
  page++;
  return '/' + username + '?page=' + page;
};

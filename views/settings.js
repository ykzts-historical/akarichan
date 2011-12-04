
exports.index = function(req, res) {
  if (req.method === 'GET') {
    if (!req.session.user) {
      res.redirect('/_oauth/signin?back=' +
        encodeURIComponent('/_settings'));
      return;
    }
    res.render('settings');
    return;
  }
  var blog_url = req.body.blog_url;
  if (blog_url && req.session.blog_url !== blog_url)
    req.session.blog_url = blog_url;
  res.redirect('/_settings');
};

(function() {
  var Tumblr = require('./webservice/Tumblr');

  function PhotosViewer(api_key) {
    this.callback = function() {};
    this.tumblr = new Tumblr(api_key);
    this.tumblr.type = 'photo';
    this.tumblr.limit = 20;
    this.tumblr.callback = function(json) {
      var res = json.response || {};
      var posts = json.response.posts || [];
      var sections = posts.map(function(post, num) {
        var section = this.section_simplify(post);
        section.num = num + 1;
        return section;
      }, this);
      this.callback(sections);
    }.bind(this);
  };

  (function($) {
    $.get = function(username, page, callback) {
      this.callback = callback;
      this.tumblr.set_username(username);
      this.tumblr.page = page;
      this.tumblr.send();
      return;
    };

    $.section_simplify = function(post) {
      var photo_data = [];
      var alt_sizes = post.photos[0].alt_sizes;
      var original_sizes = post.photos[0].original_size;
      var photos = alt_sizes.concat(original_sizes);
      photos.forEach(function(photo) {
        if (photo_data.length && photo_data[0] > photo.width)
          return;
        photo_data = [photo.width, photo.url];
      });
      return {
	uri: post.post_url,
        photo_uri: photo_data[1]
      };
    };
  })(PhotosViewer.prototype);

  module.exports = PhotosViewer;
})();

(function() {
  var Tumblr = require('./webservice/Tumblr');

  function PhotosViewer() {
    var self = this;
    this.callback = function() {};
    this.tumblr = new Tumblr();
    this.tumblr.type = 'photo';
    this.tumblr.limit = 10;
    this.tumblr.callback = function(json) {
      var sections = [];
      json.response.posts.forEach(function(post) {
        var section = self.section_simplify(post);
        sections.push(section);
      });
      self.callback(sections);
    };
  };

  (function($) {
    $.get = function(username, page, callback) {
      this.callback = callback;
      this.tumblr.set_username(username);
      this.tumblr.page = page;
      this.tumblr.send_request();
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

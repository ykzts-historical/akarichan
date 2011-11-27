(function() {
  exports.section_simplify = function(post, num) {
    var blog_url = this.blog_url || null;
    var result = {
      id: post.id,
      blog_name: post.blog_name,
      date: new Date(post.date),
      uri: post.post_url,
      reblog_key: post.reblog_key,
      num: num + 1
    };
    if (blog_url && post.notes) {
      result.reblogged = post.notes.some(function(note) {
        return blog_url === note.blog_url;
      });
    }
    if (post.photos) {
      var photo_data = [];
      var alt_sizes = post.photos[0].alt_sizes;
      var original_sizes = post.photos[0].original_size;
      var photos = alt_sizes.concat(original_sizes);
      photos.forEach(function(photo) {
        if (photo_data.length && photo_data[0] > photo.width)
          return;
        photo_data = [photo.width, photo.url];
      });
      result.photo_uri = photo_data[1];
    }
    return result;
  };
})();

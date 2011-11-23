(function() {
  exports.section_simplify = function(post) {
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
})();

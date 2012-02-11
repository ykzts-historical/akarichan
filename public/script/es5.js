(function() {
  if (Object.keys && Object.defineProperty && Object.defineProperties) {
    return;
  }

  Object.keys = Object.keys || function keys(obj) {
    var prop;
    var result = [];
    for (prop in obj) {
      result.push(prop);
    };
    return result;
  };

  Object.defineProperty = Object.defineProperty || function defineProperty(obj, prop, desc) {
    Object.keys(desc).forEach(function(item) {
      switch (item) {
        case 'value':
          obj[prop] = desc[item];
          break;
        case 'get':
          obj.__defineGetter__(prop, desc[item]);
          break;
        case 'set':
          obj.__defineSetter__(prop, desc[item]);
          break;
      }
    });
  };

  Object.defineProperties = Object.defineProperties || function defineProperties(obj, props) {
    Object.keys(props).forEach(function(prop) {
      Object.defineProperty(obj, prop, props[prop]);
    });
  };
})();


// for Firefox
if (!HTMLElement.prototype.insertAdjacentElement) {
  HTMLElement.prototype.insertAdjacentElement = function(where, elem) {
    var doc = this.ownerDocument;
    var div = doc.createElement('div');
    var text = '';
    div.appendChild(elem);
    text += div.innerHTML;
    this.insertAdjacentHTML(where, text);
  };
}

// for Safari
// @cite=https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var fSlice = Array.prototype.slice;
    var aArgs = fSlice.call(arguments, 1);
    var fToBind = this;
    var fNOP = function () {};
    var fBound = function () {
      return fToBind.apply(this instanceof fNOP ? thisb : oThis || window, aArgs.concat(fSlice.call(arguments)));
    };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

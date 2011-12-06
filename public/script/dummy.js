
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

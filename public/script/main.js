(function(doc, win) {
  var HOST = location.host;
  var body = doc.getElementsByTagName('body')[0];
  var result = doc.getElementById('result');

  function SiteScript() {
    this.ap = new AppendPage(location.href);
    this.set_elevator();
    this.add_event();
  }

  (function($) {
    $.add_event = function()  {
      doc.addEventListener('DOMContentLoaded', this.loaded.bind(this), false);
      win.addEventListener('popstate', this.popstate.bind(this), false);
    };

    $.loaded = function() {
      var form = doc.getElementsByTagName('form').item(0);
      var text_field = doc.getElementById('tumblr_username');
      text_field.setAttribute('value', 'press any tumblr username');
      text_field.setAttribute('class', 'initial_value');
      if (this.ap.username) {
        text_field.value = this.ap.username;
        text_field.removeAttribute('class');
      }
      text_field.addEventListener('focus', function() {
        var initial_value = text_field.getAttribute('value');
        if (text_field.value === initial_value) {
          text_field.value = '';
          text_field.removeAttribute('class');
        }
      }, false);
      form.addEventListener('submit', function(event) {
        event.preventDefault();
        text_field.blur();
        this.ap.refresh();
        this.ap.username = text_field.value;
        this.ap.page = 1;
        this.ap.request();
        return false;
      }.bind(this), false);
    };

    $.popstate = function(event) {
      if (this.ap.uri === location.href)
        return;
      win.scroll(0, 0);
      this.ap.refresh();
      this.ap.uri = event.state.uri;
      this.ap.request();
    };

    $.set_elevator = function() {
      var list_node = doc.createElement('ul');
      body.appendChild(list_node);
      list_node.setAttribute('id', 'elevator');
      ['prev', 'next'].forEach(function(value) {
        var list_item = doc.createElement('li');
        list_node.appendChild(list_item);
        list_item.setAttribute('class', value);
        list_item.addEventListener('click', this.ap[value].bind(this.ap));
      }.bind(this));
    };
  })(SiteScript.prototype);

  function AppendPage(uri) {
    this.uri = uri;
    this.init();
  }

  (function($) {
    var _expr = /(?:http:\/\/[^/]+\/(\w+)?(?:\?page=(\d+))?)?/;
    var _page_title_node = doc.getElementsByTagName('title')[0];

    Object.defineProperties($, {
      page_title: {
        get: function() {
          return _page_title_node.textContent;
        },
        set: function(title) {
          var text_node = doc.createTextNode(title);
          _page_title_node.replaceChild(text_node, _page_title_node.firstChild);
          return title;
        }
      },

      message: {
        get: function() {
          return doc.getElementById('message');
        },
        set: function(message) {
          var _message_node = this.message;
          var text_node = doc.createTextNode(message);
          if (!_message_node) {
            _message_node = doc.createElement('p');
            _message_node.setAttribute('id', 'message');
            result.appendChild(_message_node);
          }
          if (_message_node.firstChild) {
            _message_node.replaceChild(text_node, _message_node.firstChild);
          } else {
            _message_node.appendChild(text_node);
          }
          return _message_node;
        }
      },

      username: {
        get: function() {
          return _expr.exec(this.uri)[1];
        },
        set: function(username) {
          this.uri = this.get_api_uri(username, this.page);
          return username;
        }
      },

      page: {
        get: function() {
          return (_expr.exec(this.uri)[2] || 1) * 1;
        },
        set: function(page) {
          this.uri = this.get_api_uri(this.username, page);
          return page;
        }
      },

      sections: {
        get: function() {
          var sections = result.getElementsByTagName('section');
          return sections;
        }
      },

      section_positions: {
        get: function() {
          var ret = [];
          var sections = this.sections;
          for (var i=0, len=sections.length; i<len; i++)
            ret.push(sections[i].offsetTop);
          return ret;
        }
      }
    });

    $.init = function() {
      if (this.username)
        this.add_event();
    };

    $.refresh = function() {
      var range = document.createRange();
      range.selectNodeContents(result);
      range.deleteContents();
    };

    $.add_event = function() {
      var self = this;
      win.addEventListener('scroll', function onscroll() {
        self.window_scroll(function() {
          win.removeEventListener('scroll', onscroll);
        });
      }, false);
    };

    $.window_scroll = function(remove_event) {
      var len = this.sections.length;
      if (len === 0) {
        remove_event();
        return;
      }
      if (win.scrollY < this.sections[len-2].offsetTop)
        return;
      remove_event();
      this.load_next();
    };

    $.load_next = function() {
      this.page = this.page + 1;
      this.request();
    };

    $.request = function() {
      if (this.uri !== location.href && 'pushState' in win.history)
        win.history.pushState({uri: this.uri}, this.page_title, this.uri);
      this.message = 'loading...';
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState !== 4)
          return;
        if (req.status !== 200) {
          this.page_title = this.message = '404 not found.';
          return;
        }
        var res = req.responseXML;
        var _ = doc.importNode(res.getElementById('result'), true);
        var range = doc.createRange();
        range.selectNodeContents(_);
        result.replaceChild(range.extractContents(), this.message);
        this.page_title = res.getElementsByTagName('title')[0].textContent;
        this.add_event();
      }.bind(this);
      req.open('GET', this.uri);
      req.send(null);
    };

    $.get_api_uri = function(username, page) {
      var path = '/' + username;
      if (page > 1)
        path += '?page=' + page;
      return 'http://' + HOST + path;
    };

    $.current_section = function() {
      if (!this.sections.length)
        return null;
      var pos = win.scrollY;
      for (var i=this.sections.length; i>=0; i--) {
        var sec_pos = this.section_positions[i];
        if (sec_pos-pos <= 0)
          break;
      }
      return this.sections[this.section_positions.indexOf(sec_pos)];
    };

    $.go = function(num) {
      var current = this.current_section();
      if (!current)
        return -1;
      var i = this.section_positions.indexOf(current.offsetTop);
      i = i + num;
      if (i < 0 || i > this.sections.length - 1)
        return -1;
      win.scroll(0, this.section_positions[i]);
      return this.sections[i];
    };

    $.prev = function() {
      return this.go(-1);
    };

    $.next = function() {
      return this.go(+1);
    };
  })(AppendPage.prototype);

  win.ss = new SiteScript();
})(window.document, window);

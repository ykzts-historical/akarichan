(function(doc, win) {
  var HOST = location.host;
  var URI = location.href;
  var body = doc.getElementsByTagName('body')[0];
  var result = doc.getElementById('result');
  var range = doc.createRange();

  var KEY_BIND = {
    j: 'next',
    k: 'prev',
    o: 'open',
    f: 'focus'
  };

  function SiteScript() {
    this.ap = new AppendPage(this);
    this.form = new Form(this);
    this.add_event();
    this.set_elevator();
  }

  (function($) {
    $.add_event = function()  {
      win.addEventListener('keypress', this.onkeypress.bind(this), false);
      win.addEventListener('popstate', this.onpopstate.bind(this), false);
    };

    $.onkeypress = function(event) {
      var press_key = String.fromCharCode(event.keyCode);
      var node_name = event.srcElement.nodeName.toLowerCase();
      var keys = Object.keys(KEY_BIND);
      if (node_name === 'input' || node_name === 'textarea' || keys.indexOf(press_key) < 0)
        return;
      event.preventDefault();
      this.ap[KEY_BIND[press_key]]();
    };

    $.onpopstate = function(event) {
      var state = event.state;
      if (this.ap.uri === URI || !state)
        return;
      win.scroll(0, 0);
      this.ap.refresh();
      this.ap.uri = state.uri || URI;
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

  function Form(ss) {
    this.form = doc.getElementsByTagName('form')[0];
    this.text_field = doc.getElementById('tumblr_username');
    this.ap = ss.ap;
    this.init();
  }

  (function($) {
    $.init = function() {
      this.text_field.setAttribute('value', 'press any tumblr username');
      if (!this.text_field.value || this.text_field.value === this.text_field.getAttribute('value'))
        this.text_field.setAttribute('class', 'initial_value');
      this.text_field.addEventListener('focus', this.onfocus, false);
      this.text_field.addEventListener('blur', this.onfocus, false);
      this.form.addEventListener('submit', this.onsubmit.bind(this), false);
    };

    $.onsubmit = function() {
      event.preventDefault();
      if (!this.text_field.value)
        return false;
      this.text_field.blur();
      this.ap.refresh();
      this.ap.username = this.text_field.value;
      this.ap.page = 1;
      this.ap.request();
      return false;
    };

    $.onfocus = function() {
      var default_value = this.getAttribute('value');
      if (this.value === default_value) {
        this.value = '';
        this.removeAttribute('class');
      } else if (this.value === '') {
        this.value = default_value;
        this.setAttribute('class', 'initial_value');
      }
    };
  })(Form.prototype);


  function AppendPage(ss) {
    this.ss = ss;
    this.uri = URI;
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
      if (this.uri !== URI && 'pushState' in win.history)
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

    $.open = function() {
      var uri = this.current_section().getElementsByClassName('uri')[0].textContent;
      return win.open(uri, '_blank');
    };

    $.focus = function() {
      this.ss.form.text_field.focus();
      return;
    };
  })(AppendPage.prototype);

  doc.addEventListener('DOMContentLoaded', function() {
    win.ss = new SiteScript();
  }, false);
})(window.document, window);

(function(win, doc) {
  "use strict";

  var HOST = location.host;
  var URI = location.href;
  var KEY_BIND = {
    r: 'reload',
    j: 'next',
    k: 'prev',
    p: 'pinned',
    o: 'open',
    f: 'focus',
    s: 'reblog'
  };

  function SiteScript() {
    this.sections = new Sections(this);
    this.ap = new AppendPage(this);
    this.form = new Form(this);
    this.ka = new KeyboardAction(this);
    this.add_event();
    this.set_elevator();
  }

  (function($) {
    var _page_title_node = doc.querySelector('head title');

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
          if (!message) {
            if (_message_node)
              _message_node.parentNode.removeChild(_message_node);
            return null;
          }
          if (!_message_node)
            _message_node = this.create_message_node();
          if (message.nodeType) {
            _message_node.parentNode.replaceChild(message, _message_node);
          } else if (typeof message === 'string') {
            var text_node = doc.createTextNode(message);
            if (_message_node.firstChild) {
              _message_node.replaceChild(text_node, _message_node.firstChild);
            } else {
              _message_node.appendChild(text_node);
            }
          }
          return _message_node;
        }
      }
    });

    $.add_event = function()  {
      win.addEventListener('keypress', this.onkeypress.bind(this), false);
      win.addEventListener('popstate', this.onpopstate.bind(this), false);
    };

    $.onkeypress = function(event) {
      var target = event.target;
      var press_key = String.fromCharCode(event.keyCode || event.charCode);
      var node_name = target.nodeName.toLowerCase();
      var ignore_nodes = ['input', 'textarea'];
      var keys = Object.keys(KEY_BIND);
      if (ignore_nodes.indexOf(node_name) >= 0 || keys.indexOf(press_key) < 0)
        return;
      event.preventDefault();
      this.ka[KEY_BIND[press_key]]();
    };

    $.onpopstate = function(event) {
      var state = event.state;
      if (!state || this.ap.uri === state.uri)
        return;
      win.scroll(0, 0);
      this.sections.refresh();
      this.ap.uri = URI = state.uri;
      this.ap.request();
      if (this.form.text_field.value !== this.ap.username)
        this.form.text_field.value = this.ap.username;
    };

    $.create_message_node = function() {
      var _message_node = doc.createElement('p');
      var selector = [
        'section:last-of-type',
        'body > h1'
      ].join(', ');
      var point = doc.querySelector(selector);
      _message_node.setAttribute('id', 'message');
      point.insertAdjacentElement('afterEnd', _message_node);
      return _message_node;
    };

    $.set_elevator = function() {
      var ka = this.ka;
      var list_node = doc.createElement('ul');
      var point = doc.querySelector('body > fieldset');
      list_node.setAttribute('id', 'elevator');
      ['prev', 'next'].forEach(function(value) {
        var list_item = doc.createElement('li');
        list_node.appendChild(list_item);
        list_item.classList.add(value);
        list_item.addEventListener('click', function() {
          ka[value]();
        }, false);
      });
      point.insertAdjacentElement('beforeBegin', list_node);
    };
  })(SiteScript.prototype);

  function Form(ss) {
    this.form = doc.querySelector('body > fieldset form');
    this.text_field = doc.getElementById('tumblr_username');
    this.sections = ss.sections;
    this.ap = ss.ap;
    this.init();
  }

  (function($) {
    var default_value = 'press any tumblr username';

    $.init = function() {
      if (!this.text_field.value) {
        this.text_field.value = default_value;
        this.text_field.classList.add('initial_value');
      }
      this.add_event();
    };

    $.add_event = function() {
      win.addEventListener('scroll', this.onscroll.bind(this), false);
      this.text_field.addEventListener('focus', this.onfocus, false);
      this.text_field.addEventListener('blur', this.onfocus, false);
      this.form.addEventListener('submit', this.onsubmit.bind(this), false);
      this.onscroll();
    };

    $.onscroll = function() {
      if (this.ap.username !== '_dashboard')
        return;
      var current = this.sections.current_section();
      if (!current)
        return;
      var blog_name = current.querySelector('.blog_name').textContent;
      this.text_field.value = blog_name;
    };

    $.onsubmit = function(event) {
      event.preventDefault();
      if (!this.text_field.value)
        return false;
      this.text_field.blur();
      this.sections.refresh();
      this.ap.username = this.text_field.value;
      this.ap.page = 1;
      this.ap.request();
      return false;
    };

    $.onfocus = function(event) {
      if (this.value === default_value) {
        this.value = '';
        this.classList.remove('initial_value');
      } else if (this.value === '') {
        this.value = default_value;
        this.classList.add('initial_value');
      }
      var len = this.value.length;
      if (event.type === 'focus' && len) {
        this.selectionStart = 0;
        this.selectionEnd = len;
      }
    };
  })(Form.prototype);

  function KeyboardAction(ss) {
    this.ap = ss.ap;
    this.sections = ss.sections;
    this.form = ss.form;
  }

  (function($) {
    $.reload = function() {
      this.sections.refresh();
      this.ap.request();
    };

    $.next = function() {
      var current = this.sections.current_section();
      this.sections.next(current);
    };

    $.prev = function() {
      var current = this.sections.current_section();
      this.sections.prev(current);
    };

    $.pinned = function() {
      var current = this.sections.current_section();
      this.sections.set_pin(current);
    };

    $.open = function() {
      var current = this.sections.current_section();
      var pinned = doc.querySelectorAll('.pinned');
      var sections = Array.prototype.slice.apply(pinned);
      if (!sections.length) {
        this.sections.open(current);
        return;
      }
      sections.forEach(function(section) {
        this.sections.open(section);
        this.sections.set_pin(section);
      }, this);
    };

    $.focus = function() {
      this.form.text_field.focus();
    };

    $.reblog = function() {
      var current = this.sections.current_section();
      var uri = current.querySelector('form').getAttribute('action');
      var req = new XMLHttpRequest();
      req.addEventListener('readystatechange', function() {
        if (req.readyState !== 4 || req.status !== 200)
          return;
        var res = JSON.parse(req.responseText);
        switch (res.meta.status) {
          case 201:
            current.classList.add('reblogged');
            break;
          default:
            var errors = res.response.errors || [];
            alert(errors[0]);
            break;
        }
      });
      req.open('GET', uri);
      req.send(null);
    };
  })(KeyboardAction.prototype);

  function AppendPage(ss) {
    this.ss = ss;
    this.sections = ss.sections;
    this.uri = URI;
    this.init();
  }

  (function($) {
    var _expr = /(?:(?:http:\/\/[^/]+)?\/([\w-\.]+)?(?:\?page=(\d+))?)?/;

    Object.defineProperties($, {
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
      }
    });

    $.init = function() {
      if (this.username)
        this.add_event();
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
      var sections = this.sections.nodes;
      var len = sections.length;
      if (len === 0) {
        remove_event();
        return;
      }
      if (win.scrollY < sections[len-2].offsetTop)
        return;
      remove_event();
      this.load_next();
    };

    $.load_next = function() {
      if (!this.ss.message)
        return;
      var anchor = this.ss.message.querySelector('a:only-child');
      if (!anchor)
        return;
      this.uri = anchor.getAttribute('href');
      this.request();
    };

    $.request = function() {
      var self = this;
      if (this.uri !== URI) {
        URI = this.uri;
        win.history.pushState({uri: this.uri}, this.ss.page_title, this.uri);
      }
      this.ss.message = 'loading...';
      var req = new XMLHttpRequest();
      req.addEventListener('readystatechange', function() {
        if (req.readyState !== 4)
          return;
        var res = req.responseXML;
        self.append(res);
        self.add_event();
      }, false);
      req.open('GET', this.uri);
      req.send(null);
    };

    $.append = function(res) {
      var df = res.createDocumentFragment();
      var sections = Array.prototype.slice.apply(
        res.querySelectorAll('body > section, #message'));
      sections.forEach(df.appendChild, df);
      this.ss.message = doc.importNode(df, true);
      this.ss.page_title = res.querySelector('head title').textContent;
    };

    $.get_api_uri = function(username, page) {
      var path = '/' + username;
      if (page > 1)
        path += '?page=' + page;
      return 'http://' + HOST + path;
    };
  })(AppendPage.prototype);

  function Sections(ss) {
    this.ss = ss;
  }

  (function($) {
    Object.defineProperties($, {
      nodes: {
        get: function() {
          var sections = doc.querySelectorAll('body > section');
          return Array.prototype.slice.apply(sections);
        }
      },

      positions: {
        get: function() {
          return this.nodes.map(function(section) {
            return section.offsetTop;
          });
        }
      }
    });

    $.refresh = function() {
      var range = doc.createRange();
      var sections = this.nodes;
      var len = sections.length;
      if (!len)
        return;
      range.setStartBefore(sections[0]);
      range.setEndAfter(sections[len-1]);
      range.deleteContents();
      this.ss.message = null;
    };

    $.open = function(section) {
      var anchor = section.querySelector('a.uri');
      var event = doc.createEvent('MouseEvent');
      event.initMouseEvent('click', true, true, win,
        0, 0, 0, 0, 0, false, false, false, false, 1, null);
      anchor.dispatchEvent(event);
    };

    $.set_pin = function(section) {
      section.classList.toggle('pinned');
    };

    $.current_section = function() {
      var pos = win.scrollY;
      var sections = this.nodes;
      if (!sections.length)
        return null;
      return sections.reduceRight(function(prev, current) {
        return prev.offsetTop - pos <= 0 ?
          prev : current;
      });
    };

    $.go = function(section, num) {
      var sections = this.nodes;
      var positions = this.positions;
      var len = sections.length;
      var i = positions.indexOf(section.offsetTop);
      i = i + num;
      if (i < 0 || i > len - 1)
        return -1;
      win.scroll(0, positions[i]);
      return sections[i];
    };

    $.prev = function(section) {
      return this.go(section, -1);
    };

    $.next = function(section) {
      return this.go(section, +1);
    };
  })(Sections.prototype);

  doc.addEventListener('DOMContentLoaded', function() {
    win.ss = new SiteScript();
  }, false);
})(window, window.document);

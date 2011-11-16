(function(doc, win) {
  var HOST = location.host;
  var pathname = location.pathname + (location.search || '');
  var result = doc.getElementById('result');

  function SiteScript() {
    this.ap = new AppendPage(location.href);
    this.add_event();
  }

  (function($) {
    $.add_event = function()  {
      doc.addEventListener('DOMContentLoaded', this.loaded.bind(this), false);
      win.addEventListener('popstate', this.popstate.bind(this), false);
    };

    $.init = function() {
      var range = document.createRange();
      range.selectNodeContents(result);
      range.deleteContent();
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
      text_field.onfocus = function() {
	var initial_value = text_field.getAttribute('value');
        if (text_field.value === initial_value) {
          text_field.value = '';
          text_field.removeAttribute('class');
        }
      };
      form.onsubmit = function() {  
        this.init();
        text_field.blur();
        this.ap.username = text_field.value;
        this.ap.page = 1;
        this.ap.request();
        return false;
      }.bind(this);
    };

    $.popstate = function() {
      if (this.ap.uri === location.href)
        return;
      win.scroll(0, 0);
      this.init();
      this.ap._uri = location.href;
      this.ap.request();
    };
  })(SiteScript.prototype);

  function AppendPage(uri) {
    this._uri = uri;
    this.init();
  }

  (function($) {
    var _expr = /http:\/\/[^/]+\/(\w+)?(?:\?page=(\d+))?/;
    var _page_title_node = doc.getElementsByTagName('title')[0];

    Object.defineProperty($, 'uri', {
      get: function() {
        return this._uri;
      },
      set: function(uri) {
        this._uri = uri;
        if ('pushState' in win.history)
          win.history.pushState({}, this.page_title, uri);
        return uri;
      }
    });

    Object.defineProperty($, 'page_title', {
      get: function() {
        return _page_title_node.textContent;
      },
      set: function(title) {
        _page_title_node.textContent = title;
        return title;
      }
    });

    Object.defineProperty($, 'username', {
      get: function() {
        return _expr.exec(this.uri)[1];
      },
      set: function(username) {
        this.uri = this.get_api_uri(username, this.page);
        return username;
      }
    });

    Object.defineProperty($, 'page', {
      get: function() {
        return (_expr.exec(this.uri)[2] || 1) * 1;
      },
      set: function(page) {
        this.uri = this.get_api_uri(this.username, page);
        return page;
      }
    });

    Object.defineProperty($, 'sections', {
      get: function() {
        var sections = result.getElementsByTagName('section');
        return Array.prototype.slice.call(sections);
      }
    });

    Object.defineProperty($, 'section_positions', {
      get: function() {
        var ret = [];
        this.sections.forEach(function(section) {
          ret.push(section.offsetTop);
        });
        return ret;
      }
    });

    $.init = function() {
      if (this.username)
        this.add_event();
    };

    $.add_event = function() {
      var self = this;
      win.addEventListener('scroll', function() {
        var func = arguments.callee;
        self.window_scroll(function() {
          win.removeEventListener('scroll', func);
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
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState !== 4 || req.status !== 200)
          return;
        var range = doc.createRange();
        var res = req.responseXML;
        range.selectNodeContents(res.getElementById('result'));
        result.appendChild(range.extractContents());
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

(function(window, document, location) {
  'use strict';

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
    this.ap = new AppendPage(this);
    this.form = new Form(this);
    this.ka = new KeyboardAction(this);
    this.add_event();
  }
  (function($) {
    var _page_title_node = document.querySelector('head title');

    Object.defineProperties($, {
      page_title: {
        get: function() {
          return _page_title_node.textContent;
        },
        set: function(title) {
          var text_node = document.createTextNode(title);
          _page_title_node.replaceChild(text_node, _page_title_node.firstChild);
          return title;
        }
      },

      message: {
        get: function() {
          return document.getElementById('message');
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
            var text_node = document.createTextNode(message);
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
      window.addEventListener('keypress', _e(this), false);
      window.addEventListener('popstate', _e(this), false);
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
      window.scroll(0, 0);
      this.ap.refresh();
      this.ap.uri = URI = state.uri;
      this.ap.request();
      if (this.form.text_field.value !== this.ap.username)
        this.form.text_field.value = this.ap.username;
    };

    $.create_message_node = function() {
      var _message_node = document.createElement('p');
      var selector = [
        'article:last-of-type',
        'body > h1'
      ].join(', ');
      var base = document.querySelector(selector);
      base.parentNode.insertBefore(_message_node, base.nextSibling);
      _message_node.setAttribute('id', 'message');
      return _message_node;
    };
  })(SiteScript.prototype);

  function Form(ss) {
    this.text_field = document.getElementById('tumblr_username');
    this.ap = ss.ap;
    this.init();
  }

  (function($) {
    $.init = function() {
      this.add_event();
    };

    $.add_event = function() {
      window.addEventListener('scroll', _e(this), false);
      this.text_field.addEventListener('focus', this.onfocus, false);
      this.text_field.form.addEventListener('submit', _e(this), false);
      this.onscroll();
    };

    $.onscroll = function() {
      if (this.ap.username !== '_dashboard')
        return;
      var current = this.ap.current_article();
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
      this.ap.refresh();
      this.ap.username = this.text_field.value;
      this.ap.page = 1;
      this.ap.request();
      return false;
    };

    $.onfocus = function() {
      if (!this.value.length)
        return;
      this.select();
    };
  })(Form.prototype);

  function KeyboardAction(ss) {
    this.ap = ss.ap;
    this.form = ss.form;
  }

  (function($) {
    $.reload = function() {
      this.ap.refresh();
      this.ap.request();
    };

    $.next = function() {
      var current = this.ap.current_article();
      this.ap.next(current);
    };

    $.prev = function() {
      var current = this.ap.current_article();
      this.ap.prev(current);
    };

    $.pinned = function() {
      var current = this.ap.current_article();
      this.ap.set_pin(current);
    };

    $.open = function() {
      var current = this.ap.current_article();
      var pinned = document.getElementsByClassName('pinned');
      var articles = toArray(pinned);
      if (!articles.length) {
        this.ap.open(current);
        return;
      }
      articles.forEach(function(article) {
        this.ap.open(article);
        this.ap.set_pin(article);
      }, this);
    };

    $.focus = function() {
      this.form.text_field.focus();
    };

    $.reblog = function() {
      var current = this.ap.current_article();
      this.ap.reblog(current);
    };
  })(KeyboardAction.prototype);

  function AppendPage(ss) {
    this.ss = ss;
    this.uri = URI;
    this.init();
  }

  (function($) {
    var _expr = /(?:(?:http:\/\/[^/]+)?\/([^\?]+)?(?:\?page=(\d+))?)?/;

    Object.defineProperties($, {
      username: {
        get: function() {
          return _expr.exec(this.uri)[1];
        },
        set: function(username) {
          this.uri = this.get_page_uri({username: username});
          return username;
        }
      },
      page: {
        get: function() {
          return (_expr.exec(this.uri)[2] || 1) * 1;
        },
        set: function(page) {
          this.uri = this.get_page_uri({page: page});
          return page;
        }
      },
      articles: {
        get: function() {
          var articles = document.querySelectorAll('body > article');
          return toArray(articles);
        }
      }
    });

    $.init = function() {
      if (this.username)
        this.add_event();
    };

    $.add_event = function() {
      var self = this;
      window.addEventListener('scroll', function onscroll() {
        self.window_scroll(function() {
          window.removeEventListener('scroll', onscroll);
        });
      }, false);
    };

    $.window_scroll = function(remove_event) {
      var articles = this.articles;
      var len = articles.length;
      if (len === 0) {
        remove_event();
        return;
      }
      if (window.scrollY < articles[len-2].offsetTop)
        return;
      remove_event();
      this.load_next();
    };

    $.load_next = function() {
      if (!this.ss.message)
        return;
      var anchor = this.ss.message.querySelector('a[rel="next"]');
      if (!anchor)
        return;
      this.uri = anchor.getAttribute('href');
      this.request();
    };

    $.request = function() {
      var self = this;
      if (this.uri !== URI) {
        URI = this.uri;
        window.history.pushState({uri: this.uri}, this.ss.page_title, this.uri);
      }
      this.ss.page_title = this.ss.message = 'loading...';
      xhr.call(this, {uri: this.uri}, this.append);
    };

    $.append = function(res) {
      if (!res.nodeType) {
        this.ss.page_title = this.ss.message = 'error.';
        return;
      }
      var df = res.createDocumentFragment();
      var articles = res.querySelectorAll('body > article, #message');
      toArray(articles).forEach(df.appendChild, df);
      this.ss.message = document.importNode(df, true);
      this.ss.page_title = res.querySelector('head title').textContent;
      this.add_event();
    };

    $.get_page_uri = function(options) {
      return this.uri.replace(_expr, function(_, username, page) {
        if (options.username)
          username = options.username;
        if (options.page)
          page = options.page;
        var path = '/' + username;
        if (page > 1)
          path += '?page=' + page;
        return 'http://' + HOST + path;
      });
    };

    $.refresh = function() {
      var range = document.createRange();
      var articles = this.articles;
      var len = articles.length;
      if (!len)
        return;
      range.setStartBefore(articles[0]);
      range.setEndAfter(articles[len-1]);
      range.deleteContents();
      this.ss.message = null;
    };

    $.open = function(article) {
      var anchor = article.querySelector('a.uri');
      var event = document.createEvent('MouseEvent');
      event.initMouseEvent('click', true, true, window,
        0, 0, 0, 0, 0, false, false, false, false, 1, null);
      anchor.dispatchEvent(event);
    };

    $.set_pin = function(article) {
      article.classList.toggle('pinned');
    };

    $.reblog = function(article) {
      var form = article.querySelector('form');
      if (!form)
        return;
      var options = {
        method: 'POST',
        uri: form.getAttribute('action'),
        form_data: new FormData(form)
      };
      xhr(options, function(res) {
        switch (res.meta.status) {
          case 201:
            article.classList.add('reblogged');
            break;
          default:
            var errors = res.response.errors || [];
            alert(errors[0]);
            break;
        }
      });
    };

    $.current_article = function() {
      var pos = window.scrollY;
      var articles = this.articles;
      if (!articles.length)
        return null;
      return articles.reduceRight(function(prev, current) {
        return prev.offsetTop - pos <= 0 ?
          prev : current;
      });
    };

    $.go = function(article, num) {
      var articles = this.articles;
      var positions = articles.map(function(article) {
        return article.offsetTop;
      });
      var len = articles.length;
      var i = positions.indexOf(article.offsetTop);
      i = i + num;
      if (i < 0 || i > len - 1)
        return -1;
      window.scroll(0, positions[i]);
      return articles[i];
    };

    $.prev = function(article) {
      return this.go(article, -1);
    };

    $.next = function(article) {
      return this.go(article, +1);
    };
  })(AppendPage.prototype);

  document.addEventListener('DOMContentLoaded', function() {
    var ss = window.ss = new SiteScript();
    if (ss.ap.username === '_dashboard' && location.search === '?autoreload') {
      var body = document.getElementsByTagName('body')[0];
      var first_article = ss.ap.articles[0];
      var since_id = first_article.id.match(/^id-(\d+)$/)[1] || 0;
      var source = new EventSource('/stream?since_id=' + since_id);
      source.addEventListener('error', function() {
        source.close();
      }, false);
      source.addEventListener('message', function(event) {
        var articles = JSON.parse(event.data);
        articles.reverse();
        articles.forEach(function(article) {
          var template = first_article.cloneNode(true);
          var image = template.getElementsByTagName('img')[0];
          var blog_name = template.getElementsByClassName('blog_name')[0];
          var time = template.getElementsByTagName('time')[0];
          var a = template.getElementsByClassName('uri')[0];
          var form = template.getElementsByTagName('form')[0];
          var input = form.getElementsByTagName('input')[0];
          template.id = 'id-' + article.id;
          body.insertBefore(template, body.firstChild);
          if (article.reblogged) {
            template.setAttribute('class', 'reblogged');
          }
          image.setAttribute('src', article.photo_uri);
          blog_name.textContent = article.blog_name;
          time.textContent = new Date(article.date);
          time.setAttribute('datetime', article.date);
          a.textContent = article.uri;
          a.setAttribute('href', article.uri);
          form.setAttribute('action', '/_reblog/' + article.id);
          input.setAttribute('value', article.reblog_key);
        });
      }, false);
    }
  }, false);

  function toArray(obj) {
    return Array.prototype.slice.apply(obj);
  }

  function _e(self) {
    return function(event) {
      self['on' + event.type].call(self, event);
    };
  }

  function xhr(options, callback) {
    var self = this;
    var req = new XMLHttpRequest();
    req.addEventListener('readystatechange', function() {
      if (req.readyState !== XMLHttpRequest.DONE)
        return;
      var content_type = req.getResponseHeader('Content-type');
      var res = content_type.split(/\/|; /)[1] === 'json' ?
        JSON.parse(req.responseText) : req.responseXML;
      callback.call(self, res);
    }, false);
    req.open(options.method || 'GET', options.uri);
    req.send(options.form_data || null);
    return req;
  }
})(window, window.document, window.location);

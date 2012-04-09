/*!
 * YellowJS v0.5 - mobile framework
 * http://yellowjs.org
 */
(function() {

  my = {};

  //============================================================================
  // @method my.Class
  // @params body:Object
  // @params SuperClass:function, ImplementClasses:function..., body:Object
  // @return function
  my.Class = function() {

    var len = arguments.length;
    var body = arguments[len - 1];
    var SuperClass = len > 1 ? arguments[0] : null;
    var hasImplementClasses = len > 2;
    var Class, SuperClassEmpty;

    if (body.constructor === Object) {
      Class = function() {};
    } else {
      Class = body.constructor;
      delete body.constructor;
    }

    if (SuperClass) {
      SuperClassEmpty = function() {};
      SuperClassEmpty.prototype = SuperClass.prototype;
      Class.prototype = new SuperClassEmpty();
      Class.prototype.constructor = Class;
      Class.Super = SuperClass;
      extend(Class, SuperClass, false);
    }

    if (hasImplementClasses)
      for (var i = 1; i < len - 1; i++)
        extend(Class.prototype, arguments[i].prototype, false);    

    extendClass(Class, body);

    return Class;

  };

  //============================================================================
  // @method my.extendClass
  // @params Class:function, extension:Object, ?override:boolean=true
  var extendClass = my.extendClass = function(Class, extension, override) {
    if (extension.STATIC) {
      extend(Class, extension.STATIC, override);
      delete extension.STATIC;
    }
    extend(Class.prototype, extension, override)
  };

  //============================================================================
  var extend = function(obj, extension, override) {
    var prop;
    if (override === false) {
      for (prop in extension)
        if (!(prop in obj))
          obj[prop] = extension[prop];
    } else {
      for (prop in extension)
        obj[prop] = extension[prop];
      if (extension.toString !== Object.prototype.toString)
        obj.toString = extension.toString;
    }
  };

})();/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */
var Mustache = (typeof module !== "undefined" && module.exports) || {};

(function (exports) {

  exports.name = "mustache.js";
  exports.version = "0.5.0-dev";
  exports.tags = ["{{", "}}"];
  exports.parse = parse;
  exports.compile = compile;
  exports.render = render;
  exports.clearCache = clearCache;

  exports.to_html = render; // keep backwards compatibility

  var _toString = Object.prototype.toString;
  var _isArray = Array.isArray;
  var _forEach = Array.prototype.forEach;
  var _trim = String.prototype.trim;

  var isArray;
  if (_isArray) {
    isArray = _isArray;
  } else {
    isArray = function (obj) {
      return _toString.call(obj) === "[object Array]";
    };
  }

  var forEach;
  if (_forEach) {
    forEach = function (obj, callback, scope) {
      return _forEach.call(obj, callback, scope);
    };
  } else {
    forEach = function (obj, callback, scope) {
      for (var i = 0, len = obj.length; i < len; ++i) {
        callback.call(scope, obj[i], i, obj);
      }
    };
  }

  var spaceRe = /^\s*$/;

  function isWhitespace(string) {
    return spaceRe.test(string);
  }

  var trim;
  if (_trim) {
    trim = function (string) {
      return string == null ? "" : _trim.call(string);
    };
  } else {
    var trimLeft, trimRight;

    if (isWhitespace("\xA0")) {
      trimLeft = /^\s+/;
      trimRight = /\s+$/;
    } else {
      // IE doesn't match non-breaking spaces with \s, thanks jQuery.
      trimLeft = /^[\s\xA0]+/;
      trimRight = /[\s\xA0]+$/;
    }

    trim = function (string) {
      return string == null ? "" :
        String(string).replace(trimLeft, "").replace(trimRight, "");
    };
  }

  var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;'
  };

  function escapeHTML(string) {
    return String(string).replace(/&(?!\w+;)|[<>"']/g, function (s) {
      return escapeMap[s] || s;
    });
  }

  /**
   * Adds the `template`, `line`, and `file` properties to the given error
   * object and alters the message to provide more useful debugging information.
   */
  function debug(e, template, line, file) {
    file = file || "<template>";

    var lines = template.split("\n"),
        start = Math.max(line - 3, 0),
        end = Math.min(lines.length, line + 3),
        context = lines.slice(start, end);

    var c;
    for (var i = 0, len = context.length; i < len; ++i) {
      c = i + start + 1;
      context[i] = (c === line ? " >> " : "    ") + context[i];
    }

    e.template = template;
    e.line = line;
    e.file = file;
    e.message = [file + ":" + line, context.join("\n"), "", e.message].join("\n");

    return e;
  }

  /**
   * Looks up the value of the given `name` in the given context `stack`.
   */
  function findName(name, stack, returnNull) {
    if (name === ".") {
      return stack[stack.length - 1];
    }

    var names = name.split(".");
    var lastIndex = names.length - 1;
    var target = names[lastIndex];

    var value, context, i = stack.length, j, localStack;
    while (i) {
      localStack = stack.slice(0);
      context = stack[--i];

      j = 0;
      while (j < lastIndex) {
        context = context[names[j++]];

        if (context == null) {
          break;
        }

        localStack.push(context);
      }

      if (context && target in context) {
        value = context[target];
        break;
      }
    }

    // If the value is a function, call it in the current context.
    if (typeof value === "function") {
      value = value.call(localStack[localStack.length - 1]);
    }

    if (value == null && !returnNull)  {
      return "";
    }

    return value;
  }

  function sendSection(send, name, callback, stack, inverted) {
    var value =  findName(name, stack, true);

    if (inverted) {
      // From the spec: inverted sections may render text once based on the
      // inverse value of the key. That is, they will be rendered if the key
      // doesn't exist, is false, or is an empty list.
      if (value == null || value === false || (isArray(value) && value.length === 0)) {
        send(callback());
      }
    } else if (isArray(value)) {
      forEach(value, function (value) {
        stack.push(value);
        send(callback());
        stack.pop();
      });
    } else if (typeof value === "object") {
      stack.push(value);
      send(callback());
      stack.pop();
    } else if (typeof value === "function") {
      var scope = stack[stack.length - 1];
      var scopedRender = function (template) {
        return render(template, scope);
      };
      send(value.call(scope, callback(), scopedRender) || "");
    } else if (value) {
      send(callback());
    }
  }

  /**
   * Parses the given `template` and returns the source of a function that,
   * with the proper arguments, will render the template. Recognized options
   * include the following:
   *
   *   - file     The name of the file the template comes from (displayed in
   *              error messages)
   *   - tags     An array of open and close tags the `template` uses. Defaults
   *              to the value of Mustache.tags
   *   - debug    Set `true` to log the body of the generated function to the
   *              console
   *   - space    Set `true` to preserve whitespace from lines that otherwise
   *              contain only a {{tag}}. Defaults to `false`
   */
  function parse(template, options) {
    options = options || {};

    var tags = options.tags || exports.tags,
        openTag = tags[0],
        closeTag = tags[tags.length - 1];

    var code = [
      "var line = 1;", // keep track of source line number
      "\ntry {",
      '\nsend("'
    ];

    var spaces = [],      // indices of whitespace in code on the current line
        hasTag = false,   // is there a {{tag}} on the current line?
        nonSpace = false; // is there a non-space char on the current line?

    // Strips all space characters from the code array for the current line
    // if there was a {{tag}} on it and otherwise only spaces.
    var stripSpace = function () {
      if (hasTag && !nonSpace && !options.space) {
        while (spaces.length) {
          code.splice(spaces.pop(), 1);
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    };

    var sectionStack = [], updateLine, nextOpenTag, nextCloseTag;

    var setTags = function (source) {
      tags = trim(source).split(/\s+/);
      nextOpenTag = tags[0];
      nextCloseTag = tags[tags.length - 1];
    };

    var includePartial = function (source) {
      code.push(
        '");',
        updateLine,
        '\nvar partial = partials["' + trim(source) + '"];',
        '\nif (partial) {',
        '\n  send(render(partial, stack[stack.length - 1], partials));',
        '\n}',
        '\nsend("'
      );
    };

    var openSection = function (source, inverted) {
      var name = trim(source);

      if (name === "") {
        throw debug(new Error("Section name may not be empty"), template, line, options.file);
      }

      sectionStack.push({name: name, inverted: inverted});

      code.push(
        '");',
        updateLine,
        '\nvar name = "' + name + '";',
        '\nvar callback = (function () {',
        '\n  var buffer, send = function (chunk) { buffer.push(chunk); };',
        '\n  return function () {',
        '\n    buffer = [];',
        '\nsend("'
      );
    };

    var openInvertedSection = function (source) {
      openSection(source, true);
    };

    var closeSection = function (source) {
      var name = trim(source);
      var openName = sectionStack.length != 0 && sectionStack[sectionStack.length - 1].name;

      if (!openName || name != openName) {
        throw debug(new Error('Section named "' + name + '" was never opened'), template, line, file);
      }

      var section = sectionStack.pop();

      code.push(
        '");',
        '\n    return buffer.join("");',
        '\n  };',
        '\n})();'
      );

      if (section.inverted) {
        code.push("\nsendSection(send,name,callback,stack,true);");
      } else {
        code.push("\nsendSection(send,name,callback,stack);");
      }

      code.push('\nsend("');
    };

    var sendPlain = function (source) {
      code.push(
        '");',
        updateLine,
        '\nsend(findName("' + trim(source) + '", stack));',
        '\nsend("'
      );
    };

    var sendEscaped = function (source) {
      code.push(
        '");',
        updateLine,
        '\nsend(escapeHTML(findName("' + trim(source) + '", stack)));',
        '\nsend("'
      );
    };

    var line = 1, c, callback;
    for (var i = 0, len = template.length; i < len; ++i) {
      if (template.slice(i, i + openTag.length) === openTag) {
        i += openTag.length;
        c = template.substr(i, 1);
        updateLine = '\nline = ' + line + ';';
        nextOpenTag = openTag;
        nextCloseTag = closeTag;
        hasTag = true;

        switch (c) {
        case "!": // comment
          i++;
          callback = null;
          break;
        case "=": // change open/close tags, e.g. {{=<% %>=}}
          i++;
          closeTag = "=" + closeTag;
          callback = setTags;
          break;
        case ">": // include partial
          i++;
          callback = includePartial;
          break;
        case "#": // start section
          i++;
          callback = openSection;
          break;
        case "^": // start inverted section
          i++;
          callback = openInvertedSection;
          break;
        case "/": // end section
          i++;
          callback = closeSection;
          break;
        case "{": // plain variable
          closeTag = "}" + closeTag;
          // fall through
        case "&": // plain variable
          i++;
          nonSpace = true;
          callback = sendPlain;
          break;
        default: // escaped variable
          nonSpace = true;
          callback = sendEscaped;
        }

        var end = template.indexOf(closeTag, i);

        if (end === -1) {
          throw debug(new Error('Tag "' + openTag + '" was not closed properly'), template, line, options.file);
        }

        var source = template.substring(i, end);

        if (callback) {
          callback(source);
        }

        // Maintain line count for \n in source.
        var n = 0;
        while (~(n = source.indexOf("\n", n))) {
          line++;
          n++;
        }

        i = end + closeTag.length - 1;
        openTag = nextOpenTag;
        closeTag = nextCloseTag;
      } else {
        c = template.substr(i, 1);

        switch (c) {
        case '"':
        case "\\":
          nonSpace = true;
          code.push("\\" + c);
          break;
        case "\n":
          spaces.push(code.length);
          code.push("\\n");
          stripSpace(); // Check for whitespace on the current line.
          line++;
          break;
        default:
          if (isWhitespace(c)) {
            spaces.push(code.length);
          } else {
            nonSpace = true;
          }

          code.push(c);
        }
      }
    }

    if (sectionStack.length != 0) {
      throw debug(new Error('Section "' + sectionStack[sectionStack.length - 1].name + '" was not closed properly'), template, line, options.file);
    }

    // Clean up any whitespace from a closing {{tag}} that was at the end
    // of the template without a trailing \n.
    stripSpace();

    code.push(
      '");',
      "\nsend(null);", // Send null as the last operation.
      "\n} catch (e) { throw {error: e, line: line}; }"
    );

    // Ignore empty send("") statements.
    var body = code.join("").replace(/send\(""\);\n/g, "");

    if (options.debug) {
      if (typeof console != "undefined" && console.log) {
        console.log(body);
      } else if (typeof print === "function") {
        print(body);
      }
    }

    return body;
  }

  /**
   * Used by `compile` to generate a reusable function for the given `template`.
   */
  function _compile(template, options) {
    var args = "view,partials,send,stack,findName,escapeHTML,sendSection,render";
    var body = parse(template, options);
    var fn = new Function(args, body);

    // This anonymous function wraps the generated function so we can do
    // argument coercion, setup some variables, and handle any errors
    // encountered while executing it.
    return function (view, partials, callback) {
      if (typeof partials === "function") {
        callback = partials;
        partials = {};
      }

      partials = partials || {};

      var buffer = []; // output buffer

      var send = callback || function (chunk) {
        buffer.push(chunk);
      };

      var stack = [view]; // context stack

      try {
        fn(view, partials, send, stack, findName, escapeHTML, sendSection, render);
      } catch (e) {
        throw debug(e.error, template, e.line, options.file);
      }

      return buffer.join("");
    };
  }

  // Cache of pre-compiled templates.
  var _cache = {};

  /**
   * Clear the cache of compiled templates.
   */
  function clearCache() {
    _cache = {};
  }

  /**
   * Compiles the given `template` into a reusable function using the given
   * `options`. In addition to the options accepted by Mustache.parse,
   * recognized options include the following:
   *
   *   - cache    Set `false` to bypass any pre-compiled version of the given
   *              template. Otherwise, a given `template` string will be cached
   *              the first time it is parsed
   */
  function compile(template, options) {
    options = options || {};

    // Use a pre-compiled version from the cache if we have one.
    if (options.cache !== false) {
      if (!_cache[template]) {
        _cache[template] = _compile(template, options);
      }

      return _cache[template];
    }

    return _compile(template, options);
  }

  /**
   * High-level function that renders the given `template` using the given
   * `view`, `partials`, and `callback`. The `callback` is used to return the
   * output piece by piece, as it is rendered. When finished, the callback will
   * receive `null` as its argument, after which it will not be called any more.
   * If no callback is given, the complete rendered template will be used as the
   * return value for the function.
   *
   * Note: If no partials are needed, the third argument may be the callback.
   * If you need to use any of the template options (see `compile` above), you
   * must compile in a separate step, and then call that compiled function.
   */
  function render(template, view, partials, callback) {
    return compile(template)(view, partials, callback);
  }

})(Mustache);var Lawnchair=function(){if(!JSON)throw"JSON unavailable! Include http://www.json.org/json2.js to fix.";if(arguments.length<=2&&arguments.length>0)var a=typeof arguments[0]==="function"?arguments[0]:arguments[1],c=typeof arguments[0]==="function"?{}:arguments[0];else throw"Incorrect # of ctor args!";if(typeof a!=="function")throw"No callback was provided";var e=!(this instanceof Lawnchair)?new Lawnchair(c,a):this;e.record=c.record||"record";e.name=c.name||"records";var b;if(c.adapter){b=Lawnchair.adapters[e.indexOf(Lawnchair.adapters,
c.adapter)];b=b.valid()?b:undefined}else for(var d=0,f=Lawnchair.adapters.length;d<f;d++)if(b=Lawnchair.adapters[d].valid()?Lawnchair.adapters[d]:undefined)break;if(!b)throw"No valid adapter.";for(var g in b)e[g]=b[g];d=0;for(f=Lawnchair.plugins.length;d<f;d++)Lawnchair.plugins[d].call(e);e.init(c,a);return e};Lawnchair.adapters=[];
Lawnchair.adapter=function(a,c){c.adapter=a;var e="adapter valid init keys save batch get exists all remove nuke".split(" "),b=this.prototype.indexOf,d;for(d in c)if(b(e,d)===-1)throw"Invalid adapter! Nonstandard method: "+d;Lawnchair.adapters.push(c)};Lawnchair.plugins=[];Lawnchair.plugin=function(a){for(var c in a)c==="init"?Lawnchair.plugins.push(a[c]):this.prototype[c]=a[c]};
Lawnchair.prototype={isArray:Array.isArray||function(a){return Object.prototype.toString.call(a)==="[object Array]"},indexOf:function(a,c,e,b){if(a.indexOf)return a.indexOf(c);e=0;for(b=a.length;e<b;e++)if(a[e]===c)return e;return-1},lambda:function(a){return this.fn(this.record,a)},fn:function(a,c){return typeof c=="string"?new Function(a,c):c},uuid:function(){var a=function(){return((1+Math.random())*65536|0).toString(16).substring(1)};return a()+a()+"-"+a()+"-"+a()+"-"+a()+"-"+a()+a()+a()},each:function(a){var c=
this.lambda(a);if(this.__results){a=0;for(var e=this.__results.length;a<e;a++)c.call(this,this.__results[a],a)}else this.all(function(b){for(var d=0,f=b.length;d<f;d++)c.call(this,b[d],d)});return this}};
Lawnchair.adapter("dom",{valid:function(){return!!window.Storage},init:function(a,c){this.storage=window.localStorage;var e=this;this.indexer={key:e.name+"._index_",all:function(){JSON.parse(e.storage.getItem(this.key))==null&&e.storage.setItem(this.key,JSON.stringify([]));return JSON.parse(e.storage.getItem(this.key))},add:function(b){var d=this.all();d.push(b);e.storage.setItem(this.key,JSON.stringify(d))},del:function(b){for(var d=this.all(),f=[],g=0,h=d.length;g<h;g++)d[g]!=b&&f.push(d[g]);e.storage.setItem(this.key,
JSON.stringify(f))},find:function(b){for(var d=this.all(),f=0,g=d.length;f<g;f++)if(b===d[f])return f;return false}};c&&this.fn(this.name,c).call(this,this)},save:function(a,c){var e=a.key||this.uuid();this.indexer.find(e)||this.indexer.add(e);delete a.key;this.storage.setItem(e,JSON.stringify(a));if(c){a.key=e;this.lambda(c).call(this,a)}return this},batch:function(a,c){for(var e=[],b=0,d=a.length;b<d;b++)this.save(a[b],function(f){e.push(f)});c&&this.lambda(c).call(this,e);return this},keys:function(){callback&&
this.lambda(callback).call(this,this.indexer.all())},get:function(a,c){if(this.isArray(a)){for(var e=[],b=0,d=a.length;b<d;b++){var f=JSON.parse(this.storage.getItem(a[b]));if(f){f.key=a[b];e.push(f)}}c&&this.lambda(c).call(this,e)}else{if(f=JSON.parse(this.storage.getItem(a)))f.key=a;c&&this.lambda(c).call(this,f)}return this},all:function(a){for(var c=this.indexer.all(),e=[],b,d=0,f=c.length;d<f;d++){b=JSON.parse(this.storage.getItem(c[d]));b.key=c[d];e.push(b)}a&&this.fn(this.name,a).call(this,
e);return this},remove:function(a,c){var e=typeof a==="string"?a:a.key;this.indexer.del(e);this.storage.removeItem(e);c&&this.lambda(c).call(this);return this},nuke:function(a){this.all(function(c){for(var e=0,b=c.length;e<b;e++)this.remove(c[e]);a&&this.lambda(a).call(this)});return this}});
Lawnchair.adapter("window-name",function(a,c){var e=window.top.name?JSON.parse(window.top.name):{};return{valid:function(){return typeof window.top.name!="undefined"},init:function(b,d){e[this.name]={index:[],store:{}};a=e[this.name].index;c=e[this.name].store;this.fn(this.name,d).call(this,this)},keys:function(b){this.fn("keys",b).call(this,a);return this},save:function(b,d){var f=b.key||this.uuid();b.key&&delete b.key;this.exists(f,function(g){g||a.push(f);c[f]=b;window.top.name=JSON.stringify(e);
if(d){b.key=f;this.lambda(d).call(this,b)}});return this},batch:function(b,d){for(var f=[],g=0,h=b.length;g<h;g++)this.save(b[g],function(i){f.push(i)});d&&this.lambda(d).call(this,f);return this},get:function(b,d){var f;if(this.isArray(b)){f=[];for(var g=0,h=b.length;g<h;g++)f.push(c[b[g]])}else if(f=c[b])f.key=b;d&&this.lambda(d).call(this,f);return this},exists:function(b,d){this.lambda(d).call(this,!!c[b]);return this},all:function(b){for(var d=[],f=0,g=a.length;f<g;f++){var h=c[a[f]];h.key=a[f];
d.push(h)}this.fn(this.name,b).call(this,d);return this},remove:function(b,d){for(var f=this.isArray(b)?b:[b],g=0,h=f.length;g<h;g++){delete c[f[g]];a.splice(this.indexOf(a,f[g]),1)}window.top.name=JSON.stringify(e);d&&this.lambda(d).call(this);return this},nuke:function(b){storage={};a=[];window.top.name=JSON.stringify(e);b&&this.lambda(b).call(this);return this}}}());
/**
 * Provides utils method
 * via an instance
 *
 * @requires [description]
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
var pline, oo;
oo = pline = (function (window) {

    var _globalConfig = {
        templateEngine: 'mustache',
        viewportSelector: 'body',
        pushState : false,
        scroll : 'iscroll'
    };

    return {
        /**
         * @var {oo.net.Ajax} _ajaxRequestObject instance of oo.net.Ajax class
         */
        _ajaxRequestObject: null,

        /**
         * proxy to the my.Class
         * @see my.Class
         */
        Class: function Class () {
            return my.Class.apply(this, arguments);
        },

        /**
         * use oo.log instead of console.log
         *
         * @param {string} data - the data to log
         *
         * @return void
         */
        log: function log (data) {
            if (window.console && window.console.log) {
                var msg = ('string' !== typeof data && 'toString' in data) ? data.toString() : data;
                console.log(data.toStirng());
            }
        },

        /**
         * use oo.warn instead of console.warn
         *
         * @param {string} data - the data to log
         *
         * @return {void}
         */
        warn: function warn (data) {
            var msg = ('string' !== typeof data && 'toString' in data) ? data.toString() : data;
            if (window.console && window.console.warn) {
                console.warn(msg);
            } else {
                oo.log('/!\\ Warning : ' + msg);
            }
        },

        /**
         * create, if needed, and return a "namespaced object"
         *
         * @todo implement the base parameter
         *
         * @param {string} ns - the namespace name (with dot notation)
         * @param {object} base - the described namesape scope
         * @return {object}
         */
        getNS: function getNS (ns, base) {
            var names = ns.split('.');
            var parent = window;
            for (var i=0, len=names.length; i<len; i++) {
                    if ('object' != typeof(parent[names[i]]) ) {
                            parent[names[i]] = {};
                    }
                    
                    parent = parent[names[i]];
            }
            return parent;
        },

        /**
         * bind a scope to a function
         *
         * @param {function} fn - the function to be scoped
         * @param {object} sopce - the desired scope
         * @return {function}
         */
        createDelegate: function createDelegate (fn, scope) {
            return function () {
                return fn.apply(scope, arguments);
            };
        },

        /**
         * empty function
         * @return {void}
         */
        emptyFn: function emptyFn () { },

        /**
         * returns a unique identifier (by way of Backbone.localStorage.js)
         * @return {string}
         */
        generateId: function generateId (tagName) {
            var S4 = function () {
                return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            };

            return ['id-', S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4()].join('');
        },

        /**
         * mix two object in one, the second override the first one
         * @return {object}
         */
        override: function override (obj, ext) {
            var propNames = Object.getOwnPropertyNames(ext);
            propNames.forEach(function(name){
                var desc = Object.getOwnPropertyDescriptor(ext, name);
                Object.defineProperty(obj, name, desc);
            });

            return obj;
        },

        /**
         * create a controller from the class passed in parameter
         */
        createController: function createController(identifier, actions) {

            if (1 === arguments.length) {
                actions = identifier;
                identifier = null;
            }

            if(!actions && ( 'object' !== typeof actions)){
                throw new Error('Wrong parameter');
            }

            // force the class contructor to call its parent contrustor
            var Tmp = actions.constructor = function () {
                Tmp.Super.call(this);
            };

            var c = oo.Class(oo.router.Controller, actions);

            if (identifier)
                this.getRouter().addController(identifier, c);

            return c;
        },
        /**
         * make the router singleton instance accessible from anywhere
         * @return {oo.router.Router}
         */
        getRouter: function getRouter() {
            return oo.router.router || ( oo.router.router = new oo.router.Router());
        },

        /**
         * should not be called without a good reason ;)
         * instanciate the singleton viewport's instance
         *
         * @param  {string} identifier css query qelector to define the root node of the viewport
         * @return {oo.view.Viewport}
         */
        initViewport: function initViewport(identifier) {
            var ns = this.getNS('oo.view'),
                v = ns.viewport = new ns.Viewport(identifier);
            return v;
        },
        /**
         * get the singleton instance of the Viewport class
         *
         * @return {oo.view.Viewport}
         */
        getViewport: function getViewport() {
            var ns = this.getNS('oo.view');
            if (ns.viewport) {
                return ns.viewport;
            } else {
                return this.initViewport();
            }
        },

        /**
         * create a panel class and register it into the viewport registry
         * @todo  change the name of this method for a more consistent api - addPanel?
         *
         * @param  {object} panel      a litteral object that describe your panel class
         * @param  {bool} noRegister   disable auto registering into the viewport
         * @return {function}          the class of your panel - should not be used without a good reason ;)
         */
        createPanelClass: function createPanelClass(panel, noRegisterOrConf) {
            if (!(typeof panel == 'object' && 'id' in panel))
                throw 'Wrong parameter';

            var id = panel.id; delete panel.id;

            // force the class contructor to call its parent contrustor
            var Tmp = panel.constructor = function () {
                Tmp.Super.call(this);
            };
            var p = oo.Class(oo.view.Panel, panel);

            if (noRegisterOrConf !== false) {
                noRegisterOrConf || (noRegisterOrConf = {});
                oo.getViewport().register(id, p, noRegisterOrConf.stage || null, noRegisterOrConf.pos || null);
            }
                
            
            return p;
            
        },

        /**
         * @deprecated
         * @see  createPanelClass
         */
        createPanel: function createPanel(panel, noRegister) {
            console.warn('This method is deprecated, use oo.createPanelClass() instead');
            return this.createPanelClass.apply(this, arguments);
        },

        /**
         * create a model object and register it, the return value should not be used directly
         * @todo  add Model's config object documentation
         *
         * @param  {object} model key/value pair object to configure your model
         * @return {oo.data.Model}
         */
        createModel : function createModel(model){
            var m = new oo.data.Model(model);
            oo.data.Model.register(m);
            return m;
        },

        /**
         * get a model instance with ite registration id
         *
         * @param  {[type]} id [description]
         * @return {[type]}    [description]
         */
        getModel : function getModel(id){
            return oo.data.Model.get(id);
        },

        /**
         * create any UI element
         *
         * @param  {string} type the type of UI component you want to create
         * @param  {object} opt  key/value pair to configure your UI component
         * @return {oo.view.Element} an instance of the desired UI component class
         */
        createElement : function createElement(type, opt){
            return new ( oo.view.Element.get(type))(opt || null);
        },

        /**
         * define values for global configuration
         *
         * @param  {object} opt literal object containing key and associated values
         * @return {void}
         */
        define : function define(opt){
            this.override(_globalConfig, opt);
        },

        /**
         * get the value associated with the given key from the global configuration
         *
         * @param  {string} key the key to match in the global configuration
         * @return {string|number|bool}
         */
        getConfig : function getConfig(key){
            if (key && key in _globalConfig)
                return _globalConfig[key];
            else
                return _globalConfig;
        },

        /**
         * the entry point of your application
         * this method takes as parameter a callback that will be called
         * either when 'phonegapready' event is triggered or if phonegap
         * is not available, when the 'load' event is triggered by the
         * window object
         *
         * @param  {function} fn [description]
         * @return {void}
         */
        bootstrap: function bootstrap (fn) {
            if (typeof fn !== 'function')
                throw "parameter must be a function";

            var _this = this;
            function start () {
                // hide address bar
                window.scroll(0,0);

                // prevent page scrolling
                document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

                fn.call(window, _this);
            }

            if ('PhoneGap' in window && PhoneGap.available)
                document.addEventListener('deviceready', start);
            else
                window.addEventListener('load', start);
        },

        /**
         * provide an easy way to do ajax call
         *
         * @param  {string} url               the target url
         * @param  {string} method            use POST or GET HTTP method
         * @param  {object} params            data to send
         * @param  {function} successCallback callback in case of success
         * @param  {function} errorCallback   callback in case of failure
         * @return {void}
         */
        ajax: function ajax (url, method, params, successCallback, errorCallback) {

            // nicer api
            // if called without argument, it returns an object with
            // get and a post methods that are currying of the current
            // ajax method
            if(0 === arguments.length)
                return {
                    post: function (url, parameters, successCallback, errorCallback) { oo.ajax(url, 'post', parameters, successCallback, errorCallback); },
                    get: function (url, parameters, successCallback, errorCallback) { oo.ajax(url, 'get', parameters, successCallback, errorCallback); }
                };

            if (null === this._ajaxRequestObject) {
                this._ajaxRequestObject = new oo.core.net.Ajax();
            }

            var req = this._ajaxRequestObject.buildReq(url, method, params, successCallback, errorCallback);
            req.send();

        },
        
        _convertNodeListToArray : function _convertNodeListToArray(nL){
            return Array.prototype.slice.call(nL, 0);
        },

        /**
         * utility method that converts an object to a string (http protocol compliant)
         *
         * @param  {object} paramObj a key/value object
         * @return {string}
         */
        serialize: function _processParams (paramObj) {
            var paramArrayString = [];
            for (var prop in paramObj) {
                paramArrayString.push(prop + '=' + encodeURI( (typeof paramObj[prop] == 'object' ? paramObj[prop].toString() : paramObj[prop]) ));
            }
            return paramArrayString.join('&');
        },

        /**
         * utility method with fallback to test if a given object is an array
         * @param  {[type]}  param [description]
         * @return {Boolean}       [description]
         */
        isArray: function isArray (obj) {
            var _isArray = Array.isArray;
            if (_isArray) {
                return _isArray(obj);
            } else {
                return obj.prototype.toString() === "[object Array]";
            }
        }

    };

})(window);
/**
 * Contains class for event management
 *
 * @namespace oo.core.mixins
 * @class Events
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 * @author Claire Sosset <claire.sosset@gmail.com> || @Claire_So
 */
(function (oo) {
    
    //var listeners = {};
    
    //var Events = {};
    
    var global = this;
    
    /**
     * @internal create an object to wrap infos about the listener
     * @param  {} listener [description]
     * @return {[type]}          [description]
     */
    function buildListenerConf(listener) {
        var listenerConf;
        if (typeof listener == 'object' && listener.sc && listener.fn) {
            listenerConf = {fn:listener.fn, sc: listener.sc};
        } else {
            listenerConf = {fn:listener, sc: global};
        }

        return listenerConf;
    }

    var Events = oo.getNS('oo.core.mixins').Events = oo.Class({

        /**
         * get a singleton instance of the listeners array
         */
        _getListenersArray : function _getListenersArray () {
            if (!this._listeners)
                this._listeners = {};

            return this._listeners;
        },
        /**
         * register a listener for a given event name
         *
         * @param {string} eventName the name of the evant - in almost all cases use a provided constant
         * @param {function} listener  [description]
         */
        addListener : function addListener(eventName, listener){
            var l = this._getListenersArray();
            if (!l[eventName]){
                l[eventName] = [];
            }

            var listenerConf = buildListenerConf(listener);

            l[eventName].push(listenerConf);

        },
        /**
         * unregister a/all listener(s) attached to a given event name
         * @todo : to debug - objects provided can not be strictly equal because each is instanciated seperately.
         *
         * @param  {string} eventName the name of the event - in almost all cases use a provided constant
         * @param  {function|object} listener  a particular listener to remove, if none provided consider all registered listeners for the event
         * @return {void}
         */
        removeListener : function removeListener(eventName, listener) {
            var l = this._getListenersArray();

            if (l[eventName]){
                var listenerConf = buildListenerConf(listener);
                var index = l[eventName].indexOf(listenerConf);
                if (-1 != index) {
                    l[eventName].splice(index, 1);
                }
            }
        },
        /**
         * the folowing signature is deprecated - sender is not taken into account anymore
         * trigerEvent(eventName, sender, params)
         *
         * use this one instead
         * trigerEvent(eventName, params)
         */
        triggerEvent : function triggerEvent(eventName, params){
            // backward compatibility
            if ((typeof params != 'array') && 3 == arguments.length) {
                params = arguments[2];
            }

            var l = this._getListenersArray();

            if (l[eventName]){
                for (var i = 0, len = l[eventName].length; i<len; i++) {
                    var listener = l[eventName][i];

                    listener.fn.apply(listener.sc, params);
                }
            }
        }
    });
        
})(oo || {});/**
 * Contains class for scroll
 *
 * @namespace oo.core.mixins
 * @class Scroll
 *
 * @author Claire Sosset <claire.sosset@gmail.com> || @Claire_So
 */
(function (oo) {
    
    var global = this;
    
    var Scroll = oo.getNS('oo.core.mixins').Scroll = oo.Class({
        isScrollable:false,
        /**
         * create a scroll instance according to the configured scroll adapter instance
         *
         * @param  {object} opt option passed to the scroll constructor
         * @return {oo.view.scroll.Scroll}
         */
        _createScroll : function _createScoll (opt) {
            if (null === this.scroll){
                if(undefined === opt){
                    opt = {};
                }

                if(!opt.hasOwnProperty("el")){
                    opt.el = this;
                }

                return new (oo.view.scroll.Scroll.get(oo.getConfig('scroll')))(opt);
            }
        
        },
        /**
         * [setScrollable description]
         * @param {[type]} opt [description]
         */
        setScrollable : function setScrollable(opt){
            this.scroll = null;
            this.scroll = this._createScroll(opt);
            var that = this;
            this.addListener(oo.view.Element.REFRESH_CONTENT, function () {
                that.scroll.refresh();
            });
            this.isScrollable = true;
        }
    });
        
})(oo || {});/**
 * Contains static helper for touch management
 *
 * @namespace oo.core
 * @class Touch
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
(function (oo) {

    /**
     * detect if we are on a touch context
     *
     * @private
     * @type {bool}
     */
    var hasTouch = 'ontouchstart' in window ? true : false;

    /**
     * returns an array of two element the first is the horizontal position and the second is the vertical position
     *
     * @private
     * @param  {Event} e   the event object
     * @param  {int} index which finger? ;)
     * @return {array}
     */
    var getPosition = function getPosition (e, index) {
        var touch = null;
         
        if (Touch.HAS_TOUCH) {
            index = index || 0;
         
            touch = e.touches[index];
            if (undefined === touch) {
                touch = e.changedTouches[index];
            }
        } else {
            touch = e;
        }
         
        return [parseInt(touch.pageX, 10), parseInt(touch.pageY, 10)];
         
    };
     
    var Touch = oo.Class({
        STATIC : {
            /**
             * get the touch position
             * @see getPosition()
             *
             * @type {function}
             */
            getPosition : getPosition,

            /**
             * get the touch X position
             *
             * @param  {Event} e   the event object
             * @param  {int} index which finger? ;)
             * @return {int}
             */
            getPositionX : function getPositionX(e, index) {
                return getPosition(e, index)[0];
            },

            /**
             * get the touch Y position
             *
             * @param  {Event} e   the event object
             * @param  {int} index which finger? ;)
             * @return {int}
             */
            getPositionY : function getPositionY(e, index){
                return getPosition(e, index)[1];
            },
            
            /**
             * get the target property
             *
             * @param  {Event} e   the event object
             * @param  {int} index which finger? ;)
             * @return {int}
             */
            getTarget : function getTarget(e, index) {
                return e.touches[index || 0].target;
            },
            
            /**
             * if the context "HAS_TOUCH"
             * @type {bool}
             */
            HAS_TOUCH : 'ontouchstart' in window ? true : false
        }
    });
     
    if (!Touch.HAS_TOUCH) {
        Touch.EVENT_START = 'mousedown';
        Touch.EVENT_MOVE  = 'mousemove';
        Touch.EVENT_END   = 'mouseup';
    } else {
        Touch.EVENT_START = 'touchstart';
        Touch.EVENT_MOVE  = 'touchmove';
        Touch.EVENT_END   = 'touchend';
    }
     
    var exports = oo.getNS('oo.core');
    exports.Touch = Touch;
         
})(oo || {});
/**
 * Helper for ajax request
 *
 * @class Ajax
 * @namespace oo.core.net
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 * @author Claire Sosset <claire.sosset@gmail.com> || @Claire_So
 */
(function (oo) {
    
    var global = this;
    
    var Ajax = oo.getNS('oo.core.net').Ajax = oo.Class({
        /**
         * create a ajax request object
         *
         * @param  {string} url               the target url
         * @param  {string} method            the hhtp method 'get' or 'post'
         * @param  {object} params            parameters to send
         * @param  {function} successCallback callback function in case of success
         * @param  {function} errorCallback   callback function in case of error
         * @return {object}                   an object with only one method "send"
         */
        buildReq: function _buildReq (url, method, params, successCallback, errorCallback) {
            var req = this._getRequest();
            method = method.toUpperCase();

            req.addEventListener('readystatechange', function (e) {
                if (e.target.readyState==4) {
                    if (e.target.status == 200) {
                        
                        // @todo : check against response content-type header to determine if is JSON formatted response
                        var str = JSON.parse(e.target.responseText);
                        
                        successCallback.call(global, str);
                    }
                    else
                        errorCallback.call(global);
                }
            });

            var paramString = this._processParams(params), targetUrl = url;
            if (method == 'GET' && '' !== paramString) {
                if (targetUrl.indexOf('?') === -1)
                    targetUrl += ('?' + paramString);
                else
                    targetUrl += ('&' + paramString);
            }

            req.open(method, targetUrl);
            if ('POST' == method)
                this._setPostHeaders(req);

            return {
                send: function send() {
                    if ('POST' === method) {
                        req.send(paramString);
                    }
                    else
                        req.send();
                }
            };
        },

        /**
         * get a native XMLHttpRequest
         *
         * @return {XMLHttpRequest}
         */
        _getRequest: function _getRequest () {
            return new XMLHttpRequest();
        },

        /**
         * converts an object to a string http protocol compliant
         *
         * @param  {object} paramObj a key/value object
         * @return {string}
         */
        _processParams: function _processParams (paramObj) {
            return oo.serialize(paramObj);
        },
        
        /**
         * add the http headers needed to build a proper "post request"
         * @param {[type]} req [description]
         */
        _setPostHeaders: function _setPostHeaders (req) {
            req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            // Unsafe header
            // req.setRequestHeader('Connection', 'close');
        }
    });

})(oo);/**
 * Contains class for gesture management
 *
 * @class Gesture
 * @namespace oo.core
 *
 * @author Claire Sosset <claire.sosset@gmail.com> || @claire_so
 */
(function (oo) {
    var Touch = oo.core.Touch;
    var Gesture = oo.getNS('oo.core').Gesture = oo.Class({
        constructor : function constructor(){
            var that = this;
            //attach events to document
            document.addEventListener(Touch.EVENT_START, function(e){
                that.startGesture.call(that, e);
            }, false);
            
            document.addEventListener(Touch.EVENT_MOVE, function(e){
                e.preventDefault();
                that.moveGesture.call(that, e);
            }, false);
            
            document.addEventListener(Touch.EVENT_END, function(e){
                that.stopGesture.call(that, e);
            }, false);
        },
        getPos : function getPos(e){
            var coords = {
                x : null,
                y : null
            };

            if (Touch.HAS_TOUCH) {
                if (event.touches.length == 1){
                    //one finger
                    coords.x = event.touches[0].pageX;
                    coords.y = event.touches[0].pageY;
                }
            } else {
                coords.x = event.pageX;
                coords.y = event.pageY;
            }

            return coords;
        },
        getXPos : function getXPos(event) {
           var coords = this.getPos(event);

           return coords.x;
        },
        getYPos : function getYPos(event) {
           var coords = this.getPos(event);

           return coords.y;
        },
        touchFlags : {
            el : null, startTime : null, stopTime : null, hasMoved : false, startX : null, startY : null, lastX : null, lastY : null, time : 150, timeout : null, doubleTap : false
        },
        startGesture : function startGesture(e){
            this.touchFlags.el = e.target;
            this.touchFlags.startTime = Date.now();
            this.touchFlags.hasMoved = false;
            this.touchFlags.startX = this.getXPos(e);
            this.touchFlags.startY = this.getYPos(e);
 
            if ( (this.touchFlags.startTime - this.touchFlags.stopTime) < this.touchFlags.time){
                this.touchFlags.doubleTap = true;
                window.clearTimeout(this.touchFlags.timeout);
            } else {
                this.touchFlags.doubleTap = false;
            }
        },
        moveGesture : function moveGesture(e){
            //condition cause mousemove
            if (this.touchFlags.startTime){
                this.touchFlags.lastX = this.getXPos(e);
                this.touchFlags.lastY = this.getYPos(e);
                this.touchFlags.hasMoved = true;
            }
        },
        stopGesture : function stopGesture(e){
            var that = this;

            this.touchFlags.stopTime = Date.now();

            if (this.touchFlags.hasMoved){
                var deltaX = this.touchFlags.lastX - this.touchFlags.startX,
                    deltaY = this.touchFlags.lastY - this.touchFlags.startY;

                if ( (Event.HAS_TOUCH && event.targetTouches.length == 1) || !Event.HAS_TOUCH ){
                    if (Math.abs(deltaX) > 30 && Math.abs(deltaY) < 100 ) {
                        if ( deltaX > 0 ) {
                            this.fireEvent(that.touchFlags.el, "swipeLeft", true, true);
                        } else {
                            this.fireEvent(that.touchFlags.el, "swipeRight", true, true);
                        }
                    }
                }
            } else {
               //https://github.com/madrobby/zepto/blob/master/src/touch.js
               that.touchFlags.timeout = window.setTimeout(function(){
                   that.touchFlags.timeout = null;

                   if ( that.touchFlags.doubleTap){
                       that.fireEvent(that.touchFlags.el, "doubleTap", true, true);
                   } else {
                       that.fireEvent(that.touchFlags.el, "tap", true, true);
                   }
               },this.touchFlags.time);
    
            }
            
            that.touchFlags.lastX = that.touchFlags.lastY = that.touchFlags.startX = that.touchFlags.startY = null;

        },
        fireEvent : function fireEvent(target, name, bubble, cancelable){
            //create each Time the event ?
            var evt = document.createEvent('Events');
            evt.initEvent(name, bubble, cancelable);
            //evt.customData = "my custom data"
            target.dispatchEvent(evt);
        }
    });
    
    
    var gesture = new Gesture();
    oo.getNS('oo.core').gesture = gesture;
        
})(oo || {});/**
 * Base class to implement controllers logic
 *
 * @namespace oo.router
 * @class Controller
 * @requires oo.view.Viewport
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
(function(oo){

    var Controller = oo.getNS('oo.router').Controller = oo.Class({
        _controllers : {},
        // protected
        _viewport: null,
        constructor : function constructor(){
            this._viewport = oo.getViewport();
        },
        // deprecated - use the class member instead
        getViewport: function getViewport() {
            return oo.getViewport();
        }
    });
 
})(oo || {});
/**
 * Class providing url routing logic
 * handle management of history API
 *
 * @namespace oo
 * @class Router
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
(function(oo){

    var Router = oo.getNS('oo.router').Router = oo.Class({
        constructor : function constructor(){
            this._routes = {};
            this._registeredControllers = {};
            this._controllers = {};

            var that = this;

        },
        _usePushState : function _usePushState(){
          return oo.getConfig('pushState');
        },
        addRoutes : function addRoutes(routes){
            if(!routes || (Object.prototype.toString.call( routes ) !== '[object Object]')){
                throw new Error('Routes must exist and must be an object literal');
            }

            for (var prop in routes){
                this.addRoute(prop, routes[prop]);
            }
        },
        addRoute : function addRoute(name, props){
            if(!name || !props.hasOwnProperty('url') || !props.hasOwnProperty('controller') || !props.hasOwnProperty('action')){
                throw new Error('A route must have a name and properties "url", "controller" and "action"');
            }

            if(!this.isValidUrl(props.url)){
                throw new Error('The url property must begun by "/"');
            }

            var r = {};
            r[name] = props;

            this._routes = oo.override(this._routes, r);

            delete r[name];
        },
        isValidUrl : function isValidUrl(url){
            return( '/' === url.slice(0,1));
        },
        /*
         * @name : String
         * @cls : oo.router.Controller
         */
        addController : function addController(name, cls){
            if(!name || ('string' !== typeof name)){
                throw new Error('Wrong "name" parameter : Must exist and be a string');
            }

            if('function' !== typeof cls){
                throw new Error('Wrong "cls" parameter : Must be a function');
            }
            var obj = {};
            obj[name] = cls;
            this._controllers = oo.override(this._controllers,obj);
        },
        addControllers : function addControllers(cList){
            if(!cList || (Object.prototype.toString.call( cList ) !== '[object Object]')){
                throw new Error('Wrong parameter : must exist and be an object');
            }

            for(var prop in cList){
                this.addController(prop, cList[prop]);
            }
        },
        init : function init(){
            var that = this, wl = window.location, f = false;


            var callback = function callback(route){
              that.dispatch(route);
            };

            if( this._usePushState() && window.history && window.history.pushState){
              this.hasHistory = true;
              window.addEventListener('popstate',function(event){
                 f = true;
                 callback(wl.pathname);
              });
            
              //setTimeout force fire popstate
              window.setTimeout(function(){
                if(!f){
                  that.dispatch(wl.pathname);
                }
              },1);
            } else {
              window.addEventListener("hashchange", function(e) {
                  callback(wl.hash.slice(1));
              }, false);

              callback(wl.hash.slice(1));
            }
        },
        load : function load(route){
            if( !this._usePushState() || !this.hasHistory){
              window.location.hash = route;
            } else {
              history.pushState({},"",route);
              //this.dispatch(route);
            }
        },
        dispatch: function dispatch (hash) {
            this.parseRoute(hash);
            if (this.requestParams) {
                var ctrlClass   = [this.requestParams.controller.charAt(0).toUpperCase(), this.requestParams.controller.substring(1), 'Controller'].join('');
                var actionMethod = [this.requestParams.action, 'Action'].join('');

                var ctrl;


                if ( (typeof this._registeredControllers[ctrlClass] !== 'function') && ("undefined" !== typeof this._controllers[ctrlClass])) {
                    if ('undefined' === typeof this._registeredControllers[ctrlClass]) {
                        this._registeredControllers[ctrlClass] = new this._controllers[ctrlClass]();
                    }
                    ctrl = this._registeredControllers[ctrlClass];

                    if (typeof ctrl[actionMethod] === 'function') {
                        ctrl[actionMethod](this.requestParams.params);
                    }
                }
            }
        },
        parseRoute: function parseRoute (route) {
            var routes = this._routes;
            var routeObject = null;
            
            for(var keyr in routes) {
               var r = routes[keyr];
                if (r.url == route.substring(0, r.url.length)) {
                    routeObject = {
                        controller: r.controller,
                        action    : r.action
                    };
                    route = route.substring(r.url.length);
                }
            }
            
            if ('/' == route.substring(0,1)) {
                route = route.slice(1);
            }
            
            var parts = route.split('/');

            if (!routeObject) {
                routeObject = {
                    controller: parts[0],
                    action    : parts[1]
                };
                
                if (!routeObject.controller) {
                    routeObject.controller = 'index';
                } else {
                    parts.shift();
                }

                if (!routeObject.action || routeObject.action === undefined) {
                    routeObject.action = 'index';
                } else {
                    parts.shift();
               }
            }

            routeObject.params = {};
            while (parts.length) {
                paramName = parts.shift();
                if (paramName) {
                    paramValue = parts.shift();
                    if (paramValue !== undefined) {
                        routeObject.params[paramName] = paramValue;
                    }
                }
            }

            this.requestParams = routeObject;

            return routeObject;
        },
        url: function url (routeName, params) {
            var route = this._routes[routeName];
            if (!route) {
                throw Error('route name doesn\'t exists');
            }
            
            var paramsUrl = '';
            
            for (var paramName in params) {
                paramsUrl = [paramsUrl, '/', paramName, '/', params[paramName]].join('');
            }
            return [route.url, paramsUrl].join('');
        },
        back : function back(){
            history.back();
        }
        
    });

})(oo || {});
var oo = (function (oo) {
    
    var global = this;
    var data = oo.getNS('oo.data');

    var providerRepository = {};

    data.Provider = oo.Class({
        STATIC: {
            register: function register (cls, codename) {
                if (providerRepository[codename])
                    throw 'Already existing codename';

                providerRepository[codename] = cls;
            },
            get: function get (codename) {
                if (codename in providerRepository)
                    return providerRepository[codename];
                else
                    throw 'Invalid codename for a provider';
            },
            unregister: function register (codename) {
                delete providerRepository[codename];
            }
        },
        _name: '',
        _data: {},
        constructor: function (options) {
            if (options && 'name' in options && typeof options.name == 'string')
                this._name = options.name;
            else
                throw 'Config object must contain a name property';
        },
        save: function (callback) {
            throw 'Can\'t be called directly from Provider class';
        },
        fetch: function (callback) {
            throw 'Can\'t be called directly from Provider class';
        },
        get: function (callback) {
            throw 'Can\'t be called directly from Provider class';
        },
        clearAll: function (callback) {
            throw 'Can\'t be called directly from Provider class';
        },
        remove: function (data, callback) {
            throw 'Can\'t be called directly from Provider class';
        }
    });

    return oo;

})(oo || {});(function (oo) {
    
    var global = this;
    var MemoryProvider = oo.getNS('oo.data').MemoryProvider = oo.Class(oo.data.Provider, {
        _data: {},
        constructor: function contructor (options) {

            MemoryProvider.Super.call(this, options);

            if(options.hasOwnProperty('data')){
                this.setData(options.data);
            }
        },
        save: function save (data, config) {
            this.setData(data);
            
            var defaultConf = {
                success: oo.emptyFn
            };

            config = config || {};
            if (typeof config == 'function') {
                config = {success: config};
            }

            var conf = oo.override(defaultConf, config);

            config.success.call(global, data);
        },
        fetch: function fetch (config) {
            var defaultConf = {
                success: oo.emptyFn
            };

            config = config || {};
            if (typeof config == 'function') {
                config = {success: config};
            }

            var conf = oo.override(defaultConf, config);

            conf.success.call(global, this._data);
        },
        get: function get(key, callback) {
            callback.call(global, this._data[key] || null);
        },
        setData: function setData(data, clearAll){
            if(!data){
                throw new Error('Data missing');
            }

            if (!(data instanceof Array))
                data = [data];

            if (clearAll)
                this.clearAll();

            data.forEach(function (val) {
                this._data[val.key] = val;
            }, this);
        },
        clearAll : function clearAll(){
            this._data = {};
        }
    });

    oo.data.Provider.register(MemoryProvider, 'memory');

})(oo || {});(function (oo) {
    
    var global = this;
    var LocalProvider = oo.getNS('oo.data').LocalProvider = oo.Class(oo.data.Provider, {
        _store: {},
        constructor: function contructor (options) {
            LocalProvider.Super.call(this, options);

            // /!\ give an empty callback is probably not the best idea
            this._store = Lawnchair({name: this._name, record: 'record'}, function () {});
        },
        save: function save (data, config) {
            if (!(data instanceof Array))
                data = [data];

            var defaultConf = {
                success: oo.emptyFn
            };

            if (typeof config == 'function') {
                config = {success: config};
            }

            var conf = oo.override(defaultConf, config);

            this._store.batch(data);

            conf.success.call(global, data);
        },
        fetch: function fetch (config) {
            var defaultConf = {
                success: oo.emptyFn
            };

            if (typeof config == 'function') {
                config = {success: config};
            }

            var conf = oo.override(defaultConf, config);

            this._store.all(function (data) {
                conf.success.call(global, data);
            });
        },
        get: function get (cond, callback) {
            this._store.get(cond, callback);
        },
        remove: function remove (key, callback) {
            if (!oo.isArray(key))
                key = [key];

            var that = this, removedCount = 0, toRemoveLength = key.length, cb = function () {
                removedCount++;
                if (removedCount == toRemoveLength)
                    callback();
            };

            key.forEach(function (item) {
                that._store.remove(item, cb);
            });
        },
        clearAll: function clearAll () {
            this._store.nuke();
        }
    });

    oo.data.Provider.register(LocalProvider, 'local');

})(oo || {});/**
 * a data provider connected to a web server via AJAX
 *
 * @class AjaxProvider
 * @namespace oo.data
 * @requires oo.data.Provider
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
(function (oo) {
    
    var global = this;
    var AjaxProvider = oo.getNS('oo.data').AjaxProvider = oo.Class(oo.data.Provider, {
        /**
         * an instance of data provider that will be used as cache
         *
         * @private
         * @type {oo.data.Provider}
         */
        _cacheProvider: null,

        /**
         * flag to determine if the cache has been cleared
         *
         * @private
         * @type {bool}
         */
        
        _cacheCleared: true,
        /**
         * the parameters serialized that has been used when the cache has been stored
         *
         * @private
         * @type {String}
         */
        _cachedParameterString: [],

        /**
         * the ajax request target
         *
         * @private
         * @type {String}
         */
        _url: null,

        /**
         * a prefix unique for each model in the localstorage
         *
         * @type {string}
         */
        _cachePrefix: '',
        _noCache: null,

        constructor: function constructor (options) {

            var defaultConf = {
                cacheProvider: 'memory',
                noCache: false
            };

            var opt = oo.override(defaultConf, options);

            if (!opt.url || typeof opt.url != 'string')
                throw '\'url\' property must be set';

            this._url = opt.url;

            AjaxProvider.Super.call(this, {name: opt.name});

            this._noCache = opt.noCache;


            if (!this._noCache) {
                this._cacheProvider = new (oo.data.Provider.get(opt.cacheProvider))({name: 'flavius-cache__' + opt.name});
                //this._cachePrefix = oo.generateId();
                this._cachePrefix = this._url;
            }
        },

        /**
         * perform an ajax POST request
         * @todo  add documentation about options for save method of the ajaxprovider
         *
         * @param  {Array} data      data to store
         * @param  {object|function} config if it is a function, it will be used as the success callback else it should be an object with the properties "success", "error", "params"
         * @return {void}
         */
        save: function save (data, config) {
            var method = 'POST';

            var defaultConf = {
                success: oo.emptyFn,
                error: oo.emptyFn
            };

            if (typeof config == 'function') {
                config = {success: config};
            }

            var conf = oo.override(defaultConf, config);

            oo.ajax().post(this._url, data, oo.createDelegate(function () {
                if (!this._noCache)
                    this._clearCache();

                conf.success.call(global);
            }, this), conf.error);
        },

        /**
         * perform an ajax GET request
         * @todo  add documentation about options for fetch method of the ajaxprovider
         *
         * @param  {object|function} config if it is a function, it will be used as the success callback else it should be an object with the properties "success", "error", "params"
         * @return {void}
         */
        fetch: function fetch (config, clearCache) {

            var method = 'GET';

            var defaultConf = {
                success: oo.emptyFn,
                error: oo.emptyFn,
                params: {}
            };

            config = config || {};
            if (typeof config == 'function') {
                config = {success: config};
            }

            var conf = oo.override(defaultConf, config);

            var callback = oo.createDelegate(function (data) {
                var paramString = oo.serialize(conf.params);
                if (!this._noCache) {
                    this._clearCache(paramString);
                    this._saveCache( data, paramString, function () {
                        conf.success.call(global, data);
                    } );
                } else {
                    conf.success.call(global, data);
                }
            }, this);

            if (clearCache || this._noCache || !this._getCache(oo.serialize(conf.params), callback))
                oo.ajax().get(this._url, conf.params, callback, conf.error);

        },

        /**
         * get a particular value by its key property
         *
         * @param  {int|string}   cond key value
         * @param  {function} callback a callback function
         * @return {void}
         */
        get: function get (cond, callback) {

            if (this._noCache)
                throw "This method is available only if cache is activated";

            var that = this;

            var paramStringFull = cond || (this._cachedParameterString[this._cachedParameterString.length -1]);
            var paramString = paramStringFull.substr(paramStringFull.indexOf('|') + 1);
            if (this._getCache(paramString, oo.emptyFn))
                that._cacheProvider.get(paramStringFull, function (data) {
                    callback.call(global, data.data);
                });
            else
                throw "please perform a fetch before";
        },

        /**
         * get a particular value by its key property
         *
         * @param  {int|string}   cond key value
         * @param  {function} callback a callback function
         * @return {void}
         */
        clearAll: function clearAll () {
            if (this._noCache)
                throw "This method is available only if cache is activated";

            this._clearCache();
        },

        /**
         * generate a a cache key composed with the cachePrefix and the paramString
         *
         * @param  {string} paramString a string to identify a cache entry (here the query string)
         * @return {strin}
         */
        _genCacheKey: function _genCacheKey(paramString) {
            return this._cachePrefix + '|' + (paramString || '');
        },

        /**
         * clear the cache
         *
         * @params {string} paramString  string identifier to clear cache for one precise query
         * @return {void}
         */
        _clearCache: function _clearCache(paramString) {

            if (this._noCache)
                throw "This method is available only if cache is activated";

            if (!paramString) {
                this._cacheProvider.clearAll();
                this._cachedParameterString = [];
            }
            else {
                this._cachedParameterString.slice(this._cachedParameterString.indexOf(this._genCacheKey(paramString)), 1);
            }
        },

        /**
         * save data to the cache
         *
         * @param  {Array}    data       to be saved
         * @param  {string}   parameters parameters (as string) used to fetch data
         * @param  {function} callback   callback function
         * @return {void}
         */
        _saveCache: function _saveCache(data, parameters, callback) {

            if (this._noCache)
                throw "This method is available only if cache is activated";

            var dataToStore = {};
            dataToStore.key = this._genCacheKey(parameters);
            dataToStore.data = data;
            this._cacheProvider.save(dataToStore, callback);
            if (-1 === this._cachedParameterString.indexOf(dataToStore.key))
                this._cachedParameterString.push(dataToStore.key);
            //this._cacheCleared = false;
        },

        /**
         * get the cache return true, if cache is available, false if not
         *
         * @param  {string}   parameterString specify the paramters we would like to use to ensure the cache is still valid
         * @param  {function} callback        callback function
         * @return {bool}
         */
        _getCache: function _getCache(parameterString, callback) {
            
            if (this._noCache)
                throw "This method is available only if cache is activated";

            if (-1 !== this._cachedParameterString.indexOf(this._genCacheKey(parameterString))) {
                this._cacheProvider.fetch(function(data) {
                    callback(data.data);
                });
                return true;
            }
            else
                return false;
        }
    });

    oo.data.Provider.register(AjaxProvider, 'ajax');

})(oo || {});(function(oo){
    
    var Provider = oo.data.Provider,
        global = this;

    var _registry = {};

    var Model = oo.getNS('oo.data').Model = oo.Class(null, oo.core.mixins.Events,{
        STATIC : {
            AFTER_COMMIT : 'AFTER_COMMIT',
            /**
             * @deprecated
             */
            AFTER_SAVE : 'AFTER_COMMIT',
            AFTER_FETCH : 'AFTER_FETCH',
            register : function register (model) {
                if (!_registry.hasOwnProperty(model._name))
                    _registry[model._name] = model;
                else
                    throw "Model already exists in registry";
            },
            unregister : function register (id) {
                if (!_registry.hasOwnProperty(id))
                    throw "No model registred with the given id";
                else {
                    _registry[id] = null;
                    delete _registry[id];
                }
            },
            get: function get (id) {
                if (!_registry.hasOwnProperty(id))
                    throw "No model registred with the given id";
                else
                    return _registry[id];
            }
        },
        _data: null,
        _indexes: null,
        _toBeDeleted: null,

        constructor: function constructor(options){
            if(!options || (!options.hasOwnProperty('name') || !options.hasOwnProperty('provider')) )
                throw "Either property \"name\" or \"provider\" is missing in the options given to the Model constructor";

            var defaultConf = {
                indexes : ['key']
            };

            var conf = oo.override(defaultConf, options);

            this._data = [];
            this._indexes = {};
            this._toBeDeleted = [];

            this.setModelName(conf.name);
            this.setProvider(conf.provider);

            this.setIndexes(conf.indexes);
        },

        setProvider : function setProvider (providerConf) {
            if (providerConf instanceof Provider) {
                this._provider = providerConf;
            } else if (typeof providerConf == 'object') {
                var Cls = oo.data.Provider.get(providerConf.type);
                delete providerConf.type; providerConf.name = this._name;
                this._provider = new Cls(providerConf);
            }
        },

        getModelName : function getModelName(){
            return this._name;
        },
        setModelName : function setModelName(name){
            if(!name || "string" !== typeof name){
                throw new Error('Missing name or name is not a string');
            }

            this._name = name;
        },

        setIndexes : function setIndexes(indexes) {
            indexes.forEach(function (item) {
                this._indexes[item] = {};
            }, this);
            this._buildFullIndexes();
        },
        _resetIndexes: function _resetIndexes() {
            var indexedField = Object.getOwnPropertyNames(this._indexes);
            this.setIndexes(indexedField);
        },
        _buildIndex: function _buildIndex(obj) {
            var indexedField = Object.getOwnPropertyNames(this._indexes);
            indexedField.forEach(function (field) {
                if (obj[field]) {
                    if (!this._indexes[field][obj[field]])
                        this._indexes[field][obj[field]] = [];

                    this._indexes[field][obj[field]].push(obj);
                }
            }, this);
        },
        _removeFromIndex: function _removeFromIndex(obj) {
            var indexedField = Object.getOwnPropertyNames(this._indexes);
            indexedField.forEach(function (field) {
                if (obj[field]) {
                    this._indexes[field][obj[field]].splice(this._indexes[field][obj[field]].indexOf(obj), 1);
                    if (0 === this._indexes[field][obj[field]].length) {
                        this._indexes[field][obj[field]] = null;
                        delete this._indexes[field][obj[field]];
                        //this._indexes[field].splice(this._indexes[field][obj[field]], 1);
                    }
                }
            }, this);
        },

        /**
         * @deprecated
         * @see _buildFullIndexes
         */
        _createIndexes: function _createIndexes() {
            return _buildFullIndexes();
        },
        _buildFullIndexes : function _buildFullIndexes(){
            this._data.forEach(function (item) {
                this._buildIndex(item);
            }, this);
        },


        fetch : function fetch(callback, append) {

            var defaultConf = {
                success: oo.emptyFn,
                params: {}
            };
    
            callback = callback || {};
            if (typeof callback == 'function') {
                callback = {success: callback};
            }

            if (typeof callback != 'object') {
                throw "Model.fetch() : params must be a function or a config object";
            }

            callback = oo.override(defaultConf, callback);

            var that = this,
                cb = function cb(data){
                    if (data){
                        if (!append)
                            that.clearAll();
                        that.setData(data);
                    }

                    if (callback.success)
                        callback.success.call(that);

                    that.triggerEvent(Model.AFTER_FETCH, [that]);
                };

            this._provider.fetch({success: cb, params: callback.params});
        },
        /**
         * deprecated
         * @see oo.data.Model.commit()
         */
        save : function save(callback) {
            this.commit(callback);
        },
        commit : function commit(callback){
            var that = this;
            callback = callback || oo.emptyFn;

            this._provider.save(this._data, function () {
                if (that._toBeDeleted.length) {
                    that._provider.remove(that._toBeDeleted, function () {
                        that._toBeDeleted = [];
                        that.triggerEvent(Model.AFTER_COMMIT);
                        callback.call(that);
                    });
                }
            });
        },

        getData: function getData () {
            return this._data;
        },
        setData : function setData(data){
            data.forEach(this.set, this);
        },
        clearAll : function clearAll(){
            this._data = [];
            this._resetIndexes();
        },


        filterBy: function filterBy(index, key) {
            if(undefined === index || undefined === key)
                throw new Error('Missing params index or key');

            if('string' !== typeof index)
                throw new Error('Param index must be a string');

            var indexes = this._indexes, values = [], val;

            if(indexes.hasOwnProperty(index)) {
                val = indexes[index][key];
                if (undefined !== val)
                    values = val;
            }
            else {
                this._data.forEach(function (item) {
                    if (item.hasOwnProperty(index))
                        if (item[index] == key)
                            values.push(item);
                });
            }

            return values;
        },
        getBy: function getBy(index, key) {
            var values = this.filterBy(index, key);
            if (values.length)
                return values[0];
            else
                return null;
        },
        get: function get(key) {
            //getBy('key', key);
            if(undefined === key || "object" === typeof key){
                throw new Error('Missing key or key must\'t be an object');
            }

            return this.getBy("key",key);
        },
        set: function set(obj) {
            if(undefined === obj || "object" !== typeof obj ){
                throw new Error("Parameter must exist and be an object");
            }

            var row = null;
            if (obj.hasOwnProperty('key')) {
                row = this.get(obj.key);
            }

            if (null === row) {
                this.add(obj);
            } else {
                this._removeFromIndex(row);
                row = oo.override(row, obj);
                this._buildIndex(row);
            }
        },
        add: function add(obj) {
            if (!obj.hasOwnProperty('key')) {
                obj.key = oo.generateId();
            } else if (null !== this.get(obj.key))
                throw "Trying to add a record with an already existing id";

            this._data.push(obj);
            this._buildIndex(obj);
        },
        removeBy: function removeBy(index, key) {
            var matchingRows = this.filterBy(index, key);

            matchingRows.forEach(function (item) {
                this._removeFromIndex(item);
                this._data.splice(this._data.indexOf(item), 1);
                this._toBeDeleted.push(item.key);
            }, this);
        },
        remove: function remove(key) {
            return this.removeBy("key", key);
        }
    });
    
})(oo || {});var oo = (function (oo){
    var global = this;
    var tplEngine = oo.getNS('oo.view.templateengine');

    var templateRepository = {};

    var Template = tplEngine.Template = oo.Class({
        STATIC: {
            register: function register (cls, codename) {
                if (templateRepository[codename])
                    throw 'Already existing codename';

                templateRepository[codename] = cls;
            },
            get: function get (codename) {
                if (codename in templateRepository)
                    return templateRepository[codename];
                else
                    throw 'Invalid codename';
            },
            unregister: function register (codename) {
                delete templateRepository[codename];
            }
        },
        constructor: function (options) {
            /*if (options && 'name' in options && typeof options.name == 'string')
                this._name = options.name;
            else
                throw 'Config object must contain a name property';*/
        },
        render: function (tpl, datas) {
            throw 'Can\'t be called directly from Template class';
        }
    });

    return oo;

})(oo || {});var oo = (function (oo){
    var global = this;
    var tplEngine = oo.getNS('oo.view.templateengine');

    var templateEngineMustache = tplEngine.TemplateEngineMustache = oo.Class(oo.view.templateengine.Template,{
        constructor: function (options) {
            templateEngineMustache.Super.call(this, options);
        },
        render: function (tpl, datas) {
            if(!datas && !tpl) {
                throw new Error('datas, tpl and domElem must exist');
            }

            return Mustache.render(tpl, datas);
        }
    });

    tplEngine.Template.register(templateEngineMustache, 'mustache');
    
    return oo;

})(oo || {});var oo = (function (oo){
    var global = this;
    var tplEngine = oo.getNS('oo.view.templateengine');

    var templateEngineHandlebars = tplEngine.TemplateEngineHandlebars = oo.Class(oo.view.templateengine.Template,{
        constructor: function (options) {
            templateEngineHandlebars.Super.call(this, options);
        },
        render: function (tpl, datas) {
            if(!datas && !tpl) {
                throw new Error('datas, tpl and domElem must exist');
            }

            var template = Handlebars.compile(tpl);

            return template(datas);
        }
    });

    tplEngine.Template.register(templateEngineHandlebars, 'handlebars');
    
    return oo;

})(oo || {});/**
 * Dom helper
 *
 * @class Dom
 * @namespace oo.view
 * @requires oo.core.mixins.Events
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
(function (oo) {
    // private class
    var ClassList = oo.Class({
        constructor : function constructor (obj){
            this._dom = obj;
            this._list = (obj.getAttribute("class")) ? obj.getAttribute("class").split(' ') : [];
        },
        destroy : function destroy () {
            this._dom = null;
            this._list.splice(0);
            this._list = null;
        },
        _updateClassList : function _updateClassList (){
            this._dom.setAttribute("class",this._list.join(' '));
        },
        // remove one or more css class
        removeClass : function removeClass (clsName) {
            if (typeof clsName == 'string') {
                clsName = clsName.split(' ');
            }
            var updated = false;
            var that = this;
            this._list = this._getDomCls();
            clsName.forEach(function (element, index, array) {
                var i = that._list.indexOf(element);
                if (-1 !== i) {
                    that._list.splice(i, 1);
                    updated = true;
                }
            });

            if (updated) {
                this._updateClassList();
            }
        },
        // add one or more css class
        addClass : function addClass (clsName) {
            if (typeof clsName == 'string') {
                clsName = clsName.split(' ');
            }

            var that = this;
            this._list = this._getDomCls();
            clsName.forEach(function(cls){
                if (!that.hasClass(cls)) {
                    that._list.push(cls);
                    that._updateClassList();
                }
            });
            /*if (!this.hasClass(clsName)) {
                clsName.splice(0, 0, 0, 0);
                Array.prototype.splice.apply(this._list, clsName);
                this._updateClassList();
            }*/
        },
        // set one or more css class (clear all class previously present)
        setClass : function setClass (clsName) {
            if (typeof clsName == 'string') {
                clsName = clsName.split(' ');
            }
            this._list = clsName;
            this._updateClassList();
            
        },
        // check if it has the given class
        hasClass : function hasClass(clsName) {
            var i = this._getDomCls().indexOf(clsName);

            if (-1 === i) {
                return false;
            } else {
                return true;
            }
        },
        getClasses : function getClasses (){
            return this._list;
        },
        _getDomCls : function _getDomCls(){
            var cls = this._dom.getAttribute('class');
            return ( (cls) ? cls.split(' ') : [] );
        }
    });
    
    // lists of attributes for wich accessors will be generated
    var prop = {
        readOnly: [],
        readWrite: ['width', 'height', 'zIndex', 'display', 'top', 'right', 'bottom', 'left', 'opacity',
                    'webkitTransitionProperty', 'webkitTransitionTimingFunction', 'webkitTransitionDuration', 'webkitTransitionDelay']
    };

    var Dom = oo.getNS('oo.view').Dom = oo.Class(oo.emptyFn, oo.core.mixins.Events,{
        STATIC: {
            CSSMATRIXPATTERN : /matrix\(1, 0, 0, 1, (-?[0-9.]+), (-?[0-9.]+)\)/,
            
            // wrapper for createElement native function
            createElement: function createElement (tag) { return new Dom(document.createElement(tag)); }
        },
        constructor : function constructor (identifier) {
            /**
             * underlying dom node object
             */
            this._dom = null;

            /**
             * internal cache
             */
            this._cached = {};

            this._template = null;

            this._cacheTpl = null;

            if (typeof identifier == 'string') {
                this._identifier = identifier;
            }
            else if (identifier instanceof Object) {
                this.setDomObject(identifier);
            } else {
                throw "Fatal Error : No identifier !";
            }
            this.generateAccessor();
        },
        // destructor
        destroy : function destroy (){
            this.classList.destroy();

            this.classList = null;
            this._cached.splice(0);
            this._cached = null;

            this._dom.removeEventListeners();
            document.removeElement(this._dom);
            this._dom = null;
        },
        generateAccessor : function generateAccessor (){
            var p = this, i, len;
            // generates accessors fonction
            for (i=0, len=prop.readOnly.length; i<len; i++) {
                eval(['p.get', prop.readOnly[i].charAt(0).toUpperCase(), prop.readOnly[i].slice(1), ' = function (unit, noCache) { if (noCache || !this._cached[[\'', prop.readOnly[i], '\',(unit ? \'u\' : \'\')].join(\'\')]) { this._cached[[\'', prop.readOnly[i], '\',(unit ? \'u\' : \'\')].join(\'\')] = (unit ? window.getComputedStyle(this.getDomObject()).', prop.readOnly[i], ' : (window.getComputedStyle(this.getDomObject()).', prop.readOnly[i], ').replace(/s|ms|px|em|pt|%/, \'\')); this._cached[[\'', prop.readOnly[i], '\',(unit ? \'u\' : \'\')].join(\'\')] = parseInt(this._cached[[\'', prop.readOnly[i], '\',(unit ? \'u\' : \'\')].join(\'\')], 10) || this._cached[[\'', prop.readOnly[i], '\',(unit ? \'u\' : \'\')].join(\'\')]; } return this._cached[[\'', prop.readOnly[i], '\', (unit ? \'u\' : \'\')].join(\'\')]; };'].join(''));
            }

            for (i=0, len=prop.readWrite.length; i<len; i++) {
                eval(['p.get', prop.readWrite[i].charAt(0).toUpperCase(), prop.readWrite[i].slice(1), ' = function (unit, noCache) { if (noCache || !this._cached[[\'', prop.readWrite[i], '\',(unit ? \'u\' : \'\')].join(\'\')]) { this._cached[[\'', prop.readWrite[i], '\',(unit ? \'u\' : \'\')].join(\'\')] = (unit ? window.getComputedStyle(this.getDomObject()).', prop.readWrite[i], ' : (window.getComputedStyle(this.getDomObject()).', prop.readWrite[i], ').replace(/s|ms|px|em|pt|%/, \'\')); this._cached[[\'', prop.readWrite[i], '\',(unit ? \'u\' : \'\')].join(\'\')] = parseInt(this._cached[[\'', prop.readWrite[i], '\',(unit ? \'u\' : \'\')].join(\'\')], 10) || this._cached[[\'', prop.readWrite[i], '\',(unit ? \'u\' : \'\')].join(\'\')]; } return this._cached[[\'', prop.readWrite[i], '\', (unit ? \'u\' : \'\')].join(\'\')]; };'].join(''));
                eval(['p.set', prop.readWrite[i].charAt(0).toUpperCase(), prop.readWrite[i].slice(1), ' = function (val, unit) { if (this._cached[\'', prop.readWrite[i], '\'] || this._cached[[\'', prop.readWrite[i], '\', \'u\'].join(\'\')]) { this._cached[\'', prop.readWrite[i], '\'] = this._cached[[\'', prop.readWrite[i], '\', \'u\'].join(\'\')] = null; } this.getDomObject().style.', prop.readWrite[i], ' = [val, (undefined !== unit ? unit : \'\')].join(\'\'); return this };'].join(''));
            }

            // read translation values from dom or from cache
            //var cssMatrixPattern = /matrix\(1, 0, 0, 1, (-?[0-9.]+), (-?[0-9.]+)\)/;
            // var cssMatrixPattern = /translate3d\((-?[0-9.]+)(px|%) *, *(-?[0-9.]+)(px|%) *, 0(px|%)\)/;

        },
        getTranslations : function getTranslations (noCache){
            if (!this._cached.webkitTranslations || noCache) {
                var values = this.getWebkitTransform().match(Dom.CSSMATRIXPATTERN);
                if (null === values) {
                    values = [0, 0, 0];
                }

                this._cached.webkitTranslations = [parseInt(values[1], 10), parseInt(values[2], 10)];
                // this._cached.webkitTranslations = [parseInt(values[1], 10), parseInt(values[3], 10)];
            }
            return this._cached.webkitTranslations;
        },
        getWebkitTransform : function getWebkitTransform (noCache) {
            if (!this._cached.webkitTransform || noCache) {
                this._cached.webkitTransform = window.getComputedStyle(this.getDomObject()).webkitTransform;
            }
            return this._cached.webkitTransform;
        },
        setWebkitTransform : function setWebkitTransform (value) {
            if (this._cached.webkitTransform || this._cached.webkitTranslations) {
                this._cached.webkitTransform = null;
                this._cached.webkitTranslations = null;
            }

            
            this.getDomObject().style.webkitTransform = value;

            return this;
        },
        setTranslations : function setTranslations (x, y, unit){
            unit = unit || 'px';
            this.setWebkitTransform(['translate3d(',  x , unit, ', ', y, unit, ', 0)'].join(''));

            return this;
        },
        getTranslateX : function getTranslateX (unit, noCache) {
            return (unit ? [this.getTranslations(noCache)[0],'px'].join('') : this.getTranslations(noCache)[0]);
        },
        getTranslateY : function getTranslateY (unit, noCache) {
            return (unit ? [this.getTranslations(noCache)[1],'px'].join('') : this.getTranslations(noCache)[1]);
        },
        setTranslateX : function setTranslateX (val) {
            var valY = this.getTranslateY();
            this.setTranslations(val, valY);

            return this;
        },
        setTranslateY : function setTranslateY (val){
            var valX = this.getTranslateX();
            this.setTranslations(valX, val);

            return this;
        },
        // setters for internal dom object
        setDomObject : function setDomObject (domNode) {

            if (typeof domNode == 'string') {
                var n = document.querySelector(domNode);
                if (null === n)
                    throw "Invalid selector node doesn't exists";

                domNode = n;
            }

            this._dom = domNode;

            if (domNode && (!('id' in domNode) || domNode.id === '')) {
                this._dom.id = oo.generateId(this._dom.tagName);
            }

            this.classList = new ClassList(this.getDomObject());

            return this;
        },
        // getter for internal dom object
        getDomObject : function getDomObject () {
            if (!this._dom) {
                this.setDomObject(this._identifier);
            }

            return this._dom;
        },
        // find a child element of the current node according to the given selector
        // @todo : shouldn't returnDom be called notReturnDom
        find : function find (selector, returnDom) {
            var n = this.getDomObject().querySelector(selector);
            if (null === n)
                return null;
            else
                return (!returnDom) ? new Dom(n) : n;
        },
        findAll : function findAll (selector, returnDom) {
            var n = this.getDomObject().querySelectorAll(selector), res = [];
            if (null === n){
                return null;
            } else{
                oo._convertNodeListToArray(n).forEach(function(item){
                    res.push( (returnDom) ? item : new Dom(item));
                });
                
                return res;
            }
                
        },
        parent : function parent(){
            return new Dom(this.getDomObject().parentNode);
        },
        children : function children(){
            var c = this.getDomObject().children;
            return oo._convertNodeListToArray(c);
        },
        findParentByCls : function findParentByCls (cls) {
            var p = this.getDomObject().parentNode;
            var pattern = new RegExp(cls);
            while (p && (Node.DOCUMENT_NODE !== p.nodeType) && !pattern.test(p.getAttribute('class'))) {
                p = p.parentNode;
            }

            if (p && (Node.DOCUMENT_NODE !== p.nodeType)) {
                return new Dom(p);
            } else {
                return false;
            }
        },
        // append a node to the current node children list
        // wrapper for the native API
        appendDomNode : function appendDomNode (domNode) {
            this.getDomObject().appendChild(domNode);

            return this;
        },
        // append a node on top to the current node children list
        // wrapper for the native API
        prependDomNode : function prependDomNode (domNode) {
            this.getDomObject().insertBefore(domNode, this.getDomObject().firstChild);

            return this;
        },
        // append a node to the current node children list
        // can be a native DOMObject or a oo.Dom object
        appendChild : function appendChild (node) {
            if (node instanceof Dom)
            {
                this.appendDomNode(node.getDomObject());
            } else {
                this.appendDomNode(node);
            }

            return this;
        },
        // append a node on top to the current node children list
        // can be a native DOMObject or a oo.Dom object
        prependChild : function prependChild (node) {
            if (node instanceof Dom)
            {
                this.prependDomNode(node.getDomObject());
            } else {
                this.prependDomNode(node);
            }

            return this;
        },
        appendHtml : function appendHtml (html) {
            this.getDomObject().innerHTML += html;

            return this;
        },
        prependHtml : function appendHtml (html) {
            var h = this.getDomObject().innerHTML;
            h = html + h;

            return this;
        },
        html: function html (htmlString) {
            this.clear();
            this.appendHtml(htmlString);
        },
        removeChild : function removeChild(node){
            this.getDomObject().removeChild(node);
        },
        clear : function clear () {
            this.getDomObject().innerHTML = '';

            return this;
        },
        // stop animation by setting the duration to 0
        stopAnimation : function stopAnimation () {
            this.setWebkitTransitionDuration(0, 'ms');
            this.getDomObject().removeEventListener('webkitTransitionEnd');

            return this;
        },
        
        /**
         * apply a translation on an object
         * you may define a set of duration, animation end callback, for one shot
         *
         * @param coord {object}
         * @param duration {int} in ms
         * @param duration {Function}
         * @param timingFunction {String}
         **/
        translateTo : function translateTo (coord, duration, listener, timingFunction) {

            if (typeof coord === 'object') {
                coord.x = 'undefined' !== typeof coord.x ? coord.x : this.getTranslateX();
                coord.y = 'undefined' !== typeof coord.y ? coord.y : this.getTranslateY();
            }

            // getWebkitTransitionDuration() returns a value in seconds
            var currentTransitionDuration = (this.getWebkitTransitionDuration() * 1000);
            duration = duration || 0;
            this.setWebkitTransitionDuration(duration, 'ms');

            var currentTimingFunction = this.getWebkitTransitionTimingFunction();
            if (typeof timingFunction === 'string') {
                this.setWebkitTransitionTimingFunction(timingFunction, '');
            }

            var that = this, endListener = function endListener (e) {
                that.getDomObject().removeEventListener('webkitTransitionEnd', endListener);

                // @todo : Claire, do you remember why the folowing line is commented out ?
                //that.setWebkitTransitionDuration(currentTransitionDuration, 'ms');
                that.setWebkitTransitionTimingFunction(currentTimingFunction, '');
                if (listener) {
                    listener.call(that, e);
                }
            };
            this.getDomObject().addEventListener('webkitTransitionEnd', endListener, false);

            this.setTranslations(coord.x, coord.y);

            return this;
        },
        setId: function setId(id) {
            this.getDomObject().id = id;
        },
        getId: function getId(id) {
            return this.getDomObject().id;
        },
        setTemplate : function setTemplate (tpl) {
            this._template = tpl;

            return this;
        },
        // deprecated
        render : function render (data, tpl, resetCache) {
            if (tpl) {
                this.setTemplate(tpl);
            }

            if (!this._cacheTpl || resetCache) {
                data = data || {};
                this._cacheTpl = Mustache.to_html(this._template, data);
            }
            
            this.appendHtml(this._cacheTpl);
    
            return this;
        }
        /*animate : function animate(obj){
            
            if('object' != typeof obj){
                throw new Error("Paramerter must be in an object");
            }

            for ( var key in obj){
                if (obj.hasOwnProperty(key)){
                    //cancel all duration
                    this.setWebkitTransitionDuration(0, "ms");
                    this.setWebkitTransitionTimingFunction(obj[key].timingFunction || "ease");
                    //this.setWebkitTransitionDelay(obj[key].delay || 0, "ms");
                    this["set" + key.charAt(0).toUpperCase()+key.slice(1)](obj[key]["value"]);
                    this.getDomObject().style.WebkitTransitionDuration = obj[key].duration || 0;
                    this.getDomObject().style.WebkitTransitionProperty = key;

                    
                    
                }
            }
        },
        setWebkitTransition : function setWebkitTransition(property, duration, delay, timingFunction){
            //this.getWebkitTransition(property);
            this.getDomObject().style.webkitTransition = [property, duration, delay, timingFunction].join(' ');


        }
        getWebkitTransition : function getWebkitTransition (property, noCache) {
            if (!this._cached.webkitTransition || this._cached.webkitTransition.indexOf(property) === -1  || noCache) {

                var properties = window.getComputedStyle(this.getDomObject()).WebkitTransitionProperty;
                
                if(properties.indexOf(property) != -1){
                    var index = properties.split(', ').indexOf(property);
                    //[property, duration, delay, timingFunction]
                    //var pattern = //g;
                    //console.log(window.getComputedStyle(this.getDomObject()).WebkitTransitionTimingFunction.match(pattern));

                    var values = [
                        property,
                        window.getComputedStyle(this.getDomObject()).WebkitTransitionDuration.split(', ')[index],
                        window.getComputedStyle(this.getDomObject()).WebkitTransitionDelay.split(', ')[index]
                        //window.getComputedStyle(this.getDomObject()).WebkitTransitionTimingFunction.split(', ')[index]
                    ];

                    console.log(values);
                }
                



               
                this._cached.webkitTransition[property] = window.getComputedStyle(this.getDomObject()).webkitTransform;
            }
            return this._cached.webkitTransform;
        }*/
    }); 
    
})(oo);
/**
 * Element are the most basic type of UI element that could be created with the framework
 *
 * @namespace oo.view
 * @class Element
 * @requires oo.view.Dom
 * @requires oo.core.mixins.Scroll
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 * @author Claire Sosset <m.desloges@gmail.com> || @Claire_So
 */
(function (oo){
    var global = this,
        viewRepository = {};
    
    var Element = oo.getNS('oo.view').Element = oo.Class(oo.view.Dom, oo.core.mixins.Events, oo.core.mixins.Scroll, {
        STATIC: {
            APPEND : 'append',
            PREPEND : 'prepend',
            REFRESH_CONTENT: 'refresh_content',
            register: function register (cls, codename) {
                if (viewRepository[codename])
                    throw 'Already existing codename';

                viewRepository[codename] = cls;
            },
            get: function get (codename) {
                if (codename in viewRepository)
                    return viewRepository[codename];
                else
                    throw 'Invalid codename';
            },
            unregister: function register (codename) {
                delete viewRepository[codename];
            },

            getTemplateEngine : function getTemplateEngine() {
                if (null === Element.templateEngine)
                    Element.templateEngine = new (oo.view.templateengine.Template.get(oo.getConfig('templateEngine')))();

                return Element.templateEngine;
            },
            templateEngine : null
        },

        // references elements registered into this view
        _uiElements: null,

        _needToRender: true,
        
        _tpl : null,
        
        _container: null,

        constructor: function constructor (options) {
            if(!options || typeof options != 'object')
                throw "call Element constructor but \"options\" missing";

            // target property is deprecated - use el instead
            if(!options.hasOwnProperty('el'))
                throw "call Element constructor but \"el\" property of object options is missing";

            Element.Super.call(this, options.el);

            if( options.hasOwnProperty('template') ){
                this.setTemplate(options.template);
                delete options.template;
            }

            if (options.hasOwnProperty('onEnabled')) {
                this.onEnabled = options.onEnabled;
                delete options.onEnabled;
            }

            this._uiElements = {};

        },
        getEl: function getEl(id) {
            return this._uiElements[id] || null;
        },
        addEl: function addEl(el) {
            this._uiElements[el.getId()] = el;
            el.setContainer(this);
        },
        removeEl: function removeEl(id) {
            var el = this.getEl(id);
            if (null !== el) {
                this._uiElements.slice(this._uiElements.indexOf(el), 1);
                el.destroy();
            }
        },
        initElement: function initElement() {
            
            for (var id in this._uiElements) {
                var el = this._uiElements[id];
                if ('needToRender' in el && el.needToRender())
                    el.renderTo(this);
            }

            return this;
        },
        /**
         * do exactly the same thing as the oo.createElement, but add a prefix
         * to the el property in order to "scope" the newly created
         * element into the current one (for Dom query performance purpose)
         *
         * @see oo.createElement
         */
        createElement: function createElement (type, opt) {
            // if (opt.el)
            //     opt.el = '#' + this.getId() + ' ' + opt.el;
            var el = oo.createElement(type, opt);
            this.addEl(el);
            return el;
        },

        setContainer: function setContainer(container) {
            this._container = container;
        },
        getContainer: function getContainer() {
            return this._container;
        },
        needToRender: function needToRender() {
            return this._needToRender;
        },
        setTemplate : function setTemplate(tpl){
            this._tpl = tpl || '';
        },
        getTemplate : function getTemplate(){
          return this._tpl;
        },
        /**
         * render the element and return the generated html as string
         *
         * @param  {object} OPTIONAL data literal object representing data to fill the template
         * @param  {sting} OPTIONAL tpl   a template to override temporary the element's template
         * @return {string}               generated html as string
         */
        render: function render (data, tpl) {

            if (!tpl || '' === tpl)
                tpl = this.getTemplate();

            if(!tpl) return '';
            var tplEng = Element.getTemplateEngine();

            return tplEng.render(tpl, data || {});
        },
        /**
         * render the current element and insert the generated html into a target
         *
         * @param  {oo.view.Dom} target   the object in wich the content should be inserted
         * @param  {object} OPTIONAL data literal object representing data to fill the template
         * @param  {sting} OPTIONAL tpl   a template to override temporary the element's template
         * @param  {string} position      use a constant to append / prepend / set generated content
         * @return {void}
         */
        renderTo: function renderTo (target, data, tpl, position) {
            var content = this.render(data, tpl),
                currentTarget = target.find('#' + this.getId()) || target;

            var methodPrefix = '', methodSuffix = 'Child';
            if (typeof content === 'string')
                methodSuffix = 'Html';

            if ([Element.APPEND, Element.PREPEND].indexOf(position) !== -1)
                methodPrefix = position;
            else {
                if ('Child' === methodSuffix)
                    methodPrefix = 'append';
                else
                    methodSuffix = methodSuffix.toLowerCase();
            }

            currentTarget[methodPrefix + methodSuffix](content);

            this._onEnabled();

        },

        _onEnabled: function _onEnabled() {
            this.onEnabled();
            this.initElement();
        },

        onEnabled: function onEnabled() {

        },
        triggerBubblingEvent: function triggerBubblingEvent (evtName, params) {
            if (!oo.isArray(params)) {
                params = params ? [params] : [];
            }
            var _container = this.getContainer(), evt = {
                bubble: true,
                stopPropagation: function () { this.bubble = false; }
            };
            params.splice(0,0, evt);
            this.triggerEvent(evtName, params);

            if (evt.bubble && _container && _container.triggerBubblingEvent)
                _container.triggerBubblingEvent(evtName, params);
        }
    });

    oo.view.Element.register(Element, 'node');

})(oo);(function (oo) {

    var global = this;

    var ModelElement = oo.getNS('oo.view').ModelElement = oo.Class(oo.view.Element, {
        _model : null,
        _tplError: null,
        setTemplateError : function setTemplateError(tpl){
            this._tplError = tpl || '';
        },
        getTemplateError : function getTemplateError(){
          return this._tplError;
        },
        constructor: function constructor (options) {
            if( options.hasOwnProperty('model') ){
                this.setModel(options.model);
                delete options.model;
            }

            if( options.hasOwnProperty('templateError') ){
                this.setTemplateError(options.templateError);
                delete options.templateError;
            }

            ModelElement.Super.call(this, options);

        },
        afterFetch : function afterFetch(data){
            var output = this.render(data, this._tpl);
            this.appendHtml(output);
        },
        setModel : function setModel(model){
            if (model instanceof oo.data.Model)
                this._model = model;
            else
                this._model = oo.createModel(model);

            this._model.addListener(oo.data.Model.AFTER_FETCH, oo.createDelegate(function (model) {
                this.renderTo(this, model.getData());
                if(this.isScrollable){
                    this.scroll.refresh();
                }
            }, this));
        },
        markAsError: function markAsError() {
            this.renderTo(this.getContainer());
        },
        prepareData: function prepareData(data) {
            return data;
        },
        render: function render (data, tpl) {
            if(!data){
              tpl = this.getTemplateError();
            }

            return ModelElement.Super.prototype.render.call(this, this.prepareData(data || {}), tpl || null);
        },
        getModel : function getModel(){
            return this._model;
        }
    });

    oo.view.Element.register(ModelElement, 'modelNode');

})(oo);/**
 * Manage root screen in application
 *
 * @namespace oo.view
 * @class Viewport
 * @requires oo.view.Dom
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
(function (oo) {
    
    // shorthand
    var global = this;

    var Viewport = oo.getNS('oo.view').Viewport = oo.Class(oo.view.Dom, {

        STATIC : {
            ANIM_RTL : '1',
            ANIM_LTR : '2',
            ANIM_UP : '3',
            ANIM_DOWN : '4',
            ANIM_SIBLING : '5',
            NO_ANIM : 'none',
            ANIM_DURATION : 750,
            APPEND_TO_STAGE: 'append',
            PREPEND_TO_STAGE: 'prepend'
        },
        constructor : function constructor(root){
            root = root || oo.getConfig('viewportSelector');

            Viewport.Super.call(this, root);

            // give access to classList of the root node
            // this.classList = this._root.classList;

            this._panelClasses = {};
            this._panels = [];
            this._panelsDic = [];
            this._enabledPanels = [];
            this._focusedStack = [];
            // default stage 'main'
            this._stages = {main: {}};
        },
        /**
         * return true if the panel has already been added
         *
         * @param panel {String} identifier as string or index
         **/
        hasPanel : function hasPanel(panel) {
           return -1 != this._panelsDic.indexOf(panel) ? true : false;
        },
        /**
         * add a panel to the viewport
         *
         * @param identifier {string} a name that will be used as reference to the panel
         * @parma autoShow {bool} [OPTIONAL] will render/show the panel directly after adding it
         * @param autoRender {bool|string} [OPTIONAL] will render the panel directly after adding - if the autoShow param is set to true then it is used as animDirection
         * @param animDirection {string} [OPTIONAL] define an animation (use constant)
         **/
        addPanel : function addPanel(identifier, autoShow, autoRender, animDirection){
            
            var p = new (this._panelClasses[identifier])();
            p.setId(identifier);

            this._panels.push(p);
            this._panelsDic.push(identifier);

            if (autoRender || autoShow) {
                if (!this.panelIsEnable(identifier))
                    this._enablePanel(identifier);
            }

            if (autoShow) {
                animDirection = autoRender || animDirection;

                this.showPanel(identifier, animDirection);
            }
        },
        /**
         * utility method to get an index from an string identifier
         *
         * @param  {string} identifier the panel string identifier
         * @return {int}
         */
        _identifierToIndex : function _identifierToIndex(identifier){
            var index;
            if (typeof identifier == 'string') {
                index = this._panelsDic.indexOf(identifier);
            }
            return index;
        },
        /**
         * utility method to get an identifier from an index
         *
         * @param  {int} a panel index
         * @return {string}
         */
        _indexToIdentifier : function _indexToIdentifier(index){
           return this._panelsDic[index];
        },
        /**
         * Enable a Panel, trigger the rendering of the panel
         *
         * @param  {strinf} identifier the panel string identifier
         * @return {void}
         */
        _enablePanel : function _enablePanel(identifier){
            var index = this._identifierToIndex(identifier),
                panel = this._panels[index];

            panel.renderTo(this);

            this._enabledPanels.push(index);
        },
        /**
         * return the current focused panel or its index in the panel repository
         *
         * @param  {bool} getIndex if true the returned value will be an index, else it will return the panel object itself
         * @return {oo.view.Panel|int}
         */
        getFocusedPanel : function getFocusedPanel(getIndex){
            index = this._focusedStack[this._focusedStack.length - 1];
            if (getIndex) {
                return undefined !== index ? index : false;
            } else {
                return this.getPanel(this._indexToIdentifier(index));
            }
        },
        /**
         * returns true if the panel has already been enabled
         *
         * @param  {string} identifier the panel string identifier
         * @return {bool}
         */
        panelIsEnable : function panelIsEnable(identifier) {
           return (-1 != this._enabledPanels.indexOf(this._identifierToIndex(identifier)) ? true : false);
        },
        /**
         * remove a panel from the viewport and destroy it
         *
         * @param  {string} panel the panel string identifier
         * @return {void}
         */
        removePanel : function removePanel(panel) {
            var index = this._identifierToIndex(panel);

            // event ?
            this._panels[index].destroy();

            this._panels.slice(index, 1);
            this._panelsDic.slice(index, 1);
            this._enabledPanels.slice(this._enabledPanels.indexOf(index), 1);
        },
        /**
         * show a panel with a optional animation
         *
         * @param {string} the panel string identifier
         * @param {direction} Right To Left or Left To Right or no anim (use constant)
         **/
        showPanel : function showPanel(panelIdentifier, direction) {
            var p = this.getPanel(panelIdentifier);
            
            if (!this.panelIsEnable(panelIdentifier))
                this._enablePanel(panelIdentifier);

            p.show(direction || Viewport.ANIM_RTL);

            var index = this._identifierToIndex(panelIdentifier);

            this._focusedStack.push(index);

        },
        /**
         * hide a panel with a optional animation
         *
         * @param {string|int} panelIdentifier the panel string identifier or index
         * @param {direction} direction Right To Left (ANIM_RTL) or Left To Right (ANIM_LTR) or no anim (NO_ANIM)
         * @param {bool} destroy destroy the panel or not (not implemented yet)
         **/
        hidePanel : function hidePanel(panelIdentifier, direction, destroy) {
            direction = direction || Viewport.ANIM_RTL;
            var p = this.getPanel(panelIdentifier);
            
            p.hide(direction || Viewport.ANIM_RTL);

            var index = this._identifierToIndex(panelIdentifier);

            if (index == this.getFocusedPanel(true)) {
                this._focusedStack.pop();
            }

            // if (destroy) {
            // }
        },
        /**
         * show the newPanel and hide the oldPanel
         * this method usualy takes three parameter, you may pass only two (first as the new Panel, and second
         * as the direction of the animation) the current panel will be auto hidden
         *
         * @param oldPanel the panel to hide
         * @param newPanel the panel to show
         * @param direction define an animation for both hide and show transitions (use constant)
         * @param params are data come from model to be passed at the view
         **/
        switchPanel : function switchPanel(oldPanel, newPanel, direction) {
            var dir, oldP, newP;

            if (arguments.length <= 2) {
                dir = newPanel;
                newP = oldPanel;
                oldP = this._indexToIdentifier(this.getFocusedPanel(true));
            } else {
                oldP = oldPanel;
                newP = newPanel;
                dir = direction;
            }
                
            // uses stages tree to determine which animation to use
            if (!dir) {
                var oldPStage = this._getStageDic()[oldP],
                    newPStage = this._getStageDic()[newP];
                if (oldPStage == newPStage) {
                    // for siblings panels
                    var stageNS = this._stringToStageObj(oldPStage);
                    if (stageNS.panels.indexOf(oldP) > stageNS.panels.indexOf(newP)) {
                        dir = Viewport.ANIM_LTR;
                    } else {
                        dir = Viewport.ANIM_RTL;
                    }
                }
                else {
                    // for non siblings panels
                    // implement UP/DOWN transition ?
                    dir = Viewport.NO_ANIM;
                }
            }

            this.showPanel(newP, dir);

            if (oldP)
                this.hidePanel(oldP, dir);
        },
        /**
         * register a panel in order to make the vieport able to manage it
         *
         * @param  {String} id an identifier
         * @param  {oo.view.Panel} p  the panel to register
         * @return {void}
         */
        register: function register(id, p, stage, pos) {
            this._panelClasses[id] = p;
            stage || (stage = "main");

            var conf = oo.override({stage:"main", pos:Viewport.APPEND_TO_STAGE}, {stage:stage, pos:pos});

            if (!this.addToStage(id, conf.stage, conf.pos))
                throw "The panel has not been added to a stage - it has already been added in another stage";
        },
        /**
         * retunrs the panel object associated with the given identifier
         *
         * @param {String} identifier the identifier that had been used to register/create the panel
         * @return {oo.view.Panle} the Panel
         **/
        getPanel : function getPanel(identifier) {
            if (!this.hasPanel(identifier))
                this.addPanel(identifier, false, false);

           return this._panels[this._identifierToIndex(identifier)] || false;
        },

        // Stages API
        //
        // in constructor
        // this._stages = {};
        //
        // STATIC: {
        //   APPEND_TO_STAGE: 'append',
        //   PREPEND_TO_STAGE: 'prepend'
        // }
        //
        _stages: null,
        _stageDic: null,
        _getStageDic: function _getStageDic() {
            this._stageDic || (this._stageDic = {});
            return this._stageDic;
        },
        _stringToStageObj: function _stringToStageObj(str) {
            var stageObj;
            if ('string' === typeof str)
                // @todo : check to secure the use of eval or remove it
                eval("stageObj = this._stages." + str);
            return stageObj;
        },
        createStage: function createStage(name, into) {
            var re = /^[a-zA-Z]*$/,
                names = name.split('.'),
                ns = 'this._stages';

            names.forEach(function (item) {
                if (re.test(item) && item != 'panels') {
                    ns += '.' + item;
                    eval(ns + " || (" + ns + " = {})");
                } else {
                    throw "Invalid name or namespace for a stage name";
                }
            }, this);

            return eval(ns);
        },
        removeStage: function removeStage(stage) {
            // if remove a nstage containnings children stages, children are not removed properly
            var stageObj, lastIndex = stage.lastIndexOf('.'), lastPart, parentStage;
                if (-1 !== lastIndex) {
                    lastPart = stage.substr(lastIndex + 1);
                    parentStage = stage.substr(0, lastIndex);
                    stageObj = this._stringToStageObj(parentStage);
                } else {
                    lastPart = stage;
                    stageObj = this._stages;
                }

            console.log(lastIndex, lastPart, parentStage);

            stageObj[lastPart] = null;
            delete stageObj[lastPart];
            // panel.setStage(null); ???
        },
        addToStage: function addToStage(panel, stage, position) {
            if (this._getStageDic()[panel])
                return false;

            var stageObj, index = parseInt(position, 10);
            stageObj = this._stringToStageObj(stage);
            if (!stageObj)
                stageObj = this.createStage(stage);


            position = position || Viewport.APPEND_TO_STAGE;

            if (!stageObj.panels) {
                stageObj.panels = [];
            }

            posToInsert = position == Viewport.APPEND_TO_STAGE ? stageObj.panels.length : position == Viewport.PREPEND_TO_STAGE ? 0 : null;

            if (null === posToInsert)
                stageObj.panels[parseInt(position, 10)] = panel;
            else
                stageObj.panels.splice(posToInsert, 0, panel);

            // this.getPanel(panel).setStage(stage); ???
            this._getStageDic()[panel] = stage;

            return true;
        },
        removeFromStage: function removeFromStage(panel) {
            var stageObj;
            stageObj = this._stringToStageObj(this._getStageDic()[panel]);
                
            stageObj.panels.splice(stageObj.panels.indexOf(panel), 1);
            this._getStageDic()[panel] = null;
            delete this._getStageDic()[panel];
            // panel.setStage(null); ???
        }
    });
    
})(oo || {});/**
 * Abstract class that should be extended to create panels
 * use the oo.createPanelClass helper
 *
 * @namespace oo.core
 * @private class
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
(function (oo) {

    var Panel =  oo.getNS('oo.view').Panel = oo.Class(oo.view.Element, {
        STATIC : {
            ON_SHOW: 'on_show',
            ON_HIDE: 'on_hide'
        },

        _data: null,

        constructor: function constructor() {

            Panel.Super.call(this, {el: document.createElement('div')});

            var that = this;
            //window.addEventListener('orientationchange', that.refresh,false);
            
            this._data = {}

            if ('init' in this)
                this.init();
        },
        render: function render() {
            this.classList.addClass('oo-panel');
            this.appendHtml(Panel.Super.prototype.render.call(this, this._data));

            return this;
        },
        destroy: function destroy () {
            // for (var id in this._uiElements)
            //     this._uiElements[id].destroy();
        },
        show: function show(direction) {
            this.animShow(direction);
            this.triggerEvent(Panel.ON_SHOW, [this]);
        },
        animShow: function animShow (direction) {

            var Viewport = oo.view.Viewport, vp = oo.getViewport();

            direction = direction || Viewport.ANIM_RTL;

            var anim_duration = 0;
            if (direction !== Viewport.NO_ANIM) {
                // prepare transition
                //vp.getWidth(false, true) :
                //Warning : avoid the cached dom value cause bug in android navigator when orientationchange is fired
                var translateDist = vp.getWidth(false, true) * (direction == Viewport.ANIM_RTL ? 1 : -1);
                this.setTranslateX(translateDist);
                anim_duration = Viewport.ANIM_DURATION;
            }

            this.setDisplay('block', '');

            var _this = this;
            this.translateTo({x:0}, anim_duration);
        },
        hide: function hide(direction) {
            this.animHide(direction);
            this.triggerEvent(Panel.ON_HIDE, [this]);
        },
        animHide: function animHide (direction) {
            var Viewport = oo.view.Viewport, vp = oo.getViewport();

            direction = direction || Viewport.ANIM_RTL;

            var anim_duration = 0;
            if (direction !== Viewport.NO_ANIM) {
                anim_duration = Viewport.ANIM_DURATION;
            }

            // transition
            //vp.getWidth(false, true) :
                //Warning : avoid the cached dom value cause bug in android navigator when orientationchange is fired
            var translateDist = vp.getWidth(false, true) * (direction == Viewport.ANIM_RTL ? -1 : 1);
            var that = this;
            this.translateTo({x:translateDist}, anim_duration, function () {
                that.setDisplay('none');
            });
        },
        refresh: function refresh(){
          var vp = oo.getViewport();
          vp.getWidth(null, true);
          vp.getHeight(null, true);
        },
        setData: function setData (data) {
            this._data = data;
        }
    });

})(oo || {});(function (oo) {

    // shorthand
    var Touch = oo.core.Touch;
    
    var List = oo.getNS('oo.view').List = oo.Class(oo.view.ModelElement, {
        STATIC: {
            EVT_ITEM_PRESSED: 'item-pressed',
            EVT_ITEM_RELEASED: 'item-released'
        },
        _structTpl: '',
        _touchedItem: null,
        _noStructure: true,
        _identityField: '',
        _listItemCls: '',
        _listItemDataAttrib: '',
        _eventInitialized: false,
        constructor: function constructor(conf) {
            var defaultConf = {
                noStructure: true,
                structure: '<ul>{{#data}}<li data-id="{{key}}" class="oo-list-item">{{tpl}}</li>{{/data}}</ul>',
                identityField: 'key',
                listItemCls: 'flavius-list-item',
                listItemDataAttrib: 'data-list-item-id'
            };

            conf = oo.override(defaultConf, conf);

            this._noStructure = !!conf.noStructure;
            if (!this._noStructure)
                this._setStructTpl(conf.structure);

            this._identityField = conf.identityField;
            this._listItemCls = conf.listItemCls;
            this._listItemDataAttrib = conf.listItemDataAttrib;


            List.Super.call(this, conf);

            if(conf.scrollable){
                this.setScrollable(conf.scrollable);
            }
        },
        setTemplate : function setTemplate(tpl){

            if (!this._noStructure)
                this._tpl = this._genTplWithStructure(tpl);
            else {
                var testDiv = oo.view.Dom.createElement('div');
                testDiv.html(tpl);
                if (testDiv.children().length !== 1)
                    throw "Invalid template - the template must have a single root node";
                
                testDiv = null;
                this._tpl = '{{#data}}' + tpl + '{{/data}}';
            }
                

        },
        _initEvents: function _initEvents() {
            
            var that = this,
                check;

            function checkTarget (target) {
                target = (Node.TEXT_NODE === target.nodeType) ? target.parentNode : target;
                var t = new oo.view.Dom(target);
                var itemId;
                if (!t.classList.hasClass(this._listItemCls)) {
                    var altTarget = t.findParentByCls(that._listItemCls);
                    if (altTarget) {
                        t = altTarget;
                    }
                }
                 
                itemId = t.getDomObject().getAttribute(that._listItemDataAttrib) || t.getId();

                if (itemId) {
                    return {id: itemId, dom: t, row: (itemId ? that.getModel().getBy(that._identityField, itemId) : null)};
                }
                 
                return false;
            }
             
            this.getDomObject().addEventListener(Touch.EVENT_START, function (e) {

                this._touchedItem = e.target;
                check = checkTarget(e.target);
                if (false !== check) {
                    check.dom.classList.addClass('active');
                     
                    that.triggerEvent(List.EVT_ITEM_PRESSED, [check.dom, check.id, check.row]);
                }
            }, false);
            this.getDomObject().addEventListener(Touch.EVENT_MOVE, function (e) {
                if (this._touchedItem) {
                    this._touchedItem = null;
                    var active = that.find('.active');
                    if (null !== active)
                        active.classList.removeClass('active');
                }
            }, false);
            this.getDomObject().addEventListener(Touch.EVENT_END, function (e) {
                check = checkTarget(e.target);
                if (false !== check && this._touchedItem == e.target) {
                    check.dom.classList.removeClass('active');
                    that.triggerEvent(List.EVT_ITEM_RELEASED, [check.dom, check.id, check.row]);
                }
            }, false);

            this._eventInitialized = true;
        },
        prepareData: function prepareData(data) {
            return {'data': data};
        },
        renderTo: function renderTo(target, data, tpl) {
            List.Super.prototype.renderTo.call(this, target, data, tpl);

            var datas = this.getModel().getData();
            if (datas.length) {
                this.children().forEach(function (item, index) {
                    var d = new oo.view.Dom(item);
                    d.classList.addClass(this._listItemCls);
                    d.getDomObject().setAttribute(this._listItemDataAttrib, datas[index][this._identityField]);
                }, this);
            }

            if (!this._eventInitialized)
                this._initEvents();
        },


        // deprecated
        _genTplWithStructure: function _genTplWithStructure(tpl) {
            return this._structTpl.replace('{{tpl}}', tpl || '');
        },
        _setStructTpl: function _setStructTpl(tpl){
            
            if(!tpl) {
                throw Error("Template must be declared");
            }

            this._structTpl = tpl;
        }
        
    });
    
    oo.view.Element.register(List, 'list');
    
})(oo || {});/**
 * Class let's you transform any dom node into button and manage interaction
 *
 * @namespace oo
 * @class Button
 *
 * @author Mathias Desloges <m.desloges@gmail.com> || @freakdev
 */
(function (oo) {
 
    var Touch = oo.core.Touch;
    //Events = oo.Events;
     
    var Button = oo.getNS('oo.view').Button = oo.Class(oo.view.Element, {
        STATIC : {
            EVT_TOUCH : 'touch',
            EVT_RELEASE : 'release'
        },
        constructor : function constructor(opt) {

            if(!opt || typeof opt != 'object')
                throw "call Element constructor but \"options\" missing";

            // target property is deprecated - use el instead
            if(!opt.hasOwnProperty('el'))
                throw "call Element constructor but \"el\" property of object options is missing";

            if (opt.hasOwnProperty('onrelease') && typeof opt.onrelease === 'function') {
                this.onRelease = opt.onrelease;
                delete opt.onRelease;
            }

            Button.Super.call(this, opt);

            this._active = false;
            this._initEvents();
        },
        _needToRender : false,
        _initEvents : function _initEvents() {
            this.getDomObject().addEventListener(Touch.EVENT_START, oo.createDelegate(this._onTouch, this), false);
            this.getDomObject().addEventListener(Touch.EVENT_MOVE, oo.createDelegate(this._onMove, this), false);
            this.getDomObject().addEventListener(Touch.EVENT_END, oo.createDelegate(this._onRelease, this), false);
        },
        _onTouch : function _onTouch(e) {
            this.setActive(true);
            this.triggerEvent(Button.EVT_TOUCH, [this, e]);
        },
        _onMove : function _onMove (e) {
            this.setActive(false);
        },
        _onRelease : function _onRelease(e) {
            if (this.isActive()) {
                this.setActive(false);
                this.onRelease();
                this.triggerEvent(Button.EVT_RELEASE, [this, e]);
            }
        },
        onRelease: function onRelease () { },
        isActive : function isActive() {
            return this._active;
        },
        /**
         * set the active state of the button
         * @param actice {bool} "true" to set as active "false" to not
         **/
        setActive : function setActive (active) {
            this._active = !!active;
            this.classList[(this._active ? 'add' : 'remove') + 'Class']('active');
        }
    });
     
    oo.view.Element.register(Button, 'button');
     
})(oo || {});/*
 * Carousel :
 * @selector : the dom selector of the container
 * @pager : Boolean
 * @items : Array of Panel object
 * 
 */
var oo = (function (oo) {

    // shorthand
    var Dom = oo.view.Dom, Touch = oo.core.Touch, ns = oo.getNS('oo.view');
    
    var Carousel = ns.Carousel = oo.Class(oo.view.ModelElement, oo.core.mixins.Events, {
        STATIC : {
            EVENT_ON : "EVENT_ON",
            EVENT_GOTO : "EVENT_GOTO",
            EVENT_PRESS:"EVENT_PRESS",
            CLS_SHOWING : "is-showing",
            CLS_ACTIVE : "item-active"
        },
        _datas : null,
        _elementCls : null,
        _items : null,
        _available : true,
        _newPanel : null,
        _upPrev : false,
        _upNext : false,
        _fromLimit:true,
        _activePanel: null,
        _transitionType : "Slide",
        _swipe : false,
        _pagerOpt : false,
        _startX : null,
        _currentTranslate : null,
        constructor : function constructor(opt) {
            if(!opt){
                throw new Error('Missing options');
            }

            this._startX = 0;
            this._startTranslate = 0;

            var conf = {
                target: opt.el || (document.createElement('div'))
            };

            Carousel.Super.call(this, conf);
            this._transitionDuration = opt.duration || 200;
            this._items = [];

            //todo default option with override
            if(opt && opt.hasOwnProperty('transitionType')){
                this._transitionType = opt.transitionType.charAt(0).toUpperCase() + opt.transitionType.slice(1);
                delete opt.transitionType;
            }

            if(opt && opt.hasOwnProperty('swipe')){
                this._swipe = true;
                delete opt.swipe;
            }

            if(opt && opt.hasOwnProperty('pager')){
                this._pagerOpt = opt.pager;
                delete opt.pager;
            }
            if (opt && opt.hasOwnProperty('model')){
                if(!opt.hasOwnProperty('elementCls')){
                    throw new Error('Options passed but missing elementCls');
                }

                if('[object Object]' !== Object.prototype.toString.call(opt.elementCls)){
                    throw new Error('elementCls must be an object');
                }
                
                this._elementCls = opt.elementCls;
                delete opt.elementCls;
                this._prepareModel(opt.model);
            } else {
              this._prepareView();
            }
            
        },
        _prepareModel : function _prepareModel(model){
          var that = this;
            this.setModel(model);
            //this.after
            this._model.fetch(function(datas){
                that._datas = datas;
                that._addPanel(0);
                that._addPanel(1);
                that._prepareView();
            });
        },
        updateModel : function updateModel(model){
            this.clear();
            this._items = [];
            this._available = true;
            this._datas = null;
            this._available = true;
            this._newPanel = null;
            this._upPrev = false;
            this._upNext = false;
            this._fromLimit = true;
            this._activePanel = null;
            this._prepareModel(model);
        },
        _prepareView : function _prepareView(){
            this._nbPanel = this._datas.length -1 || document.querySelectorAll([this._identifier, ' > *'].join('')).length;
            this._panelWidth = (new Dom(this.getDomObject().firstElementChild)).getWidth();
            var c = this.getDomObject().children, i = 0, len = c.length;

            for ( i ; i < len; i++){
              c[i].style.width = this._panelWidth + 'px';
            }

            this._activePanel = 0;
            this['_prepareView'+this._transitionType]();

            this._displayPager = this._pagerOpt;

            this._pager = null;
            this._buildPager();

            this._moved = false;

            this.render();
        },
        _prepareViewSlide : function _prepareViewSlide(){
            this.setWidth( (this._model) ? this._panelWidth*3 : this._panelWidth*this._nbPanel ,'px' );
        },
        _prepareViewCustom : function _prepareViewCustom(){
            //put current elem on top
            this._items[this._activePanel].classList.addClass(Carousel.CLS_ACTIVE);
        },
        _addPanel : function _addPanel(id, before){
            var item = this._getItem(id);
            if(this._panelWidth){
              item.setWidth(this._panelWidth,'px');
            }

            this[(before ? 'prependChild': 'appendChild')](item.getDomObject());
            item.onEnable();

        },
        isAvailable : function isAvailable(){
          return this._available;
        },
        showPanel : function showPanel(id){
            if('undefined' === typeof id){
                throw new Error("Missing 'id' of the panel");
            }

            //disable pager slider
            if(this._pager && this._pager instanceof oo.view.Slider){
                this._pager.setDisabled();
            }

            if( id !== this._activePanel && this._datas[id] && this._available){
                //before transition add the new panel if it not in the dom
                if(id > this._activePanel+1){
                    this._updateNext(id);
                    this._upPrev = true;
                }
                
                if(id < this._activePanel-1){
                    this._updatePrev(id);
                    this._upNext = true;
                }
            }
            
            this._available = false;
            
            
            var s = (id < this._activePanel ? +1 : -1 );
            this["_setTransition"+this._transitionType](id, s);
            
            var oldOne = this._activePanel ? this._getItem(this._activePanel) : null,
                newOne = this._getItem(this._newPanel);
            this.triggerEvent(Carousel.EVENT_GOTO, [this._newPanel, oldOne, newOne]);
            this._updatePager(this._newPanel);

            if (this._newPanel === this._activePanel) {
              this._available = true;
                  if (this._pager && this._pager instanceof oo.view.Slider){
                    //enable pager slider
                    this._pager.setEnabled();
                }
            }

        },
        _setTransitionSlide: function _setTransitionSlide(id, s){
            var nT;
            if(id >= 0 && id <= this._nbPanel && id !== this._activePanel){
                //nT =  this._startTranslate + s * this._panelWidth;
                nT =  this._currentTranslate + s * this._panelWidth;
                
            } else {
                if( id === this._activePanel) {
                    nT =  this._currentTranslate;
                } else {
                   if(id < 0){
                        nT = 0;
                        id = 0;
                    } else {
                        nT =  this._currentTranslate;
                        id = this._nbPanel;
                    }
                }
            }

            this.translateTo({x:nT}, this._transitionDuration);
            this._currentTranslate = nT;

            //store new id for endTransition
            this._newPanel = id;
        },
        _setTransitionCustom: function _setTransitionCustom(id, s){
            var that = this;
            //limite
            if(id < 0){
                id = 0;
            } else {
                if(id > this._nbPanel){
                    id = this._nbPanel;
                }
            }
            
            if(id !== this._activePanel && !this._items[id].classList.hasClass(Carousel.CLS_SHOWING)) {
                if(!this._items[id].isInit){
                    this._items[id].getDomObject().addEventListener('webkitTransitionEnd',function(){
                        that.onEndTransition.apply(that);
                    },false);

                    this._items[id].isInit = true;
                }

                setTimeout(function(){
                    that._items[id].classList.addClass(Carousel.CLS_SHOWING);
                },1);
                
                //store new id for endTransition
            } else {
                //no transition
                this._available = true;
            }
            
            this._newPanel = id;
        },
        _updateNext : function _updateNext(nextId){
            //remove last
            this.removeChild(this.getDomObject().lastChild);
            //appendChild
            this._addPanel(nextId);
        },
        _updatePrev : function _updatePrev(idPrev){
            this.removeChild(this.getDomObject().firstChild);
            this._addPanel(idPrev,true);
        },
        _getItem : function _getItem(id){
            var items = this._items;
            if (!items[id]) {
                items[id] = this._prepareItem(id);
            }

            return items[id];
        },
        _prepareItem : function _prepareItem(id){
            var item , elementCls = this._datas[id].elementCls, that = this;

            if( 'undefined' === this._elementCls[elementCls] || 'function' !== typeof this._elementCls[elementCls]){
                throw new Error('element Cls must exist and be a function');
            }

            item = new this._elementCls[elementCls]();


            
            item.data = this._datas[id];

            item.appendHtml(item.render(item.data));
            

            return item;
        },
        /*pager*/
        _buildPager : function _buildPager() {
            if (this._displayPager) {
                if( 'boolean' === typeof this._displayPager) {
                  this._buildPagerItem();
                } else {
                    this._pager = this._displayPager;
                    if (this._displayPager instanceof oo.view.List){
                        this._buildPagerList();
                    }

                    if (this._displayPager instanceof oo.view.Slider){
                        this._buildPagerSlider();
                    }
                  
                    if(this._displayPager instanceof oo.view.PagerPrevNext){
                        this._buildPagerPrevNext();
                    }
                }
            }

            //this._updatePager(this._activePanel);
        },
        _buildPagerItem : function _buildPagerItem(){
          this._pager = Dom.createElement('div');
          this._pager.classList.addClass('carousel-pager');

          this._pager.setTemplate('{{#bullet}}<i class="dot"></i>{{/bullet}}');

          var data = [];
          for(var i=0; i<this._nbPanel; i++) {
              data.push(i);
          }

          this._pager.render({bullet: data});
        },
        _buildPagerList : function _buildPagerList(){
          var that = this;
          this._pager.addListener(oo.view.List.EVT_ITEM_RELEASED, function(dom, id){
            if(parseInt(id,10) === that._activePanel || !that._available) return;

            that.showPanel(parseInt(id,10));
          });
        },
        _buildPagerSlider : function _buildPagerSlider(){
            var that = this;
            this._pager.addListener(oo.view.SliderCursor.EVT_ONGOTO, function(key){
                if(that.isAvailable()){
                    that.showPanel(key);
                }
            });
        },
        _buildPagerPrevNext : function _buildPagerPrevNext(){
            var that = this;
            this._pager.addListener(oo.view.PagerPrevNext.goToNext, function(){
                that.goToNext.call(that);
            });

            this._pager.addListener(oo.view.PagerPrevNext.goToPrev, function(){
                that.goToPrev.call(that);
            });
        },
        _updatePager : function _updatePager(id) {
          
            if (this._displayPager) {
                if( 'boolean' === typeof this._displayPager) {
                  var current = this._pager.getDomObject().querySelector('.dot.active');
                  if (current) {
                      current.className = current.className.replace(/ *active/, '');
                  }
                  this._pager.getDomObject().querySelector(['.dot:nth-child(', (this._activePanel + 1), ')'].join('')).className += ' active';
                } else {
                    
                    /*if (this._pager instanceof oo.view.List){
                    
                    }*/

                    if (this._pager instanceof oo.view.Slider){
                        this._pager.goTo(id);
                    }
                  
                    if(this._pager instanceof oo.view.PagerPrevNext){
                        if(0 === id){
                            this._pager.buttonPrev.classList.addClass(oo.view.PagerPrevNext.CLS_DISABLE);
                        } else {
                            this._pager.buttonPrev.classList.removeClass(oo.view.PagerPrevNext.CLS_DISABLE);
                        }

                        if(this._nbPanel === id){
                            this._pager.buttonNext.classList.addClass(oo.view.PagerPrevNext.CLS_DISABLE);
                        } else {
                            this._pager.buttonNext.classList.removeClass(oo.view.PagerPrevNext.CLS_DISABLE);
                        }
                    }
                }
            }


        },
        hasMoved : function hasMoved() {
            return this._moved;
        },
        _initListeners : function _initListeners(){
            var listNode = this.getDomObject();
            var that = this;
            var touchMoveTempo;

            listNode.addEventListener(Touch.EVENT_START, function (e) {
                if(that._available){
                    that._startX = this._lastPos = Touch.getPositionX(e);
                    that['_transitionStart'+that._transitionType]();
                    touchMoveTempo = 0;
                    that.triggerEvent(Carousel.EVENT_PRESS);
                }
            }, false);

            listNode.addEventListener(Touch.EVENT_MOVE, function (e) {
                if(e.type == "mousemove") return;
                if(that._available){
                    this._lastPos = Touch.getPositionX(e);
                    var diff = this._lastPos - this._startX;

                    if(Math.abs(diff) > 70) {
                        that['_transitionMove'+that._transitionType](diff);
                        
                        that._moved = true;
                    }
                }
            }, false);

            listNode.addEventListener(Touch.EVENT_END, function () {
                if(that._available){
                    that._moved = false;
                    var cVal = this._lastPos,
                        diff = cVal - that._startX;
                        that['_transitionEnd'+that._transitionType](cVal, diff);
                    
                    
                    
                    /*if (cVal < 0) {

                        cVal = Math.abs(cVal);

                        var min = (that._panelWidth / 2),
                            max = (that._panelWidth * (that._nbPanel -1) - min);

                        for(var i = min; i <= max; i = i + that._panelWidth) {
                            if (cVal < i) {
                                break;
                            }
                        }

                        
                        if (cVal > max) {
                            tVal = max + min;
                        } else {
                            tVal = i - min;
                        }

                        tVal *= -1;

                    } else {
                        tVal = 0;
                    }*/

                    //that._activePanel = Math.abs(tVal / that._panelWidth);
                    

                    //that.translateTo({x:tVal}, that._transitionDuration);
                    //that._startTranslate = tVal;
                }

            }, false);

            window.addEventListener("orientationchange",function(){
                that.refresh();
            },false);

            //swipe
            if(this._swipe){
                listNode.addEventListener('swipeRight',function(e){
                    that.goToNext();
                },false);

                listNode.addEventListener('swipeLeft',function(e){
                    that.goToPrev();
                },false);
            }
            
            if(this._transitionType !== "Custom"){
                listNode.addEventListener('webkitTransitionEnd',function(e){
                    that.onEndTransition();
                },false);
            }
            /*listNode.addEventListener('webkitTransitionEnd',function(e){
                that.onEndTransition.apply(that);
            },false);*/
        },
        _transitionStartSlide : function _transitionStartSlide(){
            this._startTranslate = this.getTranslateX();
        },
        _transitionMoveSlide : function _transitionMoveSlide(diff){
            this.translateTo({x:(this._startTranslate + diff)}, 0);
        },

        _transitionEndSlide : function _transitionEndSlide(cVal,diff){
            if(Math.abs(diff) > 150){
                if( cVal - this._startX < 0 ){
                    this.goToNext();
                } else {
                    this.goToPrev();
                }
            } else {
                this.translateTo({x:(null !== this._currentTranslate) ? this._currentTranslate : (this._currentTranslate = this._startTranslate)}, this._transitionDuration);
                
            }
        },
        _transitionStartCustom : function _transitionStartCustom(){
        },
        _transitionMoveCustom : function _transitionMoveCustom(){
        },
        _transitionEndCustom : function _transitionEndCustom(){
        },
        goToNext : function goToNext(){
            if(this._available){
                this.showPanel(this._activePanel + 1);
            }
        },
        goToPrev : function goToPrev(){
            if(this._available){
                this.showPanel(this._activePanel - 1);
            }
        },
        onEndTransition : function onEndTransition(){
            //mmmmmm
            if(this._activePanel == this._newPanel) {
                this._available = true;
                return;
            }

            this['_endTransition' + this._transitionType](this._newPanel);

            if(this._newPanel > this._activePanel){
                if(!this._fromLimit){

                    //already 3 items in the carousel
                    this.removeChild(this.getDomObject().firstChild);
                    if(this._transitionType == "Slide"){
                        this.translateTo({x:this._currentTranslate + this._panelWidth});
                        this._currentTranslate = this._currentTranslate + this._panelWidth;
                    }
                    
                }

                if(this._newPanel < this._nbPanel){
                    this._addPanel(this._newPanel+1);
                }
            }

            
            if(this._newPanel < this._activePanel){
                if(!this._fromLimit){
                    this.removeChild(this.getDomObject().lastChild);
                }

                if(this._newPanel > 0){
                    
                    
                    if(this._transitionType == "Slide"){
                        this.translateTo({x:this._currentTranslate - this._panelWidth});
                    }
                    this._addPanel(this._newPanel-1, true);
                    if(this._transitionType == "Slide"){
                        this._currentTranslate = this._currentTranslate - this._panelWidth;
                    }
                    
                }
            }

          
            if(this._upPrev){
                this._updatePrev(this._newPanel -1);
                this._upPrev = false;
            }
            if(this._upNext){
                this._updateNext(this._newPanel +1);
                this._upNext = false;
            }

            
            
            this._fromLimit = (this._newPanel < 1 || this._newPanel == this._nbPanel) ? true : false;

            this._activePanel = this._newPanel;
            this._available = true;
            
            if (this._pager && this._pager instanceof oo.view.Slider){
                //enable pager slider
                this._pager.setEnabled();
            }

            this.triggerEvent(Carousel.EVENT_ON, [this._activePanel]);
        },
        _endTransitionSlide : function _endTransitionSlide(id){

        },
        _endTransitionCustom : function _endTransitionCustom(id){
            this._items[id].classList.removeClass(Carousel.CLS_SHOWING);
            this._items[this._activePanel].classList.removeClass(Carousel.CLS_ACTIVE);
            this._items[id].classList.addClass(Carousel.CLS_ACTIVE);
        },
        render : function render(){
            // update css if needed
            if (this._pager ) {
                if('boolean' === typeof this._displayPager){
                    (new Dom(this.getDomObject().parentNode)).appendChild(this._pager);
                } else {
                    //render list
                    if (this._pager instanceof oo.view.List){
                        this._pager.appendHtml(this._pager.render(this._datas));
                    }
                    
                }
                
            }

            this._initListeners();
        },
        refresh : function refresh(){
            //get new with and translate to _startTranslate
            var oldW = this._panelWidth, diff;
            this._panelWidth = (new Dom(this.getDomObject().firstElementChild)).getWidth();

            diff = oldW - this._panelWidth;

            this.translateTo({x:this._currentTranslate + diff},0);
            this._startTranslate = this._currentTranslate + diff;
        },
        getPanel : function getActivePanel(id){
            if( undefined === id){
                throw new Error('Missing id');
            }
            if(!this._items) return;

            return this._items[id];
        }
    });
    

    oo.view.Element.register(Carousel, 'carousel');
    
    return oo;
    
})(oo || {});
/**
 * Abstract class that should be extended to create slider
 *
 * @namespace oo.view
 * @private class
 *
 */
(function () {
    
    var Touch = oo.core.Touch;

    var Slider =  oo.getNS('oo.view').Slider = oo.Class(oo.view.ModelElement, {
        constructor: function constructor(opt) {
            Slider.Super.call(this, opt);

        },
        goTo : function goTo(){
            throw 'Can\'t be called directly from Slider class';
        }
    });

    oo.view.Element.register(Slider, 'slider');

})();/**
 * Slider with a cursor and an overlay preview (optional)
 *
 * @namespace oo.view
 * @el : domElement or queryString
 * @cursor : domElement or queryString (will be move on touch events)
 * @model : model to show (optional)
 * @overlay : domElement or queryString (optional)
 */
(function () {
    
    var Touch = oo.core.Touch;

    var SliderCursor =  oo.getNS('oo.view').SliderCursor = oo.Class(oo.view.Slider, oo.core.mixins.Events, {
        _tplItems : '{{key}}',
        _tplOverlay : '{{key}}',
        _datas : null,
        _step : null,
        _total : null,
        _overlay : null,
        _enabled: true,
        STATIC : {
            EVT_ONGOTO : 'onGoTo'
        },
        constructor: function constructor(opt) {
            SliderCursor.Super.call(this, opt);

            if(!opt.hasOwnProperty('translate')){
                throw new Error('Missing translate property');
            }

            this._prepareView(opt);
            
        },
        _initEvents : function _initEvents(opt){
            var startPos = null, that = this, isAvailable = false, domNode = this.getDomObject(), sWidth = this.getWidth(), sHeight = this.getHeight(),
                minX = domNode.offsetLeft, minY = this._cursor.getDomObject().offsetTop,
                deltaX = minX + this._cursor.getWidth()/2 + this._cursor.getLeft(), deltaY = minY + this._cursor.getHeight()/2 + this._cursor.getTop(),
                maxX = minX + sWidth, maxY = minY + sHeight, tx = (opt.translate.x) ? true : false, ty = (opt.translate.y) ? true : false,
                newx = null;


                var current;


                if(this._datas){
                    this._step = (sWidth/(that._total-1))/2;
                }

            domNode.addEventListener(Touch.EVENT_START, function(e){
                if(!that.isEnabled()) return;
                startPos = Touch.getPosition(e);
                isAvailable = true;
                that._cursor.setWebkitTransitionDuration(0, 'ms');
                if(tx){
                    newx = startPos[0] - deltaX;
                    that._cursor.setTranslateX( newx,'px');
                    if(that._step && that._overlay){
                        that._overlay.setDisplay('block');


                        current = ((Math.ceil(newx/that._step)-1) % 2 !== 0)  ? Math.ceil(newx/(that._step*2)) : Math.ceil(newx/(that._step*2)-1);
                        that._updateOverlay(current);
                    }
                }

                if(ty){
                    that._cursor.setTranslateY(startPos[1] - deltaY,'px');
                }
                
            }, false);

            domNode.addEventListener(Touch.EVENT_MOVE, function(e){
                if(!that.isEnabled()) return;
                var pos = Touch.getPosition(e), x = pos[0], y = pos[1];
                var dir = ( ((x - deltaX) - newx) > 0 ) ? 'right': 'left', update = false, newindex;
                
                if(isAvailable ){

                    if(tx && x >= minX && x <= maxX){
                        newx = x - deltaX;
                        that._cursor.setTranslateX(newx,'px');
                        if(that._step && that._overlay){
                            //impaire en montant
                            if( "right" === dir){
                                if ( (Math.ceil(newx/that._step)-1) % 2 !==0){
                                    newindex = Math.ceil(newx/(that._step*2));
                                    update = true;
                                }
                            } else {
                                //pair en descendant
                                if ( (Math.ceil(newx/that._step)-1) % 2 === 0){
                                    newindex = Math.ceil(newx/(that._step*2)-1);
                                    update = true;
                                }
                            }

                            if(update && current !== newindex ){
                                current = newindex;
                                that._updateOverlay(current);
                            }
                        }
                    }

                    if(ty && y >= minY && y <= maxY){
                        that._cursor.setTranslateY(y - deltaY,'px');
                    }
                }
            }, false);

            domNode.addEventListener(Touch.EVENT_END, function(e){
                if(!that.isEnabled()) return;
                isAvailable = false;
                if( parseInt(current,10) !== null ) {
                    that.goTo(current);
                    that.triggerEvent(SliderCursor.EVT_ONGOTO, [current]);
                }
                if(that._overlay){
                    that._overlay.setDisplay('none');
                }

            }, false);
        },
        goTo : function goTo(index){
            if(this._cursor){
                this._cursor.setTranslateX((index*(this._step*2))+this._cursor.getLeft()/2, 'px');
                this._cursor.setWebkitTransitionDuration(200, 'ms');
            }
        },
        _prepareView : function _prepareView(opt){
            var that = this;
            var callback = function callback(){
                //createCursor and attach events
                if(opt.hasOwnProperty('cursor')){
                    that._cursor = oo.createElement('node',{el:opt.cursor});
                    that._cursor.getDomObject().style.position = "absolute";
                    //dev to good positionning the cursor
                    that.getDomObject().style.position="relative";
                    that._initEvents(opt);
                }
            };

            
            if(opt.overlay){
                this._overlay = oo.createElement('node', {el:opt.overlay, template: opt.overlayTemplate || this._tplOverlay});
                this._overlay.setDisplay('none');
            }

            if(this._model){
                
                if(opt.items){
                    that._createItems(opt);
                }

                this._model.fetch(function(datas){
                   that._datas = datas;
                   that._total = that._datas.length;
                   if(that.list){
                       that.list.appendHtml(that.list.render(datas));
                   }

                   callback();
                   
                });

            } else {
                callback();
            }
            
        },
        _updateOverlay : function _updateOverlay(index){
            this._overlay.appendHtml(this._overlay.render( this._datas[index]));
        },
        _createItems : function _createItems(opt){
            this.list = oo.createElement('list', { el: opt.items.el, template: opt.items.template || this._tplItems, model: this._model});
        },
        setDisabled: function setDisabled(){
            this._enabled = false;
        },
        setEnabled: function setDisabled(){
            this._enabled = true;
        },
        isEnabled : function isEnabled(){
            return this._enabled;
        }
    });

    oo.view.Element.register(SliderCursor, 'sliderCursor');

})();(function (oo) {

    // shorthand
    var Dom = oo.view.Dom,
        Touch = oo.core.Touch,
        ns = oo.getNS('oo.view');
    
    var Popin = ns.Popin = oo.Class(oo.view.Element, {
        STATIC: {
            CLS_OPENED: 'pl-popin-opened',
            CLS_OPENING: 'pl-popin-is-showing',
            CLS_CLOSING: 'pl-popin-is-hiding',
            CLS_CLOSED: 'pl-popin-closed'
        },
        _isOpened : true,
        onOpen : null,
        onClose : null,
        closeOnTap:false,
        constructor: function constructor(conf) {
            Popin.Super.call(this, conf);

            if(conf.hasOwnProperty('close')){
                this._createButtonClose(conf.close);
            }

            if(conf.hasOwnProperty('closeOnTap')){
                this.closeOnTap = conf.closeOnTap;
            }

            if(!this.classList){
                this.setDomObject();
            }

            this.onOpen = conf.onOpen || oo.emptyFn;
            this.onClose = conf.onClose || oo.emptyFn;

            this._initEvents();

            this._isOpened = (this.classList.hasClass(Popin.CLS_CLOSED)) ? false : true;

            if(this._isOpened && !this.classList.hasClass(Popin.CLS_OPENED)){
                this._setOpened();
            }
        },
        _isClosing : function _isClosing(){
            return this.classList.hasClass(Popin.CLS_CLOSING);
        },
        _isOpening : function _isOpening(){
            return this.classList.hasClass(Popin.CLS_OPENING);
        },
        _opening : function _opening(){
            if(!this._isOpening()){
                this.classList.addClass(Popin.CLS_OPENING);
            }
        },
        _setOpened : function _setOpened(){
            if(this._isOpening()){
                this.classList.removeClass(Popin.CLS_OPENING);
            }
            if(!this.classList.hasClass(Popin.CLS_OPENED)){
                this.classList.addClass(Popin.CLS_OPENED);
            }
        },
        _closing : function _closing(){
            if(!this._isClosing()){
                this.classList.addClass(Popin.CLS_CLOSING);
            }
        },
        _setClosed : function _setClosed(){
            if(this._isClosing()){
                this.classList.removeClass(Popin.CLS_CLOSING);
            }
            if(!this.classList.hasClass(Popin.CLS_CLOSED)){
                this.classList.addClass(Popin.CLS_CLOSED);
            }
        },
        open : function open(){
            this.classList.removeClass(Popin.CLS_CLOSED);
            this.classList.removeClass(Popin.CLS_CLOSING);
            this._opening();
            this._isOpened = true;
            this.onOpen();
        },
        close : function close(){
            this.classList.removeClass(Popin.CLS_OPENED);
            this.classList.removeClass(Popin.CLS_OPENING);
            this._closing();
            this._isOpened = false;
            this.onClose();
        },
        _createButtonClose : function _createButtonClose(button){
            var btn = oo.createElement('button', button), that = this;

            btn.addListener(oo.view.Button.EVT_RELEASE, function(){
                that.close();
            });
        },
        isOpened : function isOpened(){
            return this._isOpened;
        },
        _initEvents : function _initEvents(){
            var that = this;
            this.getDomObject().addEventListener('webkitTransitionEnd',function(){
                that[!that._isOpened ? "_setClosed": "_setOpened"]();
            },false);

            if(this.closeOnTap){
              var touchendHandler = function touchendHandler(){
                that.close();
              };
              this.getDomObject().addEventListener(oo.core.Touch.EVENT_END,touchendHandler,false);
            }
        }

    });
    
    oo.view.Element.register(Popin, 'popin');
    
})(oo || {});

/*
 * Carousel :
 * @selector : the dom selector of the container
 * @pager : Boolean
 * @items : Array of Panel object
 */

var oo = (function (oo) {
    
    var Dom = oo.view.Dom, Touch = oo.core.Touch, Events = oo.core.mixins.Events, Button = oo.view.Button, ns = oo.getNS('oo.view');

    var PagerPrevNext = ns.PagerPrevNext = oo.Class(null, Events, {
        buttonPrev : null,
        buttonNext : null,
        STATIC : {
            goToNext:'goToNext',
            goToPrev:'goToPrev',
            CLS_DISABLE:'button-disable'
        },
        constructor:  function constructor(opt){
            if(!opt){
                throw new Error ('Missing options');
            }

            if(!opt.hasOwnProperty('prev') || !opt.hasOwnProperty('next')){
                throw new Error ('Missing previous or next configuration');
            }

            this.buttonPrev = opt.prev;
            this.buttonNext = opt.next;

            delete opt.buttonPrev;
            delete opt.buttonNext;

            if( !(this.buttonPrev instanceof Button) && ("string" === typeof this.buttonPrev || "object" === typeof this.buttonPrev)){
                this.buttonPrev = oo.createElement('button',{el:this.buttonPrev});
            }

            if(!(this.buttonNext instanceof Button) && ("string" === typeof this.buttonNext || "object" === typeof this.buttonNext)){
                this.buttonNext = oo.createElement('button',{el:this.buttonNext});
            }

            this._attachEvents();

        },
        _attachEvents : function _attachEvents(){
            var that = this;

            
            this.buttonPrev.addListener(Button.EVT_RELEASE, function(){
                that.triggerEvent(PagerPrevNext.goToPrev);
            });

            this.buttonNext.addListener(Button.EVT_RELEASE, function(){
                that.triggerEvent(PagerPrevNext.goToNext);
            });
        }
    });

    oo.view.Element.register(PagerPrevNext, 'pagerPrevNext');

    return oo;
})(oo);(function (oo) {

    // shorthand
    var Dom = oo.view.Dom,
        Touch = oo.core.Touch;
    
    var Accordion = oo.getNS('oo.view').Accordion = oo.Class(oo.view.Element, {
        STATIC: {
            CLS_OPENED: 'accordion-section-opened',
            CLS_CLOSED: 'accordion-section-closed',
            SELET_HEADER:'[data-accordionheader]',
            SELET_SECTION:'[data-accordioncontent]'
        },
        _isOpened : true,
        _needToRender: false,
        _openedSection : null,
        constructor: function constructor(conf) {
            Accordion.Super.call(this, conf);
            this._prepareView();
        },
        _prepareView : function _prepareView(){
            var that = this,
            _headerHandler = function _headerHandler(el, sec){
                if(sec.classList.hasClass(Accordion.CLS_OPENED)){
                    that.closeSection(sec);
                } else {
                    that.openSection(sec);
                }
                that.triggerBubblingEvent(oo.view.Element.REFRESH_CONTENT);
            };
            this.children().forEach(function(item){
                var sec = new oo.view.Dom(item);
                //close each sec
                that.closeSection(sec);
                var btnHeader = oo.createElement('button', {el:sec.find('[data-accordionheader]',true)});
                btnHeader.addListener(oo.view.Button.EVT_RELEASE, function(el){
                    _headerHandler(el, sec);
                });
                
            });
        },
        closeSection : function closeSection(section){
            section.classList.removeClass(Accordion.CLS_OPENED);
            section.classList.addClass(Accordion.CLS_CLOSED);
        },
        openSection : function openSection(section){
            if (this._openedSection !== null)
                this.closeSection(this._openedSection);
            section.classList.removeClass(Accordion.CLS_CLOSED);
            section.classList.addClass(Accordion.CLS_OPENED);
            this._openedSection = section;
        }
    });
    
    oo.view.Element.register(Accordion, 'accordion');
    
})(oo || {});/**
 * @namespace oo.view.scroll
 * @class Scroll
 * @requires oo.view.Dom, oo.core.Touch
 */
(function (oo) {

    // shorthand
    var Dom = oo.view.Dom, Touch = oo.core.Touch;
    var scrollRepository = {};
    
    var Scroll = oo.getNS('oo.view.scroll').Scroll = oo.Class(null, oo.core.mixins.Events, {
        STATIC: {
            register: function register (cls, codename) {
                if (scrollRepository[codename])
                    throw 'Already existing codename';

                scrollRepository[codename] = cls;
            },
            get: function get (codename) {
                if (codename in scrollRepository)
                    return scrollRepository[codename];
                else
                    throw 'Invalid codename';
            },
            unregister: function register (codename) {
                delete scrollRepository[codename];
            }
        },
        constructor : function constructor() {
            
        },
        scrollTo : function scrollTo(){
            throw 'Can\'t be called directly from Scroll class';
        },
        refresh : function refresh(){
            throw 'Can\'t be called directly from Scroll class';
        }
    });

})(oo || {});/**
 * @namespace oo.view.scroll
 * @class IScroll
 * @requires oo.view.Dom, oo.core.Touch
 */
(function (oo) {

    // shorthand
    var Dom = oo.view.Dom, Touch = oo.core.Touch, Scroll = oo.view.scroll.Scroll;
    
    var IScroll = oo.getNS('oo.view.scroll').IScroll = oo.Class(Scroll, {
        _scroll : null,
        el : null,
        constructor : function constructor(opt) {
            if(undefined === opt || !opt.hasOwnProperty("el") || "object" !== typeof opt){
                throw new Error('Missing options or missing "el" property in your options or options is not an object');
            }

            this.el = opt.el;
            delete opt.el;
             
            //test if el is an identifier, a dom Node or a oo.view.Dom
            if("string" !== typeof this.el && "undefined" === typeof this.el.nodeType && !(this._isOoDom())){
                throw new Error("el must be a Dom object, a oo.view.Dom or an identifier");
            }

            if(!(this.el instanceof oo.view.Dom)){
                this.el = new oo.view.Dom(this.el);
            }

            IScroll.Super.call(this);

            this._scroll = new iScroll(this.el.getId(), opt);
        },
        _isOoDom : function _isOoDom(){
            return this.el instanceof(oo.view.Dom);
        },
        refresh : function refresh(){
            this._scroll.refresh();
        }
    });

    Scroll.register(IScroll, 'iscroll');

})(oo || {});
/* Lightweight renderer for the NASGP preview pages.
   Reads the page template, fills in the values from the page's script,
   and re-draws when something is clicked or changed. */
(function () {
  var root, tplFrag, comp;

  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }

  function interp(str, scope) {
    return str.replace(/\{\{([^}]+)\}\}/g, function (_, p) {
      var v = lookup(scope, p);
      return v == null ? '' : String(v);
    });
  }

  function renderChildren(parent, scope, out) {
    var kids = parent.childNodes;
    for (var i = 0; i < kids.length; i++) renderNode(kids[i], scope, out);
  }

  function renderNode(node, scope, out) {
    if (node.nodeType === 3) { out.push(document.createTextNode(interp(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'template' && node.getAttribute('data-kind') === 'for') {
      var m = (node.getAttribute('list') || '').match(/\{\{([^}]+)\}\}/);
      var list = m ? lookup(scope, m[1]) : [];
      var as = node.getAttribute('as') || 'item';
      (list || []).forEach(function (item, idx) {
        var s = Object.create(scope); s[as] = item; s.$index = idx;
        renderChildren(node.content, s, out);
      });
      return;
    }
    if (tag === 'template' && node.getAttribute('data-kind') === 'if') {
      var mm = (node.getAttribute('value') || '').match(/\{\{([^}]+)\}\}/);
      if (mm && lookup(scope, mm[1])) renderChildren(node.content, scope, out);
      return;
    }
    var el = document.createElementNS(node.namespaceURI, node.localName);
    for (var a = 0; a < node.attributes.length; a++) {
      var at = node.attributes[a], name = at.name, val = at.value;
      if (/^hint-/.test(name)) continue;
      var whole = val.match(/^\s*\{\{([^}]+)\}\}\s*$/);
      if (/^on/.test(name) && whole) {
        var fn = lookup(scope, whole[1]);
        if (typeof fn === 'function') el.addEventListener(name.slice(2), fn);
        continue;
      }
      var text = interp(val, scope);
      if (name === 'value' && (tag === 'input' || tag === 'textarea')) { el.value = text; el.setAttribute('value', text); continue; }
      el.setAttribute(name, text);
    }
    var kidsOut = [];
    renderChildren(tag === 'template' ? node.content : node, scope, kidsOut);
    kidsOut.forEach(function (k) { el.appendChild(k); });
    out.push(el);
  }

  function draw() {
    var vals = comp.renderVals ? comp.renderVals() : {};
    var out = [];
    renderChildren(tplFrag, vals, out);
    var y = window.scrollY;
    root.replaceChildren.apply(root, out);
    window.scrollTo(0, y);
  }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (p) {
    var next = typeof p === 'function' ? p(this.state, this.props) : p;
    this.state = Object.assign({}, this.state, next);
    draw();
  };
  DCLogic.prototype.forceUpdate = function () { draw(); };

  function boot() {
    root = document.getElementById('dc-root');
    var holder = document.createElement('template');
    holder.innerHTML = document.getElementById('dc-tpl').textContent;
    tplFrag = holder.content;
    var scriptEl = document.querySelector('script[data-dc-script]');
    var props = {};
    try {
      var decl = JSON.parse(scriptEl.getAttribute('data-props') || '{}');
      Object.keys(decl).forEach(function (k) { if (k.charAt(0) !== '$' && decl[k] && 'default' in decl[k]) props[k] = decl[k]['default']; });
    } catch (e) {}
    var Component = new Function('DCLogic', scriptEl.textContent + '\n;return Component;')(DCLogic);
    comp = new Component(props);
    if (!comp.props) comp.props = props;
    if (!comp.state) comp.state = {};
    draw();
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

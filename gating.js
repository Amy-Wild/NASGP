(function () {
  'use strict';

  var TIERS = ['public', 'member', 'plus', 'chambers'];

  // Change gating rules here — no page files need editing
  var PAGE_TIERS = {
    'academy.html':               'member',
    'your-terms.html':            'member',
    'help.html':                  'member',
    'new-to-sessional-work.html': 'member',
    'community.html':             'plus',
    'chambers.html':              'chambers'
  };

  var role = localStorage.getItem('nasgp_proto_role') || 'public';

  window.NASGP = {
    role: role,
    can: function (required) {
      return TIERS.indexOf(role) >= TIERS.indexOf(required);
    },
    setRole: function (r) {
      localStorage.setItem('nasgp_proto_role', r);
      location.reload();
    }
  };

  // Auto-gate: redirect unauthorised visitors to the members hub
  var page = location.pathname.split('/').pop() || 'index.html';
  var required = PAGE_TIERS[page];
  if (required && !NASGP.can(required)) {
    location.replace('members-hub.html');
  }

  // Prototype role switcher — remove before production
  document.addEventListener('DOMContentLoaded', function () {
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:16px;right:16px;background:#0B1F33;color:#fff;border-radius:10px;padding:14px 18px;font-family:system-ui,sans-serif;font-size:13px;z-index:9999;box-shadow:0 4px 24px rgba(0,0,0,.4);min-width:210px;line-height:1.5';
    el.innerHTML =
      '<p style="margin:0 0 6px;font-weight:700;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:#F2765A">Proto — role switcher</p>' +
      '<p style="margin:0 0 10px;color:#D6DEE8;font-size:12px">Viewing as: <strong style="color:#fff">' + role + '</strong></p>' +
      TIERS.map(function (r) {
        return '<button onclick="NASGP.setRole(\'' + r + '\')" style="margin:2px 4px 2px 0;padding:5px 11px;border-radius:5px;border:none;cursor:pointer;font-size:12px;font-weight:600;background:' + (r === role ? '#4FA83D' : '#2A3F5A') + ';color:#fff">' + r + '</button>';
      }).join('');
    document.body.appendChild(el);
  });
}());

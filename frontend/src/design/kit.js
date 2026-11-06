/* eslint-disable */
import React from 'react';
  var h = React.createElement;

  var STATUSES = {
    'submitted': { label: 'Submitted', shape: 'circle' },
    'designing': { label: 'Designing', shape: 'square' },
    'design-done': { label: 'Design Done', shape: 'diamond' },
    'in-prepress': { label: 'In Prepress', shape: 'triangle' },
    'ready': { label: 'Ready for Delivery', shape: 'hexagon' },
    'delivering': { label: 'Delivering', shape: 'arrow' },
    'completed': { label: 'Completed', shape: 'check' },
    'awaiting-approval': { label: 'Awaiting Approval', shape: 'clock' },
    'on-hold': { label: 'On Hold', shape: 'pause' },
    'cancelled': { label: 'Cancelled', shape: 'x' }
  };

  function Shape(props) {
    var s = props.shape, c = { fill: 'currentColor' }, l = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
    var inner;
    if (s === 'circle') inner = h('circle', { cx: 6, cy: 6, r: 4.5, fill: 'none', stroke: 'currentColor', strokeWidth: 2 });
    else if (s === 'square') inner = h('rect', Object.assign({ x: 1.5, y: 1.5, width: 9, height: 9, rx: 1 }, c));
    else if (s === 'diamond') inner = h('polygon', Object.assign({ points: '6,0.5 11.5,6 6,11.5 0.5,6' }, c));
    else if (s === 'triangle') inner = h('polygon', Object.assign({ points: '6,1 11.5,11 0.5,11' }, c));
    else if (s === 'hexagon') inner = h('polygon', Object.assign({ points: '3,1 9,1 11.5,6 9,11 3,11 0.5,6' }, c));
    else if (s === 'arrow') inner = h('path', Object.assign({ d: 'M1.5 6h8M6 2l4 4-4 4' }, l));
    else if (s === 'check') inner = h('path', Object.assign({ d: 'M1.5 6.5l3 3 6-7' }, l));
    else if (s === 'clock') inner = h('g', null, h('circle', { cx: 6, cy: 6, r: 4.5, fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 }), h('path', Object.assign({ d: 'M6 3.5V6l1.8 1.2' }, l)));
    else if (s === 'pause') inner = h('path', Object.assign({ d: 'M4 2v8M8 2v8' }, l));
    else inner = h('path', Object.assign({ d: 'M2 2l8 8M10 2l-8 8' }, l));
    return h('svg', { width: 12, height: 12, viewBox: '0 0 12 12', 'aria-hidden': 'true' }, inner);
  }

  function Check(props) {
    return h('svg', { width: props.size || 20, height: props.size || 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }, h('path', { d: 'M4.5 12.75l6 6 9-13.5' }));
  }

  function Button(props) {
    var variant = props.variant || 'primary', size = props.size || 'md';
    var rest = Object.assign({}, props);
    delete rest.variant; delete rest.size; delete rest.className;
    var cls = 'ud-btn ud-btn-' + variant + (size === 'lg' ? ' ud-btn-lg' : '') + (props.className ? ' ' + props.className : '');
    return h('button', Object.assign({ type: 'button' }, rest, { className: cls }), props.children);
  }

  function StatusBadge(props) {
    var st = STATUSES[props.status] || STATUSES.submitted;
    var key = STATUSES[props.status] ? props.status : 'submitted';
    return h('span', { className: 'ud-badge', style: { background: 'var(--status-' + key + '-bg)', color: 'var(--status-' + key + '-fg)' } },
      h(Shape, { shape: st.shape }), props.label || st.label);
  }

  function OrderCard(props) {
    var meta = props.meta || [];
    return h('article', { className: 'ud-card ud-order ud-root', dir: props.dir },
      h('div', { className: 'ud-order-head' },
        h('div', null,
          h('div', { className: 'ud-order-no' }, props.number),
          h('div', { className: 'ud-order-title' }, props.title)),
        h(StatusBadge, { status: props.status, label: props.statusLabel })),
      meta.length ? h('div', { className: 'ud-order-meta' }, meta.map(function (m, i) {
        return h('div', { key: i }, m[0], h('b', null, m[1]));
      })) : null,
      props.children);
  }

  var DEFAULT_STEPS = ['Submission', 'Design', 'Ripping', 'Prepress', 'Delivery'];
  function OrderStepper(props) {
    var steps = props.steps || DEFAULT_STEPS, cur = props.current == null ? 0 : props.current;
    return h('ol', { className: 'ud-stepper ud-root', dir: props.dir, 'aria-label': props.label || 'Order progress' },
      steps.map(function (s, i) {
        var state = i < cur ? 'done' : (i === cur ? 'current' : 'todo');
        return h('li', { key: i, className: 'ud-step', 'data-state': state, 'aria-current': state === 'current' ? 'step' : undefined },
          h('span', { className: 'ud-dot' }, state === 'done' ? h(Check, { size: 14 }) : i + 1), s);
      }));
  }

  function Dropzone(props) {
    var files = props.files || [];
    return h('div', { className: 'ud-root', dir: props.dir },
      h('div', { className: 'ud-drop', tabIndex: 0, role: 'button' },
        h('strong', null, props.title || 'Drop artwork files here'),
        h('span', null, props.hint || 'PDF, AI, TIFF, up to 200 MB each'),
        h(Button, { variant: 'secondary' }, props.browse || 'Choose files')),
      files.length ? h('ul', { className: 'ud-files' }, files.map(function (f, i) {
        return h('li', { key: i, className: 'ud-file' },
          h('span', { className: 'ud-file-ph' }, (f.ext || 'FILE').toUpperCase()),
          h('span', { className: 'ud-file-name' }, f.name),
          h('span', { className: 'ud-file-size' }, f.size));
      })) : null);
  }

  function PrepressChecklist(props) {
    var items = props.items || [];
    return h('div', { className: 'ud-root', dir: props.dir },
      h('ul', { className: 'ud-check-list' }, items.map(function (it, i) {
        return h('li', { key: i },
          h('button', { type: 'button', className: 'ud-check', 'aria-pressed': it.done ? 'true' : 'false' },
            h('span', { className: 'ud-box' }, it.done ? h(Check, { size: 22 }) : null),
            h('span', { className: 'ud-check-body' }, it.label,
              h('span', { className: 'ud-check-meta' }, it.done ? (it.at + ' · ' + it.by) : (props.pendingLabel || 'Not done yet')))));
      })),
      props.solvent ? h('div', { className: 'ud-solvent' }, h('span', null, props.solventLabel || 'Solvent used'), h('b', null, props.solvent)) : null);
  }

  function KpiTile(props) {
    return h('div', { className: 'ud-card ud-kpi ud-root', dir: props.dir },
      props.icon ? h('span', { className: 'ud-kpi-icon', 'aria-hidden': 'true' }, Ico(props.icon, 20)) : null,
      h('span', { className: 'ud-kpi-label' }, props.label),
      h('span', { className: 'ud-kpi-value', style: props.tone === 'attention' ? { color: 'var(--danger)' } : undefined }, props.value),
      props.note ? h('span', { className: 'ud-kpi-delta' }, props.note) : null,
      props.action ? (typeof props.action === 'object' ? props.action : h('a', { href: '#', className: 'ud-link', style: { fontSize: 14, marginBlockStart: 4 } }, props.action)) : null);
  }

  function Toast(props) {
    var tone = props.tone || 'info';
    return h('div', { className: 'ud-toast ud-root', 'data-tone': tone, role: tone === 'error' ? 'alert' : 'status', dir: props.dir },
      h('span', { 'aria-hidden': 'true', style: { marginBlockStart: 4 } }, h(Shape, { shape: tone === 'success' ? 'check' : tone === 'error' ? 'x' : 'circle' })),
      h('div', null, h('b', null, props.title), props.children ? h('span', null, props.children) : null));
  }

  function ConfirmDialog(props) {
    return h('div', { className: 'ud-dialog ud-root', role: 'alertdialog', 'aria-labelledby': 'ud-dlg-t', dir: props.dir },
      h('h3', { id: 'ud-dlg-t' }, props.title),
      h('p', null, props.children),
      h('div', { className: 'ud-dialog-actions' },
        h(Button, { variant: 'secondary' }, props.cancelLabel || 'Keep order'),
        h(Button, { variant: props.destructive === false ? 'primary' : 'danger' }, props.confirmLabel || 'Cancel order')));
  }

  function TopBar(props) {
    var nav = props.nav || [], lang = props.lang || 'en';
    var count = props.notifications || 0;
    return h('div', { className: 'ud-root', dir: props.dir },
      h('header', { className: 'ud-topbar' },
        h('div', { className: 'ud-brandmark' }, 'UniDots', h('small', null, 'Prepress & Supply Co.')),
        h('nav', { className: 'ud-nav', 'aria-label': 'Main' }, nav.map(function (n, i) {
          return h('a', { key: i, href: '#', 'aria-current': i === (props.active || 0) ? 'page' : undefined }, n);
        })),
        h('div', { className: 'ud-topbar-tools' },
          h('button', { type: 'button', className: 'ud-iconbtn', 'aria-label': props.bellLabel || 'Notifications' },
            h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' },
              h('path', { d: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' })),
            count ? h('span', { className: 'ud-count' }, count) : null),
          h('div', { className: 'ud-lang', role: 'group', 'aria-label': 'Language' },
            h('button', { type: 'button', 'aria-pressed': lang === 'en' ? 'true' : 'false' }, 'EN'),
            h('button', { type: 'button', 'aria-pressed': lang === 'ar' ? 'true' : 'false' }, 'عربي')),
          props.user ? h(Avatar, { name: props.user, onNav: true }) : null)),
      props.title ? h('div', { className: 'ud-crumb' },
        props.crumbs ? h('ol', null, props.crumbs.map(function (c, i) { return h('li', { key: i }, c); })) : null,
        h('h1', null, props.title)) : null);
  }

  function CourierDelivery(props) {
    return h('section', { className: 'ud-card ud-courier ud-root', dir: props.dir },
      h('div', null,
        h('div', { className: 'ud-hint' }, props.orderLabel),
        h('div', { className: 'ud-courier-addr' }, props.client),
        h('div', { style: { color: 'var(--text-muted)' } }, props.address)),
      h('div', { className: 'ud-courier-actions' },
        h(Button, { variant: 'secondary', size: 'lg', className: 'ud-big' }, props.callLabel || 'Call'),
        h(Button, { variant: 'secondary', size: 'lg', className: 'ud-big' }, props.mapLabel || 'Map'),
        h(Button, { variant: 'primary', size: 'lg', className: 'ud-big ud-confirm' }, h(Check, { size: 24 }), props.confirmLabel || 'Confirm delivery')));
  }

  function Icon(props) {
    return h('svg', { width: props.size || 20, height: props.size || 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: props.sw || 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }, h('path', { d: props.path }));
  }
  var P = {
    search: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
    down: 'm19.5 8.25-7.5 7.5-7.5-7.5',
    left: 'M15.75 19.5 8.25 12l7.5-7.5',
    right: 'm8.25 4.5 7.5 7.5-7.5 7.5'
  };

  function Avatar(props) {
    var n = (props.name || '?').trim().split(/\s+/), t = (n[0][0] + (n[1] ? n[1][0] : '')).toUpperCase();
    return h('span', { className: 'ud-avatar' + (props.onNav ? ' ud-avatar-nav' : ''), style: props.size ? { width: props.size, height: props.size } : undefined, role: 'img', 'aria-label': props.name }, t);
  }

  function Tabs(props) {
    var tabs = props.tabs || [], a = props.active || 0;
    return h('div', { className: 'ud-tabs ud-root', role: 'tablist', dir: props.dir, 'aria-label': props.label },
      tabs.map(function (t, i) {
        return h('button', { key: i, type: 'button', role: 'tab', className: 'ud-tab', 'aria-selected': i === a ? 'true' : 'false' },
          t.label || t, t.count != null ? h('span', { className: 'ud-tab-n' }, t.count) : null);
      }));
  }

  function Chips(props) {
    var items = props.items || [], a = props.active || 0;
    return h('div', { className: 'ud-chips ud-root', role: 'group', 'aria-label': props.label, dir: props.dir },
      items.map(function (t, i) {
        return h('button', { key: i, type: 'button', className: 'ud-chip', 'aria-pressed': i === a ? 'true' : 'false' },
          t.label || t, t.count != null ? h('span', { className: 'ud-chip-n' }, t.count) : null);
      }));
  }

  function SearchField(props) {
    return h('div', { className: 'ud-search ud-root', dir: props.dir },
      h(Icon, { path: P.search, size: 20 }),
      h('input', { className: 'ud-input', type: 'search', 'aria-label': props.label || props.placeholder, placeholder: props.placeholder || 'Search', autoComplete: 'off' }));
  }

  function Select(props) {
    var opts = props.options || [];
    var id = props.id || 'ud-s-' + (props.label || props['aria-label'] || 'x').replace(/\W+/g, '-').toLowerCase();
    return h('div', { className: 'ud-field ud-root', dir: props.dir },
      props.label ? h('label', { className: 'ud-label', htmlFor: id }, props.label) : null,
      h('div', { className: 'ud-selectw' },
        h('select', { id: id, className: 'ud-input ud-select', defaultValue: props.value, 'aria-label': props.label ? undefined : props['aria-label'] },
          opts.map(function (o, i) { return h('option', { key: i }, o); })),
        h(Icon, { path: P.down, size: 18 })),
      props.hint ? h('span', { className: 'ud-hint' }, props.hint) : null);
  }

  function DataTable(props) {
    var cols = props.columns || [], rows = props.rows || [];
    return h('div', { className: 'ud-tablew ud-root', dir: props.dir },
      h('table', { className: 'ud-table' },
        props.caption ? h('caption', { className: 'ud-sr' }, props.caption) : null,
        h('thead', null, h('tr', null, cols.map(function (c, i) {
          return h('th', { key: i, scope: 'col', className: c.num ? 'ud-numcol' : undefined }, c.label);
        }))),
        h('tbody', null, rows.map(function (r, ri) {
          return h('tr', { key: ri }, cols.map(function (c, ci) {
            return h(ci === 0 ? 'th' : 'td', { key: ci, scope: ci === 0 ? 'row' : undefined, className: (c.num ? 'ud-numcol ' : '') + (ci === 0 ? 'ud-rowhead' : '') }, r[c.key]);
          }));
        }))));
  }

  function Pagination(props) {
    var items = props.items || [1, 2, 3], page = props.page || 1;
    return h('nav', { className: 'ud-pager ud-root', dir: props.dir, 'aria-label': props.label || 'Pagination' },
      h('span', { className: 'ud-pager-sum' }, props.summary),
      h('div', { className: 'ud-pager-nav' },
        h('button', { type: 'button', className: 'ud-pg', 'aria-label': props.prevLabel || 'Previous page', disabled: page <= 1 }, h(Icon, { path: props.dir === 'rtl' ? P.right : P.left, size: 18 })),
        items.map(function (n, i) {
          return n === '…' ? h('span', { key: i, className: 'ud-pg-gap' }, n)
            : h('button', { key: i, type: 'button', className: 'ud-pg', 'aria-current': n === page ? 'page' : undefined }, n);
        }),
        h('button', { type: 'button', className: 'ud-pg', 'aria-label': props.nextLabel || 'Next page' }, h(Icon, { path: props.dir === 'rtl' ? P.left : P.right, size: 18 }))));
  }

  function FormDialog(props) {
    return h('div', { className: 'ud-dialog ud-form-dialog ud-root', role: 'dialog', 'aria-labelledby': 'ud-fd-t', dir: props.dir },
      h('h3', { id: 'ud-fd-t' }, props.title),
      props.description ? h('p', null, props.description) : null,
      h('div', { className: 'ud-form-grid' }, props.children),
      h('div', { className: 'ud-dialog-actions' },
        h(Button, { variant: 'secondary' }, props.cancelLabel || 'Cancel'),
        h(Button, null, props.submitLabel || 'Save')));
  }

  function Halftone(props) {
    var cols = props.cols || 7, rows = props.rows || 3, pitch = 14, dots = [];
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var r = 1 + ((i + j) / (cols + rows - 2)) * 5;
      dots.push(h('circle', { key: i + '-' + j, cx: 7 + i * pitch, cy: 7 + j * pitch, r: r.toFixed(1), fill: 'currentColor' }));
    }
    return h('svg', { width: cols * pitch, height: rows * pitch, viewBox: '0 0 ' + cols * pitch + ' ' + rows * pitch, 'aria-hidden': 'true', className: 'ud-halftone' }, dots);
  }

  function EmptyState(props) {
    return h('div', { className: 'ud-empty ud-root', dir: props.dir },
      h(Halftone, {}),
      h('strong', null, props.title),
      props.children ? h('span', null, props.children) : null,
      props.action || null);
  }

  function StatusBars(props) {
    var items = props.items || [], max = Math.max.apply(null, items.map(function (i) { return i.count; }).concat([1]));
    return h('div', { className: 'ud-sbars ud-root', dir: props.dir, role: 'list', 'aria-label': props.label },
      items.map(function (it, i) {
        var st = STATUSES[it.status] || STATUSES.submitted;
        return h('div', { key: i, className: 'ud-sb-row', role: 'listitem' },
          h('span', { className: 'ud-sb-label', style: { color: 'var(--status-' + it.status + '-fg)' } }, h(Shape, { shape: st.shape }), h('span', { style: { color: 'var(--text)' } }, it.label || st.label)),
          h('span', { className: 'ud-sb-track' }, h('span', { className: 'ud-sb-fill', style: { width: (it.count ? Math.max(2, it.count / max * 100) : 0) + '%', background: 'var(--status-' + it.status + '-fg)' } })),
          h('span', { className: 'ud-sb-n' }, it.count));
      }));
  }

  function niceStep(x) {
    var p = Math.pow(10, Math.floor(Math.log(x) / Math.LN10)), n = x / p;
    return Math.max(1, (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p);
  }

  function TrendChart(props) {
    var pts = props.points || [], W = 640, H = 240, L = 44, R = 16, T = 20, B = 36;
    var max = Math.max.apply(null, pts.map(function (x) { return x.value; }).concat([0]));
    if (!max) return h('div', { className: 'ud-chart-empty ud-root' }, props.emptyText || 'No orders in this period');
    var step = niceStep(max / 4), top = Math.ceil(max / step) * step, els = [], n = pts.length;
    var x = function (i) { return L + (n === 1 ? 0 : i * (W - L - R) / (n - 1)); };
    var y = function (v) { return T + (H - T - B) * (1 - v / top); };
    for (var t = 0; t <= top; t += step) {
      els.push(h('line', { key: 'g' + t, x1: L, x2: W - R, y1: y(t), y2: y(t), stroke: 'var(--border)', strokeWidth: 1 }));
      els.push(h('text', { key: 'y' + t, x: L - 8, y: y(t) + 4, textAnchor: 'end', fontSize: 12, fill: 'var(--text-muted)' }, t));
    }
    els.push(h('polyline', { key: 'l', fill: 'none', stroke: 'var(--primary)', strokeWidth: 2.5, strokeLinejoin: 'round', points: pts.map(function (p, i) { return x(i) + ',' + y(p.value); }).join(' ') }));
    pts.forEach(function (p, i) {
      els.push(h('circle', { key: 'c' + i, cx: x(i), cy: y(p.value), r: 3.5, fill: 'var(--primary)' }));
      els.push(h('text', { key: 'x' + i, x: x(i), y: H - 12, textAnchor: 'middle', fontSize: 12, fill: 'var(--text-muted)' }, p.label));
    });
    els.push(h('text', { key: 'v', x: x(n - 1), y: y(pts[n - 1].value) - 10, textAnchor: 'end', fontSize: 12, fontWeight: 600, fill: 'var(--text)' }, pts[n - 1].value));
    return h('svg', { className: 'ud-chart ud-root', viewBox: '0 0 ' + W + ' ' + H, width: '100%', role: 'img', 'aria-label': props.label || 'Trend' }, els);
  }

  function TankGauge(props) {
    var pct = Math.max(0, Math.min(100, props.percent)), low = pct < (props.lowAt || 20), H = 160, W = 96, fh = Math.round(H * pct / 100);
    return h('div', { className: 'ud-tank ud-root', dir: props.dir },
      h('svg', { width: W + 4, height: H + 4, viewBox: '0 0 ' + (W + 4) + ' ' + (H + 4), role: 'img', 'aria-label': (props.title || 'Tank') + ' ' + pct + '%' },
        h('defs', null, h('clipPath', { id: 'ud-tank-clip' }, h('rect', { x: 2, y: 2, width: W, height: H, rx: 12 }))),
        h('rect', { x: 2, y: 2, width: W, height: H, rx: 12, fill: 'var(--bg-card)' }),
        h('g', { clipPath: 'url(#ud-tank-clip)' }, h('rect', { x: 2, y: 2 + H - fh, width: W, height: fh, fill: low ? 'var(--danger)' : 'var(--brand-500)' })),
        h('rect', { x: 2, y: 2, width: W, height: H, rx: 12, fill: 'none', stroke: 'var(--border-control)', strokeWidth: 2 })),
      h('div', { className: 'ud-tank-body' },
        h('span', { className: 'ud-kpi-label' }, props.title),
        h('b', { className: 'ud-kpi-value' }, props.liters),
        h('span', { className: 'ud-kpi-delta' }, props.capacity),
        h('span', { className: 'ud-badge', style: low ? { background: 'var(--danger-bg)', color: 'var(--danger)' } : { background: 'var(--status-completed-bg)', color: 'var(--status-completed-fg)' } }, h(Shape, { shape: low ? 'x' : 'check' }), props.statusLabel || (low ? 'Low' : 'Level OK'))));
  }

  function PlateCanvas(props) {
    var pw = props.width, ph = props.height, s = (props.maxPx || 560) / pw, m = props.margin || 0, W = Math.round(pw * s), H = Math.round(ph * s), els = [];
    els.push(h('rect', { key: 'p', x: 1, y: 1, width: W, height: H, fill: 'var(--bg-card)', stroke: 'var(--border-control)', strokeWidth: 2 }));
    els.push(h('rect', { key: 'm', x: 1 + m * s, y: 1 + m * s, width: W - 2 * m * s, height: H - 2 * m * s, fill: 'none', stroke: 'var(--border-control)', strokeWidth: 1, strokeDasharray: '4 4' }));
    (props.placements || []).forEach(function (p, i) {
      var rw = p.w * s, rh = p.h * s;
      els.push(h('rect', { key: 'r' + i, x: 1 + p.x * s, y: 1 + p.y * s, width: rw, height: rh, fill: 'var(--selected)', stroke: 'var(--primary)', strokeWidth: 2 }));
      var lab = p.label; if (lab.length * 6.8 > rw - 16) lab = lab.split(' \u00B7 ')[0];
      if (lab.length * 6.8 <= rw - 16 && rh > 30) els.push(h('text', { key: 't' + i, x: 1 + p.x * s + 8, y: 1 + p.y * s + 20, fontSize: 12, fontWeight: 600, fill: 'var(--text)' }, lab));
    });
    return h('figure', { className: 'ud-plate ud-root', dir: props.dir },
      h('svg', { width: W + 2, height: H + 2, viewBox: '0 0 ' + (W + 2) + ' ' + (H + 2), role: 'img', 'aria-label': props.label || 'Plate layout' }, els),
      h('figcaption', null, props.caption || (pw + ' × ' + ph + ' mm')));
  }

  function Progress(props) {
    var v = Math.max(0, Math.min(100, props.value));
    return h('div', { className: 'ud-progress-w ud-root', dir: props.dir },
      props.label ? h('div', { className: 'ud-progress-h' }, h('span', null, props.label), h('b', null, v + '%')) : null,
      h('div', { className: 'ud-progress', role: 'progressbar', 'aria-valuenow': v, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': props.label }, h('span', { style: { width: v + '%' } })));
  }

  function DefList(props) {
    var items = props.items || [];
    return h('dl', { className: 'ud-deflist ud-root', dir: props.dir, style: { '--cols': props.cols || 2 } },
      items.map(function (it, i) { return h('div', { key: i }, h('dt', null, it[0]), h('dd', null, it[1])); }));
  }

  var LEVELS = { low: 1, medium: 2, high: 3, urgent: 4 };
  function PriorityBadge(props) {
    var lv = props.level || 'medium', n = LEVELS[lv] || 2, bars = [];
    for (var i = 1; i <= 4; i++) bars.push(h('rect', { key: i, x: (i - 1) * 3.5, y: 12 - i * 3, width: 2.5, height: i * 3, fill: i <= n ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 1 }));
    return h('span', { className: 'ud-prio', 'data-level': lv }, h('svg', { width: 14, height: 12, viewBox: '0 0 14 12', 'aria-hidden': 'true' }, bars), props.label || lv.charAt(0).toUpperCase() + lv.slice(1));
  }

  function ActionBar(props) {
    return h('div', { className: 'ud-actionbar ud-root', dir: props.dir }, props.children);
  }

  function Field(props) {
    var id = props.id || 'ud-f-' + (props.label || 'x').replace(/\W+/g, '-').toLowerCase();
    var descIds = [];
    if (props.hint) descIds.push(id + '-hint');
    if (props.error) descIds.push(id + '-err');
    var common = { id: id, className: 'ud-input', defaultValue: props.value, placeholder: props.placeholder, readOnly: props.readOnly, required: props.required, autoComplete: props.autoComplete || (props.type === 'password' ? 'new-password' : 'off'), 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': descIds.join(' ') || undefined };
    return h('div', { className: 'ud-field ud-root', dir: props.dir },
      h('label', { className: 'ud-label', htmlFor: id }, props.label, props.required ? h('span', { className: 'ud-req', 'aria-hidden': 'true' }, ' *') : null),
      props.multiline ? h('textarea', Object.assign({ rows: props.rows || 4 }, common, { className: 'ud-input ud-textarea' })) : h('input', Object.assign({ type: props.type || 'text' }, common)),
      props.hint ? h('span', { id: id + '-hint', className: 'ud-hint' }, props.hint) : null,
      props.error ? h('span', { id: id + '-err', className: 'ud-error', role: 'alert' }, props.error) : null);
  }

  function AuthLayout(props) {
    return h('div', { className: 'ud-auth ud-root', dir: props.dir },
      h('aside', { className: 'ud-auth-aside' },
        h('div', null, props.brand || null, h('h2', null, props.title), h('p', null, props.text)),
        h('ul', null, (props.points || []).map(function (p, i) { return h('li', { key: i }, h(Check, { size: 20 }), p); }))),
      h('div', { className: 'ud-auth-main' },
        props.back ? (typeof props.back === 'object' ? props.back : h('a', { href: '#', className: 'ud-link ud-back' }, h(Icon, { path: props.dir === 'rtl' ? P.right : P.left, size: 18 }), props.back)) : null,
        props.children));
  }

  function ColorOptions(props) {
    var opts = props.options || [];
    return h('fieldset', { className: 'ud-colors ud-root', dir: props.dir },
      h('legend', { className: 'ud-label' }, props.label),
      props.hint ? h('p', { className: 'ud-hint', style: { margin: '0 0 8px' } }, props.hint) : null,
      h('div', { className: 'ud-color-grid' }, opts.map(function (o, i) {
        return h('label', { key: i, className: 'ud-coloropt' },
          h('input', { type: 'checkbox', defaultChecked: !!o.checked }),
          h('span', { className: 'ud-swatch', style: { background: o.swatch } }),
          o.label);
      })));
  }

  function RadioGroup(props) {
    var items = props.items || [];
    return h('fieldset', { className: 'ud-radios ud-root', dir: props.dir },
      props.label ? h('legend', { className: 'ud-label' }, props.label) : null,
      items.map(function (it, i) {
        return h('div', { key: i, className: 'ud-radio-row' },
          h('label', { className: 'ud-radio' }, h('input', { type: 'radio', name: props.name || 'ud-r', defaultChecked: !!it.checked }),
            h('span', null, h('b', null, it.label), it.hint ? h('span', { className: 'ud-hint' }, it.hint) : null)),
          it.checked && it.extra ? h('div', { className: 'ud-radio-extra' }, it.extra) : null);
      }));
  }

  function Notice(props) {
    return h('div', { className: 'ud-notice ud-root', role: 'note', 'data-tone': props.tone || 'info', dir: props.dir },
      props.title ? h('b', null, props.title) : null, h('span', null, props.children));
  }

  function ProgressTimeline(props) {
    var stages = props.stages || [];
    return h('ol', { className: 'ud-timeline ud-root', dir: props.dir },
      stages.map(function (s, i) {
        return h('li', { key: i, className: 'ud-stage', 'data-state': s.state },
          h('div', { className: 'ud-stage-head' },
            h('span', { className: 'ud-dot' }, s.state === 'done' ? h(Check, { size: 14 }) : i + 1),
            h('div', null, h('b', null, s.title), h('span', { className: 'ud-hint', style: { display: 'block' } }, s.note))),
          s.subs ? h('div', { className: 'ud-stage-subs' }, h('span', { className: 'ud-label' }, s.subsTitle),
            h('ul', null, s.subs.map(function (u, j) {
              return h('li', { key: j, 'data-done': u.done ? 'true' : 'false' },
                u.done ? h(Check, { size: 16 }) : h('svg', { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': 'true' }, h('circle', { cx: 8, cy: 8, r: 6, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 })),
                u.label, h('span', { className: 'ud-sr' }, u.done ? ' (' + (props.doneLabel || 'done') + ')' : ''));
            }))) : null);
      }));
  }

  function FileList(props) {
    var groups = props.groups || [];
    return h('div', { className: 'ud-filelist ud-root', dir: props.dir },
      groups.map(function (g, i) {
        return h('section', { key: i }, h('h3', null, g.title),
          h('ul', null, g.items.map(function (it, j) {
            return h('li', { key: j }, h('span', { className: 'ud-file-name' }, it.name, it.meta ? h('span', { className: 'ud-hint', style: { display: 'block', whiteSpace: 'normal' } }, it.meta) : null),
              h('a', { href: '#', className: 'ud-link' }, it.action));
          })));
      }));
  }

  function ProcessGrid(props) {
    var items = props.items || [], labels = props.labels || {}, primaryDone = false;
    return h('ul', { className: 'ud-procgrid ud-root', dir: props.dir },
      items.map(function (it, i) {
        var isNext = !it.done && !primaryDone; if (isNext) primaryDone = true;
        return h('li', { key: i, className: 'ud-proc', 'data-done': it.done ? 'true' : 'false' },
          h('div', { className: 'ud-proc-top' }, h('b', null, it.label),
            h('span', { className: 'ud-badge', style: it.done ? { background: 'var(--status-completed-bg)', color: 'var(--status-completed-fg)' } : { background: 'var(--bg-app)', color: 'var(--text-muted)', border: '1px solid var(--border-control)' } },
              h(Shape, { shape: it.done ? 'check' : 'circle' }), it.done ? (labels.done || 'Done') : (labels.todo || 'Waiting'))),
          h('span', { className: 'ud-check-meta' }, it.done ? it.meta : (labels.pending || 'Not done yet')),
          h(Button, { variant: it.done ? 'ghost' : (isNext ? 'primary' : 'secondary'), size: 'lg', style: { width: '100%' } }, it.done ? (labels.redo || 'Redo') : (labels.complete || 'Complete')));
      }));
  }

  function ChatFab(props) {
    return h('button', { type: 'button', className: 'ud-fab', 'aria-label': props.label || 'Open chat' },
      h(Icon, { path: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155', size: 24 }));
  }

  var IC = {
    home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
    orders: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h6',
    claims: 'M12 3l10 18H2zM12 10v5M12 18v.5',
    tasks: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6',
    people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M21 19c0-2.2-1.5-4-3.5-4.6',
    reports: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    production: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
    history: 'M12 7v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4',
    truck: 'M2 6h12v10H2zM14 9h4l4 4v3h-8zM6 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7',
    plus: 'M12 5v14M5 12h14',
    phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
    map: 'M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    back: 'M15 5l-7 7 7 7',
    chat: 'M4 5h16v11H9l-5 4z',
    bell: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0'
  };
  var NAMEICON = { 'Dashboard': 'home', 'Home': 'home', 'Orders': 'orders', 'Claims': 'claims', 'Tasks': 'tasks', 'People': 'people', 'Reports': 'reports', 'Production': 'production', 'Profile': 'user', 'Today': 'truck', 'History': 'history', 'More': 'production', 'الطلبات': 'orders', 'الطلبات السابقة': 'history', 'السابقة': 'history', 'الحساب': 'user', 'اليوم': 'truck', 'السجل': 'history' };
  function Ico(name, size, cls) {
    return h('svg', { width: size || 20, height: size || 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', className: cls }, h('path', { d: IC[name] || IC.home }));
  }
  function navItem(n) { return typeof n === 'string' ? { label: n, icon: NAMEICON[n] || 'home' } : { label: n.label, icon: n.icon || NAMEICON[n.label] || 'home', badge: n.badge }; }

  function ShellParts(p) {
    var nav = (p.nav || []).map(navItem), lang = p.lang || 'en', count = p.notifications || 0;
    return h(React.Fragment, null,
      h('aside', { className: 'ud-side ud-root' },
        h('div', { className: 'ud-brandmark' }, 'UniDots', h('small', null, p.portal || 'Prepress & Supply Co.')),
        h('nav', { 'aria-label': p.navLabel || 'Main' }, nav.map(function (n, i) {
          return h('a', { key: i, href: '#', 'aria-current': i === (p.active || 0) ? 'page' : undefined }, Ico(n.icon, 20), h('span', null, n.label), n.badge ? h('span', { className: 'ud-pill' }, n.badge) : null);
        })),
        p.user ? h('div', { className: 'ud-side-foot' }, h(Avatar, { name: p.user, onNav: true }), h('div', null, h('strong', null, p.user), p.role ? h('small', null, p.role) : null)) : null),
      h('header', { className: 'ud-pagehead ud-root' },
        h('div', { className: 'ud-pagehead-text' },
          p.crumbs ? h('ol', null, p.crumbs.map(function (c, i) { return h('li', { key: i }, c); })) : null,
          h('h1', null, p.title),
          p.subtitle ? h('p', null, p.subtitle) : null),
        h('div', { className: 'ud-pagehead-tools' },
          p.actions || null,
          h('button', { type: 'button', className: 'ud-iconbtn', 'aria-label': p.bellLabel || 'Notifications' }, Ico('bell', 24), count ? h('span', { className: 'ud-count' }, count) : null),
          h('div', { className: 'ud-lang', role: 'group', 'aria-label': 'Language' },
            h('button', { type: 'button', 'aria-pressed': lang === 'en' ? 'true' : 'false' }, 'EN'),
            h('button', { type: 'button', 'aria-pressed': lang === 'ar' ? 'true' : 'false' }, 'عربي')))));
  }
  function AppShell(p) {
    return h('div', { className: 'ud-shell', dir: p.dir }, h(ShellParts, p), h('div', { className: 'ud-content' }, React.Children.toArray(p.children)));
  }

  function MobileScreen(p) {
    var tabs = (p.tabs || []).map(navItem);
    return h('div', { className: 'ud-root ud-phone', dir: p.dir },
      h('header', { className: 'ud-m-bar' },
        p.back ? h('button', { type: 'button', className: 'ud-iconbtn', 'aria-label': p.backLabel || 'Back' }, Ico('back', 24, 'ud-flip')) : null,
        h('h1', null, p.title),
        p.action || null,
        h('button', { type: 'button', className: 'ud-iconbtn', 'aria-label': p.bellLabel || 'Notifications' }, Ico('bell', 24), p.notifications ? h('span', { className: 'ud-count' }, p.notifications) : null)),
      h('div', { className: 'ud-m-body' }, p.children),
      p.cta ? h('div', { className: 'ud-m-cta' }, p.cta) : null,
      h('nav', { className: 'ud-m-tabs', 'aria-label': p.navLabel || 'Main' }, tabs.map(function (t, i) {
        return h('a', { key: i, href: '#', 'aria-current': i === (p.active || 0) ? 'page' : undefined }, Ico(t.icon, 24), h('span', null, t.label));
      })));
  }

  function OrderRow(p) {
    return h('article', { className: 'ud-card ud-orderrow ud-root', dir: p.dir },
      h('div', { className: 'ud-orderrow-top' }, h('span', { className: 'ud-order-no' }, p.no), p.status || null),
      h('strong', { className: 'ud-orderrow-title' }, p.title),
      p.meta ? h('span', { className: 'ud-orderrow-meta' }, p.meta) : null,
      p.progress !== undefined ? h(Progress, { dir: p.dir, label: p.progressLabel || 'Progress', value: p.progress }) : null);
  }


export { Shape, Check, Ico, IC, Halftone, Button, StatusBadge, OrderCard, OrderStepper, Field, Dropzone, PrepressChecklist, KpiTile, Toast, ConfirmDialog, TopBar, CourierDelivery, Tabs, Chips, SearchField, Select, DataTable, Pagination, FormDialog, Avatar, EmptyState, StatusBars, TrendChart, TankGauge, PlateCanvas, Progress, DefList, PriorityBadge, ActionBar, AuthLayout, ColorOptions, RadioGroup, Notice, ProgressTimeline, FileList, ProcessGrid, ChatFab, ShellParts, AppShell, MobileScreen, OrderRow };

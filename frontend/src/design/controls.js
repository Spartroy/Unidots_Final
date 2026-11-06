import React from 'react';

// Interactive (controlled) versions of the design-system form controls.
// Same markup and class names as the reference kit (kit.js), but they accept value/onChange and real handlers.

const slug = (s) => String(s || 'x').replace(/\W+/g, '-').toLowerCase();

export const Field = ({ label, hint, error, required, multiline, rows = 4, id, type = 'text', className = '', dir, children, ...rest }) => {
  const fid = id || `ud-f-${slug(label)}`;
  const described = [hint ? `${fid}-hint` : null, error ? `${fid}-err` : null].filter(Boolean).join(' ') || undefined;
  const common = { id: fid, required, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': described, ...rest };
  return (
    <div className={`ud-field ud-root ${className}`} dir={dir}>
      <label className="ud-label" htmlFor={fid}>
        {label}
        {required ? <span className="ud-req" aria-hidden="true"> *</span> : null}
      </label>
      {multiline ? <textarea rows={rows} className="ud-input ud-textarea" {...common} /> : <input type={type} className="ud-input" {...common} />}
      {hint ? <span id={`${fid}-hint`} className="ud-hint">{hint}</span> : null}
      {error ? <span id={`${fid}-err`} className="ud-error" role="alert">{error}</span> : null}
      {children}
    </div>
  );
};

export const Select = ({ label, hint, options = [], id, className = '', dir, ...rest }) => {
  const sid = id || `ud-s-${slug(label || rest['aria-label'])}`;
  return (
    <div className={`ud-field ud-root ${className}`} dir={dir}>
      {label ? <label className="ud-label" htmlFor={sid}>{label}</label> : null}
      <div className="ud-selectw">
        <select id={sid} className="ud-input ud-select" {...rest}>
          {options.map((o) => {
            const opt = typeof o === 'object' ? o : { value: o, label: o };
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
      {hint ? <span className="ud-hint">{hint}</span> : null}
    </div>
  );
};

export const SearchField = ({ label, placeholder, dir, className = '', ...rest }) => (
  <div className={`ud-search ud-root ${className}`} dir={dir}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
    <input className="ud-input" type="search" aria-label={label || placeholder} placeholder={placeholder} autoComplete="off" {...rest} />
  </div>
);

// Filter chips: items = [{ key, label, count }], value = active key, onChange(key)
export const Chips = ({ items = [], value, onChange, label, dir }) => (
  <div className="ud-chips ud-root" role="group" aria-label={label} dir={dir}>
    {items.map((it) => (
      <button key={it.key} type="button" className="ud-chip" aria-pressed={it.key === value ? 'true' : 'false'} onClick={() => onChange && onChange(it.key)}>
        {it.label}
        {it.count != null ? <span className="ud-chip-n">{it.count}</span> : null}
      </button>
    ))}
  </div>
);

// Pagination with real handlers
export const Pager = ({ page, pages, summary, onPage, prevLabel = 'Previous page', nextLabel = 'Next page', label = 'Pagination', dir }) => {
  const rtl = dir === 'rtl';
  const numbers = [];
  for (let n = 1; n <= pages; n += 1) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) numbers.push(n);
    else if (numbers[numbers.length - 1] !== '…') numbers.push('…');
  }
  const arrow = (d) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
  const LEFT = 'M15.75 19.5 8.25 12l7.5-7.5';
  const RIGHT = 'm8.25 4.5 7.5 7.5-7.5 7.5';
  return (
    <nav className="ud-pager ud-root" dir={dir} aria-label={label}>
      <span className="ud-pager-sum">{summary}</span>
      <div className="ud-pager-nav">
        <button type="button" className="ud-pg" aria-label={prevLabel} disabled={page <= 1} onClick={() => onPage(page - 1)}>{arrow(rtl ? RIGHT : LEFT)}</button>
        {numbers.map((n, i) =>
          n === '…' ? (
            <span key={`g${i}`} className="ud-pg-gap">…</span>
          ) : (
            <button key={n} type="button" className="ud-pg" aria-current={n === page ? 'page' : undefined} onClick={() => onPage(n)}>{n}</button>
          )
        )}
        <button type="button" className="ud-pg" aria-label={nextLabel} disabled={page >= pages} onClick={() => onPage(page + 1)}>{arrow(rtl ? LEFT : RIGHT)}</button>
      </div>
    </nav>
  );
};

// Tabs: items = [{ key, label, count }], value = active key
export const Tabs = ({ items = [], value, onChange, label, dir }) => (
  <div className="ud-tabs ud-root" role="tablist" aria-label={label} dir={dir}>
    {items.map((it) => (
      <button key={it.key} type="button" role="tab" className="ud-tab" aria-selected={it.key === value ? 'true' : 'false'} onClick={() => onChange && onChange(it.key)}>
        {it.label}
        {it.count != null ? <span className="ud-tab-n">{it.count}</span> : null}
      </button>
    ))}
  </div>
);

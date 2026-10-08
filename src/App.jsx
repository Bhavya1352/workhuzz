import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { DEPTS, TODAY, D, iso, addDays, isWknd, nowT, mins, fmtDur, t12, dur, pad, seedEmps, seedAtt, getStatus, ACCOUNTS, seedLeaves, LEAVE_TYPES, fmtSalary } from './data';

const Ctx = createContext();
const useApp = () => useContext(Ctx);
const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) || f() } catch { return f() } };
const ST = ['Present', 'Late', 'Absent', 'Leave', 'Weekend', 'Upcoming'];

const statusLabel = s => {
  if (s === 'Leave') return 'On Leave';
  if (s === 'Weekend' || s === '—') return 'Weekend / Off';
  if (s === 'Upcoming') return 'Upcoming';
  return s || '—';
};

function Provider({ children }) {
  const [emps, setEmps] = useState(() => load('wh_e', seedEmps));
  const [att, setAtt] = useState(() => load('wh_a', seedAtt));
  const [leaves, setLeaves] = useState(() => load('wh_l', seedLeaves));
  const [user, setUser] = useState(() => load('wh_u', () => null));
  const [q, setQ] = useState('');
  const [toast, setToast] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('wh_theme') || 'light');

  useEffect(() => localStorage.setItem('wh_e', JSON.stringify(emps)), [emps]);
  useEffect(() => localStorage.setItem('wh_a', JSON.stringify(att)), [att]);
  useEffect(() => localStorage.setItem('wh_l', JSON.stringify(leaves)), [leaves]);
  useEffect(() => localStorage.setItem('wh_u', JSON.stringify(user)), [user]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('wh_theme', theme);
  }, [theme]);

  const say = m => { setToast(m); setTimeout(() => setToast(''), 2600) };
  const st = (id, d) => getStatus(att, id, d, emps.find(e => e.id === id));
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const v = {
    emps, att, leaves, user, q, setQ, say, st, setUser, theme, setTheme, toggleTheme,
    addEmp: e => setEmps(l => [...l, { ...e, id: 'E' + pad(l.length + Math.floor(Math.random() * 900) + 13), status: 'Active', leave: 12, employmentType: e.employmentType || 'Full-time' }]),
    editEmp: e => setEmps(l => l.map(x => x.id === e.id ? { ...x, ...e } : x)),
    delEmp: id => setEmps(l => l.filter(x => x.id !== id)),
    checkIn: id => { const t = nowT(); setAtt(a => ({ ...a, [id + '|' + TODAY]: { in: t, out: null, status: mins(t) > 570 ? 'Late' : 'Present' } })) },
    checkOut: id => { const prev = att[id + '|' + TODAY]; if (!prev) return; const o = nowT(); setAtt(a => ({ ...a, [id + '|' + TODAY]: { ...prev, out: o, status: mins(prev.in) > 570 ? 'Late' : 'Present' } })); },
    applyLeave: lv => setLeaves(l => [...l, { ...lv, id: 'L' + pad(l.length + 1), status: 'Pending', applied: TODAY }]),
    updateLeave: (id, status) => setLeaves(l => l.map(x => x.id === id ? { ...x, status } : x)),
    reset: () => { setEmps(seedEmps()); setAtt(seedAtt()); setLeaves(seedLeaves()) }
  };

  return (
    <Ctx.Provider value={v}>
      {children}
      <div className="toast" role="status" aria-live="polite">{toast && <span>{toast}</span>}</div>
    </Ctx.Provider>
  );
}

/* ---------- Shared UI ---------- */
const Badge = ({ s, label }) => <span className={'badge s-' + s}>{label || statusLabel(s)}</span>;

const Field = ({ label, error, ...p }) => (
  <label className="field">
    <span>{label}</span>
    {p.options ? <select {...p}>{p.options.map(o => <option key={o}>{o}</option>)}</select> : <input {...p} />}
    {error && <em role="alert">{error}</em>}
  </label>
);

function Modal({ title, onClose, children }) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, []);
  return (
    <div className="scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="split"><h2>{title}</h2><button className="x" aria-label="Close" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}

function Pager({ n, page, set, per }) {
  const pages = Math.max(1, Math.ceil(n / per));
  return (
    <div className="split pager">
      <small>{n} result{n !== 1 && 's'}</small>
      <div className="row">
        <button className="btn ghost sm" disabled={page <= 1} onClick={() => set(page - 1)}>Previous</button>
        <small>Page {page} of {pages}</small>
        <button className="btn ghost sm" disabled={page >= pages} onClick={() => set(page + 1)}>Next</button>
      </div>
    </div>
  );
}

const Empty = ({ t, d }) => <div className="empty"><b>{t}</b><p>{d}</p></div>;

function Filters({ dept, setDept, stat, setStat, stats, disabledDeptLabel }) {
  return (
    <div className="row filters">
      <label className="filter-label">Department
        <select value={dept} onChange={e => setDept(e.target.value)} disabled={!!disabledDeptLabel}>
          <option value="">{disabledDeptLabel || 'All departments'}</option>
          {!disabledDeptLabel && DEPTS.map(d => <option key={d}>{d}</option>)}
        </select>
      </label>
      {setStat && <label className="filter-label">Status
        <select value={stat} onChange={e => setStat(e.target.value)}>
          <option value="">All statuses</option>
          {stats.map(d => <option key={d} value={d}>{statusLabel(d)}</option>)}
        </select>
      </label>}
    </div>
  );
}

const match = (e, q) => !q || (e.name + e.department + e.role + e.email).toLowerCase().includes(q.toLowerCase());

function Summary({ items }) {
  return (
    <div className="sum">
      {items.map(([l, v, cls]) => (
        <div key={l}>
          <small>{l}</small>
          <strong className={cls ? `val-${cls}` : ''}>{v}</strong>
        </div>
      ))}
    </div>
  );
}

function useAttStats(empList) {
  const { st } = useApp();
  const c = { Present: 0, Late: 0, Absent: 0, Leave: 0, Weekend: 0, Upcoming: 0 };
  empList.forEach(e => { const s = st(e.id, TODAY); if (c[s] != null) c[s]++; });
  const working = empList.length - c.Weekend - c.Upcoming;
  return { c, n: empList.length, rate: working > 0 ? Math.round((c.Present + c.Late) / working * 100) : 0 };
}

/* ---------- Landing ---------- */
function HeroRing({ rate, present, away, working }) {
  const R = 88, C = 2 * Math.PI * R, fill = C * (rate / 100);
  return (
    <div className="hero-ring" aria-hidden="true">
      <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="110" cy="110" r={R} strokeWidth="10" className="ring-track" />
        <circle cx="110" cy="110" r={R} strokeWidth="10" className="ring-fill"
          strokeDasharray={`${fill} ${C}`} strokeDashoffset={C * 0.25} strokeLinecap="round" />
        <text x="110" y="100" textAnchor="middle" className="ring-pct">{rate}%</text>
        <text x="110" y="126" textAnchor="middle" className="ring-label">Attendance today</text>
        <text x="110" y="148" textAnchor="middle" className="ring-stats">{String(present).padStart(2, '0')} Present · {String(away).padStart(2, '0')} Away</text>
      </svg>
      <p className="ring-delta">{present} of {working} employees present</p>
    </div>
  );
}

function Landing() {
  const { emps, st, theme, toggleTheme } = useApp();
  const present = emps.filter(e => ['Present', 'Late'].includes(st(e.id, TODAY))).length;
  const away = emps.filter(e => ['Absent', 'Leave'].includes(st(e.id, TODAY))).length;
  const working = emps.filter(e => !['Weekend', 'Upcoming'].includes(st(e.id, TODAY))).length;
  const rate = working > 0 ? Math.round(present / working * 100) : 0;
  const F = [
    ['Employee records', 'Add, edit, and manage employee profiles with department, role, and contact details.'],
    ['Attendance tracking', 'One-tap check-in and check-out. Late arrivals are flagged after 9:30 AM.'],
    ['Weekly view', 'See Monday through Sunday attendance for every employee, filtered by department or name.'],
    ['Weekend handling', 'Weekends are off by default. Scheduled Saturday shifts show real hours, not false absences.'],
    ['Role-based access', 'Admins see the entire company. HR works by department. Employees see only their own record.']
  ];
  return (
    <div className="land">
      <header className="top">
        <div className="top-inner">
          <Link to="/" className="logo">WorkHuzz</Link>
          <nav aria-label="Main">
            <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }) }}>Features</a>
            <a href="#roles" onClick={e => { e.preventDefault(); document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' }) }}>Roles</a>
          </nav>
          <div>
            <button className="theme-btn" aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? '◐ Light' : '◑ Dark'}</button>
            <Link className="btn ghost" to="/login">Login</Link>
            <Link className="btn" to="/login">Get Started</Link>
          </div>
        </div>
      </header>
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">Workforce Management</span>
          <h1>Manage your workforce<br />all in one place.</h1>
          <p>WorkHuzz brings employee records, attendance and workforce visibility into one place—no more spreadsheets, no more missing data.</p>
          <div className="hero-ctas">
            <Link className="btn lg" to="/login">Get Started</Link>
            <Link className="btn ghost lg" to="/login">View Preview</Link>
          </div>
        </div>
        <HeroRing rate={rate} present={present} away={away} working={working} />
      </section>
      <section id="features" className="feat">
        <h2>Everything your workforce needs</h2>
        <dl className="feat-list">{F.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
      </section>
      <section id="roles" className="roles">
        <h2>Designed for every role</h2>
        <div className="role-cards">
          <div className="role-card"><div className="role-icon">👁</div><h3>Admin</h3><p>See the whole workforce at a glance. Track company-wide attendance, manage employees and oversee all departments from one dashboard.</p></div>
          <div className="role-card"><div className="role-icon">👥</div><h3>HR</h3><p>Manage people, departments and attendance. Filter by team, track leave balances and handle employee records efficiently.</p></div>
          <div className="role-card"><div className="role-icon">👤</div><h3>Employee</h3><p>Track your own attendance and working time. Check in and out with one tap, view your weekly schedule and leave balance.</p></div>
        </div>
      </section>
      <section className="cta">
        <h2>One place for your entire workforce.</h2>
        <p>Give admins, HR teams and employees a simpler way to manage attendance.</p>
        <div className="cta-actions">
          <Link className="btn lg" to="/login">Get Started</Link>
          <Link className="btn ghost lg" to="/login">View Demo</Link>
        </div>
      </section>
      <footer className="land-footer">
        <p>
          <span className="ft-tagline"><strong>WorkHuzz</strong> — Simple workforce management for modern teams</span>
          <span className="ft-divider">|</span>
          <span className="ft-copy">© {new Date().getFullYear()} WorkHuzz · Privacy · Terms</span>
        </p>
      </footer>
    </div>
  );
}

/* ---------- Login ---------- */
function Login() {
  const { setUser, say, user, theme, toggleTheme } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '', remember: true });
  const [show, setShow] = useState(false);
  const [er, setEr] = useState({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (user) nav('/' + user.role, { replace: true }) }, [user]);

  const go = e => {
    e.preventDefault();
    const x = {};
    if (!f.email) x.email = 'Enter your email.';
    else if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email like name@company.com.';
    if (!f.password) x.password = 'Enter your password.';
    else if (f.password.length < 6) x.password = 'Password must be at least 6 characters.';
    setEr(x); setMsg('');
    if (Object.keys(x).length) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      const a = ACCOUNTS.find(a => a.email === f.email.toLowerCase() && a.password === f.password);
      if (!a) { setMsg('error'); return }
      setMsg('ok');
      setTimeout(() => { setUser(a); say('Signed in as ' + a.role) }, 500);
    }, 700);
  };

  return (
    <main className="login">
      <aside>
        <Link to="/" className="logo">WorkHuzz</Link>
        <h1>Manage your<br />workforce better.</h1>
        <p>Sign in to see attendance, people and weekly schedules for your company.</p>
      </aside>
      <div className="login-panel">
        <form onSubmit={go} noValidate>
          <div className="login-topbar">
            <button type="button" className="theme-btn" onClick={toggleTheme}>{theme === 'dark' ? '◐ Light' : '◑ Dark'}</button>
          </div>
          <h2>Sign in</h2>
          {msg === 'error' && <p className="alert err" role="alert">That email and password don't match a demo account. Use one from the list below.</p>}
          {msg === 'ok' && <p className="alert ok" role="status">Signed in. Opening your dashboard…</p>}
          <Field label="Email" type="email" autoComplete="email" value={f.email} error={er.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <Field label="Password" type={show ? 'text' : 'password'} autoComplete="current-password" value={f.password} error={er.password} onChange={e => setF({ ...f, password: e.target.value })} />
          <div className="split">
            <label className="chk"><input type="checkbox" checked={f.remember} onChange={e => setF({ ...f, remember: e.target.checked })} />Remember me</label>
            <button type="button" className="lnk" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} password</button>
          </div>
          <button className="btn full" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
          <button type="button" className="lnk" onClick={() => say('Password reset is disabled in this demo. Use a demo account.')}>Forgot password?</button>
          <div className="demo">
            <b>Demo accounts (not real authentication)</b>
            {ACCOUNTS.map(a => (
              <button type="button" key={a.role} onClick={() => setF({ ...f, email: a.email, password: a.password })}>
                <span>{a.role[0].toUpperCase() + a.role.slice(1)}</span>{a.email} / {a.password}
              </button>
            ))}
          </div>
        </form>
      </div>
    </main>
  );
}

/* ---------- Employee Form ---------- */
function EmpForm({ init, onSave, onCancel, showSalary }) {
  const [f, setF] = useState(init || {
    name: '', email: '', department: DEPTS[0], role: '', phone: '',
    joined: TODAY, salary: '', employmentType: 'Full-time',
    emergencyContact: { name: '', phone: '', relation: '' }
  });
  const [er, setEr] = useState({});
  const s = k => e => setF({ ...f, [k]: e.target.value });
  const sEc = k => e => setF({ ...f, emergencyContact: { ...f.emergencyContact, [k]: e.target.value } });
  const sub = e => {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = 'Enter the full name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) x.email = 'Enter a valid email.';
    if (!f.role.trim()) x.role = 'Enter a designation.';
    if (!/^[+\d][\d\s-]{6,}$/.test(f.phone)) x.phone = 'Enter a phone number, e.g. +91 98765 43210.';
    if (!f.joined) x.joined = 'Pick a joining date.';
    setEr(x);
    if (!Object.keys(x).length) onSave(f);
  };
  return (
    <form className="grid2" onSubmit={sub} noValidate>
      <Field label="Full name" value={f.name} onChange={s('name')} error={er.name} />
      <Field label="Email" value={f.email} onChange={s('email')} error={er.email} />
      <Field label="Department" options={DEPTS} value={f.department} onChange={s('department')} />
      <Field label="Designation" value={f.role} onChange={s('role')} error={er.role} />
      <Field label="Phone" value={f.phone} onChange={s('phone')} error={er.phone} />
      <Field label="Joining date" type="date" value={f.joined} onChange={s('joined')} error={er.joined} />
      <Field label="Employment type" options={['Full-time', 'Part-time', 'Contract', 'Intern']} value={f.employmentType || 'Full-time'} onChange={s('employmentType')} />
      {showSalary && <Field label="Monthly salary (₹)" type="number" value={f.salary || ''} onChange={s('salary')} />}
      <div className="full2"><small style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Emergency Contact</small></div>
      <Field label="Contact name" value={f.emergencyContact?.name || ''} onChange={sEc('name')} />
      <Field label="Contact phone" value={f.emergencyContact?.phone || ''} onChange={sEc('phone')} />
      <Field label="Relation" value={f.emergencyContact?.relation || ''} onChange={sEc('relation')} />
      <div className="row end full2">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn">{init ? 'Save changes' : 'Add employee'}</button>
      </div>
    </form>
  );
}

/* ---------- Attendance helpers ---------- */
function DailyTable({ scopeEmps }) {
  const { att, st, q } = useApp();
  const [dept, setDept] = useState('');
  const [stat, setStat] = useState('');
  const [pg, setPg] = useState(1);
  const per = 6;
  const rows = scopeEmps.filter(e => match(e, q) && (!dept || e.department === dept) && (!stat || st(e.id, TODAY) === stat));
  useEffect(() => setPg(1), [q, dept, stat]);
  return (
    <>
      <Filters dept={dept} setDept={setDept} stat={stat} setStat={setStat} stats={ST} />
      <div className="scroll">
        <table>
          <thead><tr><th>Employee</th><th>Department</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            {rows.slice((pg - 1) * per, pg * per).map(e => {
              const r = att[e.id + '|' + TODAY];
              return (
                <tr key={e.id}>
                  <td>{e.name}</td><td>{e.department}</td>
                  <td>{t12(r?.in)}</td><td>{t12(r?.out)}</td>
                  <td>{fmtDur(dur(r))}</td><td><Badge s={st(e.id, TODAY)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!rows.length && <Empty t="No matching employees" d="Clear the search or filters to see today's attendance." />}
      <Pager n={rows.length} page={pg} set={setPg} per={per} />
    </>
  );
}

function Weekly({ scopeEmps }) {
  const { att, st, q } = useApp();
  const [off, setOff] = useState(0);
  const [dept, setDept] = useState('');
  const mon = addDays(TODAY, -((D(TODAY).getDay() + 6) % 7) + off * 7);
  const days = [...Array(7)].map((_, i) => addDays(mon, i));
  const rows = scopeEmps.filter(e => match(e, q) && (!dept || e.department === dept));
  return (
    <section>
      <div className="split">
        <h3>Weekly attendance</h3>
        <div className="row">
          <button className="btn ghost sm" onClick={() => setOff(off - 1)}>Previous week</button>
          <small>{D(days[0]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {D(days[6]).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small>
          <button className="btn ghost sm" disabled={off > 4} onClick={() => setOff(off + 1)}>Next week</button>
        </div>
      </div>
      <Filters dept={dept} setDept={setDept} />
      <div className="scroll">
        <table className="wk">
          <thead>
            <tr>
              <th>Employee</th>
              {days.map(d => <th key={d}>{D(d).toLocaleDateString('en-IN', { weekday: 'short' })}<small>{D(d).getDate()}</small></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.id}>
                <td>{e.name}<small className="sub">{e.department}</small></td>
                {days.map(d => {
                  const s = st(e.id, d), r = att[e.id + '|' + d];
                  return (
                    <td key={d}>
                      <span className={'dot s-' + s} title={r?.in ? `${t12(r.in)} – ${t12(r.out)}` : statusLabel(s)}>{statusLabel(s)}</span>
                      {r?.in && <small>{t12(r.in)}</small>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <Empty t="No employees to show" d="Adjust the search or department filter." />}
      <p className="note">"Weekend / Off" indicates scheduled rest days. Employees on an active Saturday shift display recorded hours.</p>
    </section>
  );
}

/* ---------- Employees page ---------- */
function Employees({ canEdit, showSalary, scopeEmps }) {
  const { q, st, addEmp, editEmp, delEmp, say } = useApp();
  const [dept, setDept] = useState('');
  const [stat, setStat] = useState('');
  const [pg, setPg] = useState(1);
  const [m, setM] = useState(null);
  const per = 6;
  const rows = scopeEmps.filter(e => match(e, q) && (!dept || e.department === dept) && (!stat || e.status === stat));
  useEffect(() => setPg(1), [q, dept, stat]);
  const rate = id => {
    let p = 0, t = 0;
    for (let k = 0; k < 30; k++) {
      const d = addDays(TODAY, -k);
      if (isWknd(d)) continue;
      const s = st(id, d); t++;
      if (s === 'Present' || s === 'Late') p++;
    }
    return t ? Math.round(p / t * 100) : 0;
  };
  return (
    <section>
      <div className="split">
        <h3>Employees</h3>
        {canEdit && <button className="btn" onClick={() => setM({ t: 'add' })}>Add employee</button>}
      </div>
      <Filters dept={dept} setDept={setDept} stat={stat} setStat={setStat} stats={['Active', 'On Leave']} />
      <div className="scroll">
        <table>
          <thead>
            <tr><th>Employee</th><th>Department</th><th>Designation</th><th>Phone</th><th>Attendance (30d)</th><th>Leave bal.</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.slice((pg - 1) * per, pg * per).map(e => (
              <tr key={e.id}>
                <td>{e.name}<small className="sub">{e.email}</small></td>
                <td>{e.department}</td>
                <td>{e.role}</td>
                <td>{e.phone}</td>
                <td>{rate(e.id)}%</td>
                <td>{e.leave} days</td>
                <td><Badge s={e.status === 'Active' ? 'Present' : 'Leave'} label={e.status} /></td>
                <td className="acts">
                  <button className="lnk" onClick={() => setM({ t: 'view', e })}>View</button>
                  {canEdit && <button className="lnk" onClick={() => setM({ t: 'edit', e })}>Edit</button>}
                  {canEdit && <button className="lnk dng" onClick={() => setM({ t: 'del', e })}>Remove</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <Empty t="No employees found" d="Try a different search or filter." />}
      <Pager n={rows.length} page={pg} set={setPg} per={per} />

      {m?.t === 'add' && <Modal title="Add employee" onClose={() => setM(null)}><EmpForm showSalary={showSalary} onCancel={() => setM(null)} onSave={f => { addEmp(f); setM(null); say(f.name + ' added successfully') }} /></Modal>}
      {m?.t === 'edit' && <Modal title="Edit employee" onClose={() => setM(null)}><EmpForm init={m.e} showSalary={showSalary} onCancel={() => setM(null)} onSave={f => { editEmp(f); setM(null); say(f.name + ' updated successfully') }} /></Modal>}
      {m?.t === 'view' && (
        <Modal title={m.e.name} onClose={() => setM(null)}>
          <dl className="kv">
            {[
              ['Employee ID', m.e.id], ['Email', m.e.email], ['Phone', m.e.phone],
              ['Department', m.e.department], ['Designation', m.e.role],
              ['Employment type', m.e.employmentType || 'Full-time'],
              ['Joined', m.e.joined], ['Status', m.e.status],
              ['Leave balance', m.e.leave + ' days'], ['30-day attendance', rate(m.e.id) + '%'],
              ...(showSalary && m.e.salary ? [['Monthly salary', fmtSalary(m.e.salary)]] : []),
              ...(m.e.emergencyContact?.name ? [
                ['Emergency contact', m.e.emergencyContact.name],
                ['Emergency phone', m.e.emergencyContact.phone],
                ['Relation', m.e.emergencyContact.relation]
              ] : [])
            ].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </Modal>
      )}
      {m?.t === 'del' && (
        <Modal title="Remove employee?" onClose={() => setM(null)}>
          <p>{m.e.name} will be removed from WorkHuzz, including the attendance lists.</p>
          <div className="row end">
            <button className="btn ghost" onClick={() => setM(null)}>Keep employee</button>
            <button className="btn danger" onClick={() => { delEmp(m.e.id); setM(null); say(m.e.name + ' removed') }}>Remove</button>
          </div>
        </Modal>
      )}
    </section>
  );
}

/* ---------- Departments ---------- */
function Departments({ canManage }) {
  const { emps, st, addEmp, say } = useApp();
  const [sel, setSel] = useState('');
  const [adding, setAdding] = useState(false);
  const info = DEPTS.map(d => {
    const l = emps.filter(e => e.department === d),
      p = l.filter(e => ['Present', 'Late'].includes(st(e.id, TODAY))).length;
    return { d, n: l.length, p, rate: l.length ? Math.round(p / l.length * 100) : 0 };
  });
  return (
    <section>
      <div className="split">
        <h3>Departments</h3>
        {canManage && <button className="btn" onClick={() => setAdding(true)}>Add employee to dept.</button>}
      </div>
      <div className="scroll">
        <table>
          <thead><tr><th>Department</th><th>Employees</th><th>Present today</th><th>Attendance rate</th><th /></tr></thead>
          <tbody>
            {info.map(x => (
              <tr key={x.d} className={sel === x.d ? 'sel' : ''}>
                <td>{x.d}</td><td>{x.n}</td><td>{x.p}</td>
                <td>
                  <div className="dept-bar-cell">
                    <div className="dept-bar-track"><div className="dept-bar-fill" style={{ width: `${x.rate}%` }} /></div>
                    <span>{x.rate}%</span>
                  </div>
                </td>
                <td><button className="lnk" onClick={() => setSel(sel === x.d ? '' : x.d)}>{sel === x.d ? 'Hide' : 'View employees'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sel && (
        <>
          <h3 style={{ marginTop: 20 }}>{sel} team</h3>
          <ul className="plain">
            {emps.filter(e => e.department === sel).map(e => (
              <li key={e.id}>
                <span>{e.name} <small>{e.role}</small></span>
                <Badge s={st(e.id, TODAY)} />
              </li>
            ))}
          </ul>
        </>
      )}
      {adding && (
        <Modal title="Add employee" onClose={() => setAdding(false)}>
          <EmpForm showSalary={canManage} onCancel={() => setAdding(false)} onSave={f => { addEmp(f); setAdding(false); say(f.name + ' added') }} />
        </Modal>
      )}
    </section>
  );
}

/* ---------- Leave ---------- */
function Leave({ scopeLeaves, canManage, empId }) {
  const { leaves, applyLeave, updateLeave, say, emps, user } = useApp();
  const [tab, setTab] = useState(canManage ? 'pending' : 'mine');
  const [form, setForm] = useState(false);
  const [f, setF] = useState({ type: LEAVE_TYPES[0], from: TODAY, to: TODAY, reason: '' });

  const pending = scopeLeaves.filter(l => l.status === 'Pending');
  const all = scopeLeaves;
  const mine = leaves.filter(l => l.empId === empId);

  const submit = e => {
    e.preventDefault();
    if (!f.from || !f.to || !f.reason.trim()) { say('Fill all fields'); return; }
    const me = emps.find(x => x.id === empId);
    const days = Math.max(1, Math.round((D(f.to) - D(f.from)) / 86400000) + 1);
    applyLeave({ empId, empName: me?.name || user.name, department: me?.department || user.department, type: f.type, from: f.from, to: f.to, days, reason: f.reason });
    say('Leave request submitted'); setForm(false); setF({ type: LEAVE_TYPES[0], from: TODAY, to: TODAY, reason: '' });
  };

  const statusBadge = s => {
    const map = { Pending: 'Late', Approved: 'Present', Rejected: 'Absent' };
    return <Badge s={map[s] || 'Weekend'} label={s} />;
  };

  return (
    <section>
      <div className="split">
        <h3>Leave management</h3>
        {empId && <button className="btn" onClick={() => setForm(true)}>Apply for leave</button>}
      </div>
      {canManage && (
        <div className="row" style={{ marginBottom: 12 }}>
          {['pending', 'all'].map(t => (
            <button key={t} className={`btn sm ${tab === t ? '' : 'ghost'}`} onClick={() => setTab(t)}>
              {t === 'pending' ? `Pending (${pending.length})` : 'All requests'}
            </button>
          ))}
        </div>
      )}
      {!canManage && (
        <div className="row" style={{ marginBottom: 12 }}>
          {['mine', 'all'].map(t => (
            <button key={t} className={`btn sm ${tab === t ? '' : 'ghost'}`} onClick={() => setTab(t)}>
              {t === 'mine' ? 'My requests' : 'Leave history'}
            </button>
          ))}
        </div>
      )}
      <div className="scroll">
        <table>
          <thead>
            <tr>
              {canManage && <th>Employee</th>}
              {canManage && <th>Department</th>}
              <th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Applied</th><th>Status</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {(canManage ? (tab === 'pending' ? pending : all) : (tab === 'mine' ? mine : mine)).map(l => (
              <tr key={l.id}>
                {canManage && <td>{l.empName}</td>}
                {canManage && <td>{l.department}</td>}
                <td>{l.type}</td><td>{l.from}</td><td>{l.to}</td><td>{l.days}</td>
                <td style={{ maxWidth: 160, whiteSpace: 'normal' }}>{l.reason}</td>
                <td>{l.applied}</td>
                <td>{statusBadge(l.status)}</td>
                {canManage && l.status === 'Pending' && (
                  <td className="acts">
                    <button className="lnk" onClick={() => { updateLeave(l.id, 'Approved'); say('Leave approved') }}>Approve</button>
                    <button className="lnk dng" onClick={() => { updateLeave(l.id, 'Rejected'); say('Leave rejected') }}>Reject</button>
                  </td>
                )}
                {canManage && l.status !== 'Pending' && <td><Badge s={l.status === 'Approved' ? 'Present' : 'Absent'} label={l.status} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!(canManage ? (tab === 'pending' ? pending : all) : mine).length && <Empty t="No leave requests" d="No requests match the current filter." />}

      {form && (
        <Modal title="Apply for leave" onClose={() => setForm(false)}>
          <form onSubmit={submit} className="grid2" noValidate>
            <Field label="Leave type" options={LEAVE_TYPES} value={f.type} onChange={e => setF({ ...f, type: e.target.value })} />
            <div />
            <Field label="From date" type="date" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} />
            <Field label="To date" type="date" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} />
            <label className="field full2"><span>Reason</span><textarea rows={3} value={f.reason} onChange={e => setF({ ...f, reason: e.target.value })} style={{ padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 6, font: 'inherit', background: 'var(--input-bg)', color: 'var(--text)', resize: 'vertical' }} /></label>
            <div className="row end full2">
              <button type="button" className="btn ghost" onClick={() => setForm(false)}>Cancel</button>
              <button className="btn">Submit request</button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

/* ---------- Payroll ---------- */
function Payroll({ scopeEmps, showAll }) {
  const [pg, setPg] = useState(1);
  const [sel, setSel] = useState(null);
  const per = 8;
  const totalPayroll = scopeEmps.reduce((s, e) => s + (e.salary || 0), 0);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const curMonth = months[new Date().getMonth()];

  const breakdown = emp => {
    const basic = Math.round((emp.salary || 0) * 0.5);
    const hra = Math.round((emp.salary || 0) * 0.2);
    const transport = Math.round((emp.salary || 0) * 0.1);
    const special = (emp.salary || 0) - basic - hra - transport;
    const pf = Math.round(basic * 0.12);
    const tax = Math.round((emp.salary || 0) * 0.05);
    const net = (emp.salary || 0) - pf - tax;
    return { basic, hra, transport, special, pf, tax, net };
  };

  return (
    <section>
      {showAll && (
        <div className="sum" style={{ marginBottom: 20 }}>
          <div><small>Total employees</small><strong>{scopeEmps.length}</strong></div>
          <div><small>Monthly payroll ({curMonth})</small><strong className="val-ac">{fmtSalary(totalPayroll)}</strong></div>
          <div><small>Avg. salary</small><strong>{scopeEmps.length ? fmtSalary(Math.round(totalPayroll / scopeEmps.length)) : '—'}</strong></div>
        </div>
      )}
      <div className="split"><h3>{showAll ? 'Employee salaries' : 'My salary'}</h3></div>
      <div className="scroll">
        <table>
          <thead>
            <tr>
              {showAll && <th>Employee ID</th>}
              <th>Name</th><th>Department</th><th>Designation</th>
              <th>Monthly salary</th><th>Employment type</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scopeEmps.slice((pg - 1) * per, pg * per).map(e => (
              <tr key={e.id}>
                {showAll && <td>{e.id}</td>}
                <td>{e.name}</td><td>{e.department}</td><td>{e.role}</td>
                <td><strong>{fmtSalary(e.salary || 0)}</strong></td>
                <td>{e.employmentType || 'Full-time'}</td>
                <td><button className="lnk" onClick={() => setSel(e)}>View payslip</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!scopeEmps.length && <Empty t="No salary data" d="No employees found." />}
      {showAll && <Pager n={scopeEmps.length} page={pg} set={setPg} per={per} />}

      {sel && (
        <Modal title={`Payslip — ${sel.name} — ${curMonth} ${new Date().getFullYear()}`} onClose={() => setSel(null)}>
          {(() => {
            const b = breakdown(sel);
            return (
              <>
                <dl className="kv" style={{ marginBottom: 16 }}>
                  <div><dt>Employee ID</dt><dd>{sel.id}</dd></div>
                  <div><dt>Name</dt><dd>{sel.name}</dd></div>
                  <div><dt>Department</dt><dd>{sel.department}</dd></div>
                  <div><dt>Designation</dt><dd>{sel.role}</dd></div>
                  <div><dt>Pay period</dt><dd>{curMonth} {new Date().getFullYear()}</dd></div>
                </dl>
                <div className="payslip-grid">
                  <div className="payslip-col">
                    <b>Earnings</b>
                    {[['Basic salary', b.basic], ['HRA', b.hra], ['Transport allowance', b.transport], ['Special allowance', b.special]].map(([k, v]) => (
                      <div key={k} className="payslip-row"><span>{k}</span><span>{fmtSalary(v)}</span></div>
                    ))}
                    <div className="payslip-row total"><span>Gross salary</span><span>{fmtSalary(sel.salary || 0)}</span></div>
                  </div>
                  <div className="payslip-col">
                    <b>Deductions</b>
                    {[['Provident Fund (12%)', b.pf], ['Income Tax (5%)', b.tax]].map(([k, v]) => (
                      <div key={k} className="payslip-row"><span>{k}</span><span>{fmtSalary(v)}</span></div>
                    ))}
                    <div className="payslip-row total"><span>Total deductions</span><span>{fmtSalary(b.pf + b.tax)}</span></div>
                  </div>
                </div>
                <div className="payslip-net"><span>Net pay</span><strong>{fmtSalary(b.net)}</strong></div>
              </>
            );
          })()}
        </Modal>
      )}
    </section>
  );
}

/* ---------- Reports (Admin only) ---------- */
function Reports({ scopeEmps }) {
  const { att, st, say } = useApp();
  const csv = () => {
    const rows = [['ID', 'Name', 'Department', 'Check-in', 'Check-out', 'Status'],
    ...scopeEmps.map(e => [e.id, e.name, e.department, att[e.id + '|' + TODAY]?.in || '', att[e.id + '|' + TODAY]?.out || '', statusLabel(st(e.id, TODAY))])];
    const b = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b);
    a.download = `attendance-${TODAY}.csv`; a.click(); say('Report downloaded');
  };
  return (
    <>
      <div className="split"><h3>Reports</h3><button className="btn" onClick={csv}>Download today's CSV</button></div>
      <Departments canManage={true} />
    </>
  );
}

/* ---------- Help & Support ---------- */
const HELP_DATA = {
  admin: {
    faqs: [
      { q: 'How do I add a new employee?', a: 'Go to Employees in the sidebar, click "Add employee", fill in the details and save. The employee will appear in all attendance and payroll views immediately.' },
      { q: 'How do I approve or reject a leave request?', a: 'Open the Leave section. Pending requests are listed under the Pending tab. Click Approve or Reject next to each request.' },
      { q: 'How is the attendance rate calculated?', a: 'Attendance rate = (Present + Late) ÷ working employees × 100. Weekends and upcoming days are excluded from the denominator.' },
      { q: 'How do I download an attendance report?', a: 'Go to Reports and click "Download today\'s CSV". The file includes check-in, check-out, and status for every employee.' },
      { q: 'How do I reset demo data?', a: 'Open Settings and scroll to the Demo Data section. Click "Reset demo data" to restore the original employees and attendance records.' },
      { q: 'How is payroll calculated?', a: 'Monthly salary is split into Basic (50%), HRA (20%), Transport (10%), and Special allowance. Deductions include PF (12% of basic) and Income Tax (5% of gross).' },
    ],
    tasks: [
      { title: 'Add employee', desc: 'Create a new employee profile with department, role, and contact details.' },
      { title: 'Approve leave', desc: 'Review and action pending leave requests from the Leave section.' },
      { title: 'Download report', desc: 'Export today\'s attendance as a CSV from the Reports section.' },
      { title: 'View payroll', desc: 'See monthly salary breakdown and total payroll from the Payroll section.' },
    ]
  },
  hr: {
    faqs: [
      { q: 'How do I view employees in a specific department?', a: 'Go to Employees or Departments and use the Department filter to narrow the list to a specific team.' },
      { q: 'How do I manage leave requests?', a: 'Open the Leave section. You can see all pending requests and approve or reject them individually.' },
      { q: 'How do I add an employee to a department?', a: 'Go to Departments, click "Add employee to dept.", fill in the form, and save. The employee is added to the selected department.' },
      { q: 'How do I check who is absent today?', a: 'The HR Dashboard shows an "Attendance issues today" panel listing all absent and late employees.' },
      { q: 'Can I see an employee\'s full attendance history?', a: 'Yes. Go to Attendance and use the Weekly view to navigate through past weeks for any employee.' },
      { q: 'How do I update an employee\'s information?', a: 'Go to Employees, find the employee, and click Edit. Update the fields and save.' },
    ],
    tasks: [
      { title: 'View employee records', desc: 'Browse and filter all employee profiles from the Employees section.' },
      { title: 'Manage leave requests', desc: 'Approve or reject pending leave from the Leave section.' },
      { title: 'Check attendance', desc: 'See daily and weekly attendance for all employees.' },
      { title: 'Browse departments', desc: 'View headcount and attendance rate per department.' },
    ]
  },
  employee: {
    faqs: [
      { q: 'How do I check in for today?', a: 'Go to Dashboard and click the "Check In" button. Check-ins after 9:30 AM are marked as Late.' },
      { q: 'How do I check out?', a: 'After checking in, the button changes to "Check Out". Click it when you finish your workday.' },
      { q: 'How do I apply for leave?', a: 'Go to the Leave section and click "Apply for leave". Select the type, dates, and reason, then submit.' },
      { q: 'Where can I see my payslip?', a: 'Go to Payslips in the sidebar. Click "View payslip" next to your name to see the full salary breakdown.' },
      { q: 'How is my attendance rate calculated?', a: 'Your rate is based on the last 30 working days. Present and Late days count as attended; weekends are excluded.' },
      { q: 'How do I update my profile or settings?', a: 'Go to My Profile to view your details, or Settings to change the theme.' },
    ],
    tasks: [
      { title: 'Check in / Check out', desc: 'Record your attendance for today from the Dashboard.' },
      { title: 'Apply for leave', desc: 'Submit a leave request with type, dates, and reason.' },
      { title: 'View payslip', desc: 'See your monthly salary breakdown from the Payslips section.' },
      { title: 'View attendance history', desc: 'Check your weekly schedule and monthly calendar on the Dashboard.' },
    ]
  }
};

function HelpPage({ role }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);
  const data = HELP_DATA[role];
  const filtered = data.faqs.filter(
    f => !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <section>
      <div className="help-header">
        <h3>Help Center</h3>
        <p>Find answers to common questions and quick guides for your role.</p>
        <input
          className="search"
          type="search"
          placeholder="Search help topics…"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(null); }}
          aria-label="Search help topics"
          style={{ marginTop: 12, width: '100%', maxWidth: 420 }}
        />
      </div>

      <div className="help-grid">
        <div>
          <h3 style={{ marginBottom: 10 }}>Frequently Asked Questions</h3>
          {filtered.length === 0 && <Empty t="No results" d="Try a different search term." />}
          <div className="accordion">
            {filtered.map((f, i) => (
              <div key={i} className={'acc-item' + (open === i ? ' acc-open' : '')}>
                <button
                  className="acc-q"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span>{f.q}</span>
                  <span className="acc-icon" aria-hidden="true">{open === i ? '−' : '+'}</span>
                </button>
                {open === i && <div className="acc-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: 10 }}>Quick Tasks</h3>
          <div className="help-tasks">
            {data.tasks.map(t => (
              <div key={t.title} className="help-task-card">
                <b>{t.title}</b>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>

          <div className="help-contact">
            <b>Contact Support</b>
            <p>Can't find what you're looking for? Reach out to the WorkHuzz support team.</p>
            <a className="btn ghost sm" href="mailto:support@workhuzz.com">Email support@workhuzz.com</a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Settings ---------- */
function Settings({ role }) {
  const { user, reset, say, theme, setTheme } = useApp();
  return (
    <section>
      <h3>Settings</h3>
      <dl className="kv">
        <div><dt>Name</dt><dd>{user.name}</dd></div>
        <div><dt>Email</dt><dd>{user.email}</dd></div>
        <div><dt>Role</dt><dd>{role === 'hr' ? 'HR' : role[0].toUpperCase() + role.slice(1)}</dd></div>
      </dl>
      <div className="settings-card settings-section-spacing">
        <b>Appearance & Theme</b>
        <small>Select light mode or dark mode for WorkHuzz.</small>
        <div className="row">
          <button className={`btn sm ${theme === 'light' ? '' : 'ghost'}`} onClick={() => setTheme('light')}>Light Theme</button>
          <button className={`btn sm ${theme === 'dark' ? '' : 'ghost'}`} onClick={() => setTheme('dark')}>Dark Theme</button>
        </div>
      </div>
      {role === 'admin' && (
        <div className="settings-card settings-section-gap">
          <b>Demo Data</b>
          <p className="settings-description">Demo data lives in this browser only. Resetting restores the original employees and attendance records.</p>
          <button className="btn ghost" onClick={() => { if (confirm('Reset all demo data?')) { reset(); say('Demo data reset') } }}>Reset demo data</button>
        </div>
      )}
    </section>
  );
}

/* ---------- Admin Dashboard ---------- */
function AdminDashboard({ emps }) {
  const { leaves, st } = useApp();
  const { c, rate } = useAttStats(emps);
  const pending = leaves.filter(l => l.status === 'Pending');
  const totalPayroll = emps.reduce((s, e) => s + (e.salary || 0), 0);
  const barEntries = Object.entries(c).filter(([k, v]) => {
    if (k === 'Weekend') return isWknd(TODAY) || v > 0;
    if (k === 'Upcoming') return v > 0;
    return true;
  });
  const m = Math.max(1, ...barEntries.map(([, v]) => v));
  const recentActivity = [
    { text: 'Meera Iyer submitted a leave request', time: 'Today' },
    { text: 'Vikram Singh checked in at 9:45 AM (Late)', time: 'Today' },
    { text: 'Dev Patel leave approved for next week', time: 'Yesterday' },
    { text: 'Pooja Desai status changed to On Leave', time: '2 days ago' },
  ];
  return (
    <>
      <Summary items={[
        ['Total employees', emps.length],
        ['Present today', c.Present + c.Late, 'present'],
        ['Absent today', c.Absent, 'absent'],
        ['On leave', c.Leave, 'leave'],
        ['Attendance rate', rate + '%', 'ac'],
        ['Monthly payroll', fmtSalary(totalPayroll), 'ac'],
      ]} />
      <div className="dash-grid">
        <section>
          <h3>Attendance overview</h3>
          <div className="bars">
            {barEntries.map(([k, v]) => (
              <div key={k}>
                <span>{statusLabel(k)}</span>
                <i className={`bar-${k}`} style={{ width: `${Math.round(v / m * 100)}%` }} />
                <b>{v}</b>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h3>Department attendance</h3>
          <div className="dept-bars">
            {DEPTS.map(d => {
              const l = emps.filter(e => e.department === d);
              const p = l.filter(e => ['Present', 'Late'].includes(st(e.id, TODAY))).length;
              const dRate = l.length ? Math.round(p / l.length * 100) : 0;
              return (
                <div key={d} className="dept-bar-row">
                  <span className="dept-name">{d}</span>
                  <div className="dept-bar-track"><div className="dept-bar-fill" style={{ width: `${dRate}%` }} /></div>
                  <span className="dept-rate">{dRate}%</span>
                  <small className="dept-count">{p}/{l.length}</small>
                </div>
              );
            })}
          </div>
        </section>
        <section>
          <div className="split"><h3>Pending leave requests</h3><span className="badge s-Late">{pending.length} pending</span></div>
          {pending.length === 0 ? <Empty t="No pending requests" d="All leave requests have been reviewed." /> : (
            <ul className="plain">
              {pending.slice(0, 5).map(l => (
                <li key={l.id}>
                  <span>{l.empName} <small>{l.type} · {l.days} day{l.days > 1 ? 's' : ''}</small></span>
                  <small>{l.from}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h3>Recent activity</h3>
          <ul className="plain">
            {recentActivity.map((a, i) => (
              <li key={i}><span>{a.text}</span><small>{a.time}</small></li>
            ))}
          </ul>
        </section>
      </div>
      <section>
        <h3>Today's attendance</h3>
        <DailyTable scopeEmps={emps} />
      </section>
    </>
  );
}

/* ---------- HR Dashboard ---------- */
function HRDashboard({ scopeEmps }) {
  const { leaves, st } = useApp();
  const { c, rate } = useAttStats(scopeEmps);
  const pending = leaves.filter(l => l.status === 'Pending');
  const issues = scopeEmps.filter(e => st(e.id, TODAY) === 'Absent' || st(e.id, TODAY) === 'Late');
  return (
    <>
      <Summary items={[
        ['Employees', scopeEmps.length],
        ['Present today', c.Present + c.Late, 'present'],
        ['Absent today', c.Absent, 'absent'],
        ['On leave', c.Leave, 'leave'],
        ['Attendance rate', rate + '%', 'ac'],
        ['Pending leaves', pending.length, pending.length > 0 ? 'absent' : 'present'],
      ]} />
      <div className="dash-grid">
        <section>
          <h3>Department employee count</h3>
          <div className="dept-bars">
            {DEPTS.map(d => {
              const l = scopeEmps.filter(e => e.department === d);
              return (
                <div key={d} className="dept-bar-row">
                  <span className="dept-name">{d}</span>
                  <div className="dept-bar-track"><div className="dept-bar-fill" style={{ width: `${Math.round(l.length / Math.max(1, scopeEmps.length) * 100)}%` }} /></div>
                  <span className="dept-rate">{l.length}</span>
                  <small className="dept-count">employees</small>
                </div>
              );
            })}
          </div>
        </section>
        <section>
          <div className="split"><h3>Attendance issues today</h3><span className="badge s-Absent">{issues.length}</span></div>
          {issues.length === 0 ? <Empty t="No issues today" d="All employees are present." /> : (
            <ul className="plain">
              {issues.map(e => (
                <li key={e.id}><span>{e.name} <small>{e.department}</small></span><Badge s={st(e.id, TODAY)} /></li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <div className="split"><h3>Pending leave requests</h3><span className="badge s-Late">{pending.length}</span></div>
          {pending.length === 0 ? <Empty t="No pending requests" d="All leave requests have been reviewed." /> : (
            <ul className="plain">
              {pending.slice(0, 5).map(l => (
                <li key={l.id}><span>{l.empName} <small>{l.type} · {l.days} day{l.days > 1 ? 's' : ''}</small></span><small>{l.from}</small></li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <section>
        <h3>Today's attendance</h3>
        <DailyTable scopeEmps={scopeEmps} />
      </section>
    </>
  );
}

/* ---------- Employee Dashboard (Mine) ---------- */
function Mine() {
  const { user, emps, att, st, checkIn, checkOut, say } = useApp();
  const id = user.empId;
  const me = emps.find(e => e.id === id) || { leave: 0 };
  const [, tick] = useState(0);
  const [mo, setMo] = useState(D(TODAY).getMonth() + D(TODAY).getFullYear() * 12);
  useEffect(() => { const i = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(i) }, []);
  const r = att[id + '|' + TODAY];
  const s = st(id, TODAY);
  const mon = addDays(TODAY, -((D(TODAY).getDay() + 6) % 7));
  const days = [...Array(7)].map((_, i) => addDays(mon, i));
  const y = Math.floor(mo / 12), m = mo % 12, first = (new Date(y, m, 1).getDay() + 6) % 7, len = new Date(y, m + 1, 0).getDate();
  let wd = 0, pr = 0, ab = 0;
  for (let k = 0; k < 30; k++) {
    const d = addDays(TODAY, -k);
    if (isWknd(d) && !att[id + '|' + d]) continue;
    wd++; const x = st(id, d);
    if (x === 'Present' || x === 'Late') pr++;
    if (x === 'Absent') ab++;
  }
  const recent = [...Array(8)].map((_, k) => addDays(TODAY, -k));
  return (
    <>
      <section className="today">
        <div>
          <h3>Today's attendance</h3>
          <dl className="kv">
            <div><dt>Status</dt><dd><Badge s={s} /></dd></div>
            <div><dt>Check-in</dt><dd>{t12(r?.in)}</dd></div>
            <div><dt>Check-out</dt><dd>{t12(r?.out)}</dd></div>
            <div><dt>Working time</dt><dd>{fmtDur(dur(r))}</dd></div>
          </dl>
        </div>
        {!r?.in
          ? <button className="btn lg" onClick={() => { checkIn(id); say('Checked in successfully') }}>Check In</button>
          : !r.out
            ? <button className="btn lg" onClick={() => { checkOut(id); say('Checked out successfully') }}>Check Out</button>
            : <p className="note">Done for today — {t12(r.in)} to {t12(r.out)}.</p>
        }
      </section>
      <Summary items={[['Working days (30d)', wd], ['Present', pr, 'present'], ['Absent', ab, 'absent'], ['Leave balance', me.leave + ' days', 'leave']]} />
      <section>
        <h3>This week</h3>
        <div className="scroll">
          <table>
            <thead><tr><th>Day</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th></tr></thead>
            <tbody>
              {days.map(d => {
                const x = att[id + '|' + d];
                return (
                  <tr key={d}>
                    <td>{D(d).toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                    <td>{D(d).getDate()} {D(d).toLocaleDateString('en-IN', { month: 'short' })}</td>
                    <td>{t12(x?.in)}</td><td>{t12(x?.out)}</td>
                    <td>{fmtDur(dur(x))}</td><td><Badge s={st(id, d)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <div className="split">
          <h3>{new Date(y, m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h3>
          <div className="row">
            <button className="btn ghost sm" onClick={() => setMo(mo - 1)}>Prev</button>
            <button className="btn ghost sm" onClick={() => setMo(mo + 1)}>Next</button>
          </div>
        </div>
        <div className="cal">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <b key={d}>{d}</b>)}
          {[...Array(first)].map((_, i) => <i key={'b' + i} />)}
          {[...Array(len)].map((_, i) => {
            const d = `${y}-${pad(m + 1)}-${pad(i + 1)}`, x = st(id, d);
            return (
              <div key={d} className={'c s-' + x + (d === TODAY ? ' today' : '')} title={statusLabel(x)}>
                <span>{i + 1}</span><small>{statusLabel(x)}</small>
              </div>
            );
          })}
        </div>
        <p className="note">Present (green) · Late (amber) · Absent (red) · On Leave (blue) · Weekend / Off (neutral).</p>
      </section>
      <section>
        <h3>Recent attendance</h3>
        <div className="scroll">
          <table>
            <thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Total hours</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map(d => {
                const x = att[id + '|' + d];
                return (
                  <tr key={d}>
                    <td>{d}</td><td>{t12(x?.in)}</td><td>{t12(x?.out)}</td>
                    <td>{fmtDur(dur(x))}</td><td><Badge s={st(id, d)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------- My Profile (Employee) ---------- */
function MyProfile() {
  const { user, emps } = useApp();
  const me = emps.find(e => e.id === user.empId);
  if (!me) return <Empty t="Profile not found" d="Your employee record could not be loaded." />;
  return (
    <section>
      <h3>My profile</h3>
      <div className="settings-card">
        <dl className="kv">
          {[
            ['Name', me.name], ['Employee ID', me.id], ['Email', me.email],
            ['Phone', me.phone], ['Department', me.department], ['Designation', me.role],
            ['Employment type', me.employmentType || 'Full-time'],
            ['Joining date', me.joined], ['Status', me.status], ['Leave balance', me.leave + ' days']
          ].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      </div>
    </section>
  );
}

/* ---------- Shell ---------- */
const NAV_ITEMS = {
  admin: ['Dashboard', 'Employees', 'Departments', 'Attendance', 'Payroll', 'Reports', 'Settings', 'Help & Support'],
  hr: ['Dashboard', 'Employees', 'Departments', 'Attendance', 'Leave', 'Payroll', 'Settings', 'Help & Support'],
  employee: ['Dashboard', 'My Profile', 'Leave', 'Payslips', 'Settings', 'Help & Support']
};

const NOTES = [
  ['Attendance reminder', 'Remember to check out before you leave today.'],
  ['Leave approved', 'Your leave request for next Friday was approved.'],
  ['Late check-in', 'A late check-in was recorded earlier this week.'],
  ['Company announcement', 'The office closes at 4 PM on Friday for the quarterly meetup.']
];

function Shell({ role }) {
  const { user, setUser, emps, leaves, q, setQ, say, theme, toggleTheme } = useApp();
  const nav = useNavigate();
  const items = NAV_ITEMS[role];
  const [tab, setTab] = useState(items[0]);
  const [tabLoading, setTabLoading] = useState(false);
  const [dr, setDr] = useState(false);
  const [menu, setMenu] = useState('');
  const [read, setRead] = useState([]);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const handler = e => { if (!e.target.closest('.pop')) setMenu('') };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchTab = t => {
    setDr(false);
    setMenu('');
    if (t === tab) return;
    setTab(t);
    setTabLoading(true);
  };

  // Hold the new page back for a beat so the switch never feels instant
  useEffect(() => {
    if (!tabLoading) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const t = setTimeout(() => setTabLoading(false), 850);
    return () => clearTimeout(t);
  }, [tabLoading, tab]);
  const first = user.name.split(' ')[0];
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  // Scoped employee lists per role
  const allEmps = emps;
  const empSelf = emps.filter(e => e.id === user.empId);

  // Scoped leaves per role
  const allLeaves = leaves;
  const myLeaves = leaves.filter(l => l.empId === user.empId);

  const page = (() => {
    if (role === 'admin') {
      switch (tab) {
        case 'Dashboard': return <AdminDashboard emps={allEmps} />;
        case 'Employees': return <Employees canEdit showSalary scopeEmps={allEmps} />;
        case 'Departments': return <Departments canManage />;
        case 'Attendance': return <><section><h3>Daily attendance</h3><DailyTable scopeEmps={allEmps} /></section><Weekly scopeEmps={allEmps} /></>;
        case 'Payroll': return <Payroll scopeEmps={allEmps} showAll />;
        case 'Reports': return <Reports scopeEmps={allEmps} />;
        case 'Settings': return <Settings role={role} />;
        case 'Help & Support': return <HelpPage role={role} />;
      }
    }
    if (role === 'hr') {
      switch (tab) {
        case 'Dashboard': return <HRDashboard scopeEmps={allEmps} />;
        case 'Employees': return <Employees canEdit showSalary={false} scopeEmps={allEmps} />;
        case 'Departments': return <Departments canManage />;
        case 'Attendance': return <><section><h3>Daily attendance</h3><DailyTable scopeEmps={allEmps} /></section><Weekly scopeEmps={allEmps} /></>;
        case 'Leave': return <Leave scopeLeaves={allLeaves} canManage />;
        case 'Payroll': return <Payroll scopeEmps={allEmps} showAll={false} />;
        case 'Settings': return <Settings role={role} />;
        case 'Help & Support': return <HelpPage role={role} />;
      }
    }
    if (role === 'employee') {
      switch (tab) {
        case 'Dashboard': return <Mine />;
        case 'My Profile': return <MyProfile />;
        case 'Leave': return <Leave scopeLeaves={myLeaves} canManage={false} empId={user.empId} />;
        case 'Payslips': return <Payroll scopeEmps={empSelf} showAll={false} />;
        case 'Settings': return <Settings role={role} />;
        case 'Help & Support': return <HelpPage role={role} />;
      }
    }
    return null;
  })();

  const unread = NOTES.length - read.length;

  return (
    <div className="shell">
      <aside className={'side' + (dr ? ' open' : '')}>
        <b className="logo">WorkHuzz</b>
        <nav aria-label="Sections">
          {items.map(i => (
            <button key={i} aria-current={tab === i ? 'page' : undefined} onClick={() => switchTab(i)}>{i}</button>
          ))}
        </nav>
        <div className="who">
          <b>{user.name}</b>
          <small>{role === 'hr' ? 'HR' : role[0].toUpperCase() + role.slice(1)}</small>
          <button className="lnk" onClick={() => { setUser(null); nav('/login') }}>Log out</button>
        </div>
      </aside>
      {dr && <div className="back" onClick={() => setDr(false)} />}
      <div className="main">
        <header className="bar">
          <button className="btn ghost sm menu" aria-label="Open menu" onClick={() => setDr(true)}>Menu</button>
          <div className="bar-title">
            <h1>{greet}, {role === 'admin' ? 'Admin' : first}</h1>
            <span className="bar-sub">{role === 'employee' ? "Here's your attendance summary." : "Here's how your workforce is doing today."}</span>
          </div>
          {role !== 'employee' && <input className="search" type="search" aria-label="Search employees" placeholder="Search name, department, role" value={q} onChange={e => setQ(e.target.value)} />}
          <button className="theme-btn" aria-label="Toggle theme" onClick={toggleTheme}>{theme === 'dark' ? '◐ Light' : '◑ Dark'}</button>
          <div className="pop">
            <button className="btn ghost sm" aria-haspopup="true" aria-expanded={menu === 'n'} onClick={() => setMenu(menu === 'n' ? '' : 'n')}>
              Notifications{unread > 0 && <span className="cnt">{unread}</span>}
            </button>
            {menu === 'n' && (
              <div className="drop" role="menu">
                {NOTES.map(([t, d], i) => (
                  <button key={t} role="menuitem" className={read.includes(i) ? 'rd' : ''} onClick={() => { setOpen(open === i ? null : i); if (!read.includes(i)) setRead([...read, i]) }}>
                    <b>{t}</b>{open === i && <span>{d}</span>}
                  </button>
                ))}
                <button className="lnk" onClick={() => setRead(NOTES.map((_, i) => i))}>Mark all as read</button>
              </div>
            )}
          </div>
          <div className="pop">
            <button className="btn ghost sm" aria-haspopup="true" aria-expanded={menu === 'p'} onClick={() => setMenu(menu === 'p' ? '' : 'p')}>{first}</button>
            {menu === 'p' && (
              <div className="drop" role="menu">
                <button role="menuitem" onClick={() => { switchTab(role === 'employee' ? 'My Profile' : 'Settings') }}>Profile</button>
                <button role="menuitem" onClick={() => switchTab('Settings')}>Settings</button>
                <button role="menuitem" onClick={() => { setUser(null); nav('/login'); say('Signed out') }}>Logout</button>
              </div>
            )}
          </div>
        </header>
        <main className="page">
          <h2 className="pt">{tab}</h2>
          {tabLoading ? <TabLoader label={tab} /> : page}
        </main>
      </div>
    </div>
  );
}

function TabLoader({ label }) {
  return (
    <div className="tab-loader" role="status" aria-live="polite">
      <div className="tab-loader-head">
        <div className="tab-loader-spinner">
          <span /><span /><span />
        </div>
        <p className="tab-loader-text">Loading {label}…</p>
      </div>
      <div className="tab-loader-skeleton">
        <div className="sk sk-row" />
        <div className="sk sk-row" />
        <div className="sk sk-block" />
        <div className="sk sk-row" />
      </div>
    </div>
  );
}

function Guard({ role }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={'/' + user.role} replace />;
  return <Shell role={role} key={role} />;
}

const DASHBOARD_PATHS = ['/admin', '/hr', '/employee'];

function PageLoader() {
  return (
    <div className="page-loader-overlay">
      <div className="page-loader-box">
        <div className="page-loader-logo">WorkHuzz</div>
        <div className="page-loader-spinner">
          <span /><span /><span />
        </div>
        <p className="page-loader-text">Loading your workspace…</p>
      </div>
    </div>
  );
}

function AnimatedApp() {
  const location = useLocation();
  const [barState, setBarState] = useState('');
  const [showLoader, setShowLoader] = useState(false);
  const prevPath = useState(location.pathname)[0];

  useEffect(() => {
    const isDashboardRoute = DASHBOARD_PATHS.some(p => location.pathname.startsWith(p));
    const comingFromLogin = prevPath === '/login' || prevPath === '/';

    // Show full-screen loader when going to a dashboard route
    if (isDashboardRoute) {
      setShowLoader(true);
      const hideTimer = setTimeout(() => setShowLoader(false), 1400);
      return () => clearTimeout(hideTimer);
    }

    // Top progress bar for all other route changes
    setBarState('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const doneTimer = setTimeout(() => setBarState('done'), 380);
    const resetTimer = setTimeout(() => setBarState(''), 800);
    return () => {
      clearTimeout(doneTimer);
      clearTimeout(resetTimer);
    };
  }, [location.pathname]);

  return (
    <>
      <div className={`page-progress-bar ${barState}`} />
      {showLoader && <PageLoader />}
      <div key={location.pathname} className={showLoader ? 'route-view-hidden' : 'route-view-enter'}>
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          {['admin', 'hr', 'employee'].map(r => <Route key={r} path={'/' + r} element={<Guard role={r} />} />)}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Provider>
      <AnimatedApp />
    </Provider>
  );
}

import {createContext,useContext,useEffect,useState} from 'react';
import {Routes,Route,Navigate,Link,useNavigate} from 'react-router-dom';
import {DEPTS,TODAY,D,iso,addDays,isWknd,nowT,mins,fmtDur,t12,dur,pad,seedEmps,seedAtt,getStatus,ACCOUNTS} from './data';

const Ctx=createContext();
const useApp=()=>useContext(Ctx);
const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k))||f()}catch{return f()}};
const ST=['Present','Late','Absent','Leave','Weekend','Upcoming'];

const statusLabel=s=>{
 if(s==='Leave')return 'On Leave';
 if(s==='Weekend'||s==='—')return 'Weekend / Off';
 if(s==='Upcoming')return 'Upcoming';
 return s||'—';
};

function Provider({children}){
 const [emps,setEmps]=useState(()=>load('wh_e',seedEmps));
 const [att,setAtt]=useState(()=>load('wh_a',seedAtt));
 const [user,setUser]=useState(()=>load('wh_u',()=>null));
 const [q,setQ]=useState('');
 const [toast,setToast]=useState('');
 const [theme,setTheme]=useState(()=>localStorage.getItem('wh_theme')||'light');

 useEffect(()=>localStorage.setItem('wh_e',JSON.stringify(emps)),[emps]);
 useEffect(()=>localStorage.setItem('wh_a',JSON.stringify(att)),[att]);
 useEffect(()=>localStorage.setItem('wh_u',JSON.stringify(user)),[user]);
 useEffect(()=>{
  document.documentElement.setAttribute('data-theme',theme);
  localStorage.setItem('wh_theme',theme);
 },[theme]);

 const say=m=>{setToast(m);setTimeout(()=>setToast(''),2600)};
 const st=(id,d)=>getStatus(att,id,d,emps.find(e=>e.id===id));
 const toggleTheme=()=>setTheme(t=>t==='dark'?'light':'dark');

 const v={
  emps,att,user,q,setQ,say,st,setUser,theme,setTheme,toggleTheme,
  addEmp:e=>setEmps(l=>[...l,{...e,id:'E'+pad(l.length+Math.floor(Math.random()*900)+13),status:'Active',leave:12}]),
  editEmp:e=>setEmps(l=>l.map(x=>x.id===e.id?{...x,...e}:x)),
  delEmp:id=>setEmps(l=>l.filter(x=>x.id!==id)),
  checkIn:id=>{const t=nowT();setAtt(a=>({...a,[id+'|'+TODAY]:{in:t,out:null,status:mins(t)>570?'Late':'Present'}}))},
  checkOut:id=>{const prev=att[id+'|'+TODAY];if(!prev)return;const o=nowT();setAtt(a=>({...a,[id+'|'+TODAY]:{...prev,out:o,status:mins(prev.in)>570?'Late':'Present'}}));},
  reset:()=>{setEmps(seedEmps());setAtt(seedAtt())}
 };

 return (
  <Ctx.Provider value={v}>
   {children}
   <div className="toast" role="status" aria-live="polite">{toast&&<span>{toast}</span>}</div>
  </Ctx.Provider>
 );
}

const Badge=({s,label})=><span className={'badge s-'+s}>{label||statusLabel(s)}</span>;
const Field=({label,error,...p})=>(
 <label className="field">
  <span>{label}</span>
  {p.options?<select {...p}>{p.options.map(o=><option key={o}>{o}</option>)}</select>:<input {...p}/>}
  {error&&<em role="alert">{error}</em>}
 </label>
);

/* ---------- Landing ---------- */
function Landing(){
 const {emps,st,theme,toggleTheme}=useApp();
 const n=emps.length;
 const present=emps.filter(e=>st(e.id,TODAY)==='Present').length;
 const late=emps.filter(e=>st(e.id,TODAY)==='Late').length;
 const absent=emps.filter(e=>st(e.id,TODAY)==='Absent').length;
 const leave=emps.filter(e=>st(e.id,TODAY)==='Leave').length;
 const weekend=emps.filter(e=>st(e.id,TODAY)==='Weekend').length;
 const upcoming=emps.filter(e=>st(e.id,TODAY)==='Upcoming').length;
 const working=n-weekend-upcoming;
 const rate=working>0?Math.round((present+late)/working*100):0;
 const F=[
  ['Employee records','Add, edit, and manage employee profiles with department, role, and contact details.'],
  ['Attendance tracking','One-tap check-in and check-out. Late arrivals are flagged after 9:30 AM.'],
  ['Weekly view','See Monday through Sunday attendance for every employee, filtered by department or name.'],
  ['Weekend handling','Weekends are off by default. Scheduled Saturday shifts show real hours, not false absences.'],
  ['Role-based access','Admins see the entire company. HR works by department. Employees see only their own record.']
 ];

 return (
  <div className="land">
   <header className="top">
    <Link to="/" className="logo">WorkHuzz</Link>
    <nav aria-label="Main">
     <a href="#features">Features</a>
     <a href="#roles">Roles</a>
    </nav>
    <div>
     <button className="theme-btn" aria-label="Toggle theme" onClick={toggleTheme}>
      {theme==='dark'?'◐ Light':'◑ Dark'}
     </button>
     <Link className="btn ghost" to="/login">Login</Link>
     <Link className="btn" to="/login">Get Started</Link>
    </div>
   </header>
   <section className="hero">
    <div className="hero-content">
     <span className="hero-tag">Workforce Management</span>
     <h1>Manage your workforce better.</h1>
     <p>WorkHuzz brings employee records, attendance and workforce visibility into one place—no more spreadsheets, no more missing data.</p>
     <div className="hero-ctas">
      <Link className="btn lg" to="/login">Get Started</Link>
      <button className="btn ghost lg" onClick={() => document.querySelector('.hero-preview')?.scrollIntoView({behavior:'smooth'})}>View Preview</button>
     </div>

    </div>
    <div className="hero-preview">
     <div className="dashboard-preview">
      <div className="dashboard-header">
       <div className="dashboard-title">Today's Attendance</div>
       <div className="dashboard-date">{TODAY}</div>
      </div>
      <div className="dashboard-metrics">
       <div className="metric-card">
        <span className="metric-label">Attendance Rate</span>
        <span className="metric-value">{rate}%</span>
       </div>
       <div className="metric-row">
        <div className="metric-small">
         <span className="metric-label">Present</span>
         <span className="metric-value present">{present}</span>
        </div>
        <div className="metric-small">
         <span className="metric-label">Late</span>
         <span className="metric-value late">{late}</span>
        </div>
        <div className="metric-small">
         <span className="metric-label">Absent</span>
         <span className="metric-value absent">{absent}</span>
        </div>
        <div className="metric-small">
         <span className="metric-label">On Leave</span>
         <span className="metric-value leave">{leave}</span>
        </div>
       </div>
      </div>
      <div className="weekly-viz">
       <div className="viz-title">This Week</div>
       <div className="viz-bars">
        {['Mon','Tue','Wed','Thu','Fri'].map((day,i)=>{
         const weekDate=addDays(TODAY,-((D(TODAY).getDay()+6)%7)+i);
         const weekPresent=emps.filter(e=>['Present','Late'].includes(st(e.id,weekDate))).length;
         const weekWorking=emps.filter(e=>!isWknd(weekDate)).length;
         const weekRate=weekWorking>0?Math.round(weekPresent/weekWorking*100):0;
         return (
          <div key={day} className="viz-bar">
           <span className="viz-day">{day}</span>
           <div className="viz-track">
            <div className="viz-fill" style={{width:`${weekRate}%`}}/>
           </div>
           <span className="viz-pct">{weekRate}%</span>
          </div>
         );
        })}
       </div>
      </div>
     </div>
    </div>
   </section>
   <section id="features" className="feat">
    <h2>Everything your workforce needs</h2>
    <dl className="feat-list">{F.map(([t,d])=><div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
   </section>
   <section id="roles" className="roles">
    <h2>Designed for every role</h2>
    <div className="role-cards">
     <div className="role-card">
      <div className="role-icon">👁</div>
      <h3>Admin</h3>
      <p>See the whole workforce at a glance. Track company-wide attendance, manage employees and oversee all departments from one dashboard.</p>
     </div>
     <div className="role-card">
      <div className="role-icon">👥</div>
      <h3>HR</h3>
      <p>Manage people, departments and attendance. Filter by team, track leave balances and handle employee records efficiently.</p>
     </div>
     <div className="role-card">
      <div className="role-icon">👤</div>
      <h3>Employee</h3>
      <p>Track your own attendance and working time. Check in and out with one tap, view your weekly schedule and leave balance.</p>
     </div>
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
   <footer>
    <Link to="/" className="logo">WorkHuzz</Link>
    <small>© 2026 WorkHuzz. Demo build with local data only.</small>

   </footer>
  </div>
 );
}

/* ---------- Login (Left Panel: Dark Charcoal Block) ---------- */
function Login(){
 const {setUser,say,user,theme,toggleTheme}=useApp();
 const nav=useNavigate();
 const [f,setF]=useState({email:'',password:'',remember:true});
 const [show,setShow]=useState(false);
 const [er,setEr]=useState({});
 const [busy,setBusy]=useState(false);
 const [msg,setMsg]=useState('');

 useEffect(()=>{if(user)nav('/'+user.role,{replace:true})},[user]);

 const go=e=>{
  e.preventDefault();
  const x={};
  if(!f.email)x.email='Enter your email.';
  else if(!/^\S+@\S+\.\S+$/.test(f.email))x.email='Enter a valid email like name@company.com.';
  if(!f.password)x.password='Enter your password.';
  else if(f.password.length<6)x.password='Password must be at least 6 characters.';
  setEr(x);setMsg('');
  if(Object.keys(x).length)return;
  setBusy(true);
  setTimeout(()=>{
   setBusy(false);
   const a=ACCOUNTS.find(a=>a.email===f.email.toLowerCase()&&a.password===f.password);
   if(!a){setMsg('error');return}
   setMsg('ok');
   setTimeout(()=>{setUser(a);say('Signed in as '+a.role)},500);
  },700);
 };

 return (
  <main className="login">
   <aside>
    <Link to="/" className="logo">WorkHuzz</Link>
    <h1>Manage your workforce better.</h1>
    <p>Sign in to see attendance, people and weekly schedules for your company.</p>
   </aside>
   <form onSubmit={go} noValidate>
    <div className="login-topbar">
     <button type="button" className="theme-btn" onClick={toggleTheme}>
      {theme==='dark'?'◐ Light':'◑ Dark'}
     </button>
    </div>
    <h2>Sign in</h2>
    {msg==='error'&&<p className="alert err" role="alert">That email and password don’t match a demo account. Use one from the list below.</p>}
    {msg==='ok'&&<p className="alert ok" role="status">Signed in. Opening your dashboard…</p>}
    <Field label="Email" type="email" autoComplete="email" value={f.email} error={er.email} onChange={e=>setF({...f,email:e.target.value})}/>
    <Field label="Password" type={show?'text':'password'} autoComplete="current-password" value={f.password} error={er.password} onChange={e=>setF({...f,password:e.target.value})}/>
    <div className="split">
     <label className="chk"><input type="checkbox" checked={f.remember} onChange={e=>setF({...f,remember:e.target.checked})}/>Remember me</label>
     <button type="button" className="lnk" onClick={()=>setShow(!show)}>{show?'Hide':'Show'} password</button>
    </div>
    <button className="btn full" disabled={busy}>{busy?'Signing in…':'Sign In'}</button>
    <button type="button" className="lnk" onClick={()=>say('Password reset is disabled in this demo. Use a demo account.')}>Forgot password?</button>
    <div className="demo">
     <b>Demo accounts (not real authentication)</b>
     {ACCOUNTS.map(a=>(
      <button type="button" key={a.role} onClick={()=>setF({...f,email:a.email,password:a.password})}>
       <span>{a.role[0].toUpperCase()+a.role.slice(1)}</span>{a.email} / {a.password}
      </button>
     ))}
    </div>
   </form>
  </main>
 );
}

/* ---------- Shared pieces ---------- */
function Modal({title,onClose,children}){
 useEffect(()=>{const k=e=>e.key==='Escape'&&onClose();document.addEventListener('keydown',k);return()=>document.removeEventListener('keydown',k)},[]);
 return (
  <div className="scrim" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
   <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
    <div className="split"><h2>{title}</h2><button className="x" aria-label="Close" onClick={onClose}>✕</button></div>
    {children}
   </div>
  </div>
 );
}

function EmpForm({init,onSave,onCancel}){
 const [f,setF]=useState(init||{name:'',email:'',department:DEPTS[0],role:'',phone:'',joined:TODAY});
 const [er,setEr]=useState({});
 const s=k=>e=>setF({...f,[k]:e.target.value});
 const sub=e=>{
  e.preventDefault();
  const x={};
  if(f.name.trim().length<2)x.name='Enter the full name.';
  if(!/^\S+@\S+\.\S+$/.test(f.email))x.email='Enter a valid email.';
  if(!f.role.trim())x.role='Enter a role.';
  if(!/^[+\d][\d\s-]{6,}$/.test(f.phone))x.phone='Enter a phone number, e.g. +91 98765 43210.';
  if(!f.joined)x.joined='Pick a joining date.';
  setEr(x);
  if(!Object.keys(x).length)onSave(f);
 };
 return (
  <form className="grid2" onSubmit={sub} noValidate>
   <Field label="Full name" value={f.name} onChange={s('name')} error={er.name}/>
   <Field label="Email" value={f.email} onChange={s('email')} error={er.email}/>
   <Field label="Department" options={DEPTS} value={f.department} onChange={s('department')}/>
   <Field label="Role" value={f.role} onChange={s('role')} error={er.role}/>
   <Field label="Phone" value={f.phone} onChange={s('phone')} error={er.phone}/>
   <Field label="Joining date" type="date" value={f.joined} onChange={s('joined')} error={er.joined}/>
   <div className="row end full2">
    <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
    <button className="btn">{init?'Save changes':'Add employee'}</button>
   </div>
  </form>
 );
}

function Pager({n,page,set,per}){
 const pages=Math.max(1,Math.ceil(n/per));
 return (
  <div className="split pager">
   <small>{n} result{n!==1&&'s'}</small>
   <div className="row">
    <button className="btn ghost sm" disabled={page<=1} onClick={()=>set(page-1)}>Previous</button>
    <small>Page {page} of {pages}</small>
    <button className="btn ghost sm" disabled={page>=pages} onClick={()=>set(page+1)}>Next</button>
   </div>
  </div>
 );
}

const Empty=({t,d})=><div className="empty"><b>{t}</b><p>{d}</p></div>;

function Filters({dept,setDept,stat,setStat,stats,disabledDeptLabel}){
 return (
  <div className="row filters">
   <label className="filter-label">Department
    <select value={dept} onChange={e=>setDept(e.target.value)} disabled={!!disabledDeptLabel}>
     <option value="">{disabledDeptLabel||'All departments'}</option>
     {!disabledDeptLabel&&DEPTS.map(d=><option key={d}>{d}</option>)}
    </select>
   </label>
   {setStat&&<label className="filter-label">Status
    <select value={stat} onChange={e=>setStat(e.target.value)}>
     <option value="">All statuses</option>
     {stats.map(d=><option key={d} value={d}>{statusLabel(d)}</option>)}
    </select>
   </label>}
  </div>
 );
}

const match=(e,q)=>!q||(e.name+e.department+e.role+e.email).toLowerCase().includes(q.toLowerCase());

function useStats(){
 const {emps,st}=useApp();
 const c={Present:0,Late:0,Absent:0,Leave:0,Weekend:0,Upcoming:0};
 emps.forEach(e=>{const s=st(e.id,TODAY);if(c[s]!=null)c[s]++;});
 const n=emps.length;
 const working=n-c.Weekend-c.Upcoming;
 return {c,n,rate:working>0?Math.round((c.Present+c.Late)/working*100):0};
}

function Summary({items}){
 return (
  <div className="sum">
   {items.map(([l,v,cls])=>(
    <div key={l}>
     <small>{l}</small>
     <strong className={cls?`val-${cls}`:''}>{v}</strong>
    </div>
   ))}
  </div>
 );
}

function Overview({role}){
 const {c,n,rate}=useStats();
 const {emps,st}=useApp();
 const barEntries=Object.entries(c).filter(([k,v])=>{
  if(k==='Weekend')return isWknd(TODAY)||v>0;
  if(k==='Upcoming')return v>0;
  return true;
 });
 const m=Math.max(1,...barEntries.map(([,v])=>v));
 return (
  <>
   <Summary items={[
    ['Total employees',n],
    ['Present today',c.Present+c.Late,'present'],
    [role==='hr'?'Absent':'On leave',role==='hr'?c.Absent:c.Leave,role==='hr'?'absent':'leave'],
    ...(role==='hr'?[['Leave',c.Leave,'leave']]:[]),
    ['Attendance rate',rate+'%','ac']
   ]}/>
   <section>
    <h3>Attendance overview</h3>
    <div className="bars">
     {barEntries.map(([k,v])=>(
      <div key={k}>
       <span>{statusLabel(k)}</span>
       <i className={`bar-${k}`} style={{width:`${Math.round(v/m*100)}%`}}/>
       <b>{v}</b>
      </div>
     ))}
    </div>
   </section>
   <section>
    <h3>Department attendance</h3>
    <div className="dept-bars">
     {DEPTS.map(d=>{
      const l=emps.filter(e=>e.department===d);
      const p=l.filter(e=>['Present','Late'].includes(st(e.id,TODAY))).length;
      const dRate=l.length?Math.round(p/l.length*100):0;
      return (
       <div key={d} className="dept-bar-row">
        <span className="dept-name">{d}</span>
        <div className="dept-bar-track">
         <div className="dept-bar-fill" style={{width:`${dRate}%`}}/>
        </div>
        <span className="dept-rate">{dRate}%</span>
        <small className="dept-count">{p}/{l.length} present</small>
       </div>
      );
     })}
    </div>
   </section>
   <section>
    <h3>Today’s attendance</h3>
    <DailyTable/>
   </section>
  </>
 );
}

function DailyTable({role,user}){
 const {emps,att,st,q}=useApp();
 const [dept,setDept]=useState('');
 const [stat,setStat]=useState('');
 const [pg,setPg]=useState(1);
 const baseFilter=role==='employee'?e=>e.id===user.empId:role==='hr'?e=>e.department===user.department:e=>true;
 const initialDept=role==='hr'?user.department:'';
 const disabledDeptLabel=role==='hr'?user.department:role==='employee'?user.department:null;
 useEffect(()=>{if(role==='hr')setDept(initialDept)},[role,initialDept]);
 const rows=emps.filter(e=>baseFilter(e)&&match(e,q)&&(!dept||e.department===dept)&&(!stat||st(e.id,TODAY)===stat));
 const per=6;
 useEffect(()=>setPg(1),[q,dept,stat]);
 return (
  <>
   <Filters {...{dept,setDept,stat,setStat,stats:ST,disabledDeptLabel}}/>
   <div className="scroll">
    <table>
     <thead>
      <tr><th>Employee</th><th>Department</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th></tr>
     </thead>
     <tbody>
      {rows.slice((pg-1)*per,pg*per).map(e=>{
       const r=att[e.id+'|'+TODAY];
       return (
        <tr key={e.id}>
         <td>{e.name}</td>
         <td>{e.department}</td>
         <td>{t12(r?.in)}</td>
         <td>{t12(r?.out)}</td>
         <td>{fmtDur(dur(r))}</td>
         <td><Badge s={st(e.id,TODAY)}/></td>
        </tr>
       );
      })}
     </tbody>
    </table>
   </div>
   {!rows.length&&<Empty t="No matching employees" d="Clear the search or filters to see today’s attendance."/>}
   <Pager n={rows.length} page={pg} set={setPg} per={per}/>
  </>
 );
}

function Employees({canEdit,role,user}){
 const {emps,q,st,addEmp,editEmp,delEmp,say}=useApp();
 const [dept,setDept]=useState('');
 const [stat,setStat]=useState('');
 const [pg,setPg]=useState(1);
 const [m,setM]=useState(null);
 const baseFilter=role==='employee'?e=>e.id===user.empId:role==='hr'?e=>e.department===user.department:e=>true;
 const initialDept=role==='hr'?user.department:'';
 const disabledDeptLabel=role==='hr'?user.department:role==='employee'?user.department:null;
 useEffect(()=>{if(role==='hr')setDept(initialDept)},[role,initialDept]);
 const rows=emps.filter(e=>baseFilter(e)&&match(e,q)&&(!dept||e.department===dept)&&(!stat||e.status===stat));
 const per=6;
 useEffect(()=>setPg(1),[q,dept,stat]);
 const rate=id=>{
  let p=0,t=0;
  for(let k=0;k<30;k++){
   const d=addDays(TODAY,-k);
   if(isWknd(d))continue;
   const s=st(id,d);
   t++;
   if(s==='Present'||s==='Late')p++;
  }
  return t?Math.round(p/t*100):0;
 };
 return (
  <section>
   <div className="split">
    <h3>Employees</h3>
    {canEdit&&<button className="btn" onClick={()=>setM({t:'add'})}>Add employee</button>}
   </div>
   <Filters {...{dept,setDept,stat,setStat,stats:['Active','On Leave'],disabledDeptLabel}}/>
   <div className="scroll">
    <table>
     <thead>
      <tr><th>Employee</th><th>Department</th><th>Role</th><th>Attendance (30d)</th><th>Status</th><th>Actions</th></tr>
     </thead>
     <tbody>
      {rows.slice((pg-1)*per,pg*per).map(e=>(
       <tr key={e.id}>
        <td>{e.name}<small className="sub">{e.email}</small></td>
        <td>{e.department}</td>
        <td>{e.role}</td>
        <td>{rate(e.id)}%</td>
        <td><Badge s={e.status==='Active'?'Present':'Leave'} label={e.status}/></td>
        {canEdit?<td className="acts">
         <button className="lnk" onClick={()=>setM({t:'view',e})}>View</button>
         <button className="lnk" onClick={()=>setM({t:'edit',e})}>Edit</button>
         <button className="lnk dng" onClick={()=>setM({t:'del',e})}>Remove</button>
        </td>:<td className="acts">
         <button className="lnk" onClick={()=>setM({t:'view',e})}>View</button>
        </td>}
       </tr>
      ))}
     </tbody>
    </table>
   </div>
   {!rows.length&&<Empty t="No employees found" d="Try a different search, or add a new employee."/>}
   <Pager n={rows.length} page={pg} set={setPg} per={per}/>
   {m?.t==='add'&&<Modal title="Add employee" onClose={()=>setM(null)}><EmpForm onCancel={()=>setM(null)} onSave={f=>{addEmp(f);setM(null);say(f.name+' added successfully')}}/></Modal>}
   {m?.t==='edit'&&<Modal title="Edit employee" onClose={()=>setM(null)}><EmpForm init={m.e} onCancel={()=>setM(null)} onSave={f=>{editEmp(f);setM(null);say(f.name+' updated successfully')}}/></Modal>}
   {m?.t==='view'&&(
    <Modal title={m.e.name} onClose={()=>setM(null)}>
     <dl className="kv">
      {[['ID',m.e.id],['Email',m.e.email],['Department',m.e.department],['Role',m.e.role],['Phone',m.e.phone],['Joined',m.e.joined],['Status',m.e.status],['Leave balance',m.e.leave+' days'],['30-day attendance',rate(m.e.id)+'%']].map(([k,v])=>(
       <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
     </dl>
    </Modal>
   )}
   {m?.t==='del'&&(
    <Modal title="Remove employee?" onClose={()=>setM(null)}>
     <p>{m.e.name} will be removed from WorkHuzz, including the attendance lists.</p>
     <div className="row end">
      <button className="btn ghost" onClick={()=>setM(null)}>Keep employee</button>
      <button className="btn danger" onClick={()=>{delEmp(m.e.id);setM(null);say(m.e.name+' removed')}}>Remove</button>
     </div>
    </Modal>
   )}
  </section>
 );
}

function Departments(){
 const {emps,st}=useApp();
 const [sel,setSel]=useState('');
 const info=DEPTS.map(d=>{
  const l=emps.filter(e=>e.department===d),
        p=l.filter(e=>['Present','Late'].includes(st(e.id,TODAY))).length;
  return {d,n:l.length,p,rate:l.length?Math.round(p/l.length*100):0};
 });
 return (
  <section>
   <h3>Departments</h3>
   <div className="scroll">
    <table>
     <thead>
      <tr><th>Department</th><th>Employees</th><th>Present today</th><th>Attendance rate</th><th/></tr>
     </thead>
     <tbody>
      {info.map(x=>(
       <tr key={x.d} className={sel===x.d?'sel':''}>
        <td>{x.d}</td>
        <td>{x.n}</td>
        <td>{x.p}</td>
        <td>
         <div className="dept-bar-cell">
          <div className="dept-bar-track">
           <div className="dept-bar-fill" style={{width:`${x.rate}%`}}/>
          </div>
          <span>{x.rate}%</span>
         </div>
        </td>
        <td>
         <button className="lnk" onClick={()=>setSel(sel===x.d?'':x.d)}>
          {sel===x.d?'Clear filter':'View employees'}
         </button>
        </td>
       </tr>
      ))}
     </tbody>
    </table>
   </div>
   {sel&&(
    <>
     <h3>{sel} team</h3>
     <ul className="plain">
      {emps.filter(e=>e.department===sel).map(e=>(
       <li key={e.id}>
        <span>{e.name} <small>{e.role}</small></span>
        <Badge s={st(e.id,TODAY)}/>
       </li>
      ))}
     </ul>
    </>
   )}
  </section>
 );
}

function Weekly({role,user}){
 const {emps,att,st,q}=useApp();
 const [off,setOff]=useState(0);
 const [dept,setDept]=useState('');
 const mon=addDays(TODAY,-((D(TODAY).getDay()+6)%7)+off*7);
 const days=[...Array(7)].map((_,i)=>addDays(mon,i));
 const baseFilter=role==='employee'?e=>e.id===user.empId:role==='hr'?e=>e.department===user.department:e=>true;
 const initialDept=role==='hr'?user.department:'';
 const disabledDeptLabel=role==='hr'?user.department:role==='employee'?user.department:null;
 useEffect(()=>{if(role==='hr')setDept(initialDept)},[role,initialDept]);
 const rows=emps.filter(e=>baseFilter(e)&&match(e,q)&&(!dept||e.department===dept));
 return (
  <section>
   <div className="split">
    <h3>Weekly attendance</h3>
    <div className="row">
     <button className="btn ghost sm" onClick={()=>setOff(off-1)}>Previous week</button>
     <small>{D(days[0]).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} – {D(days[6]).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</small>
     <button className="btn ghost sm" disabled={off>4} onClick={()=>setOff(off+1)}>Next week</button>
    </div>
   </div>
   <Filters dept={dept} setDept={setDept} disabledDeptLabel={disabledDeptLabel}/>
   <div className="scroll">
    <table className="wk">
     <thead>
      <tr>
       <th>Employee</th>
       {days.map(d=><th key={d}>{D(d).toLocaleDateString('en-IN',{weekday:'short'})}<small>{D(d).getDate()}</small></th>)}
      </tr>
     </thead>
     <tbody>
      {rows.map(e=>(
       <tr key={e.id}>
        <td>{e.name}<small className="sub">{e.department}</small></td>
        {days.map(d=>{
         const s=st(e.id,d),r=att[e.id+'|'+d];
         return (
          <td key={d}>
           <span className={'dot s-'+s} title={r?.in?`${t12(r.in)} – ${t12(r.out)}`:statusLabel(s)}>
            {statusLabel(s)}
           </span>
           {r?.in&&<small>{t12(r.in)}</small>}
          </td>
         );
        })}
       </tr>
      ))}
     </tbody>
    </table>
   </div>
   {!rows.length&&<Empty t="No employees to show" d="Adjust the search or department filter."/>}
   <p className="note">“Weekend / Off” indicates scheduled rest days. Employees on an active Saturday shift display recorded hours.</p>
  </section>
 );
}

function Attendance({role,user}){
 return (
  <>
   <section><h3>Daily attendance</h3><DailyTable role={role} user={user}/></section>
   <Weekly role={role} user={user}/>
  </>
 );
}

function Reports(){
 const {emps,att,st,say}=useApp();
 const csv=()=>{
  const rows=[['ID','Name','Department','Check-in','Check-out','Status'],...emps.map(e=>[e.id,e.name,e.department,att[e.id+'|'+TODAY]?.in||'',att[e.id+'|'+TODAY]?.out||'',statusLabel(st(e.id,TODAY))])];
  const b=new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(b);
  a.download=`attendance-${TODAY}.csv`;
  a.click();
  say('Report downloaded');
 };
 return (
  <>
   <div className="split"><h3>Reports</h3><button className="btn" onClick={csv}>Download today’s CSV</button></div>
   <Departments/>
  </>
 );
}

function Settings(){
 const {user,reset,say,theme,setTheme}=useApp();
 return (
  <section>
   <h3>Settings</h3>
   <dl className="kv">
    <div><dt>Name</dt><dd>{user.name}</dd></div>
    <div><dt>Email</dt><dd>{user.email}</dd></div>
    <div><dt>Role</dt><dd>{user.role}</dd></div>
   </dl>
   <div className="settings-card settings-section-spacing">
    <b>Appearance & Theme</b>
    <small>Select light mode or dark mode for WorkHuzz.</small>
    <div className="row">
     <button className={`btn sm ${theme==='light'?'':'ghost'}`} onClick={()=>setTheme('light')}>Light Theme</button>
     <button className={`btn sm ${theme==='dark'?'':'ghost'}`} onClick={()=>setTheme('dark')}>Dark Theme</button>
    </div>
   </div>
   <div className="settings-card settings-section-gap">
    <b>Demo Data</b>
    <p className="settings-description">
     Demo data lives in this browser only. Resetting restores the original employees and attendance records.
    </p>
    <button className="btn ghost" onClick={()=>{if(confirm('Reset all demo data?')){reset();say('Demo data reset')}}}>Reset demo data</button>
   </div>
  </section>
 );
}

/* ---------- Employee ---------- */
function Mine(){
 const {user,emps,att,st,checkIn,checkOut,say}=useApp();
 const id=user.empId;
 const me=emps.find(e=>e.id===id)||{leave:0};
 const [,tick]=useState(0);
 const [mo,setMo]=useState(D(TODAY).getMonth()+D(TODAY).getFullYear()*12);

 useEffect(()=>{const i=setInterval(()=>tick(x=>x+1),30000);return()=>clearInterval(i)},[]);

 const r=att[id+'|'+TODAY];
 const s=st(id,TODAY);
 const mon=addDays(TODAY,-((D(TODAY).getDay()+6)%7));
 const days=[...Array(7)].map((_,i)=>addDays(mon,i));
 const y=Math.floor(mo/12),m=mo%12,first=(new Date(y,m,1).getDay()+6)%7,len=new Date(y,m+1,0).getDate();

 let wd=0,pr=0,ab=0;
 for(let k=0;k<30;k++){
  const d=addDays(TODAY,-k);
  if(isWknd(d)&&!att[id+'|'+d])continue;
  wd++;
  const x=st(id,d);
  if(x==='Present'||x==='Late')pr++;
  if(x==='Absent')ab++;
 }
 const recent=[...Array(8)].map((_,k)=>addDays(TODAY,-k));

 return (
  <>
   <section className="today">
    <div>
     <h3>Today’s attendance</h3>
     <dl className="kv">
      <div><dt>Status</dt><dd><Badge s={s}/></dd></div>
      <div><dt>Check-in</dt><dd>{t12(r?.in)}</dd></div>
      <div><dt>Check-out</dt><dd>{t12(r?.out)}</dd></div>
      <div><dt>Working time</dt><dd>{fmtDur(dur(r))}</dd></div>
     </dl>
    </div>
    {!r?.in
     ?<button className="btn lg" onClick={()=>{checkIn(id);say('Checked in successfully')}}>Check In</button>
     :!r.out
     ?<button className="btn lg" onClick={()=>{checkOut(id);say('Checked out successfully')}}>Check Out</button>
     :<p className="note">Done for today — {t12(r.in)} to {t12(r.out)}.</p>
    }
   </section>
   <Summary items={[
    ['Working days (30d)',wd],
    ['Present',pr,'present'],
    ['Absent',ab,'absent'],
    ['Leave balance',me.leave+' days','leave']
   ]}/>
   <section>
    <h3>This week</h3>
    <div className="scroll">
     <table>
      <thead>
       <tr><th>Day</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Status</th></tr>
      </thead>
      <tbody>
       {days.map(d=>{
        const x=att[id+'|'+d];
        return (
         <tr key={d}>
          <td>{D(d).toLocaleDateString('en-IN',{weekday:'long'})}</td>
          <td>{D(d).getDate()} {D(d).toLocaleDateString('en-IN',{month:'short'})}</td>
          <td>{t12(x?.in)}</td>
          <td>{t12(x?.out)}</td>
          <td>{fmtDur(dur(x))}</td>
          <td><Badge s={st(id,d)}/></td>
         </tr>
        );
       })}
      </tbody>
     </table>
    </div>
   </section>
   <section>
    <div className="split">
     <h3>{new Date(y,m,1).toLocaleDateString('en-IN',{month:'long',year:'numeric'})}</h3>
     <div className="row">
      <button className="btn ghost sm" aria-label="Previous month" onClick={()=>setMo(mo-1)}>Prev</button>
      <button className="btn ghost sm" aria-label="Next month" onClick={()=>setMo(mo+1)}>Next</button>
     </div>
    </div>
    <div className="cal">
     {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><b key={d}>{d}</b>)}
     {[...Array(first)].map((_,i)=><i key={'b'+i}/>)}
     {[...Array(len)].map((_,i)=>{
      const d=`${y}-${pad(m+1)}-${pad(i+1)}`,x=st(id,d);
      return (
       <div key={d} className={'c s-'+x+(d===TODAY?' today':'')} title={statusLabel(x)}>
        <span>{i+1}</span>
        <small>{statusLabel(x)}</small>
       </div>
      );
     })}
    </div>
    <p className="note">Status labels: Present (green) · Late (amber) · Absent (red) · On Leave (blue) · Weekend / Off (neutral). A Saturday with hours indicates a scheduled shift.</p>
   </section>
   <section>
    <h3>Recent attendance</h3>
    <div className="scroll">
     <table>
      <thead>
       <tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Total hours</th><th>Status</th></tr>
      </thead>
      <tbody>
       {recent.map(d=>{
        const x=att[id+'|'+d];
        return (
         <tr key={d}>
          <td>{d}</td>
          <td>{t12(x?.in)}</td>
          <td>{t12(x?.out)}</td>
          <td>{fmtDur(dur(x))}</td>
          <td><Badge s={st(id,d)}/></td>
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

/* ---------- Shell ---------- */
const NAV={
 admin:['Overview','Employees','Attendance','Reports','Settings'],
 hr:['Overview','Employees','Departments','Attendance','Settings'],
 employee:['My attendance','Settings']
};

const NOTES=[
 ['Attendance reminder','Remember to check out before you leave today.'],
 ['Leave approved','Your leave request for next Friday was approved.'],
 ['Late check-in','A late check-in was recorded earlier this week.'],
 ['Company announcement','The office closes at 4 PM on Friday for the quarterly meetup.']
];

function Shell({role}){
 const {user,setUser,q,setQ,say,theme,toggleTheme}=useApp();
 const nav=useNavigate();
 const items=NAV[role];
 const [tab,setTab]=useState(items[0]);
 const [dr,setDr]=useState(false);
 const [menu,setMenu]=useState('');
 const [read,setRead]=useState([]);
 const [open,setOpen]=useState(null);

 useEffect(()=>{
  const handler=e=>{
   if(!e.target.closest('.pop'))setMenu('');
  };
  document.addEventListener('mousedown',handler);
  return()=>document.removeEventListener('mousedown',handler);
 },[]);

 const switchTab=t=>{setTab(t);setDr(false);setMenu('');};

 const first=user.name.split(' ')[0];
 const hr=new Date().getHours();
 const greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
 const page={
  Overview:<Overview role={role}/>,
  Employees:<Employees canEdit={role!=='employee'} role={role} user={user}/>,
  Departments:<Departments/>,
  Attendance:<Attendance role={role} user={user}/>,
  Reports:<Reports/>,
  Settings:<Settings/>,
  'My attendance':<Mine/>
 }[tab];

 const unread=NOTES.length-read.length;

 return (
  <div className="shell">
   <aside className={'side'+(dr?' open':'')}>
    <b className="logo">WorkHuzz</b>
    <nav aria-label="Sections">
     {items.map(i=>(
      <button key={i} aria-current={tab===i?'page':undefined} onClick={()=>switchTab(i)}>
       {i}
      </button>
     ))}
    </nav>
    <div className="who">
     <b>{user.name}</b>
     <small>{role==='hr'?'HR':role[0].toUpperCase()+role.slice(1)}</small>
     <button className="lnk" onClick={()=>{setUser(null);nav('/login')}}>Log out</button>
    </div>
   </aside>
   {dr&&<div className="back" onClick={()=>setDr(false)}/>}
   <div className="main">
    <header className="bar">
     <button className="btn ghost sm menu" aria-label="Open menu" onClick={()=>setDr(true)}>Menu</button>
     <div className="bar-title">
      <h1>{greet}, {role==='admin'?'Admin':first}</h1>
      <span className="bar-sub">{role==='employee'?'Here\'s your attendance summary.':'Here\'s how your workforce is doing today.'}</span>
     </div>
     {role!=='employee'&&<input className="search" type="search" aria-label="Search employees" placeholder="Search name, department, role" value={q} onChange={e=>setQ(e.target.value)}/>}
     <button className="theme-btn" aria-label="Toggle theme" onClick={toggleTheme}>
      {theme==='dark'?'◐ Light':'◑ Dark'}
     </button>
     <div className="pop">
      <button className="btn ghost sm" aria-haspopup="true" aria-expanded={menu==='n'} onClick={()=>setMenu(menu==='n'?'':'n')}>
       Notifications{unread>0&&<span className="cnt">{unread}</span>}
      </button>
      {menu==='n'&&(
       <div className="drop" role="menu">
        {NOTES.map(([t,d],i)=>(
         <button key={t} role="menuitem" className={read.includes(i)?'rd':''} onClick={()=>{setOpen(open===i?null:i);if(!read.includes(i))setRead([...read,i])}}>
          <b>{t}</b>{open===i&&<span>{d}</span>}
         </button>
        ))}
        <button className="lnk" onClick={()=>setRead(NOTES.map((_,i)=>i))}>Mark all as read</button>
       </div>
      )}
     </div>
     <div className="pop">
      <button className="btn ghost sm" aria-haspopup="true" aria-expanded={menu==='p'} onClick={()=>setMenu(menu==='p'?'':'p')}>{first}</button>
      {menu==='p'&&(
       <div className="drop" role="menu">
        <button role="menuitem" onClick={()=>{switchTab('Settings')}}>Profile</button>
        <button role="menuitem" onClick={()=>{switchTab('Settings')}}>Settings</button>
        <button role="menuitem" onClick={()=>{setUser(null);nav('/login');say('Signed out')}}>Logout</button>
       </div>
      )}
     </div>
    </header>
    <main className="page">
     <h2 className="pt">{tab}</h2>
     {page}
    </main>
   </div>
  </div>
 );
}

function Guard({role}){
 const {user}=useApp();
 if(!user)return <Navigate to="/login" replace/>;
 if(user.role!==role)return <Navigate to={'/'+user.role} replace/>;
 return <Shell role={role} key={role}/>;
}

export default function App(){
 return (
  <Provider>
   <Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/login" element={<Login/>}/>
    {['admin','hr','employee'].map(r=><Route key={r} path={'/'+r} element={<Guard role={r}/>}/>)}
    <Route path="*" element={<Navigate to="/" replace/>}/>
   </Routes>
  </Provider>
 );
}

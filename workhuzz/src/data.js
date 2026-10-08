export const DEPTS=['Engineering','Design','HR','Marketing','Finance','Operations'];
export const pad=n=>String(n).padStart(2,'0');
export const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const TODAY=iso(new Date());
export const D=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
export const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
export const isWknd=s=>[0,6].includes(D(s).getDay());
export const mins=t=>{const[h,m]=t.split(':').map(Number);return h*60+m};
export const nowT=()=>{const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`};
export const fmtDur=m=>m==null?'--':`${Math.floor(m/60)}h ${pad(m%60)}m`;
export const t12=t=>{if(!t)return '--';const[h,m]=t.split(':').map(Number);return `${h%12||12}:${pad(m)} ${h<12?'AM':'PM'}`};
export const dur=r=>!r||!r.in?null:Math.max(0,mins(r.out||nowT())-mins(r.in));
const P=[['Aarav Sharma','Engineering','Frontend Developer'],['Meera Iyer','Design','Product Designer'],['Rohan Gupta','Engineering','Backend Developer'],['Sana Khan','HR','HR Manager'],['Vikram Singh','Marketing','Growth Lead'],['Ananya Rao','Finance','Accountant'],['Karan Mehta','Operations','Operations Lead'],['Isha Verma','Design','UX Researcher'],['Dev Patel','Engineering','QA Engineer'],['Neha Joshi','Marketing','Content Strategist'],['Arjun Nair','Finance','Financial Analyst'],['Pooja Desai','Operations','Coordinator']];
export const seedEmps=()=>P.map(([name,department,role],i)=>({id:'E'+pad(i+1),name,email:name.split(' ')[0].toLowerCase()+'@workhuzz.com',department,role,phone:'+91 98'+pad(10+i*7)+'4'+pad(20+i)+'55',joined:`202${i%4}-0${1+i%9}-1${i%9}`,status:i===11?'On Leave':'Active',leave:12-(i%5)}));
const r=(i,d)=>((i*31+d*17+7)*9301%233280)/233280;
export const seedAtt=()=>{const a={};
 for(let i=0;i<12;i++)for(let k=-42;k<=0;k++){const date=addDays(TODAY,k),dd=D(date).getDay(),x=r(i,k+50),id='E'+pad(i+1);
  if(dd===0||(dd===6&&i%4!==0))continue;
  if(k===0){if(i===0||x<.3)continue;}
  else if(x<.07){a[id+'|'+date]={status:'Absent'};continue}else if(x<.13){a[id+'|'+date]={status:'Leave'};continue}
  const inn=530+Math.floor(x*70),late=inn>570;
  a[id+'|'+date]={in:`${pad(Math.floor(inn/60))}:${pad(inn%60)}`,out:k===0?null:`${pad(17+Math.floor(x*2))}:${pad(Math.floor(x*59))}`,status:late?'Late':'Present'};}
 return a};
export const getStatus=(att,id,date,emp)=>{const x=att[id+'|'+date];if(x)return x.status;if(emp&&emp.status==='On Leave'&&date===TODAY)return 'Leave';
 return date>TODAY?(isWknd(date)?'Weekend':'Upcoming'):isWknd(date)?'Weekend':'Absent'};
export const ACCOUNTS=[{email:'admin@workhuzz.com',password:'admin123',role:'admin',name:'Admin'},{email:'hr@workhuzz.com',password:'hr12345',role:'hr',name:'Sana Khan',empId:'E04'},{email:'aarav@workhuzz.com',password:'emp12345',role:'employee',name:'Aarav Sharma',empId:'E01'}];

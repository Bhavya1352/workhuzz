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
export const fmtSalary=n=>'₹'+n.toLocaleString('en-IN');

const P=[
  ['Aarav Sharma','Engineering','Frontend Developer',95000,'+91 98104 2055','Priya Sharma','+91 98104 2056','Spouse'],
  ['Meera Iyer','Design','Product Designer',78000,'+91 98174 2155','Ravi Iyer','+91 98174 2156','Parent'],
  ['Rohan Gupta','Engineering','Backend Developer',105000,'+91 98244 2255','Sunita Gupta','+91 98244 2256','Spouse'],
  ['Sana Khan','HR','HR Manager',82000,'+91 98314 2355','Imran Khan','+91 98314 2356','Sibling'],
  ['Vikram Singh','Marketing','Growth Lead',88000,'+91 98384 2455','Kavita Singh','+91 98384 2456','Spouse'],
  ['Ananya Rao','Finance','Accountant',72000,'+91 98454 2555','Suresh Rao','+91 98454 2556','Parent'],
  ['Karan Mehta','Operations','Operations Lead',80000,'+91 98524 2655','Neha Mehta','+91 98524 2656','Spouse'],
  ['Isha Verma','Design','UX Researcher',75000,'+91 98594 2755','Amit Verma','+91 98594 2756','Sibling'],
  ['Dev Patel','Engineering','QA Engineer',68000,'+91 98664 2855','Hina Patel','+91 98664 2856','Parent'],
  ['Neha Joshi','Marketing','Content Strategist',65000,'+91 98734 2955','Raj Joshi','+91 98734 2956','Spouse'],
  ['Arjun Nair','Finance','Financial Analyst',85000,'+91 98804 3055','Divya Nair','+91 98804 3056','Spouse'],
  ['Pooja Desai','Operations','Coordinator',58000,'+91 98874 3155','Mohan Desai','+91 98874 3156','Parent']
];

export const seedEmps=()=>P.map(([name,department,role,salary,phone,ecName,ecPhone,ecRel],i)=>({
  id:'E'+pad(i+1),name,
  email:name.split(' ')[0].toLowerCase()+'@workhuzz.com',
  department,role,salary,phone,
  emergencyContact:{name:ecName,phone:ecPhone,relation:ecRel},
  joined:`202${i%4}-0${1+i%9}-1${i%9}`,
  status:i===11?'On Leave':'Active',
  leave:12-(i%5),
  employmentType:'Full-time'
}));

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

export const seedLeaves=()=>[
  {id:'L01',empId:'E02',empName:'Meera Iyer',department:'Design',type:'Sick Leave',from:addDays(TODAY,2),to:addDays(TODAY,3),days:2,reason:'Medical appointment',status:'Pending',applied:addDays(TODAY,-1)},
  {id:'L02',empId:'E05',empName:'Vikram Singh',department:'Marketing',type:'Casual Leave',from:addDays(TODAY,5),to:addDays(TODAY,5),days:1,reason:'Personal work',status:'Pending',applied:addDays(TODAY,-2)},
  {id:'L03',empId:'E09',empName:'Dev Patel',department:'Engineering',type:'Annual Leave',from:addDays(TODAY,-5),to:addDays(TODAY,-3),days:3,reason:'Family vacation',status:'Approved',applied:addDays(TODAY,-10)},
  {id:'L04',empId:'E10',empName:'Neha Joshi',department:'Marketing',type:'Sick Leave',from:addDays(TODAY,-2),to:addDays(TODAY,-2),days:1,reason:'Fever',status:'Approved',applied:addDays(TODAY,-3)},
  {id:'L05',empId:'E06',empName:'Ananya Rao',department:'Finance',type:'Casual Leave',from:addDays(TODAY,7),to:addDays(TODAY,8),days:2,reason:'Personal',status:'Pending',applied:TODAY},
  {id:'L06',empId:'E01',empName:'Aarav Sharma',department:'Engineering',type:'Annual Leave',from:addDays(TODAY,-15),to:addDays(TODAY,-12),days:4,reason:'Holiday trip',status:'Approved',applied:addDays(TODAY,-20)},
];

export const LEAVE_TYPES=['Annual Leave','Sick Leave','Casual Leave','Maternity Leave','Paternity Leave','Unpaid Leave'];

export const ACCOUNTS=[
  {email:'admin@workhuzz.com',password:'admin123',role:'admin',name:'Admin'},
  {email:'hr@workhuzz.com',password:'hr12345',role:'hr',name:'Sana Khan',empId:'E04',department:'HR'},
  {email:'aarav@workhuzz.com',password:'emp12345',role:'employee',name:'Aarav Sharma',empId:'E01',department:'Engineering'}
];

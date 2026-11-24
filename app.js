const PLAN_DATA = [
  {name:"Starter Plan",amount:1000,icon:"🌱",color:"#3de5a0"},
  {name:"Silver Plan",amount:2000,icon:"⬡",color:"#b8c9dc"},
  {name:"Gold Plan",amount:3000,icon:"◆",color:"#efbd42"},
  {name:"Platinum Plan",amount:4000,icon:"⬟",color:"#9eacff"},
  {name:"Diamond Plan",amount:5000,icon:"💎",color:"#45c7ff"},
  {name:"Emerald Plan",amount:6000,icon:"💚",color:"#42e0a3"},
  {name:"Ruby Plan",amount:7000,icon:"♦",color:"#fa668c"},
  {name:"Sapphire Plan",amount:8000,icon:"💠",color:"#5c9bff"},
  {name:"Royal Plan",amount:9000,icon:"♛",color:"#eac35b"},
  {name:"Elite Plan",amount:10000,icon:"🏆",color:"#eebd51"}
];
const DB_KEY = "novaInvestV1";
const today = () => new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const money = n => "₹" + Number(n||0).toLocaleString("en-IN");
const escapeHTML = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let db = loadDB(), currentUser = null, isAdmin = false, adminTab = "deposits", transactionFilter = "All";
function loadDB(){
  try { const x=JSON.parse(localStorage.getItem(DB_KEY)); if(x && x.users && x.requests && x.investments) return x; } catch(e){}
  const x={users:[{id:"user",name:" User",mobile:"9000000000",email:"user@novainvest.test",password:"123456",balance:10000,rewards:0,joined:today()}],requests:[],transactions:[],investments:[]};
  saveDB(x);return x;
}
function saveDB(x=db){localStorage.setItem(DB_KEY,JSON.stringify(x));}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),3200);}
function showPage(name){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const page=document.getElementById("page-"+name); if(!page){name="home";document.getElementById("page-home").classList.add("active")}else page.classList.add("active");
  document.querySelectorAll("[data-page]").forEach(a=>a.classList.toggle("selected",a.dataset.page===name));
  document.querySelectorAll("[data-sidebar]").forEach(el=>{if(!el.innerHTML.trim())el.innerHTML=sidebarHTML()});
  document.querySelector(".topnav").classList.remove("open");
  if(name==="dashboard")renderDashboard();if(name==="transactions")renderTransactions();if(name==="investments")renderInvestments();if(name==="profile")renderProfile();if(name==="admin")renderAdmin();
  window.scrollTo({top:0,behavior:"smooth"});
}
function sidebarHTML(){return `<a class="brand side-brand" href="#" data-page="dashboard"><span class="logo">N</span> Nova Invest</a><div class="side-links"><a class="side-link" href="#" data-page="dashboard">▦ <span>Dashboard</span></a><a class="side-link" href="#" data-page="plans">♧ <span>Invest Plans</span></a><a class="side-link" href="#" data-page="deposit">＋ <span>Deposit</span></a><a class="side-link" href="#" data-page="withdraw">↗ <span>Withdraw</span></a><a class="side-link" href="#" data-page="transactions">▤ <span>Transactions</span></a><a class="side-link" href="#" data-page="investments">◈ <span>My Investments</span></a><a class="side-link" href="#" data-page="profile">♙ <span>Profile</span></a><a class="side-link logout" href="#" id="logoutLink">⇥ <span>Logout</span></a></div>`}
function planCard(p){return `<article class="plan-card" style="--plan-color:${p.color}"><div class="plan-icon">${p.icon}</div><h3>${p.name}</h3><div class="plan-price">${money(p.amount)}</div><div class="plan-caption">Illustrative plan amount</div><button class="btn btn-green" data-invest="${p.amount}">Select Plan</button></article>`}
document.getElementById("homePlans").innerHTML=PLAN_DATA.slice(0,5).map(planCard).join("");
document.getElementById("allPlans").innerHTML=PLAN_DATA.map(planCard).join("");
document.addEventListener("click",e=>{
 const pageEl=e.target.closest("[data-page]");if(pageEl){e.preventDefault();const page=pageEl.dataset.page;if(["dashboard","deposit","withdraw","transactions","investments","profile"].includes(page)&&!currentUser){toast("Please log in or register a demo account first.");showPage("login");return}showPage(page);return}
 const invest=e.target.closest("[data-invest]");if(invest){const amount=Number(invest.dataset.invest);if(!currentUser){toast("Log in or register to select a demo plan.");showPage("register");return}if(!confirm(`Select ${money(amount)} ${PLAN_DATA.find(p=>p.amount===amount).name} in demo mode? No real investment is made.`))return;db.investments.unshift({id:Date.now(),userId:currentUser.id,plan:PLAN_DATA.find(p=>p.amount===amount).name,amount,status:"Demo selected",date:today()});db.transactions.unshift({id:Date.now(),userId:currentUser.id,type:"Investment",amount,status:"Demo",date:today()});saveDB();toast("Demo plan selected.");showPage("investments");return}
 const toggle=e.target.closest("[data-toggle]");if(toggle){const input=document.getElementById(toggle.dataset.toggle);input.type=input.type==="password"?"text":"password";return}
 const preset=e.target.closest("[data-amount]");if(preset){document.getElementById("withdrawAmount").value=preset.dataset.amount;return}
 const filter=e.target.closest("[data-filter]");if(filter){transactionFilter=filter.dataset.filter;document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b===filter));renderTransactions();return}
 const tab=e.target.closest("[data-admin-tab]");if(tab){e.preventDefault();adminTab=tab.dataset.adminTab;renderAdmin();return}
 const act=e.target.closest("[data-action]");if(act){reviewRequest(Number(act.dataset.id),act.dataset.action);return}
 if(e.target.id==="logoutLink"){e.preventDefault();currentUser=null;toast("You have logged out.");showPage("home")}
 if(e.target.id==="adminLogout"){e.preventDefault();isAdmin=false;showPage("admin-login")}
});
document.getElementById("menuToggle").addEventListener("click",()=>document.querySelector(".topnav").classList.toggle("open"));
document.getElementById("registerForm").addEventListener("submit",e=>{
 e.preventDefault();const name=document.getElementById("regName").value.trim(),mobile=document.getElementById("regMobile").value.trim(),email=document.getElementById("regEmail").value.trim().toLowerCase(),password=document.getElementById("regPassword").value;
 if(db.users.some(u=>u.email===email)){toast("An account with that email already exists.");return}
 const user={id:"u"+Date.now(),name,mobile,email,password,balance:0,rewards:0,joined:today()};db.users.push(user);saveDB();currentUser=user;toast("Demo account created. No real funds are involved.");showPage("dashboard");
});
document.getElementById("loginForm").addEventListener("submit",e=>{
 e.preventDefault();const identity=document.getElementById("loginIdentity").value.trim().toLowerCase(),password=document.getElementById("loginPassword").value;
 const user=db.users.find(u=>(u.email.toLowerCase()===identity||u.mobile===identity)&&u.password===password);
 if(!user){toast("Login details not found. Try user@novainvest.test / user123.");return}currentUser=user;toast("Logged in to demo account.");showPage("dashboard");
});
document.getElementById("forgotLink").addEventListener("click",e=>{e.preventDefault();toast("Password recovery is not connected in this front-end demo.")});
document.getElementById("depositForm").addEventListener("submit",e=>{
 e.preventDefault();if(!currentUser){showPage("login");return}const amount=Number(document.getElementById("depositAmount").value);if(amount<500){toast("Minimum demo deposit request is ₹500.");return}
 const method=document.querySelector('input[name="payment"]:checked').value,ref=document.getElementById("depositRef").value.trim();
 db.requests.unshift({id:Date.now(),userId:currentUser.id,userName:currentUser.name,type:"Deposit",amount,method,ref,status:"Pending",date:today()});
 db.transactions.unshift({id:Date.now(),userId:currentUser.id,type:"Deposit",amount,status:"Pending",date:today()});saveDB();e.target.reset();toast("Demo deposit request submitted for admin review.");showPage("dashboard");
});
document.getElementById("withdrawForm").addEventListener("submit",e=>{
 e.preventDefault();if(!currentUser){showPage("login");return}const amount=Number(document.getElementById("withdrawAmount").value);if(amount<1000){toast("Minimum demo withdrawal request is ₹1,000.");return}
 db.requests.unshift({id:Date.now(),userId:currentUser.id,userName:currentUser.name,type:"Withdrawal",amount,method:"Demo only",ref:document.getElementById("withdrawRef").value.trim(),status:"Pending",date:today()});
 db.transactions.unshift({id:Date.now(),userId:currentUser.id,type:"Withdrawal",amount,status:"Pending",date:today()});saveDB();e.target.reset();toast("Demo withdrawal request submitted. No money is sent.");showPage("dashboard");
});
document.getElementById("adminLoginForm").addEventListener("submit",e=>{e.preventDefault();if(document.getElementById("adminUsername").value==="admin"&&document.getElementById("adminPassword").value==="admin123"){isAdmin=true;toast("Admin  panel opened.");showPage("admin")}else toast("Use  credentials admin / admin123.")});
function renderDashboard(){
 if(!currentUser)return;const u=db.users.find(x=>x.id===currentUser.id);if(!u){currentUser=null;showPage("login");return}currentUser=u;
 document.getElementById("dashName").textContent=u.name.split(" ")[0];document.getElementById("userDisplay").textContent=u.name;document.getElementById("userEmail").textContent=u.email;document.getElementById("avatar").textContent=u.name[0].toUpperCase();
 const investments=db.investments.filter(i=>i.userId===u.id);const rewards=db.transactions.filter(t=>t.userId===u.id&&t.type==="Reward").reduce((s,t)=>s+t.amount,0);
 document.getElementById("balanceStat").textContent=money(u.balance);document.getElementById("investedStat").textContent=money(investments.reduce((s,i)=>s+i.amount,0));document.getElementById("rewardsStat").textContent=money(rewards);document.getElementById("pendingStat").textContent=db.requests.filter(r=>r.userId===u.id&&r.status==="Pending").length;
 const items=db.transactions.filter(t=>t.userId===u.id).slice(0,6);document.getElementById("recentActivity").innerHTML=items.length?items.map(t=>`<div class="activity-row"><div class="activity-icon">${t.type==="Deposit"?"＋":t.type==="Withdrawal"?"⇩":t.type==="Investment"?"◈":"↗"}</div><div class="activity-main"><b>${escapeHTML(t.type)} ${t.type==="Investment"?"selected":"request"}</b><small>${escapeHTML(t.date)}</small></div><span class="activity-amount">${money(t.amount)}</span><span class="status ${statusClass(t.status)}">${escapeHTML(t.status)}</span></div>`).join(""):`<div class="table-empty">No activity yet. Browse plans or submit a demo request.</div>`;
}
function statusClass(s){return ({Approved:"approved",Active:"active",Credited:"credited",Demo:"approved",Rejected:"rejected"})[s]||"pending"}
function renderTransactions(){if(!currentUser)return;const rows=db.transactions.filter(t=>t.userId===currentUser.id&&(transactionFilter==="All"||t.type===transactionFilter));document.getElementById("transactionRows").innerHTML=rows.length?rows.map((t,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(t.type)}</td><td>${money(t.amount)}</td><td><span class="status ${statusClass(t.status)}">${escapeHTML(t.status)}</span></td><td>${escapeHTML(t.date)}</td></tr>`).join(""):`<tr><td colspan="5" class="table-empty">No matching demo transactions.</td></tr>`}
function renderInvestments(){if(!currentUser)return;const rows=db.investments.filter(i=>i.userId===currentUser.id);document.getElementById("investmentRows").innerHTML=rows.length?rows.map(i=>`<tr><td>${escapeHTML(i.plan)}</td><td>${money(i.amount)}</td><td><span class="status approved">${escapeHTML(i.status)}</span></td><td>${escapeHTML(i.date)}</td></tr>`).join(""):`<tr><td colspan="4" class="table-empty">No demo plans selected yet. <a href="#" data-page="plans">Browse plans</a>.</td></tr>`}
function renderProfile(){if(!currentUser)return;document.getElementById("profileName").textContent=currentUser.name;document.getElementById("profileEmail").textContent=currentUser.email;document.getElementById("profileAvatar").textContent=currentUser.name[0].toUpperCase();document.getElementById("profileNameInput").value=currentUser.name;document.getElementById("profileEmailInput").value=currentUser.email;document.getElementById("profileMobileInput").value=currentUser.mobile}
document.getElementById("saveProfile").addEventListener("click",()=>{if(!currentUser)return;const name=document.getElementById("profileNameInput").value.trim(),email=document.getElementById("profileEmailInput").value.trim().toLowerCase(),mobile=document.getElementById("profileMobileInput").value.trim();if(!name||!email){toast("Name and email are required.");return}if(db.users.some(u=>u.id!==currentUser.id&&u.email===email)){toast("That email is already used.");return}Object.assign(currentUser,{name,email,mobile});saveDB();toast("Demo profile saved.");renderProfile();renderDashboard()});
function renderAdmin(){if(!isAdmin){showPage("admin-login");return}document.getElementById("adminUsersStat").textContent=db.users.length;document.getElementById("adminDepositStat").textContent=db.requests.filter(r=>r.type==="Deposit"&&r.status==="Pending").length;document.getElementById("adminWithdrawStat").textContent=db.requests.filter(r=>r.type==="Withdrawal"&&r.status==="Pending").length;document.getElementById("adminTotalStat").textContent=money(db.requests.reduce((s,r)=>s+r.amount,0));
 document.querySelectorAll("[data-admin-tab]").forEach(b=>b.classList.toggle("active",b.dataset.adminTab===adminTab));
 const requests=db.requests.filter(r=>r.type===(adminTab==="deposits"?"Deposit":"Withdrawal"));document.getElementById("adminRequestRows").innerHTML=requests.length?requests.map(r=>`<tr><td>${escapeHTML(r.userName)}</td><td>${money(r.amount)}</td><td>${escapeHTML(r.method||"Virtual")}</td><td><span class="status ${statusClass(r.status)}">${escapeHTML(r.status)}</span></td><td>${r.status==="Pending"?`<button class="action-btn approve" data-action="approve" data-id="${r.id}">Approve</button><button class="action-btn reject" data-action="reject" data-id="${r.id}">Reject</button>`:"—"}</td></tr>`).join(""):`<tr><td colspan="5" class="table-empty">No ${adminTab} requests yet.</td></tr>`;
 document.getElementById("adminUserRows").innerHTML=db.users.map(u=>`<tr><td>${escapeHTML(u.name)}</td><td>${escapeHTML(u.email)}</td><td>${escapeHTML(u.mobile)}</td><td>${escapeHTML(u.joined)}</td></tr>`).join("");
}
function reviewRequest(id,action){if(!isAdmin)return;const r=db.requests.find(x=>x.id===id);if(!r||r.status!=="Pending")return;const user=db.users.find(u=>u.id===r.userId);if(action==="approve"){if(r.type==="Deposit"&&user)user.balance+=r.amount;if(r.type==="Withdrawal"&&user){if(user.balance<r.amount){toast("Cannot approve: demo balance is insufficient.");return}user.balance-=r.amount}r.status="Approved"}else r.status="Rejected";const t=db.transactions.find(t=>t.id===r.id);if(t)t.status=r.status;saveDB();toast(`Demo request ${r.status.toLowerCase()}.`);renderAdmin()}
document.getElementById("contactSubmit").addEventListener("click",()=>toast("Demo only: your message was not sent anywhere."));
document.querySelectorAll("[data-sidebar]").forEach(el=>el.innerHTML=sidebarHTML());
showPage("home");

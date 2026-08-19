
const initialProperties = [
  {id:1,name:"竹北高鐵兩房",price:2380,area:26.8,location:"新竹縣竹北市",zone:"竹北",nearestName:"竹北高鐵",nearestDistance:2100,lat:24.806,lng:121.039,layout:"2房2廳1衛",age:"9 年",status:"candidate",agent:"永慶房屋 王先生",agentContact:"0912-345-678",mine:88,partner:83,ratings:{light:"good",air:"good",noise:"normal",layout:"good",traffic:"good"},flaws:["浴室沒窗"],advantages:["離車站近","離園區近"]},
  {id:2,name:"新莊站三房",price:2688,area:32.1,location:"新竹市東區",zone:"新莊",nearestName:"新莊車站",nearestDistance:900,lat:24.787,lng:121.017,layout:"3房2廳2衛",age:"6 年",status:"seen",agent:"信義房屋 林小姐",agentContact:"LINE: linhouse",mine:82,partner:87,ratings:{light:"good",air:"good",noise:"good",layout:"normal",traffic:"good"},flaws:["戶數超過300"],advantages:["離車站近","附近熱鬧"]},
  {id:3,name:"好市多生活圈小宅",price:2180,area:21.6,location:"新竹市東區",zone:"好市多",nearestName:"新竹好市多",nearestDistance:1300,lat:24.797,lng:120.995,layout:"2房1廳1衛",age:"18 年",status:"todo",agent:"住商不動產 陳先生",agentContact:"0988-111-222",mine:null,partner:null,ratings:{},flaws:[],advantages:["附近熱鬧"]},
  {id:4,name:"新竹站景觀宅",price:2880,area:30.2,location:"新竹市東區",zone:"新竹",nearestName:"新竹車站",nearestDistance:700,lat:24.802,lng:120.971,layout:"2+1房2廳2衛",age:"12 年",status:"todo",agent:"台灣房屋 李小姐",agentContact:"0977-888-666",mine:null,partner:null,ratings:{},flaws:[],advantages:["離車站近"]},
  {id:5,name:"竹北北興兩房",price:2550,area:27.4,location:"新竹縣竹北市",zone:"竹北",layout:"2房2廳1衛",age:"15 年",status:"saved",agent:"永慶不動產",agentContact:"03-555-8888",mine:null,partner:null,ratings:{},flaws:[],advantages:[]},
  {id:6,name:"新莊副都心兩房",price:2298,area:24.7,location:"新北市新莊區",zone:"新莊",layout:"2房1廳1衛",age:"20 年",status:"saved",agent:"信義房屋",agentContact:"02-2999-9999",mine:null,partner:null,ratings:{},flaws:[],advantages:[]},
];

const saved = JSON.parse(localStorage.getItem("homebuying-properties-v2") || "null");
let properties = saved || initialProperties;
let currentFilter = "all";
let currentArea = "all";
let currentView = "cards";

const statusMap = {
  saved:"收藏",
  discuss:"待討論",
  todo:"待看",
  seen:"已看",
  candidate:"候選",
  rejected:"淘汰"
};
const ratingText = {good:"好",normal:"普通",bad:"差"};
const ratingEmoji = {good:"👍",normal:"😐",bad:"👎"};
const ratingLabels = {light:"採光",air:"通風",noise:"隔音",layout:"格局",traffic:"交通"};
const flaws = ["西曬","壁癌","漏水","水壓不足","浴室沒窗","暗房","噪音","垃圾處理麻煩","樓下餐廳","老舊電梯","管理室沒有24小時","戶數超過300","戶數小於50"];
const advantages = ["離車站近","附近熱鬧","有充電樁","廁所有窗","離園區近"];

function persist(){ localStorage.setItem("homebuying-properties-v2", JSON.stringify(properties)); }
function fmtPrice(n){ return Number(n).toLocaleString("zh-TW"); }

function renderCounts(){
  document.querySelector("#countAll").textContent = properties.filter(p=>p.status!=="rejected").length;
  document.querySelector("#countSaved").textContent = properties.filter(p=>p.status==="saved").length;
  document.querySelector("#countTodo").textContent = properties.filter(p=>p.status==="todo").length;
  document.querySelector("#countSeen").textContent = properties.filter(p=>p.status==="seen" || p.status==="candidate").length;
}

function visibleProps(){
  let arr = properties.filter(p=>p.status!=="rejected");
  if(currentFilter==="saved") arr = arr.filter(p=>p.status==="saved");
  if(currentFilter==="todo") arr = arr.filter(p=>p.status==="todo");
  if(currentFilter==="seen") arr = arr.filter(p=>p.status==="seen" || p.status==="candidate");
  if(currentFilter==="candidate") arr = arr.filter(p=>p.status==="candidate");
  if(currentArea!=="all") arr = arr.filter(p=>p.zone===currentArea);
  return arr;
}

function renderCards(){
  const list = document.querySelector("#cardView");
  const items = visibleProps();
  if(!items.length){
    list.innerHTML = `<div class="empty">這個條件目前沒有房屋。</div>`;
    return;
  }

  list.innerHTML = items.map(p => `
    <article class="property-card" data-id="${p.id}">
      <div class="card-body">
        <div class="topline">
          <span class="status-chip">${statusMap[p.status]}</span>
          <span class="zone-chip">${p.zone || "未分類"}</span>
        </div>

        <div class="card-title-row">
          <div>
            <h4>${p.name}</h4>
            <p class="meta">${p.location}<br>${p.area} 坪 · ${p.layout || "格局未填"} · 屋齡 ${p.age || "未填"}${p.nearestName ? `<br>最近：${p.nearestName} · ${HomeMaps.formatDistance(Number(p.nearestDistance))}` : ""}</p>
          </div>
          <div class="price">${fmtPrice(p.price)}<small> 萬</small></div>
        </div>

        ${(p.agent || p.agentContact) ? `<div class="agent-line">房仲｜${p.agent || "未填"}${p.agentContact ? ` · ${p.agentContact}` : ""}</div>` : ""}

        <div class="score-row">
          <div class="score-people">
            <span class="person-score"><span class="avatar">J</span>${p.mine ?? "—"}</span>
            <span class="person-score"><span class="avatar">N</span>${p.partner ?? "—"}</span>
          </div>
          <div class="card-actions">
            ${p.status==="saved" ? `<button class="mini-btn" data-action="todo">加入待看</button>` : ""}
            ${p.status==="todo" ? `<button class="mini-btn primary" data-action="seen">開始看房</button>` : ""}
            <button class="mini-btn" data-action="detail">查看</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function renderCompare(){
  const targets = properties.filter(p=>p.status==="seen" || p.status==="candidate").filter(p=>currentArea==="all" || p.zone===currentArea);
  const table = document.querySelector("#compareTable");
  if(!targets.length){ table.innerHTML = `<div class="empty">還沒有已看房屋可以比較。</div>`; return; }

  const rows = [
    ["區域", ...targets.map(p=>p.zone || "—")],
    ["最近據點", ...targets.map(p=>p.nearestName ? `${p.nearestName} ${HomeMaps.formatDistance(Number(p.nearestDistance))}` : "—")],
    ["總價", ...targets.map(p=>`${fmtPrice(p.price)} 萬`)],
    ["坪數", ...targets.map(p=>`${p.area} 坪`)],
    ["格局", ...targets.map(p=>p.layout)],
    ["採光", ...targets.map(p=>rateCell(p.ratings.light))],
    ["通風", ...targets.map(p=>rateCell(p.ratings.air))],
    ["隔音", ...targets.map(p=>rateCell(p.ratings.noise))],
    ["交通", ...targets.map(p=>rateCell(p.ratings.traffic))],
    ["特殊優點", ...targets.map(p=>p.advantages?.length ? p.advantages.join("、") : "無")],
    ["硬傷", ...targets.map(p=>p.flaws?.length ? p.flaws.join("、") : "無")],
    ["J", ...targets.map(p=>p.mine ? `${p.mine} 分` : "—")],
    ["N", ...targets.map(p=>p.partner ? `${p.partner} 分` : "—")],
  ];

  table.innerHTML = `<div class="compare-grid" style="grid-template-columns:110px repeat(${targets.length}, minmax(160px,1fr))">
    <div class="compare-cell head label">項目</div>
    ${targets.map(p=>`<div class="compare-cell head">${p.name}${p.status==="candidate" ? " ★" : ""}</div>`).join("")}
    ${rows.map(r=>r.map((c,i)=>`<div class="compare-cell ${i===0 ? "label":""}">${c}</div>`).join("")).join("")}
  </div>`;
}
function rateCell(r){ return r ? `<span class="${r}">${ratingEmoji[r]} ${ratingText[r]}</span>` : "—"; }

function render(){ renderCounts(); renderCards(); renderCompare(); }
render();

document.querySelector("#progressGrid").addEventListener("click", e=>{
  const b=e.target.closest("[data-filter]"); if(!b)return;
  currentFilter=b.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));
  renderCards();
});

document.querySelector("#areaFilter").addEventListener("click", e=>{
  const b=e.target.closest("[data-area]"); if(!b)return;
  currentArea=b.dataset.area;
  document.querySelectorAll("[data-area]").forEach(x=>x.classList.toggle("active",x===b));
  renderCards();
  renderCompare();
});

document.querySelectorAll(".seg").forEach(btn=>btn.addEventListener("click",()=>{
  currentView=btn.dataset.view;
  document.querySelectorAll(".seg").forEach(x=>x.classList.toggle("active",x===btn));
  document.querySelector("#cardView").classList.toggle("hidden",currentView!=="cards");
  document.querySelector("#tableView").classList.toggle("hidden",currentView!=="table");
}));

document.querySelector("#cardView").addEventListener("click",e=>{
  const card=e.target.closest(".property-card"); if(!card)return;
  const p=properties.find(x=>x.id===Number(card.dataset.id));
  const action=e.target.closest("[data-action]")?.dataset.action || "detail";
  if(action==="todo"){ p.status="todo"; persist(); render(); return; }
  if(action==="seen"){ p.status="seen"; persist(); render(); openDetail(p.id,true); return; }
  openDetail(p.id,false);
});

function openDetail(id, ratingMode=false){
  const p=properties.find(x=>x.id===id); if(!p)return;

  const ratingHtml=Object.entries(ratingLabels).map(([key,label])=>`
    <div class="rating-item">
      <span>${label}</span>
      <div class="rating-buttons" data-rating="${key}">
        ${["good","normal","bad"].map(v=>`<button data-value="${v}" class="${p.ratings?.[key]===v?"selected":""}">${ratingText[v]}</button>`).join("")}
      </div>
    </div>
  `).join("");

  document.querySelector("#detailContent").innerHTML=`
    <div class="sheet-head">
      <div>
        <p class="eyebrow">${ratingMode ? "VIEWING MODE" : "PROPERTY DETAIL"}</p>
        <h3>${p.name}</h3>
      </div>
      <button class="icon-btn small" data-close>×</button>
    </div>

    <div class="detail-summary">
      <div class="big-price">${fmtPrice(p.price)} 萬</div>
      <div class="muted">${p.location} · ${p.area} 坪 · ${p.layout} · 屋齡 ${p.age}${p.agent ? `<br>房仲：${p.agent}` : ""}${p.agentContact ? ` · ${p.agentContact}` : ""}</div>
      ${p.nearestName ? `<div class="location-block">
        <div class="location-label">最近據點</div>
        <div class="location-main">
          <strong>${p.nearestName} · ${HomeMaps.formatDistance(Number(p.nearestDistance))}</strong>
          ${p.lat && p.lng ? `<a class="maps-link" href="${HomeMaps.mapsUrl(p)}" target="_blank" rel="noopener">Google Maps ↗</a>` : ""}
        </div>
      </div>` : ""}
    </div>

    <div class="quick-actions">
      <button data-set-status="saved">收藏</button>
      <button data-set-status="todo">待看</button>
      <button data-set-status="candidate">候選</button>
    </div>

    <div class="rating-group">
      <h4>現場快速評價</h4>
      ${ratingHtml}
    </div>

    <div class="rating-group">
      <h4>特殊優點</h4>
      <div class="advantage-grid">
        ${advantages.map(a=>`<button class="advantage-chip ${p.advantages?.includes(a)?"selected":""}" data-advantage="${a}">${a}</button>`).join("")}
      </div>
    </div>

    <div class="rating-group">
      <h4>硬傷紀錄</h4>
      <div class="flaw-grid">
        ${flaws.map(f=>`<button class="flaw-chip ${p.flaws?.includes(f)?"selected":""}" data-flaw="${f}">${f}</button>`).join("")}
      </div>
    </div>

    <div class="sheet-footer-actions">
      <button class="secondary-btn" data-edit>編輯資料</button>
      <button class="danger-btn" data-delete>永久刪除</button>
      <button class="secondary-btn" data-reject>暫時隱藏</button>
      <button class="primary-btn" data-finish>完成看房紀錄</button>
    </div>
  `;

  document.querySelector("#detailSheet").dataset.id=id;
  showSheet("#detailSheet");
}

function showSheet(sel){
  document.querySelector("#sheetBackdrop").classList.remove("hidden");
  document.querySelector(sel).classList.remove("hidden");
}
function closeSheets(){
  document.querySelector("#sheetBackdrop").classList.add("hidden");
  document.querySelectorAll(".bottom-sheet").forEach(x=>x.classList.add("hidden"));
}
document.querySelector("#sheetBackdrop").addEventListener("click",closeSheets);
document.addEventListener("click",e=>{
  if(e.target.closest("[data-close]")) closeSheets();
});

document.querySelector("#detailSheet").addEventListener("click",e=>{
  const id=Number(e.currentTarget.dataset.id);
  const p=properties.find(x=>x.id===id); if(!p)return;

  const status=e.target.closest("[data-set-status]")?.dataset.setStatus;
  if(status){ p.status=status; persist(); render(); openDetail(id); return; }

  const rbtn=e.target.closest("[data-rating] button");
  if(rbtn){
    const key=rbtn.parentElement.dataset.rating;
    p.ratings=p.ratings||{};
    p.ratings[key]=rbtn.dataset.value;
    persist(); openDetail(id); return;
  }

  const flawBtn=e.target.closest("[data-flaw]");
  if(flawBtn){
    p.flaws=p.flaws||[];
    const f=flawBtn.dataset.flaw;
    p.flaws=p.flaws.includes(f) ? p.flaws.filter(x=>x!==f) : [...p.flaws,f];
    persist(); openDetail(id); return;
  }

  const advBtn=e.target.closest("[data-advantage]");
  if(advBtn){
    p.advantages=p.advantages||[];
    const a=advBtn.dataset.advantage;
    p.advantages=p.advantages.includes(a) ? p.advantages.filter(x=>x!==a) : [...p.advantages,a];
    persist(); openDetail(id); return;
  }

  if(e.target.closest("[data-reject]")){
    p.status="rejected"; persist(); closeSheets(); render(); return;
  }

  if(e.target.closest("[data-edit]")){
    openEdit(id); return;
  }

  if(e.target.closest("[data-delete]")){
    if(!window.confirm(`確定要永久刪除「${p.name}」嗎？這個動作無法復原。`)) return;
    properties=properties.filter(x=>x.id!==id);
    persist(); closeSheets(); render(); return;
  }

  if(e.target.closest("[data-finish]")){
    if(p.status!=="candidate") p.status="seen";
    if(!p.mine){
      const vals=Object.values(p.ratings||{});
      const scoreMap={good:90,normal:72,bad:52};
      p.mine=vals.length ? Math.round(vals.reduce((a,v)=>a+(scoreMap[v]||0),0)/vals.length) : 75;
    }
    persist(); closeSheets(); render(); return;
  }
});


let selectedGoogleAddress = null;

HomeMaps.mountAutocomplete({
  mountId: "googleAddressMount",
  statusId: "locationStatus",
  onSelect: data => {
    selectedGoogleAddress = data;
    document.querySelector("#locationFallback").value = data.formattedAddress;
    document.querySelector("#selectedLat").value = data.lat;
    document.querySelector("#selectedLng").value = data.lng;
    document.querySelector("#selectedZone").value = data.nearest.zone;
    document.querySelector("#selectedNearestName").value = data.nearest.label;
    document.querySelector("#selectedNearestDistance").value = data.nearest.distanceMeters;

    document.querySelector("#nearestPreview").classList.remove("hidden");
    document.querySelector("#nearestPreviewTitle").textContent =
      `${data.nearest.zone}｜${data.nearest.label}`;
    document.querySelector("#nearestPreviewDistance").textContent =
      `直線距離約 ${HomeMaps.formatDistance(data.nearest.distanceMeters)}`;
    document.querySelector("#locationStatus").textContent =
      data.formattedAddress;
  }
});

let editAutocompleteMounted=false;
function mountEditAutocomplete(){
  if(editAutocompleteMounted) return;
  editAutocompleteMounted=true;
  HomeMaps.mountAutocomplete({
    mountId: "editGoogleAddressMount",
    statusId: "editLocationStatus",
    onSelect: data => {
      document.querySelector("#editLocation").value = data.formattedAddress;
      document.querySelector("#editLat").value = data.lat;
      document.querySelector("#editLng").value = data.lng;
      document.querySelector("#editZone").value = data.nearest.zone;
      document.querySelector("#editNearestName").value = data.nearest.label;
      document.querySelector("#editNearestDistance").value = data.nearest.distanceMeters;
      document.querySelector("#editForm").dataset.addressSelected="true";
      document.querySelector("#editNearestPreview").classList.remove("hidden");
      document.querySelector("#editNearestPreviewTitle").textContent = `${data.nearest.zone}｜${data.nearest.label}`;
      document.querySelector("#editNearestPreviewDistance").textContent = `直線距離約 ${HomeMaps.formatDistance(data.nearest.distanceMeters)}`;
      document.querySelector("#editLocationStatus").textContent = data.formattedAddress;
      document.querySelector("#editLocationStatus").classList.remove("maps-status-error");
    }
  });
}

function openEdit(id){
  const p=properties.find(x=>x.id===id); if(!p)return;
  mountEditAutocomplete();
  document.querySelector("#editId").value=p.id;
  document.querySelector("#editName").value=p.name||"";
  document.querySelector("#editPrice").value=p.price??"";
  document.querySelector("#editArea").value=p.area??"";
  document.querySelector("#editLocation").value=p.location||"";
  document.querySelector("#editLat").value=p.lat??"";
  document.querySelector("#editLng").value=p.lng??"";
  document.querySelector("#editZone").value=p.zone||"";
  document.querySelector("#editNearestName").value=p.nearestName||"";
  document.querySelector("#editNearestDistance").value=p.nearestDistance??"";
  document.querySelector("#editLayout").value=p.layout||"";
  document.querySelector("#editAge").value=p.age||"";
  document.querySelector("#editAgent").value=p.agent||"";
  document.querySelector("#editAgentContact").value=p.agentContact||"";
  document.querySelector("#editUrl").value=p.url||"";
  document.querySelector("#editForm").dataset.originalLocation=p.location||"";
  document.querySelector("#editForm").dataset.addressSelected="false";
  const hasNearest=p.nearestName&&p.nearestDistance;
  document.querySelector("#editNearestPreview").classList.toggle("hidden",!hasNearest);
  if(hasNearest){
    document.querySelector("#editNearestPreviewTitle").textContent=`${p.zone}｜${p.nearestName}`;
    document.querySelector("#editNearestPreviewDistance").textContent=`直線距離約 ${HomeMaps.formatDistance(Number(p.nearestDistance))}`;
  }
  document.querySelector("#editLocationStatus").textContent="地址不變可直接儲存；改地址時請從 Google 建議中選擇。";
  closeSheets(); showSheet("#editSheet");
}

document.querySelector("#editForm").addEventListener("submit",e=>{
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const p=properties.find(x=>x.id===Number(fd.get("id"))); if(!p)return;
  if(fd.get("location")!==e.currentTarget.dataset.originalLocation && e.currentTarget.dataset.addressSelected!=="true"){
    document.querySelector("#editLocationStatus").textContent="改地址後，請從上方 Google 建議中重新選擇地址。";
    document.querySelector("#editLocationStatus").classList.add("maps-status-error");
    return;
  }
  Object.assign(p,{
    name:fd.get("name"), price:Number(fd.get("price")), area:Number(fd.get("area")),
    location:fd.get("location"), lat:Number(fd.get("lat"))||null, lng:Number(fd.get("lng"))||null,
    zone:fd.get("zone")||p.zone||"", nearestName:fd.get("nearestName")||"",
    nearestDistance:Number(fd.get("nearestDistance"))||null, layout:fd.get("layout"), age:fd.get("age"),
    agent:fd.get("agent"), agentContact:fd.get("agentContact"), url:fd.get("url")
  });
  persist(); closeSheets(); render();
});

function openAdd(){ showSheet("#addSheet"); }
document.querySelector("#openAdd").addEventListener("click",openAdd);
document.querySelector("#fabAdd").addEventListener("click",openAdd);

document.querySelector("#addForm").addEventListener("submit",e=>{
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  if (!fd.get("location") || !fd.get("zone") || !fd.get("lat") || !fd.get("lng")) {
    document.querySelector("#locationStatus").textContent = "請先從 Google 建議清單選擇完整地址。";
    document.querySelector("#locationStatus").classList.add("maps-status-error");
    return;
  }
  const p={
    id:Date.now(),
    name:fd.get("name"),
    price:Number(fd.get("price")),
    area:Number(fd.get("area")),
    location:fd.get("location"),
    zone:fd.get("zone"),
    lat:Number(fd.get("lat")) || null,
    lng:Number(fd.get("lng")) || null,
    nearestName:fd.get("nearestName") || "",
    nearestDistance:Number(fd.get("nearestDistance")) || null,
    layout:fd.get("layout"),
    age:fd.get("age"),
    url:fd.get("url"),
    agent:fd.get("agent"),
    agentContact:fd.get("agentContact"),
    status:"saved",
    mine:null,
    partner:null,
    ratings:{},
    flaws:[],
    advantages:[]
  };
  properties.unshift(p);
  persist();
  e.currentTarget.reset();
  selectedGoogleAddress = null;
  document.querySelector("#nearestPreview").classList.add("hidden");
  document.querySelector("#locationStatus").textContent = "選擇 Google 建議地址後，會自動判斷最近據點。";
  document.querySelector("#locationStatus").classList.remove("maps-status-error");
  closeSheets();
  currentFilter="all";
  render();
});

document.querySelector(".bottom-nav").addEventListener("click",e=>{
  const nav=e.target.closest("[data-nav]")?.dataset.nav; if(!nav)return;
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.nav===nav));
  if(nav==="home"){ currentFilter="all"; currentView="cards"; }
  if(nav==="todo"){ currentFilter="todo"; currentView="cards"; }
  if(nav==="candidate"){ currentFilter="candidate"; currentView="cards"; }
  if(nav==="compare"){ currentView="table"; currentFilter="seen"; }

  document.querySelector("#cardView").classList.toggle("hidden",currentView!=="cards");
  document.querySelector("#tableView").classList.toggle("hidden",currentView!=="table");
  document.querySelectorAll(".seg").forEach(x=>x.classList.toggle("active",x.dataset.view===currentView));
  document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x.dataset.filter===currentFilter));
  renderCards();
  renderCompare();
});

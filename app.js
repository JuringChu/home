
const initialProperties = [
  {id:1,name:"竹北高鐵兩房",price:2380,area:26.8,location:"新竹縣竹北市",zone:"竹北",nearestName:"竹北高鐵",nearestDistance:2100,lat:24.806,lng:121.039,layout:"2房2廳1衛",age:"9 年",status:"candidate",builder:"",agent:"永慶房屋 王先生",agentContact:"0912-345-678",score:86,ratings:{light:"good",air:"good",noise:"normal",layout:"good",traffic:"good"},flaws:["浴室沒窗"],advantages:["離車站近","離園區近"],notes:""},
  {id:2,name:"新莊站三房",price:2688,area:32.1,location:"新竹市東區",zone:"新莊",nearestName:"新莊車站",nearestDistance:900,lat:24.787,lng:121.017,layout:"3房2廳2衛",age:"6 年",status:"seen",builder:"",agent:"信義房屋 林小姐",agentContact:"LINE: linhouse",score:85,ratings:{light:"good",air:"good",noise:"good",layout:"normal",traffic:"good"},flaws:["戶數超過300"],advantages:["離車站近","附近熱鬧"],notes:""},
  {id:3,name:"好市多生活圈小宅",price:2180,area:21.6,location:"新竹市東區",zone:"好市多",nearestName:"新竹好市多",nearestDistance:1300,lat:24.797,lng:120.995,layout:"2房1廳1衛",age:"18 年",status:"todo",builder:"",agent:"住商不動產 陳先生",agentContact:"0988-111-222",score:null,ratings:{},flaws:[],advantages:["附近熱鬧"],notes:""},
  {id:4,name:"新竹站景觀宅",price:2880,area:30.2,location:"新竹市東區",zone:"新竹",nearestName:"新竹車站",nearestDistance:700,lat:24.802,lng:120.971,layout:"2+1房2廳2衛",age:"12 年",status:"todo",builder:"",agent:"台灣房屋 李小姐",agentContact:"0977-888-666",score:null,ratings:{},flaws:[],advantages:["離車站近"],notes:""}
];

const saved = JSON.parse(localStorage.getItem("homebuying-properties-v2") || "null");
let properties = migrateProperties(saved || initialProperties);
let currentFilter = "all";
let currentArea = "all";
let currentView = "cards";
let compareAId = null;
let compareBId = null;

const statusMap = {saved:"收藏",discuss:"待討論",todo:"待看",seen:"已看",candidate:"候選",rejected:"淘汰"};
const ratingText = {good:"好",normal:"普通",bad:"差"};
const ratingLabels = {light:"採光",air:"通風",noise:"隔音",layout:"格局",traffic:"交通"};
const flaws = ["西曬","壁癌","漏水","水壓不足","浴室沒窗","暗房","噪音","垃圾處理麻煩","樓下餐廳","老舊電梯","管理室沒有24小時","戶數超過300","戶數小於50"];
const advantages = ["離車站近","附近熱鬧","有充電樁","廁所有窗","離園區近"];

function migrateProperties(list){
  return (list || []).map(p=>{
    if(p.score == null){
      const nums=[p.mine,p.partner].filter(v=>Number.isFinite(Number(v))).map(Number);
      p.score = nums.length ? Math.round(nums.reduce((a,b)=>a+b,0)/nums.length) : null;
    }
    p.builder ??= "";
    p.notes ??= "";
    p.ratings ??= {};
    p.flaws ??= [];
    p.advantages ??= [];
    return p;
  });
}
function persist(){
  // 訪客模式只改目前頁面的假資料，不碰真實 localStorage / Supabase。
  if(window.HomeSync?.isGuest?.()){
    window.HomeSync.save(properties);
    return;
  }
  localStorage.setItem("homebuying-properties-v2", JSON.stringify(properties));
  window.HomeSync?.save(properties);
}
function fmtPrice(n){ return Number(n || 0).toLocaleString("zh-TW"); }
function floorText(p){ return p.floor ? `${p.floor} / ${p.totalFloors || "?"} 樓` : "樓層未填"; }
function safe(v){ return (v===null || v===undefined || v==="") ? "—" : v; }

function renderCounts(){
  document.querySelector("#countAll").textContent = properties.filter(p=>p.status!=="rejected").length;
  document.querySelector("#countSaved").textContent = properties.filter(p=>p.status==="saved").length;
  document.querySelector("#countTodo").textContent = properties.filter(p=>p.status==="todo").length;
  document.querySelector("#countSeen").textContent = properties.filter(p=>p.status==="seen" || p.status==="candidate").length;
}
function visibleProps(){
  let arr = properties.filter(p=>p.status!=="rejected");
  if(currentFilter==="saved") arr=arr.filter(p=>p.status==="saved");
  if(currentFilter==="todo") arr=arr.filter(p=>p.status==="todo");
  if(currentFilter==="seen") arr=arr.filter(p=>p.status==="seen" || p.status==="candidate");
  if(currentFilter==="candidate") arr=arr.filter(p=>p.status==="candidate");
  if(currentArea!=="all") arr=arr.filter(p=>p.zone===currentArea);
  return arr;
}

function renderCards(){
  const list=document.querySelector("#cardView");
  const items=visibleProps();
  if(!items.length){
    list.innerHTML=`<div class="empty">這個條件目前沒有房屋。</div>`;
    return;
  }
  list.innerHTML=items.map(p=>`
    <article class="property-card" data-id="${p.id}">
      <div class="card-body">
        <div class="topline">
          <span class="status-chip">${statusMap[p.status] || "未分類"}</span>
          <span class="zone-chip">${p.zone || "未分類"}</span>
        </div>
        <div class="card-title-row">
          <div>
            <h4>${p.name}</h4>
            <p class="meta">${p.location || "地址未填"}<br>${p.area || "—"} 坪 · ${p.layout || "格局未填"} · ${floorText(p)} · 屋齡 ${p.age || "未填"}${p.nearestName ? `<br>最近：${p.nearestName} · ${HomeMaps.formatDistance(Number(p.nearestDistance))}` : ""}</p>
          </div>
          <div class="price">${fmtPrice(p.price)}<small> 萬</small></div>
        </div>
        ${p.builder ? `<div class="builder-line">建商｜${p.builder}</div>` : ""}
        ${(p.agent || p.agentContact) ? `<div class="agent-line">房仲｜${p.agent || "未填"}${p.agentContact ? ` · ${p.agentContact}` : ""}</div>` : ""}
        <div class="score-row">
          <div class="single-score"><span>評分</span><span class="score-badge">${p.score ?? "—"}</span></div>
          <div class="card-actions">
            ${p.status==="saved" ? `<button class="mini-btn" data-action="todo">加入待看</button>` : ""}
            ${p.status==="todo" ? `<button class="mini-btn primary" data-action="seen">開始看房</button>` : ""}
            <button class="mini-btn" data-action="detail">查看</button>
          </div>
        </div>
      </div>
    </article>`).join("");
}

function compareCandidates(){
  return properties.filter(p=>p.status!=="rejected");
}
function ensureCompareSelection(){
  const arr=compareCandidates();
  if(!arr.length){ compareAId=compareBId=null; return; }
  if(!arr.some(p=>String(p.id)===String(compareAId))) compareAId=arr[0]?.id ?? null;
  if(!arr.some(p=>String(p.id)===String(compareBId)) || String(compareBId)===String(compareAId)){
    compareBId=arr.find(p=>String(p.id)!==String(compareAId))?.id ?? arr[0]?.id ?? null;
  }
}
function renderCompareSelectors(){
  ensureCompareSelection();
  const arr=compareCandidates();
  const a=document.querySelector("#compareA"), b=document.querySelector("#compareB");
  if(!a || !b) return;
  const opts=arr.map(p=>`<option value="${p.id}">${p.name}</option>`).join("");
  a.innerHTML=opts;b.innerHTML=opts;
  if(compareAId!=null) a.value=String(compareAId);
  if(compareBId!=null) b.value=String(compareBId);
}
function rateCell(r){ return r ? `<span class="${r}">${ratingText[r]}</span>` : "—"; }
function renderCompare(){
  renderCompareSelectors();
  const table=document.querySelector("#compareTable");
  const a=properties.find(p=>String(p.id)===String(compareAId));
  const b=properties.find(p=>String(p.id)===String(compareBId));
  if(!a || !b){
    table.innerHTML=`<div class="empty">至少需要兩間房屋才能比較。</div>`;
    return;
  }
  const rows=[
    ["狀態",statusMap[a.status]||"—",statusMap[b.status]||"—"],
    ["區域",safe(a.zone),safe(b.zone)],
    ["總價",`${fmtPrice(a.price)} 萬`,`${fmtPrice(b.price)} 萬`],
    ["坪數",`${safe(a.area)} 坪`,`${safe(b.area)} 坪`],
    ["格局",safe(a.layout),safe(b.layout)],
    ["樓層",floorText(a),floorText(b)],
    ["屋齡",safe(a.age),safe(b.age)],
    ["建商",safe(a.builder),safe(b.builder)],
    ["最近據點",a.nearestName ? `${a.nearestName} ${HomeMaps.formatDistance(Number(a.nearestDistance))}`:"—",b.nearestName ? `${b.nearestName} ${HomeMaps.formatDistance(Number(b.nearestDistance))}`:"—"],
    ["評分",a.score ?? "—",b.score ?? "—"],
    ["採光",rateCell(a.ratings?.light),rateCell(b.ratings?.light)],
    ["通風",rateCell(a.ratings?.air),rateCell(b.ratings?.air)],
    ["隔音",rateCell(a.ratings?.noise),rateCell(b.ratings?.noise)],
    ["交通",rateCell(a.ratings?.traffic),rateCell(b.ratings?.traffic)],
    ["特殊優點",a.advantages?.length?a.advantages.join("、"):"無",b.advantages?.length?b.advantages.join("、"):"無"],
    ["硬傷",a.flaws?.length?a.flaws.join("、"):"無",b.flaws?.length?b.flaws.join("、"):"無"],
    ["備註",safe(a.notes),safe(b.notes)]
  ];
  table.innerHTML=`
    <div class="compare-names">
      <div class="compare-label">項目</div>
      <div>${a.name}</div>
      <div>${b.name}</div>
    </div>
    ${rows.map(([label,av,bv])=>`
      <div class="compare-row">
        <div class="compare-cell compare-label">${label}</div>
        <div class="compare-cell">${av}</div>
        <div class="compare-cell">${bv}</div>
      </div>`).join("")}
  `;
}
function render(){
  renderCounts();
  renderCards();
  renderCompare();
}
render();

document.querySelector("#compareA").addEventListener("change",e=>{
  compareAId=e.target.value;
  if(String(compareAId)===String(compareBId)){
    const other=compareCandidates().find(p=>String(p.id)!==String(compareAId));
    if(other) compareBId=other.id;
  }
  renderCompare();
});
document.querySelector("#compareB").addEventListener("change",e=>{
  compareBId=e.target.value;
  if(String(compareBId)===String(compareAId)){
    const other=compareCandidates().find(p=>String(p.id)!==String(compareBId));
    if(other) compareAId=other.id;
  }
  renderCompare();
});

document.querySelector("#progressGrid").addEventListener("click",e=>{
  const btn=e.target.closest("[data-filter]"); if(!btn)return;
  currentFilter=btn.dataset.filter;
  document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===btn));
  renderCards();
});
document.querySelector("#areaFilter").addEventListener("click",e=>{
  const btn=e.target.closest("[data-area]"); if(!btn)return;
  currentArea=btn.dataset.area;
  document.querySelectorAll("[data-area]").forEach(x=>x.classList.toggle("active",x===btn));
  renderCards();
});
document.querySelectorAll(".seg").forEach(btn=>btn.addEventListener("click",()=>{
  currentView=btn.dataset.view;
  document.querySelectorAll(".seg").forEach(x=>x.classList.toggle("active",x===btn));
  document.querySelector("#cardView").classList.toggle("hidden",currentView!=="cards");
  document.querySelector("#tableView").classList.toggle("hidden",currentView!=="table");
  if(currentView==="table") renderCompare();
}));

document.querySelector("#cardView").addEventListener("click",e=>{
  const card=e.target.closest(".property-card"); if(!card)return;
  const p=properties.find(x=>x.id===Number(card.dataset.id));
  const action=e.target.closest("[data-action]")?.dataset.action || "detail";
  if(action==="todo"){p.status="todo";persist();render();return}
  if(action==="seen"){p.status="seen";persist();render();openDetail(p.id,true);return}
  openDetail(p.id,false);
});

function openDetail(id,ratingMode=false){
  const p=properties.find(x=>x.id===id); if(!p)return;
  const ratingHtml=Object.entries(ratingLabels).map(([key,label])=>`
    <div class="rating-item">
      <span>${label}</span>
      <div class="rating-buttons" data-rating="${key}">
        ${["good","normal","bad"].map(v=>`<button data-value="${v}" class="${p.ratings?.[key]===v?"selected":""}">${ratingText[v]}</button>`).join("")}
      </div>
    </div>`).join("");

  document.querySelector("#detailContent").innerHTML=`
    <div class="sheet-head">
      <div><p class="eyebrow">${ratingMode?"VIEWING MODE":"PROPERTY DETAIL"}</p><h3>${p.name}</h3></div>
      <button class="icon-btn small" data-close>×</button>
    </div>
    <div class="detail-summary">
      <div class="big-price">${fmtPrice(p.price)} 萬</div>
      <div class="muted">
        ${p.location || "地址未填"} · ${p.area || "—"} 坪 · ${p.layout || "格局未填"} · ${floorText(p)} · 屋齡 ${p.age || "未填"}
        ${p.builder?`<br>建商：${p.builder}`:""}
        ${p.agent?`<br>房仲：${p.agent}`:""}${p.agentContact?` · ${p.agentContact}`:""}
      </div>
      ${p.nearestName?`<div class="location-block"><div class="location-label">最近據點</div><div class="location-main"><strong>${p.nearestName} · ${HomeMaps.formatDistance(Number(p.nearestDistance))}</strong>${p.lat&&p.lng?`<a class="maps-link" href="${HomeMaps.mapsUrl(p)}" target="_blank" rel="noopener">Google Maps ↗</a>`:""}</div></div>`:""}
      ${p.notes?`<div class="detail-notes"><strong>備註</strong><p>${p.notes}</p></div>`:""}
    </div>

    <div class="quick-actions">
      <button data-set-status="saved">收藏</button>
      <button data-set-status="todo">待看</button>
      <button data-set-status="candidate">候選</button>
    </div>

    <div class="rating-group">
      <h4>共同評分</h4>
      <div class="overall-score-wrap">
        <label for="overallScore">整體分數（0–100）</label>
        <input id="overallScore" type="number" min="0" max="100" value="${p.score ?? ""}" placeholder="例如 85" />
      </div>
    </div>

    <div class="rating-group"><h4>現場快速評價</h4>${ratingHtml}</div>

    <div class="rating-group">
      <h4>特殊優點</h4>
      <div class="advantage-grid">${advantages.map(a=>`<button class="advantage-chip ${p.advantages?.includes(a)?"selected":""}" data-advantage="${a}">${a}</button>`).join("")}</div>
    </div>

    <div class="rating-group">
      <h4>硬傷紀錄</h4>
      <div class="flaw-grid">${flaws.map(f=>`<button class="flaw-chip ${p.flaws?.includes(f)?"selected":""}" data-flaw="${f}">${f}</button>`).join("")}</div>
    </div>

    <div class="sheet-footer-actions">
      <button class="secondary-btn" data-edit>編輯資料</button>
      <button class="danger-btn" data-delete>永久刪除</button>
      <button class="secondary-btn" data-reject>暫時隱藏</button>
      <button class="primary-btn" data-finish>完成看房紀錄</button>
    </div>`;
  document.querySelector("#detailSheet").dataset.id=id;
  showSheet("#detailSheet");
}

function showSheet(sel){
  document.querySelector("#sheetBackdrop").classList.remove("hidden");
  document.querySelector(sel).classList.remove("hidden");
  document.body.style.overflow="hidden";
}
function closeSheets(){
  document.querySelector("#sheetBackdrop").classList.add("hidden");
  document.querySelectorAll(".bottom-sheet").forEach(x=>x.classList.add("hidden"));
  document.body.style.overflow="";
}
document.querySelector("#sheetBackdrop").addEventListener("click",closeSheets);
document.addEventListener("click",e=>{if(e.target.closest("[data-close]"))closeSheets()});

document.querySelector("#detailSheet").addEventListener("input",e=>{
  if(e.target.id==="overallScore"){
    const id=Number(e.currentTarget.dataset.id);
    const p=properties.find(x=>x.id===id); if(!p)return;
    const value=e.target.value===""?null:Math.max(0,Math.min(100,Number(e.target.value)));
    p.score=value;
    persist();
  }
});
document.querySelector("#detailSheet").addEventListener("click",e=>{
  const id=Number(e.currentTarget.dataset.id);
  const p=properties.find(x=>x.id===id); if(!p)return;

  const status=e.target.closest("[data-set-status]")?.dataset.setStatus;
  if(status){p.status=status;persist();render();openDetail(id);return}

  const rbtn=e.target.closest("[data-rating] button");
  if(rbtn){
    const key=rbtn.parentElement.dataset.rating;
    p.ratings=p.ratings||{};
    p.ratings[key]=rbtn.dataset.value;
    persist();openDetail(id);return;
  }
  const flawBtn=e.target.closest("[data-flaw]");
  if(flawBtn){
    p.flaws=p.flaws||[];
    const f=flawBtn.dataset.flaw;
    p.flaws=p.flaws.includes(f)?p.flaws.filter(x=>x!==f):[...p.flaws,f];
    persist();openDetail(id);return;
  }
  const advBtn=e.target.closest("[data-advantage]");
  if(advBtn){
    p.advantages=p.advantages||[];
    const a=advBtn.dataset.advantage;
    p.advantages=p.advantages.includes(a)?p.advantages.filter(x=>x!==a):[...p.advantages,a];
    persist();openDetail(id);return;
  }
  if(e.target.closest("[data-reject]")){p.status="rejected";persist();closeSheets();render();return}
  if(e.target.closest("[data-edit]")){openEdit(id);return}
  if(e.target.closest("[data-delete]")){
    if(!window.confirm(`確定要永久刪除「${p.name}」嗎？這個動作無法復原。`))return;
    properties=properties.filter(x=>x.id!==id);persist();closeSheets();render();return;
  }
  if(e.target.closest("[data-finish]")){
    if(p.status!=="candidate")p.status="seen";
    if(p.score==null){
      const vals=Object.values(p.ratings||{});
      const scoreMap={good:90,normal:72,bad:52};
      p.score=vals.length?Math.round(vals.reduce((a,v)=>a+(scoreMap[v]||0),0)/vals.length):75;
    }
    persist();closeSheets();render();return;
  }
});

let selectedGoogleAddress=null;
HomeMaps.mountAutocomplete({
  mountId:"googleAddressMount",
  statusId:"locationStatus",
  onSelect:data=>{
    selectedGoogleAddress=data;
    document.querySelector("#locationFallback").value=data.formattedAddress;
    document.querySelector("#selectedLat").value=data.lat;
    document.querySelector("#selectedLng").value=data.lng;
    document.querySelector("#selectedZone").value=data.nearest.zone;
    document.querySelector("#selectedNearestName").value=data.nearest.label;
    document.querySelector("#selectedNearestDistance").value=data.nearest.distanceMeters;
    document.querySelector("#nearestPreview").classList.remove("hidden");
    document.querySelector("#nearestPreviewTitle").textContent=`${data.nearest.zone}｜${data.nearest.label}`;
    document.querySelector("#nearestPreviewDistance").textContent=`直線距離約 ${HomeMaps.formatDistance(data.nearest.distanceMeters)}`;
    document.querySelector("#locationStatus").textContent=data.formattedAddress;
  }
});

let editAutocompleteMounted=false;
function mountEditAutocomplete(){
  if(editAutocompleteMounted)return;
  editAutocompleteMounted=true;
  HomeMaps.mountAutocomplete({
    mountId:"editGoogleAddressMount",
    statusId:"editLocationStatus",
    onSelect:data=>{
      document.querySelector("#editLocation").value=data.formattedAddress;
      document.querySelector("#editLat").value=data.lat;
      document.querySelector("#editLng").value=data.lng;
      document.querySelector("#editZone").value=data.nearest.zone;
      document.querySelector("#editNearestName").value=data.nearest.label;
      document.querySelector("#editNearestDistance").value=data.nearest.distanceMeters;
      document.querySelector("#editForm").dataset.addressSelected="true";
      document.querySelector("#editNearestPreview").classList.remove("hidden");
      document.querySelector("#editNearestPreviewTitle").textContent=`${data.nearest.zone}｜${data.nearest.label}`;
      document.querySelector("#editNearestPreviewDistance").textContent=`直線距離約 ${HomeMaps.formatDistance(data.nearest.distanceMeters)}`;
      document.querySelector("#editLocationStatus").textContent=data.formattedAddress;
      document.querySelector("#editLocationStatus").classList.remove("maps-status-error");
    }
  });
}
function openEdit(id){
  const p=properties.find(x=>x.id===id);if(!p)return;
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
  document.querySelector("#editFloor").value=p.floor??"";
  document.querySelector("#editTotalFloors").value=p.totalFloors??"";
  document.querySelector("#editBuilder").value=p.builder||"";
  document.querySelector("#editAgent").value=p.agent||"";
  document.querySelector("#editAgentContact").value=p.agentContact||"";
  document.querySelector("#editUrl").value=p.url||"";
  document.querySelector("#editNotes").value=p.notes||"";
  document.querySelector("#editForm").dataset.originalLocation=p.location||"";
  document.querySelector("#editForm").dataset.addressSelected="false";
  const hasNearest=p.nearestName&&p.nearestDistance;
  document.querySelector("#editNearestPreview").classList.toggle("hidden",!hasNearest);
  if(hasNearest){
    document.querySelector("#editNearestPreviewTitle").textContent=`${p.zone}｜${p.nearestName}`;
    document.querySelector("#editNearestPreviewDistance").textContent=`直線距離約 ${HomeMaps.formatDistance(Number(p.nearestDistance))}`;
  }
  document.querySelector("#editLocationStatus").textContent="地址不變可直接儲存；改地址時請從 Google 建議中選擇。";
  closeSheets();showSheet("#editSheet");
}

document.querySelector("#editForm").addEventListener("submit",e=>{
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  const p=properties.find(x=>x.id===Number(fd.get("id")));if(!p)return;
  if(fd.get("location")!==e.currentTarget.dataset.originalLocation && e.currentTarget.dataset.addressSelected!=="true"){
    document.querySelector("#editLocationStatus").textContent="改地址後，請從上方 Google 建議中重新選擇地址。";
    document.querySelector("#editLocationStatus").classList.add("maps-status-error");
    return;
  }
  Object.assign(p,{
    name:fd.get("name"),price:Number(fd.get("price")),area:Number(fd.get("area")),
    location:fd.get("location"),lat:Number(fd.get("lat"))||null,lng:Number(fd.get("lng"))||null,
    zone:fd.get("zone")||p.zone||"",nearestName:fd.get("nearestName")||"",
    nearestDistance:Number(fd.get("nearestDistance"))||null,layout:fd.get("layout"),age:fd.get("age"),
    floor:Number(fd.get("floor"))||null,totalFloors:Number(fd.get("totalFloors"))||null,
    builder:fd.get("builder"),agent:fd.get("agent"),agentContact:fd.get("agentContact"),
    url:fd.get("url"),notes:fd.get("notes")
  });
  persist();closeSheets();render();
});

function openAdd(){showSheet("#addSheet")}
document.querySelector("#openAdd").addEventListener("click",openAdd);
document.querySelector("#fabAdd").addEventListener("click",openAdd);

document.querySelector("#addForm").addEventListener("submit",e=>{
  e.preventDefault();
  const fd=new FormData(e.currentTarget);
  if(!fd.get("location")||!fd.get("zone")||!fd.get("lat")||!fd.get("lng")){
    document.querySelector("#locationStatus").textContent="請先從 Google 建議清單選擇完整地址。";
    document.querySelector("#locationStatus").classList.add("maps-status-error");
    return;
  }
  const p={
    id:Date.now(),
    name:fd.get("name"),price:Number(fd.get("price")),area:Number(fd.get("area")),
    location:fd.get("location"),zone:fd.get("zone"),lat:Number(fd.get("lat"))||null,lng:Number(fd.get("lng"))||null,
    nearestName:fd.get("nearestName")||"",nearestDistance:Number(fd.get("nearestDistance"))||null,
    layout:fd.get("layout"),age:fd.get("age"),floor:Number(fd.get("floor"))||null,totalFloors:Number(fd.get("totalFloors"))||null,
    builder:fd.get("builder"),agent:fd.get("agent"),agentContact:fd.get("agentContact"),url:fd.get("url"),notes:fd.get("notes"),
    status:"saved",score:null,ratings:{},flaws:[],advantages:[]
  };
  properties.unshift(p);
  persist();
  e.currentTarget.reset();
  selectedGoogleAddress=null;
  document.querySelector("#nearestPreview").classList.add("hidden");
  document.querySelector("#locationStatus").textContent="選擇 Google 建議地址後，會自動判斷最近據點。";
  document.querySelector("#locationStatus").classList.remove("maps-status-error");
  closeSheets();
  currentFilter="all";
  render();
});

document.querySelector(".bottom-nav").addEventListener("click",e=>{
  const nav=e.target.closest("[data-nav]")?.dataset.nav;if(!nav)return;
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.nav===nav));
  if(nav==="home"){currentFilter="all";currentView="cards"}
  if(nav==="todo"){currentFilter="todo";currentView="cards"}
  if(nav==="candidate"){currentFilter="candidate";currentView="cards"}
  if(nav==="compare"){currentView="table"}
  document.querySelector("#cardView").classList.toggle("hidden",currentView!=="cards");
  document.querySelector("#tableView").classList.toggle("hidden",currentView!=="table");
  document.querySelectorAll(".seg").forEach(x=>x.classList.toggle("active",x.dataset.view===currentView));
  document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x.dataset.filter===currentFilter));
  renderCards();
  if(currentView==="table")renderCompare();
});

window.HomeSync?.start(properties,remote=>{
  properties=migrateProperties(remote);
  // 訪客資料只存在記憶體，不覆蓋已存在的真實資料。
  if(!window.HomeSync?.isGuest?.()){
    localStorage.setItem("homebuying-properties-v2",JSON.stringify(properties));
  }
  render();
});

window.HomeSync=(()=>{
  const c=window.HOME_SYNC_CONFIG;
  const sessionKey="homebuying-supabase-session", householdKey="homebuying-household-id";

  let token="",householdId="",ready=false,guestMode=false;
  let guestProperties=[];

  const headers=()=>({
    apikey:c.publishableKey,
    Authorization:`Bearer ${token}`,
    "Content-Type":"application/json"
  });

  const friendlyError=e=>{
    try{
      const x=JSON.parse(e.message);
      return x.message||x.msg||x.hint||e.message;
    }catch{
      return e.message||"不明原因";
    }
  };

  async function request(path,opts={}){
    const r=await fetch(c.url+path,{
      ...opts,
      headers:{...headers(),...(opts.headers||{})}
    });
    const raw=await r.text();
    let data=null;
    try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
    if(!r.ok){
      throw new Error(
        typeof data==="string"
          ? data
          : (data?.message||data?.msg||data?.hint||raw)
      );
    }
    return data;
  }

  async function signIn(){
    let saved=null;
    try{saved=JSON.parse(localStorage.getItem(sessionKey)||"null");}catch{}

    if(saved?.access_token){
      token=saved.access_token;
      const expires=JSON.parse(atob(token.split(".")[1])).exp*1000;
      if(expires>Date.now()+60000)return;

      if(saved.refresh_token){
        const r=await fetch(
          c.url+"/auth/v1/token?grant_type=refresh_token",
          {
            method:"POST",
            headers:{apikey:c.publishableKey,"Content-Type":"application/json"},
            body:JSON.stringify({refresh_token:saved.refresh_token})
          }
        );
        const next=await r.json();
        if(r.ok&&next.access_token){
          token=next.access_token;
          localStorage.setItem(sessionKey,JSON.stringify(next));
          return;
        }
      }
    }

    const r=await fetch(
      c.url+"/auth/v1/signup",
      {
        method:"POST",
        headers:{apikey:c.publishableKey,"Content-Type":"application/json"},
        body:"{}"
      }
    );
    const data=await r.json();
    if(!r.ok||!data.access_token){
      throw new Error(data?.message||data?.msg||"無法建立這台裝置的登入狀態");
    }
    token=data.access_token;
    localStorage.setItem(sessionKey,JSON.stringify(data));
  }

  async function push(properties){
    await request(
      "/rest/v1/buying_household_state?on_conflict=household_id",
      {
        method:"POST",
        headers:{Prefer:"resolution=merge-duplicates"},
        body:JSON.stringify({household_id:householdId,properties})
      }
    );
  }

  function buildGuestProperties(){
    return [
      {
        id:"guest-1",
        name:"Demo｜高鐵森活兩房",
        price:2388,
        area:27.6,
        location:"新竹縣竹北市高鐵生活圈",
        zone:"竹北",
        nearestName:"竹北高鐵",
        nearestDistance:950,
        layout:"2房2廳1衛",
        age:"4 年",
        floor:12,
        totalFloors:22,
        status:"candidate",
        builder:"森築建設",
        agent:"Demo 房仲 林小姐",
        agentContact:"0912-000-001",
        score:89,
        ratings:{light:"good",air:"good",noise:"normal",layout:"good",traffic:"good"},
        flaws:[],
        advantages:["離車站近","有充電樁","離園區近"],
        notes:"Demo 資料：午後採光佳，社區公設維護不錯。"
      },
      {
        id:"guest-2",
        name:"Demo｜新莊靜巷三房",
        price:2680,
        area:34.2,
        location:"新竹市東區新莊生活圈",
        zone:"新莊",
        nearestName:"新莊車站",
        nearestDistance:620,
        layout:"3房2廳2衛",
        age:"7 年",
        floor:8,
        totalFloors:15,
        status:"seen",
        builder:"禾居建築",
        agent:"Demo 房仲 王先生",
        agentContact:"03-500-0002",
        score:84,
        ratings:{light:"good",air:"normal",noise:"good",layout:"good",traffic:"good"},
        flaws:["管理室沒有24小時"],
        advantages:["離車站近","附近熱鬧","離園區近"],
        notes:"Demo 資料：格局方正，巷內安靜。"
      },
      {
        id:"guest-3",
        name:"Demo｜好市多景觀兩房",
        price:2198,
        area:24.8,
        location:"新竹市東區好市多生活圈",
        zone:"好市多",
        nearestName:"新竹好市多",
        nearestDistance:1100,
        layout:"2房2廳1衛",
        age:"11 年",
        floor:15,
        totalFloors:18,
        status:"todo",
        builder:"景禾開發",
        agent:"Demo 房仲 陳小姐",
        agentContact:"LINE: demo-house",
        score:null,
        ratings:{},
        flaws:["戶數超過300"],
        advantages:["附近熱鬧","有充電樁"],
        notes:"Demo 資料：待確認尖峰時段車流。"
      },
      {
        id:"guest-4",
        name:"Demo｜新竹站機能宅",
        price:1980,
        area:22.4,
        location:"新竹市東區車站生活圈",
        zone:"新竹",
        nearestName:"新竹車站",
        nearestDistance:480,
        layout:"2房1廳1衛",
        age:"16 年",
        floor:6,
        totalFloors:12,
        status:"saved",
        builder:"城市建設",
        agent:"Demo 房仲 張先生",
        agentContact:"0988-000-004",
        score:78,
        ratings:{light:"normal",air:"normal",noise:"bad",layout:"good",traffic:"good"},
        flaws:["噪音"],
        advantages:["離車站近","附近熱鬧"],
        notes:"Demo 資料：交通方便，但要再確認隔音。"
      },
      {
        id:"guest-5",
        name:"Demo｜竹北公園三房",
        price:2998,
        area:38.5,
        location:"新竹縣竹北市公園生活圈",
        zone:"竹北",
        nearestName:"竹北高鐵",
        nearestDistance:2400,
        layout:"3房2廳2衛",
        age:"2 年",
        floor:9,
        totalFloors:19,
        status:"saved",
        builder:"青境建設",
        agent:"Demo 房仲 黃小姐",
        agentContact:"0900-000-005",
        score:91,
        ratings:{light:"good",air:"good",noise:"good",layout:"good",traffic:"normal"},
        flaws:["戶數小於50"],
        advantages:["廁所有窗","有充電樁","離園區近"],
        notes:"Demo 資料：戶數少、環境安靜，管理費偏高。"
      }
    ];
  }

  function ensureLoginStyles(){
    if(document.getElementById("home-login-styles"))return;

    const style=document.createElement("style");
    style.id="home-login-styles";
    style.textContent=`
      .home-login-backdrop{
        position:fixed;
        inset:0;
        z-index:9999;
        display:grid;
        place-items:center;
        padding:20px;
        background:rgba(40,48,42,.26);
        backdrop-filter:blur(9px);
        -webkit-backdrop-filter:blur(9px);
      }
      .home-login-card{
        width:min(100%,360px);
        padding:24px 22px 20px;
        border:1px solid rgba(255,255,255,.84);
        border-radius:16px;
        background:
          linear-gradient(145deg,rgba(255,255,252,.97),rgba(245,243,236,.95));
        box-shadow:0 24px 70px rgba(44,54,46,.2);
        color:#28302c;
      }
      .home-login-eyebrow{
        margin:0 0 7px;
        color:#839087;
        font-size:9px;
        font-weight:800;
        letter-spacing:.18em;
      }
      .home-login-title{
        margin:0 0 20px;
        font-size:22px;
        font-weight:760;
        letter-spacing:-.035em;
      }
      .home-login-input{
        display:block;
        width:100%;
        min-width:0;
        height:48px;
        padding:0 13px;
        border:1px solid rgba(73,88,76,.18);
        border-radius:9px;
        outline:none;
        background:rgba(255,255,252,.9);
        color:#28302c;
        font:inherit;
        font-size:16px;
        letter-spacing:.06em;
        box-sizing:border-box;
      }
      .home-login-input:focus{
        border-color:#8aa08e;
        box-shadow:0 0 0 3px rgba(138,160,142,.17);
      }
      .home-login-error{
        min-height:19px;
        margin:7px 0 4px;
        color:#a05b55;
        font-size:11px;
        line-height:1.4;
      }
      .home-login-actions{
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-top:8px;
      }
      .home-login-guest{
        border:0;
        padding:10px 5px;
        background:transparent;
        color:#68736b;
        font:inherit;
        font-size:13px;
        font-weight:700;
      }
      .home-login-confirm{
        min-width:92px;
        border:1px solid #385040;
        border-radius:8px;
        padding:11px 18px;
        background:linear-gradient(135deg,#4d6856,#385040);
        color:white;
        font:inherit;
        font-size:13px;
        font-weight:850;
        box-shadow:0 8px 16px rgba(55,80,62,.16);
      }
      .home-login-confirm:disabled{
        opacity:.55;
        cursor:default;
      }
      .home-login-note{
        margin:14px 0 0;
        color:#8a918b;
        font-size:10px;
        line-height:1.5;
      }
    `;
    document.head.appendChild(style);
  }

  function askForAccess(){
    ensureLoginStyles();

    return new Promise(resolve=>{
      const overlay=document.createElement("div");
      overlay.className="home-login-backdrop";
      overlay.innerHTML=`
        <div class="home-login-card" role="dialog" aria-modal="true" aria-labelledby="home-login-title">
          <p class="home-login-eyebrow">OUR HOME</p>
          <h2 class="home-login-title" id="home-login-title">請輸入密碼</h2>

          <input
            class="home-login-input"
            id="home-login-password"
            type="password"
            inputmode="numeric"
            autocomplete="off"
            aria-label="共用清單密碼"
          />

          <div class="home-login-error" id="home-login-error"></div>

          <div class="home-login-actions">
            <button type="button" class="home-login-guest" id="home-login-guest">訪客</button>
            <button type="button" class="home-login-confirm" id="home-login-confirm">確定</button>
          </div>

          <p class="home-login-note">訪客模式使用示範資料，不會讀取或修改共用清單。</p>
        </div>
      `;
      document.body.appendChild(overlay);

      const input=overlay.querySelector("#home-login-password");
      const error=overlay.querySelector("#home-login-error");
      const confirmBtn=overlay.querySelector("#home-login-confirm");
      const guestBtn=overlay.querySelector("#home-login-guest");

      let working=false;

      async function confirmPassword(){
        const code=input.value.trim();

        if(!code){
          error.textContent="請輸入密碼";
          input.focus();
          return;
        }
        if(working)return;

        working=true;
        confirmBtn.disabled=true;
        confirmBtn.textContent="連線中…";
        error.textContent="";

        try{
          const id=await request(
            "/rest/v1/rpc/join_buying_household",
            {
              method:"POST",
              body:JSON.stringify({p_invite_code:code})
            }
          );

          if(!id)throw new Error("密碼不正確");

          householdId=id;
          localStorage.setItem(householdKey,householdId);

          overlay.remove();
          resolve({mode:"shared"});
        }catch(e){
          error.textContent="密碼不正確，請再試一次";
          input.select();
          working=false;
          confirmBtn.disabled=false;
          confirmBtn.textContent="確定";
        }
      }

      confirmBtn.addEventListener("click",confirmPassword);
      input.addEventListener("keydown",e=>{
        if(e.key==="Enter"){
          e.preventDefault();
          confirmPassword();
        }
      });

      guestBtn.addEventListener("click",()=>{
        guestMode=true;
        guestProperties=buildGuestProperties();
        overlay.remove();
        resolve({mode:"guest"});
      });

      setTimeout(()=>input.focus(),80);
    });
  }

  async function start(initial,onRemote){
    try{
      // 保留原本已連線裝置的 householdId，不會重建、覆蓋或推送 initial。
      await signIn();
      householdId=localStorage.getItem(householdKey)||"";

      if(!householdId){
        const choice=await askForAccess();

        if(choice.mode==="guest"){
          ready=true;
          onRemote(structuredClone(guestProperties));
          return;
        }
      }

      const remote=await pull();

      // 只讀既有 Supabase 共用資料。這裡不建立新清單、不覆蓋資料。
      if(remote!==null)onRemote(remote);

      ready=true;

      setInterval(async()=>{
        if(guestMode)return;
        try{
          const next=await pull();
          if(next!==null)onRemote(next);
        }catch(e){
          console.warn("同步讀取失敗",e);
        }
      },8000);

    }catch(e){
      console.warn("同步尚未啟用",e);
      alert("共用清單尚未設定完成。\n\n"+friendlyError(e));
    }
  }

  async function pull(){
    if(guestMode)return structuredClone(guestProperties);
    if(!householdId)return null;

    const rows=await request(
      `/rest/v1/buying_household_state?household_id=eq.${householdId}&select=properties`
    );
    return rows[0]?.properties??null;
  }

  async function save(properties){
    if(guestMode){
      // 訪客可操作畫面，但資料只存在這個分頁記憶體。
      guestProperties=structuredClone(properties);
      return;
    }

    if(!ready||!householdId)return;

    try{
      await push(properties);
    }catch(e){
      console.warn("同步儲存失敗",e);
    }
  }

  function isGuest(){
    return guestMode;
  }

  return {start,save,isGuest};
})();
window.HomeSync=(()=>{
  const c=window.HOME_SYNC_CONFIG;
  const sessionKey="homebuying-supabase-session", householdKey="homebuying-household-id";
  let token="",householdId="",ready=false;
  const headers=()=>({apikey:c.publishableKey,Authorization:`Bearer ${token}`,"Content-Type":"application/json"});
  const friendlyError=e=>{
    try{const x=JSON.parse(e.message);return x.message||x.msg||x.hint||e.message;}catch{return e.message||"不明原因";}
  };
  async function request(path,opts={}){
    const r=await fetch(c.url+path,{...opts,headers:{...headers(),...(opts.headers||{})}});
    const raw=await r.text(); let data=null;
    try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
    if(!r.ok)throw new Error(typeof data==="string"?data:(data?.message||data?.msg||data?.hint||raw));
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
        const r=await fetch(c.url+"/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{apikey:c.publishableKey,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:saved.refresh_token})});
        const next=await r.json();
        if(r.ok&&next.access_token){token=next.access_token;localStorage.setItem(sessionKey,JSON.stringify(next));return;}
      }
    }
    const r=await fetch(c.url+"/auth/v1/signup",{method:"POST",headers:{apikey:c.publishableKey,"Content-Type":"application/json"},body:"{}"});
    const data=await r.json();
    if(!r.ok||!data.access_token)throw new Error(data?.message||data?.msg||"無法建立這台裝置的登入狀態");
    token=data.access_token;localStorage.setItem(sessionKey,JSON.stringify(data));
  }
  async function push(properties){
    await request("/rest/v1/buying_household_state?on_conflict=household_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates"},body:JSON.stringify({household_id:householdId,properties})});
  }
  async function start(initial,onRemote){
    try{
      await signIn(); householdId=localStorage.getItem(householdKey)||"";
      if(!householdId){
        const create=confirm("要建立新的共用買房清單嗎？\n確定：建立新清單\n取消：輸入另一台建立的共用碼加入");
        const code=prompt(create?"設定至少 8 碼的共用碼，請傳給 N：":"輸入 J 給你的共用碼：");
        if(!code)return;
        const fn=create?"create_buying_household":"join_buying_household";
        householdId=await request(`/rest/v1/rpc/${fn}`,{method:"POST",body:JSON.stringify({p_invite_code:code})});
        if(!householdId)throw new Error("共用清單沒有成功建立，請再試一次");
        localStorage.setItem(householdKey,householdId);
        if(create)await push(initial);
      }
      const remote=await pull(); if(remote!==null)onRemote(remote); ready=true;
      setInterval(async()=>{try{const next=await pull();if(next!==null)onRemote(next);}catch(e){console.warn("同步讀取失敗",e);}},8000);
    }catch(e){
      console.warn("同步尚未啟用",e);
      alert("共用清單尚未設定完成。\n\n"+friendlyError(e));
    }
  }
  async function pull(){if(!householdId)return null;const rows=await request(`/rest/v1/buying_household_state?household_id=eq.${householdId}&select=properties`);return rows[0]?.properties??null;}
  async function save(properties){if(!ready||!householdId)return;try{await push(properties);}catch(e){console.warn("同步儲存失敗",e);}}
  return {start,save};
})();

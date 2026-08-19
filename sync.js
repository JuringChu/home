window.HomeSync=(()=>{
  const c=window.HOME_SYNC_CONFIG; let token="",householdId="",ready=false;
  const headers=()=>({apikey:c.publishableKey,Authorization:`Bearer ${token}`,"Content-Type":"application/json"});
  async function request(path,opts={}){const r=await fetch(c.url+path,{...opts,headers:{...headers(),...(opts.headers||{})}});if(!r.ok)throw new Error(await r.text());return r.status===204?null:r.json();}
  async function signIn(){
    const saved=JSON.parse(localStorage.getItem("homebuying-supabase-session")||"null");
    if(saved?.access_token){token=saved.access_token;return;}
    const r=await fetch(c.url+"/auth/v1/signup",{method:"POST",headers:{apikey:c.publishableKey,"Content-Type":"application/json"},body:"{}"});
    const data=await r.json(); if(!data.access_token)throw new Error("無法建立裝置登入");
    token=data.access_token;localStorage.setItem("homebuying-supabase-session",JSON.stringify(data));
  }
  async function start(initial,onRemote){
    try{
      await signIn(); householdId=localStorage.getItem("homebuying-household-id")||"";
      if(!householdId){
        const create=confirm("要建立新的共用買房清單嗎？\n確定：建立新清單\n取消：輸入另一台建立的共用碼加入");
        const code=prompt(create?"設定至少 8 碼的共用碼，請傳給 N：":"輸入 J 給你的共用碼：");
        if(!code)return;
        const fn=create?"create_buying_household":"join_buying_household";
        householdId=await request(`/rest/v1/rpc/${fn}`,{method:"POST",body:JSON.stringify({p_invite_code:code})});
        localStorage.setItem("homebuying-household-id",householdId);
        if(create)await save(initial);
      }
      const remote=await pull(); if(remote)onRemote(remote); ready=true;
      setInterval(async()=>{const next=await pull();if(next)onRemote(next);},8000);
    }catch(e){console.warn("同步尚未啟用",e);}
  }
  async function pull(){if(!householdId)return null;const rows=await request(`/rest/v1/buying_household_state?household_id=eq.${householdId}&select=properties`);return rows[0]?.properties||null;}
  async function save(properties){if(!ready||!householdId)return;try{await request("/rest/v1/buying_household_state?on_conflict=household_id",{method:"POST",headers:{Prefer:"resolution=merge-duplicates"},body:JSON.stringify({household_id:householdId,properties})});}catch(e){console.warn("同步儲存失敗",e);}}
  return {start,save};
})();

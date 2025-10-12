(async () => {
  const OFFSET_KEY="tw_cancel_offset", LINK_BIAS_KEY="tw_cancel_link_bias";
  const DEFAULT_OFFS=300, DEFAULT_LINK=0;
  const EMA_ALPHA=0.35, EMA_LINK=0.50;
  const MAX_STEP=250, MAX_ABS_LINK=1500, MAX_ABS_OFFS=2000, OUTLIER_GUARD=2000;

  const ATTACK_BTN="#target_attack";
  const CONFIRM_BTN="#troop_confirm_submit";
  const CANCEL_SEL="a.command-cancel";

  const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
  const nowMs=()=>Date.now();

  function parseTimeInput(inp){
    const p=(inp||"").trim().split(":"); if(p.length!==4) return null;
    const [hh,mm,ss,ms]=p.map(Number); if([hh,mm,ss,ms].some(Number.isNaN)) return null;
    const d=new Date(); d.setHours(hh,mm,ss,ms); return d;
  }
  function getParam(href,key){ try{ return new URL(href,location.origin).searchParams.get(key);}catch{return null;} }

  function parseArrivalFromInfo(doc){
    const huMonths={"jan.":0,"febr.":1,"márc.":2,"ápr.":3,"máj.":4,"jún.":5,"júl.":6,"aug.":7,"szept.":8,"okt.":9,"nov.":10,"dec.":11};
    const rows=[...doc.querySelectorAll("table.vis tr")];
    let td=null;
    for(const tr of rows){
      const tds=tr.querySelectorAll("td"); if(!tds.length) continue;
      const label=(tds[0].textContent||"").trim();
      if(/Érkezés/i.test(label)){ td=tds[tds.length-1]; break; }
    }
    if(!td) return null;
    const msSpan=td.querySelector("span.small.grey");
    let ms=0; if(msSpan){ const t=(msSpan.textContent||"").trim().replace(":",""); ms=clamp(parseInt(t,10)||0,0,999); }
    const clone=td.cloneNode(true); clone.querySelectorAll("span.small.grey").forEach(s=>s.remove());
    const base=(clone.textContent||"").replace(/\s+/g," ").trim();
    const m=base.match(/^([A-Za-záéíóöőúüű\.]+)\s+(\d{1,2}),\s*(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if(!m) return null;
    const monMap=huMonths[m[1].toLowerCase()]; if(monMap==null) return null;
    const d=new Date(+m[3],monMap,+m[2],+m[4],+m[5],+m[6],ms);
    return isNaN(d.getTime())?null:d;
  }
  function parseDurationFromInfo(doc){
    const rows=[...doc.querySelectorAll("table.vis tr")];
    for(const tr of rows){
      const tds=tr.querySelectorAll("td"); if(!tds.length) continue;
      const label=(tds[0].textContent||"").trim();
      if(/Időtartam/i.test(label)){
        const txt=(tds[tds.length-1].textContent||"").trim();
        const m=txt.match(/^(\d+):(\d{2}):(\d{2})$/);
        if(!m) return null;
        return (+m[1])*3600*1000 + (+m[2])*60*1000 + (+m[3])*1000;
      }
    }
    return null;
  }
  async function gotoInfo(worker, commandId){
    if(!commandId) return null;
    const url=`/game.php?screen=info_command&id=${commandId}&type=own`;
    try{ worker.location.href=url; }catch{}
    for(let i=0;i<80;i++){ await sleep(120); try{ if(worker.document.readyState==="complete") break; }catch{} }
    return worker.document;
  }

  const inp=prompt("Mikorra érjen vissza? (HH:MM:SS:ms, pl. 17:39:30:537)");
  if(!inp) return;
  const targetLocal=parseTimeInput(inp);
  if(!targetLocal){ alert("Rossz formátum (HH:MM:SS:ms)"); return; }

  let OFFSET_MS=parseInt(localStorage.getItem(OFFSET_KEY),10); if(Number.isNaN(OFFSET_MS)) OFFSET_MS=DEFAULT_OFFS;
  let LINK_BIAS_MS=parseInt(localStorage.getItem(LINK_BIAS_KEY),10); if(Number.isNaN(LINK_BIAS_MS)) LINK_BIAS_MS=DEFAULT_LINK;

  console.log(`OFFSET=${OFFSET_MS} ms | LINK_BIAS=${LINK_BIAS_MS} ms`);

  const attackBtn=document.querySelector(ATTACK_BTN);
  const form=attackBtn?.closest("form") || document.querySelector("form[action*='screen=place']");
  if(!attackBtn || !form){ alert("Nem találom a támadás gombot/űrlapot"); return; }

  const workerName="w_"+Math.random().toString(36).slice(2);
  const worker=window.open("about:blank", workerName);
  if(!worker){ alert("Popup blokkolva – engedélyezd!"); return; }

  const prevTarget=form.target; form.target=workerName; attackBtn.click(); form.target=prevTarget||"";

  let confirmBtn=null;
  for(let i=0;i<60 && !confirmBtn;i++){ await sleep(200); try{ confirmBtn=worker.document.querySelector(CONFIRM_BTN);}catch{} }
  if(!confirmBtn){ alert("Nincs troop_confirm_submit"); return; }

  confirmBtn.click();
  const send_click = nowMs();
  console.log("✅ Send(click):", new Date(send_click).toISOString());

  let cancelLink=null;
  for(let i=0;i<120 && !cancelLink;i++){ await sleep(100); try{ cancelLink=worker.document.querySelector(CANCEL_SEL);}catch{} }
  if(!cancelLink){ alert("Nincs cancel link"); return; }
  const cancelHref=cancelLink.href || cancelLink.getAttribute("href");
  const commandId=getParam(cancelHref,"id");

  let cancelTarget = Math.floor((send_click + targetLocal.getTime())/2) - OFFSET_MS - LINK_BIAS_MS;
  console.log("Előzetes cancel-cél:", new Date(cancelTarget).toISOString(),
              "(durva, send_click alapján)");

  let canceled = false;
  const scheduler = (async () => {
    while(!canceled){
      const t = cancelTarget;
      const now = nowMs();

      if (now >= t) break;
      const rem = t - now;
      await sleep(rem > 200 ? 100 : rem > 40 ? 20 : 5);
    }

    const finalNow = nowMs();
    if (finalNow < cancelTarget) {
      const base = Date.now() - performance.now();
      const targetPerf = cancelTarget - base;
      let delta = targetPerf - performance.now() - 5;
      if (delta > 1) await sleep(delta);
      while (performance.now() < targetPerf) {}
    }

    if (canceled) return;

    try { await fetch(cancelHref, { method:"GET", credentials:"include", cache:"no-store", keepalive:true }); }
    catch { try { worker.location.href=cancelHref; } catch{} }
    console.log("Cancel elküldve:", new Date().toISOString(),
                "| plan:", new Date(cancelTarget).toISOString(),
                "| diff:", (nowMs()-cancelTarget), "ms");
  })();

  const docInfo1 = await (async () => {
    try { return await gotoInfo(worker, commandId); } catch { return null; }
  })();

  let arriveForwardLocal = null, travelMs = null, send_auth = send_click;
  if (docInfo1){
    arriveForwardLocal = parseArrivalFromInfo(docInfo1);
    travelMs = parseDurationFromInfo(docInfo1);
    if (arriveForwardLocal && travelMs!=null){
      send_auth = arriveForwardLocal.getTime() - travelMs;
      console.log("Send(auth):", new Date(send_auth).toISOString(),
                  "| (forward érkezés - utazás)");
    } else {
      console.warn("Nem sikerült (forward Érkezés + Időtartam) → send_click marad.");
    }
  } else {
    console.warn("Nem töltött be az info oldal időben; durva időzítés marad.");
  }

  const refined = Math.floor((send_auth + targetLocal.getTime())/2) - OFFSET_MS - LINK_BIAS_MS;

  if (!Number.isFinite(refined)) {
    console.warn("Refined target invalid – az előzetes marad.");
  } else {
    const prev = cancelTarget;
    cancelTarget = refined;
    console.log("Finomított cancel-cél:", new Date(cancelTarget).toISOString(),
                "| változás:", (cancelTarget - prev), "ms");
  }

  await scheduler;
  canceled = true;

  await sleep(900);
  const docInfo2 = await gotoInfo(worker, commandId);
  const actualReturn = docInfo2 ? parseArrivalFromInfo(docInfo2) : null;
  if (!actualReturn){ console.warn("Nem tudtam kiolvasni a visszaérkezést."); return; }

  console.log("Valós visszaérkezés:", actualReturn.toISOString());

  const impliedCancel = Math.floor((actualReturn.getTime() + send_auth)/2);
  const cancelPlanDiff = impliedCancel - cancelTarget;
  const deltaReturn = actualReturn.getTime() - targetLocal.getTime();

  console.log("Implied cancel:", new Date(impliedCancel).toISOString(),
              "| planned:", new Date(cancelTarget).toISOString(),
              "| (implied - planned):", cancelPlanDiff,"ms");
  console.log("Δ return (valós - cél):", deltaReturn,"ms");

  let OFFSET_MS_new = OFFSET_MS, LINK_BIAS_new = LINK_BIAS_MS;
  const valid = Math.abs(deltaReturn) <= OUTLIER_GUARD && Math.abs(cancelPlanDiff) <= OUTLIER_GUARD;

  if (valid){
    const suggestedOffs = clamp(OFFSET_MS + Math.round(deltaReturn/2), 0, MAX_ABS_OFFS);
    const emaOffs = Math.round((1-EMA_ALPHA)*OFFSET_MS + EMA_ALPHA*suggestedOffs);
    const stepOffs = clamp(emaOffs - OFFSET_MS, -MAX_STEP, MAX_STEP);
    OFFSET_MS_new = clamp(OFFSET_MS + stepOffs, 0, MAX_ABS_OFFS);

    const targetLink = LINK_BIAS_MS - cancelPlanDiff;
    const emaLink = Math.round((1-EMA_LINK)*LINK_BIAS_MS + EMA_LINK*targetLink);
    const stepLink = clamp(emaLink - LINK_BIAS_MS, -MAX_STEP, MAX_STEP);
    LINK_BIAS_new = clamp(LINK_BIAS_MS + stepLink, -MAX_ABS_LINK, MAX_ABS_LINK);
  } else {
    console.warn("Outlier mérés",
                 "{Δ return:", deltaReturn, "ms, implied-planned:", cancelPlanDiff, "ms}");
  }

  localStorage.setItem(OFFSET_KEY, String(OFFSET_MS_new));
  localStorage.setItem(LINK_BIAS_KEY, String(LINK_BIAS_new));

  console.log(`OFFSET: ${OFFSET_MS} → ${OFFSET_MS_new} ms`);
  console.log(`LINK_BIAS: ${LINK_BIAS_MS} → ${LINK_BIAS_new} ms`);
})();

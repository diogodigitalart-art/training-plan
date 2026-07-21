import { useEffect, useMemo, useState } from "react";

const DAYS=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const pad=n=>String(n).padStart(2,"0");
const toMin=t=>{const [h,m]=String(t||"00:00").split(":").map(Number);return h*60+m};
const plus=(t,m)=>{const x=(toMin(t)+Number(m||0)+1440)%1440;return `${pad(Math.floor(x/60))}:${pad(x%60)}`};
const dateKey=(d=new Date())=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
const load=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const uid=()=>Math.random().toString(36).slice(2,9);
const task=(title,start,duration,type,detail="")=>({id:uid(),title,start,duration,type,detail,enabled:true});

const recommended={wake:"07:00",breakfast:"07:45",lunch:"13:30",dinner:"19:30",sleep:"23:00"};
const cardio=()=>task("Passadeira ou bicicleta","07:10",30,"cardio","Ritmo leve a moderado. Reduzir ou parar se surgirem tonturas.");
const defaultWeek={
 0:[task("Acordar","07:00",5,"anchor"),cardio(),task("Jogo de futebol — Rodovia","09:00",180,"football","Confirmar hora semanal: normalmente entre 08:00 e 10:00"),task("Almoço","13:30",30,"meal"),task("Leitura","21:00",20,"reading"),task("Dormir","23:00",5,"anchor")],
 1:[task("Acordar","07:00",5,"anchor"),cardio(),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Peitoral e tríceps","18:00",75,"strength","Abrir a app de treino"),task("Jantar","19:30",30,"meal"),task("Leitura","21:00",20,"reading"),task("Dormir","23:00",5,"anchor")],
 2:[task("Acordar","07:00",5,"anchor"),cardio(),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Futebol ou caminhada","19:30",120,"football","Fim variável"),task("Jantar / recuperação","21:45",30,"meal"),task("Dormir","23:00",5,"anchor")],
 3:[task("Acordar","07:00",5,"anchor"),cardio(),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Ombros e abdominais","18:00",75,"strength","Abrir as apps de treino e abdominais"),task("Jantar","19:30",30,"meal"),task("Leitura","21:00",20,"reading"),task("Dormir","23:00",5,"anchor")],
 4:[task("Acordar","07:00",5,"anchor"),cardio(),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Futebol ou caminhada","19:30",120,"football","Fim variável"),task("Jantar / recuperação","21:45",30,"meal"),task("Dormir","23:00",5,"anchor")],
 5:[task("Acordar","07:00",5,"anchor"),cardio(),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Pernas e glúteos","18:00",75,"strength","Abrir a app de treino"),task("Jantar","19:30",30,"meal"),task("Leitura","21:00",20,"reading"),task("Dormir","23:00",5,"anchor")],
 6:[task("Acordar","07:00",5,"anchor"),cardio(),task("Almoço","13:30",30,"meal"),task("Costas e bíceps","18:00",75,"strength","Abrir a app de treino"),task("Leitura","20:30",20,"reading"),task("Dormir","23:00",5,"anchor")]
};

const migrateWeek=(stored)=>{
 const source=stored&&typeof stored==="object"?stored:defaultWeek;
 const out={};
 for(let d=0;d<7;d++){
  const list=Array.isArray(source[d])?[...source[d]]:[...defaultWeek[d]];
  if(!list.some(x=>x.title==="Acordar")) list.push(task("Acordar","07:00",5,"anchor"));
  if(!list.some(x=>x.title==="Passadeira ou bicicleta")) list.push(cardio());
  out[d]=list;
 }
 return out;
};

export default function App(){
 const [tab,setTab]=useState("today");
 const [week,setWeekState]=useState(()=>migrateWeek(load("momentum-v13-week",defaultWeek)));
 const [anchors,setAnchorsState]=useState(()=>load("momentum-v13-anchors",recommended));
 const [done,setDoneState]=useState(()=>load("momentum-v13-done",{}));
 const [selectedDay,setSelectedDay]=useState(new Date().getDay());
 const [editing,setEditing]=useState(null);

 useEffect(()=>{
  save("momentum-v13-week",week);
 },[week]);

 useEffect(()=>{
  save("momentum-v13-anchors",anchors);
 },[anchors]);

 useEffect(()=>{
  save("momentum-v13-done",done);
 },[done]);
 const date=dateKey();
 const dow=new Date().getDay();
 const tasks=(week[dow]||[]).filter(x=>x.enabled).sort((a,b)=>toMin(a.start)-toMin(b.start));
 const completed=done[date]||{};
 const count=tasks.filter(t=>completed[t.id]).length;
 const pct=tasks.length?Math.round(count/tasks.length*100):0;
 const next=tasks.find(t=>!completed[t.id]);
 const remaining=tasks.filter(t=>!completed[t.id]).reduce((a,t)=>a+Number(t.duration||0),0);

 const weekStats=useMemo(()=>{
  const now=new Date(); const start=new Date(now); start.setDate(now.getDate()-((now.getDay()+6)%7));
  let planned=0,complete=0,strengthPlanned=0,strengthDone=0,footballPlanned=0,footballDone=0;
  const days=[];
  for(let i=0;i<7;i++){
   const d=new Date(start); d.setDate(start.getDate()+i); const key=dateKey(d); const dayTasks=(week[d.getDay()]||[]).filter(x=>x.enabled); const dd=done[key]||{};
   const c=dayTasks.filter(t=>dd[t.id]).length; planned+=dayTasks.length; complete+=c;
   dayTasks.forEach(t=>{if(t.type==="strength"){strengthPlanned++;if(dd[t.id])strengthDone++} if(t.type==="football"){footballPlanned++;if(dd[t.id])footballDone++}});
   days.push({label:DAYS[d.getDay()].slice(0,3),key,count:c,total:dayTasks.length,pct:dayTasks.length?Math.round(c/dayTasks.length*100):0,isToday:key===date});
  }
  return {planned,complete,pct:planned?Math.round(complete/planned*100):0,strengthPlanned,strengthDone,footballPlanned,footballDone,days};
 },[week,done,date]);

 const history=useMemo(()=>{
  const rows=[];
  for(let w=0;w<6;w++){
   const end=new Date(); end.setDate(end.getDate()-w*7); const start=new Date(end); start.setDate(end.getDate()-6);
   let p=0,c=0;
   for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const ts=(week[d.getDay()]||[]).filter(x=>x.enabled);const dd=done[dateKey(d)]||{};p+=ts.length;c+=ts.filter(t=>dd[t.id]).length}
   rows.push({label:w===0?"Esta semana":`Há ${w} semana${w>1?"s":""}`,pct:p?Math.round(c/p*100):0,done:c,total:p});
  }
  return rows;
 },[week,done]);

 const saveWeek=v=>{setWeekState(v);save("momentum-v13-week",v)};
 const saveAnchors=v=>{setAnchorsState(v);save("momentum-v13-anchors",v)};
 const toggle=id=>{const n={...done,[date]:{...(done[date]||{}),[id]:!completed[id]}};setDoneState(n);save("momentum-v13-done",n)};
 const saveTask=()=>{if(!editing?.title?.trim())return;const arr=[...(week[editing.day]||[])];const i=arr.findIndex(x=>x.id===editing.id);const item={...editing,duration:Number(editing.duration)};if(i>=0)arr[i]=item;else arr.push({...item,id:uid()});saveWeek({...week,[editing.day]:arr});setEditing(null)};
 const deleteTask=()=>{const arr=(week[editing.day]||[]).filter(x=>x.id!==editing.id);saveWeek({...week,[editing.day]:arr});setEditing(null)};

 return <div className="app"><style>{css}</style>
  <header><div><span className="eyebrow">MOMENTUM</span><h1>{tab==="today"?"Hoje":tab==="week"?"Semana":tab==="progress"?"Progresso":"Ajustes"}</h1><p>{DAYS[dow]} · {new Date().toLocaleDateString("pt-PT")}</p></div><div className="score"><b>{pct}%</b><small>hoje</small></div></header>

  {tab==="today"&&<main>
   <section className="summary"><div><small>PROGRESSO DE HOJE</small><h2>{count} de {tasks.length} concluídas</h2><p>{remaining} minutos previstos por fazer</p></div><div className="progress"><i style={{width:`${pct}%`}}/></div></section>
   <section className="anchors"><button onClick={()=>setTab("settings")}><span>Acordar</span><b>{anchors.wake}</b></button><button onClick={()=>setTab("settings")}><span>Almoço</span><b>{anchors.lunch}</b></button><button onClick={()=>setTab("settings")}><span>Jantar</span><b>{anchors.dinner}</b></button><button onClick={()=>setTab("settings")}><span>Dormir</span><b>{anchors.sleep}</b></button></section>
   {next?<section className="next"><div><small>PRÓXIMA AÇÃO</small><h2>{next.title}</h2><p>{next.start}–{plus(next.start,next.duration)} · {next.duration} min</p>{next.detail&&<em>{next.detail}</em>}</div><button onClick={()=>toggle(next.id)}>Concluir</button></section>:<section className="next complete"><div><small>DIA CONCLUÍDO</small><h2>Terminaste o plano de hoje</h2><p>Não precisas de acrescentar mais nada.</p></div></section>}
   <div className="sectionTitle"><h3>Horário de hoje</h3><button onClick={()=>{setSelectedDay(dow);setTab("week")}}>Editar</button></div>
   <div className="timeline">{tasks.map(t=><article key={t.id} className={completed[t.id]?"done":""}><button className="check" onClick={()=>toggle(t.id)}>{completed[t.id]?"✓":""}</button><time>{t.start}</time><div><b>{t.title}</b><small>até {plus(t.start,t.duration)} · {t.duration} min</small>{t.detail&&<p>{t.detail}</p>}</div></article>)}</div>
  </main>}

  {tab==="week"&&<main>
   <section className="dayTabs">{DAYS.map((d,i)=><button className={selectedDay===i?"active":""} onClick={()=>setSelectedDay(i)} key={d}>{d.slice(0,3)}</button>)}</section>
   <section className="card"><div className="sectionTitle"><div><small>ROTINA</small><h2>{DAYS[selectedDay]}</h2></div><button onClick={()=>setEditing({day:selectedDay,title:"",start:"17:00",duration:30,type:"other",detail:"",enabled:true})}>+ Adicionar</button></div>
    <div className="scheduleList">{(week[selectedDay]||[]).sort((a,b)=>toMin(a.start)-toMin(b.start)).map(t=><button key={t.id} onClick={()=>setEditing({...t,day:selectedDay})}><time>{t.start}</time><div><b>{t.title}</b><small>{t.duration} min · termina {plus(t.start,t.duration)}</small></div><span>›</span></button>)}</div>
   </section>
   <section className="card"><small>PLANO DE TREINO</small><div className="trainingWeek">{Object.entries(week).flatMap(([day,arr])=>arr.filter(t=>t.type==="strength"||t.type==="football").map(t=><div key={t.id}><span>{DAYS[Number(day)].slice(0,3)}</span><b>{t.title}</b><time>{t.start}</time></div>))}</div></section>
  </main>}

  {tab==="progress"&&<main>
   <section className="summary"><div><small>ESTA SEMANA</small><h2>{weekStats.complete} de {weekStats.planned} concluídas</h2><p>{weekStats.pct}% da rotina semanal</p></div><div className="progress"><i style={{width:`${weekStats.pct}%`}}/></div></section>
   <section className="metricGrid"><div className="metric"><span>Musculação</span><b>{weekStats.strengthDone}/{weekStats.strengthPlanned}</b></div><div className="metric"><span>Futebol</span><b>{weekStats.footballDone}/{weekStats.footballPlanned}</b></div></section>
   <section className="card"><small>DIAS DA SEMANA</small><div className="weekBars">{weekStats.days.map(d=><div key={d.key} className={d.isToday?"todayMark":""}><span>{d.label}</span><div><i style={{width:`${d.pct}%`}}/></div><b>{d.count}/{d.total}</b></div>)}</div></section>
   <section className="card"><small>HISTÓRICO</small><div className="history">{history.map(h=><div key={h.label}><div><b>{h.label}</b><small>{h.done}/{h.total} ações</small></div><strong>{h.pct}%</strong></div>)}</div></section>
  </main>}

  {tab==="settings"&&<main>
   <section className="card"><small>HORAS RECOMENDADAS</small><h2>Âncoras do teu dia</h2><p>Podes ajustar. Mantém horários próximos destes para proteger sono, refeições e energia.</p>
    <div className="settingsGrid">{Object.entries({wake:"Acordar",breakfast:"Pequeno-almoço",lunch:"Almoço",dinner:"Jantar",sleep:"Dormir"}).map(([k,label])=><label key={k}>{label}<input type="time" value={anchors[k]} onChange={e=>saveAnchors({...anchors,[k]:e.target.value})}/><small>Recomendado: {recommended[k]}</small></label>)}</div>
    <button className="secondary" onClick={()=>saveAnchors(recommended)}>Repor horas recomendadas</button>
   </section>
   <section className="tip"><b>Função da app</b><p>Mostrar-te o horário certo, o treino do dia e o teu progresso. Os exercícios específicos continuam na tua app de treino.</p></section>
  </main>}

  <nav><button className={tab==="today"?"active":""} onClick={()=>setTab("today")}><span>⌂</span>Hoje</button><button className={tab==="week"?"active":""} onClick={()=>setTab("week")}><span>▦</span>Semana</button><button className={tab==="progress"?"active":""} onClick={()=>setTab("progress")}><span>◔</span>Progresso</button><button className={tab==="settings"?"active":""} onClick={()=>setTab("settings")}><span>⚙</span>Ajustes</button></nav>

  {editing&&<div className="overlay" onClick={()=>setEditing(null)}><section className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><h2>{editing.id?"Editar atividade":"Nova atividade"}</h2><button onClick={()=>setEditing(null)}>×</button></div><label>Nome<input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><div className="two"><label>Hora<input type="time" value={editing.start} onChange={e=>setEditing({...editing,start:e.target.value})}/></label><label>Duração<input type="number" value={editing.duration} onChange={e=>setEditing({...editing,duration:e.target.value})}/></label></div><label>Tipo<select value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value})}><option value="strength">Musculação</option><option value="football">Futebol</option><option value="meal">Refeição</option><option value="work">Trabalho</option><option value="reading">Leitura</option><option value="anchor">Sono / acordar</option><option value="other">Outro</option></select></label><label>Nota<input value={editing.detail||""} onChange={e=>setEditing({...editing,detail:e.target.value})}/></label><button className="primary" onClick={saveTask}>Guardar</button>{editing.id&&<button className="danger" onClick={deleteTask}>Eliminar atividade</button>}</section></div>}
 </div>
}

const css=`
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f7f7f8;background:#0a0b0d}*{box-sizing:border-box}body{margin:0;background:#0a0b0d}.app{min-height:100vh;max-width:620px;margin:auto;padding:22px 18px 104px;background:radial-gradient(circle at 80% -10%,#252018 0,transparent 30%),#0a0b0d}button,input,select{font:inherit}button{cursor:pointer}header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}header h1{font-size:30px;margin:3px 0 2px}header p{margin:0;color:#8d929c;font-size:14px}.eyebrow{font-size:11px;letter-spacing:.22em;color:#ffb020}.score{width:58px;height:58px;border:1px solid #303238;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#15171b}.score b{font-size:18px}.score small{color:#8d929c}.summary,.card,.tip{background:#14161a;border:1px solid #272a30;border-radius:22px;padding:18px;margin-bottom:14px}.summary h2,.card h2{margin:4px 0}.summary p,.card p,.tip p{color:#a4a8b0;margin:0}.summary small,.card>small{color:#ffb020;letter-spacing:.12em;font-size:11px}.progress{height:8px;background:#25282e;border-radius:99px;margin-top:16px;overflow:hidden}.progress i{display:block;height:100%;background:#ffb020;border-radius:inherit}.anchors{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.anchors button{background:#14161a;border:1px solid #272a30;color:#fff;border-radius:16px;padding:11px 6px}.anchors span{display:block;color:#8d929c;font-size:11px}.anchors b{font-size:15px}.next{display:flex;justify-content:space-between;gap:16px;align-items:center;background:linear-gradient(135deg,#ffb020,#d98900);color:#111;border-radius:24px;padding:20px;margin-bottom:20px}.next small{font-size:11px;letter-spacing:.12em}.next h2{margin:4px 0;font-size:23px}.next p{margin:0}.next em{display:block;margin-top:7px;font-size:12px}.next button{border:0;border-radius:16px;padding:13px 14px;background:#111;color:#fff;font-weight:700}.next.complete{background:#1a2a22;color:#d8ffe8}.sectionTitle{display:flex;justify-content:space-between;align-items:center;margin:18px 0 10px}.sectionTitle h3,.sectionTitle h2{margin:0}.sectionTitle button{background:none;border:0;color:#ffb020}.timeline{display:flex;flex-direction:column;gap:8px}.timeline article{display:grid;grid-template-columns:34px 48px 1fr;gap:9px;align-items:center;background:#131519;border:1px solid #25282e;border-radius:17px;padding:12px}.timeline article.done{opacity:.48}.check{width:30px;height:30px;border-radius:10px;border:1px solid #3a3d44;background:#1c1f24;color:#111}.done .check{background:#ffb020;border-color:#ffb020}.timeline time{font-size:13px;color:#ffb020}.timeline b{display:block}.timeline small{color:#8d929c}.timeline p{margin:4px 0 0;color:#a4a8b0;font-size:12px}.dayTabs{display:flex;gap:8px;overflow:auto;padding-bottom:8px;margin-bottom:10px}.dayTabs button{flex:0 0 auto;background:#14161a;color:#a4a8b0;border:1px solid #272a30;border-radius:14px;padding:10px 13px}.dayTabs button.active{background:#ffb020;color:#111;border-color:#ffb020}.scheduleList{display:flex;flex-direction:column;gap:8px;margin-top:12px}.scheduleList>button{display:grid;grid-template-columns:48px 1fr 18px;gap:10px;text-align:left;align-items:center;background:#0f1114;border:1px solid #25282e;color:#fff;border-radius:15px;padding:12px}.scheduleList time{color:#ffb020}.scheduleList b,.scheduleList small{display:block}.scheduleList small{color:#8d929c;margin-top:2px}.trainingWeek{display:flex;flex-direction:column;gap:8px;margin-top:12px}.trainingWeek div{display:grid;grid-template-columns:42px 1fr 50px;gap:8px;align-items:center;background:#0f1114;border-radius:12px;padding:10px 12px}.trainingWeek span,.trainingWeek time{color:#ffb020;font-size:13px}.metricGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}.metric{background:#14161a;border:1px solid #272a30;border-radius:18px;padding:16px}.metric span{display:block;color:#8d929c;font-size:13px}.metric b{display:block;font-size:26px;margin-top:5px}.weekBars{display:flex;flex-direction:column;gap:12px;margin-top:14px}.weekBars>div{display:grid;grid-template-columns:38px 1fr 35px;gap:10px;align-items:center}.weekBars>div>div{height:9px;background:#25282e;border-radius:99px;overflow:hidden}.weekBars i{display:block;height:100%;background:#ffb020;border-radius:99px}.weekBars span,.weekBars b{font-size:13px}.todayMark span{color:#ffb020;font-weight:700}.history{display:flex;flex-direction:column;gap:8px;margin-top:12px}.history>div{display:flex;justify-content:space-between;align-items:center;background:#0f1114;border-radius:13px;padding:11px 12px}.history b,.history small{display:block}.history small{color:#8d929c;margin-top:2px}.history strong{color:#ffb020}.settingsGrid{display:grid;gap:10px;margin-top:16px}.settingsGrid label,.modal label{display:block;color:#c9ccd2;font-size:13px}.settingsGrid input,.modal input,.modal select{width:100%;margin-top:6px;background:#0f1114;border:1px solid #30333a;color:#fff;border-radius:13px;padding:12px}.settingsGrid small{display:block;margin-top:5px;color:#70757f}.secondary{width:100%;margin-top:14px;border:1px solid #343840;background:#1a1d22;color:#fff;border-radius:14px;padding:12px}.tip b{color:#ffb020}.tip p{margin-top:5px}nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(620px,100%);display:grid;grid-template-columns:repeat(4,1fr);background:rgba(16,18,22,.96);backdrop-filter:blur(16px);border-top:1px solid #292c32;padding:9px 8px max(9px,env(safe-area-inset-bottom));z-index:10}nav button{border:0;background:none;color:#7f848e;font-size:11px;padding:6px}nav span{display:block;font-size:18px;margin-bottom:2px}nav button.active{color:#ffb020}.overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;z-index:30}.modal{width:min(620px,100%);margin:auto;background:#15171b;border-radius:26px 26px 0 0;padding:20px 18px max(24px,env(safe-area-inset-bottom));max-height:90vh;overflow:auto}.modalHead{display:flex;justify-content:space-between;align-items:center}.modalHead h2{margin:0}.modalHead button{background:none;border:0;color:#fff;font-size:28px}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.modal label{margin-top:12px}.primary,.danger{width:100%;border:0;border-radius:14px;padding:13px;margin-top:15px;font-weight:700}.primary{background:#ffb020;color:#111}.danger{background:#30191c;color:#ff9da7}@media(max-width:390px){.anchors{grid-template-columns:repeat(2,1fr)}.next{align-items:flex-start;flex-direction:column}.next button{width:100%}}
`;

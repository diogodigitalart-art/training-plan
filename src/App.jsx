import { useMemo, useState } from "react";

const DAYS=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const pad=n=>String(n).padStart(2,"0");
const toMin=t=>{const [h,m]=String(t||"00:00").split(":").map(Number);return h*60+m};
const plus=(t,m)=>{const x=(toMin(t)+Number(m||0)+1440)%1440;return `${pad(Math.floor(x/60))}:${pad(x%60)}`};
const todayKey=()=>{const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)};
const load=(k,f)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const uid=()=>Math.random().toString(36).slice(2,9);

const recommended={
 wake:"07:00", breakfast:"07:45", lunch:"13:30", dinner:"19:30", sleep:"23:00"
};

const task=(title,start,duration,type,detail="")=>({id:uid(),title,start,duration,type,detail,enabled:true});

const defaultWeek={
 0:[task("Futebol — Rodovia","09:00",180,"football","Confirmar hora real entre 08:00 e 10:00"),task("Almoço","13:30",30,"meal"),task("Leitura","21:00",20,"reading")],
 1:[task("Acordar","07:00",5,"anchor"),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Musculação A","17:00",50,"strength"),task("Jantar","19:30",30,"meal"),task("Leitura","21:00",20,"reading"),task("Dormir","23:00",5,"anchor")],
 2:[task("Acordar","07:00",5,"anchor"),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Futebol","19:30",120,"football","Fim variável"),task("Jantar / recuperação","21:45",30,"meal"),task("Dormir","23:00",5,"anchor")],
 3:[task("Acordar","07:00",5,"anchor"),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Musculação B","17:00",50,"strength"),task("Jantar","19:30",30,"meal"),task("Leitura","21:00",20,"reading"),task("Dormir","23:00",5,"anchor")],
 4:[task("Acordar","07:00",5,"anchor"),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Futebol","19:30",120,"football","Fim variável"),task("Jantar / recuperação","21:45",30,"meal"),task("Dormir","23:00",5,"anchor")],
 5:[task("Acordar","07:00",5,"anchor"),task("Pequeno-almoço","07:45",20,"meal"),task("Boutique","10:00",240,"work"),task("Almoço","13:30",30,"meal"),task("Recuperação / margem","17:00",30,"recovery"),task("Jantar","19:30",30,"meal"),task("Leitura","21:00",20,"reading"),task("Dormir","23:00",5,"anchor")],
 6:[task("Musculação C","11:00",50,"strength"),task("Almoço","13:30",30,"meal"),task("Leitura","20:30",20,"reading")]
};

const defaultWorkouts={
 A:{name:"Musculação A",duration:50,exercises:[
  {name:"Agachamento ou variante",sets:3,reps:"6–10",rest:120},
  {name:"Supino",sets:3,reps:"6–10",rest:120},
  {name:"Remada",sets:3,reps:"8–12",rest:90},
  {name:"Peso morto romeno",sets:2,reps:"8–12",rest:90},
  {name:"Core",sets:2,reps:"8–15",rest:60}
 ]},
 B:{name:"Musculação B",duration:50,exercises:[
  {name:"Split squat ou variante",sets:3,reps:"8–12",rest:90},
  {name:"Press vertical",sets:3,reps:"6–10",rest:120},
  {name:"Elevações ou puxada",sets:3,reps:"6–10",rest:120},
  {name:"Hip thrust",sets:2,reps:"8–12",rest:90},
  {name:"Core",sets:2,reps:"8–15",rest:60}
 ]},
 C:{name:"Musculação C",duration:50,exercises:[
  {name:"Step-up ou leg press",sets:3,reps:"8–12",rest:90},
  {name:"Supino inclinado",sets:3,reps:"8–12",rest:90},
  {name:"Remada unilateral",sets:3,reps:"8–12",rest:90},
  {name:"Posterior da coxa",sets:2,reps:"10–15",rest:75},
  {name:"Core",sets:2,reps:"8–15",rest:60}
 ]}
};

export default function App(){
 const [tab,setTab]=useState("today");
 const [week,setWeekState]=useState(()=>load("momentum-simple-week",defaultWeek));
 const [workouts,setWorkoutsState]=useState(()=>load("momentum-simple-workouts",defaultWorkouts));
 const [anchors,setAnchorsState]=useState(()=>load("momentum-simple-anchors",recommended));
 const [done,setDoneState]=useState(()=>load("momentum-simple-done",{}));
 const [selectedDay,setSelectedDay]=useState(new Date().getDay());
 const [selectedWorkout,setSelectedWorkout]=useState("A");
 const [editing,setEditing]=useState(null);
 const date=todayKey();
 const dow=new Date().getDay();
 const tasks=(week[dow]||[]).filter(x=>x.enabled).sort((a,b)=>toMin(a.start)-toMin(b.start));
 const completed=done[date]||{};
 const count=tasks.filter(t=>completed[t.id]).length;
 const pct=tasks.length?Math.round(count/tasks.length*100):0;
 const next=tasks.find(t=>!completed[t.id]);
 const remaining=tasks.filter(t=>!completed[t.id]).reduce((a,t)=>a+Number(t.duration||0),0);
 const weekTraining=useMemo(()=>Object.values(week).flat().filter(t=>t.type==="strength"||t.type==="football"),[week]);

 const saveWeek=v=>{setWeekState(v);save("momentum-simple-week",v)};
 const saveWorkouts=v=>{setWorkoutsState(v);save("momentum-simple-workouts",v)};
 const saveAnchors=v=>{setAnchorsState(v);save("momentum-simple-anchors",v)};
 const toggle=id=>{const n={...done,[date]:{...(done[date]||{}),[id]:!completed[id]}};setDoneState(n);save("momentum-simple-done",n)};
 const saveTask=()=>{
  if(!editing?.title?.trim())return;
  const arr=[...(week[editing.day]||[])];
  const i=arr.findIndex(x=>x.id===editing.id);
  const item={...editing,duration:Number(editing.duration)};
  if(i>=0)arr[i]=item; else arr.push({...item,id:uid()});
  saveWeek({...week,[editing.day]:arr});setEditing(null);
 };
 const deleteTask=()=>{const arr=(week[editing.day]||[]).filter(x=>x.id!==editing.id);saveWeek({...week,[editing.day]:arr});setEditing(null)};
 const updateExercise=(idx,key,value)=>{const w={...workouts[selectedWorkout]};w.exercises=w.exercises.map((e,i)=>i===idx?{...e,[key]:key==="sets"||key==="rest"?Number(value):value}:e);saveWorkouts({...workouts,[selectedWorkout]:w})};

 return <div className="app"><style>{css}</style>
  <header><div><span className="eyebrow">MOMENTUM</span><h1>{tab==="today"?"Hoje":tab==="week"?"Semana":tab==="training"?"Treinos":"Ajustes"}</h1><p>{DAYS[dow]} · {new Date().toLocaleDateString("pt-PT")}</p></div><div className="score"><b>{pct}%</b><small>hoje</small></div></header>

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
   <section className="card"><small>TREINO DA SEMANA</small><div className="trainingWeek">{weekTraining.map(t=><div key={t.id}><b>{t.title}</b><span>{t.start}</span></div>)}</div></section>
  </main>}

  {tab==="training"&&<main>
   <section className="workoutTabs">{Object.keys(workouts).map(k=><button className={selectedWorkout===k?"active":""} onClick={()=>setSelectedWorkout(k)} key={k}>Treino {k}</button>)}</section>
   <section className="workoutHero"><small>TREINO SELECIONADO</small><h2>{workouts[selectedWorkout].name}</h2><p>Duração recomendada: {workouts[selectedWorkout].duration} minutos</p></section>
   <div className="exerciseList">{workouts[selectedWorkout].exercises.map((e,i)=><article key={i}><div className="exerciseNum">{i+1}</div><div><input value={e.name} onChange={x=>updateExercise(i,"name",x.target.value)}/><div className="exerciseMeta"><label>Séries<input type="number" value={e.sets} onChange={x=>updateExercise(i,"sets",x.target.value)}/></label><label>Repetições<input value={e.reps} onChange={x=>updateExercise(i,"reps",x.target.value)}/></label><label>Descanso<input type="number" value={e.rest} onChange={x=>updateExercise(i,"rest",x.target.value)}/><span>seg</span></label></div></div></article>)}</div>
   <section className="tip"><b>Regra do treino</b><p>Termina aos 55 minutos. Consistência primeiro, perfeição depois.</p></section>
  </main>}

  {tab==="settings"&&<main>
   <section className="card"><small>HORAS RECOMENDADAS</small><h2>Âncoras do teu dia</h2><p>Podes ajustar. Mantém horários próximos destes para proteger sono, refeições e energia.</p>
    <div className="settingsGrid">{Object.entries({wake:"Acordar",breakfast:"Pequeno-almoço",lunch:"Almoço",dinner:"Jantar",sleep:"Dormir"}).map(([k,label])=><label key={k}>{label}<input type="time" value={anchors[k]} onChange={e=>saveAnchors({...anchors,[k]:e.target.value})}/><small>Recomendado: {recommended[k]}</small></label>)}</div>
    <button className="secondary" onClick={()=>saveAnchors(recommended)}>Repor horas recomendadas</button>
   </section>
   <section className="tip"><b>O Momentum agora tem apenas duas funções</b><p>Mostrar-te o horário certo do dia e dizer-te exatamente qual treino fazer.</p></section>
  </main>}

  <nav><button className={tab==="today"?"active":""} onClick={()=>setTab("today")}><span>⌂</span>Hoje</button><button className={tab==="week"?"active":""} onClick={()=>setTab("week")}><span>▦</span>Semana</button><button className={tab==="training"?"active":""} onClick={()=>setTab("training")}><span>◆</span>Treino</button><button className={tab==="settings"?"active":""} onClick={()=>setTab("settings")}><span>⚙</span>Ajustes</button></nav>

  {editing&&<div className="overlay" onClick={()=>setEditing(null)}><section className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><h2>{editing.id?"Editar atividade":"Nova atividade"}</h2><button onClick={()=>setEditing(null)}>×</button></div><label>Nome<input value={editing.title} onChange={e=>setEditing({...editing,title:e.target.value})}/></label><div className="two"><label>Hora<input type="time" value={editing.start} onChange={e=>setEditing({...editing,start:e.target.value})}/></label><label>Duração<input type="number" value={editing.duration} onChange={e=>setEditing({...editing,duration:e.target.value})}/></label></div><label>Tipo<select value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value})}><option value="strength">Musculação</option><option value="football">Futebol</option><option value="meal">Refeição</option><option value="work">Trabalho</option><option value="reading">Leitura</option><option value="anchor">Sono / acordar</option><option value="other">Outro</option></select></label><label>Nota<input value={editing.detail||""} onChange={e=>setEditing({...editing,detail:e.target.value})}/></label><button className="primary" onClick={saveTask}>Guardar</button>{editing.id&&<button className="danger" onClick={deleteTask}>Eliminar atividade</button>}</section></div>}
 </div>
}

const css=`
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f7f7f8;background:#0a0b0d;font-synthesis:none}*{box-sizing:border-box}body{margin:0;background:#0a0b0d}.app{min-height:100vh;max-width:620px;margin:auto;padding:22px 18px 104px;background:radial-gradient(circle at 80% -10%,#252018 0,transparent 30%),#0a0b0d}button,input,select{font:inherit}button{cursor:pointer}header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}header h1{font-size:30px;margin:3px 0 2px}header p{margin:0;color:#8d929c;font-size:14px}.eyebrow{font-size:11px;letter-spacing:.22em;color:#ffb020}.score{width:58px;height:58px;border:1px solid #303238;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#15171b}.score b{font-size:18px}.score small{color:#8d929c}.summary,.card,.workoutHero,.tip{background:#14161a;border:1px solid #272a30;border-radius:22px;padding:18px;margin-bottom:14px}.summary h2,.card h2,.workoutHero h2{margin:4px 0 4px}.summary p,.card p,.workoutHero p,.tip p{color:#a4a8b0;margin:0}.summary small,.card>small,.workoutHero small{color:#ffb020;letter-spacing:.12em;font-size:11px}.progress{height:8px;background:#25282e;border-radius:99px;margin-top:16px;overflow:hidden}.progress i{display:block;height:100%;background:#ffb020;border-radius:inherit}.anchors{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}.anchors button{background:#14161a;border:1px solid #272a30;color:#fff;border-radius:16px;padding:11px 6px}.anchors span{display:block;color:#8d929c;font-size:11px}.anchors b{font-size:15px}.next{display:flex;justify-content:space-between;gap:16px;align-items:center;background:linear-gradient(135deg,#ffb020,#d98900);color:#111;border-radius:24px;padding:20px;margin-bottom:20px}.next small{font-size:11px;letter-spacing:.12em}.next h2{margin:4px 0;font-size:23px}.next p{margin:0}.next em{display:block;margin-top:7px;font-size:12px}.next button{border:0;border-radius:16px;padding:13px 14px;background:#111;color:#fff;font-weight:700}.next.complete{background:#1a2a22;color:#d8ffe8}.sectionTitle{display:flex;justify-content:space-between;align-items:center;margin:18px 0 10px}.sectionTitle h3,.sectionTitle h2{margin:0}.sectionTitle button{background:none;border:0;color:#ffb020}.timeline{display:flex;flex-direction:column;gap:8px}.timeline article{display:grid;grid-template-columns:34px 48px 1fr;gap:9px;align-items:center;background:#131519;border:1px solid #25282e;border-radius:17px;padding:12px}.timeline article.done{opacity:.48}.check{width:30px;height:30px;border-radius:10px;border:1px solid #3a3d44;background:#1c1f24;color:#111}.done .check{background:#ffb020;border-color:#ffb020}.timeline time{font-size:13px;color:#ffb020}.timeline b{display:block}.timeline small{color:#8d929c}.timeline p{margin:4px 0 0;color:#a4a8b0;font-size:12px}.dayTabs,.workoutTabs{display:flex;gap:8px;overflow:auto;padding-bottom:8px;margin-bottom:10px}.dayTabs button,.workoutTabs button{flex:0 0 auto;background:#14161a;color:#a4a8b0;border:1px solid #272a30;border-radius:14px;padding:10px 13px}.dayTabs button.active,.workoutTabs button.active{background:#ffb020;color:#111;border-color:#ffb020}.scheduleList{display:flex;flex-direction:column;gap:8px;margin-top:12px}.scheduleList>button{display:grid;grid-template-columns:48px 1fr 18px;gap:10px;text-align:left;align-items:center;background:#0f1114;border:1px solid #25282e;color:#fff;border-radius:15px;padding:12px}.scheduleList time{color:#ffb020}.scheduleList b,.scheduleList small{display:block}.scheduleList small{color:#8d929c;margin-top:2px}.trainingWeek{display:grid;gap:8px;margin-top:12px}.trainingWeek div{display:flex;justify-content:space-between;background:#0f1114;border-radius:12px;padding:10px 12px}.trainingWeek span{color:#ffb020}.exerciseList{display:flex;flex-direction:column;gap:9px}.exerciseList article{display:grid;grid-template-columns:34px 1fr;gap:10px;background:#14161a;border:1px solid #272a30;border-radius:18px;padding:13px}.exerciseNum{width:30px;height:30px;border-radius:10px;background:#ffb020;color:#111;display:grid;place-items:center;font-weight:800}.exerciseList input{width:100%;background:#0e1013;border:1px solid #292c32;color:#fff;border-radius:10px;padding:9px}.exerciseMeta{display:grid;grid-template-columns:1fr 1.4fr 1.3fr;gap:7px;margin-top:8px}.exerciseMeta label{font-size:11px;color:#8d929c}.exerciseMeta span{font-size:11px;margin-left:3px}.settingsGrid{display:grid;gap:10px;margin-top:16px}.settingsGrid label,.modal label{display:block;color:#c9ccd2;font-size:13px}.settingsGrid input,.modal input,.modal select{width:100%;margin-top:6px;background:#0f1114;border:1px solid #30333a;color:#fff;border-radius:13px;padding:12px}.settingsGrid small{display:block;margin-top:5px;color:#70757f}.secondary{width:100%;margin-top:14px;border:1px solid #343840;background:#1a1d22;color:#fff;border-radius:14px;padding:12px}.tip b{color:#ffb020}.tip p{margin-top:5px}nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(620px,100%);display:grid;grid-template-columns:repeat(4,1fr);background:rgba(16,18,22,.96);backdrop-filter:blur(16px);border-top:1px solid #292c32;padding:9px 8px max(9px,env(safe-area-inset-bottom));z-index:10}nav button{border:0;background:none;color:#7f848e;font-size:11px;padding:6px}nav span{display:block;font-size:18px;margin-bottom:2px}nav button.active{color:#ffb020}.overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;z-index:30}.modal{width:min(620px,100%);margin:auto;background:#15171b;border-radius:26px 26px 0 0;padding:20px 18px max(24px,env(safe-area-inset-bottom));max-height:90vh;overflow:auto}.modalHead{display:flex;justify-content:space-between;align-items:center}.modalHead h2{margin:0}.modalHead button{background:none;border:0;color:#fff;font-size:28px}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.modal label{margin-top:12px}.primary,.danger{width:100%;border:0;border-radius:14px;padding:13px;margin-top:15px;font-weight:700}.primary{background:#ffb020;color:#111}.danger{background:#30191c;color:#ff9da7}@media(max-width:390px){.anchors{grid-template-columns:repeat(2,1fr)}.exerciseMeta{grid-template-columns:1fr 1fr}.next{align-items:flex-start;flex-direction:column}.next button{width:100%}}
`;

import { useMemo, useState } from "react";

const ACCENT = "#ffb020";
const todayKey = () => new Date().toISOString().slice(0, 10);
const load = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const dayNames = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

const routine = [
  { id:"walk", icon:"↗", title:"Movimento matinal", time:"07:10", minutes:15, priority:3, full:"15 min de caminhada leve", reduced:"10 min de caminhada", minimum:"5 min de mobilidade" },
  { id:"project", icon:"◆", title:"Projeto principal", time:"08:05", minutes:60, priority:1, full:"60 min de trabalho focado", reduced:"30 min numa tarefa concreta", minimum:"10 min + definir próxima ação" },
  { id:"work", icon:"▣", title:"Boutique", time:"10:00–14:00", minutes:240, priority:0, fixed:true, full:"Turno e responsabilidades", reduced:"Cumprir o essencial", minimum:"Registar pendências" },
  { id:"training", icon:"▲", title:"Treino / futebol", time:"17:00", minutes:50, priority:2, full:"Treino completo 45–55 min", reduced:"Treino compacto 25–30 min", minimum:"10–15 min de movimento" },
  { id:"reading", icon:"□", title:"Leitura", time:"21:00", minutes:20, priority:4, full:"10 páginas + recordar 1 ideia", reduced:"5 páginas", minimum:"1–2 páginas" },
  { id:"shutdown", icon:"◐", title:"Preparar o sono", time:"22:30", minutes:10, priority:0, full:"Preparar amanhã e desligar ecrãs", reduced:"Telemóvel fora da cama", minimum:"Alarme, higiene e deitar" },
];

const modes = {
  full:{name:"Dia normal", code:"A", short:"Rotina completa", explain:"Tens tempo e energia suficientes. Manténs as durações planeadas."},
  reduced:{name:"Dia comprimido", code:"B", short:"Protege o essencial", explain:"Perdeste algumas horas. Mantemos o essencial, reduzimos durações e retiramos o secundário."},
  minimum:{name:"Dia mínimo", code:"C", short:"Mantém continuidade", explain:"Tens muito pouco tempo ou energia. Fazes apenas versões mínimas, sem criar dívida."},
  recovery:{name:"Recuperação", code:"D", short:"Saúde primeiro", explain:"Doença, sintomas fortes ou impossibilidade real. Cancelamos o não essencial e planeamos a retoma."}
};

const workoutByDay = {
  1:["Agachamento controlado","Supino","Remada","Peso morto romeno","Core"],
  3:["Step-up ou split squat","Press de ombros","Puxada","Hip thrust","Core"],
  6:["Agachamento leve","Supino inclinado","Remada unilateral","Curl femoral","Core"]
};

function App(){
  const [tab,setTab]=useState("today");
  const [daily,setDaily]=useState(()=>load("momentum-daily",{}));
  const [settings,setSettings]=useState(()=>load("momentum-settings",{activeProject:"Plataforma de ideias",maintenanceProject:"Atlas",visionProject:"Goal Gate Hub",wake:"07:00",sleep:"23:00"}));
  const [showAdapt,setShowAdapt]=useState(false);
  const [event,setEvent]=useState({type:"commitment",title:"Jogo de futebol",start:"17:30",end:"22:30",energy:3,symptoms:"none"});
  const date=todayKey();
  const state=daily[date]||{};
  const dayMode=state.dayMode||"full";
  const taskState=state.tasks||{};

  const update=(patch)=>{const next={...daily,[date]:{...state,...patch}};setDaily(next);save("momentum-daily",next)};
  const updateTask=(id,patch)=>update({tasks:{...taskState,[id]:{...(taskState[id]||{}),...patch}}});
  const setSettingsSaved=(next)=>{setSettings(next);save("momentum-settings",next)};

  const activeTasks=useMemo(()=>routine.filter(t=>taskState[t.id]?.status!=="cancelled"),[taskState]);
  const doneCount=activeTasks.filter(t=>taskState[t.id]?.done).length;
  const percent=activeTasks.length?Math.round(doneCount/activeTasks.length*100):100;
  const nextTask=activeTasks.find(t=>!taskState[t.id]?.done) || null;
  const remainingMinutes=activeTasks.filter(t=>!taskState[t.id]?.done).reduce((sum,t)=>sum+(taskState[t.id]?.minutes??(dayMode==="reduced"?Math.min(t.minutes,30):dayMode==="minimum"?Math.min(t.minutes,10):t.minutes)),0);

  const taskDescription=(task)=>{
    const custom=taskState[task.id]?.description;
    if(custom)return custom;
    if(dayMode==="recovery")return task.fixed||task.id==="shutdown"?task.minimum:"Dispensado para recuperação";
    return dayMode==="reduced"?task.reduced:dayMode==="minimum"?task.minimum:task.full;
  };

  const applyContingency=()=>{
    let mode="reduced";
    const nextTasks={...taskState};
    const changes=[];
    if(event.type==="symptoms" || event.symptoms==="strong") mode="recovery";
    else if(event.type==="energy" && Number(event.energy)<=2) mode="minimum";
    else {
      const [sh,sm]=event.start.split(":").map(Number); const [eh,em]=event.end.split(":").map(Number);
      const duration=Math.max(0,(eh*60+em)-(sh*60+sm));
      mode=duration>=240?"reduced":duration>=120?"reduced":"full";
      if(duration>=120){
        nextTasks.project={...(nextTasks.project||{}),description:duration>=240?"30 min numa única tarefa importante":"45 min de foco",minutes:duration>=240?30:45};
        changes.push("Projeto reduzido, mas protegido");
        nextTasks.reading={...(nextTasks.reading||{}),description:"2 páginas antes de sair ou ao regressar",minutes:5};
        changes.push("Leitura reduzida para versão mínima");
        nextTasks.training={...(nextTasks.training||{}),status:"moved",description:"Transferido para outro dia seguro; se não houver espaço, removido sem compensar",minutes:0};
        changes.push("Treino transferido ou removido sem dívida");
        nextTasks.shutdown={...(nextTasks.shutdown||{}),description:"Ao regressar: higiene, preparar alarme e dormir",minutes:10};
        changes.push("Sono protegido ao regressar");
      }
    }
    if(mode==="minimum"){
      routine.forEach(t=>{if(!t.fixed)nextTasks[t.id]={...(nextTasks[t.id]||{}),description:t.minimum,minutes:Math.min(t.minutes,10)}});
      changes.push("Todas as ações passaram para versão mínima");
    }
    if(mode==="recovery"){
      routine.forEach(t=>{if(!t.fixed&&t.id!=="shutdown")nextTasks[t.id]={...(nextTasks[t.id]||{}),status:"cancelled",description:"Dispensado para recuperação",minutes:0}});
      changes.push("Atividades não essenciais canceladas sem penalização");
      nextTasks.shutdown={...(nextTasks.shutdown||{}),description:"Hidratar, registar sintomas e descansar",minutes:10};
    }
    update({dayMode:mode,tasks:nextTasks,adaptation:{...event,changes,createdAt:new Date().toISOString()}});
    setShowAdapt(false);
  };

  const recentDays=useMemo(()=>Object.entries(daily).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7).map(([d,s])=>{
    const tasks=s.tasks||{}; const active=routine.filter(t=>tasks[t.id]?.status!=="cancelled");
    const done=active.filter(t=>tasks[t.id]?.done).length;
    return {date:d,percent:active.length?Math.round(done/active.length*100):0,mode:s.dayMode||"full"};
  }),[daily]);

  return <div className="app"><style>{styles}</style>
    <header className="topbar"><div><div className="brand">MOMENTUM</div><h1>{tab==="today"?"Hoje":tab==="plan"?"Plano":tab==="progress"?"Progresso":"Mais"}</h1><p>{dayNames[new Date().getDay()]} · {new Date().toLocaleDateString("pt-PT")}</p></div><div className="ring" style={{"--p":`${percent*3.6}deg`}}><span>{percent}%</span></div></header>

    {tab==="today"&&<main>
      <section className="statusHero">
        <div className="statusTop"><span className="modePill">Plano {modes[dayMode].code} · {modes[dayMode].name}</span><button className="ghost" onClick={()=>setShowAdapt(true)}>O dia mudou?</button></div>
        <div className="heroMetrics"><div><strong>{doneCount}/{activeTasks.length}</strong><span>concluídas</span></div><div><strong>{remainingMinutes}</strong><span>min restantes</span></div></div>
        <div className="bigProgress"><i style={{width:`${percent}%`}}/></div>
      </section>

      {state.adaptation&&<section className="adaptSummary"><div><b>Dia adaptado:</b> {state.adaptation.title||modes[dayMode].name}</div><small>{state.adaptation.changes?.join(" · ")}</small></section>}

      {nextTask&&<section className="nextCard"><div className="kicker">PRÓXIMA AÇÃO</div><div className="nextRow"><div><h2>{nextTask.title}</h2><p>{taskDescription(nextTask)}</p><span>{nextTask.time}</span></div><button className="start" onClick={()=>updateTask(nextTask.id,{done:true})}>Concluir</button></div></section>}

      <div className="sectionHeader"><h3>O teu dia</h3><span>{activeTasks.length-doneCount} por fazer</span></div>
      <section className="taskList">{routine.map(task=>{
        const t=taskState[task.id]||{}; const cancelled=t.status==="cancelled"; const moved=t.status==="moved";
        return <article key={task.id} className={`task ${t.done?"done":""} ${cancelled?"cancelled":""}`}>
          <button className="tick" disabled={cancelled||moved} onClick={()=>updateTask(task.id,{done:!t.done})}>{t.done?"✓":""}</button>
          <div className="taskText"><div><b>{task.title}</b><span>{task.time}</span></div><p>{taskDescription(task)}</p>{moved&&<em>Transferido</em>}{cancelled&&<em>Dispensado</em>}</div>
        </article>})}</section>
      <button className="adaptBtn" onClick={()=>setShowAdapt(true)}>＋ Adaptar este dia</button>
    </main>}

    {tab==="plan"&&<main>
      <section className="cleanCard"><div className="kicker">COMO FUNCIONAM AS CONTINGÊNCIAS</div><h2>A rotina adapta-se à vida.</h2><p>Não tens de memorizar letras. Escolhes o que aconteceu e a app reorganiza o dia.</p></section>
      <div className="modeGrid">{Object.entries(modes).map(([id,m])=><section className="modeCard" key={id}><span>{m.code}</span><div><b>{m.name}</b><small>{m.short}</small><p>{m.explain}</p></div></section>)}</div>
      <section className="cleanCard"><div className="sectionHeader"><h3>Semana física</h3></div>{[["Segunda","Musculação A"],["Terça","Futebol"],["Quarta","Musculação B"],["Quinta","Futebol"],["Sexta","Recuperação / margem"],["Sábado","Musculação C"],["Domingo","Futebol ou descanso"]].map(([d,a])=><div className="planRow" key={d}><b>{d}</b><span>{a}</span></div>)}</section>
      <section className="cleanCard"><div className="kicker">PROJETO ATIVO</div><input className="projectInput" value={settings.activeProject} onChange={e=>setSettingsSaved({...settings,activeProject:e.target.value})}/><p>Um projeto principal de cada vez. Atlas fica em manutenção e Goal Gate Hub permanece como visão.</p></section>
    </main>}

    {tab==="progress"&&<main>
      <div className="metricGrid"><div className="metric"><span>Hoje</span><strong>{percent}%</strong><small>{doneCount}/{activeTasks.length} concluídas</small></div><div className="metric"><span>Tempo restante</span><strong>{remainingMinutes}</strong><small>minutos essenciais</small></div></div>
      <section className="cleanCard"><div className="sectionHeader"><h3>Últimos dias</h3><span>histórico real</span></div>{recentDays.length?recentDays.map(d=><div className="historyRow" key={d.date}><div><b>{new Date(d.date+"T12:00:00").toLocaleDateString("pt-PT",{weekday:"short"})}</b><small>Plano {modes[d.mode].code}</small></div><div className="miniBar"><i style={{width:`${d.percent}%`}}/></div><strong>{d.percent}%</strong></div>):<p className="muted">Ainda não existem dias suficientes registados.</p>}</section>
      <section className="cleanCard"><div className="sectionHeader"><h3>Esta semana</h3><span>o que está em risco</span></div><div className="risk"><b>{percent<60?"Atenção: o dia está em risco.":percent<100?"Continua: ainda há ações essenciais.":"Dia concluído."}</b><p>{percent<60?"Usa “O dia mudou?” se o plano já não for realista. Não deixes tarefas impossíveis abertas.":percent<100?`Faltam ${activeTasks.length-doneCount} ações. A próxima é ${nextTask?.title||"—"}.`:"Cumpriste o plano real do dia, mesmo que tenha sido adaptado."}</p></div></section>
      <section className="cleanCard"><div className="sectionHeader"><h3>Físico</h3></div><div className="fieldRow"><label>Peso<input type="number" step="0.1" value={state.weight||""} onChange={e=>update({weight:e.target.value})} placeholder="kg"/></label><label>Cintura<input type="number" step="0.1" value={state.waist||""} onChange={e=>update({waist:e.target.value})} placeholder="cm"/></label></div></section>
    </main>}

    {tab==="more"&&<main>
      <section className="cleanCard"><div className="sectionHeader"><h3>Treino de hoje</h3></div>{workoutByDay[new Date().getDay()]?workoutByDay[new Date().getDay()].map((x,i)=><div className="exercise" key={x}><span>{i+1}</span><b>{x}</b><small>2–3 séries</small></div>):<p className="muted">Dia de futebol, recuperação ou caminhada leve.</p>}</section>
      <section className="cleanCard"><div className="kicker">PROJETOS</div><label>Ativo<input value={settings.activeProject} onChange={e=>setSettingsSaved({...settings,activeProject:e.target.value})}/></label><label>Manutenção<input value={settings.maintenanceProject} onChange={e=>setSettingsSaved({...settings,maintenanceProject:e.target.value})}/></label><label>Visão<input value={settings.visionProject} onChange={e=>setSettingsSaved({...settings,visionProject:e.target.value})}/></label></section>
      <section className="cleanCard"><div className="kicker">CHECK-IN</div><div className="fieldRow"><label>Sono<input type="number" step="0.5" value={state.sleepHours||""} onChange={e=>update({sleepHours:e.target.value})} placeholder="horas"/></label><label>Energia<select value={state.energy||3} onChange={e=>update({energy:Number(e.target.value)})}>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label></div><label>Notas / sintomas<textarea value={state.notes||""} onChange={e=>update({notes:e.target.value})} placeholder="Apenas quando houver algo relevante."/></label></section>
    </main>}

    {showAdapt&&<div className="overlay"><div className="modal"><div className="modalHead"><div><div className="kicker">CONTINGÊNCIA</div><h2>O que mudou?</h2></div><button onClick={()=>setShowAdapt(false)}>×</button></div>
      <div className="choiceGrid">{[["commitment","Tenho um compromisso"],["time","Fiquei sem tempo"],["energy","Pouca energia"],["symptoms","Sintomas / doença"]].map(([id,l])=><button key={id} className={event.type===id?"selected":""} onClick={()=>setEvent({...event,type:id})}>{l}</button>)}</div>
      {event.type==="commitment"&&<><label>Compromisso<input value={event.title} onChange={e=>setEvent({...event,title:e.target.value})}/></label><div className="fieldRow"><label>Início<input type="time" value={event.start} onChange={e=>setEvent({...event,start:e.target.value})}/></label><label>Fim<input type="time" value={event.end} onChange={e=>setEvent({...event,end:e.target.value})}/></label></div><div className="preview"><b>O que a app fará</b><p>Protege projeto e sono, reduz leitura, move ou remove treino sem criar dívida e recalcula o progresso do dia.</p></div></>}
      {event.type==="time"&&<div className="preview"><b>Dia comprimido</b><p>Projeto 30 min, treino 25 min, leitura 5 páginas. O secundário sai primeiro.</p></div>}
      {event.type==="energy"&&<><label>Energia<select value={event.energy} onChange={e=>setEvent({...event,energy:Number(e.target.value)})}><option value="1">1 — Muito baixa</option><option value="2">2 — Baixa</option><option value="3">3 — Normal</option></select></label><div className="preview"><b>Dia mínimo</b><p>10 min de projeto, movimento leve e 1–2 páginas. O objetivo é continuidade.</p></div></>}
      {event.type==="symptoms"&&<><label>Intensidade<select value={event.symptoms} onChange={e=>setEvent({...event,symptoms:e.target.value})}><option value="light">Ligeiros</option><option value="strong">Fortes</option></select></label><div className="preview"><b>Recuperação</b><p>Se forem fortes, o não essencial é cancelado sem penalização. Saúde e descanso primeiro.</p></div></>}
      <button className="primary" onClick={applyContingency}>Aplicar plano adaptado</button><button className="secondaryFull" onClick={()=>setShowAdapt(false)}>Cancelar</button>
    </div></div>}

    <nav>{[["today","Hoje","⌂"],["plan","Plano","▤"],["progress","Progresso","↗"],["more","Mais","•••"]].map(([id,l,ic])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><span>{ic}</span>{l}</button>)}</nav>
  </div>
}

const styles=`
*{box-sizing:border-box}body{margin:0;background:#090b0e;color:#f5f7fa;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.app{max-width:560px;min-height:100vh;margin:auto;padding:0 18px 100px;background:linear-gradient(180deg,#0d1117 0,#090b0e 42%)}button,input,select,textarea{font:inherit}.topbar{display:flex;justify-content:space-between;align-items:center;padding:34px 2px 20px}.brand,.kicker{font-size:10px;letter-spacing:1.8px;font-weight:800;color:${ACCENT}}h1{margin:3px 0 2px;font-size:34px;letter-spacing:-1.3px}.topbar p{margin:0;color:#77808c;font-size:12px}.ring{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(${ACCENT} var(--p),#20262e 0);position:relative}.ring:after{content:"";position:absolute;inset:5px;border-radius:50%;background:#0d1117}.ring span{z-index:1;font-size:12px;font-weight:800}.statusHero,.cleanCard,.nextCard,.adaptSummary{background:#121820;border:1px solid #222b35;border-radius:22px;padding:18px;margin:10px 0 16px}.statusHero{background:linear-gradient(145deg,#151d26,#10151b)}.statusTop,.sectionHeader,.nextRow,.fieldRow{display:flex;align-items:center;justify-content:space-between;gap:12px}.modePill{font-size:11px;border:1px solid #39424e;border-radius:999px;padding:7px 10px;color:#d7dde4}.ghost{background:transparent;border:0;color:${ACCENT};font-weight:700;font-size:12px}.heroMetrics{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:22px 0 14px}.heroMetrics div{display:flex;flex-direction:column}.heroMetrics strong{font-size:28px;letter-spacing:-1px}.heroMetrics span{font-size:11px;color:#78828e}.bigProgress,.miniBar{height:9px;background:#242c35;border-radius:999px;overflow:hidden}.bigProgress i,.miniBar i{display:block;height:100%;background:${ACCENT};border-radius:999px;transition:.25s}.adaptSummary{background:#1b1710;border-color:#3b2d16;color:#f7dfb4}.adaptSummary small{display:block;color:#ad966e;margin-top:5px;line-height:1.4}.nextCard{border-color:#3b4653}.nextCard h2{font-size:22px;margin:8px 0 5px}.nextCard p{margin:0 0 8px;color:#a2acb8;font-size:13px}.nextCard span{font-size:11px;color:#737e8a}.start,.primary{border:0;background:${ACCENT};color:#14100a;font-weight:800;border-radius:14px;padding:12px 16px}.sectionHeader{margin:22px 2px 9px}.sectionHeader h3{margin:0;font-size:16px}.sectionHeader span{font-size:11px;color:#6f7985}.taskList{display:flex;flex-direction:column;gap:8px}.task{display:flex;gap:12px;align-items:flex-start;padding:14px 13px;background:#11161d;border:1px solid #202832;border-radius:16px}.task.done{opacity:.58}.task.cancelled{opacity:.42}.tick{width:31px;height:31px;flex:0 0 31px;border-radius:10px;border:1px solid #3a4652;background:#0d1117;color:#111}.task.done .tick{background:#43c77a;color:#07120c;border-color:#43c77a}.taskText{width:100%}.taskText>div{display:flex;justify-content:space-between;gap:12px}.taskText b{font-size:14px}.taskText span{font-size:10px;color:#687480}.taskText p{margin:5px 0 0;color:#909ba7;font-size:12px;line-height:1.4}.taskText em{display:inline-block;margin-top:7px;font-style:normal;font-size:10px;color:${ACCENT};background:#2a2112;padding:4px 7px;border-radius:999px}.adaptBtn{width:100%;border:1px dashed #3a4652;background:transparent;color:#aeb7c1;border-radius:16px;padding:13px;margin-top:12px}.cleanCard h2{font-size:22px;margin:8px 0}.cleanCard>p,.muted{color:#8c97a4;font-size:13px;line-height:1.5}.modeGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.modeCard{display:flex;gap:10px;background:#11161d;border:1px solid #202832;border-radius:17px;padding:14px}.modeCard>span{width:29px;height:29px;border-radius:9px;background:#2b2110;color:${ACCENT};display:grid;place-items:center;font-weight:900}.modeCard div{min-width:0}.modeCard b{display:block;font-size:13px}.modeCard small{display:block;color:${ACCENT};font-size:10px;margin:3px 0 7px}.modeCard p{margin:0;color:#7f8a96;font-size:11px;line-height:1.4}.planRow,.historyRow,.exercise{display:flex;align-items:center;gap:12px;border-top:1px solid #222a33;padding:12px 0}.planRow b{width:85px;font-size:12px}.planRow span{color:#9aa5b1;font-size:12px}.projectInput{font-size:20px;font-weight:800;background:transparent;border:0;color:white;width:100%;padding:9px 0}.metricGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.metric{background:#11161d;border:1px solid #202832;border-radius:18px;padding:15px;display:flex;flex-direction:column}.metric span,.metric small{font-size:10px;color:#78838f}.metric strong{font-size:30px;margin:5px 0}.historyRow>div:first-child{width:70px;display:flex;flex-direction:column}.historyRow b{font-size:12px}.historyRow small{font-size:9px;color:#6f7985}.historyRow .miniBar{flex:1}.historyRow>strong{font-size:12px;width:38px;text-align:right}.risk{background:#171d24;border-radius:14px;padding:13px}.risk b{font-size:13px}.risk p{font-size:12px;color:#8d98a4;margin:5px 0 0;line-height:1.5}.fieldRow>label{flex:1}.exercise span{width:25px;height:25px;border-radius:8px;background:#2b2110;color:${ACCENT};display:grid;place-items:center;font-size:11px}.exercise b{flex:1;font-size:12px}.exercise small{color:#687480;font-size:10px}label{display:flex;flex-direction:column;gap:6px;color:#818c98;font-size:11px;margin:10px 0}input,select,textarea{width:100%;background:#0d1218;color:#eef2f6;border:1px solid #2a333d;border-radius:12px;padding:11px}textarea{min-height:74px;resize:vertical}.overlay{position:fixed;inset:0;background:#000b;display:flex;align-items:flex-end;justify-content:center;z-index:30}.modal{width:min(560px,100%);max-height:92vh;overflow:auto;background:#121820;border:1px solid #2a333d;border-radius:24px 24px 0 0;padding:20px 18px 28px}.modalHead{display:flex;justify-content:space-between;align-items:flex-start}.modalHead h2{margin:5px 0 12px}.modalHead>button{border:0;background:#252d36;color:#dce2e8;width:32px;height:32px;border-radius:10px;font-size:20px}.choiceGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.choiceGrid button{border:1px solid #303a45;background:#0e1319;color:#9ca7b3;border-radius:13px;padding:11px;text-align:left;font-size:11px}.choiceGrid button.selected{border-color:${ACCENT};color:${ACCENT};background:#211a0e}.preview{background:#171d24;border-radius:14px;padding:13px;margin:12px 0}.preview b{font-size:12px}.preview p{font-size:11px;color:#8b96a2;line-height:1.5;margin:5px 0}.primary{width:100%;margin-top:8px}.secondaryFull{width:100%;margin-top:8px;border:0;background:#222a33;color:#c4cbd3;border-radius:14px;padding:12px}nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(560px,100%);display:grid;grid-template-columns:repeat(4,1fr);background:#0e1319eF;border-top:1px solid #252d36;backdrop-filter:blur(16px);padding:9px 8px 12px;z-index:20}nav button{border:0;background:transparent;color:#66717d;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px}nav button span{font-size:18px;height:21px}nav button.active{color:${ACCENT}}@media(max-width:390px){.modeGrid{grid-template-columns:1fr}.heroMetrics{gap:8px}.choiceGrid{grid-template-columns:1fr}.app{padding-left:13px;padding-right:13px}}
`;

export default App;

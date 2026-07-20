import { useEffect, useMemo, useState } from "react";

const ACCENT = "#F59E0B";
const todayKey = () => new Date().toISOString().slice(0, 10);
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const baseRoutine = [
  { id: "wake", icon: "☀️", title: "Acordar e começar o dia", time: "07:00", full: "Levantar, água e preparar o dia", reduced: "Levantar e beber água", minimum: "Sentar na cama e beber água", category: "rotina" },
  { id: "project", icon: "💻", title: "Projeto principal", time: "08:05", full: "60 minutos de trabalho concentrado", reduced: "30 minutos numa tarefa concreta", minimum: "10 minutos e definir a próxima ação", category: "projeto" },
  { id: "work", icon: "🏬", title: "Boutique", time: "10:00–14:00", full: "Cumprir o turno e responsabilidades", reduced: "Cumprir o essencial", minimum: "Registar o que ficou pendente", category: "trabalho" },
  { id: "training", icon: "🏋️", title: "Treino ou movimento", time: "17:00", full: "Treino planeado de 45–55 min", reduced: "Treino reduzido de 25–30 min", minimum: "10–15 min de movimento", category: "fisico" },
  { id: "reading", icon: "📚", title: "Leitura", time: "21:00", full: "10 páginas com breve recordação", reduced: "5 páginas", minimum: "1 página", category: "aprendizagem" },
  { id: "shutdown", icon: "🌙", title: "Preparar o sono", time: "22:30", full: "Desligar ecrãs e preparar amanhã", reduced: "Telemóvel fora da cama", minimum: "Definir alarme e deitar", category: "sono" },
];

const workoutPlan = {
  1: ["Agachamento controlado ou leg press", "Supino ou flexões", "Remada", "Peso morto romeno", "Core"],
  3: ["Split squat ou step-up", "Press de ombros", "Puxada ou elevações", "Hip thrust", "Core"],
  6: ["Agachamento leve", "Supino inclinado", "Remada unilateral", "Curl femoral", "Core"],
};

const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const modeLabels = { full: "Plano A", reduced: "Plano B", minimum: "Plano C", recovery: "Plano D" };

function App() {
  const [tab, setTab] = useState("today");
  const [date] = useState(todayKey());
  const [daily, setDaily] = useState(() => load("momentum-daily", {}));
  const [settings, setSettings] = useState(() => load("momentum-settings", {
    wake: "07:00", sleep: "23:00", activeProject: "Plataforma de ideias", maintenanceProject: "Atlas", visionProject: "Goal Gate Hub"
  }));
  const [checkin, setCheckin] = useState(() => load("momentum-checkin", {}));
  const [weekly, setWeekly] = useState(() => load("momentum-weekly", []));
  const [showAdapt, setShowAdapt] = useState(false);
  const [available, setAvailable] = useState("60");
  const [energy, setEnergy] = useState(3);
  const [symptoms, setSymptoms] = useState("none");

  const state = daily[date] || {};
  const today = new Date();
  const dayName = dayNames[today.getDay()];
  const dayWorkout = workoutPlan[today.getDay()] || null;

  const updateDaily = (patch) => {
    const next = { ...daily, [date]: { ...state, ...patch } };
    setDaily(next); save("momentum-daily", next);
  };

  const setTask = (id, patch) => {
    const tasks = { ...(state.tasks || {}), [id]: { ...(state.tasks?.[id] || {}), ...patch } };
    updateDaily({ tasks });
  };

  const selectedMode = (id) => state.tasks?.[id]?.mode || "full";
  const completed = baseRoutine.filter(t => state.tasks?.[t.id]?.done).length;
  const percent = Math.round((completed / baseRoutine.length) * 100);

  const suggestion = useMemo(() => {
    if (symptoms === "strong") return "recovery";
    const mins = Number(available);
    if (mins >= 45 && energy >= 3) return "full";
    if (mins >= 20 && energy >= 2) return "reduced";
    if (mins >= 5) return "minimum";
    return "recovery";
  }, [available, energy, symptoms]);

  const applyAdaptation = () => {
    const tasks = {};
    baseRoutine.forEach(t => tasks[t.id] = { ...(state.tasks?.[t.id] || {}), mode: suggestion });
    updateDaily({ tasks, adaptedAt: new Date().toISOString() });
    setShowAdapt(false);
  };

  useEffect(() => { save("momentum-settings", settings); }, [settings]);
  useEffect(() => { save("momentum-checkin", checkin); }, [checkin]);

  const addWeeklyReview = () => {
    const item = {
      date: new Date().toISOString(),
      worked: checkin.worked || "",
      failed: checkin.failed || "",
      adjustment: checkin.adjustment || "",
      score: checkin.score || 0,
    };
    const next = [item, ...weekly].slice(0, 12);
    setWeekly(next); save("momentum-weekly", next);
    setCheckin({});
  };

  return (
    <div className="app">
      <style>{styles}</style>
      <header>
        <div>
          <div className="eyebrow">MOMENTUM</div>
          <h1>{tab === "today" ? "O teu dia." : tab === "training" ? "Corpo." : tab === "projects" ? "Projetos." : "Revisão."}</h1>
          <p>{dayName} · {new Date().toLocaleDateString("pt-PT")}</p>
        </div>
        <div className="score">{percent}%</div>
      </header>

      {tab === "today" && <main>
        <div className="progress"><span style={{ width: `${percent}%` }} /></div>
        <div className="row between">
          <div><strong>{completed}/{baseRoutine.length}</strong> ações concluídas</div>
          <button className="secondary" onClick={() => setShowAdapt(true)}>Adaptar o dia</button>
        </div>

        <section className="checkin">
          <div className="sectionTitle">CHECK-IN RÁPIDO</div>
          <div className="grid3">
            <label>Energia<select value={state.energy || 3} onChange={e => updateDaily({ energy: Number(e.target.value) })}><option value="1">1 — Muito baixa</option><option value="2">2 — Baixa</option><option value="3">3 — Normal</option><option value="4">4 — Boa</option><option value="5">5 — Excelente</option></select></label>
            <label>Sono<input type="number" min="0" max="12" step="0.5" value={state.sleepHours || ""} onChange={e => updateDaily({ sleepHours: e.target.value })} placeholder="horas" /></label>
            <label>Sintomas<select value={state.symptoms || "none"} onChange={e => updateDaily({ symptoms: e.target.value })}><option value="none">Nenhum</option><option value="light">Ligeiros</option><option value="strong">Fortes</option></select></label>
          </div>
        </section>

        <div className="sectionTitle">PLANO DE HOJE</div>
        {baseRoutine.map(task => {
          const mode = selectedMode(task.id);
          const data = state.tasks?.[task.id] || {};
          const description = mode === "full" ? task.full : mode === "reduced" ? task.reduced : mode === "minimum" ? task.minimum : "Recuperar, registar o motivo e definir a retoma";
          return <article className={`task ${data.done ? "done" : ""}`} key={task.id}>
            <button className="check" onClick={() => setTask(task.id, { done: !data.done })}>{data.done ? "✓" : ""}</button>
            <div className="taskBody">
              <div className="row between"><h3>{task.icon} {task.title}</h3><span className="time">{task.time}</span></div>
              <p>{description}</p>
              <div className="modes">{Object.keys(modeLabels).map(m => <button key={m} className={mode === m ? "active" : ""} onClick={() => setTask(task.id, { mode: m })}>{modeLabels[m]}</button>)}</div>
              {!data.done && <select className="reason" value={data.reason || ""} onChange={e => setTask(task.id, { reason: e.target.value })}>
                <option value="">Motivo, caso não seja cumprido</option><option>Compromisso previsto</option><option>Imprevisto</option><option>Sintomas físicos</option><option>Sono insuficiente</option><option>Energia baixa</option><option>Distração</option><option>Má organização</option><option>Tarefa demasiado grande</option><option>Recuperação consciente</option>
              </select>}
            </div>
          </article>
        })}
        <section className="note"><strong>Regra Momentum:</strong> não acumular hábitos falhados. Retomar no próximo bloco disponível, sem compensações.</section>
      </main>}

      {tab === "training" && <main>
        <section className="heroCard"><div className="sectionTitle">TREINO DE HOJE</div>{dayWorkout ? <><h2>Corpo inteiro · 45–55 min</h2>{dayWorkout.map((e,i)=><div className="exercise" key={e}><span>{i+1}</span>{e}<small>2–3 séries controladas</small></div>)}</> : <><h2>Recuperação ou futebol</h2><p>Nos dias sem musculação, mantém atividade leve ou o futebol planeado. Não acrescentes volume só para “compensar”.</p></>}</section>
        <section className="card"><div className="sectionTitle">REGISTO</div><label>Duração (min)<input value={state.trainingMinutes || ""} onChange={e=>updateDaily({trainingMinutes:e.target.value})} type="number" /></label><label>Esforço 1–10<input value={state.trainingEffort || ""} onChange={e=>updateDaily({trainingEffort:e.target.value})} type="number" min="1" max="10" /></label><label>Dor ou tontura<textarea value={state.trainingNotes || ""} onChange={e=>updateDaily({trainingNotes:e.target.value})} placeholder="Regista sintomas e interrompe se forem fortes." /></label></section>
      </main>}

      {tab === "projects" && <main>
        <section className="project activeProject"><div className="tag">PROJETO ATIVO</div><input className="projectName" value={settings.activeProject} onChange={e=>setSettings({...settings,activeProject:e.target.value})}/><textarea value={state.nextAction || ""} onChange={e=>updateDaily({nextAction:e.target.value})} placeholder="Qual é a próxima ação física e concreta?"/><label>Minutos hoje<input type="number" value={state.projectMinutes || ""} onChange={e=>updateDaily({projectMinutes:e.target.value})}/></label></section>
        <section className="project"><div className="tag">MANUTENÇÃO</div><input className="projectName" value={settings.maintenanceProject} onChange={e=>setSettings({...settings,maintenanceProject:e.target.value})}/><p>Sem novas funcionalidades. Apenas documentação ou correções necessárias.</p></section>
        <section className="project"><div className="tag">VISÃO DE LONGO PRAZO</div><input className="projectName" value={settings.visionProject} onChange={e=>setSettings({...settings,visionProject:e.target.value})}/><p>Guardar ideias sem transformar esta visão num segundo projeto ativo.</p></section>
      </main>}

      {tab === "review" && <main>
        <section className="card"><div className="sectionTitle">REVISÃO SEMANAL</div><label>Nota da semana<select value={checkin.score || ""} onChange={e=>setCheckin({...checkin,score:e.target.value})}><option value="">Selecionar</option><option value="5">Verde — 80%+</option><option value="3">Amarela — 60–79%</option><option value="1">Vermelha — abaixo de 60%</option></select></label><label>O que funcionou?<textarea value={checkin.worked || ""} onChange={e=>setCheckin({...checkin,worked:e.target.value})}/></label><label>O que falhou repetidamente?<textarea value={checkin.failed || ""} onChange={e=>setCheckin({...checkin,failed:e.target.value})}/></label><label>Um único ajuste para a próxima semana<textarea value={checkin.adjustment || ""} onChange={e=>setCheckin({...checkin,adjustment:e.target.value})}/></label><button className="primary" onClick={addWeeklyReview}>Guardar revisão</button></section>
        {weekly.map((r,i)=><section className="reviewItem" key={i}><strong>{new Date(r.date).toLocaleDateString("pt-PT")}</strong><p><b>Funcionou:</b> {r.worked || "—"}</p><p><b>Falhou:</b> {r.failed || "—"}</p><p><b>Ajuste:</b> {r.adjustment || "—"}</p></section>)}
      </main>}

      {showAdapt && <div className="overlay"><div className="modal"><h2>Adaptar o dia</h2><p>Quanto tempo e capacidade tens realmente?</p><label>Tempo disponível<select value={available} onChange={e=>setAvailable(e.target.value)}><option value="60">60+ minutos</option><option value="30">30 minutos</option><option value="10">10–15 minutos</option><option value="0">Sem capacidade real</option></select></label><label>Energia<select value={energy} onChange={e=>setEnergy(Number(e.target.value))}><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option></select></label><label>Sintomas<select value={symptoms} onChange={e=>setSymptoms(e.target.value)}><option value="none">Nenhum</option><option value="light">Ligeiros</option><option value="strong">Fortes</option></select></label><div className="recommend">Recomendação: <strong>{modeLabels[suggestion]}</strong></div><button className="primary" onClick={applyAdaptation}>Aplicar ao dia</button><button className="secondary full" onClick={()=>setShowAdapt(false)}>Cancelar</button></div></div>}

      <nav>{[["today","Hoje","📋"],["training","Treino","🏋️"],["projects","Projetos","💡"],["review","Revisão","📊"]].map(([id,label,icon])=><button key={id} className={tab===id?"active":""} onClick={()=>setTab(id)}><span>{icon}</span>{label}</button>)}</nav>
    </div>
  );
}

const styles = `
*{box-sizing:border-box}body{margin:0;background:#090909;color:#f5f1eb;font-family:Inter,system-ui,-apple-system,sans-serif}.app{max-width:520px;margin:auto;min-height:100vh;padding:0 18px 96px;background:#0c0c0c}header{display:flex;justify-content:space-between;align-items:flex-start;padding:46px 2px 22px}h1{font-size:38px;margin:3px 0 4px;letter-spacing:-1.5px}header p{margin:0;color:#858585;font-size:13px}.eyebrow,.sectionTitle,.tag{font-size:11px;letter-spacing:1.6px;color:${ACCENT};font-weight:800}.score{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;border:2px solid ${ACCENT};font-weight:800}.progress{height:5px;background:#242424;border-radius:10px;overflow:hidden;margin-bottom:14px}.progress span{display:block;height:100%;background:${ACCENT};transition:.3s}.row{display:flex;align-items:center;gap:10px}.between{justify-content:space-between}.secondary,.primary{border:0;border-radius:12px;padding:10px 13px;font-weight:700;cursor:pointer}.secondary{background:#202020;color:#ddd}.primary{background:${ACCENT};color:#111;width:100%;margin-top:8px}.full{width:100%;margin-top:8px}.checkin,.card,.heroCard,.project,.reviewItem,.note{background:#151515;border:1px solid #272727;border-radius:18px;padding:16px;margin:18px 0}.grid3{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px}label{display:flex;flex-direction:column;gap:6px;color:#9a9a9a;font-size:12px;margin:10px 0}input,select,textarea{width:100%;background:#0f0f0f;color:#f2f2f2;border:1px solid #2b2b2b;border-radius:10px;padding:11px;font:inherit}textarea{min-height:78px;resize:vertical}.task{display:flex;gap:12px;background:#151515;border:1px solid #282828;border-radius:17px;padding:14px;margin:9px 0}.task.done{opacity:.62;border-color:#1f6f45}.check{width:34px;height:34px;flex:0 0 34px;border-radius:10px;border:2px solid #383838;background:transparent;color:white;font-size:18px}.done .check{background:#22c55e;border-color:#22c55e}.taskBody{width:100%}.task h3{font-size:15px;margin:0}.task p{color:#939393;font-size:13px;line-height:1.4;margin:6px 0 10px}.time{font-size:11px;color:#666}.modes{display:flex;gap:5px;flex-wrap:wrap}.modes button{font-size:10px;background:#202020;color:#777;border:1px solid #292929;border-radius:20px;padding:5px 8px}.modes button.active{background:${ACCENT}22;color:${ACCENT};border-color:${ACCENT}66}.reason{margin-top:9px;font-size:11px}.note{font-size:13px;line-height:1.5;border-left:3px solid ${ACCENT}}.heroCard h2{font-size:22px}.exercise{display:grid;grid-template-columns:28px 1fr;gap:8px;align-items:center;border-top:1px solid #262626;padding:12px 0}.exercise span{width:24px;height:24px;border-radius:8px;background:${ACCENT}22;color:${ACCENT};display:grid;place-items:center;font-weight:800}.exercise small{grid-column:2;color:#727272}.projectName{font-size:21px;font-weight:800;border:0;padding-left:0;background:transparent}.project p{color:#888;font-size:13px}.activeProject{border-color:${ACCENT}55}.reviewItem p{color:#aaa;font-size:13px}.overlay{position:fixed;inset:0;background:#000b;display:grid;place-items:center;padding:20px;z-index:20}.modal{width:min(430px,100%);background:#171717;border:1px solid #333;border-radius:22px;padding:20px}.modal h2{margin-top:0}.modal p{color:#999}.recommend{padding:13px;background:${ACCENT}18;color:${ACCENT};border-radius:12px;margin:14px 0}nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(520px,100%);display:grid;grid-template-columns:repeat(4,1fr);background:#111;border-top:1px solid #292929;padding:9px 8px 12px;z-index:10}nav button{background:transparent;border:0;color:#666;font-size:10px;display:flex;flex-direction:column;align-items:center;gap:4px}nav button span{font-size:18px}nav button.active{color:${ACCENT}}
`;

export default App;

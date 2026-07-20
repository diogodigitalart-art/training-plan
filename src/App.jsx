import{useState,useMemo,useEffect,useCallback,useRef}from"react";
/* ══ UTILS ══ */
const S=new Date(2026,4,11),E=new Date(2026,11,31);
const fmt=d=>`${d.getDate()}/${d.getMonth()+1}`;
const fmtD=d=>{const m=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];return`${d.getDate()} ${m[d.getMonth()]}`};
const add=(d,n)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r};
const same=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const dk=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const db=(a,b)=>Math.floor((b-a)/864e5);
const ls=(k,d)=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):d}catch{return d}};
const ss=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

/* ══ PHASES ══ */
const PH=[
  {id:1,n:"Readaptação",w:[0,2],c:"#4ECDC4",i:"🌱",d:"Reativar corpo e hábito",g:["Hábito","Reab. joelho","Base"],pl:"Se é fácil: ótimo. Não aumentes. Consistência > intensidade.",rc:"Sono 7-8h. Couch stretch diário. Caminhada 15min pós-jantar."},
  {id:2,n:"Base Aeróbica",w:[3,7],c:"#3B82F6",i:"🫀",d:"Motor aeróbico: Z2 prolongada",g:["Z2 35-40min","Resistência","Capacidade"],pl:"Adaptações internas (4-6 sem). Sinal: mesma velocidade, FC mais baixa.",rc:"Foam roller 5min. 3-4L água. Descanso total dom c/ jogo."},
  {id:3,n:"Capacidade",w:[8,13],c:"#F59E0B",i:"⚡",d:"HIIT + manutenção aeróbica",g:["HIIT 1x/sem","Sprints","Explosão"],pl:"HIIT estagna? Reduz descanso 15s a cada 2 sem. Esgotado? 2 sem Z2.",rc:"Nunca HIIT consecutivo. Banho frio 3min pós-HIIT. Magnésio."},
  {id:4,n:"Afinação",w:[14,16],c:"#EF4444",i:"🎯",d:"Volume reduzido, intensidade alta",g:["Simular jogo","Taper","Pronto"],pl:"Não procuras melhorar — afinar. Cansado = REDUZ.",rc:"Sono 8h+. Zero álcool. Visualização 5min antes dormir."},
  {id:5,n:"Época",w:[17,28],c:"#8B5CF6",i:"⚽",d:"Manutenção entre jogos",g:["Manter","Recuperar","Prevenir"],pl:"Performance cai? Verifica sono e nutrição antes de adicionar treino.",rc:"Pós-jogo: 10min alongamentos. Nunca HIIT 48h pré-jogo."},
  {id:6,n:"Pausa",w:[29,33],c:"#EC4899",i:"🎄",d:"Dezembro — descanso ativo",g:["Descanso","Recuperar","Planear"],pl:"Descanso programado separa quem dura de quem lesiona.",rc:"Flexibilidade total. Caminhadas > ginásio."},
];
const gp=wn=>PH.find(p=>wn>=p.w[0]&&wn<=p.w[1])||PH[5];

/* ══ STRUCTURE ══ */
const DN=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];
const DF=["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const GD={0:{l:"Peito & Tríceps",i:"🏋️",m:"Peitoral, tríceps, deltóide ant."},2:{l:"Ombro & Abs",i:"🏋️",m:"Deltóides, trapézio, core"},4:{l:"Pernas & Glúteos",i:"🦵",m:"Quads, isquios, glúteos, gémeos"},5:{l:"Costas & Bíceps",i:"💪",m:"Dorsal, rombóides, bíceps"}};

const ABS=new Date(2026,4,11);
function abInfo(date){const d=db(ABS,date);if(d<0||d>=300)return null;let lv,bl;if(d<60){lv="Iniciante";bl="1/2"}else if(d<120){lv="Iniciante";bl="2/2"}else if(d<180){lv="Intermédio";bl=""}else if(d<240){lv="Avançado";bl="1/2"}else{lv="Avançado";bl="2/2"}return{lv,bl,rest:d%4===3,n:d+1,c:lv==="Iniciante"?"#4ECDC4":lv==="Intermédio"?"#F59E0B":"#EF4444"}}

function acts(date){
  const dw=date.getDay()===0?6:date.getDay()-1,a=[],ab=abInfo(date);
  if(GD[dw])a.push({id:"gym",l:GD[dw].l,e:GD[dw].i,sub:GD[dw].m});
  if(dw===1||dw===3||dw===6)a.push({id:"cardio",l:"Cardio",e:"❤️‍🔥",sub:"Zona 2"});
  if(dw===1||dw===3||dw===6)a.push({id:"knee",l:"Reab. Joelho",e:"🦵",sub:"ATG System"});
  if(ab&&!ab.rest)a.push({id:"abs",l:"Abdominais",e:"🔥",sub:`${ab.lv} • Dia ${ab.n}`});
  if(dw===6)a.push({id:"football",l:"Futebol",e:"⚽",sub:"Jogo / Treino"});
  return a;
}
/* ══ CARDIO ══ */
function cardio(wn,dw){
  const p=gp(wn);
  const machines={1:"Elíptica",3:"Remo",6:"Bicicleta"};
  const m=machines[dw]||"Livre";
  if(p.id===1)return{t:`${m} — Z2`,dur:"20 min",z:"Zona 2",steps:["3 min aquecimento","14 min zona 2 constante","3 min retorno"],tip:dw===6?"Com jogo → jogo é o cardio.":null};
  if(p.id===2){const d=wn<=4?"30":"35-40";return{t:`${dw===3?"Remo":m} — Z2 Longa`,dur:d+" min",z:"Zona 2",steps:["5 min aquecimento",`${wn<=4?"20":"25-30"} min zona 2`,"5 min retorno"],tip:dw===6?"Com jogo → jogo é o cardio.":null}}
  if(p.id===3){if(dw===3)return{t:"Remo — HIIT",dur:"25-30 min",z:"Zona 4-5",steps:["5 min aquecimento","30s FUNDO → 90s leve × 8-10","5 min retorno"],tip:"Dás tudo nos intervalos fortes."};return{t:`${m} — Z2`,dur:"30-35 min",z:"Zona 2",steps:["5 min aquecimento","20-25 min zona 2","5 min retorno"],tip:dw===6?"Com jogo → jogo é o cardio.":null}}
  if(p.id===4){if(dw===1)return{t:"Elíptica — Intervalos",dur:"25 min",z:"Mista",steps:["5 min aquecimento","20s máx → 40s leve × 15","5 min retorno"],tip:null};return{t:`${m} — Z2`,dur:"25 min",z:"Zona 2",steps:["5 min aquecimento","15 min zona 2","5 min retorno"],tip:dw===6?"Com jogo → jogo é o cardio.":null}}
  if(p.id===5){if(dw===3&&wn%2===0)return{t:"Remo — HIIT Curto",dur:"22-25 min",z:"Zona 4-5",steps:["5 min aquecimento","30s forte → 90s leve × 6-8","5 min retorno"],tip:"HIIT cada 2 semanas."};return{t:`${m} — Z2`,dur:"25-30 min",z:"Zona 2",steps:["5 min aquecimento","15-20 min zona 2","5 min retorno"],tip:dw===6?"Com jogo → jogo é o cardio.":null}}
  return{t:"Livre",dur:"20-25 min",z:"Z2",steps:["Máquina que apetecer. Sem regras."],tip:"Manter hábito."};
}

/* ══ KNEE REHAB ══ */
const KA=[
  {n:"Backwards Walking",s:"5-10 min",w:"Tibial + VMO"},
  {n:"Tib Raises",s:"1×25 + 1×50",w:"Absorção impacto"},
  {n:"FHL + KOT Calf Raises",s:"1×25 + 1×50",w:"Gémeos → protege joelho"},
  {n:"Patrick Step Ups",s:"3×20",w:"VMO estabiliza rótula"},
  {n:"Elephant Walks",s:"3×10/lado",w:"Isquios flexíveis"},
  {n:"ATG Split Squat",s:"3×8/lado",w:"Quad+glúteo. SEM peso."},
  {n:"Jefferson Curls",s:"3×5",w:"Cadeia posterior"},
  {n:"Couch Stretch",s:"30s/lado",w:"Flexores da anca"},
];
const KB=[
  {n:"Backwards Walking",s:"5 min",w:"Blood flow"},
  {n:"Wall Sit",s:"3×30-45s",w:"Quad isométrico"},
  {n:"Hamstring Bridge ISO",s:"2×45-60s",w:"Isquios"},
  {n:"Couch Stretch",s:"30s/lado",w:"Flexores"},
  {n:"Elephant Walks",s:"1×10/lado",w:"Flexibilidade"},
  {n:"Straight Leg Raises",s:"2×50",w:"Isola quad"},
  {n:"Slant Calf Stretch",s:"30s/lado",w:"Tornozelo"},
];

/* ══ WEEKS ══ */
function genW(){const w=[];let c=new Date(S),n=0;while(c<=E){const d=[];for(let i=0;i<7;i++){const dt=add(c,i);if(dt>E)break;d.push(dt)}w.push({n,s:new Date(c),e:d[d.length-1],d,p:gp(n)});c=add(c,7);n++}return w}

/* ══ MOTIVATION ══ */
const QUOTES=[
  "Trata-te como um projeto que merece investimento.",
  "Movimento > perfeição. Todos os dias.",
  "Não negocies contigo próprio. Age.",
  "Daqui a 45 dias, o teu pensamento vai ser mais limpo, as tuas ações mais automáticas.",
  "Escolhe quem vais ser nos próximos 12 meses. Começa a comportar-te assim agora.",
  "Zero distrações, zero trabalho de imitação. Só o que dá resultado real.",
  "Primeiro arruma o quarto, depois constrói o foguetão.",
  "Confiança interior aparece quando páras de negociar contigo e começas a agir.",
  "Melhora 1% de cada vez. Não te prendas ao resultado — prende-te à consistência.",
  "Sono vem primeiro. Sem ele, tudo o resto desmorona.",
  "Substitui scrolling por podcasts, audiobooks ou silêncio.",
  "2 horas de manhã no que realmente importa. Sem telefone.",
  "Daqui a 90 dias vais ser irreconhecível. Mas hoje é o dia que conta.",
];

/* ══ BENEFITS TIMELINE ══ */
const BEN=[
  {w:1,t:"Primeira semana",items:["Humor melhora — endorfinas + sono melhor","Coração começa a adaptar-se — FC repouso baixa","Joelho lubrificado — líquido sinovial a fluir"]},
  {w:3,t:"3 semanas",items:["Metabolismo reativado — corpo queima gordura em Z2","Conexões neuromusculares a reconectar","Sono mais profundo, mais hormona de crescimento"]},
  {w:6,t:"6 semanas",items:["Mais mitocôndrias e capilares — aguentas mais","~1.5-3kg gordura perdidos — roupa mais larga","Joelho mais estável — menos dor em escadas"]},
  {w:10,t:"10 semanas",items:["Sprints mais rápidos, recuperação mais curta","Mais carga no ginásio — sobrecarga progressiva funciona","Gordura visível a reduzir em coxas e abdómen"]},
  {w:14,t:"Pré-época",items:["Aguentas 90 min — não ficas para trás no 2º tempo","Mudanças de direção sem medo — joelho protegido","Confiança mental — sabes que fizeste o trabalho"]},
  {w:20,t:"Em época",items:["Colegas de equipa notam a diferença","~5-8kg gordura total perdidos — visual transformado","Base aeróbica impede fadiga acumulada semana a semana"]},
];
/* ══ STYLES ══ */
const V={"--bg":"#0C0C0C","--s1":"#161616","--s2":"#1E1E1E","--brd":"#2A2A2A","--t1":"#F5F0EB","--t2":"#8A8A8A","--t3":"#555"};

export default function App(){
  const weeks=useMemo(genW,[]);
  const[wi,setWi]=useState(0);
  const[di,setDi]=useState(0);
  const[tab,setTab]=useState("today");
  const[ck,setCk]=useState(()=>{
    try{const o=localStorage.getItem("training-plan-checked");if(o){const od=JSON.parse(o),n=ls("tp3",{});let ch=false;Object.keys(od).forEach(k=>{if(!n[k]){n[k]={all:1};ch=true}});if(ch)ss("tp3",n)}}catch{}
    return ls("tp3",{});
  });
  const[wn,setWn]=useState(ls("tp3-wn",{}));
  const[detail,setDetail]=useState(null);
  const today=new Date();
  const w=weeks[wi],ph=w.p,dd=w.d[di]||w.d[0];
  const dw=dd.getDay()===0?6:dd.getDay()-1;
  const dActs=acts(dd),dKey=dk(dd),dCk=ck[dKey]||{};
  const done=dActs.filter(a=>dCk[a.id]||dCk.all).length;
  const allDone=done===dActs.length&&dActs.length>0;
  const ab=abInfo(dd);
  const cd=dw===1||dw===3||dw===6?cardio(w.n,dw):null;
  const knee=(dw===1||dw===6)?KA:(dw===3?KB:null);
  const q=useMemo(()=>QUOTES[Math.floor(Math.random()*QUOTES.length)],[tab]);
  const wRef=useRef(null);

  useEffect(()=>{const i=weeks.findIndex(w=>today>=w.s&&today<=w.e);if(i>=0){setWi(i);const j=weeks[i].d.findIndex(d=>same(d,today));if(j>=0)setDi(j)}},[]);
  useEffect(()=>{if(wRef.current){const el=wRef.current.children[wi];if(el)el.scrollIntoView({behavior:"smooth",inline:"center"})}},[wi]);

  const tog=(key,aid)=>{setCk(p=>{const n={...p},d=n[key]||{};d[aid]?delete d[aid]:d[aid]=true;Object.keys(d).length?n[key]=d:delete n[key];ss("tp3",n);return n})};

  const totalDone=useMemo(()=>{let t=0;Object.values(ck).forEach(d=>{if(d.all)t+=4;else t+=Object.keys(d).length});return t},[ck]);
  const weekDone=w.d.filter(d=>{const a=acts(d),c=ck[dk(d)]||{};return a.length>0&&a.every(x=>c[x.id]||c.all)}).length;

  const wk=wn[w.n]||{};
  const setWk=(f,v)=>{const n={...wn,[w.n]:{...wk,[f]:v}};setWn(n);ss("tp3-wn",n)};
  const Btn=({v,cur,onset,children})=><button onClick={()=>onset(v)} style={{padding:"8px 14px",borderRadius:20,fontSize:13,fontWeight:600,background:cur===v?ph.c+"20":"transparent",color:cur===v?ph.c:"var(--t2)",border:`1px solid ${cur===v?ph.c+"50":"var(--brd)"}`,cursor:"pointer",transition:"all .2s"}}>{children}</button>;

  return<div style={{...V,background:"var(--bg)",color:"var(--t1)",minHeight:"100vh",fontFamily:"'Outfit',system-ui,sans-serif",maxWidth:480,margin:"0 auto",paddingBottom:90,WebkitFontSmoothing:"antialiased"}}>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
  <style>{`*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{display:none}button{font-family:inherit}`}</style>

  {/* ═══ TODAY ═══ */}
  {tab==="today"&&<div style={{padding:"0 20px"}}>
    <div style={{paddingTop:56,paddingBottom:20}}>
      <div style={{fontSize:13,color:"var(--t2)",marginBottom:4,fontWeight:500}}>{fmtD(dd)} • {DF[dw]}</div>
      <div style={{fontSize:36,fontWeight:900,lineHeight:1.1,letterSpacing:"-1px"}}>{allDone?"Tudo feito. 💪":"O teu dia."}</div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
        <div style={{height:4,flex:1,background:"var(--s2)",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:`${dActs.length?done/dActs.length*100:0}%`,background:ph.c,borderRadius:2,transition:"width .4s"}}/></div>
        <span style={{fontSize:12,color:"var(--t2)",fontWeight:600}}>{done}/{dActs.length}</span>
      </div>
    </div>

    <div style={{display:"inline-flex",alignItems:"center",gap:6,background:ph.c+"12",border:`1px solid ${ph.c}30`,borderRadius:20,padding:"6px 14px",marginBottom:20}}>
      <span style={{fontSize:14}}>{ph.i}</span>
      <span style={{fontSize:12,fontWeight:600,color:ph.c}}>{ph.n}</span>
      <span style={{fontSize:11,color:"var(--t2)"}}>S{w.n+1}</span>
    </div>

    <div ref={wRef} style={{display:"flex",gap:6,overflowX:"auto",marginBottom:24,paddingBottom:4}}>
      {w.d.map((d,i)=>{const dw2=d.getDay()===0?6:d.getDay()-1,sel=i===di,td=same(d,today),a=acts(d),c=ck[dk(d)]||{},dn=a.length>0&&a.every(x=>c[x.id]||c.all);
        return<button key={i} onClick={()=>setDi(i)} style={{minWidth:46,padding:"8px 4px",borderRadius:14,cursor:"pointer",background:sel?ph.c:dn?"#22C55E18":"var(--s1)",color:sel?"#fff":"var(--t1)",border:td&&!sel?`2px solid ${ph.c}60`:`1.5px solid ${sel?"transparent":"var(--brd)"}`,display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .2s"}}>
          <span style={{fontSize:10,fontWeight:700,opacity:sel?1:.4}}>{DN[dw2]}</span>
          <span style={{fontSize:16,fontWeight:800}}>{d.getDate()}</span>
          {dn&&!sel&&<span style={{fontSize:8}}>✅</span>}
          {td&&!sel&&<div style={{width:4,height:4,borderRadius:2,background:ph.c}}/>}
        </button>
      })}
    </div>

    <div style={{fontSize:11,fontWeight:700,color:"var(--t3)",letterSpacing:1.5,marginBottom:12}}>ATIVIDADES</div>
    {dActs.map(a=>{const done2=dCk[a.id]||dCk.all;return<div key={a.id} style={{background:"var(--s1)",border:`1px solid ${done2?"#22C55E30":"var(--brd)"}`,borderRadius:16,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,transition:"all .2s"}}>
      <button onClick={()=>tog(dKey,a.id)} style={{width:32,height:32,borderRadius:10,border:done2?"none":`2px solid var(--brd)`,background:done2?"#22C55E":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,transition:"all .2s",flexShrink:0}}>{done2?"✓":""}</button>
      <div style={{flex:1,cursor:"pointer"}} onClick={()=>setDetail(a.id)}>
        <div style={{fontWeight:700,fontSize:15}}>{a.e} {a.l}</div>
        <div style={{fontSize:12,color:"var(--t2)",marginTop:1}}>{a.sub}</div>
      </div>
      <span style={{fontSize:14,color:"var(--t3)",cursor:"pointer"}} onClick={()=>setDetail(a.id)}>›</span>
    </div>})}

    {detail==="cardio"&&cd&&<div style={{background:"var(--s1)",border:`1px solid ${ph.c}30`,borderRadius:20,padding:20,marginTop:8,marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:800,fontSize:17}}>{cd.t}</div><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      <div style={{display:"flex",gap:8,marginBottom:14}}><span style={{background:ph.c+"18",color:ph.c,fontSize:11,padding:"4px 10px",borderRadius:10,fontWeight:600}}>{cd.z}</span><span style={{background:"var(--s2)",color:"var(--t2)",fontSize:11,padding:"4px 10px",borderRadius:10,fontWeight:600}}>{cd.dur}</span></div>
      {cd.steps.map((s,i)=><div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"center"}}><div style={{width:22,height:22,borderRadius:7,background:ph.c+"20",color:ph.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{i+1}</div><span style={{fontSize:13,color:"var(--t1)",lineHeight:1.4}}>{s}</span></div>)}
      {cd.tip&&<div style={{marginTop:8,padding:10,background:ph.c+"08",borderRadius:10,fontSize:12,color:ph.c}}>{cd.tip}</div>}
    </div>}

    {detail==="knee"&&knee&&<div style={{background:"var(--s1)",border:"1px solid #EF444430",borderRadius:20,padding:20,marginTop:8,marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><div style={{fontWeight:800,fontSize:17}}>🦵 Reab. Joelho</div><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      <div style={{fontSize:11,color:"#EF4444",fontWeight:600,marginBottom:14}}>⚠️ Zero dor. Se dói → reduz.</div>
      {knee.map((ex,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<knee.length-1?"1px solid var(--brd)":"none"}}>
        <div><div style={{fontSize:13,fontWeight:600}}>{ex.n}</div><div style={{fontSize:11,color:"var(--t2)"}}>{ex.w}</div></div>
        <span style={{fontSize:11,color:"var(--t3)",fontWeight:600,whiteSpace:"nowrap"}}>{ex.s}</span>
      </div>)}
    </div>}

    {detail==="gym"&&GD[dw]&&<div style={{background:"var(--s1)",border:"1px solid var(--brd)",borderRadius:20,padding:20,marginTop:8,marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:800,fontSize:17}}>{GD[dw].i} {GD[dw].l}</div><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      <div style={{fontSize:13,color:"var(--t2)"}}>{GD[dw].m}</div>
      {dw===4&&<div style={{marginTop:10,padding:10,background:"#F59E0B10",borderRadius:10,fontSize:12,color:"#F59E0B"}}>Coordena com reab. joelho.</div>}
    </div>}

    <div style={{marginTop:20,marginBottom:12,padding:20,background:"var(--s1)",borderRadius:16,borderLeft:`3px solid ${ph.c}`}}>
      <div style={{fontSize:14,fontWeight:500,lineHeight:1.6,fontStyle:"italic",color:"var(--t2)"}}>{q}</div>
    </div>
  </div>}
  {/* ═══ PROGRESS ═══ */}
  {tab==="progress"&&<div style={{padding:"0 20px"}}>
    <div style={{paddingTop:56,paddingBottom:24}}>
      <div style={{fontSize:36,fontWeight:900,lineHeight:1.1,letterSpacing:"-1px"}}>O teu caminho.</div>
      <div style={{fontSize:13,color:"var(--t2)",marginTop:8}}>Semana {w.n+1} de 34 • {weekDone}/{w.d.length} dias feitos</div>
    </div>

    <div style={{background:"var(--s1)",borderRadius:16,padding:16,marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:700,color:"var(--t3)",letterSpacing:1.5,marginBottom:12}}>FASES</div>
      <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",gap:2,marginBottom:14}}>
        {PH.map(p=>{const span=p.w[1]-p.w[0]+1;return<div key={p.id} style={{flex:span,background:w.n>=p.w[0]?p.c:p.c+"25",borderRadius:3,position:"relative"}}>{w.n>=p.w[0]&&w.n<=p.w[1]&&<div style={{position:"absolute",top:-4,right:0,width:3,height:14,background:"#fff",borderRadius:2}}/>}</div>})}
      </div>
      {PH.map(p=>{const cur=w.n>=p.w[0]&&w.n<=p.w[1],past=w.n>p.w[1];return<div key={p.id} onClick={()=>{setWi(weeks.findIndex(wk2=>wk2.n===p.w[0]));setDi(0);setTab("today")}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",cursor:"pointer",opacity:past?1:cur?1:.35}}>
        <span style={{fontSize:16}}>{past?"✅":p.i}</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:cur?700:500,color:cur?p.c:"var(--t1)"}}>{p.n}{cur?" ← agora":""}</div></div>
        <span style={{fontSize:10,color:"var(--t3)"}}>S{p.w[0]+1}–{p.w[1]+1}</span>
      </div>})}
    </div>

    <div style={{fontSize:11,fontWeight:700,color:"var(--t3)",letterSpacing:1.5,marginBottom:12}}>PARA QUE ESTÁS A TRABALHAR</div>
    {BEN.map((b,i)=>{const passed=w.n>=b.w,cur=passed&&(i===BEN.length-1||w.n<BEN[i+1].w);return<div key={i} style={{marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <div style={{width:28,height:28,borderRadius:10,background:passed?ph.c:"var(--s2)",color:passed?"#fff":"var(--t3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{passed?"✓":b.w}</div>
        <div style={{fontWeight:700,fontSize:14,color:passed?"var(--t1)":"var(--t3)"}}>{b.t}{cur?" ← estás aqui":""}</div>
      </div>
      {b.items.map((item,j)=><div key={j} style={{marginLeft:38,padding:"6px 0",fontSize:13,color:passed?"var(--t2)":"var(--t3)",lineHeight:1.5,opacity:passed?1:.4}}>{passed?"✅":"○"} {item}</div>)}
    </div>})}

    <div style={{background:"var(--s1)",borderRadius:16,padding:20,marginTop:8,borderLeft:`3px solid ${ph.c}`}}>
      <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>Quem estás a tornar-te</div>
      <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.7}}>
        Escolheste ser o atleta que volta mais forte.<br/>
        Cada dia que marcas ✅ é prova disso.<br/>
        Não negocies contigo — age.
      </div>
    </div>
  </div>}
  {/* ═══ GUIDE ═══ */}
  {tab==="guide"&&<div style={{padding:"0 20px"}}>
    <div style={{paddingTop:56,paddingBottom:24}}>
      <div style={{fontSize:36,fontWeight:900,lineHeight:1.1,letterSpacing:"-1px"}}>Guias.</div>
      <div style={{fontSize:13,color:"var(--t2)",marginTop:8}}>Tudo o que precisas saber, quando precisares.</div>
    </div>

    {[
      {id:"food",e:"🍗",t:"Nutrição",sub:"~2000 kcal • ~140g proteína"},
      {id:"knee2",e:"🦵",t:"Reab. Joelho",sub:"ATG System — Sessão A & B"},
      {id:"rec",e:"😴",t:"Recovery & Plateau",sub:"Protocolo atual: "+ph.n},
      {id:"zones",e:"❤️",t:"Zonas FC",sub:"Teste da fala"},
      {id:"abs2",e:"🔥",t:"Desafio Abs",sub:ab?`Dia ${ab.n}/300 • ${ab.lv}`:"—"},
      {id:"neat",e:"🚶",t:"NEAT",sub:"Movimento fora do treino"},
      {id:"mind",e:"🧠",t:"Mindset",sub:"Os 7 princípios"},
    ].map(g=><div key={g.id} onClick={()=>setDetail(g.id)} style={{background:"var(--s1)",border:"1px solid var(--brd)",borderRadius:16,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
      <span style={{fontSize:22}}>{g.e}</span>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{g.t}</div><div style={{fontSize:12,color:"var(--t2)"}}>{g.sub}</div></div>
      <span style={{color:"var(--t3)"}}>›</span>
    </div>)}

    {detail==="food"&&<div style={{background:"var(--s1)",borderRadius:20,padding:20,marginTop:8,border:"1px solid var(--brd)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontWeight:800,fontSize:17}}>🍗 Nutrição</span><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:16}}>Défice 300-500 kcal. Proteína 1.6-2g/kg. Não é dieta — é estrutura.</div>
      {[{h:"Peq. Almoço",c:"~400 kcal • ~35g prot",f:"Aveia 60g + whey + banana OU 3 ovos + pão integral"},
        {h:"Almoço",c:"~550 kcal • ~40g prot",f:"Frango/peixe 150g + arroz 150g + legumes + azeite"},
        {h:"Lanche",c:"~250 kcal • ~20g prot",f:"Iogurte grego + fruta + nozes OU pão + atum"},
        {h:"Jantar",c:"~500 kcal • ~35g prot",f:"Proteína 150g + legumes + carb moderado"},
        {h:"Snack",c:"~150 kcal • ~15g prot",f:"Queijo fresco + canela OU 2 ovos cozidos"},
      ].map((m,i)=><div key={i} style={{padding:"10px 0",borderBottom:i<4?"1px solid var(--brd)":"none"}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700,fontSize:13}}>{m.h}</span><span style={{fontSize:11,color:"var(--t3)"}}>{m.c}</span></div>
        <div style={{fontSize:12,color:"var(--t2)",marginTop:2}}>{m.f}</div>
      </div>)}
      <div style={{marginTop:14,fontSize:11,fontWeight:700,color:"var(--t3)",letterSpacing:1.5,marginBottom:8}}>TROCAS</div>
      {[["Refrigerantes","Água com gás + limão"],["Pão branco","Integral/centeio"],["Batata frita","Batata doce no forno"],["Molhos","Mostarda ou iogurte c/ especiarias"]].map(([f,t],i)=><div key={i} style={{fontSize:12,marginBottom:4}}><span style={{color:"var(--t3)",textDecoration:"line-through"}}>{f}</span> → <span style={{fontWeight:600}}>{t}</span></div>)}
    </div>}

    {detail==="knee2"&&<div style={{background:"var(--s1)",borderRadius:20,padding:20,marginTop:8,border:"1px solid #EF444430"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontWeight:800,fontSize:17}}>🦵 Sessão A</span><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      {KA.map((ex,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<KA.length-1?"1px solid var(--brd)":"none"}}><div><div style={{fontSize:13,fontWeight:600}}>{ex.n}</div><div style={{fontSize:11,color:"var(--t2)"}}>{ex.w}</div></div><span style={{fontSize:11,color:"var(--t3)",fontWeight:600}}>{ex.s}</span></div>)}
      <div style={{fontWeight:800,fontSize:15,marginTop:18,marginBottom:10}}>Sessão B</div>
      {KB.map((ex,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:i<KB.length-1?"1px solid var(--brd)":"none"}}><div><div style={{fontSize:13,fontWeight:600}}>{ex.n}</div><div style={{fontSize:11,color:"var(--t2)"}}>{ex.w}</div></div><span style={{fontSize:11,color:"var(--t3)",fontWeight:600}}>{ex.s}</span></div>)}
    </div>}

    {detail==="rec"&&<div style={{background:"var(--s1)",borderRadius:20,padding:20,marginTop:8,border:`1px solid ${ph.c}30`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontWeight:800,fontSize:17}}>😴 Recovery</span><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      <div style={{fontSize:12,fontWeight:700,color:ph.c,marginBottom:6}}>{ph.i} {ph.n}</div>
      <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:14}}>{ph.rc}</div>
      <div style={{fontSize:12,fontWeight:700,color:"var(--t3)",marginBottom:6}}>Anti-Plateau</div>
      <div style={{fontSize:13,color:"var(--t2)",lineHeight:1.6,marginBottom:14}}>{ph.pl}</div>
      <div style={{fontSize:12,fontWeight:700,color:"var(--t3)",marginBottom:8}}>Base universal</div>
      {["😴 Sono 7-8h — músculo cresce a dormir","💧 3-4L água/dia — 2% desidratação = -2% força","🧘 10 min mobilidade diária — mesmo sem treino","🚶 Caminhada 15-20min dias sem treino","🍗 Proteína + carb dentro de 2h pós-treino","🧠 Stress alto → reduz volume de treino"].map((r,i)=><div key={i} style={{fontSize:12,color:"var(--t2)",marginBottom:6,lineHeight:1.5}}>{r}</div>)}
    </div>}

    {detail==="zones"&&<div style={{background:"var(--s1)",borderRadius:20,padding:20,marginTop:8,border:"1px solid var(--brd)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontWeight:800,fontSize:17}}>❤️ Zonas FC</span><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      {[{n:"Z1",hr:"50-60%",f:"Conversa + cantar",c:"#94A3B8"},{n:"Z2",hr:"60-70%",f:"Frases completas",c:"#4ECDC4"},{n:"Z3",hr:"70-80%",f:"Frases curtas",c:"#F59E0B"},{n:"Z4",hr:"80-90%",f:"2-3 palavras",c:"#EF4444"},{n:"Z5",hr:"90-100%",f:"Impossível falar",c:"#7C3AED"}].map((z,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<4?"1px solid var(--brd)":"none"}}><span style={{fontWeight:800,fontSize:13,color:z.c,minWidth:24}}>{z.n}</span><div style={{flex:1}}><div style={{fontSize:12}}>{z.hr}</div><div style={{fontSize:11,color:"var(--t2)"}}>{z.f}</div></div>{z.n==="Z2"&&<span style={{fontSize:9,background:z.c+"20",color:z.c,padding:"2px 8px",borderRadius:8,fontWeight:700}}>PRINCIPAL</span>}</div>)}
    </div>}

    {detail==="abs2"&&ab&&<div style={{background:"var(--s1)",borderRadius:20,padding:20,marginTop:8,border:`1px solid ${ab.c}30`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontWeight:800,fontSize:17}}>🔥 Desafio Abs</span><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      <div style={{fontSize:13,color:"var(--t2)",marginBottom:12}}>300 dias: 3 treino + 1 descanso. Dia {ab.n}/300.</div>
      <div style={{height:6,background:"var(--s2)",borderRadius:3,overflow:"hidden",marginBottom:14}}><div style={{height:"100%",width:`${ab.n/300*100}%`,background:`linear-gradient(90deg,#4ECDC4,#F59E0B,#EF4444)`,borderRadius:3}}/></div>
      {[{n:"Iniciante 1",s:0,e:59,c:"#4ECDC4"},{n:"Iniciante 2",s:60,e:119,c:"#4ECDC4"},{n:"Intermédio",s:120,e:179,c:"#F59E0B"},{n:"Avançado 1",s:180,e:239,c:"#EF4444"},{n:"Avançado 2",s:240,e:299,c:"#EF4444"}].map((lv,i)=>{const cd2=ab.n-1,cur=cd2>=lv.s&&cd2<=lv.e,dn=cd2>lv.e,pct=cur?((cd2-lv.s)/(lv.e-lv.s+1))*100:dn?100:0;return<div key={i} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:12,fontWeight:cur?700:400,color:cur?lv.c:"var(--t2)"}}>{lv.n}{cur?" ←":""}</span><span style={{fontSize:10,color:"var(--t3)"}}>{Math.round(pct)}%</span></div><div style={{height:3,background:"var(--s2)",borderRadius:2}}><div style={{height:"100%",width:`${pct}%`,background:lv.c,borderRadius:2}}/></div></div>})}
    </div>}

    {detail==="neat"&&<div style={{background:"var(--s1)",borderRadius:20,padding:20,marginTop:8,border:"1px solid var(--brd)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><span style={{fontWeight:800,fontSize:17}}>🚶 NEAT</span><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      {["⏰ Levanta-te a cada 60 min","📱 Chamadas de pé ou a andar","🚗 Estaciona mais longe","🪜 Escadas sempre","🌙 15-20 min caminhada pós-jantar"].map((n2,i)=><div key={i} style={{fontSize:13,color:"var(--t2)",marginBottom:8,lineHeight:1.5}}>{n2}</div>)}
      <div style={{marginTop:8,fontSize:12,color:ph.c,fontWeight:600}}>Meta: 7-8k passos/dia</div>
    </div>}

    {detail==="mind"&&<div style={{background:"var(--s1)",borderRadius:20,padding:20,marginTop:8,border:`1px solid ${ph.c}30`}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{fontWeight:800,fontSize:17}}>🧠 Mindset</span><button onClick={()=>setDetail(null)} style={{background:"var(--s2)",border:"none",borderRadius:8,padding:"4px 10px",color:"var(--t2)",cursor:"pointer",fontSize:12}}>✕</button></div>
      {[{t:"A Regra Zero",d:"Zero distrações, zero scrolling, zero trabalho de imitação. Só o que dá resultado real. Arruma o quarto antes de construir o foguetão."},
        {t:"Mudança de identidade",d:"Escolhe quem vais ser nos próximos 12 meses — o atleta que volta mais forte. Comporta-te assim agora, mesmo que não te sintas pronto."},
        {t:"2 horas de manhã",d:"Acorda, água, luz solar, trabalha 2h no que realmente importa. Sem telefone. Este hábito sozinho põe-te à frente da maioria."},
        {t:"Promessa de resultados",d:"Publica, partilha, faz abertamente. Melhora 1% de cada vez. Não te prendas ao resultado — prende-te à estabilidade."},
        {t:"Movimento > perfeição",d:"Não esperes pelo plano perfeito. Mexe-te. Todos os dias. Um treino mau vale mais que nenhum treino."},
        {t:"Sistema de energia",d:"20-30 min movimento diário, 2-3L água, comida simples sem picos, zero dopamina à noite. Trata-te como projeto."},
        {t:"45 dias",d:"Pensamento mais limpo. Ações automáticas. Aprendes mais rápido. Confiança interior. Páras de negociar contigo."},
      ].map((p2,i)=><div key={i} style={{marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{i+1}. {p2.t}</div>
        <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.6}}>{p2.d}</div>
      </div>)}
    </div>}
  </div>}
  {/* ═══ CHECK-IN ═══ */}
  {tab==="checkin"&&<div style={{padding:"0 20px"}}>
    <div style={{paddingTop:56,paddingBottom:24}}>
      <div style={{fontSize:36,fontWeight:900,lineHeight:1.1,letterSpacing:"-1px"}}>Semana {w.n+1}.</div>
      <div style={{fontSize:13,color:"var(--t2)",marginTop:8}}>Como te sentiste?</div>
    </div>

    <div style={{display:"flex",gap:4,overflowX:"auto",marginBottom:24}}>
      {weeks.slice(0,Math.min(wi+4,weeks.length)).map((wk2,i)=>{const sel=i===wi;return<button key={i} onClick={()=>{setWi(i);setDi(0)}} style={{minWidth:40,padding:"6px 8px",borderRadius:10,fontSize:11,fontWeight:700,cursor:"pointer",background:sel?ph.c:"var(--s1)",color:sel?"#fff":"var(--t2)",border:`1px solid ${sel?"transparent":"var(--brd)"}`}}>S{wk2.n+1}</button>})}
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div><div style={{fontSize:12,fontWeight:700,color:"var(--t3)",marginBottom:8}}>Energia</div><div style={{display:"flex",gap:6}}><Btn v="low" cur={wk.energy} onset={v=>setWk("energy",v)}>🔋 Baixa</Btn><Btn v="med" cur={wk.energy} onset={v=>setWk("energy",v)}>⚡ Normal</Btn><Btn v="high" cur={wk.energy} onset={v=>setWk("energy",v)}>🔥 Alta</Btn></div></div>

      <div><div style={{fontSize:12,fontWeight:700,color:"var(--t3)",marginBottom:8}}>Joelho</div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Btn v="none" cur={wk.pain} onset={v=>setWk("pain",v)}>✅ Zero</Btn><Btn v="mild" cur={wk.pain} onset={v=>setWk("pain",v)}>😐 Ligeira</Btn><Btn v="mod" cur={wk.pain} onset={v=>setWk("pain",v)}>⚠️ Moderada</Btn><Btn v="bad" cur={wk.pain} onset={v=>setWk("pain",v)}>🛑 Forte</Btn></div></div>

      <div><div style={{fontSize:12,fontWeight:700,color:"var(--t3)",marginBottom:8}}>Cardio</div><div style={{display:"flex",gap:6}}><Btn v="easy" cur={wk.cardio} onset={v=>setWk("cardio",v)}>😴 Fácil</Btn><Btn v="good" cur={wk.cardio} onset={v=>setWk("cardio",v)}>👍 Bem</Btn><Btn v="hard" cur={wk.cardio} onset={v=>setWk("cardio",v)}>😤 Difícil</Btn></div></div>

      <div><div style={{fontSize:12,fontWeight:700,color:"var(--t3)",marginBottom:8}}>Motivação</div><div style={{display:"flex",gap:6}}><Btn v="low" cur={wk.mood} onset={v=>setWk("mood",v)}>😞 Baixa</Btn><Btn v="ok" cur={wk.mood} onset={v=>setWk("mood",v)}>😐 Ok</Btn><Btn v="good" cur={wk.mood} onset={v=>setWk("mood",v)}>😊 Boa</Btn><Btn v="great" cur={wk.mood} onset={v=>setWk("mood",v)}>🔥 Top</Btn></div></div>

      <div><div style={{fontSize:12,fontWeight:700,color:"var(--t3)",marginBottom:8}}>Notas</div>
        <textarea value={wk.note||""} onChange={e=>setWk("note",e.target.value)} placeholder="Vitórias, dores, pensamentos..." style={{width:"100%",minHeight:80,padding:14,borderRadius:14,border:"1px solid var(--brd)",background:"var(--s1)",color:"var(--t1)",fontSize:13,fontFamily:"inherit",resize:"vertical"}}/>
      </div>
    </div>

    {wk.pain==="mod"&&<div style={{marginTop:14,padding:14,background:"#F59E0B10",borderRadius:12,fontSize:12,color:"#F59E0B",lineHeight:1.5}}>⚠️ Dor moderada no joelho. Reduz amplitude nos ATG. Se persistir, fisioterapeuta.</div>}
    {wk.pain==="bad"&&<div style={{marginTop:14,padding:14,background:"#EF444410",borderRadius:12,fontSize:12,color:"#EF4444",lineHeight:1.5}}>🛑 Para reabilitação. Marca fisioterapeuta esta semana.</div>}
    {wk.cardio==="easy"&&<div style={{marginTop:14,padding:14,background:ph.c+"10",borderRadius:12,fontSize:12,color:ph.c,lineHeight:1.5}}>💪 Cardio fácil demais? Podes progredir: +5 min ou sobe resistência.</div>}
  </div>}

  {/* ═══ BOTTOM NAV ═══ */}
  <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"var(--bg)",borderTop:"1px solid var(--brd)",display:"flex",justifyContent:"space-around",padding:"10px 0 28px",zIndex:100}}>
    {[{id:"today",e:"📋",l:"Hoje"},{id:"progress",e:"🏆",l:"Progresso"},{id:"guide",e:"📖",l:"Guias"},{id:"checkin",e:"📊",l:"Check-in"}].map(t=>{const sel=tab===t.id;return<button key={t.id} onClick={()=>{setDetail(null);setTab(t.id)}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",color:sel?ph.c:"var(--t3)",transition:"all .2s",padding:"4px 12px"}}>
      <span style={{fontSize:20}}>{t.e}</span>
      <span style={{fontSize:9,fontWeight:700,letterSpacing:.5}}>{t.l}</span>
    </button>})}
  </div>

  </div>;
}

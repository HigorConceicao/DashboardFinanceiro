// ---------- DADOS INICIAIS ----------
const initialState = {
  months: ["2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10","2025-11","2025-12"],
  monthNames: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  receitas: [2800, 800, 200, 800, 800, 800, 2800, 800, 200, 800, 800, 800],
  despesas: [1355, 1000, 1355, 100, 1355, 1355, 1000, 1355, 100, 1355, 1355, 1000],
  receitaBreakdownBase: [
    { label: "Salário", value: 2800, color: "#24a1c7" },
    { label: "Minijob", value: 550, color: "#4571bd" }
  ],
  despesaBreakdownBase: [
    { label: "Aluguel", value: 670, color: "#d95353ff" },
    { label: "Comida", value: 180, color: "#f97316" },
    { label: "Ticket", value: 58, color: "#06b6d4" },
    { label: "MacBook", value: 120, color: "#8b5cf6" },
    { label: "Uni", value: 100, color: "#3b82f6" },   // <- ADICIONADA vírgula aqui
    { label: "Seguro", value: 32, color: "#f43f5e" },
    { label: "Rayane", value: 45, color: "#ea580c" },
    { label: "TF Bank", value: 150, color: "#fb7185" }
  ]
};

// ---------- PERSISTÊNCIA (localStorage) ----------
const STORAGE_KEY = 'sao_luis_state_v1';
function loadState(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  } catch(e){ return null; }
}
function saveState(state){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e){}
}

let data = loadState() || initialState;

// ---------- Helpers ----------
const fmt = n => Number(n || 0).toLocaleString('pt-BR',{
  style:'currency',
  currency:'EUR',
  minimumFractionDigits:2,
  maximumFractionDigits:2
});
const sum = arr => arr.reduce((a,b)=>a+(b||0),0);

// ---------- despesas por mês ----------
let despesasByMonth = [];
function initDespesasByMonth(){
  const stored = (loadState() || {}).despesasByMonth;
  if(stored && Array.isArray(stored) && stored.length === data.monthNames.length){
    despesasByMonth = stored;
    return;
  }
  despesasByMonth = data.monthNames.map((_,i)=>{
    const totalBase = sum(initialState.despesaBreakdownBase.map(d=>d.value));
    const scale = totalBase > 0 ? (data.despesas[i] / totalBase) : 0;
    return initialState.despesaBreakdownBase.map(b => ({
      label: b.label,
      value: Math.round(b.value * scale * 100) / 100, // preservar centavos
      color: b.color
    }));
  });
}
initDespesasByMonth();

function persistAll(){
  const stateToSave = Object.assign({}, data, { despesasByMonth });
  saveState(stateToSave);
}

// ---------- DOM refs ----------
const kpiReceitas = document.getElementById('kpi-receitas');
const kpiDespesas = document.getElementById('kpi-despesas');
const kpiLucro = document.getElementById('kpi-lucro');
const monthsCards = document.getElementById('monthsCards');
const selectedTitle = document.getElementById('selected-month-title');
const monthFilter = document.getElementById('monthFilter');
const monthButtonsContainer = document.getElementById('monthButtons');

const mainCanvas = document.getElementById('mainChart').getContext('2d');
const donutReceitaCtx = document.getElementById('donutReceita').getContext('2d');
const donutDespesaCtx = document.getElementById('donutDespesa').getContext('2d');

const despesasListDiv = document.getElementById('despesasList');

const despesaCard = document.getElementById('despesa-card');
const embeddedForm = document.getElementById('embeddedExpenseForm');
const embedNome = document.getElementById('embedDespesaNome');
const embedValor = document.getElementById('embedDespesaValor');
const embedCor = document.getElementById('embedDespesaCor');
const embedSalvar = document.getElementById('embedSalvarDespesa');
const embedCancelar = document.getElementById('embedCancelarDespesa');

let currentSelectedIndex = data.monthNames.length - 1; // default last

// ---------- Render month cards & buttons ----------
function renderMonthCards(){
  monthsCards.innerHTML = '';
  data.monthNames.forEach((name, i) => {
    const card = document.createElement('div');
    card.className = 'month-card';
    card.dataset.index = i;
    card.tabIndex = 0;
    card.innerHTML = `<h4>${name}</h4>
      <p class="receita"><strong>Receita:</strong><br>${fmt(data.receitas[i] || 0)}</p>
      <p class="despesa"><strong>Despesa:</strong><br>${fmt(data.despesas[i] || 0)}</p>
      <p class="saldo"><strong>Saldo:</strong><br>${fmt((data.receitas[i] || 0) - (data.despesas[i] || 0))}</p>`;
    monthsCards.appendChild(card);
  });
  attachCardEvents();
}
function renderMonthButtons(){
  monthButtonsContainer.innerHTML = '';
  data.monthNames.forEach((name,i)=>{
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.addEventListener('click', ()=> openEditModal(i));
    monthButtonsContainer.appendChild(btn);
  });
}
renderMonthCards();
renderMonthButtons();

// ---------- Charts init ----------
const mainChart = new Chart(mainCanvas, {
  type: 'line',
  data: {
    labels: data.monthNames.slice(),
    datasets: [
      { label: 'Receitas', data: data.receitas.slice(), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', tension:0.35, pointRadius:4 },
      { label: 'Despesas', data: data.despesas.slice(), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.06)', tension:0.35, pointRadius:4 },
      { label: 'Lucro', data: data.receitas.map((r,i)=> (r||0)-(data.despesas[i]||0)), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.06)', tension:0.35, pointRadius:4 }
    ]
  },
  options: {
    responsive:true,
    maintainAspectRatio:false,
    interaction:{mode:'index',intersect:false},
    plugins:{legend:{position:'top'}},
    scales:{ x:{grid:{display:false}}, y:{beginAtZero:true, grid:{color:'rgba(200,210,220,0.14)'}}}
  }
});

const donutReceita = new Chart(donutReceitaCtx, {
  type:'doughnut',
  data: {
    labels: initialState.receitaBreakdownBase.map(d=>d.label),
    datasets: [{ data: initialState.receitaBreakdownBase.map(d=>d.value), backgroundColor: initialState.receitaBreakdownBase.map(d=>d.color) }]
  },
  options:{ cutout:'68%', radius:'80%', responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
});

const donutDespesa = new Chart(donutDespesaCtx, {
  type:'doughnut',
  data: {
    labels: despesasByMonth[currentSelectedIndex].map(d=>d.label),
    datasets: [{ data: despesasByMonth[currentSelectedIndex].map(d=>d.value), backgroundColor: despesasByMonth[currentSelectedIndex].map(d=>d.color) }]
  },
  options:{ cutout:'68%', radius:'80%', responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
});

// ---------- Update helpers ----------
function updateKPIs(index){
  const r = data.receitas[index] || 0;
  const d = data.despesas[index] || 0;
  kpiReceitas.textContent = fmt(r);
  kpiDespesas.textContent = fmt(d);
  kpiLucro.textContent = fmt(r - d);
  selectedTitle.textContent = `${data.monthNames[index]} — ${data.months[index]}`;
}

function updateMainChart(){
  mainChart.data.labels = data.monthNames.slice();
  mainChart.data.datasets[0].data = data.receitas.slice();
  mainChart.data.datasets[1].data = data.despesas.slice();
  mainChart.data.datasets[2].data = data.receitas.map((r,i)=> (r||0)-(data.despesas[i]||0));
  mainChart.update();
}

function updateDonutsForIndex(index){
  const receitaTotal = data.receitas[index] || 0;
  const baseR = sum(initialState.receitaBreakdownBase.map(b=>b.value));
  const scaleR = baseR>0 ? receitaTotal/baseR : 0;
  const newR = initialState.receitaBreakdownBase.map(b => Math.round(b.value*scaleR*100)/100);
  donutReceita.data.labels = initialState.receitaBreakdownBase.map(b=>b.label);
  donutReceita.data.datasets[0].data = newR;
  donutReceita.update();

  const arr = despesasByMonth[index] || [];
  donutDespesa.data.labels = arr.map(d=>d.label);
  donutDespesa.data.datasets[0].data = arr.map(d=>d.value);
  donutDespesa.data.datasets[0].backgroundColor = arr.map(d=>d.color);

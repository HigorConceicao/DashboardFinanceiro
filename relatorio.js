document.addEventListener("DOMContentLoaded", () => {
  const mesFiltro = document.getElementById("mesFiltro");
  const btnFiltrar = document.getElementById("btnFiltrar");
  const tabelaBody = document.getElementById("tabelaBody");
  const cabecalho = document.getElementById("cabecalhoRelatorio");
  const relatorioMes = document.getElementById("relatorioMes");
  const relatorioUsuario = document.getElementById("relatorioUsuario");
  const btnNovaLinha = document.getElementById("btnNovaLinha");
  const btnPdf = document.getElementById("btnPdf");

  const usuarioLogado = localStorage.getItem("loggedUser") || "Usuário";

  // ============================
  // CORREÇÃO PRINCIPAL !!!
  // Normaliza a data salva
  // ============================
  function normalizarData(d) {
    if (!d) return null;

    // Caso venha "2025-02-20T10:00:00"
    if (d.includes("T")) return d.split("T")[0];

    // Caso venha "20/02/2025"
    if (d.includes("/")) {
      const [dia, mes, ano] = d.split("/");
      return `${ano}-${mes}-${dia}`;
    }

    // Caso já esteja ok
    return d;
  }

  function carregarTabela(mes = "") {
    let dados = JSON.parse(localStorage.getItem("financeiro")) || [];

    // Normaliza datas antes de filtrar
    dados = dados.map(i => ({
      ...i,
      data: normalizarData(i.data)
    }));

    // ================
    // FILTRO POR MÊS
    // ================
    if (mes) {
      dados = dados.filter(i => i.data && i.data.startsWith(mes));
    }

    tabelaBody.innerHTML = "";

    if (dados.length === 0) {
      tabelaBody.innerHTML = `<tr><td colspan="5">Nenhum registro encontrado</td></tr>`;
    } else {
      dados.forEach((item, idx) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td contenteditable="true">${item.nome}</td>
          <td contenteditable="true">${Number(item.valor).toFixed(2)}</td>
          <td>${item.tipo}</td>
          <td>${new Date(item.data).toLocaleDateString("pt-BR")}</td>
          <td>
            <button onclick="editarItem(${idx})" class="btn">Salvar</button>
            <button onclick="apagarItem(${idx})" class="btn alt">Excluir</button>
          </td>`;
        tabelaBody.appendChild(tr);
      });
    }

    cabecalho.style.display = "block";

    relatorioMes.innerText = mes || "Todos os meses";
    relatorioUsuario.innerText = usuarioLogado;

    btnNovaLinha.style.display = "inline-block";
  }

  btnFiltrar.addEventListener("click", () => {
    carregarTabela(mesFiltro.value);
  });

  // gerar PDF
  btnPdf.addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("MoneyMate", 14, 20);
    doc.text(`Mês: ${relatorioMes.innerText}`, 14, 28);
    doc.text(`Usuário: ${usuarioLogado}`, 14, 36);

    doc.autoTable({ html: "#tabelaRelatorio", startY: 45 });

    doc.save(`Relatorio_${relatorioMes.innerText}.pdf`);
  });

  carregarTabela();
});

// =========================
// Funções globais
// =========================
function editarItem(idx) {
  const tabela = document.getElementById("tabelaBody");
  const dados = JSON.parse(localStorage.getItem("financeiro")) || [];
  const tr = tabela.children[idx];

  dados[idx].nome = tr.children[0].innerText;
  dados[idx].valor = parseFloat(tr.children[1].innerText);

  localStorage.setItem("financeiro", JSON.stringify(dados));
  alert("Item atualizado!");
}

function apagarItem(idx) {
  if (!confirm("Deseja realmente apagar este item?")) return;

  const dados = JSON.parse(localStorage.getItem("financeiro")) || [];
  dados.splice(idx, 1);

  localStorage.setItem("financeiro", JSON.stringify(dados));
  document.getElementById("tabelaBody").children[idx].remove();
}

const STORAGE_KEYS = {
  action: "history_action",
  versus: "history_versus",
  initiative: "history_initiative"
};

const COLUMN_LABELS = {
  character: "Personagem",
  dice: "Dado",
  roll: "Rolagem",
  bonus: "Bônus",
  total: "Total",
  timestamp: "Horário"
};

function getHistory(mode) {
  const key = STORAGE_KEYS[mode];
  return JSON.parse(localStorage.getItem(mode) || "[]");
}

console.table(getHistory("history_action"));
console.log(getHistory("history_action"));
console.log(getHistory("history_versus"));
console.log(getHistory("history_initiative"));

const table = document.getElementById('history-table')
const clear = document.getElementById('clear')
clear.addEventListener('click', () => {
    clearHistory("action")
})
// table.appendChild(getHistory("history_action"))

function clearHistory(mode) {
  localStorage.removeItem(STORAGE_KEYS[mode]);
  console.table(getHistory("history_action"));
}

function renderTableFromArray(data, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = ""; // limpa antes

  if (!Array.isArray(data) || data.length === 0) {
    container.innerHTML = "<p>Nenhum registro encontrado.</p>";
    return;
  }

  const table = document.createElement("table");
  table.classList.add("history-table");

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  // pega automaticamente as chaves do primeiro objeto
  const columns = Object.keys(data[0]);

  // cabeçalho
  const headerRow = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = COLUMN_LABELS[col] || col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // linhas
  data.forEach(row => {
    const tr = document.createElement("tr");

    columns.forEach(col => {
      const td = document.createElement("td");

      let value = row[col];

      // se for timestamp, formata
      if (col === "timestamp") {
        value = new Date(value).toLocaleTimeString();
      }

      // se for array (ex: initiative/versus), stringify bonito
      if (Array.isArray(value)) {
        value = value.map(v => `${v.character}: ${v.total}`).join(" | ");
      }

      td.textContent = value;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

const initiativeHistory = getHistory("history_action");
renderTableFromArray(initiativeHistory, "history-container");

const btnAction = document.getElementById("action-mode");
const btnVersus = document.getElementById("versus-mode");
const btnInitiative = document.getElementById("initiative-mode");

const characters = document.getElementById("characters");
const dices = document.getElementById("dices");
const bonus = document.getElementById("bonus");
const btnRoll = document.getElementById("roll-dice");

const diceCanvas = document.getElementById("dices-canvas");
const diceTemplate = document.getElementById("dice-template");

const diceInstances = [];

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function lockUI(isLocked) {
  characters.disabled = isLocked;
  dices.disabled = isLocked;

  btnRoll.disabled = isLocked;

  btnAction.disabled = isLocked;
  btnVersus.disabled = isLocked;
  btnInitiative.disabled = isLocked;

  
  diceInstances.forEach((d) => {
    d.charSelect.disabled = isLocked;
    d.bonusInput.disabled = isLocked;
  });
}

function buildResultText(mode, sides, finalDice, bonusValue) {
  if (mode === "initiative") {
    const finalResult = finalDice + bonusValue;
    return `Iniciativa: ${bonusValue} + ${finalDice} = ${finalResult}`;
  }
  
  if (Number(sides) === 20) {
    const finalResult = finalDice + bonusValue;
    if (finalResult === 1) return `${bonusValue} + ${finalDice} = ${finalResult}. Falha Crítica`;
    if (finalResult <= 18) return `${bonusValue} + ${finalDice} = ${finalResult}. Falha!`;
    return `${bonusValue} + ${finalDice} = ${finalResult}. Sucesso!`;
  }

  if (bonusValue === 0) bonusValue = 1;
  const finalResult = finalDice * bonusValue;
  return `${bonusValue} * ${finalDice} = ${finalResult}. Causou ${finalResult} de dano!`;
}

function createDiceInstance() {
  const node = diceTemplate.content.firstElementChild.cloneNode(true);
  
  const svgEl = node.querySelector(".dice-svg");
  const faceEl = node.querySelector(".display-face");
  const resultEl = node.querySelector(".result");
  
  const charSelect = node.querySelector(".char-select");
  const bonusInput = node.querySelector(".bonus-input");
  
  charSelect.addEventListener("change", updateRollButtonState);
  
  if (characters) {
    charSelect.innerHTML = characters.innerHTML;
    charSelect.value = characters.value;
  }
  if (bonus) bonusInput.value = bonus.value || 0;

  let rolling = false;
  const rand = (sides) => 1 + Math.floor(Math.random() * Number(sides));

  async function roll(durationMs = 1500, sides = 20) {
    if (rolling) return null;
    rolling = true;

    svgEl.classList.remove("final-result");
    resultEl.textContent = "Calculando...";

    const finalDice = rand(sides);

    const startInterval = 30;
    const endInterval = 300;
    const start = performance.now();

    while (true) {
      const now = performance.now();
      const time = Math.min((now - start) / durationMs, 1);

      const ease = 1 - Math.pow(1 - time, 3);
      const interval = startInterval + (endInterval - startInterval) * ease;

      faceEl.textContent = rand(sides);

      if (time >= 1) break;
      await wait(interval);
    }

    await wait(600);

    faceEl.textContent = finalDice;
    svgEl.classList.add("final-result");

    const bonusValue = Number(bonusInput.value || 0);
    resultEl.textContent = buildResultText(currentMode, sides, finalDice, bonusValue);

    rolling = false;

    return {
      finalDice,
      bonus: bonusValue,
      total: finalDice + bonusValue,
      character: charSelect.value,
    };
  }

  diceCanvas.appendChild(node);
  updateRollButtonState();

  return {
    node,
    svgEl,
    faceEl,
    resultEl,
    charSelect,
    bonusInput,
    roll,
    syncFromGlobal() {
      if (characters) {
        charSelect.innerHTML = characters.innerHTML;
        charSelect.value = characters.value;
      }
      if (bonus) bonusInput.value = bonus.value || 0;
    },
  };
}

function syncDiceUI() {
  const sides = Number(dices.value);

  diceInstances.forEach((d) => {
    d.faceEl.textContent = "D" + sides;
    d.svgEl.classList.remove("final-result");
    d.resultEl.textContent = "Resultado";
  });
}

function applyDiceScaling() {
  const count = diceInstances.length;

  const base = 1.0;
  const groupShrink = 0.2;
  const perIndexStep = 0.1;

  diceInstances.forEach((d, i) => {
    const s = Math.max(0.50, base - (count - 1) * groupShrink * perIndexStep);
    d.node.style.transform = `scale(${s})`;
    d.node.style.transformOrigin = "center";
  });
}

function setDiceCount(count) {
  while (diceInstances.length < count) diceInstances.push(createDiceInstance());
  while (diceInstances.length > count) {
    const removed = diceInstances.pop();
    removed.node.remove();
  }

  syncDiceUI();
  applyDiceScaling();
  updateRollButtonState();
}

async function rollAllStaggered({ durationMs = 1500, delayMs = 120, sides }) {
  const tasks = diceInstances.map((d, i) => (async () => {
    await wait(i * delayMs);
    return d.roll(durationMs, sides);
  })());

  return Promise.all(tasks);
}

let currentMode = "action";

function setMode(mode) {
  currentMode = mode;
  setDiceCount(0);
  if (mode === "action") setDiceCount(1);
  if (mode === "versus") setDiceCount(2);
  if (mode === "initiative") setDiceCount(8);

  syncDiceUI();

  btnAction.classList.toggle("active", mode === "action");
  btnVersus.classList.toggle("active", mode === "versus");
  btnInitiative.classList.toggle("active", mode === "initiative");

  updateRollButtonState();
}

btnAction.addEventListener("click", () => setMode("action"));
btnVersus.addEventListener("click", () => setMode("versus"));
btnInitiative.addEventListener("click", () => setMode("initiative"));

dices.addEventListener("input", () => {
  syncDiceUI();
});

btnRoll.addEventListener("click", async () => {
  if (!allCharactersSelected()) {
    return;
  }
  lockUI(true);

  const sides = Number(dices.value);
  const durationMs = 1500;
  const delayMs = (currentMode === "initiative") ? 90 : 140;

  const results = await rollAllStaggered({ durationMs, delayMs, sides });

  if (currentMode === "initiative") {
    sortDiceByInitiative(results);
  }

  const r = results[0];

  if (currentMode === "action") {
    saveRollToHistory("action", {
      character: r.character,
      dice: sides,
      roll: r.finalDice,
      bonus: r.bonus,
      total: r.total,
      timestamp: Date.now()
    });
  }
  if (currentMode === "versus") {
    saveRollToHistory("versus", {
      dice: sides,
      rolls: results.map(r => ({
        character: r.character,
        roll: r.finalDice,
        bonus: r.bonus,
        total: r.total
      })),
      timestamp: Date.now()
    });
  }
  if (currentMode === "initiative") {
    saveRollToHistory("initiative", {
      rolls: results.map(r => ({
        character: r.character,
        roll: r.finalDice,
        bonus: r.bonus,
        total: r.total
      })),
      timestamp: Date.now()
    });
  }

  lockUI(false);
});

function sortDiceByInitiative(results) {
  
  const packed = diceInstances.map((d, i) => ({
    dice: d,
    res: results[i],
    total: results[i]?.total ?? -Infinity,
  }));

  packed.sort((a, b) => b.total - a.total);

  
  packed.forEach(p => diceCanvas.appendChild(p.dice.node));

  
  diceInstances.length = 0;
  packed.forEach(p => diceInstances.push(p.dice));
}

setMode("action");

function allCharactersSelected() {
  return diceInstances.every(d => d.charSelect && d.charSelect.value && d.charSelect.value.trim() !== "");
}

function updateRollButtonState() {
  btnRoll.disabled = !allCharactersSelected();
}

const STORAGE_KEYS = {
  action: "history_action",
  versus: "history_versus",
  initiative: "history_initiative"
};

function saveRollToHistory(mode, entry) {
  const key = STORAGE_KEYS[mode];

  const history = JSON.parse(localStorage.getItem(key) || "[]");

  history.push(entry);

  // opcional: limitar tamanho
  // if (history.length > 100) history.shift();

  localStorage.setItem(key, JSON.stringify(history));
}

function getHistory(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

console.log(getHistory("history_action"));
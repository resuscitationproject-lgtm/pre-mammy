import { makeQuestion, isComplete } from "./questions.js";

const STORAGE_KEY = "premami-study-v1";
const DEFAULT_SETTINGS = { minutes: 30, questions: 10 };
const $ = selector => document.querySelector(selector);
const today = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const settings = saved?.settings ?? DEFAULT_SETTINGS;
    const validSettings = {
      minutes: [5, 10, 15, 20, 30].includes(settings.minutes) ? settings.minutes : 30,
      questions: [5, 10, 15, 20].includes(settings.questions) ? settings.questions : 10
    };
    const progress = saved?.date === today() ? saved.progress : null;
    return { date: today(), settings: validSettings, progress: {
      activeSeconds: Number.isFinite(progress?.activeSeconds) ? Math.max(0, progress.activeSeconds) : 0,
      correct: Number.isFinite(progress?.correct) ? Math.max(0, progress.correct) : 0
    } };
  } catch { return { date: today(), settings: { ...DEFAULT_SETTINGS }, progress: { activeSeconds: 0, correct: 0 } }; }
}

let state = readState();
let currentQuestion = null;
let activeSubject = null;
let answered = false;
let lastTick = null;
let lastInteraction = null;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* 保存不可のブラウザでも出題は続ける */ }
}

function ensureToday() {
  if (state.date !== today()) {
    state.date = today();
    state.progress = { activeSeconds: 0, correct: 0 };
    save();
    renderProgress();
  }
}

function renderProgress() {
  const { progress, settings } = state;
  const elapsedMinutes = Math.floor(progress.activeSeconds / 60);
  $("#time-progress").textContent = `${elapsedMinutes} / ${settings.minutes}分`;
  $("#question-progress").textContent = `${progress.correct} / ${settings.questions}問`;
  $("#time-bar").style.width = `${Math.min(100, progress.activeSeconds / (settings.minutes * 60) * 100)}%`;
  $("#question-bar").style.width = `${Math.min(100, progress.correct / settings.questions * 100)}%`;
  $("#goal-banner").hidden = !isComplete(progress, settings);
}

function showQuestion() {
  const previousPrompt = currentQuestion?.prompt;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    currentQuestion = makeQuestion(activeSubject, $("#level-select").value);
    if (currentQuestion.prompt !== previousPrompt) break;
  }
  answered = false;
  $("#quiz-subject").textContent = activeSubject === "japanese" ? "📖 こくご" : "🔢 さんすう";
  $("#quiz-prompt").textContent = currentQuestion.prompt;
  $("#feedback").textContent = "";
  $("#feedback").className = "feedback";
  $("#next-button").hidden = true;
  const choices = $("#choices");
  choices.replaceChildren();
  for (const choice of currentQuestion.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice;
    button.addEventListener("click", () => choose(choice, button));
    choices.append(button);
  }
}

function choose(choice, button) {
  if (answered) return;
  lastInteraction = Date.now();
  if (choice !== currentQuestion.answer) {
    button.classList.add("wrong");
    button.disabled = true;
    $("#feedback").textContent = "もういちど かんがえてみよう！";
    $("#feedback").className = "feedback try-again";
    return;
  }
  answered = true;
  button.classList.add("correct");
  for (const option of $("#choices").children) option.disabled = true;
  state.progress.correct += 1;
  save();
  renderProgress();
  $("#feedback").textContent = isComplete(state.progress, state.settings) ? "すごい！ きょうの もくひょう たっせい！ 🎉" : "せいかい！ よくできたね ⭐";
  $("#feedback").className = "feedback success";
  $("#next-button").hidden = false;
}

function startSubject(subject) {
  ensureToday();
  activeSubject = subject;
  $("#quiz-panel").hidden = false;
  showQuestion();
  $("#quiz-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  lastTick = document.visibilityState === "visible" ? Date.now() : null;
  lastInteraction = Date.now();
}

function tick() {
  ensureToday();
  if (!activeSubject || document.visibilityState !== "visible" || !document.hasFocus() || $("#settings-dialog").open) { lastTick = null; return; }
  const now = Date.now();
  if (lastTick !== null && lastInteraction !== null && now - lastInteraction < 60_000) {
    const delta = Math.min(2, Math.max(0, (now - lastTick) / 1000));
    state.progress.activeSeconds += delta;
    save();
    renderProgress();
  }
  lastTick = now;
}

document.querySelectorAll("[data-subject]").forEach(button => button.addEventListener("click", () => startSubject(button.dataset.subject)));
$("#quiz-close").addEventListener("click", () => { activeSubject = null; lastTick = null; lastInteraction = null; $("#quiz-panel").hidden = true; });
$("#next-button").addEventListener("click", () => { lastInteraction = Date.now(); showQuestion(); });
$("#level-select").addEventListener("change", () => { if (activeSubject) { lastInteraction = Date.now(); showQuestion(); } });
$("#settings-open").addEventListener("click", () => {
  $("#minutes-setting").value = String(state.settings.minutes);
  $("#questions-setting").value = String(state.settings.questions);
  $("#settings-dialog").showModal();
});
$("#save-settings").addEventListener("click", () => {
  state.settings = { minutes: Number($("#minutes-setting").value), questions: Number($("#questions-setting").value) };
  save(); renderProgress(); $("#settings-dialog").close();
});
$("#reset-progress").addEventListener("click", () => {
  if (!window.confirm("今日の記録をリセットしますか？")) return;
  state.progress = { activeSeconds: 0, correct: 0 };
  save(); renderProgress(); $("#settings-dialog").close();
});
document.addEventListener("visibilitychange", () => { lastTick = document.visibilityState === "visible" && activeSubject ? Date.now() : null; });
window.addEventListener("focus", () => { lastTick = activeSubject ? Date.now() : null; });
window.addEventListener("blur", () => { lastTick = null; });
window.setInterval(tick, 1000);
renderProgress();

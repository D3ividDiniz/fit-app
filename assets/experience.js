/* Presentation layer; workout mutations and persistence remain in the application. */
function fitIcon(name) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24"><use href="#fit-${name}"></use></svg>`;
}
function fitRoutine(id) {
  return state.routines.find((r) => r.id === id);
}
function fitExercise(id) {
  return state.exercises.find((e) => e.id === id);
}
function fitNumber(value) {
  return value == null
    ? "—"
    : Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
function fitValue(exercise, set) {
  if (!set) return "Ainda sem registro";
  if (exercise.type === "weight")
    return `${fitNumber(set.weight)} kg × ${fitNumber(set.reps)} reps`;
  return exercise.type === "reps"
    ? `${fitNumber(set.reps)} reps`
    : `${fitNumber(set.time)} segundos`;
}
function fitExerciseCount(count) {
  return `${count} ${count === 1 ? "exercício" : "exercícios"}`;
}
function fitLimitNote(routine) {
  const limit = Number(state.settings.workoutLimitMinutes) || 0;
  return limit > 0 && estimateRoutineSeconds(routine) > limit
    ? `<p class="fit-limit-note">Acima do seu limite habitual de ${limit} min.</p>`
    : "";
}
function fitAverageDuration(workouts) {
  if (!workouts.length) return "—";
  const seconds = average(workouts.map((w) => w.durationSeconds || 0));
  return seconds < 60 ? "&lt;1 min" : Math.round(seconds / 60) + " min";
}
function renderTodayExperience() {
  const root = document.getElementById("page-home");
  if (!root) return;
  const active = state.activeSession;
  const routine = fitRoutine(active?.routineId || state.todayWorkoutId);
  const skipped = state.skippedDays?.includes(todayISO());
  const recent = state.workouts
    .slice()
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, 3);
  const now = new Date();
  const monthly = state.workouts.filter((w) => {
    const d = new Date(w.startedAt);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  root.innerHTML = `<div class="page-header"><div><p class="fit-kicker">SEU ESPAÇO DE TREINO</p><h1 class="page-title">Encontre seu ritmo.</h1></div><span class="fit-date">${now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</span></div>
  <div class="fit-today-grid"><section class="fit-workout-hero ${routine ? "" : "is-empty"}"><div class="fit-kicker">${active ? "TREINO EM ANDAMENTO" : skipped ? "HOJE É DIA DE DESCANSO" : "SEU PRÓXIMO TREINO"}</div><h2>${escapeHTML(routine?.name || (skipped ? "Respeite seu ritmo." : "Vamos escolher seu treino?"))}</h2><p>${escapeHTML(routine?.description || "Escolha uma rotina pronta ou monte uma sequência para você.")}</p>${routine ? `<div class="fit-hero-meta"><span>${fitIcon("clock")}≈ ${formatDuration(estimateRoutineSeconds(routine))}</span><span>${fitIcon("weight")}${fitExerciseCount(routine.exercises.length)}</span></div>` : ""}<div class="fit-hero-actions">${active ? `<button class="btn btn-primary" onclick="resumeActiveWorkout()">${fitIcon("play")}Continuar treino</button><button class="fit-light-link" onclick="openRoutineDetails('${routine?.id}')">Ver sequência</button>` : routine ? `<button class="btn btn-primary" onclick="openRoutineDetails('${routine.id}')">${fitIcon("play")}Preparar treino</button><button class="fit-light-link" onclick="openTodayWorkoutPicker()">Trocar rotina</button>` : `<button class="btn btn-primary" onclick="navigate('workouts');setWorkoutTab('presets')">Explorar treinos</button><button class="fit-light-link" onclick="navigate('workouts');openWorkoutModal()">Criar meu treino</button>`}</div>${routine && !active ? '<button class="fit-rest-link" onclick="skipToday()">Descansar hoje</button>' : ""}</section><section class="today-week-card" id="today-week-card"></section></div>
  ${state.workouts.length ? `<div class="fit-metrics"><div><span>Treinos neste mês</span><strong>${monthly.length}</strong></div><div><span>Tempo médio</span><strong>${fitAverageDuration(monthly)}</strong></div><div><span>Exercícios com recorde de carga</span><strong>${countPRs()}</strong></div></div>` : ""}
  <section class="section"><div class="section-head"><h2 class="section-title">Últimos treinos</h2><button class="btn btn-ghost" onclick="openHistory()">Ver histórico</button></div><div id="home-history">${recent.length ? recent.map((w) => renderHistoryCard(w, false)).join("") : '<div class="fit-empty"><span>' + fitIcon("weight") + "</span><h3>Seu histórico começa no primeiro treino.</h3><p>As sessões concluídas aparecerão aqui.</p></div>"}</div></section>`;
  renderTodayWeek();
}
function showRoutineExperience(id) {
  const r = fitRoutine(id);
  if (!r) {
    showToast("Treino não encontrado");
    return;
  }
  navigate("detail");
  const items = r.exercises.map(fitExercise).filter(Boolean);
  const resume = state.activeSession?.routineId === id;
  document.getElementById("routine-detail").innerHTML =
    `<button class="fit-back" onclick="navigate('workouts')">${fitIcon("back")}Biblioteca de treinos</button><div class="fit-detail-grid"><section><div class="fit-detail-cover"><span>${r.isPreset ? "ROTINA PRONTA" : "SEU TREINO"}</span></div><div class="fit-kicker">${escapeHTML((r.groups || []).join(" · "))}</div><h1 class="page-title">${escapeHTML(r.name)}</h1><p class="fit-description">${escapeHTML(r.description || "Confira os movimentos antes de começar.")}</p><div class="section-head"><h2 class="section-title">Sua sequência</h2><span>${fitExerciseCount(items.length)}</span></div><div class="fit-detail-list">${items.map((e, i) => `<div class="fit-detail-row"><span class="fit-order">${i + 1}</span><div><strong>${escapeHTML(e.name)}</strong><small>${escapeHTML(e.muscleGroup)} · ${typeLabel(e.type)}</small></div><span class="fit-last">${escapeHTML(fitValue(e, getLastPerformance(e.id)))}</span></div>`).join("") || "<p>Adicione exercícios para começar.</p>"}</div></section><aside class="fit-prepare-card"><p class="fit-kicker">ANTES DE COMEÇAR</p><h2>Seu treino, por dentro.</h2><dl><div><dt>Duração estimada</dt><dd>${formatDuration(estimateRoutineSeconds(r))}</dd></div><div><dt>Descanso entre séries</dt><dd>${state.settings.restSeconds}s</dd></div><div><dt>Movimentos</dt><dd>${items.length}</dd></div></dl>${fitLimitNote(r)}<p class="fit-note">${escapeHTML(r.notes || "A duração é uma estimativa. Registre as séries de acordo com seu treino e respeite seu ritmo.")}</p><button class="btn btn-primary btn-block" onclick="startWorkout('${r.id}')" ${!items.length ? "disabled" : ""}>${fitIcon("play")}${resume ? "Continuar sessão" : "Começar sessão"}</button><button class="btn btn-secondary btn-block" onclick="setTodayWorkout('${r.id}')">Definir para hoje</button>${r.isPreset ? `<button class="fit-inline-link" onclick="clonePreset('${r.id}')">Usar como base</button><button class="fit-inline-link" onclick="openMixModal('${r.id}')">Combinar com outra rotina</button>` : `<button class="fit-inline-link" onclick="openWorkoutModal('${r.id}')">Editar rotina</button>`}</aside></div>`;
}
function renderWorkoutCard(r, preset) {
  const items = r.exercises.map(fitExercise).filter(Boolean);
  return `<article class="card fit-routine-card"><div class="fit-card-heading"><span class="fit-card-icon">${fitIcon("weight")}</span><span class="badge">${preset ? "Pronto para usar" : "Personalizado"}</span></div><h2>${escapeHTML(r.name)}</h2><p>${escapeHTML(r.description || "Sua sequência de exercícios.")}</p><div class="fit-card-facts"><span>${fitExerciseCount(items.length)}</span><span>≈ ${formatDuration(estimateRoutineSeconds(r))}</span></div>${fitLimitNote(r)}<div class="fit-card-footer"><button class="btn btn-primary" onclick="openRoutineDetails('${r.id}')">Ver treino</button><button class="btn btn-ghost" aria-label="Opções de ${escapeHTML(r.name)}" onclick="openRoutineActions('${r.id}')">${fitIcon("more")}</button></div></article>`;
}
function openRoutineActions(id) {
  const r = fitRoutine(id);
  if (!r) return;
  openModal(
    "Opções da rotina",
    `<div class="fit-action-list"><button class="btn btn-secondary" onclick="closeModal();setTodayWorkout('${id}')">Definir para hoje</button>${r.isPreset ? `<button class="btn btn-secondary" onclick="closeModal();clonePreset('${id}')">Usar como base</button><button class="btn btn-secondary" onclick="closeModal();openMixModal('${id}')">Combinar treinos</button>` : `<button class="btn btn-secondary" onclick="closeModal();openWorkoutModal('${id}')">Editar rotina</button><button class="btn btn-danger" onclick="closeModal();deleteRoutine('${id}')">Excluir rotina</button>`}</div>`,
  );
}
function captureTrainingDraft() {
  if (!currentExecution) return;
  const e = getCurrentExercise();
  if (!e) return;
  const draft = {};
  ["weight", "reps", "time"].forEach((key) => {
    const el = document.getElementById("execution-" + key);
    if (el) draft[key] = el.value;
  });
  if (Object.keys(draft).length) {
    currentExecution.draftInputs ??= {};
    currentExecution.draftInputs[e.id] = draft;
  }
}
function trainingField(key, label, value, step, min) {
  return `<label for="execution-${key}">${label}<div class="fit-stepper"><button type="button" onclick="adjustTrainingField('${key}',-${step})" aria-label="Diminuir ${label}">−</button><input id="execution-${key}" class="input-big" type="number" inputmode="${key === "weight" ? "decimal" : "numeric"}" min="${min}" step="${key === "weight" ? "any" : step}" value="${escapeHTML(value)}" required><button type="button" onclick="adjustTrainingField('${key}',${step})" aria-label="Aumentar ${label}">+</button></div></label>`;
}
function adjustTrainingField(key, delta) {
  const input = document.getElementById("execution-" + key);
  if (!input) return;
  input.value = Math.max(
    Number(input.min),
    Math.round((Number(input.value) + delta) * 100) / 100,
  );
  captureTrainingDraft();
  saveState();
}
function renderTrainingExperience() {
  if (currentPage !== "execution" || !currentExecution) return;
  const r = getCurrentRoutine(),
    e = getCurrentExercise();
  if (!r || !e) return;
  const sets = currentExecution.setsByExercise[e.id] || [];
  const last = getLastPerformance(e.id),
    suggestion = getWeightSuggestion(e),
    draft = currentExecution.draftInputs?.[e.id] || {};
  const current = currentExecution.currentIndex;
  document.getElementById("execution-progress-bar").style.width =
    `${((current + 1) / r.exercises.length) * 100}%`;
  document.getElementById("execution-content").innerHTML =
    `<div class="fit-training-grid"><section class="fit-training-card"><div class="fit-training-top"><span>Exercício ${current + 1} de ${r.exercises.length}</span><span>${escapeHTML(e.muscleGroup)}</span></div><h1 class="fit-exercise-title">${escapeHTML(e.name)}</h1><p class="fit-exercise-type">${typeLabel(e.type)}</p><div class="fit-last-performance"><span>Último registro</span><strong>${escapeHTML(fitValue(e, last))}</strong></div>${suggestion ? `<div class="fit-suggestion"><div><strong>Sugestão de carga</strong><span>${escapeHTML(suggestion.text)}</span></div><button class="btn btn-ghost" onclick="applySuggestion('${e.id}');captureTrainingDraft();saveState()">Aplicar</button></div>` : ""}<form id="training-set-form"><div class="fit-fields ${e.type === "weight" ? "" : "is-single"}">${e.type === "weight" ? trainingField("weight", "Carga (kg)", draft.weight ?? e.lastWeight ?? suggestion?.weight ?? "", 0.5, 0) : ""}${e.type !== "timed" ? trainingField("reps", "Repetições", draft.reps ?? e.lastReps ?? "", 1, 1) : trainingField("time", "Tempo (segundos)", draft.time ?? e.lastTime ?? "", 1, 1)}</div><button class="btn btn-primary fit-record-button" id="complete-set-btn" type="submit">${fitIcon("check")}Registrar série ${sets.length + 1}</button></form><div id="fit-mobile-rest-slot"></div><div class="section-head fit-sets-heading"><h2 class="section-title">Séries registradas</h2><span>${sets.length} ${sets.length === 1 ? "série" : "séries"}</span></div><div class="fit-set-list">${sets.length ? sets.map((set, i) => `<div class="fit-set-row"><span class="fit-set-number">${i + 1}</span><strong>${escapeHTML(fitValue(e, set))}</strong><button class="btn btn-ghost" onclick="editCurrentSet(${i})" aria-label="Editar série ${i + 1}">${fitIcon("edit")}</button><button class="btn btn-ghost" onclick="removeCurrentSet(${i})" aria-label="Remover série ${i + 1}">${fitIcon("close")}</button></div>`).join("") : '<p class="fit-empty-series">Preencha os valores acima e registre sua primeira série.</p>'}</div><div class="fit-exercise-navigation"><button class="btn btn-secondary" onclick="previousExercise()" ${current === 0 ? "disabled" : ""}>Anterior</button><button class="btn btn-secondary" onclick="${current === r.exercises.length - 1 ? "reviewWorkoutFinish()" : "nextExercise()"}">${current === r.exercises.length - 1 ? "Revisar e concluir" : "Próximo exercício"}</button></div></section><aside class="fit-training-aside"><section class="fit-rest-card" id="fit-rest-card"><div class="section-head"><h2>Seu descanso</h2>${fitIcon("clock")}</div><div id="rest-timer" class="fit-rest-time">${formatClock(restTimer.seconds)}</div><p id="fit-rest-state">${restTimer.running ? "Recupere antes da próxima série." : "Começa ao registrar uma série."}</p><div class="fit-rest-actions"><button id="fit-rest-toggle" class="btn btn-secondary" onclick="toggleRestTimer()">${restTimer.running ? "Pausar" : "Iniciar"}</button><button class="btn btn-secondary" onclick="addTrainingRest()">+15s</button><button class="btn btn-ghost" onclick="resetRestTimer();renderExecution()" aria-label="Reiniciar descanso">${fitIcon("reset")}</button></div></section><section class="fit-queue"><h2>${escapeHTML(r.name)}</h2><p>Toque em um exercício para revisar suas séries.</p>${r.exercises
      .map((id, i) => {
        const x = fitExercise(id);
        return x
          ? `<button class="fit-queue-item ${i === current ? "active" : ""}" onclick="selectTrainingExercise(${i})" ${i === current ? 'aria-current="step"' : ""}><span>${currentExecution.setsByExercise[id]?.length ? fitIcon("check") : i + 1}</span><div><strong>${escapeHTML(x.name)}</strong><small>${currentExecution.setsByExercise[id]?.length || 0} ${(currentExecution.setsByExercise[id]?.length || 0) === 1 ? "série registrada" : "séries registradas"}</small></div></button>`
          : "";
      })
      .join(
        "",
      )}</section><button class="fit-session-options" onclick="openExecutionMenu()">${fitIcon("more")}Opções da sessão</button></aside></div>`;
  placeTrainingRest();
  updateRestTimerDisplay();
  updateWorkoutDuration();
}
function placeTrainingRest() {
  const card = document.getElementById("fit-rest-card");
  if (!card) return;
  const parent = window.matchMedia("(max-width:700px)").matches
    ? document.getElementById("fit-mobile-rest-slot")
    : document.querySelector(".fit-training-aside");
  if (parent && card.parentElement !== parent) parent.prepend(card);
}
window
  .matchMedia("(max-width:700px)")
  .addEventListener("change", placeTrainingRest);
function addTrainingRest() {
  if (restTimer.running) restTimer.endsAt += 15000;
  restTimer.seconds += 15;
  saveState();
  updateRestTimerDisplay();
}
function selectTrainingExercise(index) {
  if (!currentExecution) return;
  captureTrainingDraft();
  currentExecution.currentIndex = index;
  saveState();
  renderExecution();
  window.scrollTo({ top: 0, behavior: "instant" });
}
function reviewWorkoutFinish() {
  if (!currentExecution) return;
  captureTrainingDraft();
  saveState();
  const count = Object.values(currentExecution.setsByExercise).reduce(
    (n, sets) => n + sets.length,
    0,
  );
  const routine = getCurrentRoutine();
  const recorded = routine.exercises.filter(
    (id) => currentExecution.setsByExercise[id]?.length,
  ).length;
  const pending = routine.exercises.length - recorded;
  openModal(
    "Concluir sessão",
    `<div class="fit-finish"><span>${fitIcon("check")}</span><h2>Vamos fechar o treino?</h2><p>Confira suas séries antes de salvar a sessão no histórico.</p><div class="fit-finish-facts"><div><strong>${count}</strong><span>${count === 1 ? "série registrada" : "séries registradas"}</span></div><div><strong>${formatDuration(Math.max(0, Math.floor((Date.now() - new Date(currentExecution.startedAt)) / 1000)))}</strong><span>tempo decorrido</span></div></div><p class="fit-finish-note">${recorded} de ${routine.exercises.length} exercícios com séries.${pending ? " Você pode continuar treinando ou concluir com o que fez hoje." : ""}</p></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Continuar treinando</button><button class="btn btn-primary" onclick="closeModal();finishWorkout()">Salvar e concluir</button>`,
  );
}
function mountExperience() {
  const svg = document.createElement("div");
  svg.innerHTML = `<svg class="fit-symbols" xmlns="http://www.w3.org/2000/svg"><defs>${Object.entries(
    {
      home: "M3 10 12 3l9 7v11h-6v-7H9v7H3Z",
      weight: "M7 9h10M7 15h10M3 9v6m4-9v12m10-12v12m4-9v6",
      chart: "M4 3v17h17M8 14l4-5 4 3 5-7",
      user: "M4 21v-2a8 8 0 0 1 16 0v2M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
      clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
      play: "m9 5 11 7-11 7Z",
      check: "m5 12 4 4L19 6",
      back: "m14 6-6 6 6 6",
      close: "m6 6 12 12M6 18 18 6",
      edit: "m4 16 12-12 4 4L8 20H4Zm10-10 4 4",
      reset: "M4 10a8 8 0 1 1 1 8M4 4v6h6",
      more: "M5 12h.01M12 12h.01M19 12h.01",
    },
  )
    .map(
      ([key, path]) =>
        `<symbol id="fit-${key}" viewBox="0 0 24 24"><path d="${path}"/></symbol>`,
    )
    .join("")}</defs></svg>`;
  document.body.prepend(svg);
  [
    ["nav-home", "home", "Hoje"],
    ["nav-workouts", "weight", "Treinos"],
    ["nav-progress", "chart", "Progresso"],
    ["nav-settings", "user", "Perfil"],
  ].forEach(([id, icon, label]) => {
    const el = document.getElementById(id);
    el.innerHTML = fitIcon(icon) + `<span>${label}</span>`;
  });
  for (const key of ["history", "evolution"]) {
    document
      .getElementById("progress-tabs")
      .append(document.getElementById("tab-" + key));
    document
      .getElementById("progress-panels")
      .append(document.getElementById("workout-tab-" + key));
  }
  document
    .getElementById("progress-tabs")
    .insertAdjacentHTML(
      "beforeend",
      '<button id="tab-records" class="tab" onclick="setWorkoutTab(\'records\')">Melhores marcas</button>',
    );
  document
    .getElementById("page-workouts")
    .querySelector(".page-description").textContent =
    "Escolha uma rotina, confira os exercícios e comece.";
  document
    .getElementById("page-execution")
    .querySelector(".execution-spotify-link").onclick = () => {
    navigate("spotify");
    return false;
  };
  document.querySelectorAll(".setting-card").forEach((card, index) => {
    const title = card.querySelector(".setting-title");
    if (!title) return;
    title.id ||= `fit-setting-title-${index}`;
    card.querySelectorAll("input,select").forEach((input) => {
      if (!input.getAttribute("aria-label"))
        input.setAttribute("aria-labelledby", title.id);
    });
  });
  renderAll();
  renderProgression();
}
document.addEventListener("input", (event) => {
  if (event.target.id.startsWith("execution-")) {
    captureTrainingDraft();
    saveState();
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "training-set-form") {
    event.preventDefault();
    completeCurrentSet();
  }
});
document.addEventListener("DOMContentLoaded", mountExperience);
document.addEventListener("keydown", (event) => {
  const backdrop = document.getElementById("modal-backdrop");
  if (event.key !== "Tab" || !backdrop?.classList.contains("open")) return;
  const items = [
    ...document
      .getElementById("modal")
      .querySelectorAll(
        "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
      ),
  ].filter((el) => el.getClientRects().length);
  if (!items.length) return;
  const first = items[0],
    last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

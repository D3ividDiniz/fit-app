/* Offline domain regression checks. Browser layout/OAuth are verified separately. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const elements = new Map();
const storage = new Map();
let exportedBlob;
const node = () => ({
  value: "",
  style: { setProperty() {} },
  classList: {
    add() {},
    remove() {},
    toggle() {},
    contains() {
      return false;
    },
  },
  setAttribute() {},
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
  append() {},
  appendChild() {},
  click() {},
  remove() {},
  focus() {},
  innerHTML: "",
});
const document = {
  documentElement: node(),
  body: node(),
  addEventListener() {},
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
  getElementById(id) {
    return elements.get(id) || null;
  },
  createElement: node,
};
const sandbox = {
  console,
  document,
  Blob,
  URL: {
    createObjectURL(blob) {
      exportedBlob = blob;
      return "blob:qa";
    },
    revokeObjectURL() {},
  },
  URLSearchParams,
  Date,
  Math,
  JSON,
  Intl,
  Number,
  String,
  Object,
  Array,
  Set,
  Map,
  Promise,
  setTimeout() {},
  clearTimeout() {},
  setInterval() {},
  clearInterval() {},
  requestAnimationFrame() {},
  confirm() {
    return true;
  },
  navigator: {},
  MutationObserver: class {
    observe() {}
  },
  localStorage: {
    getItem(key) {
      return storage.get(key) || null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
    removeItem(key) {
      storage.delete(key);
    },
  },
  FileReader: class {
    readAsText(file) {
      this.result = file.text;
      this.onload();
    }
  },
};
sandbox.window = {
  location: { origin: "http://localhost", pathname: "/", search: "", hash: "" },
  addEventListener() {},
  matchMedia() {
    return { matches: false, addEventListener() {} };
  },
  scrollTo() {},
};
const context = vm.createContext(sandbox);
const run = (code) => vm.runInContext(code, context);
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if (match[1].trim()) run(match[1]);
run(fs.readFileSync(path.join(root, "assets/experience.js"), "utf8"));
// Keep domain mutations real; suppress visual rendering, media and network effects.
run(
  `renderAll=()=>{};renderHome=()=>{};renderExecution=()=>{};showToast=()=>{};closeModal=()=>{};requestWakeLock=()=>{};releaseWakeLock=()=>{};scheduleCloudSync=()=>{};state=buildDefaultState();ensurePresetRoutines();__devedeStartupHydration=false;`,
);
for (const id of ["page-execution", "page-home", "nav-home"])
  elements.set(id, node());
const snapshot = () => JSON.parse(storage.get("devede-v2-state"));
const input = (id, value) =>
  elements.set(id, { ...node(), value: String(value) });
run(
  `state.qaOpaque={nested:['keep',42]};state.settings.qaOption='keep';state.exercises.push({id:'qa-w',name:'W',type:'weight',muscleGroup:'QA'},{id:'qa-r',name:'R',type:'reps',muscleGroup:'QA'},{id:'qa-t',name:'T',type:'timed',muscleGroup:'QA'});state.routines.push({id:'qa-routine',name:'Mixed',exercises:['qa-w','qa-r','qa-t'],notes:'keep notes',isPreset:false,qaField:'keep'});startWorkout('qa-routine');`,
);
input("execution-weight", 0);
input("execution-reps", 12);
run("captureTrainingDraft();completeCurrentSet();");
assert.equal(snapshot().activeSession.setsByExercise["qa-w"].length, 1);
assert.equal(snapshot().activeSession.setsByExercise["qa-w"][0].weight, 0);
input("execution-weight", "");
run("completeCurrentSet();");
assert.equal(
  snapshot().activeSession.setsByExercise["qa-w"].length,
  1,
  "Blank load must not create a set",
);
input("execution-weight", -1);
run("completeCurrentSet();");
assert.equal(
  snapshot().activeSession.setsByExercise["qa-w"].length,
  1,
  "Negative load must not create a set",
);
input("execution-weight", 22.25);
run("captureTrainingDraft();nextExercise();");
assert.equal(snapshot().activeSession.draftInputs["qa-w"].weight, "22.25");
elements.delete("execution-weight");
input("execution-reps", 15);
run("completeCurrentSet();nextExercise();");
elements.delete("execution-reps");
input("execution-time", 37);
run("completeCurrentSet();");
assert.equal(snapshot().activeSession.setsByExercise["qa-r"][0].reps, 15);
assert.equal(snapshot().activeSession.setsByExercise["qa-t"][0].time, 37);
run("currentExecution=null;restoreActiveSession();");
assert.equal(run("currentExecution.currentIndex"), 2);
assert.equal(run('currentExecution.setsByExercise["qa-t"][0].time'), 37);
run("finishWorkout();finishWorkout();");
let saved = snapshot();
assert.equal(saved.activeSession, null);
assert.equal(saved.activeRestTimer, null);
assert.equal(saved.workouts.length, 1);
assert.equal(saved.workouts[0].sets.length, 3);
assert.equal(saved.workoutHistory.length, 3);
assert.equal(saved.workouts[0].sets[2].time, 37);
assert.deepEqual(saved.qaOpaque, { nested: ["keep", 42] });
assert.equal(saved.settings.qaOption, "keep");
assert.equal(saved.routines.find((r) => r.id === "qa-routine").qaField, "keep");
run(
  `state.schedule[String(new Date().getDay())]=state.routines[0].id;setTodayWorkout('qa-routine');`,
);
assert.equal(
  run("state.schedule[String(new Date().getDay())]"),
  saved.routines[0].id,
);
assert.equal(snapshot().todayWorkoutId, "qa-routine");
run("skipToday();");
assert.equal(snapshot().todayWorkoutId, null);
run("setTodayWorkout('qa-routine');");
assert.equal(snapshot().skippedDays.includes(run("todayISO()")), false);
saved = snapshot();
(async () => {
  run("exportData();");
  const backup = JSON.parse(await exportedBlob.text());
  assert.deepEqual(
    backup,
    saved,
    "JSON export must preserve the complete state",
  );
  elements.set("data-import-file", {
    files: [{ text: JSON.stringify(backup) }],
  });
  run("state=buildDefaultState();importData();");
  saved = snapshot();
  assert.deepEqual(saved.qaOpaque, backup.qaOpaque);
  assert.deepEqual(saved.workouts, backup.workouts);
  assert.deepEqual(saved.workoutHistory, backup.workoutHistory);
  assert.deepEqual(saved.exercises, backup.exercises);
  assert.deepEqual(saved.routines, backup.routines);
  assert.deepEqual(saved.settings, backup.settings);
  console.log(
    "PASS: validation, all exercise types, draft persistence, finalization, opaque fields and JSON backup round trip.",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

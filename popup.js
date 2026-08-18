const list = document.getElementById("list");
const status = document.getElementById("status");
const player = document.getElementById("player");
const fileInput = document.getElementById("fileInput");
const addBtn = document.getElementById("addBtn");
const removeBtn = document.getElementById("removeBtn");
const previewBtn = document.getElementById("previewBtn");
const randomBtn = document.getElementById("randomBtn");
const okBtn = document.getElementById("okBtn");
const closeBtn = document.getElementById("closeBtn");
const useNativeCheckbox = document.getElementById("useNative");
let sounds = [];
let storedUseNative = false;
let selectedIndex = -1;

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function hasEnabled() {
  return sounds.some(s => s.enabled);
}
function effectiveNative() {
  return storedUseNative || !hasEnabled();
}
function refreshNativeCheckbox() {
  useNativeCheckbox.checked = effectiveNative();
  useNativeCheckbox.disabled = !hasEnabled();
}
function refreshActionButtons() {
  const hasSel = selectedIndex >= 0;
  removeBtn.disabled = !hasSel;
  previewBtn.disabled = !hasSel;
  randomBtn.disabled = !hasEnabled();
}

function render() {
  list.innerHTML = "";
  if (sounds.length === 0) {
    const empty = document.createElement("div");
    empty.className = "sound-row empty";
    empty.textContent = "(no files - using native sound)";
    list.appendChild(empty);
    selectedIndex = -1;
    refreshActionButtons();
    return;
  }
  sounds.forEach((s, i) => {
    const row = document.createElement("div");
    row.className = "sound-row";
    if (i === selectedIndex) row.classList.add("selected");
    if (!s.enabled) row.classList.add("disabled");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = "cb-" + i;
    cb.checked = s.enabled;
    cb.dataset.idx = i;

    const cbBox = document.createElement("label");
    cbBox.htmlFor = "cb-" + i;
    cbBox.className = "cb-box";

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = s.name + " - " + formatSize(s.size);
    name.dataset.idx = i;
    name.dataset.act = "select";

    row.append(cb, cbBox, name);
    list.appendChild(row);
  });
  refreshActionButtons();
}

function setStatus(msg) { status.textContent = msg; }

function save() {
  if (sounds.length === 0) chrome.storage.local.remove("sounds");
  else chrome.storage.local.set({ sounds });
  chrome.storage.local.set({ useNative: storedUseNative });
}

function readFiles(files) {
  return Promise.all(Array.from(files).map(file => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve({ name: file.name, dataUrl: r.result, size: file.size, enabled: true });
    r.onerror = reject;
    r.readAsDataURL(file);
  })));
}

list.addEventListener("change", (e) => {
  if (e.target.type !== "checkbox") return;
  const idx = +e.target.dataset.idx;
  sounds[idx].enabled = e.target.checked;
  save();
  refreshNativeCheckbox();
  const row = list.children[idx];
  if (row) row.classList.toggle("disabled", !e.target.checked);
  setStatus((e.target.checked ? "Enabled: " : "Disabled: ") + sounds[idx].name);
});

list.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.act !== "select") return;
  const idx = +t.dataset.idx;
  selectedIndex = (idx === selectedIndex) ? -1 : idx;
  render();
  setStatus(selectedIndex >= 0 ? "Selected: " + sounds[selectedIndex].name : "Selection cleared.");
});

fileInput.addEventListener("change", async () => {
  const files = fileInput.files;
  if (!files.length) return;
  setStatus("Reading " + files.length + " file(s)...");
  try {
    const read = await readFiles(files);
    sounds.push(...read);
    save();
    render();
    refreshNativeCheckbox();
    setStatus("Added " + read.length + " file(s).");
  } catch (e) {
    setStatus("Error reading file(s).");
  }
});

addBtn.addEventListener("click", () => {
  fileInput.value = "";
  fileInput.click();
});

removeBtn.addEventListener("click", () => {
  if (selectedIndex < 0) return;
  const name = sounds[selectedIndex].name;
  sounds.splice(selectedIndex, 1);
  if (selectedIndex >= sounds.length) selectedIndex = sounds.length - 1;
  if (sounds.length === 0) selectedIndex = -1;
  save();
  render();
  refreshNativeCheckbox();
  setStatus("Removed: " + name);
});

previewBtn.addEventListener("click", () => {
  if (selectedIndex < 0) return;
  const s = sounds[selectedIndex];
  player.src = s.dataUrl;
  player.play().then(() => setStatus("Playing: " + s.name)).catch(() => setStatus("Playback failed."));
});

randomBtn.addEventListener("click", () => {
  const enabled = sounds.filter(s => s.enabled);
  if (!enabled.length) return;
  const s = enabled[Math.floor(Math.random() * enabled.length)];
  player.src = s.dataUrl;
  player.play().then(() => setStatus("Playing: " + s.name)).catch(() => setStatus("Playback failed."));
});

useNativeCheckbox.addEventListener("change", () => {
  if (useNativeCheckbox.disabled) return;
  storedUseNative = useNativeCheckbox.checked;
  save();
  setStatus(storedUseNative ? "Using native sound." : "Using custom pool.");
});

okBtn.addEventListener("click", () => window.close());
closeBtn.addEventListener("click", () => window.close());

chrome.storage.local.get(["sounds", "useNative"], ({ sounds: stored, useNative }) => {
  sounds = stored || [];
  storedUseNative = !!useNative;
  render();
  refreshNativeCheckbox();
  setStatus(sounds.length ? "Loaded " + sounds.length + " file(s)." : "No files (using native).");
});

const root = document.documentElement;

function writeSounds(sounds) {
  const urls = sounds?.filter(s => s.enabled).map(s => s.dataUrl) || [];
  root.dataset.gchatSounds = JSON.stringify(urls);
}

function writeUseNative(useNative) {
  root.dataset.gchatUseNative = useNative ? "true" : "false";
}

writeSounds(null);
writeUseNative(false);

chrome.storage.local.get(["sounds", "useNative"], ({ sounds, useNative }) => {
  writeSounds(sounds);
  writeUseNative(useNative);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.sounds) writeSounds(changes.sounds.newValue);
  if (changes.useNative) writeUseNative(changes.useNative.newValue);
});

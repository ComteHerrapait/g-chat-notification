(function () {
  const sounds = () => {
    try { return JSON.parse(document.documentElement.dataset.gchatSounds); }
    catch { return []; }
  };
  const useNative = () => document.documentElement.dataset.gchatUseNative === "true";
  const nativePlay = HTMLMediaElement.prototype.play;

  let warmed = false;
  function warm() {
    if (warmed || useNative()) return;
    const arr = sounds();
    if (!arr.length) return;
    warmed = true;
    const a = new Audio(arr[0]);
    a.preload = "auto";
    a.muted = true;
    a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => { a.muted = false; });
  }

  if (document.readyState === "complete") warm();
  else window.addEventListener("load", warm);

  HTMLMediaElement.prototype.play = function () {
    const arr = sounds();
    if (useNative() || !arr.length) return nativePlay.apply(this, arguments);
    const url = arr[Math.floor(Math.random() * arr.length)];
    if (this.src !== url) this.src = url;
    return nativePlay.apply(this, arguments);
  };
})();

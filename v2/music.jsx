/* global YT */
// ===========================================================
// 전역 음악 컨트롤러
// 숨겨진 YouTube IFrame 플레이어를 document.body 에 둬서
// React 탭 전환(컴포넌트 언마운트)과 무관하게 재생이 유지된다.
// 영상은 화면 밖(offscreen)이라 사실상 오디오만 들린다.
// ===========================================================
(function () {
  let player = null;
  let ready = false;
  let queue = [];       // [{ videoId, title }]
  let index = 0;
  let started = false;
  const state = { playing: false, title: "", videoId: null, hasQueue: false };
  const subs = new Set();
  const emit = () => { for (const fn of subs) fn(); };

  // 화면 밖 호스트 (display:none 이면 재생이 막혀서 offscreen 으로 처리)
  function host() {
    let el = document.getElementById("yt-music-host");
    if (!el) {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "position:fixed;left:-9999px;top:-9999px;width:320px;height:180px;opacity:0;pointer-events:none;";
      el = document.createElement("div");
      el.id = "yt-music-host";
      wrap.appendChild(el);
      document.body.appendChild(wrap);
    }
    return el;
  }

  function ensure() {
    if (player) return;
    if (window.YT && window.YT.Player) { create(); return; }
    if (document.getElementById("__yt_api")) return;
    const s = document.createElement("script");
    s.id = "__yt_api";
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prev) { try { prev(); } catch (_) {} }
      create();
    };
  }

  function create() {
    if (player) return;
    player = new YT.Player(host(), {
      height: "180", width: "320",
      playerVars: { autoplay: 1, controls: 0, disablekb: 1, playsinline: 1 },
      events: {
        onReady: function () { ready = true; if (queue.length && !started) play(0); },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) { play(index + 1); return; } // 다음 곡 자동 재생
          state.playing = (e.data === YT.PlayerState.PLAYING);
          try { const d = player.getVideoData(); if (d && d.title) state.title = d.title; } catch (_) {}
          emit();
        },
      },
    });
  }

  function play(i) {
    if (!queue.length) return;
    index = ((i % queue.length) + queue.length) % queue.length;
    const tr = queue[index];
    state.videoId = tr.videoId;
    state.title = tr.title || "재생 중…";
    state.hasQueue = true;
    started = true;
    emit();
    ensure();
    if (ready && player) player.loadVideoById(tr.videoId);
  }

  window.musicPlayer = {
    // 저장된 플레이리스트를 큐로 동기화 (저장 곡 있으면 자동 재생 시도)
    setQueue(tracks) {
      queue = (tracks || []).map(t => ({ videoId: t.videoId, title: t.title }));
      state.hasQueue = queue.length > 0;
      if (!queue.length) { state.title = ""; state.videoId = null; state.playing = false; }
      if (index >= queue.length) index = 0;
      emit();
      if (queue.length) {
        ensure();
        if (!started && ready) play(index);
      }
    },
    play(videoId) {
      const i = queue.findIndex(t => t.videoId === videoId);
      if (i >= 0) play(i); else ensure();
    },
    toggle() {
      ensure();
      if (!ready || !player) { if (queue.length) play(index); return; }
      if (player.getPlayerState() === 1) player.pauseVideo();
      else if (state.videoId) player.playVideo();
      else if (queue.length) play(index);
    },
    next() { if (queue.length) play(index + 1); },
    prev() { if (queue.length) play(index - 1); },
    getState() { return state; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();

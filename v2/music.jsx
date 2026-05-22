/* global YT */
// ===========================================================
// 전역 음악 컨트롤러
// 숨겨진 YouTube IFrame 플레이어를 document.body 에 둬서
// React 탭 전환(컴포넌트 언마운트)과 무관하게 재생이 유지된다.
// macOS(WKWebView)는 화면 밖(offscreen) iframe 재생을 막으므로
// "화면 안이지만 보이지 않게" 둔다. 자동재생은 OS 정책상 차단될 수 있어
// 사용자가 ▶ 를 누르면(제스처) unMute 후 재생한다.
// ===========================================================
(function () {
  let player = null;
  let ready = false;
  let queue = [];       // [{ videoId, title }]
  let index = 0;
  let started = false;
  let wantPlay = false; // 준비되면 재생할지
  const state = { playing: false, title: "", videoId: null, hasQueue: false };
  const subs = new Set();
  const emit = () => { for (const fn of subs) fn(); };

  // 화면 안이지만 보이지 않는 호스트 (offscreen 이면 macOS에서 재생이 막힘)
  function host() {
    let el = document.getElementById("yt-music-host");
    if (!el) {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "position:fixed;right:0;bottom:0;width:320px;height:180px;opacity:0.001;pointer-events:none;z-index:-1;overflow:hidden;";
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
        onReady: function () {
          ready = true;
          // 사용자가 미리 ▶ 를 눌렀거나(또는 큐가 있으면) 준비되는 대로 로드
          if (queue.length && (wantPlay || !started)) {
            const tr = queue[index] || queue[0];
            try { player.loadVideoById(tr.videoId); } catch (_) {}
          }
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) { play(index + 1); return; }
          state.playing = (e.data === YT.PlayerState.PLAYING);
          try { const d = player.getVideoData(); if (d && d.title) state.title = d.title; } catch (_) {}
          emit();
        },
      },
    });
  }

  // 사용자 제스처에서 호출되면 소리가 나도록 음소거 해제 + 볼륨
  function unmuteSoon() {
    try { if (player && player.unMute) { player.unMute(); player.setVolume(100); } } catch (_) {}
  }

  function play(i, gesture) {
    if (!queue.length) return;
    index = ((i % queue.length) + queue.length) % queue.length;
    const tr = queue[index];
    state.videoId = tr.videoId;
    state.title = tr.title || "재생 중…";
    state.hasQueue = true;
    started = true;
    wantPlay = true;
    emit();
    ensure();
    if (ready && player) {
      try { player.loadVideoById(tr.videoId); } catch (_) {}
      if (gesture) { unmuteSoon(); }
    }
  }

  window.musicPlayer = {
    setQueue(tracks) {
      queue = (tracks || []).map(t => ({ videoId: t.videoId, title: t.title }));
      state.hasQueue = queue.length > 0;
      if (!queue.length) { state.title = ""; state.videoId = null; state.playing = false; }
      if (index >= queue.length) index = 0;
      emit();
      if (queue.length) ensure();   // 미리 플레이어 준비 (자동재생은 OS 정책에 따름)
    },
    play(videoId) {
      const i = queue.findIndex(t => t.videoId === videoId);
      if (i >= 0) play(i, true); else ensure();
    },
    toggle() {
      ensure();
      unmuteSoon();
      if (!ready || !player) { if (queue.length) play(index, true); return; }
      const st = player.getPlayerState && player.getPlayerState();
      if (st === 1) { player.pauseVideo(); }
      else if (state.videoId) { player.playVideo(); }
      else if (queue.length) { play(index, true); }
    },
    next() { if (queue.length) play(index + 1, true); },
    prev() { if (queue.length) play(index - 1, true); },
    getState() { return state; },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();

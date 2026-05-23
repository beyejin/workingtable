/* global YT */
// ===========================================================
// 전역 음악 컨트롤러
// 숨겨진 YouTube IFrame 플레이어를 document.body 에 둬서
// React 탭 전환(컴포넌트 언마운트)과 무관하게 재생이 유지된다.
// macOS(WKWebView)는 화면 밖(offscreen) iframe 재생을 막으므로
// "화면 안이지만 보이지 않게" 둔다. 자동재생은 OS 정책상 차단될 수 있어
// 사용자가 ▶ 를 누르면(제스처) unMute 후 재생한다.
//
// v0.4.4: macOS Tauri (tauri://localhost) 에서 YT IFrame API 가 yt err 153 으로
// 영상 재생을 거부하는 문제 → enablejsapi 없는 raw <iframe> 모드로 자동 폴백.
// 자동 다음 곡은 YouTube의 ?playlist=v2,v3,... URL 파라미터로 위임.
// 윈도우(http://tauri.localhost)는 기존 YT.Player 그대로 사용.
// ===========================================================
(function () {
  // === 모드 감지 ===
  // tauri:// 비표준 스킴(macOS Tauri 기본)에서만 raw 모드 사용.
  // 윈도우는 http://tauri.localhost 이라 표준 origin → YT.Player 통과.
  const origin = (typeof window !== "undefined" && window.location && window.location.origin) || "";
  const useRawMode = /^tauri:\/\//i.test(origin);

  let player = null;
  let ready = false;
  let queue = [];       // [{ videoId, title }]
  let index = 0;
  let started = false;
  let wantPlay = false; // 준비되면 재생할지
  const state = { playing: false, title: "", videoId: null, hasQueue: false, debug: "" };
  const subs = new Set();
  const emit = () => { for (const fn of subs) fn(); };
  // 다른 PC(특히 macOS)에서 안 되는 케이스를 시각적으로 추적하기 위한 임시 표시.
  // 정상 동작 검증되면 다음 패치에서 제거.
  const setDebug = (msg) => { state.debug = msg ? String(msg).slice(0, 80) : ""; emit(); };

  // 화면 안이지만 거의 보이지 않는 호스트.
  // 일부 WebView(WKWebView 등)는 opacity가 너무 낮거나 z-index가 음수면
  // "보이지 않음"으로 간주해 미디어 재생을 차단할 수 있어 살짝 보이게 둔다.
  function host() {
    let el = document.getElementById("yt-music-host");
    if (!el) {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "position:fixed;right:0;bottom:0;width:320px;height:180px;opacity:0.05;pointer-events:none;z-index:0;overflow:hidden;";
      el = document.createElement("div");
      el.id = "yt-music-host";
      wrap.appendChild(el);
      document.body.appendChild(wrap);
    }
    return el;
  }

  // =========================================================
  // === RAW IFRAME MODE (macOS Tauri 우회) ==================
  // =========================================================
  function rawRemoveIframe() {
    const it = document.getElementById("yt-music-iframe");
    if (it && it.parentNode) it.parentNode.removeChild(it);
  }
  function rawCreateIframe(startIdx) {
    rawRemoveIframe();
    if (!queue.length) return;
    const cur = queue[startIdx];
    // 자동 다음 곡: YouTube 의 playlist URL 파라미터에 나머지 곡 ID 쉼표로.
    const rest = [];
    for (let k = 1; k < queue.length; k++) {
      rest.push(queue[(startIdx + k) % queue.length].videoId);
    }
    // enablejsapi 빼면 origin 검증이 느슨해져서 tauri://localhost 에서도 재생됨.
    // 대신 JS 로 pause/play 같은 정밀 제어는 불가 — toggle/next/prev 는
    // iframe 재생성으로 처리.
    const params = new URLSearchParams({
      autoplay: "1",
      playsinline: "1",
      controls: "0",
      rel: "0",
      modestbranding: "1",
    });
    if (rest.length) params.set("playlist", rest.join(","));
    const iframe = document.createElement("iframe");
    iframe.id = "yt-music-iframe";
    iframe.src = "https://www.youtube.com/embed/" + cur.videoId + "?" + params.toString();
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.setAttribute("frameborder", "0");
    iframe.style.cssText = "width:100%;height:100%;border:0;";
    host().appendChild(iframe);
  }

  // =========================================================
  // === YT.PLAYER MODE (Windows / 표준 origin) ==============
  // =========================================================
  function ensure() {
    if (player) return;
    if (window.YT && window.YT.Player) { setDebug("creating"); create(); return; }
    if (document.getElementById("__yt_api")) { setDebug("api 로딩"); return; }
    setDebug("api 받는중");
    const s = document.createElement("script");
    s.id = "__yt_api";
    s.src = "https://www.youtube.com/iframe_api";
    s.onerror = () => setDebug("api 로드 실패");
    document.head.appendChild(s);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (prev) { try { prev(); } catch (_) {} }
      setDebug("creating");
      create();
    };
  }

  function create() {
    if (player) return;
    // origin 파라미터: Tauri 의 비표준 스킴(예: macOS의 tauri://localhost)에서는
    // YouTube IFrame API의 postMessage 검증이 깨져 onReady 가 안 불린다.
    // http(s) 일 때만 전달.
    const playerVars = {
      autoplay: 1, mute: 1, controls: 0, disablekb: 1, playsinline: 1,
      enablejsapi: 1,
    };
    if (/^https?:\/\//i.test(origin)) playerVars.origin = origin;
    player = new YT.Player(host(), {
      height: "180", width: "320",
      // mute:1 — 자동재생 정책 우회. 사용자가 ▶ 누르면 unMute.
      playerVars,
      events: {
        onReady: function () {
          ready = true;
          setDebug("ready");
          // 사용자가 미리 ▶ 를 눌렀으면 → 즉시 로드 + unmute + 재생
          if (queue.length && wantPlay) {
            const tr = queue[index] || queue[0];
            try { player.loadVideoById(tr.videoId); } catch (_) {}
            try { player.unMute(); player.setVolume(100); } catch (_) {}
            try { player.playVideo(); } catch (_) {}
          } else if (queue.length && !started) {
            // 큐는 있지만 사용자가 아직 안 눌렀음 — 첫 곡만 미리 로드 (mute 상태)
            const tr = queue[index] || queue[0];
            try { player.cueVideoById(tr.videoId); } catch (_) {}
          }
        },
        onStateChange: function (e) {
          if (e.data === YT.PlayerState.ENDED) { play(index + 1); return; }
          state.playing = (e.data === YT.PlayerState.PLAYING);
          try { const d = player.getVideoData(); if (d && d.title) state.title = d.title; } catch (_) {}
          emit();
        },
        onError: function (e) {
          const code = e && e.data;
          const curVid = state.videoId || "?";
          // 2=invalid, 5=html5, 100=not found, 101/150=임베드 차단, 153=비공식 임베드/스트림 실패
          const meaning = ({
            2: "잘못된 영상 ID",
            5: "재생 불가 (HTML5)",
            100: "영상 없음/삭제됨",
            101: "임베드 차단됨",
            150: "임베드 차단됨",
            153: "임베드/스트림 거부",
          })[code] || ("코드 " + code);
          setDebug("yt err " + code + " · " + curVid + " · " + meaning);
          // 임베드/접근 차단 계열은 다음 곡으로 자동 스킵 (큐가 1곡 초과일 때만)
          if ([100, 101, 150, 153].indexOf(code) >= 0 && queue.length > 1) {
            setTimeout(() => play(index + 1, true), 600);
          }
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

    if (useRawMode) {
      state.playing = true; // raw 모드는 정확한 상태 추적 불가 — 낙관적 표시
      setDebug("raw iframe · " + (queue.length > 1 ? "자동 다음곡 ✓" : "1곡"));
      emit();
      rawCreateIframe(index);
      return;
    }

    emit();
    ensure();
    if (ready && player) {
      try { player.loadVideoById(tr.videoId); } catch (_) {}
      if (gesture) {
        // gesture context 안에서 동기 호출 — WKWebView 정책 통과 핵심
        try { player.unMute(); player.setVolume(100); } catch (_) {}
        try { player.playVideo(); } catch (_) {}
      }
    }
  }

  window.musicPlayer = {
    setQueue(tracks) {
      queue = (tracks || []).map(t => ({ videoId: t.videoId, title: t.title }));
      state.hasQueue = queue.length > 0;
      if (!queue.length) {
        state.title = ""; state.videoId = null; state.playing = false;
        if (useRawMode) rawRemoveIframe();
      }
      if (index >= queue.length) index = 0;
      // raw 모드에서 재생 중인데 큐가 바뀌면 iframe 재생성 (playlist param 갱신)
      if (useRawMode && state.playing && queue.length) {
        rawCreateIframe(index);
      }
      emit();
      if (queue.length && !useRawMode) ensure();
    },
    play(videoId) {
      const i = queue.findIndex(t => t.videoId === videoId);
      if (i >= 0) play(i, true);
      else if (!useRawMode) ensure();
    },
    toggle() {
      if (useRawMode) {
        // raw 모드: pause = iframe 제거(정지), play = iframe 생성
        if (state.playing) {
          rawRemoveIframe();
          state.playing = false;
          setDebug("정지");
          emit();
        } else if (queue.length) {
          play(index, true);
        }
        return;
      }
      // YT.Player 모드
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

  // raw 모드는 시작부터 표시 (사용자에게 환경 알려주기)
  if (useRawMode) setDebug("raw iframe 모드 (macOS)");
})();

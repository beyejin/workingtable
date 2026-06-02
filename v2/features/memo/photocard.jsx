/* global React, diary */
// ===========================================================
// 포토카드 모드 (탭 인라인 오버레이 버전)
// 포토카드 탭에 들어가면 "본문 영역"이 투명한 포토카드 틀이 된다.
// 가운데는 투명(앱 창이 투명하므로 뒤의 작업 창이 비침), 테두리(매트)가 프레임.
// 앱 안의 📸 캡처 버튼으로 투명 영역만 잘라 PNG로 저장한다.
// ===========================================================
(function () {
  const state = { shape: "rect", texture: "white" };
  const subs = new Set();
  const emit = () => { for (const fn of subs) fn(); };

  window.photocard = {
    getState() { return state; },
    set(patch) { Object.assign(state, patch); emit(); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();

function pcSetAlwaysOnTop(v) {
  try {
    const w = window.__TAURI__ && window.__TAURI__.window;
    if (w && w.getCurrentWindow) w.getCurrentWindow().setAlwaysOnTop(!!v);
  } catch (_) { /* 웹/권한없음 무시 */ }
}

function usePhotocard() {
  const [, f] = React.useState(0);
  React.useEffect(() => window.photocard.subscribe(() => f(x => x + 1)), []);
  return window.photocard;
}

const PC_SHAPES = [
  { id: "rect",     label: "기본" },
  { id: "polaroid", label: "폴라로이드" },
  { id: "circle",   label: "원형" },
  { id: "wide",     label: "와이드" },
];
const PC_TEXTURES = [
  { id: "white",  label: "화이트", color: "#ffffff" },
  { id: "yellow", label: "형광",   color: "#fdff85" },
  { id: "film",   label: "필름",   color: "#1c1c1c" },
  { id: "pastel", label: "파스텔", color: "#ffd6e0" },
  { id: "mint",   label: "민트",   color: "#c6ecd7" },
];

// 프레임(매트) 테두리 두께
function pcFrameBorder(shape) {
  if (shape === "polaroid") return "18px 18px 56px 18px";
  if (shape === "wide")     return "44px 18px";
  if (shape === "circle")   return "26px";
  return "22px";
}
function pcRadius(shape) {
  if (shape === "circle") return "50%";
  return 18;
}

// ---- 캡처: 투명 영역(innerRef)만 잘라 PNG 저장 ----
async function pcCapture(innerEl, setMsg) {
  if (!innerEl) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    setMsg("이 환경에선 앱 캡처 미지원 — Win+Shift+S 사용");
    return;
  }
  let stream;
  try {
    const rect = innerEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // 창 좌상단(물리 px) 구하기
    let originX = (window.screenX || 0) * dpr;
    let originY = (window.screenY || 0) * dpr;
    try {
      const T = window.__TAURI__;
      if (T && T.window && T.window.getCurrentWindow) {
        const pos = await T.window.getCurrentWindow().outerPosition();
        if (pos && typeof pos.x === "number") { originX = pos.x; originY = pos.y; }
      }
    } catch (_) {}

    const sx = Math.round(originX + rect.left * dpr);
    const sy = Math.round(originY + rect.top * dpr);
    const sw = Math.max(1, Math.round(rect.width * dpr));
    const sh = Math.max(1, Math.round(rect.height * dpr));

    setMsg("화면 선택창에서 ‘전체 화면’을 골라주세요…");
    stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 2 }, audio: false });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await new Promise(r => setTimeout(r, 350)); // 프레임 안정화

    const canvas = document.createElement("canvas");
    canvas.width = sw; canvas.height = sh;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

    canvas.toBlob((blob) => {
      if (!blob) { setMsg("캡처 실패"); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photocard-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setMsg("저장됨 ✓ (다운로드 폴더)");
    }, "image/png");
  } catch (e) {
    setMsg("캡처 취소/실패: " + (e && e.message ? e.message : e));
  } finally {
    if (stream) stream.getTracks().forEach(t => t.stop());
  }
}

// ---- 탭 인라인 뷰: 본문 영역을 채우는 투명 포토카드 틀 ----
function PhotocardView() {
  const pc = usePhotocard();
  const s = pc.getState();
  const tex = PC_TEXTURES.find(t => t.id === s.texture) || PC_TEXTURES[0];
  const innerRef = React.useRef(null);
  const [msg, setMsg] = React.useState("");

  // 포토카드 탭에 있는 동안 항상 위로 (뒤 작업창 위에 구도 잡기 편하게)
  React.useEffect(() => {
    pcSetAlwaysOnTop(true);
    return () => pcSetAlwaysOnTop(false);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 매트(틀) — 가운데 투명. 드래그로 창 이동 */}
      <div data-tauri-drag-region style={{
        position: "absolute", inset: 0, boxSizing: "border-box",
        background: "transparent",
        borderStyle: "solid",
        borderColor: tex.color,
        borderWidth: pcFrameBorder(s.shape),
        borderRadius: pcRadius(s.shape),
        boxShadow: "inset 0 0 0 1.4px rgba(0,0,0,.28), 0 10px 28px rgba(0,0,0,.22)",
      }}>
        {/* 캡처 기준이 되는 투명 내부 영역 */}
        <div ref={innerRef} data-tauri-drag-region style={{ width: "100%", height: "100%" }} />
      </div>

      {/* 하단 툴바 (클릭 가능) */}
      <div style={{
        position: "absolute", left: "50%", bottom: 10, transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", justifyContent: "center",
        background: "rgba(255,255,255,0.96)", border: "1.1px solid var(--ink)",
        borderRadius: 99, padding: "5px 8px", maxWidth: "94%",
        boxShadow: "0 4px 14px rgba(0,0,0,.22)",
      }}>
        {PC_SHAPES.map(o => (
          <button key={o.id} onClick={() => pc.set({ shape: o.id })} style={{
            all: "unset", cursor: "pointer", padding: "2px 8px", borderRadius: 99,
            border: "1.1px solid var(--ink)",
            background: s.shape === o.id ? "var(--point)" : "var(--paper)",
            fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
          }}>{o.label}</button>
        ))}
        <span style={{ width: 1, height: 16, background: "var(--ink-soft)" }} />
        {PC_TEXTURES.map(o => (
          <button key={o.id} onClick={() => pc.set({ texture: o.id })} title={o.label} style={{
            all: "unset", cursor: "pointer",
            width: 18, height: 18, borderRadius: "50%",
            background: o.color, border: s.texture === o.id ? "2px solid var(--ink)" : "1px solid var(--ink)",
            boxShadow: s.texture === o.id ? "0 0 0 2px var(--point)" : "none",
          }} />
        ))}
        <span style={{ width: 1, height: 16, background: "var(--ink-soft)" }} />
        <button onClick={() => pcCapture(innerRef.current, setMsg)} style={{
          all: "unset", cursor: "pointer", padding: "2px 10px", borderRadius: 99,
          border: "1.1px solid var(--ink)",
          background: "linear-gradient(180deg, var(--point-soft), var(--point))",
          fontFamily: "var(--hand)", fontWeight: 700, fontSize: 12, color: "var(--ink)",
        }}>📸 캡처</button>
      </div>

      {/* 안내 / 상태 메시지 */}
      <div style={{
        position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)",
        maxWidth: "90%", textAlign: "center",
        background: "rgba(255,255,255,0.92)", border: "1px solid var(--ink-soft)",
        borderRadius: 99, padding: "2px 10px",
        fontFamily: "var(--hand)", fontSize: 11, color: "var(--ink-2)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {msg || "틀을 작업창 위로 옮겨 구도를 잡고 📸 또는 Win+Shift+S"}
      </div>
    </div>
  );
}

window.PhotocardView = PhotocardView;
window.usePhotocard = usePhotocard;

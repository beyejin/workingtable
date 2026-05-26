/* global React, TodayView, TodoView, MemoView, MailView, PromptView, AIView, RetroView, SpriteIcon */
// ===========================================================
// 사이드 도크 v2 — 다이어리 인덱스 탭 + 뷰 전환
// 도크 본체 + 옆에 삐죽 나오는 종이 탭들.
// 탭 클릭 → 본문 영역 swap.
// 상단 현재 프로젝트 + 하단 타이머는 sticky (모든 탭 공통).
// ===========================================================

const { useState } = React;

// 탭별 도트 스프라이트 인덱스 — public/asset/Sprite-0002.png (6x4=24 셀, 16x16 각)
// [0]💖 [1]✨ [2]❗ [3]❓ [4]✓ [5]🔥 [6]☀ [7]☁ [8]🌧 [9]🌈 [10]🌙 [11]🌱
// [12]🍰 [13]☕ [14]🐭 [15]🐱 [16]🐻 [17]🐰 [18]✏ [19]📕 [20]🪙 [21]💊 [22]📝 [23]😺
const TABS = [
  { id: "todo",     labelKey: "tab.todo",     sprite:  4, color: "#d4ecdb", view: () => <TodoView /> },     // ✓ 체크
  { id: "cal",      labelKey: "tab.week",     sprite:  6, color: "#d4e6fa", view: () => <CalendarView /> }, // ☀ 해 (하루/달력)
  { id: "memo",     labelKey: "tab.memo",     sprite: 22, color: "#fff0c0", view: () => <MemoView /> },     // 📝 메모지
  { id: "mail",     labelKey: "tab.mail",     sprite:  0, color: "#ffe0d2", view: () => <MailView /> },     // 💖 하트 (러브레터 느낌)
  { id: "deco",     labelKey: "tab.deco",     sprite:  9, color: "#ffe6f0", view: () => null, foot: true }, // 🌈 무지개
  { id: "settings", labelKey: "tab.settings", sprite:  1, color: "#e6e6ee", view: () => null, foot: true }, // ✨ 반짝 (커스터마이즈)
];

function SideDockV2({ tweaks, setTweak }) {
  const [active, setActive] = useState("todo");
  const current = TABS.find(t => t.id === active);
  const isPhoto = active === "photo";

  // 실제 창 높이 추적 → 짧아지면 탭을 아이콘만(짧게)으로
  const [winH, setWinH] = React.useState(typeof window !== "undefined" ? window.innerHeight : 900);
  React.useEffect(() => {
    const on = () => setWinH(window.innerHeight);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  const compactTabs = winH < 640;

  const tabSide  = tweaks?.tabSide  ?? "right";
  const dockSide = tweaks?.dockSide ?? "left";
  const tabStyle = tweaks?.tabStyle ?? "paper";
  const desktopMode = tweaks?.desktopMode ?? false;
  const dockHidden = tweaks?.dockHidden ?? false;
  const tabsHidden = tweaks?.tabsHidden ?? false;

  // 도크 미니화 — 본체/탭/페이크 IDE 전부 가리고 작은 디지털 타이머 위젯만 남김.
  // 잡고 드래그로 옮길 수 있고, 클릭하면 도크 복귀.
  if (dockHidden) {
    return <DockRevealEdge tweaks={tweaks} setTweak={setTweak}
      onReveal={() => setTweak && setTweak("dockHidden", false)} />;
  }
  // 배경 (그라데이션 / 도형)
  const dockBg = buildBackground(
    tweaks?.bgType ?? "linear",
    tweaks?.bgAngle ?? 180,
    tweaks?.bgStops ?? [{ c: "#a9cdf5", p: 0 }, { c: "#ffffff", p: 100 }],
    tweaks?.bgShape ?? "none"
  );

  // 헤더·바 색 (타이틀바 / 헤더 / 인덱스 탭) — 흰색과 섞어 톤 조절
  const chrome = tweaks?.chromeColor ?? "#a9cdf5";
  const chromeGrad = tweaks?.chromeGradient ?? true;
  const chromeMix = (pct) => `color-mix(in srgb, ${chrome} ${pct}%, white)`;
  const titlebarBg = chromeGrad
    ? `linear-gradient(180deg, ${chromeMix(50)} 0%, ${chromeMix(85)} 100%)`
    : chromeMix(72);
  const headerBg = chromeGrad
    ? `linear-gradient(180deg, ${chromeMix(28)} 0%, ${chromeMix(8)} 100%)`
    : chromeMix(18);

  // 도크 측의 반대편으로 탭이 나오는 게 자연스러움
  const effectiveTabSide = dockSide === "left" ? tabSide : (tabSide === "right" ? "left" : "right");

  const DOCK_W = 380;

  return (
    <div style={{
      width: "100%", height: "100%",
      position: "relative", overflow: "hidden",
      background: desktopMode ? "transparent" : "#f5e9e2",
    }}>
      {/* 페이크 IDE 배경 — 도크 옆에 깔리는 코드 에디터 느낌 (데스크탑 모드에선 숨김) */}
      {!desktopMode && <FakeIde dockSide={dockSide} dockWidth={DOCK_W} />}

      {/* 도크 본체 */}
      <div className="dock-body" style={{
        position: "absolute", top: 0, bottom: 0,
        [dockSide]: 0,
        width: DOCK_W,
        background: (isPhoto && desktopMode) ? "transparent" : dockBg,
        borderRight:  dockSide === "left"  ? "1.1px solid var(--ink)" : "none",
        borderLeft:   dockSide === "right" ? "1.1px solid var(--ink)" : "none",
        boxShadow: dockSide === "left"
          ? "2px 0 0 var(--paper-3)"
          : "-2px 0 0 var(--paper-3)",
        display: "flex", flexDirection: "column",
        zIndex: 2,
      }}>
        {/* 글로시 스카이블루 헤더 — 드래그 영역 */}
        <div data-tauri-drag-region style={{
          height: 28,
          background: titlebarBg,
          color: "var(--ink)",
          fontFamily: "var(--hand)", fontSize: 13,
          padding: "5px 10px",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          borderBottom: "1.1px solid var(--ink)",
          userSelect: "none",
        }}>
          <ProjectSwitcher />
          <div data-tauri-drag-region style={{ flex: 1, alignSelf: "stretch" }} />
        </div>

        {/* sticky — 헤더 (제목/음악/타이머/디데이 각 한 줄) */}
        <div style={{
          padding: "9px 12px 10px",
          background: (isPhoto && desktopMode) ? "transparent" : headerBg,
          borderBottom: "1.1px solid var(--ink)",
          flexShrink: 0,
        }}>
          <HeaderDesktop />
        </div>

        {/* 본문 — 가운데 분할선 레이아웃 (각 뷰가 SplitPane로 위/아래 채움) */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {active === "settings"
            ? <SettingsView tweaks={tweaks} setTweak={setTweak} />
            : active === "deco"
              ? <DecorateView tweaks={tweaks} setTweak={setTweak} />
              : current.view()}
        </div>

      </div>

      {/* 다이어리 인덱스 탭들 — 도크 본체 옆에 삐죽 */}
      <DiaryTabs
        tabs={TABS}
        active={active}
        onSelect={setActive}
        dockSide={dockSide}
        tabSide={effectiveTabSide}
        dockWidth={DOCK_W}
        tabStyle={tabStyle}
        chrome={chrome}
        compact={compactTabs}
        autoHide={tabsHidden}
      />
    </div>
  );
}

// ---- 도크 미니화 시 디지털 타이머 위젯 ----
// 사용자가 끌어서 옮길 수 있는 작은 위젯. 배경은 도크와 같은 테마를 따라감.
// 클릭하면 도크 복귀, 드래그하면 위치 이동(저장됨).
function DockRevealEdge({ tweaks, setTweak, onReveal }) {
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dockSide = tweaks?.dockSide ?? "left";
  const isLeft = dockSide === "left";

  // 저장된 위치(없으면 도크 측 가장자리 세로 중앙에 붙임)
  const savedPos = tweaks?.dockMiniPos ?? null;
  const [pos, setPos] = useState(savedPos);
  React.useEffect(() => { setPos(savedPos); }, [savedPos]);

  // 작업 시간 구독
  const { state } = diary.useDiary();
  const minutes = diary.select.workMinutesToday(state);

  // 음악 재생 상태 구독
  const [musicPlaying, setMusicPlaying] = useState(
    () => !!(window.musicPlayer && window.musicPlayer.getState().playing)
  );
  React.useEffect(() => {
    if (!window.musicPlayer) return;
    const sync = () => setMusicPlaying(!!window.musicPlayer.getState().playing);
    sync();
    return window.musicPlayer.subscribe(sync);
  }, []);

  // 시간 표기 — 디지털 시계처럼
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const display = h > 0
    ? `${h}:${String(m).padStart(2, "0")}`
    : `${m}m`;

  const W = hover ? 82 : 74;
  const H = hover ? 44 : 40;
  const DRAG_THRESHOLD = 4;

  // 창 크기 바뀌면 위치 안전하게 클램프
  React.useEffect(() => {
    if (!pos) return;
    const onResize = () => {
      setPos(p => {
        if (!p) return p;
        return {
          x: Math.max(0, Math.min(window.innerWidth - W, p.x)),
          y: Math.max(0, Math.min(window.innerHeight - H, p.y)),
        };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [!!pos, W, H]);

  // 마우스 다운 — 드래그 시작. 거의 안 움직이면 클릭으로 간주.
  const onMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startElX = rect.left;
    const startElY = rect.top;
    let moved = false;
    let lastPos = { x: startElX, y: startElY };
    setDragging(true);

    const onMove = (ev) => {
      const dx = ev.clientX - startMouseX;
      const dy = ev.clientY - startMouseY;
      if (!moved && Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
        moved = true;
      }
      if (moved) {
        const nx = Math.max(0, Math.min(window.innerWidth - W, startElX + dx));
        const ny = Math.max(0, Math.min(window.innerHeight - H, startElY + dy));
        lastPos = { x: nx, y: ny };
        setPos(lastPos);
      }
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setDragging(false);
      if (moved) {
        if (setTweak) setTweak("dockMiniPos", lastPos);
      } else if (onReveal) {
        onReveal();
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // 위치 모드: 드래그 한 적 있음 → 떠다님(사방 둥근 모서리). 없음 → 도크 측 가장자리에 붙음.
  const isFloating = !!pos;
  const positionStyle = isFloating
    ? { left: pos.x, top: pos.y, transform: "none" }
    : { top: "50%", transform: "translateY(-50%)", [isLeft ? "left" : "right"]: 0 };
  const borderRadius = isFloating
    ? 10
    : (isLeft ? "0 10px 10px 0" : "10px 0 0 10px");
  const borderStyle = "1.1px solid var(--ink)";

  // 도크 본체와 같은 테마 배경 (그라데이션 + 도형)
  const themeBg = buildBackground(
    tweaks?.bgType ?? "linear",
    tweaks?.bgAngle ?? 180,
    tweaks?.bgStops ?? [{ c: "#a9cdf5", p: 0 }, { c: "#ffffff", p: 100 }],
    tweaks?.bgShape ?? "none"
  );

  return (
    <button
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={L("set.dockMiniTip")}
      style={{
        all: "unset",
        cursor: dragging ? "grabbing" : "grab",
        position: "fixed",
        ...positionStyle,
        width: W,
        height: H,
        background: themeBg,
        // 작은 위젯 안에서도 패턴이 잘 보이도록 약간 줌인
        backgroundSize: "180% 180%",
        backgroundPosition: "center center",
        border: borderStyle,
        // 가장자리 붙은 상태면 화면 모서리 쪽만 보더 없앰
        borderLeft:  (!isFloating && isLeft)  ? "none" : borderStyle,
        borderRight: (!isFloating && !isLeft) ? "none" : borderStyle,
        borderRadius,
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.35), inset 0 -1px 1px rgba(0,0,0,0.08), 2px 2px 0 var(--paper-3), 3px 3px 12px rgba(138,106,94,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        color: "var(--ink)",
        fontFamily: "var(--mono)",
        fontSize: hover ? 17 : 16,
        fontWeight: 700,
        letterSpacing: "0.02em",
        // 글자가 패턴 위에서 잘 보이게 가는 종이 그림자
        textShadow: "0 1px 0 rgba(255,255,255,0.55)",
        transition: dragging ? "none" : "width 0.18s, height 0.18s, font-size 0.18s",
        zIndex: 10,
        userSelect: "none",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 11, opacity: 0.7, textShadow: "none" }}>⏱</span>
      <span style={{ lineHeight: 1 }}>{display}</span>

      {/* 음악 재생 중 — 모서리 작은 ♪ */}
      {musicPlaying && (
        <span style={{
          position: "absolute",
          top: 3,
          right: 5,
          fontSize: 9,
          color: "var(--ink-2)",
          opacity: 0.85,
          letterSpacing: 0,
          textShadow: "none",
        }}>♪</span>
      )}
    </button>
  );
}

// ---- 활성 탭 헤더 (sticky 글래스 영역) ----
function tabHeaderInfo(active, state) {
  const sel = diary.select;
  const project = sel.currentProject(state);
  switch (active) {
    case "today": {
      const notDone = sel.todosForCurrent(state).filter(t => !t.done).length;
      const minutes = sel.workMinutesToday(state);
      const unreplied = (state.emails ?? []).filter(e => !e.replied).length;
      return { ttl: `오늘 — ${diary.fmtKDate(diary.today())}`, sub: `작업 ${minutes}m · ${notDone}개 할 일 · ${unreplied}개 미답 메일` };
    }
    case "todo": {
      const items = sel.todosForCurrent(state);
      const notDone = items.filter(t => !t.done).length;
      const hot = items.filter(t => t.hot && !t.done).length;
      return { ttl: "할 일", sub: `${notDone}개 남음 · ${hot}개 급함` };
    }
    case "memo": {
      const cnt = (sel.memosForCurrent ? sel.memosForCurrent(state) : []).length;
      return { ttl: "메모", sub: `${project?.name ?? "프로젝트"} · ${cnt}개 · 자동 저장` };
    }
    case "prompt":
      return { ttl: "프롬프트 함", sub: `${(state.prompts ?? []).length}개 보관됨 · 자주 쓰는 순` };
    case "mail": {
      const unreplied = (state.emails ?? []).filter(e => !e.replied).length;
      return { ttl: "고객 문의", sub: `${unreplied}개 미답 · 답장 체크하면 자동 정리` };
    }
    case "retro":
      return { ttl: "회고", sub: "날짜별 한 개 · 자동 저장" };
    default:
      return { ttl: "", sub: "" };
  }
}

function TabHeader({ active }) {
  const { state } = diary.useDiary();
  const { ttl, sub } = tabHeaderInfo(active, state);
  return (
    <div>
      <div style={{
        fontFamily: "var(--hand)", fontSize: 15, fontWeight: 700, color: "var(--ink)",
        lineHeight: 1.15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{ttl}</div>
      {sub && (
        <div className="sk-cap" style={{
          fontSize: 12, lineHeight: 1.15, marginTop: 1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{sub}</div>
      )}
    </div>
  );
}

// ---- 다이어리 인덱스 탭 ----
function DiaryTabs({ tabs, active, onSelect, dockSide, tabSide, dockWidth, tabStyle, chrome, compact, autoHide }) {
  const cm = (pct) => `color-mix(in srgb, ${chrome || "#a9cdf5"} ${pct}%, white)`;
  // 탭이 도크의 어느 쪽 바깥에 붙는지 → 위치 계산
  const onLeft = tabSide === "left";

  // 탭 컨테이너 위치
  const containerPos = {};
  if (dockSide === "left") {
    // 도크가 왼쪽에 있음 → 탭은 도크의 오른쪽 모서리에 붙음
    containerPos.left = dockWidth;
  } else {
    // 도크가 오른쪽에 있음 → 탭은 도크의 왼쪽 모서리에 붙음
    containerPos.right = dockWidth;
  }
  const stickRight = dockSide === "left"; // 탭이 오른쪽으로 삐쳐나옴

  const TAB_W = 32;     // 삐쳐나온 깊이
  const TAB_H = compact ? 40 : 74;   // 짧을 땐 아이콘만(낮은 탭)
  const TAB_GAP = 4;

  // ---- 자동 숨김 로직 ----
  // autoHide=true 일 때: 처음엔 숨김. 가장자리 영역에 마우스 2초 호버 → 슬라이드로 노출.
  // 마우스가 영역 밖으로 나가면 다시 접힘. (호버 중 2초 안 채우고 떼면 타이머 취소.)
  const REVEAL_DELAY = 1500;
  const HIDE_DELAY = 220;  // 살짝 여유 — 탭 사이 갭으로 마우스가 잠깐 빠져나가도 바로 안 접힘
  const [revealed, setRevealed] = useState(false);
  const revealTimerRef = React.useRef(null);
  const hideTimerRef = React.useRef(null);

  React.useEffect(() => {
    // autoHide 끄면 즉시 보이게
    if (!autoHide) {
      setRevealed(false);  // shown state moot
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      // 처음엔 숨김
      setRevealed(false);
    }
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [autoHide]);

  const onZoneEnter = () => {
    if (!autoHide) return;
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (revealed) return;
    if (revealTimerRef.current) return;
    revealTimerRef.current = setTimeout(() => {
      setRevealed(true);
      revealTimerRef.current = null;
    }, REVEAL_DELAY);
  };

  const onZoneLeave = () => {
    if (!autoHide) return;
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    if (!revealed) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setRevealed(false);
      hideTimerRef.current = null;
    }, HIDE_DELAY);
  };

  const hidden = autoHide && !revealed;

  const renderTab = (t) => {
    const isActive = t.id === active;
    return (
      <button
        key={t.id}
        onClick={() => onSelect(t.id)}
        style={{
          all: "unset",
          cursor: "pointer",
          width: TAB_W + (isActive ? 6 : 0),
          height: TAB_H,
          marginLeft: stickRight ? (isActive ? -4 : 0) : 0,
          marginRight: !stickRight ? (isActive ? -4 : 0) : 0,
          background: isActive ? cm(72) : cm(42),
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          border: "1.1px solid var(--ink)",
          borderLeft:  stickRight ? "none" : `1.1px solid var(--ink)`,
          borderRight: stickRight ? `1.1px solid var(--ink)` : "none",
          borderRadius: stickRight ? "0 12px 12px 0" : "12px 0 0 12px",
          boxShadow: stickRight ? "1.5px 1.5px 0 var(--paper-3)" : "-1.5px 1.5px 0 var(--paper-3)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 3,
          fontFamily: "var(--hand)", overflow: "hidden",
          transition: "width 0.18s, margin 0.18s, background 0.15s",
          filter: isActive ? "none" : "saturate(0.85)",
        }}
        title={L(t.labelKey)}
      >
        <SpriteIcon idx={t.sprite} size={compact ? 20 : 16} title={L(t.labelKey)} style={{ flexShrink: 0 }} />
        {!compact && (
          <span style={{
            writingMode: "vertical-rl", textOrientation: "mixed",
            fontSize: 11, letterSpacing: "0.01em", color: "var(--ink)",
            fontWeight: isActive ? 700 : 400,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxHeight: TAB_H - 24,
          }}>{L(t.labelKey)}</span>
        )}
      </button>
    );
  };

  // 슬라이드 — 숨김 시 도크 본체 쪽으로 살짝 들어가서 본체에 가려짐 (dock-body z-index:2 > tabs z-index:1)
  // 약간 더 들여서(TAB_W + 8) 살짝 비어 보이는 틈을 없앤다.
  const slideOffset = TAB_W + 8;
  const hiddenTransform = stickRight
    ? `translateX(-${slideOffset}px)`
    : `translateX(${slideOffset}px)`;

  // 호버 감지 영역 — 도크 본체 바로 옆. 숨김 상태에서도 충분히 넓어야 마우스가 쉽게 닿음.
  // (TAB_W=32, 펼친 탭은 +6 → 38px. 호버 영역은 이보다 약간 더 넓게 둠.)
  const HOVER_ZONE_W = autoHide && !revealed ? 36 : (TAB_W + 12);

  return (
    <div
      onMouseEnter={onZoneEnter}
      onMouseLeave={onZoneLeave}
      style={{
        position: "absolute",
        top: 0, bottom: 0,
        ...containerPos,
        width: HOVER_ZONE_W,
        zIndex: 1,
        pointerEvents: "auto",
      }}
    >
      {/* 숨김 상태에서 가장자리에 살짝 보이는 힌트 — 마우스 가져오라는 표시 */}
      {hidden && (
        <div style={{
          position: "absolute",
          top: 72,
          [stickRight ? "left" : "right"]: 0,
          width: 3,
          height: 60,
          background: cm(35),
          borderRadius: stickRight ? "0 3px 3px 0" : "3px 0 0 3px",
          opacity: 0.6,
          pointerEvents: "none",
        }} />
      )}

      <div style={{
        position: "absolute",
        top: 70,
        [stickRight ? "left" : "right"]: 0,
        display: "flex", flexDirection: "column", gap: TAB_GAP,
        alignItems: stickRight ? "flex-start" : "flex-end",
        transform: hidden ? hiddenTransform : "none",
        transition: "transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {tabs.map(renderTab)}
      </div>
    </div>
  );
}

// ---- 페이크 IDE 배경 ----
function FakeIde({ dockSide, dockWidth }) {
  const ideStyle = {
    position: "absolute", top: 0, bottom: 24,
    [dockSide === "left" ? "left" : "right"]: dockWidth,
    [dockSide === "left" ? "right" : "left"]: 0,
    background: "var(--paper-2)",
    color: "var(--ink-2)",
    fontFamily: "var(--mono)", fontSize: 11,
    padding: "30px 24px",
    overflow: "hidden",
  };
  return (
    <>
      <div className="fake-ide" style={ideStyle}>
        <div style={{ color: "var(--ink-3)", marginBottom: 16, fontFamily: "var(--hand-2)", fontSize: 15 }}>✿ 이건 참고용 페이크 IDE — 다이어리가 실제로 어디 도킹되는지 보여주려고</div>
        <div style={{ color: "var(--ink)" }}>vibe-diary / src / components / Timer.tsx</div>
        <pre style={{ color: "var(--ink-2)", lineHeight: 1.65, marginTop: 14 }}>
{`export function Timer({ minutes = 25 }) {
  const [left, setLeft] = useState(minutes * 60);
  useEffect(() => {
    const id = setInterval(() => setLeft(s => s - 1), 1000);
    return () => clearInterval(id);
  }, []);

  // TODO: 알림 권한 / 사운드 옵션 토글
  return (
    <div className="timer">
      {format(left)}
    </div>
  );
}`}
        </pre>
      </div>
      {/* 페이크 작업표시줄 */}
      <div className="xp-taskbar fake-taskbar" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 24, fontSize: 11, padding: "3px 8px" }}>
        <span className="xp-start" style={{ fontSize: 11, padding: "1px 12px 2px 10px" }}>start ♡</span>
        <span style={{ color: "var(--ink-2)" }}>VS Code</span>
        <span style={{ color: "var(--ink-3)" }}>|</span>
        <span style={{
          background: "var(--pink)", color: "var(--ink)",
          padding: "1px 10px", borderRadius: 99,
          fontFamily: "var(--hand)", fontSize: 11,
          border: "1.1px solid var(--ink)",
        }}>♡ 다이어리</span>
        <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-2)" }}>14:23 · 다음 스트레칭 23m</span>
      </div>
    </>
  );
}

// ===========================================================
// 헤더 — 제목/음악/타이머/디데이 각 한 줄 (별도 창 크롬 없음)
// ===========================================================
function HeaderDesktop() {
  return <Timer />;
}

// ===========================================================
// 설정 — 커스터마이징 (포인트 컬러 / 도크 위치 / 탭 방향 / 투명모드 / 초기화)
// ===========================================================
function SettingsView({ tweaks, setTweak }) {
  const t = tweaks || {};
  const set = setTweak || (() => {});
  const i18 = useI18n();
  return (
    <div style={{ height: "100%", overflowY: "auto", overflowX: "hidden", padding: "14px 16px" }}>
      <SetSection label={L("set.lang")}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {i18.list().map(([code, name]) => (
            <button key={code} onClick={() => i18.set(code)} style={{
              all: "unset", cursor: "pointer", padding: "5px 12px", borderRadius: 99,
              border: "1.1px solid var(--ink)",
              background: i18.get() === code ? "var(--hi)" : "var(--paper)",
              fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
            }}>{name}</button>
          ))}
        </div>
      </SetSection>

      <SetSection label={L("set.size")}>
        <SetSeg value={t.appSize ?? "normal"} onChange={v => set("appSize", v)}
          options={[["normal", L("set.sizeNormal")], ["medium", L("set.sizeMedium")], ["compact", L("set.sizeCompact")]]} />
      </SetSection>

      <SetSection label={L("set.dock")}>
        <SetSeg value={t.dockSide ?? "left"} onChange={v => set("dockSide", v)}
          options={[["left", L("set.left")], ["right", L("set.right")]]} />
      </SetSection>

      <SetSection label={L("set.dockHide")}>
        <SetSeg value={t.dockHidden ? "on" : "off"} onChange={v => set("dockHidden", v === "on")}
          options={[["on", L("set.on")], ["off", L("set.off")]]} />
        <div className="sk-cap" style={{ marginTop: 6, fontSize: 11 }}>{L("set.dockHideHint")}</div>
      </SetSection>

      <SetSection label={L("set.tabsAutoHide")}>
        <SetSeg value={t.tabsHidden ? "on" : "off"} onChange={v => set("tabsHidden", v === "on")}
          options={[["on", L("set.on")], ["off", L("set.off")]]} />
        <div className="sk-cap" style={{ marginTop: 6, fontSize: 11 }}>{L("set.tabsAutoHideHint")}</div>
      </SetSection>

      <SetSection label={L("set.alwaysOnTop")}>
        <SetSeg value={t.alwaysOnTop ? "on" : "off"} onChange={v => set("alwaysOnTop", v === "on")}
          options={[["on", L("set.on")], ["off", L("set.off")]]} />
        <div className="sk-cap" style={{ marginTop: 6, fontSize: 11 }}>{L("set.alwaysOnTopHint")}</div>
      </SetSection>

      <SetSection label={L("set.data")}>
        <button onClick={() => diary.actions.hardReset()} style={{
          all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box",
          textAlign: "center", padding: "8px 12px", borderRadius: 10,
          border: "1.1px solid var(--ink)", background: "var(--bad)", color: "#fff",
          fontFamily: "var(--hand)", fontWeight: 700, fontSize: 14,
        }}>{L("set.reset")}</button>
        <div className="sk-cap" style={{ marginTop: 6, fontSize: 12 }}>{L("set.resetCaption")}</div>
      </SetSection>
    </div>
  );
}

// ===========================================================
// 꾸미기 — 테마 / 포인트 컬러 / 그라데이션 편집기 (다중 색 스탑)
// ===========================================================
const DECO_THEMES = [
  { nameKey: "th.basic",    type: "linear", angle: 180, chrome: "#a9cdf5", stops: [{ c: "#a9cdf5", p: 0 }, { c: "#ffffff", p: 100 }] },
  { nameKey: "th.melon",    type: "linear", angle: 180, chrome: "#9ef0c4", stops: [{ c: "#9ef0c4", p: 0 }, { c: "#d9f7ea", p: 50 }, { c: "#ffffff", p: 100 }] },
  { nameKey: "th.summer",   type: "linear", angle: 180, chrome: "#7fd8f0", stops: [{ c: "#7fd8f0", p: 0 }, { c: "#bafff0", p: 40 }, { c: "#fff7c0", p: 100 }] },
  { nameKey: "th.green",    type: "linear", angle: 180, chrome: "#bce98f", stops: [{ c: "#bce98f", p: 0 }, { c: "#e2f6cf", p: 55 }, { c: "#ffffff", p: 100 }] },
  { nameKey: "th.milk",     type: "radial", angle: 180, chrome: "#ffb3c8", stops: [{ c: "#ffb3c8", p: 0 }, { c: "#ffe3ec", p: 55 }, { c: "#fff6f0", p: 100 }] },
  { nameKey: "th.peach",    type: "linear", angle: 180, chrome: "#ffd9c2", stops: [{ c: "#ffd9c2", p: 0 }, { c: "#fff0e6", p: 55 }, { c: "#ffffff", p: 100 }] },
  { nameKey: "th.lavender", type: "radial", angle: 180, chrome: "#d8cdf5", stops: [{ c: "#d8cdf5", p: 0 }, { c: "#ece6fb", p: 55 }, { c: "#ffffff", p: 100 }] },
  { nameKey: "th.night",    type: "linear", angle: 180, chrome: "#8aa0c8", stops: [{ c: "#3a4a6b", p: 0 }, { c: "#8aa0c8", p: 60 }, { c: "#e3eefc", p: 100 }] },
];
const DECO_PALETTE = [
  "#a9cdf5", "#7fb5f0", "#5b8fd6", "#7fd8f0", "#5ec8e0", "#bafff0",
  "#aef0c8", "#9ef0c4", "#bce98f", "#a3d977", "#fdff85", "#fff0a0",
  "#ffe3a0", "#ffd3b6", "#ffb38a", "#ffb3c8", "#ff9bb3", "#ffc7d4",
  "#f7a8c4", "#d8cdf5", "#b9a3e8", "#c8dffb", "#cfd6e0", "#9aa7b8",
  "#3a4a6b", "#28333f", "#1c1c1c", "#ffffff",
];
const DECO_ACCENTS = ["#fdff85", "#ffc7d4", "#c5e8d4", "#c8dffb", "#d8cdf5", "#ffd3b6", "#bafff0", "#ffb38a"];
const DECO_DIRS = [["↖", 315], ["↑", 0], ["↗", 45], ["←", 270], ["↓", 180], ["→", 90], ["↙", 225], ["↘", 135]];

function DecorateView({ tweaks, setTweak }) {
  const t = tweaks || {};
  const set = setTweak || (() => {});
  const bgType = t.bgType ?? "linear";
  const bgAngle = t.bgAngle ?? 180;
  const bgShape = t.bgShape ?? "none";
  const stops = t.bgStops ?? [{ c: "#a9cdf5", p: 0 }, { c: "#ffffff", p: 100 }];
  const previewBg = buildBackground(bgType, bgAngle, stops, bgShape);

  const setStops = (next) => set("bgStops", next);
  const updColor = (i, c) => setStops(stops.map((s, idx) => idx === i ? { ...s, c } : s));
  const updPos = (i, p) => setStops(stops.map((s, idx) => idx === i ? { ...s, p } : s));
  const addStop = () => { if (stops.length >= 4) return; const n = [...stops]; n.splice(n.length - 1, 0, { c: "#ffd3b6", p: 50 }); setStops(n); };
  const removeStop = (i) => { if (stops.length <= 2) return; setStops(stops.filter((_, idx) => idx !== i)); };
  const applyTheme = (th) => {
    set("bgType", th.type); set("bgAngle", th.angle); set("bgStops", th.stops);
    if (th.chrome) set("chromeColor", th.chrome);
    if (th.accent) { set("tabAccent", th.accent); document.documentElement.style.setProperty("--hi", th.accent); }
  };
  useI18n();
  const myThemes = t.myThemes ?? [];
  const saveMyTheme = async () => {
    const name = await window.dialog.prompt(L("deco.saveName"), L("deco.myThemeName") + (myThemes.length + 1));
    if (!name?.trim()) return;
    const cur = { name: name.trim(), type: bgType, angle: bgAngle, stops, chrome: t.chromeColor ?? "#a9cdf5", accent: t.tabAccent };
    set("myThemes", [...myThemes, cur]);
  };
  const delMyTheme = (i) => set("myThemes", myThemes.filter((_, idx) => idx !== i));
  const [sec, setSec] = useState("theme");

  const themeBtn = (th, i, mine) => (
    <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1.1px solid var(--ink)" }}>
      <button onClick={() => applyTheme(th)} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
        <div style={{ height: 34, background: buildGradient(th.type, th.angle, th.stops) }} />
        <div style={{ padding: mine ? "3px 16px 3px 6px" : "3px 6px", textAlign: mine ? "left" : "center", fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)", background: "var(--paper)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{mine ? th.name : L(th.nameKey)}</div>
      </button>
      {mine && (
        <button onClick={() => delMyTheme(i)} title="삭제" style={{
          all: "unset", cursor: "pointer", position: "absolute", top: 2, right: 2,
          width: 16, height: 16, borderRadius: "50%", display: "grid", placeItems: "center",
          background: "rgba(255,255,255,0.85)", border: "1px solid var(--ink)", fontSize: 9, color: "var(--ink)",
        }}>✕</button>
      )}
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* 상단 세그먼트 */}
      <div style={{ padding: "12px 14px 8px", flexShrink: 0 }}>
        <SegTabs value={sec} onChange={setSec} options={[["theme", L("deco.theme")], ["bg", L("deco.bg")], ["color", L("deco.color")]]} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", padding: "4px 14px 16px" }}>
        {/* ── 테마 ── */}
        {sec === "theme" && (
          <>
            <SetSection label={L("deco.baseTheme")}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {DECO_THEMES.map((th, i) => themeBtn(th, th.nameKey, false))}
              </div>
            </SetSection>
            <SetSection label={`${L("deco.myTheme")} · ${myThemes.length}`}>
              {myThemes.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 8 }}>
                  {myThemes.map((th, i) => themeBtn(th, i, true))}
                </div>
              )}
              <button onClick={saveMyTheme} style={{
                all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", textAlign: "center",
                padding: "8px", borderRadius: 10,
                border: "1.1px solid var(--ink)", background: "linear-gradient(180deg, var(--point-soft), var(--point))",
                fontFamily: "var(--hand)", fontWeight: 700, fontSize: 13, color: "var(--ink)",
              }}>{L("deco.save")}</button>
            </SetSection>
          </>
        )}

        {/* ── 배경 ── */}
        {sec === "bg" && (
          <>
            <SetSection label={L("deco.preview")}>
              <div style={{ height: 64, borderRadius: 10, border: "1.1px solid var(--ink)", background: previewBg }} />
            </SetSection>
            <SetSection label={L("deco.type")}>
              <SetSeg value={bgType} onChange={v => set("bgType", v)} options={[["linear", L("deco.linear")], ["radial", L("deco.radial")]]} />
            </SetSection>
            <SetSection label={L("deco.shape")}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[["none", "deco.shapeNone"], ["heart", "deco.shapeHeart"], ["hearts", "deco.shapeHearts"], ["stars", "deco.shapeStars"], ["clover", "deco.shapeClover"], ["ribbon", "deco.shapeRibbon"], ["fish", "deco.shapeFish"]].map(([v, k]) => (
                  <button key={v} onClick={() => set("bgShape", v)} style={{
                    all: "unset", cursor: "pointer", padding: "5px 12px", borderRadius: 99,
                    border: "1.1px solid var(--ink)", background: bgShape === v ? "var(--hi)" : "var(--paper)",
                    fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
                  }}>{L(k)}</button>
                ))}
              </div>
            </SetSection>
            {bgShape === "none" && bgType === "linear" && (
              <SetSection label={L("deco.dir")}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {DECO_DIRS.map(([a, ang]) => (
                    <button key={ang} onClick={() => set("bgAngle", ang)} style={{
                      all: "unset", cursor: "pointer", height: 30, borderRadius: 7,
                      display: "grid", placeItems: "center", fontSize: 15,
                      border: "1.1px solid var(--ink)", background: bgAngle === ang ? "var(--hi)" : "var(--paper)", color: "var(--ink)",
                    }}>{a}</button>
                  ))}
                </div>
              </SetSection>
            )}
            <SetSection label={`${L("deco.stops")} · ${stops.length}`}>
              {stops.map((s, i) => (
                <StopRow key={i} stop={s} palette={DECO_PALETTE}
                  onColor={c => updColor(i, c)} onPos={p => updPos(i, p)}
                  onRemove={() => removeStop(i)} canRemove={stops.length > 2} />
              ))}
              {stops.length < 4 && (
                <button onClick={addStop} style={{
                  all: "unset", cursor: "pointer", display: "block", width: "100%", boxSizing: "border-box", textAlign: "center",
                  padding: "6px", borderRadius: 8, border: "1.1px dashed var(--ink-2)", marginTop: 4,
                  fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink-2)",
                }}>{L("deco.addColor")}</button>
              )}
            </SetSection>
          </>
        )}

        {/* ── 색상 ── */}
        {sec === "color" && (
          <>
            <SetSection label={L("deco.point")}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {DECO_ACCENTS.map(c => (
                  <button key={c} onClick={() => { applyAccent(c); set("tabAccent", c); }} style={{
                    all: "unset", cursor: "pointer", width: 30, height: 30, borderRadius: "50%", background: c,
                    border: t.tabAccent === c ? "2.6px solid var(--ink)" : "1.1px solid var(--ink)",
                    boxShadow: t.tabAccent === c ? "0 0 0 2px var(--paper-3)" : "none",
                  }} />
                ))}
                <ColorPick value={t.tabAccent ?? "#fdff85"} onChange={c => { applyAccent(c); set("tabAccent", c); }} round />
              </div>
            </SetSection>
            <SetSection label={L("deco.chrome")}>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
                {DECO_PALETTE.map(c => (
                  <button key={c} onClick={() => set("chromeColor", c)} style={{
                    all: "unset", cursor: "pointer", width: 24, height: 24, borderRadius: 6, background: c,
                    border: (t.chromeColor ?? "#a9cdf5") === c ? "2.6px solid var(--ink)" : "1.1px solid var(--ink)",
                    boxShadow: (t.chromeColor ?? "#a9cdf5") === c ? "0 0 0 2px var(--paper-3)" : "none",
                  }} />
                ))}
                <ColorPick value={t.chromeColor ?? "#a9cdf5"} onChange={c => set("chromeColor", c)} />
              </div>
            </SetSection>
            <SetSection label={L("deco.headerGrad")}>
              <SetSeg value={(t.chromeGradient ?? true) ? "on" : "off"} onChange={v => set("chromeGradient", v === "on")}
                options={[["on", L("set.on")], ["off", L("set.off")]]} />
            </SetSection>
          </>
        )}
      </div>
    </div>
  );
}

// 꾸미기 상단 세그먼트 (테마 / 배경 / 색상)
function SegTabs({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "var(--paper-2)", borderRadius: 99, padding: 3, border: "1.1px solid var(--ink)" }}>
      {options.map(([v, lbl]) => (
        <button key={v} onClick={() => onChange(v)} style={{
          all: "unset", cursor: "pointer", flex: 1, textAlign: "center", padding: "5px 0", borderRadius: 99,
          background: value === v ? "var(--hi)" : "transparent",
          fontFamily: "var(--hand)", fontSize: 13, fontWeight: value === v ? 700 : 400, color: "var(--ink)",
        }}>{lbl}</button>
      ))}
    </div>
  );
}

function StopRow({ stop, palette, onColor, onPos, onRemove, canRemove }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={() => setOpen(o => !o)} title="색 선택" style={{
          all: "unset", cursor: "pointer", width: 24, height: 24, borderRadius: 6, flexShrink: 0,
          background: stop.c, border: "1.1px solid var(--ink)",
        }} />
        <input type="range" min="0" max="100" value={stop.p} onChange={e => onPos(Number(e.target.value))}
          style={{ flex: 1, accentColor: "var(--ink)" }} />
        <span style={{ fontFamily: "var(--mono)", fontSize: 11, width: 34, textAlign: "right", color: "var(--ink-2)" }}>{stop.p}%</span>
        {canRemove && <button onClick={onRemove} title="삭제" style={{ all: "unset", cursor: "pointer", color: "var(--ink-3)", fontSize: 13, padding: "0 2px" }}>✕</button>}
      </div>
      {open && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6, padding: 6, border: "1px solid var(--ink-soft)", borderRadius: 8, background: "var(--paper)", alignItems: "center" }}>
          {palette.map(c => (
            <button key={c} onClick={() => { onColor(c); }} style={{
              all: "unset", cursor: "pointer", width: 22, height: 22, borderRadius: 5, background: c,
              border: stop.c === c ? "2px solid var(--ink)" : "1px solid var(--ink-soft)",
            }} />
          ))}
          <ColorPick value={stop.c} onChange={onColor} />
        </div>
      )}
    </div>
  );
}

// 직접 색 선택 (네이티브 컬러 피커)
function ColorPick({ value, onChange, round }) {
  return (
    <label title="직접 색 선택" style={{
      position: "relative", cursor: "pointer",
      width: round ? 30 : 22, height: round ? 30 : 22,
      borderRadius: round ? "50%" : 5, overflow: "hidden",
      border: "1.1px dashed var(--ink)",
      display: "inline-grid", placeItems: "center",
      background: "conic-gradient(from 0deg, #ff5e5e, #ffe14d, #6dff6d, #4de1ff, #6d6dff, #ff5edb, #ff5e5e)",
    }}>
      <span style={{ fontSize: 11, color: "#fff", textShadow: "0 0 2px rgba(0,0,0,.7)", fontWeight: 700 }}>＋</span>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", border: "none", padding: 0 }} />
    </label>
  );
}

function SetSection({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="sk-label" style={{ marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  );
}

function SetSeg({ value, onChange, options }) {
  return (
    <div style={{ display: "inline-flex", borderRadius: 99, border: "1.1px solid var(--ink)", overflow: "hidden" }}>
      {options.map(([v, lbl], i) => (
        <button key={v} onClick={() => onChange(v)} style={{
          all: "unset", cursor: "pointer", padding: "5px 16px",
          borderLeft: i ? "1.1px solid var(--ink)" : "none",
          background: value === v ? "var(--hi)" : "var(--paper)",
          fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
        }}>{lbl}</button>
      ))}
    </div>
  );
}

// ===========================================================
// 키보드형 입력창 — 탭 맥락에 맞춰 빠르게 추가
// ===========================================================
function KeyboardInput({ active }) {
  const { state, actions } = diary.useDiary();
  const [v, setV] = useState("");

  const CFG = {
    todo:  { ph: "할 일 추가…  (Enter 저장 · Shift+Enter 줄바꿈)",      add: (t) => actions.addTodo(t) },
    memo:  { ph: "메모 추가…  (Enter 저장 · Shift+Enter 줄바꿈)",       add: (t) => actions.addMemo({ body: t }) },
    mail:  { ph: "받은 메일 붙여넣고 Enter…  (Shift+Enter 줄바꿈)",     add: (t) => actions.addInquiry({ subject: t.split("\n")[0].slice(0, 60), body: t }) },
    cal:   { ph: "이 날짜에 메모 추가…  (Enter 저장)",                  add: (t) => actions.appendNote(state.selectedDate || diary.today(), t) },
  };
  const cfg = CFG[active] || CFG.todo;

  const submit = () => {
    const t = v.trim();
    if (!t) return;
    cfg.add(t);
    setV("");
  };
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
      <div className="kbd-cap" style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: 7, padding: "8px 12px" }}>
        <span style={{ fontSize: 15, color: "var(--ink-2)", flexShrink: 0, marginTop: 2 }}>⌨</span>
        <textarea
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={onKey}
          placeholder={cfg.ph}
          rows={3}
          style={{
            flex: 1, border: 0, outline: "none", background: "transparent", resize: "none",
            fontFamily: "var(--hand)", fontSize: 15, color: "var(--ink)", lineHeight: 1.35,
          }}
        />
      </div>
      <button onClick={submit} className="kbd-cap kbd-enter" title="추가 (Enter)" style={{
        width: 58, display: "grid", placeItems: "center",
        fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: "var(--ink)",
        cursor: "pointer",
      }}>⏎</button>
    </div>
  );
}

// 모니터/키보드 전용 CSS (한 번만 주입)
if (!document.getElementById("monitor-kbd-css")) {
  const s = document.createElement("style");
  s.id = "monitor-kbd-css";
  s.textContent = `
    .kbd-cap {
      background: linear-gradient(180deg, #ffffff 0%, #e7edf4 100%);
      border: 1.1px solid var(--ink);
      border-radius: 9px;
      box-shadow: 0 2px 0 #97a6b8, inset 0 1px 0 rgba(255,255,255,0.9);
      min-height: 34px;
      transition: transform .04s, box-shadow .04s;
    }
    .kbd-cap:active {
      transform: translateY(2px);
      box-shadow: 0 0 0 #97a6b8, inset 0 1px 0 rgba(255,255,255,0.9);
    }
    .kbd-enter {
      background: linear-gradient(180deg, var(--point-soft) 0%, var(--point) 100%);
    }
    .kbd-cap-mini {
      display: inline-grid; place-items: center;
      min-width: 26px; height: 17px; padding: 0 5px;
      background: linear-gradient(180deg, #eef2f7, #d4dce6);
      border: 1px solid #6c7a8c; border-radius: 5px;
      box-shadow: 0 1.5px 0 #97a6b8;
      font-family: var(--mono); font-size: 9px; color: #46566b;
    }
  `;
  document.head.appendChild(s);
}

window.HeaderDesktop = HeaderDesktop;
window.SettingsView = SettingsView;
window.DecorateView = DecorateView;
window.KeyboardInput = KeyboardInput;
window.SideDockV2 = SideDockV2;

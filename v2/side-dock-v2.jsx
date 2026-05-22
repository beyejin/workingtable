/* global React, TodayView, TodoView, MailView, PromptView, AIView, RetroView */
// ===========================================================
// 사이드 도크 v2 — 다이어리 인덱스 탭 + 뷰 전환
// 도크 본체 + 옆에 삐죽 나오는 종이 탭들.
// 탭 클릭 → 본문 영역 swap.
// 상단 현재 프로젝트 + 하단 타이머는 sticky (모든 탭 공통).
// ===========================================================

const { useState } = React;

const TABS = [
  { id: "today",   label: "오늘",      glyph: "♡", color: "#ffd6e0", view: () => <TodayView /> },
  { id: "todo",    label: "할 일",     glyph: "✓", color: "#d4ecdb", view: () => <TodoView /> },
  { id: "cheat",   label: "치트",      glyph: "❯", color: "#ffe8c8", view: () => <CheatView /> },
  { id: "prompt",  label: "프롬프트",  glyph: "★", color: "#e0d6f5", view: () => <PromptView /> },
  { id: "mail",    label: "메일",      glyph: "✉", color: "#ffe0d2", view: () => <MailView /> },
  { id: "ai",      label: "AI",        glyph: "◈", color: "#fff0c0", view: () => <AIView /> },
  { id: "retro",   label: "회고",      glyph: "✎", color: "#d4e6fa", view: () => <RetroView /> },
];

function SideDockV2({ tweaks }) {
  const [active, setActive] = useState("today");
  const current = TABS.find(t => t.id === active);
  const tabSide  = tweaks?.tabSide  ?? "right";
  const dockSide = tweaks?.dockSide ?? "left";
  const tabStyle = tweaks?.tabStyle ?? "paper";
  const desktopMode = tweaks?.desktopMode ?? false;

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
        background: "var(--paper)",
        borderRight:  dockSide === "left"  ? "1.1px solid var(--ink)" : "none",
        borderLeft:   dockSide === "right" ? "1.1px solid var(--ink)" : "none",
        boxShadow: dockSide === "left"
          ? "2px 0 0 var(--paper-3)"
          : "-2px 0 0 var(--paper-3)",
        display: "flex", flexDirection: "column",
        zIndex: 2,
      }}>
        {/* 파스텔 핑크 헤더 (XP 블루 대체) — 드래그 영역 */}
        <div data-tauri-drag-region style={{
          height: 28,
          background: "var(--pink-soft)",
          color: "var(--ink)",
          fontFamily: "var(--hand)", fontSize: 13,
          padding: "5px 10px",
          display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          borderBottom: "1.1px solid var(--ink)",
          userSelect: "none",
        }}>
          <span style={{ fontSize: 9, color: "var(--pink)", letterSpacing: 1 }}>♡  ♡  ♡</span>
          <span style={{ fontFamily: "var(--hand)", fontSize: 13 }}>vibe diary</span>
          <span className="sk-cap" style={{ marginLeft: "auto", color: "var(--ink-3)", fontSize: 13 }}>v0.2</span>
          <span className="xp-btn">_</span>
          <span className="xp-btn close">×</span>
        </div>

        {/* sticky 상단 — 현재 프로젝트 (스위쳐 포함) */}
        <div style={{
          padding: "10px 16px 10px",
          background: "var(--hi-soft)",
          borderBottom: "1.1px solid var(--ink)",
          flexShrink: 0,
        }}>
          <ProjectSwitcher />
        </div>

        {/* 본문 — 탭에 따라 swap */}
        <div style={{
          flex: 1, overflow: "auto",
          padding: "16px 16px 12px",
        }}>
          {current.view()}
        </div>

        {/* sticky 하단 — 타이머 */}
        <div style={{
          borderTop: "1.1px solid var(--ink)",
          background: "var(--paper-2)",
          padding: 10,
          flexShrink: 0,
        }}>
          <Timer />
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
      />

      {/* 우상단 안내 라벨 */}
      <div className="sk-callout" style={{
        top: 14, right: dockSide === "right" ? "auto" : 16,
        left:  dockSide === "right" ? 16 : "auto",
        color: "var(--ink-2)", textAlign: dockSide === "right" ? "left" : "right",
      }}>
        ← 인덱스 탭으로 전환<br/>
        <span className="sk-mono" style={{ color: "#7a7568" }}>탭 위치/스타일은 Tweaks에서</span>
      </div>
    </div>
  );
}

// ---- 다이어리 인덱스 탭 ----
function DiaryTabs({ tabs, active, onSelect, dockSide, tabSide, dockWidth, tabStyle }) {
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
  const TAB_H = 70;     // 탭 높이
  const TAB_GAP = 4;

  return (
    <div style={{
      position: "absolute",
      top: 70,
      ...containerPos,
      display: "flex", flexDirection: "column", gap: TAB_GAP,
      zIndex: 1, // 도크 본체보다 아래 (안 보이게 살짝 가려짐)
    }}>
      {tabs.map((t) => {
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
              background: t.color,
              border: "1.1px solid var(--ink)",
              borderLeft:  stickRight ? "none" : `1.1px solid var(--ink)`,
              borderRight: stickRight ? `1.1px solid var(--ink)` : "none",
              borderRadius: stickRight
                ? "0 12px 12px 0"
                : "12px 0 0 12px",
              boxShadow: stickRight
                ? "1.5px 1.5px 0 var(--paper-3)"
                : "-1.5px 1.5px 0 var(--paper-3)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 4,
              fontFamily: "var(--hand)",
              transition: "width 0.18s, margin 0.18s, background 0.15s",
              transform: tabStyle === "minimal" ? "none" : "rotate(0deg)",
              filter: isActive ? "none" : "saturate(0.85)",
            }}
            title={t.label}
          >
            <span style={{ fontSize: 16, color: "var(--ink)" }}>{t.glyph}</span>
            <span style={{
              writingMode: "vertical-rl",
              transform: stickRight ? "rotate(180deg)" : "none",
              fontSize: 12,
              letterSpacing: "0.04em",
              color: "var(--ink)",
              fontWeight: isActive ? 700 : 400,
            }}>{t.label}</span>
          </button>
        );
      })}
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

window.SideDockV2 = SideDockV2;

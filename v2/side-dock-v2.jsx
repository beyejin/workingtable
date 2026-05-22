/* global React, TodayView, TodoView, MailView, PromptView, AIView, RetroView */
// ===========================================================
// 사이드 도크 v2 — 다이어리 인덱스 탭 + 뷰 전환
// 도크 본체 + 옆에 삐죽 나오는 종이 탭들.
// 탭 클릭 → 본문 영역 swap.
// 상단 현재 프로젝트 + 하단 타이머는 sticky (모든 탭 공통).
// ===========================================================

const { useState } = React;

const TABS = [
  { id: "todo",  label: "할 일",   glyph: "✓", color: "#d4ecdb", view: () => <TodoView /> },
  { id: "cheat", label: "명령어",  glyph: "❯", color: "#ffe8c8", view: () => <CheatView /> },
  { id: "mail",  label: "문의",    glyph: "✉", color: "#ffe0d2", view: () => <MailView /> },
  { id: "cal",   label: "달력",    glyph: "📅", color: "#d4e6fa", view: () => <CalendarView /> },
];

function SideDockV2({ tweaks }) {
  const [active, setActive] = useState("todo");
  const current = TABS.find(t => t.id === active);
  const isPhoto = active === "photo";

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
        background: (isPhoto && desktopMode)
          ? "transparent"
          : "linear-gradient(180deg, #a9cdf5 0%, #cfe2fa 35%, #eaf3fe 70%, #ffffff 100%)",
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
          background: "linear-gradient(180deg, #cfe2fa 0%, #a9cdf5 100%)",
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
          background: (isPhoto && desktopMode) ? "transparent" : "linear-gradient(180deg, #e3eefc 0%, #f4f9ff 100%)",
          borderBottom: "1.1px solid var(--ink)",
          flexShrink: 0,
        }}>
          <HeaderDesktop />
        </div>

        {/* 본문 — 가운데 분할선 레이아웃 (각 뷰가 SplitPane로 위/아래 채움) */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          {current.view()}
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
    </div>
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
    case "cheat": {
      const cnt = sel.commandsForCurrent(state).length;
      return { ttl: "치트", sub: `${project?.name ?? "프로젝트"} · ${cnt}개 · 클릭 → 복사` };
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
              background: isActive ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.5)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
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

// ===========================================================
// 헤더 — 제목/음악/타이머/디데이 각 한 줄 (별도 창 크롬 없음)
// ===========================================================
function HeaderDesktop() {
  return <Timer />;
}

// ===========================================================
// 키보드형 입력창 — 탭 맥락에 맞춰 빠르게 추가
// ===========================================================
function KeyboardInput({ active }) {
  const { state, actions } = diary.useDiary();
  const [v, setV] = useState("");

  const CFG = {
    todo:  { ph: "할 일 추가…  (Enter 저장 · Shift+Enter 줄바꿈)",      add: (t) => actions.addTodo(t) },
    cheat: { ph: "명령어 저장…  (Enter 저장 · Shift+Enter 줄바꿈)",    add: (t) => actions.addCommand({ code: t }) },
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
window.KeyboardInput = KeyboardInput;
window.SideDockV2 = SideDockV2;

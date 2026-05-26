/* global React, diary */
// ===========================================================
// 작업 시간 자동 트래커 + 회고 자동 모달
//
// ActivityTracker  — 보이지 않는 컴포넌트. 한 번만 마운트.
//   페이지 활성 상태(보임+포커스+비-유휴) 시간을 매 10초 체크해서
//   1분 단위로 store.workSessions에 누적.
//
// RetroModal       — "오늘 작업 마치기" 흐름. 모달로 회고 받고
//   타이머 정지. 어디서든 window.openRetroModal()으로 열기.
//
// openRetroModal() — 전역 헬퍼. 버튼들이 이걸 호출.
// ===========================================================

const { useState, useEffect, useRef } = React;

const IDLE_MS = 5 * 60 * 1000;   // 5분 무입력 = 유휴
const TICK_MS = 10 * 1000;       // 체크 간격
const TICK_SEC = TICK_MS / 1000;

// ---- 외부 작업 모드 (module-level) ----
// 사용자가 클튜/포토샵 등 다른 앱에서 일할 때 켜는 모드.
// 켜져있으면 ActivityTracker가 visible/focused/idle 체크를 무시하고 무조건 카운트.
// 안전상 새 세션마다 OFF로 시작 (영구 저장 안 함).
(function () {
  let externalMode = false;
  let startedAt = null;
  const subs = new Set();
  window.workTracker = {
    isExternal() { return externalMode; },
    startedAt() { return startedAt; },
    setExternal(on) {
      const next = !!on;
      if (next === externalMode) return;
      externalMode = next;
      startedAt = next ? Date.now() : null;
      for (const fn of subs) fn(externalMode);
    },
    toggle() { this.setExternal(!externalMode); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();

// ---- 트래커 ----
function ActivityTracker() {
  const { actions } = diary.useDiary();
  const lastActivityRef = useRef(Date.now());
  const pendingSecRef = useRef(0);

  useEffect(() => {
    const bump = () => { lastActivityRef.current = Date.now(); };
    const onReset = () => { pendingSecRef.current = 0; };
    window.addEventListener("mousemove", bump);
    window.addEventListener("keydown", bump);
    window.addEventListener("mousedown", bump);
    window.addEventListener("focus", bump);
    window.addEventListener("work-minutes-reset", onReset);
    return () => {
      window.removeEventListener("mousemove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("mousedown", bump);
      window.removeEventListener("focus", bump);
      window.removeEventListener("work-minutes-reset", onReset);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const external = window.workTracker && window.workTracker.isExternal();
      let active;
      if (external) {
        active = true; // 외부 작업 모드 — 무조건 카운트
      } else {
        const now = Date.now();
        const idle = now - lastActivityRef.current > IDLE_MS;
        const visible = document.visibilityState === "visible";
        const focused = document.hasFocus();
        active = visible && focused && !idle;
      }
      if (!active) return;

      pendingSecRef.current += TICK_SEC;

      // 60초 누적되면 store에 commit
      if (pendingSecRef.current >= 60) {
        const m = Math.floor(pendingSecRef.current / 60);
        pendingSecRef.current = pendingSecRef.current % 60;
        actions.addWorkMinutes(m);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}

// ---- 회고 모달 (전역) ----
function RetroModal() {
  const [open, setOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const { state, actions } = diary.useDiary();
  const today = diary.today();
  const r = diary.select.retroForDate(state, today);
  const minutes = diary.select.workMinutesToday(state);
  const project = diary.select.currentProject(state);
  const doneToday = state.todos.filter(
    t => t.done && t.doneAt === today && t.projectId === state.currentProjectId
  );

  // 전역 핸들러 등록
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-retro-modal", handler);
    return () => window.removeEventListener("open-retro-modal", handler);
  }, []);

  if (!open) return null;

  const save = (patch) => {
    actions.saveRetro({
      date: today,
      text: r?.text ?? "",
      good: r?.good ?? "",
      bad: r?.bad ?? "",
      ...patch,
    });
  };

  const finish = () => {
    // 타이머 정지 (있으면)
    if (state.timer.cycleStartedAt && !state.timer.paused) {
      actions.pauseCycle();
    }
    setOpen(false);
  };

  const runAiDraft = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const bookmarks = state.aiBookmarks
        .filter(b => b.projectId === state.currentProjectId && b.date === today);
      const draft = await window.diaryAI.generateRetroDraft({
        project, minutes, doneTodos: doneToday,
        stuck: diary.select.stuckForCurrent(state),
        bookmarks,
        existingText: r?.text ?? "",
      });
      // 비어있는 칸만 채움 (기존 사용자 입력 보존)
      save({
        text: r?.text?.trim() ? r.text : draft.text,
        good: r?.good?.trim() ? r.good : draft.good,
        bad:  r?.bad?.trim()  ? r.bad  : draft.bad,
      });
    } catch (e) {
      setAiError(e.message || "실패");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div onClick={() => setOpen(false)} style={{
      position: "fixed", inset: 0,
      background: "rgba(138, 106, 94, 0.35)",
      backdropFilter: "blur(2px)",
      display: "grid", placeItems: "center",
      zIndex: 1000,
      padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} className="sk-box" style={{
        background: "var(--paper)",
        padding: 0,
        width: "min(440px, 92vw)",
        maxHeight: "90vh",
        overflow: "auto",
        boxShadow: "0 8px 0 var(--paper-3), 0 12px 30px rgba(138,106,94,0.3)",
      }}>
        {/* 헤더 */}
        <div style={{
          background: "var(--pink-soft)",
          padding: "10px 14px",
          borderBottom: "1.1px solid var(--ink)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 9, color: "var(--pink)", letterSpacing: 1 }}>♡ ♡ ♡</span>
          <span style={{ fontFamily: "var(--hand)", fontSize: 15, fontWeight: 700, flex: 1 }}>
            오늘 작업 마치기
          </span>
          <button onClick={() => setOpen(false)} className="xp-btn close">×</button>
        </div>

        {/* 본문 */}
        <div style={{ padding: 16 }}>
          <div className="sk-cap">{diary.fmtKDate(today)} · {project?.name ?? "프로젝트"}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 8, marginBottom: 14, fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink-2)" }}>
            <span>⏱ <strong style={{ color: "var(--ink)", fontSize: 16 }}>{minutes}m</strong> 작업</span>
            <span>✓ <strong style={{ color: "var(--ink)", fontSize: 16 }}>{doneToday.length}</strong>개 완료</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div className="sk-label" style={{ flex: 1 }}>오늘 한 줄</div>
            <button onClick={runAiDraft} disabled={aiLoading} style={{
              all: "unset", cursor: aiLoading ? "wait" : "pointer",
              padding: "2px 10px", borderRadius: 99,
              border: "1.1px solid var(--ink)",
              background: aiLoading ? "var(--paper-2)" : "var(--lavender-soft)",
              fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
            }}>
              {aiLoading ? "생각 중…" : "✨ AI 초안"}
            </button>
          </div>
          {aiError && (
            <div className="sk-cap" style={{ color: "var(--bad)", marginBottom: 4 }}>{aiError}</div>
          )}
          <textarea
            value={r?.text ?? ""}
            onChange={(e) => save({ text: e.target.value })}
            placeholder="오늘 어땠나요? 한 줄도 충분해요."
            rows={2}
            autoFocus
            style={modalInput}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
            <div>
              <div className="sk-label" style={{ marginBottom: 6 }}>👍 잘된 것</div>
              <textarea
                value={r?.good ?? ""}
                onChange={(e) => save({ good: e.target.value })}
                placeholder="(선택)"
                rows={2}
                style={modalInput}
              />
            </div>
            <div>
              <div className="sk-label" style={{ marginBottom: 6 }}>👎 막힌 것</div>
              <textarea
                value={r?.bad ?? ""}
                onChange={(e) => save({ bad: e.target.value })}
                placeholder="(선택)"
                rows={2}
                style={modalInput}
              />
            </div>
          </div>

          {/* 오늘 완료한 일 미리보기 */}
          {doneToday.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="sk-label" style={{ marginBottom: 6 }}>오늘 끝낸 일</div>
              <div className="sk-box" style={{
                padding: 8, background: "var(--paper-2)",
                fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink-2)",
                maxHeight: 100, overflow: "auto",
              }}>
                {doneToday.map(t => (
                  <div key={t.id} style={{ marginBottom: 2 }}>✓ {t.text}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={() => setOpen(false)} style={btn}>닫기 (계속 작업)</button>
            <button onClick={finish} style={{ ...btn, background: "var(--mint)" }}>
              ✓ 오늘 마치기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- 전역 헬퍼 ----
function openRetroModal() {
  window.dispatchEvent(new CustomEvent("open-retro-modal"));
}

// ---- 스타일 ----
const modalInput = {
  width: "100%", border: "1.1px solid var(--ink-soft)", outline: "none",
  background: "var(--paper)", borderRadius: 8,
  fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink)",
  padding: "6px 8px", resize: "vertical", minHeight: 36,
};
const btn = {
  all: "unset", cursor: "pointer",
  background: "var(--paper)", border: "1.1px solid var(--ink)",
  padding: "5px 14px", borderRadius: 99,
  fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink)",
};

window.ActivityTracker = ActivityTracker;
window.RetroModal = RetroModal;
window.openRetroModal = openRetroModal;

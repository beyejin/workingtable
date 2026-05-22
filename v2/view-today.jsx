/* global React, diary, ViewHeader, Divider, InlineAdd, Editable, DelBtn */
// ===========================================================
// 오늘 (Today / Dashboard) — 모든 데이터에서 파생
// ===========================================================

function TodayView() {
  const { state, actions } = diary.useDiary();
  const project = diary.select.currentProject(state);
  const todos = diary.select.todosForCurrent(state).filter(t => !t.done);
  const doneToday = state.todos.filter(t => t.done && t.doneAt === diary.today() && t.projectId === state.currentProjectId);
  const stuck = diary.select.stuckForCurrent(state);
  const minutes = diary.select.workMinutesToday(state);
  const today = diary.today();
  const todayRetro = diary.select.retroForDate(state, today);
  const hotCount = todos.filter(t => t.hot).length;
  const unreplied = state.emails.filter(e => !e.replied).length;

  // AI 쓴이기 상태
  const [breakdown, setBreakdown] = React.useState(null);
  const runBreakdown = async () => {
    if (!stuck?.trim()) {
      alert("막힌 것을 먼저 적어주세요");
      return;
    }
    setBreakdown({ loading: true });
    try {
      const items = await window.diaryAI.breakdownStuck({ stuck, project });
      setBreakdown({
        loading: false,
        items,
        selected: items.reduce((acc, _, i) => (acc[i] = true, acc), {}),
      });
    } catch (e) {
      setBreakdown({ loading: false, error: e.message || "실패" });
    }
  };
  const addSelected = () => {
    breakdown.items.forEach((item, i) => {
      if (breakdown.selected[i]) actions.addTodo(item);
    });
    setBreakdown(null);
  };

  return (
    <div>
      <ViewHeader
        ttl={`오늘 — ${diary.fmtKDate(today)}`}
        sub={`작업 ${minutes}m · ${todos.length}개 할 일 · ${unreplied}개 미답 메일`}
      />

      {/* 오늘의 한 줄 — 회고 텍스트로 연결 */}
      <div className="sk-box" style={{ padding: 12, background: "var(--hi-soft)", marginBottom: 14 }}>
        <div className="sk-label">오늘의 한 줄</div>
        <div style={{ marginTop: 4 }}>
          <Editable
            value={todayRetro?.text ?? ""}
            onChange={(v) => actions.saveRetro({
              date: today,
              text: v,
              good: todayRetro?.good ?? "",
              bad: todayRetro?.bad ?? "",
            })}
            placeholder="오늘 어떤가요? (회고 탭에서도 편집됨)"
            multiline
            style={{
              fontFamily: "var(--hand-2)", fontSize: 17,
              color: "var(--ink)", lineHeight: 1.3,
              minHeight: 24,
            }}
          />
        </div>
      </div>

      {/* 급한 할 일 (있을 때만) */}
      {hotCount > 0 && (
        <>
          <div className="sk-label" style={{ marginBottom: 6 }}>지금 급한 것 · {hotCount}</div>
          <div style={{ marginBottom: 14 }}>
            {todos.filter(t => t.hot).slice(0, 3).map(t => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "5px 8px", marginBottom: 4,
                background: "#fff4b0", borderRadius: 6,
              }}>
                <button onClick={() => actions.toggleTodo(t.id)}
                  className="sk-check" style={{ cursor: "pointer" }} />
                <span style={{ fontFamily: "var(--hand)", fontSize: 15, flex: 1 }}>{t.text}</span>
                <span className="sk-badge hi">!</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 빠른 기록 */}
      <div className="sk-label" style={{ marginBottom: 6 }}>빠른 기록</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <QuickBtn icon="+" label="할 일" onClick={() => {
          const v = prompt("할 일 한 줄");
          if (v?.trim()) actions.addTodo(v.trim());
        }} />
        <QuickBtn icon="💬" label="프롬프트" onClick={() => {
          const v = prompt("프롬프트 본문");
          if (v?.trim()) actions.addPrompt(v.trim());
        }} />
        <QuickBtn icon="🔖" label="AI 북마크" onClick={() => {
          const v = prompt("AI 세션 제목");
          if (v?.trim()) actions.addBookmark({ title: v.trim(), ok: true });
        }} />
        <QuickBtn icon="✎" label="회고 한 줄" onClick={() => {
          const v = prompt("오늘 한 줄", todayRetro?.text ?? "");
          if (v != null) actions.saveRetro({
            date: today, text: v,
            good: todayRetro?.good ?? "", bad: todayRetro?.bad ?? "",
          });
        }} />
      </div>

      <Divider />

      {/* 오늘 한 일 */}
      <div className="sec-head"><span className="num">·</span><span className="ttl">오늘 한 일 · {doneToday.length}</span></div>
      {doneToday.length === 0 && <div className="sk-cap">아직 끝낸 게 없어요 — 곧 첫 ✓!</div>}
      {doneToday.map(t => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0" }}>
          <span className="sk-check done" />
          <span style={{ fontFamily: "var(--hand)", fontSize: 15, color: "var(--ink-2)", textDecoration: "line-through" }}>{t.text}</span>
        </div>
      ))}

      <Divider />

      {/* 막힌 것 */}
      <div className="sec-head"><span className="num">·</span><span className="ttl">막혀있는 것</span></div>
      <div className="sk-box sk-dashed" style={{ padding: 10, background: "var(--paper-2)" }}>
        <Editable
          value={stuck}
          onChange={(v) => actions.setStuck(v)}
          placeholder="지금 어디서 멈춰있나요? (한 줄 메모)"
          multiline
          style={{ fontFamily: "var(--hand-2)", fontSize: 16, color: "var(--ink-2)", lineHeight: 1.3, minHeight: 24 }}
        />
      </div>

      {/* AI 쪼개기 */}
      {!breakdown && stuck?.trim() && (
        <button onClick={runBreakdown} style={{
          all: "unset", cursor: "pointer", display: "inline-block",
          marginTop: 8,
          padding: "4px 12px", borderRadius: 99,
          border: "1.1px solid var(--ink)",
          background: "var(--lavender-soft)",
          fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
        }}>✨ AI에게 할 일로 쪼개달라고 하기</button>
      )}
      {breakdown?.loading && (
        <div className="sk-cap" style={{ marginTop: 8 }}>✨ 생각 중…</div>
      )}
      {breakdown?.error && (
        <div className="sk-box" style={{ marginTop: 8, padding: 8, background: "#ffe0e0" }}>
          <div className="sk-cap" style={{ color: "var(--bad)" }}>{breakdown.error}</div>
          <button onClick={() => setBreakdown(null)} style={miniBtn}>닫기</button>
        </div>
      )}
      {breakdown?.items && (
        <div className="sk-box" style={{ marginTop: 8, padding: 10, background: "var(--lavender-soft)" }}>
          <div className="sk-label" style={{ marginBottom: 6 }}>✨ AI 제안 · 추가할 것만 체크</div>
          {breakdown.items.map((it, i) => (
            <label key={i} style={{
              display: "flex", alignItems: "center", gap: 7, padding: "3px 0",
              cursor: "pointer",
            }}>
              <input type="checkbox" checked={!!breakdown.selected[i]}
                onChange={(e) => setBreakdown(b => ({
                  ...b, selected: { ...b.selected, [i]: e.target.checked },
                }))}
                style={{ accentColor: "var(--ink)" }} />
              <span style={{ fontFamily: "var(--hand)", fontSize: 14, flex: 1 }}>{it}</span>
            </label>
          ))}
          <div style={{ display: "flex", gap: 6, marginTop: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setBreakdown(null)} style={miniBtn}>취소</button>
            <button onClick={runBreakdown} style={miniBtn}>↻ 다시</button>
            <button onClick={addSelected} style={{...miniBtn, background: "var(--mint)"}}>
              선택한 {Object.values(breakdown.selected).filter(Boolean).length}개 할 일로 추가
            </button>
          </div>
        </div>
      )}

      <Divider />

      {/* 오늘 마치기 */}
      <button onClick={() => window.openRetroModal()} className="sk-box" style={{
        all: "unset", cursor: "pointer", display: "block", width: "100%",
        padding: "12px 14px", textAlign: "center",
        background: "var(--mint-soft)", border: "1.1px solid var(--ink)", borderRadius: 12,
        fontFamily: "var(--hand)", fontSize: 16, fontWeight: 700, color: "var(--ink)",
      }}>
        ✎ 오늘 작업 마치기 (회고 쓰고 타이머 정지)
      </button>
    </div>
  );
}

function QuickBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="sk-box" style={{
      all: "unset", cursor: "pointer",
      padding: "8px 10px", display: "flex", alignItems: "center", gap: 6,
      background: "white", border: "1.1px solid var(--ink)", borderRadius: 10,
    }}>
      <span className="sk-cap" style={{ fontSize: 17, color: "var(--ink)" }}>{icon}</span>
      <span style={{ fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink)" }}>{label}</span>
    </button>
  );
}

window.TodayView = TodayView;

const miniBtn = {
  all: "unset", cursor: "pointer",
  background: "var(--paper)", border: "1.1px solid var(--ink)",
  padding: "2px 10px", borderRadius: 99,
  fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
};

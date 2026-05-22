/* global React, diary, SplitPane */
// ===========================================================
// 달력 — 위: 선택한 날의 자동 기록 + 일기 메모 / 아래: 월간 달력(전체)
// 마친 일/작업시간/받은 메일이 날짜별로 자동 기록됨. 다른 날짜도 편집 가능.
// ===========================================================

function pad2(n) { return String(n).padStart(2, "0"); }
function ymLabel(year, month) {
  const lng = window.i18n.get();
  if (lng === "en") return `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month]} ${year}`;
  if (lng === "ko") return `${year}년 ${month + 1}월`;
  return `${year}年 ${month + 1}月`; // zh / ja
}
function dateStr(y, m, d) { return `${y}-${pad2(m + 1)}-${pad2(d)}`; }
function tsTime(ts) { return ts ? new Date(ts).toTimeString().slice(0, 5) : ""; }

function CalendarView() {
  const { state, actions } = diary.useDiary();
  const sel = state.selectedDate || diary.today();

  // 선택한 날의 자동 기록
  const mins = (state.workSessions ?? []).find(w => w.date === sel)?.minutes ?? 0;
  const doneTodos = (state.todos ?? [])
    .filter(t => t.done && t.doneAt === sel)
    .sort((a, b) => (a.doneTs ?? 0) - (b.doneTs ?? 0));
  const mails = (state.emails ?? [])
    .filter(e => e.createdAt === sel)
    .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  const note = state.notes?.[sel] ?? "";

  const h = Math.floor(mins / 60), m = mins % 60;

  return (
    <SplitPane
      topLabel={`📖 ${window.i18n.fmtDate(sel)}`}
      topRight={
        sel !== diary.today() && (
          <button onClick={() => actions.setSelectedDate(diary.today())} style={miniBtn}>{L("cal.todayBtn")}</button>
        )
      }
      top={
        <div>
          {/* 자동 기록 */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            <LogChip icon="🕒">{pad2(h)} H {pad2(m)} M</LogChip>
            <LogChip icon="✓">{L("cal.done", { n: doneTodos.length })}</LogChip>
            <LogChip icon="✉️">{L("cal.mails", { n: mails.length })}</LogChip>
          </div>

          {(doneTodos.length > 0 || mails.length > 0) && (
            <div style={{
              background: "var(--paper-2)", border: "1px dashed var(--ink-soft)", borderRadius: 8,
              padding: "6px 9px", marginBottom: 8,
            }}>
              {doneTodos.map(t => (
                <div key={t.id} style={logLine}>
                  <span style={{ color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: 11, width: 38, flexShrink: 0 }}>{tsTime(t.doneTs) || "—"}</span>
                  <span>✓ {t.text}</span>
                </div>
              ))}
              {mails.map(e => (
                <div key={e.id} style={logLine}>
                  <span style={{ color: "var(--ink-3)", fontFamily: "var(--mono)", fontSize: 11, width: 38, flexShrink: 0 }}>{tsTime(e.ts) || "—"}</span>
                  <span>✉️ {e.subject || e.body?.slice(0, 24) || "문의"}</span>
                </div>
              ))}
            </div>
          )}

          {/* 일기 메모 */}
          <textarea
            value={note}
            onChange={e => actions.setNote(sel, e.target.value)}
            placeholder={L("cal.note")}
            rows={4}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 70,
              border: "1.1px solid var(--ink-soft)", borderRadius: 8, outline: "none",
              background: "var(--paper)", padding: "8px 10px",
              fontFamily: "var(--hand)", fontSize: 15, color: "var(--ink)", lineHeight: 1.5,
            }}
          />
        </div>
      }
      bottomScroll={false}
      bottom={<MonthCalendar state={state} selected={sel} onPick={d => actions.setSelectedDate(d)} />}
    />
  );
}

function LogChip({ icon, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 9px", borderRadius: 99, border: "1.1px solid var(--ink)",
      background: "white", fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: "var(--ink)",
    }}>{icon} {children}</span>
  );
}

const logLine = {
  display: "flex", gap: 6, alignItems: "baseline",
  fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5,
};
const miniBtn = {
  all: "unset", cursor: "pointer", padding: "1px 9px", borderRadius: 99,
  border: "1.1px solid var(--ink)", background: "var(--paper)",
  fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
};

// ---- 월간 달력 (아래칸 전체 사용) ----
function MonthCalendar({ state, selected, onPick }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const todayStr = diary.today();

  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dday = state.dday ?? { date: "" };
  const ddayStr = dday.date;

  // 활동 있는 날 집합
  const activity = new Set();
  (state.workSessions ?? []).forEach(w => { if (w.minutes > 0) activity.add(w.date); });
  (state.todos ?? []).forEach(t => { if (t.done && t.doneAt) activity.add(t.doneAt); });
  (state.emails ?? []).forEach(e => { if (e.createdAt) activity.add(e.createdAt); });
  Object.keys(state.notes ?? {}).forEach(d => { if ((state.notes[d] ?? "").trim()) activity.add(d); });

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = cells.length / 7;
  const dows = window.i18n.weekdays();

  return (
    <div style={{
      height: "100%", minHeight: 0, display: "flex", flexDirection: "column",
      border: "1.1px solid var(--ink)", borderRadius: 10, overflow: "hidden", background: "white",
    }}>
      <div style={{
        padding: "5px 10px",
        background: "linear-gradient(180deg, color-mix(in srgb, var(--chrome) 45%, white), var(--chrome))",
        borderBottom: "1.1px solid var(--ink)", textAlign: "center",
        fontFamily: "var(--hand)", fontSize: 14, fontWeight: 700, color: "var(--ink)", flexShrink: 0,
      }}>{ymLabel(year, month)}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", flexShrink: 0 }}>
        {dows.map((w, i) => (
          <div key={w} style={{
            textAlign: "center", padding: "3px 0", fontFamily: "var(--mono)", fontSize: 10,
            color: i === 0 ? "#e06a7a" : (i === 6 ? "#5b8fd6" : "var(--ink-3)"),
          }}>{w}</div>
        ))}
      </div>

      <div style={{
        flex: 1, minHeight: 0, display: "grid",
        gridTemplateColumns: "repeat(7,1fr)", gridTemplateRows: `repeat(${rows},1fr)`,
      }}>
        {cells.map((d, i) => {
          if (d == null) return <div key={i} style={{ borderTop: "1px solid var(--paper-3)", borderLeft: i % 7 === 0 ? "none" : "1px solid var(--paper-3)" }} />;
          const ds = dateStr(year, month, d);
          const isToday = ds === todayStr;
          const isSel = ds === selected;
          const isDday = ds === ddayStr;
          const hasAct = activity.has(ds);
          return (
            <button key={i} onClick={() => onPick(ds)} style={{
              all: "unset", cursor: "pointer", position: "relative",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              borderTop: "1px solid var(--paper-3)",
              borderLeft: i % 7 === 0 ? "none" : "1px solid var(--paper-3)",
              background: isSel ? "var(--hi-soft)" : "transparent",
              boxShadow: isSel ? "inset 0 0 0 1.6px var(--ink)" : "none",
            }}>
              <span style={{
                width: 22, height: 22, display: "grid", placeItems: "center", borderRadius: "50%",
                fontFamily: "var(--mono)", fontSize: 11, fontWeight: isToday || isDday ? 700 : 400,
                background: isToday ? "var(--point)" : "transparent",
                border: isDday ? "1.6px solid #ff8da1" : "none", color: "var(--ink)",
              }}>{d}</span>
              {hasAct && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#5b8fd6" }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.CalendarView = CalendarView;

/* global React, diary */
// ===========================================================
// 주간 — Weekly Planner (자동 기록)
//   2열 4행: 월/화, 수/목, 금/토, 일/Notes
//   할 일 탭에서 등록한 마감일 · 완료한 일 · 작업 시간이 자동으로 모임.
//   디데이는 헤더와 해당 날짜 셀에 표시. 직접 일정 추가는 없음.
// ===========================================================
const { useState, useEffect, useRef } = React;

function pad2(n) { return String(n).padStart(2, "0"); }
function dateOnly(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function startOfWeekMonday(date) {
  const d = new Date(date);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function fmtMins(min) {
  if (!min || min < 1) return null;
  const h = Math.floor(min / 60); const m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
function dDayLabel(target, base) {
  if (!target) return null;
  const a = new Date(target + "T00:00:00").getTime();
  const b = new Date(dateOnly(base) + "T00:00:00").getTime();
  const days = Math.round((a - b) / 86400000);
  if (days === 0) return "D-DAY";
  if (days > 0) return `D-${days}`;
  return `D+${-days}`;
}

function CalendarView() {
  const { state, actions } = diary.useDiary();
  const today = new Date();
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(today));

  const mondayStr = dateOnly(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayStrings = days.map(dateOnly);

  // 그 날 표시할 항목들 모으기
  const todos = (state.todos ?? []).filter(t => t.projectId === state.currentProjectId);
  const dueByDay = {};
  const doneByDay = {};
  dayStrings.forEach(d => { dueByDay[d] = []; doneByDay[d] = []; });
  todos.forEach(t => {
    if (t.dueDate && dueByDay[t.dueDate]) dueByDay[t.dueDate].push(t);
    if (!t.dueDate && t.done && t.completedAt) {
      const k = t.completedAt.slice(0, 10);
      if (doneByDay[k]) doneByDay[k].push(t);
    }
  });
  const workByDay = {};
  (state.workSessions ?? []).forEach(w => { if (dayStrings.includes(w.date)) workByDay[w.date] = w.minutes; });

  const weekNote = (state.weekNotes ?? {})[mondayStr] ?? "";
  const dday = state.dday || {};

  const goPrev = () => setWeekStart(s => addDays(s, -7));
  const goNext = () => setWeekStart(s => addDays(s, 7));
  const goThis = () => setWeekStart(startOfWeekMonday(new Date()));
  const isThisWeek = mondayStr === dateOnly(startOfWeekMonday(new Date()));

  // 이번 주 총 작업시간
  const weekTotalMin = dayStrings.reduce((sum, d) => sum + (workByDay[d] || 0), 0);

  return (
    <div style={{ height: "100%", padding: "8px 8px 8px", boxSizing: "border-box", background: "transparent" }}>
      {/* 별도 창 — 95% 알파, 그라데이션 타이틀바/푸터, 검은 보더 */}
      <div style={{
        height: "100%", display: "flex", flexDirection: "column", minHeight: 0,
        background: "rgba(255,255,255,0.95)",
        border: "1.1px solid var(--ink)", borderRadius: 10,
        boxShadow: "0 2px 0 var(--paper-3)",
        overflow: "hidden",
      }}>
        {/* 타이틀바 (그라데이션) */}
        <div style={{
          flexShrink: 0,
          padding: "6px 10px",
          display: "flex", alignItems: "center", gap: 6,
          background: "linear-gradient(180deg, color-mix(in srgb, var(--chrome,#a9cdf5) 42%, white) 0%, color-mix(in srgb, var(--chrome,#a9cdf5) 12%, white) 100%)",
          borderBottom: "1.1px solid var(--ink)",
        }}>
          <button onClick={goPrev} title={L("planner.prev")} style={gradNavBtn}>◀</button>
          <div style={{
            flex: 1, textAlign: "center",
            fontFamily: "var(--hand)", fontSize: 14, fontWeight: 700,
            color: "var(--ink)",
          }}>
            {rangeLabel(weekStart)}
          </div>
          <button onClick={goNext} title={L("planner.next")} style={gradNavBtn}>▶</button>
          {!isThisWeek && (
            <button onClick={goThis} title={L("planner.thisWeek")} style={pillBtn}>{L("planner.thisWeek")}</button>
          )}
        </div>

        {/* 2x4 그리드 */}
        <div style={{
          flex: 1, minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "repeat(4, 1fr)",
        }}>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <DayCell key={i}
              date={days[i]}
              dateStr={dayStrings[i]}
              labelKey={DAY_KEYS[i]}
              due={dueByDay[dayStrings[i]] || []}
              doneFloat={doneByDay[dayStrings[i]] || []}
              workMin={workByDay[dayStrings[i]] || 0}
              ddayLabel={dday.date === dayStrings[i] ? dDayLabel(dday.date, today) : null}
              ddayName={dday.date === dayStrings[i] ? (dday.label || L("dday.dday")) : null}
              isToday={dayStrings[i] === diary.today()}
              actions={actions}
              colIdx={i % 2}
              rowIdx={Math.floor(i / 2)}
            />
          ))}
          <NotesCell
            mondayStr={mondayStr}
            value={weekNote}
            onSave={(text) => actions.setWeekNote(mondayStr, text)}
          />
        </div>

        {/* 푸터 — 이번 주 총 작업시간 (그라데이션) */}
        <div style={{
          flexShrink: 0,
          padding: "6px 12px",
          display: "flex", alignItems: "center", gap: 6,
          background: "linear-gradient(180deg, color-mix(in srgb, var(--chrome,#a9cdf5) 40%, white) 0%, color-mix(in srgb, var(--chrome,#a9cdf5) 14%, white) 100%)",
          borderTop: "1.1px solid var(--ink)",
        }}>
          <span style={{ fontSize: 12 }}>🕒</span>
          <span style={{ fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink-2)", fontWeight: 700 }}>
            {L("planner.weekTotal")}
          </span>
          <span style={{ flex: 1 }} />
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
            {fmtMins(weekTotalMin) || "0m"}
          </span>
        </div>
      </div>
    </div>
  );
}

const DAY_KEYS = [
  "planner.mon", "planner.tue", "planner.wed", "planner.thu",
  "planner.fri", "planner.sat", "planner.sun",
];

function rangeLabel(weekStart) {
  const end = addDays(weekStart, 6);
  const lng = (window.i18n && window.i18n.get && window.i18n.get()) || "ko";
  const fmt = (d) => {
    if (lng === "en") return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getDate()}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  return `${fmt(weekStart)} – ${fmt(end)}`;
}

function DayCell({ date, dateStr, labelKey, due, doneFloat, workMin, ddayLabel, ddayName, isToday, actions, colIdx, rowIdx }) {
  const allItems = [...due, ...doneFloat];
  return (
    <div style={{
      borderRight: colIdx === 0 ? "1px solid var(--ink)" : "none",
      borderBottom: rowIdx < 3 ? "1px solid var(--ink)" : "none",
      padding: "6px 8px 5px",
      display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden",
      background: "transparent",
    }}>
      {/* 셀 헤더 */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{
          fontFamily: "var(--hand)",
          fontSize: 13, fontWeight: 700, color: "var(--ink)",
        }}>{L(labelKey)}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--ink-3)" }}>
          {date.getMonth() + 1}/{date.getDate()}
        </span>
        {isToday && <span style={{
          fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink)",
          background: "var(--point)", padding: "0 5px", borderRadius: 99,
          border: "1px solid var(--ink)",
        }}>{L("planner.today")}</span>}
        {ddayLabel && <span title={ddayName} style={{
          fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink)",
          background: "#ffd0d8", padding: "0 5px", borderRadius: 99,
          border: "1px solid var(--ink)",
        }}>★ {ddayLabel}</span>}
      </div>

      {/* 자동 기록된 항목들 */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: "auto",
        marginTop: 4,
      }}>
        {allItems.length === 0 && !workMin && (
          <div style={{ fontFamily: "var(--hand)", fontSize: 10.5, color: "var(--ink-3)", marginTop: 2 }}>
            ·
          </div>
        )}
        {allItems.map(t => (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: 5,
            padding: "1.5px 0",
            fontFamily: "var(--hand)", fontSize: 11.5,
            color: t.done ? "var(--ink-3)" : "var(--ink)",
            lineHeight: 1.35,
          }}>
            <button
              onClick={() => actions.toggleTodo(t.id)}
              title={t.done ? "되돌리기" : "끝냄으로 표시"}
              style={{
                all: "unset", cursor: "pointer", flexShrink: 0,
                width: 11, height: 11, marginTop: 2,
                border: "1px solid var(--ink)", borderRadius: 2,
                background: t.done ? "var(--ink)" : "transparent",
                display: "grid", placeItems: "center",
                fontSize: 8, color: "#fff",
              }}
            >{t.done ? "✓" : ""}</button>
            <span style={{
              flex: 1, minWidth: 0,
              textDecoration: t.done ? "line-through" : "none",
              wordBreak: "break-word",
            }}>{t.title}</span>
          </div>
        ))}
      </div>

      {/* 작업시간 푸터 */}
      {!!workMin && (
        <div style={{
          flexShrink: 0, marginTop: 4,
          display: "inline-flex", alignItems: "center", gap: 4,
          fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink-2)",
        }}>
          <span>🕒</span><span>{fmtMins(workMin)}</span>
        </div>
      )}
    </div>
  );
}

function NotesCell({ mondayStr, value, onSave }) {
  const [text, setText] = useState(value);
  const timerRef = useRef(null);
  const textRef = useRef(value);
  useEffect(() => {
    setText(value);
    textRef.current = value;
  }, [mondayStr, value]);

  const onChange = (v) => {
    setText(v);
    textRef.current = v;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSave(v), 500);
  };
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
      onSave(textRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mondayStr]);

  return (
    <div style={{
      padding: "6px 8px",
      display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden",
      background: "transparent",
    }}>
      <div style={{
        fontFamily: "var(--hand)",
        fontSize: 13, fontWeight: 700, color: "var(--ink)",
        flexShrink: 0, marginBottom: 3,
      }}>{L("planner.notes")}:</div>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          clearTimeout(timerRef.current);
          onSave(textRef.current);
        }}
        placeholder={L("planner.notesPh")}
        style={{
          flex: 1, minHeight: 0,
          width: "100%", boxSizing: "border-box",
          border: 0, outline: "none", resize: "none",
          background: "transparent",
          fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
          lineHeight: 1.55,
        }}
      />
    </div>
  );
}

const gradNavBtn = {
  all: "unset", cursor: "pointer",
  width: 26, height: 22, borderRadius: 5,
  display: "grid", placeItems: "center",
  fontSize: 10, color: "var(--ink)",
  background: "linear-gradient(180deg, color-mix(in srgb, var(--chrome,#a9cdf5) 42%, white) 0%, color-mix(in srgb, var(--chrome,#a9cdf5) 12%, white) 100%)",
  border: "1.1px solid var(--ink)",
  boxShadow: "0 1px 0 var(--paper-3)",
};
const pillBtn = {
  all: "unset", cursor: "pointer",
  padding: "2px 9px", borderRadius: 99,
  fontFamily: "var(--hand)", fontSize: 11, color: "var(--ink)",
  border: "1.1px solid var(--ink)", background: "var(--paper)",
};

window.CalendarView = CalendarView;

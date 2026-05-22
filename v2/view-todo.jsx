/* global React, diary, ViewHeader, Divider, InlineAdd, DelBtn, ToggleBadge */
// ===========================================================
// 할 일 — 추가 / 체크 / 급함 토글 / 삭제
// ===========================================================

function TodoView() {
  const { state, actions } = diary.useDiary();
  const items = diary.select.todosForCurrent(state);
  const hot   = items.filter(x => !x.done && x.hot);
  const rest  = items.filter(x => !x.done && !x.hot);
  const done  = items.filter(x => x.done);

  return (
    <div>
      <ViewHeader
        ttl="할 일"
        sub={`${items.filter(x => !x.done).length}개 남음 · ${hot.length}개 급함`}
      />

      <InlineAdd
        placeholder="새 할 일 한 줄로 적기…"
        onAdd={(v) => actions.addTodo(v)}
      />
      <div style={{ height: 12 }} />

      {hot.length > 0 && (
        <>
          <div className="sk-label" style={{ marginBottom: 6 }}>지금 · 급함</div>
          {hot.map(t => <TodoRow key={t.id} t={t} actions={actions} hot />)}
          <div style={{ height: 12 }} />
        </>
      )}

      <div className="sk-label" style={{ marginBottom: 6 }}>나머지 · {rest.length}</div>
      {rest.length === 0 && <div className="sk-cap" style={{ marginBottom: 8 }}>다 정리됐어요!</div>}
      {rest.map(t => <TodoRow key={t.id} t={t} actions={actions} />)}

      {done.length > 0 && (
        <>
          <Divider />
          <div className="sk-label" style={{ marginBottom: 6 }}>끝낸 것 · {done.length}</div>
          {done.map(t => <TodoRow key={t.id} t={t} actions={actions} />)}
        </>
      )}
    </div>
  );
}

function TodoRow({ t, actions, hot }) {
  return (
    <div className="todo-row" style={{
      display: "flex", alignItems: "center", gap: 8, padding: "5px 6px",
      background: hot ? "#fff4b0" : "transparent",
      borderRadius: 6, marginBottom: 2,
    }}>
      <button
        onClick={() => actions.toggleTodo(t.id)}
        className={"sk-check" + (t.done ? " done" : "")}
        style={{ cursor: "pointer" }}
        title={t.done ? "되돌리기" : "끝냄으로 표시"}
      />
      <span style={{
        fontFamily: "var(--hand)", fontSize: 15, flex: 1,
        color: t.done ? "var(--ink-3)" : "var(--ink)",
        textDecoration: t.done ? "line-through" : "none",
      }}>{t.text}</span>
      {!t.done && (
        <button onClick={() => actions.toggleHot(t.id)}
          title={t.hot ? "급함 해제" : "급함으로 표시"}
          style={{
            all: "unset", cursor: "pointer", fontSize: 14,
            color: t.hot ? "var(--ink)" : "var(--ink-3)",
            padding: "0 4px",
          }}>!</button>
      )}
      <DelBtn onClick={() => actions.removeTodo(t.id)} />
    </div>
  );
}

window.TodoView = TodoView;

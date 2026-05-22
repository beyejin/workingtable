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

  const todoCount = hot.length + rest.length;
  return (
    <SplitPane
      topLabel={`해야 할 일 · ${todoCount}`}
      top={
        <>
          <div style={{ marginBottom: 8 }}>
            <InlineAdd placeholder="할 일 추가…" onAdd={(v) => actions.addTodo(v)} />
          </div>
          {hot.map((t, i) => <TodoRow key={t.id} t={t} actions={actions} i={i} hot />)}
          {rest.map((t, i) => <TodoRow key={t.id} t={t} actions={actions} i={hot.length + i} />)}
          {todoCount === 0 && <div className="sk-cap">아래 입력창에 할 일을 적어주세요</div>}
        </>
      }
      bottomLabel={`한 일 · ${done.length}`}
      bottom={
        <>
          {done.map((t, i) => <TodoRow key={t.id} t={t} actions={actions} i={i} />)}
          {done.length === 0 && <div className="sk-cap">끝낸 일이 여기에 쌓여요</div>}
        </>
      }
    />
  );
}

function TodoRow({ t, actions, hot, i = 0 }) {
  return (
    <div className="tape" style={{
      ...tapeStyle(i),
      display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
      marginBottom: 7,
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

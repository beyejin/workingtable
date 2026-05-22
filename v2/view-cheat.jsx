/* global React, diary, SplitPane, Editable, DelBtn */
// ===========================================================
// 명령어 — 위: 주로 쓰는 명령어(사용 많은 순) / 아래: 등록한 명령어(전체)
// 클릭 한 번에 복사. 프로젝트별 분리. 사용 횟수 자동 카운트.
// ===========================================================
const { useState } = React;

function CheatView() {
  const { state, actions } = diary.useDiary();
  const commands = diary.select.commandsForCurrent(state);

  const [copiedId, setCopiedId] = useState(null);
  const onCopy = (id) => {
    actions.copyCommand(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(c => (c === id ? null : c)), 1200);
  };

  // 주로 쓰는 것: 사용 횟수 1회 이상, 많은 순
  const frequent = commands
    .filter(c => (c.uses ?? 0) > 0)
    .slice()
    .sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0))
    .slice(0, 6);

  // 등록한 것: 전체 (최근 등록 순 — 스토어가 앞에 추가)
  const all = commands;

  return (
    <SplitPane
      topLabel={`주로 쓰는 명령어 · ${frequent.length}`}
      top={
        frequent.length
          ? frequent.map((c, i) => <CmdCard key={c.id} c={c} actions={actions} copiedId={copiedId} onCopy={onCopy} i={i} compact />)
          : <div className="sk-cap">자주 쓰면 여기에 올라와요 (복사 시 카운트)</div>
      }
      bottomLabel={`등록한 명령어 · ${all.length}`}
      bottom={
        <>
          <div style={{ marginBottom: 8 }}>
            <InlineAdd placeholder="명령어 추가…" onAdd={(v) => actions.addCommand({ code: v })} />
          </div>
          {all.length
            ? all.map((c, i) => <CmdCard key={c.id} c={c} actions={actions} copiedId={copiedId} onCopy={onCopy} i={i} />)
            : <div className="sk-cap">위 입력칸에 명령어를 적어 저장하세요</div>}
        </>
      }
    />
  );
}

function CmdCard({ c, actions, copiedId, onCopy, compact, i = 0 }) {
  return (
    <div className="tape" style={{
      ...tapeStyle(i), padding: "7px 15px", marginBottom: 7,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ color: "var(--ink-3)", flexShrink: 0, fontFamily: "var(--mono)", fontSize: 12 }}>❯</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        {compact ? (
          <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.code}</div>
        ) : (
          <Editable
            value={c.code}
            onChange={(v) => actions.updateCommand(c.id, { code: v })}
            style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)" }}
          />
        )}
        {(c.label || !compact) && (
          compact
            ? (c.label && <div style={{ fontFamily: "var(--hand)", fontSize: 11, color: "var(--ink-2)" }}>{c.label}</div>)
            : <Editable
                value={c.label}
                onChange={(v) => actions.updateCommand(c.id, { label: v })}
                placeholder="(라벨)"
                style={{ fontFamily: "var(--hand)", fontSize: 11, color: "var(--ink-2)" }}
              />
        )}
      </span>
      <span className="sk-cap" style={{ fontSize: 11, flexShrink: 0 }}>{c.uses ?? 0}회</span>
      <button onClick={() => onCopy(c.id)} title="복사" style={{
        all: "unset", cursor: "pointer", fontSize: 13, flexShrink: 0,
        color: copiedId === c.id ? "var(--ink)" : "var(--ink-2)",
      }}>{copiedId === c.id ? "✓" : "📋"}</button>
      {!compact && (
        <DelBtn onClick={() => {
          if (confirm(`"${c.label || c.code}" 을(를) 삭제할까요?`)) actions.removeCommand(c.id);
        }} />
      )}
    </div>
  );
}

window.CheatView = CheatView;

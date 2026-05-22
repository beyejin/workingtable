/* global React, diary, ViewHeader, Editable, DelBtn */
// ===========================================================
// 치트 — 자주 쓰는 명령어/스니펫 보관, 클릭 한 번에 복사
// 프로젝트별로 분리. 사용 횟수 자동 카운트, 자주 쓰는 순 정렬.
// ===========================================================
const { useState } = React;

function CheatView() {
  const { state, actions } = diary.useDiary();
  const project = diary.select.currentProject(state);
  const commands = diary.select.commandsForCurrent(state)
    .slice()
    .sort((a, b) => (b.uses ?? 0) - (a.uses ?? 0));

  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const filtered = commands.filter(c =>
    !q.trim() ||
    c.label.toLowerCase().includes(q.toLowerCase()) ||
    c.code.toLowerCase().includes(q.toLowerCase())
  );

  const reset = () => { setLabel(""); setCode(""); };
  const submit = () => {
    if (!code.trim()) return;
    actions.addCommand({ label, code });
    reset(); setAdding(false);
  };
  const onCopy = (id) => {
    actions.copyCommand(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(c => (c === id ? null : c)), 1200);
  };

  return (
    <div>
      <ViewHeader
        ttl="치트"
        sub={`${project?.name ?? "프로젝트"} · ${commands.length}개 · 클릭 → 복사`}
      />

      {/* 검색 */}
      <div className="sk-box sk-dashed" style={{
        padding: "6px 10px", marginBottom: 10,
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span className="sk-cap" style={{ fontSize: 14 }}>🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="라벨 / 명령어로 찾기…"
          style={{
            flex: 1, border: 0, outline: "none", background: "transparent",
            fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink)",
          }} />
      </div>

      {/* 추가 폼 */}
      {!adding ? (
        <button onClick={() => setAdding(true)} className="sk-box sk-dashed" style={{
          all: "unset", cursor: "pointer", display: "block", width: "100%",
          padding: "8px 10px", marginBottom: 12, textAlign: "left",
          background: "var(--paper)", borderRadius: 10,
          border: "1.1px dashed var(--ink-2)",
          fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink-2)",
        }}>+ 새 명령어 저장</button>
      ) : (
        <div className="sk-box" style={{ padding: 10, marginBottom: 12, background: "var(--paper-2)" }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨 (예: 로컬 서버)" autoFocus
            style={{
              width: "100%", border: 0, outline: "none", background: "transparent",
              fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink)",
              padding: "4px 0",
            }} />
          <hr className="sk-hr" />
          <textarea value={code} onChange={(e) => setCode(e.target.value)}
            placeholder="명령어 / 스니펫 (예: pnpm dev)" rows={2}
            style={{
              width: "100%", border: 0, outline: "none", background: "transparent",
              fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)",
              padding: "4px 0", resize: "vertical", minHeight: 36,
            }} />
          <div style={{ display: "flex", gap: 6, marginTop: 6, justifyContent: "flex-end" }}>
            <button onClick={() => { reset(); setAdding(false); }} style={btn}>취소</button>
            <button onClick={submit} style={{...btn, background: "var(--pink)"}}>저장</button>
          </div>
        </div>
      )}

      {/* 리스트 */}
      {filtered.length === 0 && (
        <div className="sk-cap" style={{ textAlign: "center", padding: 20 }}>
          {q ? "검색 결과 없음" : "이 프로젝트의 명령어가 없어요"}
        </div>
      )}
      {filtered.map(c => (
        <div key={c.id} className="sk-box" style={{ padding: 0, marginBottom: 8, background: "white", overflow: "hidden" }}>
          {/* 라벨 + 메타 + 액션 */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 10px 4px",
          }}>
            <span style={{ fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink-2)", flex: 1 }}>
              <Editable
                value={c.label}
                onChange={(v) => actions.updateCommand(c.id, { label: v })}
                placeholder="(라벨 없음)"
                style={{ fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink-2)" }}
              />
            </span>
            <span className="sk-cap" style={{ fontSize: 12 }}>{c.uses ?? 0}회</span>
            <DelBtn onClick={() => {
              if (confirm(`"${c.label || c.code}" 을(를) 삭제할까요?`)) actions.removeCommand(c.id);
            }} />
          </div>

          {/* 명령어 본문 — 클릭 시 복사 */}
          <div
            onClick={() => onCopy(c.id)}
            title="클릭해서 복사"
            style={{
              cursor: "pointer",
              background: copiedId === c.id ? "var(--mint-soft)" : "var(--paper-2)",
              padding: "8px 10px",
              borderTop: "1.1px dashed var(--ink-soft)",
              fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background 0.15s",
              wordBreak: "break-all",
              lineHeight: 1.45,
            }}
          >
            <span style={{ color: "var(--ink-3)", flexShrink: 0 }}>❯</span>
            <span style={{ flex: 1 }}>
              <Editable
                value={c.code}
                onChange={(v) => actions.updateCommand(c.id, { code: v })}
                multiline
                style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink)" }}
              />
            </span>
            <span className="sk-cap" style={{
              fontSize: 12,
              color: copiedId === c.id ? "var(--ink)" : "var(--ink-3)",
              flexShrink: 0,
            }}>
              {copiedId === c.id ? "✓ 복사함" : "📋"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const btn = {
  all: "unset", cursor: "pointer",
  background: "var(--paper)", border: "1.1px solid var(--ink)",
  padding: "2px 10px", borderRadius: 99,
  fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
};

window.CheatView = CheatView;

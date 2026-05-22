/* global React, diary, ViewHeader, DelBtn */
// ===========================================================
// 메일 — 추가 / 답장 체크 / 삭제
// ===========================================================
const { useState } = React;

function MailView() {
  const { state, actions } = diary.useDiary();
  const mails = state.emails;
  const unreplied = mails.filter(m => !m.replied);
  const replied = mails.filter(m => m.replied);

  return (
    <div>
      <ViewHeader
        ttl="고객 문의"
        sub={`${unreplied.length}개 미답 · 답장 체크하면 자동 정리`}
      />

      <AddMailForm onAdd={(d) => actions.addEmail(d)} />

      <div className="sk-label" style={{ marginTop: 12, marginBottom: 6 }}>미답 · {unreplied.length}</div>
      {unreplied.length === 0 && <div className="sk-cap" style={{ marginBottom: 8 }}>전부 답장했어요 🌟</div>}
      {unreplied.map(m => <MailCard key={m.id} m={m} actions={actions} />)}

      {replied.length > 0 && (
        <>
          <div className="sk-label" style={{ marginTop: 16, marginBottom: 6 }}>답장함 · {replied.length}</div>
          {replied.map(m => <MailCard key={m.id} m={m} actions={actions} />)}
        </>
      )}
    </div>
  );
}

function MailCard({ m, actions }) {
  return (
    <div className="sk-box" style={{
      padding: 10, marginBottom: 8,
      background: m.hot && !m.replied ? "#fff4b0" : "white",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          onClick={() => actions.toggleReplied(m.id)}
          className={"sk-check" + (m.replied ? " done" : "")}
          style={{ cursor: "pointer" }}
          title={m.replied ? "미답으로 되돌리기" : "답장함으로 표시"}
        />
        <span style={{ fontFamily: "var(--hand)", fontSize: 15, flex: 1, fontWeight: m.replied ? 400 : 700 }}>{m.who}</span>
        <span className="sk-mono">{m.time}</span>
        <DelBtn onClick={() => actions.removeEmail(m.id)} />
      </div>
      <div style={{
        fontFamily: "var(--hand)", fontSize: 15, marginTop: 3,
        color: m.replied ? "var(--ink-2)" : "var(--ink)",
      }}>
        {m.subject}
      </div>
      {m.preview && (
        <div style={{
          fontFamily: "var(--hand-2)", fontSize: 14, marginTop: 2,
          color: "var(--ink-3)", lineHeight: 1.25,
        }}>
          {m.preview}
        </div>
      )}
    </div>
  );
}

function AddMailForm({ onAdd }) {
  const [open, setOpen] = useState(false);
  const [who, setWho] = useState("");
  const [subject, setSubject] = useState("");
  const [preview, setPreview] = useState("");
  const [hot, setHot] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="sk-box sk-dashed" style={{
        all: "unset", cursor: "pointer", display: "block", width: "100%",
        padding: "8px 10px", textAlign: "left",
        background: "var(--paper)", borderRadius: 10,
        border: "1.1px dashed var(--ink-2)",
        fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink-2)",
      }}>
        + 새 문의 추가
      </button>
    );
  }
  const reset = () => { setWho(""); setSubject(""); setPreview(""); setHot(false); };
  const cancel = () => { reset(); setOpen(false); };
  const submit = () => {
    if (!who.trim() || !subject.trim()) return;
    onAdd({ who, subject, preview, hot });
    reset();
    setOpen(false);
  };
  const inputStyle = {
    width: "100%", border: 0, outline: "none", background: "transparent",
    fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink)",
    padding: "4px 0",
  };
  return (
    <div className="sk-box" style={{ padding: 10, background: "var(--paper-2)" }}>
      <input value={who} onChange={e => setWho(e.target.value)}
        placeholder="누가 보냈나요? (이름 / 이메일)" style={inputStyle} />
      <hr className="sk-hr" />
      <input value={subject} onChange={e => setSubject(e.target.value)}
        placeholder="제목" style={inputStyle} />
      <hr className="sk-hr" />
      <textarea value={preview} onChange={e => setPreview(e.target.value)}
        placeholder="내용 한 줄 요약 (선택)" rows={2}
        style={{ ...inputStyle, resize: "vertical", minHeight: 30 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink-2)", cursor: "pointer" }}>
          <input type="checkbox" checked={hot} onChange={(e) => setHot(e.target.checked)} /> 급함
        </label>
        <span style={{ flex: 1 }} />
        <button onClick={cancel} style={btn}>취소</button>
        <button onClick={submit} style={{...btn, background: "var(--pink)"}}>추가</button>
      </div>
    </div>
  );
}

const btn = {
  all: "unset", cursor: "pointer",
  background: "var(--paper)", border: "1.1px solid var(--ink)",
  padding: "2px 10px", borderRadius: 99,
  fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
};

window.MailView = MailView;

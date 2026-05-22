/* global React, diary, SplitPane, DelBtn, openExternalUrl */
// ===========================================================
// 문의 — 위: 받은 문의(붙여넣기 + 목록) / 아래: 선택한 문의의 답장 초안
// 받은 문의를 클릭하면 아래에 그 메일의 초안 편집기가 나타난다.
// 사이트(플랫폼) 연결 버튼은 하단(초안)에만.
// ===========================================================
const { useState } = React;

function MailView() {
  const { state, actions } = diary.useDiary();
  const mails = state.emails ?? [];
  const unreplied = mails.filter(m => !m.replied);
  const replied = mails.filter(m => m.replied);
  const [selId, setSelId] = useState(null);
  const [paste, setPaste] = useState("");

  const selected = mails.find(m => m.id === selId) || null;

  function addPasted() {
    const body = paste.trim();
    if (!body) return;
    actions.addInquiry({ subject: body.split("\n")[0].slice(0, 60), body });
    setPaste("");
  }

  return (
    <SplitPane
      topLabel={`받은 문의 · ${unreplied.length}`}
      top={
        <>
          {/* 붙여넣기 */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <textarea
              value={paste}
              onChange={e => setPaste(e.target.value)}
              placeholder="받은 메일 붙여넣기…"
              rows={1}
              style={{
                flex: 1, boxSizing: "border-box", resize: "vertical", minHeight: 30,
                border: "1.1px solid var(--ink-soft)", borderRadius: 8, outline: "none",
                background: "var(--paper)", padding: "5px 8px",
                fontFamily: "var(--hand)", fontSize: 14, color: "var(--ink)",
              }}
            />
            <button onClick={addPasted} style={{ ...mailBtn, background: "var(--pink)", flexShrink: 0 }}>담기</button>
          </div>

          {unreplied.map(m => <InquiryRow key={m.id} m={m} selected={m.id === selId} onPick={() => setSelId(m.id)} actions={actions} />)}
          {replied.length > 0 && (
            <>
              <div className="sk-cap" style={{ margin: "8px 0 4px" }}>답장함 · {replied.length}</div>
              {replied.map(m => <InquiryRow key={m.id} m={m} selected={m.id === selId} onPick={() => setSelId(m.id)} actions={actions} />)}
            </>
          )}
          {mails.length === 0 && <div className="sk-cap">받은 메일을 붙여넣어 담아보세요</div>}
        </>
      }
      bottomLabel="메일 초안"
      bottom={
        selected
          ? <DraftEditor m={selected} actions={actions} />
          : <div className="sk-cap">위에서 받은 문의를 선택하면 여기서 초안을 적을 수 있어요</div>
      }
    />
  );
}

function InquiryRow({ m, selected, onPick, actions }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7, padding: "6px 9px", marginBottom: 6,
      borderRadius: 8, border: "1.1px solid var(--ink)",
      background: selected ? "var(--hi-soft)" : (m.replied ? "var(--paper-2)" : "white"),
      boxShadow: selected ? "inset 0 0 0 1.5px var(--ink)" : "none",
      opacity: m.replied && !selected ? 0.85 : 1,
    }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{m.replied ? "📭" : "✉️"}</span>
      <button onClick={onPick} style={{
        all: "unset", cursor: "pointer", flex: 1, minWidth: 0,
        fontFamily: "var(--hand)", fontSize: 14, fontWeight: m.replied ? 400 : 700,
        color: m.replied ? "var(--ink-2)" : "var(--ink)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{m.subject || m.body?.slice(0, 40) || "(제목 없음)"}</button>
      <button onClick={() => actions.toggleReplied(m.id)}
        className={"sk-check" + (m.replied ? " done" : "")}
        style={{ cursor: "pointer", flexShrink: 0 }}
        title={m.replied ? "미답으로" : "답장함으로"} />
      <DelBtn onClick={() => actions.removeEmail(m.id)} />
    </div>
  );
}

function DraftEditor({ m, actions }) {
  function openPlatform() {
    let url = m.platformUrl;
    if (!url) {
      url = prompt("이 메일의 답장/플랫폼 주소 (예: https://mail.google.com/...)") || "";
      if (!url.trim()) return;
      actions.updateEmail(m.id, { platformUrl: url.trim() });
      url = url.trim();
    }
    openExternalUrl(url);
  }
  return (
    <div>
      <div className="sk-label" style={{ marginBottom: 4 }}>✍️ {m.subject || "받은 문의"} — 답장 초안</div>
      <textarea
        value={m.draft ?? ""}
        onChange={e => actions.updateEmail(m.id, { draft: e.target.value })}
        placeholder="답장 초안을 적어두세요…"
        rows={4}
        style={{
          width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 70,
          border: "1.1px solid var(--ink-soft)", borderRadius: 8, outline: "none",
          background: "var(--paper)", padding: "8px 10px",
          fontFamily: "var(--hand)", fontSize: 15, color: "var(--ink)", lineHeight: 1.5,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <button onClick={() => actions.toggleReplied(m.id)} style={{
          ...mailBtn, background: m.replied ? "var(--mint)" : "var(--paper)",
        }}>{m.replied ? "✓ 답장함" : "답장함으로 표시"}</button>
        <span style={{ flex: 1 }} />
        <button onClick={openPlatform} title={m.platformUrl || "사이트 주소 연결"} style={{
          ...mailBtn, background: m.platformUrl ? "var(--point)" : "var(--paper)",
        }}>📧 {m.platformUrl ? "사이트 열기" : "사이트 연결"}</button>
      </div>
    </div>
  );
}

const mailBtn = {
  all: "unset", cursor: "pointer",
  padding: "4px 12px", borderRadius: 99,
  border: "1.1px solid var(--ink)", background: "var(--paper)",
  fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
};

window.MailView = MailView;

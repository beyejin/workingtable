/* global React, diary */
// ===========================================================
// 공통 컴포넌트 — 모든 뷰에서 재사용
// ===========================================================
const { useState, useRef, useEffect } = React;

function ViewHeader({ ttl, sub, action }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontFamily: "var(--hand)", fontSize: 22, fontWeight: 700 }}>{ttl}</div>
        {action}
      </div>
      {sub && <div className="sk-cap" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Divider() {
  return <hr style={{ border: 0, borderTop: "1.1px dashed var(--ink-soft)", margin: "16px 0" }} />;
}

// 인라인 입력창 — placeholder가 카와이 손글씨, 엔터로 submit
function InlineAdd({ placeholder, onAdd, multiline = false, dashed = true }) {
  const [v, setV] = useState("");
  const submit = () => {
    if (!v.trim()) return;
    onAdd(v.trim());
    setV("");
  };
  const onKey = (e) => {
    if (e.key === "Enter" && (!multiline || (e.metaKey || e.ctrlKey))) {
      e.preventDefault();
      submit();
    }
  };
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className={"sk-box " + (dashed ? "sk-dashed" : "")} style={{
      padding: "6px 10px", display: "flex", alignItems: "center", gap: 7,
      background: "var(--paper)",
    }}>
      <span className="sk-plus" style={{ flexShrink: 0 }}>+</span>
      <Tag
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        rows={multiline ? 2 : undefined}
        style={{
          flex: 1, border: 0, outline: "none", background: "transparent",
          fontFamily: "var(--hand)", fontSize: 15, color: "var(--ink)",
          resize: multiline ? "vertical" : undefined,
          minHeight: multiline ? 36 : undefined,
        }}
      />
      {v.trim() && (
        <button onClick={submit} style={{
          all: "unset", cursor: "pointer",
          background: "var(--pink)", border: "1.1px solid var(--ink)",
          padding: "1px 10px", borderRadius: 99,
          fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
        }}>저장</button>
      )}
    </div>
  );
}

// 인라인 편집 가능한 텍스트 (contenteditable)
function Editable({ value, onChange, placeholder = "", multiline = false, style = {} }) {
  const ref = useRef(null);
  const lastSavedRef = useRef(value);
  // 외부에서 value 바뀌면 DOM 반영
  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value || "";
      lastSavedRef.current = value;
    }
  }, [value]);
  const onBlur = () => {
    const v = ref.current.innerText.trim();
    if (v !== lastSavedRef.current) {
      lastSavedRef.current = v;
      onChange(v);
    }
  };
  const onKey = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      ref.current.blur();
    }
  };
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={onBlur}
      onKeyDown={onKey}
      className="editable"
      style={{
        outline: "none",
        minHeight: multiline ? 40 : 22,
        padding: "1px 4px",
        borderRadius: 4,
        cursor: "text",
        ...style,
      }}
    />
  );
}

// 삭제 버튼 (작은 ×)
function DelBtn({ onClick }) {
  return (
    <button onClick={onClick} title="삭제" style={{
      all: "unset", cursor: "pointer",
      width: 16, height: 16, borderRadius: "50%",
      display: "grid", placeItems: "center",
      fontFamily: "var(--mono)", fontSize: 10,
      color: "var(--ink-3)",
      background: "transparent",
    }}>×</button>
  );
}

// 토글 (작은 둥근 버튼)
function ToggleBadge({ on, onClick, children, color = "var(--hi)" }) {
  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "pointer",
      fontFamily: "var(--hand)", fontSize: 12,
      padding: "1px 8px", borderRadius: 99,
      border: "1.1px solid var(--ink)",
      background: on ? color : "var(--paper)",
      color: "var(--ink)",
    }}>{children}</button>
  );
}

// ---- 프로젝트 스위쳐 (sticky banner에서 사용) ----
function ProjectSwitcher() {
  const { state, actions } = diary.useDiary();
  const project = diary.select.currentProject(state);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!project) {
    return (
      <div className="sk-cap">프로젝트가 없어요 — 추가해주세요
        <button onClick={addNew} style={btnLink}>+ 새 프로젝트</button>
      </div>
    );
  }

  function addNew() {
    const name = prompt("새 프로젝트 이름");
    if (name?.trim()) actions.addProject({ name: name.trim() });
    setOpen(false);
  }
  function removeCurrent() {
    if (confirm(`"${project.name}" 프로젝트를 삭제할까요? (할 일 등 데이터는 그대로 남음)`)) {
      actions.removeProject(project.id);
    }
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <div className="sk-cap" style={{ fontSize: 13 }}>
        지금 작업중 · {new Date().toTimeString().slice(0,5)} · 오늘 {state.workSessions.find(w => w.date === diary.today())?.minutes ?? 0}m
      </div>

      <div style={{
        fontFamily: "var(--hand)", fontSize: 20, marginTop: 2,
        display: "flex", alignItems: "center", gap: 6, fontWeight: 700,
      }}>
        <Editable
          value={project.name}
          onChange={(v) => actions.updateProject(project.id, { name: v || "이름없음" })}
          style={{ fontFamily: "var(--hand)", fontSize: 20, fontWeight: 700, flex: 1 }}
        />
        <span className="sk-dot hi" />
        <button onClick={() => setOpen(o => !o)} title="프로젝트 전환" style={{
          all: "unset", cursor: "pointer",
          fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)",
          padding: "0 4px",
        }}>{open ? "▴" : "▾"}</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
        <Editable
          value={project.path}
          onChange={(v) => actions.updateProject(project.id, { path: v })}
          placeholder="~/path"
          style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)", flex: 1 }}
        />
        <span className="sk-mono">git: <Editable
          value={project.gitBranch}
          onChange={(v) => actions.updateProject(project.id, { gitBranch: v })}
          style={{ display: "inline-block", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-2)" }}
        /></span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6,
          background: "var(--paper)", border: "1.1px solid var(--ink)",
          borderRadius: 10, padding: 8, zIndex: 50,
          boxShadow: "0 4px 0 var(--paper-3)",
        }}>
          <div className="sk-label" style={{ marginBottom: 6 }}>전환</div>
          {state.projects.map(p => (
            <button key={p.id} onClick={() => { actions.switchProject(p.id); setOpen(false); }}
              style={{
                all: "unset", display: "block", width: "100%",
                padding: "5px 8px", borderRadius: 6,
                fontFamily: "var(--hand)", fontSize: 15,
                cursor: "pointer",
                background: p.id === project.id ? "var(--hi-soft)" : "transparent",
                color: "var(--ink)",
                marginBottom: 2,
              }}>
              <span style={{ display: "inline-block", width: 14, fontFamily: "var(--mono)" }}>
                {p.id === project.id ? "●" : "○"}
              </span>
              {p.name}
              {p.status === "paused" && <span className="sk-cap" style={{ marginLeft: 6, fontSize: 12 }}>(일시정지)</span>}
            </button>
          ))}
          <hr className="sk-hr" />
          <button onClick={addNew} style={menuItem}>＋ 새 프로젝트 추가</button>
          <button onClick={removeCurrent} style={{...menuItem, color: "var(--bad)"}}>
            ✕ "{project.name}" 삭제
          </button>
        </div>
      )}
    </div>
  );
}

const menuItem = {
  all: "unset", display: "block", width: "100%",
  padding: "5px 8px", borderRadius: 6,
  fontFamily: "var(--hand)", fontSize: 14,
  cursor: "pointer",
  color: "var(--ink-2)",
  marginBottom: 2,
};
const btnLink = {
  all: "unset", cursor: "pointer", marginLeft: 6,
  fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
  textDecoration: "underline",
};

// editable placeholder CSS (한 번만 주입)
if (!document.getElementById("editable-placeholder-css")) {
  const s = document.createElement("style");
  s.id = "editable-placeholder-css";
  s.textContent = `
    .editable:empty::before {
      content: attr(data-placeholder);
      color: var(--ink-3);
      pointer-events: none;
    }
    .editable:focus { background: var(--hi-soft); }
  `;
  document.head.appendChild(s);
}

window.ViewHeader = ViewHeader;
window.Divider = Divider;
window.InlineAdd = InlineAdd;
window.Editable = Editable;
window.DelBtn = DelBtn;
window.ToggleBadge = ToggleBadge;
window.ProjectSwitcher = ProjectSwitcher;

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

// 본문을 가운데 선으로 위/아래 반반 나누는 레이아웃
function SplitPane({ topLabel, topRight, top, bottomLabel, bottomRight, bottom }) {
  const sec = { minHeight: 0, overflowY: "auto", overflowX: "hidden" };
  const head = { display: "flex", alignItems: "center", gap: 6, marginBottom: 8 };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* 위 2/3 */}
      <div style={{ ...sec, flex: 2, padding: "12px 14px 10px" }}>
        {(topLabel || topRight) && (
          <div style={head}>
            <div className="sk-label" style={{ flex: 1 }}>{topLabel}</div>
            {topRight}
          </div>
        )}
        {top}
      </div>
      <div style={{ borderTop: "1.6px solid var(--ink)", flexShrink: 0 }} />
      {/* 아래 1/3 */}
      <div style={{ ...sec, flex: 1, padding: "10px 14px 12px", background: "var(--paper-2)" }}>
        {(bottomLabel || bottomRight) && (
          <div style={head}>
            <div className="sk-label" style={{ flex: 1 }}>{bottomLabel}</div>
            {bottomRight}
          </div>
        )}
        {bottom}
      </div>
    </div>
  );
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

// ---- 오늘 요약 (sticky 헤더 — 모든 탭 공통) ----
function TodaySummary() {
  const { state } = diary.useDiary();
  const today = diary.today();
  const todos = (state.todos ?? []).filter(t => t.projectId === state.currentProjectId && !t.done);
  const minutes = (state.workSessions ?? []).find(w => w.date === today)?.minutes ?? 0;
  const unreplied = (state.emails ?? []).filter(e => !e.replied).length;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontFamily: "var(--hand)", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
        오늘 — {diary.fmtKDate(today)}
      </div>
      <div className="sk-cap" style={{ marginTop: 1, fontSize: 13 }}>
        작업 {minutes}m · {todos.length}개 할 일 · {unreplied}개 미답 메일
      </div>
    </div>
  );
}

// ---- 외부 열기 헬퍼 (Tauri opener 플러그인 / 웹 폴백) ----
function openExternalUrl(url) {
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    const op = window.__TAURI__ && window.__TAURI__.opener;
    if (op && op.openUrl) { op.openUrl(url); return; }
  } catch (_) {}
  try { window.open(url, "_blank"); } catch (_) {}
}
function openLocalPath(path) {
  if (!path) return;
  try {
    const op = window.__TAURI__ && window.__TAURI__.opener;
    if (op && op.openPath) { op.openPath(path).catch(() => op.revealItemInDir && op.revealItemInDir(path)); return; }
    if (op && op.revealItemInDir) { op.revealItemInDir(path); return; }
  } catch (e) { alert("폴더 열기 실패: " + (e && e.message ? e.message : e)); return; }
  alert("폴더 열기는 데스크탑 앱에서만 동작해요.");
}
function pathBasename(p) {
  if (!p) return "";
  const parts = p.replace(/[\\/]+$/, "").split(/[\\/]/);
  return parts[parts.length - 1] || p;
}

// ---- 상단 헤더 액션 칩 ----
function HdrChip({ onClick, title, children, accent }) {
  return (
    <button onClick={onClick} title={title} style={{
      all: "unset", cursor: "pointer",
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 9px", borderRadius: 99,
      border: "1.1px solid var(--ink)",
      background: accent ? "var(--point)" : "rgba(255,255,255,0.6)",
      fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink)",
      maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    }}>{children}</button>
  );
}

// 헤더 우측 작은 아이콘 버튼 스타일
function hdrIconBtn(active) {
  return {
    all: "unset", cursor: "pointer",
    width: 24, height: 22, borderRadius: 7, flexShrink: 0,
    display: "grid", placeItems: "center",
    fontSize: 12, color: "var(--ink)",
    background: active ? "var(--point)" : "rgba(255,255,255,0.55)",
    border: "1px solid var(--ink)",
  };
}

// ---- 프로젝트 스위쳐 (타이틀바에서 사용) — 프로젝트명 + 메뉴 ----
function ProjectSwitcher() {
  const { state, actions } = diary.useDiary();
  const project = diary.select.currentProject(state);
  const [open, setOpen] = useState(false);

  function addNew() {
    const name = prompt("새 프로젝트 이름");
    if (name?.trim()) actions.addProject({ name: name.trim() });
    setOpen(false);
  }
  function rename() {
    if (!project) return;
    const name = prompt("프로젝트 이름 변경", project.name);
    if (name?.trim()) actions.updateProject(project.id, { name: name.trim() });
    setOpen(false);
  }
  function removeCurrent() {
    if (!project) return;
    if (confirm(`"${project.name}" 프로젝트를 삭제할까요? (할 일 등 데이터는 그대로 남음)`)) {
      actions.removeProject(project.id);
    }
    setOpen(false);
  }

  return (
    <div style={{ position: "relative", flexShrink: 0, maxWidth: 220 }}>
      <button onClick={() => setOpen(o => !o)} title="프로젝트 메뉴" style={{
        all: "unset", cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 5, maxWidth: 220,
        fontFamily: "var(--hand)", fontSize: 13, fontWeight: 700, color: "var(--ink)",
      }}>
        <span style={{ flexShrink: 0 }}>💾</span>
        <span style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {project?.name || "프로젝트"}
        </span>
        <span style={{ fontSize: 9, opacity: .7, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, marginTop: 6, minWidth: 180,
          background: "var(--paper)", border: "1.1px solid var(--ink)",
          borderRadius: 10, padding: 8, zIndex: 60,
          boxShadow: "0 4px 0 var(--paper-3)",
        }}>
          <div className="sk-label" style={{ marginBottom: 6 }}>프로젝트</div>
          {state.projects.map(p => (
            <button key={p.id} onClick={() => { actions.switchProject(p.id); setOpen(false); }}
              style={{
                all: "unset", display: "block", width: "100%",
                padding: "5px 8px", borderRadius: 6,
                fontFamily: "var(--hand)", fontSize: 15, cursor: "pointer",
                background: p.id === project?.id ? "var(--hi-soft)" : "transparent",
                color: "var(--ink)", marginBottom: 2,
              }}>
              <span style={{ display: "inline-block", width: 14, fontFamily: "var(--mono)" }}>
                {p.id === project?.id ? "●" : "○"}
              </span>
              {p.name}
            </button>
          ))}
          <hr className="sk-hr" />
          <button onClick={addNew} style={menuItem}>＋ 새 프로젝트 추가</button>
          {project && <button onClick={rename} style={menuItem}>✎ 이름 변경</button>}
          {project && (
            <button onClick={removeCurrent} style={{ ...menuItem, color: "var(--bad)" }}>
              ✕ "{project.name}" 삭제
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---- git / 폴더 버튼 (키보드 위 줄에서 사용) ----
function RepoButtons() {
  const { state, actions } = diary.useDiary();
  const project = diary.select.currentProject(state);
  if (!project) return null;

  function openGit() {
    let url = project.repoUrl;
    if (!url) {
      url = prompt("git 저장소 주소 (예: https://github.com/me/repo)") || "";
      if (!url.trim()) return;
      actions.updateProject(project.id, { repoUrl: url.trim() });
      url = url.trim();
    }
    openExternalUrl(url);
  }
  function openFolder() {
    let p = project.path;
    if (!p) {
      p = prompt("프로젝트 폴더 경로 (예: C:\\work\\my-repo)") || "";
      if (!p.trim()) return;
      actions.updateProject(project.id, { path: p.trim() });
      p = p.trim();
    }
    openLocalPath(p);
  }

  const keyBtn = {
    all: "unset", cursor: "pointer", flex: 1, minWidth: 0,
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
    padding: "5px 8px", borderRadius: 8,
    border: "1.1px solid var(--ink)",
    background: "linear-gradient(180deg, #ffffff 0%, #e7edf4 100%)",
    boxShadow: "0 2px 0 #97a6b8, inset 0 1px 0 rgba(255,255,255,0.9)",
    fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  };

  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 7 }}>
      <button onClick={openGit} title={project.repoUrl || "git 주소 연결"} style={keyBtn}>
        ↗ {project.repoUrl ? "git 저장소" : "git 연결"}
      </button>
      <button onClick={openFolder} title={project.path || "폴더 경로 연결"} style={keyBtn}>
        📁 {project.path ? pathBasename(project.path) : "폴더 연결"}
      </button>
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

// ---- 마스킹테이프 스타일 ----
const TAPE_COLORS = [
  ["#ffd9e6", "dots"], ["#fdffc0", "diag"], ["#d9f0c0", "dots"], ["#ffd0d8", "diag"],
  ["#c6ecd7", "gingham"], ["#e2d6f5", "dots"], ["#cfe2fa", "dots"], ["#f3e8c8", "gingham"],
];
const TAPE_PAT = {
  dots: "radial-gradient(rgba(255,255,255,.7) 1.6px, transparent 1.7px) 0 0 / 9px 9px",
  diag: "repeating-linear-gradient(45deg, rgba(255,255,255,.5) 0 2px, transparent 2px 7px)",
  gingham: "repeating-linear-gradient(0deg, rgba(255,255,255,.4) 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, rgba(255,255,255,.4) 0 4px, transparent 4px 8px)",
};
function tapeStyle(i) {
  const [c, p] = TAPE_COLORS[((i % TAPE_COLORS.length) + TAPE_COLORS.length) % TAPE_COLORS.length];
  return { background: `${TAPE_PAT[p]}, ${c}` };
}

if (!document.getElementById("tape-css")) {
  const s = document.createElement("style");
  s.id = "tape-css";
  s.textContent = `
    .tape {
      position: relative;
      border-radius: 2px;
      box-shadow: 0 2px 3px rgba(40,51,63,.16);
      -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 9px, #000 calc(100% - 9px), transparent 100%);
              mask-image: linear-gradient(90deg, transparent 0, #000 9px, #000 calc(100% - 9px), transparent 100%);
    }
  `;
  document.head.appendChild(s);
}

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
window.SplitPane = SplitPane;
window.tapeStyle = tapeStyle;
window.TodaySummary = TodaySummary;
window.Divider = Divider;
window.InlineAdd = InlineAdd;
window.Editable = Editable;
window.DelBtn = DelBtn;
window.ToggleBadge = ToggleBadge;
window.ProjectSwitcher = ProjectSwitcher;
window.RepoButtons = RepoButtons;

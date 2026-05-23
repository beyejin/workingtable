/* global React, diary, SplitPane */
// ===========================================================
// 메모 — 작은 노션 + 버디버디 UI
//   화면1: 친구목록(버디버디 흰 창) + 메모 관리(검색/정렬/일괄)
//   화면2: contenteditable 본문 + 풍부한 인라인 에디터 툴바
// ===========================================================
const { useState, useEffect, useRef } = React;

function MemoView() {
  const [selectedId, setSelectedId] = useState(null);
  const { state } = diary.useDiary();
  useEffect(() => {
    if (selectedId && !state.memos.find(m => m.id === selectedId)) setSelectedId(null);
  }, [selectedId, state.memos]);
  if (selectedId) return <MemoEditScreen memoId={selectedId} onBack={() => setSelectedId(null)} />;
  return <MemoListScreen onOpen={setSelectedId} />;
}

// ===========================================================
// 화면 1: 메모 목록
// ===========================================================
function MemoListScreen({ onOpen }) {
  const { state, actions } = diary.useDiary();
  const allMemos = diary.select.memosForCurrent(state);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [pickerOpenId, setPickerOpenId] = useState(null);

  const memos = filterAndSort(allMemos, search, sort);

  const createNew = () => {
    setPickerOpenId(null);
    const id = actions.addMemo({});
    onOpen(id);
  };

  const cleanEmpty = async () => {
    const empty = allMemos.filter(m => isEmptyMemo(m));
    if (!empty.length) { await window.dialog.alert(L("memo.noEmpty")); return; }
    const ok = await window.dialog.confirm(L("memo.cleanConfirm", { n: empty.length }));
    if (!ok) return;
    empty.forEach(m => actions.removeMemo(m.id));
  };

  return (
    <SplitPane
      top={
        <BuddyWindow
          memos={memos}
          totalCount={allMemos.length}
          onOpen={onOpen}
          pickerOpenId={pickerOpenId}
          setPickerOpenId={setPickerOpenId}
          onPickIcon={(id, icon) => { actions.updateMemo(id, { icon }); setPickerOpenId(null); }}
          onDelete={async (m) => {
            const ok = await window.dialog.confirm(L("memo.delConfirm", { x: m.title || L("memo.untitled") }));
            if (ok) actions.removeMemo(m.id);
          }}
          onCreate={createNew}
        />
      }
      bottomLabel={L("memo.manage")}
      bottom={
        <ManagePanel
          search={search} setSearch={setSearch}
          sort={sort} setSort={setSort}
          onCleanEmpty={cleanEmpty}
          totalCount={allMemos.length}
          shownCount={memos.length}
        />
      }
    />
  );
}

function isEmptyMemo(m) {
  if (!m) return false;
  const text = ((m.html || "").replace(/<[^>]+>/g, "")).trim();
  return text.length === 0 && !/<img/i.test(m.html || "");
}

function filterAndSort(memos, search, sort) {
  let arr = memos;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    arr = arr.filter(m => {
      const title = (m.title || "").toLowerCase();
      const text = ((m.html || "").replace(/<[^>]+>/g, " ")).toLowerCase();
      return title.includes(q) || text.includes(q);
    });
  }
  const out = arr.slice();
  if (sort === "title") out.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  else if (sort === "created") out.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  else out.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  return out;
}

// ---- 버디버디 친구목록 창 ----
function BuddyWindow({ memos, totalCount, onOpen, pickerOpenId, setPickerOpenId, onPickIcon, onDelete, onCreate }) {
  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column", minHeight: 0,
      background: "#ffffff",
      border: "1.1px solid var(--ink)", borderRadius: 8,
      boxShadow: "0 2px 0 var(--paper-3)",
      overflow: "hidden",
    }}>
      {/* 윈도우 타이틀바 */}
      <div style={{
        flexShrink: 0, padding: "5px 10px",
        background: "linear-gradient(180deg, color-mix(in srgb, var(--chrome, #a9cdf5) 42%, white) 0%, color-mix(in srgb, var(--chrome, #a9cdf5) 12%, white) 100%)",
        borderBottom: "1.1px solid var(--ink)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 13, lineHeight: 1 }}>💬</span>
        <span style={{ fontFamily: "var(--hand)", fontSize: 13, fontWeight: 700, color: "var(--ink)", flex: 1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{L("memo.buddyWindow")}</span>
        <button onClick={onCreate} title={L("memo.new")} style={{
          all: "unset", cursor: "pointer", padding: "2px 9px", borderRadius: 99,
          border: "1.1px solid var(--ink)",
          background: "linear-gradient(180deg, var(--point-soft), var(--point))",
          fontFamily: "var(--hand)", fontSize: 11, fontWeight: 700, color: "var(--ink)",
        }}>＋ {L("memo.new")}</button>
      </div>
      {/* 카테고리 헤더 */}
      <div style={{
        flexShrink: 0, padding: "3px 10px",
        background: "#eef2f7", borderBottom: "1px solid #d8dee5",
        fontFamily: "var(--hand)", fontSize: 11, color: "#4a5568",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <span style={{ fontSize: 8, color: "#4a5568" }}>▾</span>
        <span style={{ fontWeight: 700 }}>{L("memo.category")}</span>
        <span style={{ color: "#8a96a5" }}>({memos.length})</span>
      </div>
      {/* 친구 행들 */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "#ffffff" }}>
        {memos.length === 0
          ? <div className="sk-cap" style={{ padding: 16, textAlign: "center" }}>
              {totalCount === 0 ? L("memo.empty") : L("memo.searchNone")}
            </div>
          : memos.map((m) => (
              <BuddyRow
                key={m.id}
                memo={m}
                pickerOpen={pickerOpenId === m.id}
                onClick={() => onOpen(m.id)}
                onTogglePicker={() => setPickerOpenId(o => o === m.id ? null : m.id)}
                onPickIcon={(icon) => onPickIcon(m.id, icon)}
                onDelete={() => onDelete(m)}
              />
            ))}
      </div>
    </div>
  );
}

function BuddyRow({ memo, pickerOpen, onClick, onTogglePicker, onPickIcon, onDelete }) {
  const [hover, setHover] = useState(false);
  const title = (memo.title || "").trim() || L("memo.untitled");
  const text = ((memo.html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const preview = text.length > 60 ? text.slice(0, 60) + "…" : text;

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: hover ? "#e7f0fa" : "transparent", borderBottom: "1px solid #f0f0f0" }}>
      <div onClick={onClick} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", cursor: "pointer",
      }}>
        <button onClick={(e) => { e.stopPropagation(); onTogglePicker(); }}
          title={L("memo.changeIcon")}
          style={{
            all: "unset", cursor: "pointer", flexShrink: 0,
            width: 22, height: 22, borderRadius: 4,
            display: "grid", placeItems: "center", fontSize: 17, lineHeight: 1,
            background: pickerOpen ? "var(--hi)" : "transparent",
          }}>{memo.icon || "📝"}</button>
        <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{
            fontFamily: "var(--hand)", fontSize: 13, fontWeight: 700, color: "#2b2f36",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            flexShrink: 0, maxWidth: "55%",
          }}>{title}</span>
          {preview && (
            <span style={{
              fontFamily: "var(--hand)", fontSize: 11.5, color: "#7a8290",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              flex: 1, minWidth: 0,
            }}>— {preview}</span>
          )}
        </span>
        <span style={{ fontSize: 10, color: "#8a96a5", fontFamily: "var(--mono)", flexShrink: 0 }}>
          {relativeTime(memo.updatedAt)}
        </span>
        {hover && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title={L("memo.delete")}
            style={{
              all: "unset", cursor: "pointer", flexShrink: 0,
              width: 18, height: 18, borderRadius: 3,
              display: "grid", placeItems: "center", fontSize: 10, color: "#7a8290",
            }}>🗑</button>
        )}
      </div>
      {pickerOpen && (
        <div style={{
          padding: "4px 10px 6px 36px",
          display: "flex", flexWrap: "wrap", gap: 3,
          background: "#fafbfc", borderTop: "1px solid #eef0f3",
        }}>
          {(diary.MEMO_ICONS || []).map(icon => (
            <button key={icon} onClick={(e) => { e.stopPropagation(); onPickIcon(icon); }}
              style={{
                all: "unset", cursor: "pointer",
                width: 22, height: 22, borderRadius: 4,
                display: "grid", placeItems: "center", fontSize: 15, lineHeight: 1,
                background: memo.icon === icon ? "var(--hi)" : "transparent",
                border: memo.icon === icon ? "1px solid var(--ink)" : "1px solid transparent",
              }}>{icon}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- 메모 관리: 검색 / 정렬 / 일괄정리 ----
function ManagePanel({ search, setSearch, sort, setSort, onCleanEmpty, totalCount, shownCount }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 9px", background: "var(--paper)",
        border: "1.1px solid var(--ink)", borderRadius: 8,
      }}>
        <span style={{ fontSize: 12, color: "var(--ink-2)" }}>🔍</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder={L("memo.searchPh")}
          style={{ flex: 1, border: 0, outline: "none", background: "transparent",
            fontFamily: "var(--hand)", fontSize: 13, color: "var(--ink)" }} />
        {search && (
          <button onClick={() => setSearch("")} style={{
            all: "unset", cursor: "pointer", fontSize: 11, color: "var(--ink-3)",
          }}>✕</button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
        <span className="sk-cap" style={{ fontSize: 11, marginRight: 2 }}>{L("memo.sort")}</span>
        <SortBtn active={sort === "recent"} onClick={() => setSort("recent")}>{L("memo.sortRecent")}</SortBtn>
        <SortBtn active={sort === "title"} onClick={() => setSort("title")}>{L("memo.sortTitle")}</SortBtn>
        <SortBtn active={sort === "created"} onClick={() => setSort("created")}>{L("memo.sortCreated")}</SortBtn>
      </div>
      <button onClick={onCleanEmpty} style={{
        all: "unset", cursor: "pointer", textAlign: "center",
        padding: "5px 10px", borderRadius: 8,
        border: "1.1px solid var(--ink)",
        background: "var(--paper)",
        fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
      }}>🧹 {L("memo.cleanEmpty")}</button>
      <div className="sk-cap" style={{ fontSize: 10.5, textAlign: "center" }}>
        {search ? L("memo.searchResult", { n: shownCount, t: totalCount }) : L("memo.totalCount", { n: totalCount })}
      </div>
    </div>
  );
}

function SortBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "pointer", padding: "2px 9px", borderRadius: 99,
      border: "1px solid var(--ink-soft)",
      background: active ? "var(--hi)" : "var(--paper)",
      fontFamily: "var(--hand)", fontSize: 11.5, color: "var(--ink)",
      fontWeight: active ? 700 : 400,
    }}>{children}</button>
  );
}

// ===========================================================
// 화면 2: 메모 편집 (contenteditable + 노션형 툴바)
// ===========================================================
function MemoEditScreen({ memoId, onBack }) {
  const { state, actions } = diary.useDiary();
  const memo = state.memos.find(m => m.id === memoId);
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  // 현재 selection의 서식 상태 (B/I/U/S, 리스트, 정렬, 헤딩, 폰트, 크기)
  const [active, setActive] = useState({ heading: "p", font: "", size: "" });

  // memo 전환 시 본문 동기화 (커서 점프 방지를 위해 memoId 변경 시에만)
  useEffect(() => {
    if (!memo) return;
    if (editorRef.current && editorRef.current.innerHTML !== (memo.html || "")) {
      editorRef.current.innerHTML = memo.html || "";
    }
  }, [memoId]);

  // selectionchange로 서식 활성 상태 추적
  useEffect(() => {
    const update = () => {
      if (!editorRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const node = sel.anchorNode;
      if (!node || !editorRef.current.contains(node)) return;
      let heading = "p";
      try {
        const block = (document.queryCommandValue("formatBlock") || "").toLowerCase().replace(/[<>]/g, "");
        if (["h1", "h2", "h3", "blockquote", "pre"].includes(block)) heading = block;
      } catch (_) {}
      setActive({
        bold: safeState("bold"),
        italic: safeState("italic"),
        underline: safeState("underline"),
        strike: safeState("strikeThrough"),
        bullet: safeState("insertUnorderedList"),
        number: safeState("insertOrderedList"),
        alignLeft: safeState("justifyLeft"),
        alignCenter: safeState("justifyCenter"),
        alignRight: safeState("justifyRight"),
        heading,
      });
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  // execCommand CSS 모드 활성화
  useEffect(() => {
    try { document.execCommand("styleWithCSS", false, true); } catch (_) {}
  }, []);

  const queueSave = () => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        actions.updateMemo(memoId, { html: editorRef.current.innerHTML });
      }
    }, 500);
  };

  // unmount / memoId 전환 시 즉시 저장
  useEffect(() => {
    const id = memoId;
    return () => {
      clearTimeout(saveTimerRef.current);
      if (editorRef.current) {
        actions.updateMemo(id, { html: editorRef.current.innerHTML });
      }
    };
  }, [memoId]);

  const exec = (cmd, val) => {
    editorRef.current?.focus();
    try { document.execCommand("styleWithCSS", false, true); } catch (_) {}
    try { document.execCommand(cmd, false, val); } catch (_) {}
    queueSave();
  };

  const onSetFontSize = (px) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    const span = document.createElement("span");
    span.style.fontSize = px + "px";

    if (range.collapsed) {
      // 선택 없음 — 빈 span을 삽입해 다음 입력될 텍스트의 크기를 결정
      span.appendChild(document.createTextNode("​"));
      range.insertNode(span);
      const newRange = document.createRange();
      newRange.setStart(span.firstChild, 1);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    } else {
      // 선택된 영역을 span으로 감싸기
      try {
        range.surroundContents(span);
      } catch (_) {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      sel.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      sel.addRange(newRange);
    }
    queueSave();
  };

  const onSetFontFamily = (family) => exec("fontName", family);
  const onColor = (c) => exec("foreColor", c);
  const onHighlight = (c) => exec("hiliteColor", c);
  const onHeading = (tag) => exec("formatBlock", `<${tag}>`);
  const onAlign = (dir) => exec("justify" + dir); // Left/Center/Right/Full
  const onQuote = () => exec("formatBlock", "<blockquote>");
  const onHr = () => exec("insertHorizontalRule");
  const onUndo = () => exec("undo");
  const onRedo = () => exec("redo");
  const onClearFormat = () => exec("removeFormat");

  const onAddImage = (file) => {
    if (!file) return;
    if (file.size > 600 * 1024) { window.dialog.alert(L("memo.imageTooLarge")); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      editorRef.current?.focus();
      const html = `<img src="${url}" style="max-width:100%; display:block; margin: 6px 0; border-radius: 6px;" />`;
      try { document.execCommand("insertHTML", false, html); } catch (_) {}
      queueSave();
    };
    reader.readAsDataURL(file);
  };

  const onAddLink = async () => {
    let url = await window.dialog.prompt(L("memo.linkUrl"));
    if (!url || !url.trim()) return;
    url = url.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.toString().length > 0) {
      try { document.execCommand("createLink", false, url); } catch (_) {}
    } else {
      const label = (await window.dialog.prompt(L("memo.linkLabel"), url)) || url;
      try { document.execCommand("insertHTML", false, `<a href="${url}" target="_blank">${escapeAttr(label)}</a>`); } catch (_) {}
    }
    queueSave();
  };

  // 링크 클릭 시 외부 열기 (편집기 안에서도)
  const onEditorClick = (e) => {
    const a = e.target.closest && e.target.closest("a");
    if (a && a.href && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (window.openExternalUrl) window.openExternalUrl(a.href);
      else window.open(a.href, "_blank");
    }
  };

  if (!memo) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: "#ffffff" }}>
      {/* 윈도우 타이틀바 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
        padding: "6px 10px",
        background: "linear-gradient(180deg, color-mix(in srgb, var(--chrome,#a9cdf5) 42%, white) 0%, color-mix(in srgb, var(--chrome,#a9cdf5) 12%, white) 100%)",
        borderBottom: "1.1px solid var(--ink)",
      }}>
        <button onClick={onBack} title={L("memo.back")} style={headerBtn}>←</button>
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{memo.icon || "📝"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "var(--hand)", fontSize: 14, fontWeight: 700, color: "var(--ink)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{(memo.title || "").trim() || L("memo.newDraft")}</div>
        </div>
        <button
          onClick={async () => {
            const ok = await window.dialog.confirm(L("memo.delConfirm", { x: memo.title || L("memo.untitled") }));
            if (ok) { actions.removeMemo(memoId); onBack(); }
          }}
          title={L("memo.delete")}
          style={headerBtn}
        >🗑</button>
      </div>

      {/* 본문 (contenteditable) */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={queueSave}
        onBlur={queueSave}
        onClick={onEditorClick}
        className="memo-editor"
        style={{
          flex: 1, minHeight: 0, overflowY: "auto",
          padding: "12px 14px",
          background: "#ffffff",
          fontFamily: "var(--hand)", fontSize: 12, lineHeight: 1.5, color: "#222",
          outline: "none",
        }}
      />

      {/* 디바이더 */}
      <div style={{ borderTop: "1.6px solid var(--ink)", flexShrink: 0 }} />

      {/* 에디터 툴바 */}
      <EditorToolbar
        active={active}
        onCmd={exec}
        onHeading={onHeading}
        onFontSize={onSetFontSize}
        onFontFamily={onSetFontFamily}
        onColor={onColor}
        onHighlight={onHighlight}
        onAlign={onAlign}
        onQuote={onQuote}
        onHr={onHr}
        onUndo={onUndo}
        onRedo={onRedo}
        onClearFormat={onClearFormat}
        onImage={onAddImage}
        onLink={onAddLink}
      />
    </div>
  );
}

function safeState(cmd) {
  try { return document.queryCommandState(cmd); } catch (_) { return false; }
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const headerBtn = {
  all: "unset", cursor: "pointer", flexShrink: 0,
  width: 24, height: 24, borderRadius: 5,
  display: "grid", placeItems: "center",
  fontSize: 14, color: "var(--ink)",
  background: "rgba(255,255,255,0.7)", border: "1px solid var(--ink-soft)",
};

// ---- 네이버 스마트에디터 풍 툴바 ----
const HEADING_ITEMS = [
  ["p",  "memo.hBody", 15, 400],
  ["h1", "memo.h1",    20, 700],
  ["h2", "memo.h2",    17, 700],
  ["h3", "memo.h3",    15, 700],
];
const FONT_ITEMS = [
  ["Gaegu, Caveat, cursive",            "memo.fontHand"],
  ["Georgia, 'Noto Serif KR', serif",   "memo.fontSerif"],
  ["'Space Mono', monospace",           "memo.fontMono"],
  ["system-ui, -apple-system, sans-serif", "memo.fontSans"],
];
const SIZE_STEPS = [10, 11, 12, 13, 14, 16, 18, 22, 28];

function EditorToolbar({ active, onCmd, onHeading, onFontSize, onFontFamily, onColor, onHighlight, onAlign, onQuote, onHr, onUndo, onRedo, onClearFormat, onImage, onLink }) {
  const [openPanel, setOpenPanel] = useState(null);
  const [lastColor, setLastColor] = useState("#e25555");
  const [lastHighlight, setLastHighlight] = useState("#fff8c8");
  const [sizeIdx, setSizeIdx] = useState(2); // 12 (본문 기본 크기)
  const fileRef = useRef(null);
  const togglePanel = (key) => setOpenPanel(p => p === key ? null : key);

  const sizeStep = (delta) => {
    const next = Math.min(SIZE_STEPS.length - 1, Math.max(0, sizeIdx + delta));
    if (next === sizeIdx) return;
    setSizeIdx(next);
    onFontSize(SIZE_STEPS[next]);
  };

  const headingLabel = (() => {
    const item = HEADING_ITEMS.find(h => h[0] === active.heading);
    return item ? L(item[1]) : L("memo.hBody");
  })();

  return (
    <div style={{
      flexShrink: 0,
      padding: "6px 8px 8px",
      background: "linear-gradient(180deg, #f4f7fb 0%, #ffffff 100%)",
      borderTop: "1px solid #e4e8ee",
      display: "flex", flexDirection: "column", gap: 5,
    }}>
      {/* 1줄: 글자 서식 */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "nowrap", overflow: "hidden" }}>
        <DropBtn label={headingLabel} title={L("memo.heading")} open={openPanel === "heading"} onClick={() => togglePanel("heading")} minWidth={38} />
        <DropBtn label="" title={L("memo.font")} open={openPanel === "font"} onClick={() => togglePanel("font")} icon="가" />
        <SizeStepper value={SIZE_STEPS[sizeIdx]} onDown={() => sizeStep(-1)} onUp={() => sizeStep(1)} />
        <ToolDivider />
        <TBtn active={active.bold}      title={L("memo.bold")}      onClick={() => onCmd("bold")}><b style={{ fontFamily: "serif" }}>B</b></TBtn>
        <TBtn active={active.italic}    title={L("memo.italic")}    onClick={() => onCmd("italic")}><i style={{ fontFamily: "serif" }}>I</i></TBtn>
        <TBtn active={active.underline} title={L("memo.underline")} onClick={() => onCmd("underline")}><u style={{ fontFamily: "serif" }}>U</u></TBtn>
        <TBtn active={active.strike}    title={L("memo.strike")}    onClick={() => onCmd("strikeThrough")}><s style={{ fontFamily: "serif" }}>S</s></TBtn>
        <ToolDivider />
        <SwatchBtn color={lastColor} title={L("memo.color")} open={openPanel === "color"}
          onClick={() => togglePanel("color")}>가</SwatchBtn>
        <SwatchBtn color={lastHighlight} title={L("memo.highlight")} open={openPanel === "highlight"}
          onClick={() => togglePanel("highlight")} highlight>🖍</SwatchBtn>
      </div>

      {/* 2줄: 단락 + 삽입 */}
      <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "nowrap", overflow: "hidden" }}>
        <TBtn active={active.alignLeft}   title={L("memo.alignLeft")}   onClick={() => onAlign("Left")}><AlignIcon dir="L" /></TBtn>
        <TBtn active={active.alignCenter} title={L("memo.alignCenter")} onClick={() => onAlign("Center")}><AlignIcon dir="C" /></TBtn>
        <TBtn active={active.alignRight}  title={L("memo.alignRight")}  onClick={() => onAlign("Right")}><AlignIcon dir="R" /></TBtn>
        <ToolDivider />
        <TBtn active={active.bullet} title={L("memo.bullet")} onClick={() => onCmd("insertUnorderedList")}><BulletIcon /></TBtn>
        <TBtn active={active.number} title={L("memo.number")} onClick={() => onCmd("insertOrderedList")}><NumberIcon /></TBtn>
        <ToolDivider />
        <TBtn active={active.heading === "blockquote"} title={L("memo.quote")} onClick={onQuote}><span style={{ fontFamily: "Georgia, serif", fontSize: 14, fontWeight: 700 }}>"</span></TBtn>
        <TBtn title={L("memo.hr")} onClick={onHr}><HrIcon /></TBtn>
        <ToolDivider />
        <TBtn title={L("memo.link")} onClick={onLink}><span style={{ fontSize: 11 }}>🔗</span></TBtn>
        <TBtn title={L("memo.image")} onClick={() => fileRef.current?.click()}><span style={{ fontSize: 11 }}>🖼</span></TBtn>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
          onChange={(e) => { onImage(e.target.files?.[0]); e.target.value = ""; }} />
        <ToolDivider />
        <TBtn title={L("memo.clearFormat")} onClick={onClearFormat}><span style={{ fontSize: 11 }}>↺</span></TBtn>
      </div>

      {/* 펼침 패널 */}
      {openPanel === "heading" && (
        <PanelWrap>
          {HEADING_ITEMS.map(([tag, key, size, weight]) => (
            <button key={tag}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onHeading(tag); setOpenPanel(null); }}
              style={{ ...pillBtn, fontSize: Math.min(size, 14), fontWeight: weight,
                background: active.heading === tag ? "var(--hi)" : "var(--paper)" }}>
              {L(key)}
            </button>
          ))}
        </PanelWrap>
      )}
      {openPanel === "font" && (
        <PanelWrap>
          {FONT_ITEMS.map(([family, key]) => (
            <button key={family}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onFontFamily(family); setOpenPanel(null); }}
              style={{ ...pillBtn, fontFamily: family, fontSize: 13 }}>{L(key)}</button>
          ))}
        </PanelWrap>
      )}
      {openPanel === "color" && (
        <ColorPanel onPick={(c) => { onColor(c); setLastColor(c); setOpenPanel(null); }} />
      )}
      {openPanel === "highlight" && (
        <ColorPanel highlight onPick={(c) => { onHighlight(c); setLastHighlight(c); setOpenPanel(null); }} />
      )}
    </div>
  );
}

function PanelWrap({ children }) {
  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 4,
      padding: "6px 8px",
      background: "#ffffff",
      border: "1px solid #e4e8ee", borderRadius: 6,
      boxShadow: "0 1px 2px rgba(40,51,63,0.06)",
    }}>{children}</div>
  );
}

function SizeStepper({ value, onDown, onUp }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "stretch", height: 24, flexShrink: 0,
      border: "1px solid #cdd5df", borderRadius: 4, overflow: "hidden",
      background: "linear-gradient(180deg, #ffffff 0%, #f3f6fa 100%)",
    }}>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onDown} title={L("memo.sizeDown")} style={stepBtn}>‹</button>
      <span style={{
        padding: "0 5px", display: "grid", placeItems: "center",
        fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink)",
        borderLeft: "1px solid #e4e8ee", borderRight: "1px solid #e4e8ee",
        minWidth: 18, background: "#ffffff",
      }}>{value}</span>
      <button onMouseDown={(e) => e.preventDefault()} onClick={onUp} title={L("memo.sizeUp")} style={stepBtn}>›</button>
    </span>
  );
}

const stepBtn = {
  all: "unset", cursor: "pointer",
  width: 14, display: "grid", placeItems: "center",
  fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-2)",
};

function DropBtn({ label, title, icon, open, onClick, minWidth }) {
  return (
    <button onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title} style={{
      all: "unset", cursor: "pointer", flexShrink: 0,
      display: "inline-flex", alignItems: "center", gap: 2,
      padding: "0 5px", height: 24, borderRadius: 4,
      minWidth: minWidth || 0,
      border: "1px solid #cdd5df",
      background: open
        ? "linear-gradient(180deg, var(--point-soft), var(--point))"
        : "linear-gradient(180deg, #ffffff 0%, #f3f6fa 100%)",
      fontFamily: "var(--hand)", fontSize: 11.5, color: "var(--ink)",
      whiteSpace: "nowrap",
    }}>
      {icon && <span style={{ fontWeight: 700, color: "#333" }}>{icon}</span>}
      {label && <span style={{ flex: 1, textAlign: "left" }}>{label}</span>}
      <span style={{ fontSize: 8, color: "#777" }}>▾</span>
    </button>
  );
}

// 단일 컴팩트 버튼 — 클릭 시 팔레트 펼침. 마지막 사용 색을 작은 띠로 표시.
function SwatchBtn({ color, title, open, onClick, highlight, children }) {
  return (
    <button onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title} style={{
      all: "unset", cursor: "pointer",
      width: 28, height: 24, borderRadius: 4,
      border: "1px solid #cdd5df",
      background: open
        ? "linear-gradient(180deg, var(--point-soft), var(--point))"
        : "linear-gradient(180deg, #ffffff 0%, #f3f6fa 100%)",
      display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
    }}>
      <span style={{ fontFamily: "var(--hand)", fontSize: 10.5, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>
        {children}
      </span>
      <span style={{
        width: 16, height: 2.5, borderRadius: 1,
        background: color === "transparent"
          ? "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 4px 4px"
          : color,
        border: highlight ? "1px solid rgba(0,0,0,0.08)" : "none",
      }} />
    </button>
  );
}

// ---- 정렬 / 리스트 / hr 아이콘 (CSS) ----
function AlignIcon({ dir }) {
  const rows = [
    { w: 13 }, { w: 9 }, { w: 13 }, { w: 7 },
  ];
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 1.5, width: 14 }}>
      {rows.map((r, i) => {
        let ml = 0;
        if (dir === "C") ml = (13 - r.w) / 2;
        else if (dir === "R") ml = 13 - r.w;
        return <span key={i} style={{ width: r.w, height: 1.6, background: "currentColor", marginLeft: ml, borderRadius: 0.5 }} />;
      })}
    </span>
  );
}
function BulletIcon() {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 2, width: 14 }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
          <span style={{ width: 3, height: 3, borderRadius: "50%", background: "currentColor" }} />
          <span style={{ flex: 1, height: 1.5, background: "currentColor", borderRadius: 0.5 }} />
        </span>
      ))}
    </span>
  );
}
function NumberIcon() {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 1, width: 14 }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
          <span style={{ fontSize: 7, fontFamily: "var(--mono)", lineHeight: 1, color: "currentColor", width: 5 }}>{i}.</span>
          <span style={{ flex: 1, height: 1.3, background: "currentColor", borderRadius: 0.5 }} />
        </span>
      ))}
    </span>
  );
}
function HrIcon() {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 1.5, width: 14, alignItems: "center" }}>
      <span style={{ width: 14, height: 1.3, background: "currentColor", opacity: 0.3 }} />
      <span style={{ width: 14, height: 1.6, background: "currentColor" }} />
      <span style={{ width: 14, height: 1.3, background: "currentColor", opacity: 0.3 }} />
    </span>
  );
}

const COLOR_PALETTE = [
  "#222222", "#666666", "#aaaaaa",
  "#e25555", "#e2954b", "#e0c83b",
  "#5fb56a", "#3aa0d0", "#5b6fc8", "#a05bc8",
];
const HIGHLIGHT_PALETTE = [
  "transparent", "#fff8c8", "#fde2e7", "#e0f4d8",
  "#d9ecfb", "#ece4f9", "#ffe7c8", "#dff5f1",
];

function ColorPanel({ highlight, onPick }) {
  const palette = highlight ? HIGHLIGHT_PALETTE : COLOR_PALETTE;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
      {palette.map(c => (
        <button key={c} onClick={() => onPick(c)} title={c} style={{
          all: "unset", cursor: "pointer",
          width: 22, height: 22, borderRadius: 4,
          background: c === "transparent"
            ? "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 8px 8px"
            : c,
          border: "1px solid var(--ink)",
        }} />
      ))}
      <label style={{
        cursor: "pointer", width: 22, height: 22, borderRadius: 4,
        display: "grid", placeItems: "center",
        background: "conic-gradient(from 0deg, #ff5e5e, #ffe14d, #6dff6d, #4de1ff, #6d6dff, #ff5edb, #ff5e5e)",
        position: "relative", overflow: "hidden", border: "1px dashed var(--ink)",
      }}>
        <span style={{ fontSize: 10, color: "#fff", textShadow: "0 0 2px rgba(0,0,0,.7)", fontWeight: 700 }}>＋</span>
        <input type="color"
          onChange={(e) => onPick(e.target.value)}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", border: "none", padding: 0 }} />
      </label>
    </div>
  );
}

function TBtn({ title, active, onClick, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      className="memo-tbtn"
      style={{
        all: "unset", cursor: "pointer", flexShrink: 0,
        minWidth: 22, height: 24, padding: "0 3px", borderRadius: 4,
        display: "grid", placeItems: "center",
        background: active
          ? "linear-gradient(180deg, var(--point-soft), var(--point))"
          : (hover ? "#eef2f7" : "transparent"),
        border: active ? "1px solid #aab2bc" : "1px solid transparent",
        boxShadow: active ? "inset 0 1px 2px rgba(0,0,0,0.06)" : "none",
        fontSize: 12.5, color: "#333",
        fontFamily: "var(--hand)",
      }}
    >{children}</button>
  );
}

function ToolDivider() {
  return <span style={{ width: 1, height: 16, background: "#d8dee5", margin: "0 2px", flexShrink: 0 }} />;
}

const pillBtn = {
  all: "unset", cursor: "pointer",
  padding: "3px 10px", borderRadius: 99,
  border: "1px solid var(--ink-soft)",
  background: "var(--paper)",
  fontFamily: "var(--hand)", fontSize: 12, color: "var(--ink)",
  display: "inline-flex", alignItems: "center",
};

function relativeTime(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!t || isNaN(t)) return "";
  const diff = Date.now() - t;
  const lang = (window.i18n && window.i18n.get && window.i18n.get()) || "ko";
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  const D = {
    ko: { now: "방금", min: (n) => `${n}분 전`, hr: (n) => `${n}시간 전`, yest: "어제" },
    en: { now: "just now", min: (n) => `${n}m ago`, hr: (n) => `${n}h ago`, yest: "yesterday" },
    zh: { now: "刚刚", min: (n) => `${n}分钟前`, hr: (n) => `${n}小时前`, yest: "昨天" },
    ja: { now: "たった今", min: (n) => `${n}分前`, hr: (n) => `${n}時間前`, yest: "昨日" },
  }[lang] || { now: "now", min: (n) => `${n}m`, hr: (n) => `${n}h`, yest: "yesterday" };
  if (min < 1) return D.now;
  if (min < 60) return D.min(min);
  if (hr < 24) return D.hr(hr);
  if (day === 1) return D.yest;
  const d = new Date(t);
  const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return (window.i18n && window.i18n.fmtDate) ? window.i18n.fmtDate(ymd) : ymd;
}

// contenteditable placeholder + 기본 스타일 CSS 한 번 주입
if (typeof document !== "undefined" && !document.getElementById("memo-editor-css")) {
  const s = document.createElement("style");
  s.id = "memo-editor-css";
  s.textContent = `
    .memo-editor img { max-width: 100%; height: auto; }
    .memo-editor a { color: #3a72b7; text-decoration: underline; }
    .memo-editor ul, .memo-editor ol { margin: 4px 0; padding-left: 22px; }
    .memo-editor blockquote {
      margin: 6px 0; padding: 4px 10px;
      border-left: 3px solid #c6d2e0; color: #555;
    }
    .memo-editor h1 { font-size: 17px; font-weight: 700; margin: 7px 0 3px; line-height: 1.4; }
    .memo-editor h2 { font-size: 14px; font-weight: 700; margin: 5px 0 3px; line-height: 1.4; }
    .memo-editor h3 { font-size: 12.5px; font-weight: 700; margin: 4px 0 2px; line-height: 1.4; }
    .memo-editor p, .memo-editor div { margin: 0; }
  `;
  document.head.appendChild(s);
}

window.MemoView = MemoView;

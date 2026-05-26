/* global React */
// ===========================================================
// 바이브 다이어리 — 데이터 레이어
// localStorage 한 키에 전체 상태를 JSON으로 저장.
// useDiary() 훅 하나로 모든 컴포넌트가 동일한 상태를 공유.
// Electron/Tauri로 래핑해도 그대로 동작 (저장 경로만 바꾸면 됨).
// ===========================================================

const STORAGE_KEY = "vibe-diary.v1";

// ---- 유틸 ----
const uid = () => Math.random().toString(36).slice(2, 10);
const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};
const fmtKDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = ["일","월","화","수","목","금","토"][new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${dow})`;
};
const fmtKDateShort = (iso) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
};
function memoEscapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function memoBodyToHtml(body) {
  return (body || "").split(/\r?\n/).map(line => `<div>${memoEscapeHtml(line) || "<br>"}</div>`).join("");
}
function memoMessagesToHtml(messages) {
  return (messages || []).map(m => {
    if (m.type === "text") {
      const style = [];
      if (m.color && m.color !== "#222222" && m.color !== "#222") style.push(`color:${m.color}`);
      if (m.fontSize === "small") style.push("font-size:12px");
      else if (m.fontSize === "large") style.push("font-size:18px");
      if (m.fontFamily === "mono") style.push("font-family:var(--mono),monospace");
      else if (m.fontFamily === "serif") style.push("font-family:Georgia,serif");
      const text = memoEscapeHtml(m.text || "").replace(/\n/g, "<br>");
      return style.length
        ? `<div><span style="${style.join(";")}">${text || "<br>"}</span></div>`
        : `<div>${text || "<br>"}</div>`;
    }
    if (m.type === "image") return `<div><img src="${m.imageUrl}" style="max-width:100%;"/></div>`;
    if (m.type === "link") return `<div><a href="${memoEscapeHtml(m.linkUrl)}">${memoEscapeHtml(m.linkLabel || m.linkUrl)}</a></div>`;
    return "";
  }).join("");
}
function memoTitleFromHtml(html) {
  if (!html) return "";
  // 태그 제거 → textContent 추출
  let text = "";
  try {
    if (typeof document !== "undefined") {
      const tmp = document.createElement("div");
      tmp.innerHTML = html;
      text = tmp.textContent || "";
    } else {
      text = String(html).replace(/<[^>]+>/g, " ");
    }
  } catch (_) {
    text = String(html).replace(/<[^>]+>/g, " ");
  }
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (t) return t.slice(0, 60);
  }
  if (/<img/i.test(html)) return "🖼 이미지";
  if (/<a /i.test(html)) return "🔗 링크";
  return "";
}
// 메모 아이콘 — 도트 스프라이트 인덱스 (Sprite-0002.png, 6x4=24).
// 문자열이 아니라 숫자(0..23). 표시는 <SpriteIcon idx={...} /> 로.
const MEMO_ICONS = Array.from({ length: 24 }, (_, i) => i);
const randomMemoIcon = () => MEMO_ICONS[Math.floor(Math.random() * MEMO_ICONS.length)];

// ---- 초기 시드 ----
// 첫 실행 시엔 예시 데이터 없이 빈 상태로 시작한다.
// (사용 가능하도록 빈 시작 프로젝트 하나만 둠)
function seed() {
  const pid1 = uid();
  const t = today();
  return {
    schemaVersion: 1,
    currentProjectId: pid1,
    projects: [
      {
        id: pid1,
        name: "내 프로젝트",
        path: "",
        stack: [],
        links: [],
        gitBranch: "main",
        repoUrl: "",
        version: "0.1.0",
        nextVersion: "",
        cheatsheet: "",
        status: "active",
        createdAt: t,
      },
    ],
    todos: [],
    recurrences: [],
    lastGenDate: t,
    prompts: [],
    emails: [],
    aiBookmarks: [],
    commands: [],
    retros: [],
    playlist: [],
    dday: { date: "", label: "디데이" },
    mailUrl: "",
    notes: {},
    weekNotes: {},
    replyPresets: [],
    memos: [],
    selectedDate: t,
    stuck: {},
    timer: {
      lengthMin: 30,   // 한 사이클 분
      enabled: true,
      cycleStartedAt: null,        // Date.now() — null이면 아직 안 시작
      paused: false,
      pausedRemainingMs: null,     // 일시정지 시 남은 시간 보존
      notificationsGranted: false,
      lastNotifiedAt: null,        // 알림 중복 발송 방지
    },
    workSessions: [],
  };
}

// ---- 저장 / 불러오기 ----
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed();
    const data = JSON.parse(raw);
    if (!data || data.schemaVersion !== 1) return seed();
    // ---- 마이그레이션 (필드 추가에 안전) ----
    data.commands    ??= [];
    data.todos       ??= [];
    data.recurrences ??= [];
    data.lastGenDate ??= today();
    data.prompts     ??= [];
    data.emails      ??= [];
    data.aiBookmarks ??= [];
    data.retros      ??= [];
    data.playlist    ??= [];
    data.dday        ??= { date: "", label: "디데이" };
    data.mailUrl     ??= "";
    data.notes       ??= {};
    data.weekNotes   ??= {};
    data.replyPresets ??= [];
    data.memos       ??= [];
    // 기존 메모를 단일 html 본문으로 통합. body → html, messages → html.
    data.memos = data.memos.map(m => {
      // icon: 숫자 인덱스(0..23). 기존 문자열 이모지는 마이그레이션 시 랜덤 도트로 교체.
      const next = { ...m, icon: (typeof m.icon === "number" ? m.icon : randomMemoIcon()) };
      if (typeof next.html !== "string") next.html = "";
      if (!next.html && Array.isArray(next.messages) && next.messages.length > 0) {
        next.html = memoMessagesToHtml(next.messages);
      }
      if (!next.html && (next.body || "").trim()) {
        next.html = memoBodyToHtml(next.body);
      }
      // body는 비워둠 (messages는 보존 — 데이터 보안용으로 일단 남김)
      next.body = "";
      const inferredTitle = memoTitleFromHtml(next.html);
      if (!next.title) next.title = inferredTitle;
      next.manualTitle = next.manualTitle ?? (!!String(next.title || "").trim() && next.title !== inferredTitle);
      return next;
    });
    data.selectedDate = today();   // 시작 시 항상 오늘
    data.stuck       ??= {};
    // 메일에 body/draft/platformUrl 보강
    data.emails = (data.emails ?? []).map(e => ({ body: "", draft: "", platformUrl: "", ...e }));
    // 할 일 스키마 마이그레이션 (text→title, hot→pinned, doneTs→completedAt 등)
    data.todos = (data.todos ?? []).map((t, i) => ({
      id: t.id,
      projectId: t.projectId,
      title: t.title ?? t.text ?? "",
      pinned: t.pinned ?? !!t.hot ?? false,
      pinnedAt: t.pinnedAt ?? null,
      dueDate: t.dueDate ?? null,
      startDate: t.startDate ?? null,
      endDate: t.endDate ?? null,
      order: t.order ?? i,
      done: !!t.done,
      completedAt: t.completedAt ?? (t.doneTs ? new Date(t.doneTs).toISOString() : (t.doneAt ? t.doneAt + "T12:00:00" : null)),
      recurrenceId: t.recurrenceId ?? null,
      trackedSeconds: t.trackedSeconds ?? 0,
      createdAt: t.createdAt ?? today(),
    }));
    data.timer       ??= { lengthMin: 30, enabled: true, cycleStartedAt: null, paused: false, pausedRemainingMs: null, notificationsGranted: false, lastNotifiedAt: null };
    data.workSessions ??= [];
    // 프로젝트에 버전/저장소 필드 보강 (기존 값 우선)
    data.projects = (data.projects ?? []).map(p => ({
      repoUrl: "", version: "0.1.0", nextVersion: "", ...p,
    }));
    return data;
  } catch (e) {
    console.warn("diary: load failed, reseeding", e);
    return seed();
  }
}
function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("diary: save failed", e);
  }
}

// ---- 글로벌 상태 (간단한 pub/sub) ----
let _state = load();
const _subs = new Set();
function setState(updater) {
  const next = typeof updater === "function" ? updater(_state) : updater;
  _state = next;
  save(_state);
  _subs.forEach(fn => fn(_state));
}
function getState() { return _state; }
function subscribe(fn) { _subs.add(fn); return () => _subs.delete(fn); }

// ---- 액션들 ----
const actions = {
  // ----- 프로젝트 -----
  switchProject(id) {
    setState(s => ({ ...s, currentProjectId: id }));
  },
  addProject({ name, path = "", stack = [], gitBranch = "main", cheatsheet = "" }) {
    const id = uid();
    setState(s => ({
      ...s,
      projects: [...s.projects, {
        id, name, path, stack, links: [],
        gitBranch, repoUrl: "", version: "0.1.0", nextVersion: "",
        cheatsheet, status: "active", createdAt: today(),
      }],
      currentProjectId: id,
    }));
  },
  updateProject(id, patch) {
    setState(s => ({
      ...s,
      projects: s.projects.map(p => p.id === id ? { ...p, ...patch } : p),
    }));
  },
  removeProject(id) {
    setState(s => {
      const remaining = s.projects.filter(p => p.id !== id);
      return {
        ...s,
        projects: remaining,
        currentProjectId: s.currentProjectId === id
          ? (remaining[0]?.id ?? null)
          : s.currentProjectId,
      };
    });
  },

  // ----- 할 일 -----
  addTodo(title, opts = {}) {
    if (!title?.trim()) return;
    setState(s => {
      const myTodos = s.todos.filter(t => t.projectId === s.currentProjectId);
      const nextOrder = myTodos.reduce((m, t) => Math.max(m, t.order ?? 0), -1) + 1;
      return {
        ...s,
        todos: [...s.todos, {
          id: uid(), projectId: s.currentProjectId,
          title: title.trim(),
          pinned: !!opts.pinned, pinnedAt: opts.pinned ? Date.now() : null,
          dueDate: opts.dueDate ?? null,
          startDate: opts.startDate ?? null,
          endDate: opts.endDate ?? null,
          order: nextOrder,
          done: false, completedAt: null,
          recurrenceId: opts.recurrenceId ?? null,
          trackedSeconds: 0,
          createdAt: today(),
        }],
      };
    });
  },
  toggleTodo(id) {
    setState(s => ({
      ...s,
      todos: s.todos.map(t => t.id === id
        ? { ...t, done: !t.done, completedAt: !t.done ? new Date().toISOString() : null }
        : t),
    }));
  },
  togglePin(id) {
    setState(s => ({
      ...s,
      todos: s.todos.map(t => t.id === id
        ? { ...t, pinned: !t.pinned, pinnedAt: !t.pinned ? Date.now() : null }
        : t),
    }));
  },
  setTodoDue(id, date) {
    setState(s => ({ ...s, todos: s.todos.map(t => t.id === id ? { ...t, dueDate: date || null } : t) }));
  },
  setTodoPeriod(id, startDate, endDate) {
    setState(s => ({
      ...s,
      todos: s.todos.map(t => t.id === id ? {
        ...t,
        startDate: startDate || null,
        endDate: endDate || null,
      } : t),
    }));
  },
  updateTodo(id, patch) {
    setState(s => ({ ...s, todos: s.todos.map(t => t.id === id ? { ...t, ...patch } : t) }));
  },
  reorderTodoBefore(fromId, beforeId) {
    if (fromId === beforeId) return;
    setState(s => {
      const my = s.todos.filter(t => t.projectId === s.currentProjectId)
        .slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const fromIdx = my.findIndex(t => t.id === fromId);
      if (fromIdx < 0) return s;
      const [moved] = my.splice(fromIdx, 1);
      let beforeIdx = beforeId ? my.findIndex(t => t.id === beforeId) : my.length;
      if (beforeIdx < 0) beforeIdx = my.length;
      my.splice(beforeIdx, 0, moved);
      const newOrder = {};
      my.forEach((t, i) => { newOrder[t.id] = i; });
      return { ...s, todos: s.todos.map(t => t.projectId === s.currentProjectId ? { ...t, order: newOrder[t.id] ?? t.order } : t) };
    });
  },
  autoSortTodos() {
    setState(s => {
      const my = s.todos.filter(t => t.projectId === s.currentProjectId && !t.done && !t.pinned).slice();
      my.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return (a.order ?? 0) - (b.order ?? 0);
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
      const newOrder = {};
      my.forEach((t, i) => { newOrder[t.id] = i; });
      return { ...s, todos: s.todos.map(t => newOrder[t.id] != null ? { ...t, order: newOrder[t.id] } : t) };
    });
  },
  removeTodo(id) {
    setState(s => ({ ...s, todos: s.todos.filter(t => t.id !== id) }));
  },

  // ----- 반복 (템플릿) -----
  addRecurrence({ title, frequency, weeklyDays = [] }) {
    const id = uid();
    setState(s => ({
      ...s,
      recurrences: [...(s.recurrences ?? []), {
        id, projectId: s.currentProjectId,
        title: title.trim(), frequency, weeklyDays, active: true,
        createdAt: today(),
      }],
    }));
    return id;
  },
  updateRecurrence(id, patch) {
    setState(s => ({ ...s, recurrences: (s.recurrences ?? []).map(r => r.id === id ? { ...r, ...patch } : r) }));
  },
  removeRecurrence(id) {
    setState(s => ({
      ...s,
      recurrences: (s.recurrences ?? []).filter(r => r.id !== id),
      // 연결된 할 일은 recurrenceId 만 끊고 본체는 유지
      todos: s.todos.map(t => t.recurrenceId === id ? { ...t, recurrenceId: null } : t),
    }));
  },
  // 오늘 생성돼야 할 반복 인스턴스를 만든다. 중복 생성 방지: (rule.id + dueDate=today) 조합 검사.
  generateRecurrences() {
    setState(s => {
      const t = today();
      const dow = new Date(t + "T00:00:00").getDay();   // 0=일 .. 6=토
      const rules = (s.recurrences ?? []).filter(r => r.active);
      const newTodos = [];
      const orderMap = {};
      // 프로젝트별 현재 최대 order
      for (const r of rules) {
        const matches =
          r.frequency === "daily" ? true
          : r.frequency === "weekdays" ? (dow >= 1 && dow <= 5)
          : r.frequency === "weekly" ? (r.weeklyDays || []).includes(dow)
          : false;
        if (!matches) continue;
        const exists = s.todos.some(td => td.recurrenceId === r.id && td.dueDate === t && td.projectId === r.projectId);
        if (exists) continue;
        if (orderMap[r.projectId] == null) {
          orderMap[r.projectId] = s.todos.filter(td => td.projectId === r.projectId).reduce((m, td) => Math.max(m, td.order ?? 0), -1);
        }
        orderMap[r.projectId] += 1;
        newTodos.push({
          id: uid(), projectId: r.projectId,
          title: r.title, pinned: false, pinnedAt: null,
          dueDate: t, startDate: null, endDate: null, order: orderMap[r.projectId],
          done: false, completedAt: null,
          recurrenceId: r.id, trackedSeconds: 0,
          createdAt: t,
        });
      }
      if (!newTodos.length && s.lastGenDate === t) return s;
      return { ...s, todos: [...s.todos, ...newTodos], lastGenDate: t };
    });
  },

  // ----- 프롬프트 -----
  addPrompt(text) {
    if (!text?.trim()) return;
    setState(s => ({
      ...s,
      prompts: [{ id: uid(), text: text.trim(), uses: 0, createdAt: today() }, ...s.prompts],
    }));
  },
  updatePrompt(id, text) {
    setState(s => ({
      ...s,
      prompts: s.prompts.map(p => p.id === id ? { ...p, text } : p),
    }));
  },
  removePrompt(id) {
    setState(s => ({ ...s, prompts: s.prompts.filter(p => p.id !== id) }));
  },
  copyPrompt(id) {
    setState(s => ({
      ...s,
      prompts: s.prompts.map(p => p.id === id ? { ...p, uses: (p.uses ?? 0) + 1 } : p),
    }));
    const p = getState().prompts.find(x => x.id === id);
    if (p && navigator.clipboard) navigator.clipboard.writeText(p.text).catch(() => {});
  },

  // ----- 이메일 -----
  addEmail({ who, subject, preview = "", hot = false }) {
    if (!who?.trim() || !subject?.trim()) return;
    setState(s => ({
      ...s,
      emails: [
        { id: uid(), who: who.trim(), subject: subject.trim(), preview: preview.trim(),
          time: "방금", replied: false, hot, createdAt: today() },
        ...s.emails,
      ],
    }));
  },
  // 받은 메일 붙여넣기 (문의함)
  addInquiry({ from = "", subject = "", body = "" }) {
    if (!body.trim() && !subject.trim()) return;
    setState(s => ({
      ...s,
      emails: [
        { id: uid(), who: from.trim() || "문의", subject: subject.trim(),
          preview: "", body: body.trim(), draft: "", platformUrl: "",
          time: "방금", replied: false, hot: false, createdAt: today(), ts: Date.now() },
        ...s.emails,
      ],
    }));
  },
  updateEmail(id, patch) {
    setState(s => ({
      ...s,
      emails: s.emails.map(e => e.id === id ? { ...e, ...patch } : e),
    }));
  },
  setMailUrl(url) {
    setState(s => ({ ...s, mailUrl: url }));
  },
  toggleReplied(id) {
    setState(s => ({
      ...s,
      emails: s.emails.map(e => e.id === id ? { ...e, replied: !e.replied } : e),
    }));
  },
  removeEmail(id) {
    setState(s => ({ ...s, emails: s.emails.filter(e => e.id !== id) }));
  },

  // ----- AI 북마크 -----
  addBookmark({ title, ok = true, note = "" }) {
    if (!title?.trim()) return;
    setState(s => ({
      ...s,
      aiBookmarks: [
        { id: uid(), projectId: s.currentProjectId, date: today(),
          title: title.trim(), ok, note: note.trim() },
        ...s.aiBookmarks,
      ],
    }));
  },
  updateBookmark(id, patch) {
    setState(s => ({
      ...s,
      aiBookmarks: s.aiBookmarks.map(b => b.id === id ? { ...b, ...patch } : b),
    }));
  },
  removeBookmark(id) {
    setState(s => ({ ...s, aiBookmarks: s.aiBookmarks.filter(b => b.id !== id) }));
  },

  // ----- 명령어 치트 -----
  addCommand({ label = "", code = "" }) {
    if (!code?.trim()) return;
    setState(s => ({
      ...s,
      commands: [
        { id: uid(), projectId: s.currentProjectId,
          label: label.trim(), code: code.trim(),
          uses: 0, createdAt: today() },
        ...s.commands,
      ],
    }));
  },
  updateCommand(id, patch) {
    setState(s => ({
      ...s,
      commands: s.commands.map(c => c.id === id ? { ...c, ...patch } : c),
    }));
  },
  removeCommand(id) {
    setState(s => ({ ...s, commands: s.commands.filter(c => c.id !== id) }));
  },
  copyCommand(id) {
    setState(s => ({
      ...s,
      commands: s.commands.map(c => c.id === id ? { ...c, uses: (c.uses ?? 0) + 1 } : c),
    }));
    const c = getState().commands.find(x => x.id === id);
    if (c && navigator.clipboard) navigator.clipboard.writeText(c.code).catch(() => {});
  },

  // ----- 메모 (단일 html 본문) -----
  addMemo({ html = "", icon } = {}) {
    const id = uid();
    const now = new Date().toISOString();
    setState(s => ({
      ...s,
      memos: [
        { id, projectId: s.currentProjectId,
          title: memoTitleFromHtml(html), html, manualTitle: false,
          icon: icon || randomMemoIcon(),
          createdAt: now, updatedAt: now },
        ...(s.memos ?? []),
      ],
    }));
    return id;
  },
  updateMemo(id, patch) {
    setState(s => ({
      ...s,
      memos: (s.memos ?? []).map(m => {
        if (m.id !== id) return m;
        const touchesContent = "html" in patch || "title" in patch;
        const next = { ...m, ...patch };
        if (touchesContent) next.updatedAt = new Date().toISOString();
        if ("title" in patch) next.manualTitle = true;
        if (!next.manualTitle && !("title" in patch) && "html" in patch) next.title = memoTitleFromHtml(next.html);
        return next;
      }),
    }));
  },
  removeMemo(id) {
    setState(s => ({ ...s, memos: (s.memos ?? []).filter(m => m.id !== id) }));
  },

  // ----- 회고 (날짜별 1개) -----
  saveRetro({ date = today(), text = "", good = "", bad = "" }) {
    setState(s => {
      const others = s.retros.filter(r => r.date !== date);
      // 모두 비었으면 삭제
      if (!text.trim() && !good.trim() && !bad.trim()) {
        return { ...s, retros: others };
      }
      return {
        ...s,
        retros: [...others, { id: uid(), date, text, good, bad }]
                 .sort((a, b) => b.date.localeCompare(a.date)),
      };
    });
  },

  // ----- 플레이리스트 (유튜브) -----
  addTrack({ url, videoId, title = "" }) {
    if (!videoId) return;
    setState(s => ({
      ...s,
      playlist: [...(s.playlist ?? []), {
        id: uid(), url, videoId,
        title: title.trim() || "YouTube 트랙",
        createdAt: today(),
      }],
    }));
  },
  removeTrack(id) {
    setState(s => ({ ...s, playlist: (s.playlist ?? []).filter(t => t.id !== id) }));
  },

  // ----- 디데이 -----
  setDday(patch) {
    setState(s => ({ ...s, dday: { ...(s.dday ?? {}), ...patch } }));
  },

  // ----- 달력 메모/일기 (날짜별) -----
  setSelectedDate(date) {
    setState(s => ({ ...s, selectedDate: date }));
  },
  setNote(date, text) {
    setState(s => ({ ...s, notes: { ...s.notes, [date]: text } }));
  },
  appendNote(date, line) {
    if (!line?.trim()) return;
    setState(s => {
      const prev = s.notes[date] ?? "";
      return { ...s, notes: { ...s.notes, [date]: prev ? prev + "\n" + line.trim() : line.trim() } };
    });
  },

  // ----- 주간 노트 (월요일 기준) -----
  setWeekNote(monday, text) {
    setState(s => ({ ...s, weekNotes: { ...(s.weekNotes ?? {}), [monday]: text } }));
  },

  // ----- 빠른 답장 프리셋 -----
  addReplyPreset({ label = "", text = "" } = {}) {
    const id = uid();
    setState(s => ({
      ...s,
      replyPresets: [
        { id, label: label.trim(), text, createdAt: today() },
        ...(s.replyPresets ?? []),
      ],
    }));
    return id;
  },
  updateReplyPreset(id, patch) {
    setState(s => ({
      ...s,
      replyPresets: (s.replyPresets ?? []).map(p => p.id === id ? { ...p, ...patch } : p),
    }));
  },
  removeReplyPreset(id) {
    setState(s => ({ ...s, replyPresets: (s.replyPresets ?? []).filter(p => p.id !== id) }));
  },

  // ----- Stuck note -----
  setStuck(text) {
    setState(s => ({
      ...s,
      stuck: { ...s.stuck, [s.currentProjectId]: text },
    }));
  },

  // ----- 타이머 / 알림 -----
  setTimerLength(min) {
    setState(s => ({ ...s, timer: { ...s.timer, lengthMin: min } }));
  },
  setTimerEnabled(enabled) {
    setState(s => ({ ...s, timer: { ...s.timer, enabled } }));
  },
  startCycle() {
    setState(s => ({ ...s, timer: {
      ...s.timer,
      cycleStartedAt: Date.now(),
      paused: false,
      pausedRemainingMs: null,
    }}));
  },
  pauseCycle() {
    setState(s => {
      if (!s.timer.cycleStartedAt || s.timer.paused) return s;
      const lenMs = s.timer.lengthMin * 60 * 1000;
      const elapsed = Date.now() - s.timer.cycleStartedAt;
      const remaining = Math.max(0, lenMs - elapsed);
      return { ...s, timer: { ...s.timer, paused: true, pausedRemainingMs: remaining } };
    });
  },
  resumeCycle() {
    setState(s => {
      if (!s.timer.paused) return s;
      const lenMs = s.timer.lengthMin * 60 * 1000;
      const remaining = s.timer.pausedRemainingMs ?? lenMs;
      // 남은 시간이 이제부터 흐르도록 시작 시각을 보정
      const cycleStartedAt = Date.now() - (lenMs - remaining);
      return { ...s, timer: { ...s.timer, paused: false, cycleStartedAt, pausedRemainingMs: null } };
    });
  },
  markStretched() {
    // 이번 사이클 끊고 새 사이클 시작
    setState(s => ({ ...s, timer: {
      ...s.timer,
      cycleStartedAt: Date.now(),
      paused: false,
      pausedRemainingMs: null,
      lastNotifiedAt: null,
    }}));
  },
  markNotified() {
    setState(s => ({ ...s, timer: { ...s.timer, lastNotifiedAt: Date.now() } }));
  },
  setNotificationsGranted(g) {
    setState(s => ({ ...s, timer: { ...s.timer, notificationsGranted: g } }));
  },

  // ----- 작업 시간 트래킹 -----
  addWorkMinutes(min) {
    if (min <= 0) return;
    const t = today();
    setState(s => {
      const sessions = s.workSessions.slice();
      const idx = sessions.findIndex(w => w.date === t);
      if (idx >= 0) {
        sessions[idx] = { ...sessions[idx], minutes: sessions[idx].minutes + min };
      } else {
        sessions.push({ date: t, minutes: min });
      }
      return { ...s, workSessions: sessions };
    });
  },
  // 특정 날짜(기본: 오늘)의 작업 시간을 0으로 — 해당 항목을 통째로 제거.
  // ActivityTracker가 누적 중이던 초도 같이 비우라고 이벤트 발사.
  resetWorkMinutes(date) {
    const d = date || today();
    setState(s => ({
      ...s,
      workSessions: s.workSessions.filter(w => w.date !== d),
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("work-minutes-reset", { detail: { date: d } }));
    }
  },

  // ----- 위험: 리셋 -----
  async hardReset() {
    const msg = (window.i18n && window.i18n.t) ? window.i18n.t("set.resetConfirm") : "정말 모든 데이터를 지우고 초기 시드로 되돌릴까요?";
    const ok = await (window.dialog ? window.dialog.confirm(msg) : Promise.resolve(confirm(msg)));
    if (!ok) return;
    setState(seed());
  },
};

// ---- React 훅 ----
function useDiary() {
  const [, setTick] = React.useState(0);
  React.useEffect(() => subscribe(() => setTick(x => x + 1)), []);
  return { state: _state, actions };
}

// ---- 파생 셀렉터 ----
const select = {
  currentProject: (s) => s.projects.find(p => p.id === s.currentProjectId) ?? null,
  todosForCurrent: (s) => s.todos.filter(t => t.projectId === s.currentProjectId),
  bookmarksForCurrent: (s) => s.aiBookmarks.filter(b => b.projectId === s.currentProjectId),
  commandsForCurrent: (s) => (s.commands ?? []).filter(c => c.projectId === s.currentProjectId),
  memosForCurrent: (s) => (s.memos ?? [])
    .filter(m => m.projectId === s.currentProjectId)
    .slice()
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")),
  retroForDate: (s, date = today()) => s.retros.find(r => r.date === date) ?? null,
  stuckForCurrent: (s) => s.stuck[s.currentProjectId] ?? "",
  workMinutesToday: (s) => {
    const t = today();
    const sess = s.workSessions.find(w => w.date === t);
    return sess?.minutes ?? 0;
  },
};

// 글로벌 노출
window.diary = { useDiary, actions, select, today, fmtKDate, fmtKDateShort, getState, memoTitleFromHtml, MEMO_ICONS };

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

function projectFiles() {
  return execFileSync("rg", ["--files", "v2"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((file) => file.endsWith(".jsx"));
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

test("all JSX button blocks have a click path or submit semantics", () => {
  const missing = [];

  for (const file of projectFiles()) {
    const source = readFileSync(file, "utf8");
    const buttonRe = /<button\b[\s\S]*?<\/button>/g;
    let match;

    while ((match = buttonRe.exec(source))) {
      const block = match[0];
      const hasClickPath = /\bonClick\s*=/.test(block);
      const isSubmit = /\btype\s*=\s*["']submit["']/.test(block);
      if (!hasClickPath && !isSubmit) {
        missing.push(`${file}:${lineOf(source, match.index)}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});

test("all configured sidebar tabs resolve to a view component or settings/deco panel", () => {
  const dock = readFileSync(new URL("../v2/app/side-dock-v2.jsx", import.meta.url), "utf8");
  const tabsBlock = dock.slice(dock.indexOf("const TABS = ["), dock.indexOf("const TAB_ICONS"));
  const tabIds = [...tabsBlock.matchAll(/\{\s*id:\s*"([^"]+)"/g)].map((m) => m[1]);

  assert.deepEqual(tabIds, ["todo", "cal", "habit", "memo", "mail", "room", "deco", "settings"]);
  for (const id of ["todo", "cal", "habit", "memo", "mail", "room"]) {
    assert.match(tabsBlock, new RegExp(`id: "${id}"[\\s\\S]*?view:`));
  }

  assert.match(dock, /active === "settings"\s*\?\s*<SettingsView/);
  assert.match(dock, /active === "deco"\s*\?\s*<DecorateView/);
});

test("HTML loads every app module needed by sidebar features", () => {
  const html = readFileSync(new URL("../todoary.html", import.meta.url), "utf8");
  const requiredModules = [
    "v2/store/store.jsx",
    "v2/i18n/i18n.jsx",
    "v2/shared/views-shared.jsx",
    "v2/features/today/view-today.jsx",
    "v2/features/todo/view-todo.jsx",
    "v2/features/habit/view-habit.jsx",
    "v2/features/memo/view-memo.jsx",
    "v2/features/mail/view-mail.jsx",
    "v2/features/room/view-room.jsx",
    "v2/features/timer/timer.jsx",
    "v2/app/reminders-cache.js",
    "v2/app/side-dock-v2.jsx",
  ];

  const missing = requiredModules.filter((src) => !html.includes(`src="${src}"`));
  assert.deepEqual(missing, []);
});

test("hard reset falls back when Tauri dialog exists without confirm", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");
  const hardResetStart = store.indexOf("async hardReset()");
  const nextSection = store.indexOf("// ----- 습관", hardResetStart);
  assert.ok(hardResetStart >= 0 && nextSection > hardResetStart, "hardReset should exist");

  const hardReset = store.slice(hardResetStart, nextSection);
  assert.match(hardReset, /window\.dialog\?\.confirm/);
  assert.doesNotMatch(hardReset, /window\.dialog\s*\?\s*window\.dialog\.confirm/);
});

test("in-app dialog host is mounted so confirm prompts are visible", () => {
  const html = readFileSync(new URL("../todoary.html", import.meta.url), "utf8");
  const appStart = html.indexOf("function App()");
  const renderStart = html.indexOf("return (", appStart);
  const renderEnd = html.indexOf("</TweaksPanel>", renderStart);
  assert.ok(appStart >= 0 && renderStart > appStart && renderEnd > renderStart, "App render tree should exist");

  const appRender = html.slice(renderStart, renderEnd);
  assert.match(appRender, /<DialogHost\s*\/>/);
});

test("in-app dialog matches existing sketch modal styling", () => {
  const shared = readFileSync(new URL("../v2/shared/views-shared.jsx", import.meta.url), "utf8");
  const start = shared.indexOf("function DialogHost()");
  const end = shared.indexOf("if (typeof window !== \"undefined\")", start);
  assert.ok(start >= 0 && end > start, "DialogHost should exist");

  const dialogHost = shared.slice(start, end);
  assert.match(dialogHost, /className="sk-box"/);
  assert.match(dialogHost, /className="xp-btn close"/);
  assert.match(dialogHost, /background:\s*"var\(--paper\)"/);
  assert.doesNotMatch(dialogHost, /glassmorphism|backdropFilter:\s*"blur\(16px\)"|rgba\(255,\s*255,\s*255,\s*0\.9\)/);
});

test("habit ordering is persisted through store actions and rendered controls", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");
  const habitView = readFileSync(new URL("../v2/features/habit/view-habit.jsx", import.meta.url), "utf8");

  assert.match(store, /order:\s*h\.order\s*\?\?\s*i/);
  assert.match(store, /order:\s*nextOrder/);
  assert.match(store, /reorderHabitBefore\(fromId,\s*beforeId\)/);
  assert.match(store, /reorderHabitSubItemBefore\(habitId,\s*fromSubId,\s*beforeSubId\)/);
  assert.match(store, /habitsForCurrent:[\s\S]*?sort\(\(a,\s*b\)\s*=>\s*\(a\.order\s*\?\?\s*0\)\s*-\s*\(b\.order\s*\?\?\s*0\)\)/);

  assert.match(habitView, /actions\.reorderHabitBefore/);
  assert.match(habitView, /actions\.reorderHabitSubItemBefore/);
  assert.match(habitView, /draggable=\{true\}/);
  assert.match(habitView, /onDragStart=\{\(\)\s*=>\s*setDraggingSubItemId\(si\.id\)\}/);
  assert.match(habitView, /onDrop=\{\(\)\s*=>\s*dropSubItem\(idx\)\}/);
  assert.doesNotMatch(habitView, /onClick=\{\(\)\s*=>\s*moveSubUp\(idx\)\}/);
  assert.doesNotMatch(habitView, /onClick=\{\(\)\s*=>\s*moveSubDown\(idx\)\}/);
});

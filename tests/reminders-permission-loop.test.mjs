import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createRemindersListLoader } = require("../v2/app/reminders-cache.js");

test("Reminders permission prompt does not loop across repeated settings attempts", async () => {
  let calls = 0;
  const loader = createRemindersListLoader({
    invoke: async (command) => {
      calls += 1;
      assert.equal(command, "get_reminders_lists");
      throw new Error("permission cancelled");
    },
  });

  for (let i = 0; i < 8; i += 1) {
    await assert.rejects(() => loader.load(), /permission cancelled/);
  }

  assert.equal(calls, 1);
});

test("Reminders settings does not request permission just by opening settings tab", () => {
  const settings = readFileSync(new URL("../v2/app/side-dock-v2.jsx", import.meta.url), "utf8");
  const hookStart = settings.indexOf("function useRemindersLists");
  const hookEnd = settings.indexOf("function RemindersSettings", hookStart);
  assert.ok(hookStart >= 0 && hookEnd > hookStart, "useRemindersLists hook should exist");

  const hook = settings.slice(hookStart, hookEnd);
  assert.doesNotMatch(hook, /useEffect\s*\(/);
  assert.doesNotMatch(hook, /get_reminders_lists/);
  assert.doesNotMatch(hook, /loadRemindersLists\s*\(/);
});

test("Reminders setup and sync entry points are explicit user actions", () => {
  const settings = readFileSync(new URL("../v2/app/side-dock-v2.jsx", import.meta.url), "utf8");
  const componentStart = settings.indexOf("function RemindersSettings");
  const componentEnd = settings.indexOf("const SETTINGS_SCHEMA", componentStart);
  assert.ok(componentStart >= 0 && componentEnd > componentStart, "RemindersSettings component should exist");

  const component = settings.slice(componentStart, componentEnd);
  assert.match(component, /const onToggle = async/);
  assert.match(component, /const fetched = await loadRemindersLists\(\)/);
  assert.match(component, /await actions\.syncAllToReminders\(\)/);
});

test("create flows keep automatic Reminders sync wired after setup", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");

  assert.match(store, /addTodo\([\s\S]*?syncReminder\("todo"/);
  assert.match(store, /addMemo\([\s\S]*?syncReminder\("memo"/);
  assert.match(store, /addHabit\([\s\S]*?syncReminder\("habit"/);
  assert.match(store, /addSubItemToHabit\([\s\S]*?syncReminder\("habit"/);
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Reminders batch payload uses Rust field name list_name", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");

  assert.match(store, /const item = \{\s*list_name:/);
  assert.match(store, /items\.push\(item\)/);
  assert.doesNotMatch(store, /items\.push\(\{\s*listName,/);
});

test("Reminders batch sends one habit reminder with sub-items in the body", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");

  assert.match(store, /h\.subItems/);
  assert.match(store, /habitBody/);
  assert.match(store, /body:\s*habitBody/);
  assert.doesNotMatch(store, /\[습관\]\s*\$\{h\.name\.trim\(\)\}\s*-\s*\$\{si\.name\.trim\(\)\}/);
});

test("Reminders batch skips completed todos and completed habits", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");

  assert.match(store, /s\.todos\.filter\(t\s*=>\s*!t\.done\)/);
  assert.match(store, /h\.status\s*===\s*"completed"/);
  assert.match(store, /isDateSuccessForHabit\(h,\s*today\(\)\)/);
});

test("Reminders batch sync reports progress in chunks", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");
  const syncAllStart = store.indexOf("async syncAllToReminders");
  const nextSection = store.indexOf("// ----- 할 일 -----", syncAllStart);
  assert.ok(syncAllStart >= 0 && nextSection > syncAllStart, "syncAllToReminders should exist");

  const syncAll = store.slice(syncAllStart, nextSection);
  assert.match(syncAll, /onProgress/);
  assert.match(syncAll, /REMINDERS_BATCH_SIZE/);
  assert.match(syncAll, /items\.slice\(sent,\s*sent\s*\+\s*REMINDERS_BATCH_SIZE\)/);
  assert.match(syncAll, /onProgress\?\.\(\{\s*sent,\s*total:\s*items\.length\s*\}\)/);
});

test("Reminders batch sync skips items already sent with the same sync key", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");
  const syncAllStart = store.indexOf("async syncAllToReminders");
  const nextSection = store.indexOf("// ----- 할 일 -----", syncAllStart);
  assert.ok(syncAllStart >= 0 && nextSection > syncAllStart, "syncAllToReminders should exist");

  const syncAll = store.slice(syncAllStart, nextSection);
  assert.match(store, /reminders\.synced/);
  assert.match(store, /function reminderSyncKey/);
  assert.match(syncAll, /const syncKey = reminderSyncKey/);
  assert.match(syncAll, /if \(synced\[syncKey\]\) return/);
  assert.match(syncAll, /const sentKeys = pendingKeys\.slice/);
  assert.match(syncAll, /markRemindersSynced\(sentKeys\)/);
});

test("Reminders backend scans lists across accounts", () => {
  const main = readFileSync(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8");

  assert.match(main, /function addAccountLists/);
  assert.match(main, /app\.accounts\(\)/);
  assert.match(main, /findReminderList/);
});

test("Reminders backend serializes osascript permission requests", () => {
  const main = readFileSync(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8");

  assert.match(main, /REMINDERS_SCRIPT_LOCK/);
  assert.match(main, /run_reminders_script/);
  assert.equal((main.match(/Command::new\("osascript"\)/g) || []).length, 1);
  assert.equal((main.match(/run_reminders_script\(&script\)\?/g) || []).length, 3);
});

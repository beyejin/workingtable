import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Reminders batch payload uses Rust field name list_name", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");

  assert.match(store, /items\.push\(\{\s*list_name:/);
  assert.doesNotMatch(store, /items\.push\(\{\s*listName,/);
});

test("Reminders batch includes habit sub-items", () => {
  const store = readFileSync(new URL("../v2/store/store.jsx", import.meta.url), "utf8");

  assert.match(store, /h\.subItems/);
  assert.match(store, /\[습관\]\s*\$\{h\.name\.trim\(\)\}\s*-\s*\$\{si\.name\.trim\(\)\}/);
});

test("Reminders backend scans lists across accounts", () => {
  const main = readFileSync(new URL("../src-tauri/src/main.rs", import.meta.url), "utf8");

  assert.match(main, /function addAccountLists/);
  assert.match(main, /app\.accounts\(\)/);
  assert.match(main, /findReminderList/);
});

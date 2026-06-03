import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  createBrowserSyncController,
  createReminderSyncController,
  createRemindersListLoader,
} = require("../v2/app/reminders-cache.js");

test("deduplicates concurrent Reminders list requests", async () => {
  let calls = 0;
  const loader = createRemindersListLoader({
    invoke: async (command) => {
      calls += 1;
      assert.equal(command, "get_reminders_lists");
      await new Promise(resolve => setTimeout(resolve, 5));
      return ["Inbox", "Work"];
    },
  });

  const [first, second] = await Promise.all([loader.load(), loader.load()]);

  assert.deepEqual(first, ["Inbox", "Work"]);
  assert.deepEqual(second, ["Inbox", "Work"]);
  assert.equal(calls, 1);
});

test("reuses a successful Reminders list result after remounts", async () => {
  let calls = 0;
  const loader = createRemindersListLoader({
    invoke: async () => {
      calls += 1;
      return ["Inbox"];
    },
  });

  assert.deepEqual(await loader.load(), ["Inbox"]);
  assert.deepEqual(await loader.load(), ["Inbox"]);
  assert.equal(calls, 1);
});

test("blocks repeated Reminders list requests after one failure", async () => {
  let calls = 0;
  const loader = createRemindersListLoader({
    invoke: async () => {
      calls += 1;
      throw new Error("permission cancelled");
    },
  });

  await assert.rejects(() => loader.load(), /permission cancelled/);
  await assert.rejects(() => loader.load(), /permission cancelled/);
  assert.equal(calls, 1);
});

test("does not invoke Reminders when automatic sync is requested", async () => {
  let calls = 0;
  const syncer = createReminderSyncController({
    invoke: async () => {
      calls += 1;
    },
  });

  const synced = await syncer.syncOne({ listName: "Inbox", title: "Task" }, { mode: "auto" });

  assert.equal(synced, false);
  assert.equal(calls, 0);
});

test("browser Reminders controller syncs automatically after setup", async () => {
  let calls = 0;
  const previousTauri = globalThis.__TAURI__;
  globalThis.__TAURI__ = {
    core: {
      invoke: async (command, payload) => {
        calls += 1;
        assert.equal(command, "add_to_reminders");
        assert.deepEqual(payload, { listName: "Inbox", title: "Task" });
      },
    },
  };

  try {
    const syncer = createBrowserSyncController();
    const synced = await syncer.syncOne({ listName: "Inbox", title: "Task" }, { mode: "auto" });

    assert.equal(synced, true);
    assert.equal(calls, 1);
  } finally {
    globalThis.__TAURI__ = previousTauri;
  }
});

test("allows manual Reminders sync", async () => {
  let calls = 0;
  const syncer = createReminderSyncController({
    invoke: async (command, payload) => {
      calls += 1;
      assert.equal(command, "add_to_reminders");
      assert.deepEqual(payload, { listName: "Inbox", title: "Task" });
    },
  });

  const synced = await syncer.syncOne({ listName: "Inbox", title: "Task" }, { mode: "manual" });

  assert.equal(synced, true);
  assert.equal(calls, 1);
});

test("blocks the rest of the session after one Reminders sync failure", async () => {
  let calls = 0;
  const syncer = createReminderSyncController({
    invoke: async () => {
      calls += 1;
      throw new Error("permission denied");
    },
  });

  assert.equal(await syncer.syncOne({ listName: "Inbox", title: "First" }, { mode: "manual" }), false);
  assert.equal(await syncer.syncOne({ listName: "Inbox", title: "Second" }, { mode: "manual" }), false);
  assert.equal(calls, 1);
});

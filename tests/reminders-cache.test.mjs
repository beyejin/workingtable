import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createRemindersListLoader } = require("../v2/app/reminders-cache.js");

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

test("does not cache failed Reminders list requests", async () => {
  let calls = 0;
  const loader = createRemindersListLoader({
    invoke: async () => {
      calls += 1;
      if (calls === 1) throw new Error("permission cancelled");
      return ["Inbox"];
    },
  });

  await assert.rejects(() => loader.load(), /permission cancelled/);
  assert.deepEqual(await loader.load(), ["Inbox"]);
  assert.equal(calls, 2);
});

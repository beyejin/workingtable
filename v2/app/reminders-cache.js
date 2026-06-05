(function (root) {
  function createRemindersCommandQueue({ invoke }) {
    let tail = Promise.resolve();

    function enqueue(command, payload) {
      const run = tail.then(() => invoke(command, payload));
      tail = run.catch(() => {});
      return run;
    }

    function syncBatch(items) {
      return enqueue("add_to_reminders_batch", { items });
    }

    return { invoke: enqueue, syncBatch };
  }

  function createRemindersListLoader({ invoke }) {
    let cachedLists = null;
    let failedError = null;
    let pending = null;

    async function load() {
      if (cachedLists) return cachedLists.slice();
      if (failedError) throw failedError;
      if (pending) return pending;

      pending = Promise.resolve()
        .then(() => invoke("get_reminders_lists"))
        .then((lists) => {
          cachedLists = Array.isArray(lists) ? lists.slice() : [];
          return cachedLists.slice();
        })
        .catch((e) => {
          failedError = e;
          throw e;
        })
        .finally(() => {
          pending = null;
        });

      return pending;
    }

    function clear() {
      cachedLists = null;
      failedError = null;
      pending = null;
    }

    return { load, clear };
  }

  function createReminderSyncController({ invoke, logger = null, autoSync = false }) {
    let blocked = false;
    let pending = null;
    const successfulAutoKeys = new Set();

    function payloadKey(payload) {
      const sorted = {};
      Object.keys(payload || {}).sort().forEach((key) => {
        sorted[key] = payload[key];
      });
      return JSON.stringify(sorted);
    }

    async function syncOne(payload, { mode = "manual" } = {}) {
      if (blocked) return false;
      if (mode === "auto" && !autoSync) return false;
      const key = mode === "auto" ? payloadKey(payload) : null;
      if (key && successfulAutoKeys.has(key)) return true;
      if (pending) return pending;

      pending = Promise.resolve()
        .then(() => invoke("add_to_reminders", payload))
        .then(() => {
          if (key) successfulAutoKeys.add(key);
          return true;
        })
        .catch((e) => {
          blocked = true;
          if (logger?.warn) logger.warn("Failed to sync with Reminders:", e);
          return false;
        })
        .finally(() => {
          pending = null;
        });

      return pending;
    }

    function clearBlock() {
      blocked = false;
      pending = null;
    }

    function isBlocked() {
      return blocked;
    }

    return { syncOne, clearBlock, isBlocked };
  }

  function createBrowserInvoke() {
    return createRemindersCommandQueue({
      invoke(command, payload) {
        const invoke = root.__TAURI__?.core?.invoke;
        if (!invoke) throw new Error("Tauri invoke API is unavailable");
        return invoke(command, payload);
      },
    });
  }

  function createBrowserLoader() {
    return createRemindersListLoader(browserQueue);
  }

  function createBrowserSyncController() {
    return createReminderSyncController({ ...browserQueue, logger: root.console, autoSync: false });
  }

  const api = { createBrowserSyncController, createRemindersCommandQueue, createReminderSyncController, createRemindersListLoader };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (root && typeof root === "object") {
    var browserQueue = createBrowserInvoke();
    const loader = createBrowserLoader();
    const syncer = createBrowserSyncController();
    root.todoaryReminders = {
      loadLists: loader.load,
      clearListsCache: loader.clear,
      syncOne: syncer.syncOne,
      syncBatch: browserQueue.syncBatch,
      clearSyncBlock: syncer.clearBlock,
      isSyncBlocked: syncer.isBlocked,
      createReminderSyncController,
      createRemindersCommandQueue,
      createRemindersListLoader,
    };
  }
})(typeof window !== "undefined" ? window : globalThis);

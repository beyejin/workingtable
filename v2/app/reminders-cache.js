(function (root) {
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

    async function syncOne(payload, { mode = "manual" } = {}) {
      if (blocked) return false;
      if (mode === "auto" && !autoSync) return false;

      try {
        await invoke("add_to_reminders", payload);
        return true;
      } catch (e) {
        blocked = true;
        if (logger?.warn) logger.warn("Failed to sync with Reminders:", e);
        return false;
      }
    }

    function clearBlock() {
      blocked = false;
    }

    function isBlocked() {
      return blocked;
    }

    return { syncOne, clearBlock, isBlocked };
  }

  function createBrowserInvoke() {
    return {
      invoke(command, payload) {
        const invoke = root.__TAURI__?.core?.invoke;
        if (!invoke) throw new Error("Tauri invoke API is unavailable");
        return invoke(command, payload);
      },
    };
  }

  function createBrowserLoader() {
    return createRemindersListLoader(createBrowserInvoke());
  }

  function createBrowserSyncController() {
    return createReminderSyncController({ ...createBrowserInvoke(), logger: root.console, autoSync: true });
  }

  const api = { createBrowserSyncController, createReminderSyncController, createRemindersListLoader };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (root && typeof root === "object") {
    const loader = createBrowserLoader();
    const syncer = createBrowserSyncController();
    root.todoaryReminders = {
      loadLists: loader.load,
      clearListsCache: loader.clear,
      syncOne: syncer.syncOne,
      clearSyncBlock: syncer.clearBlock,
      isSyncBlocked: syncer.isBlocked,
      createReminderSyncController,
      createRemindersListLoader,
    };
  }
})(typeof window !== "undefined" ? window : globalThis);

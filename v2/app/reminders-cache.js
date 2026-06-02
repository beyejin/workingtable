(function (root) {
  function createRemindersListLoader({ invoke }) {
    let cachedLists = null;
    let pending = null;

    async function load() {
      if (cachedLists) return cachedLists.slice();
      if (pending) return pending;

      pending = Promise.resolve()
        .then(() => invoke("get_reminders_lists"))
        .then((lists) => {
          cachedLists = Array.isArray(lists) ? lists.slice() : [];
          return cachedLists.slice();
        })
        .finally(() => {
          pending = null;
        });

      return pending;
    }

    function clear() {
      cachedLists = null;
      pending = null;
    }

    return { load, clear };
  }

  function createBrowserLoader() {
    return createRemindersListLoader({
      invoke(command) {
        const invoke = root.__TAURI__?.core?.invoke;
        if (!invoke) throw new Error("Tauri invoke API is unavailable");
        return invoke(command);
      },
    });
  }

  const api = { createRemindersListLoader };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  if (root && typeof root === "object") {
    const loader = createBrowserLoader();
    root.todoaryReminders = {
      loadLists: loader.load,
      clearListsCache: loader.clear,
      createRemindersListLoader,
    };
  }
})(typeof window !== "undefined" ? window : globalThis);

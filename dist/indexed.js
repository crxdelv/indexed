/**
 * Indexed v1.1.1
 * https://github.com/creuserr/indexed
 *
 * Released under the CC0-1.0 license
 * https://github.com/creuserr/indexed#license
 *
 * Date: 2024-07-29
 */

(function (global, factory) {
  if(typeof module === "object" && typeof module.exports === "object") {
    // For Node.js or CommonJS
    module.exports = factory();
  } else if(typeof define === "function" && define.amd) {
    // For AMD (Asynchronous Module Definition) like RequireJS
    define(factory);
  } else {
    // For browser global environment
    global.Indexed = factory();
  }
}(typeof window !== "undefined" ? window : this, function() {

const global = typeof window !== "undefined" ? window : this;

function createFallbacks(keys, temp) {
  const res = {};
  keys.forEach(k => {
    res[k] = () => {};
  });
  if(temp != null) {
    for(let k in temp) {
      if(k in res) res[k] = temp[k];
    }
  }
  return res;
}

class Indexed {
  /**
   * Check for indexed database support.
   * @type {boolean}
   */
  static supported = "indexedDB" in global;
  static version = "1.1.1";
  fallback = createFallbacks(["open", "delete", "check", "all"]);
  static Database = class {
    constructor(db, fallback) {
      this.db = db;
      this.fallback = createFallbacks(["set", "get", "all", "delete", "close"], fallback.open);
    }
    /**
     * Set a key to the database.
     *
     * @function set
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      const db = this.db;
      if(!Indexed.supported) return this.fallback.set(db, key, value);
      return new Promise((resolve, reject) => {
        const trans = db.transaction(["main"], "readwrite");
        const store = trans.objectStore("main");
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          if(result != null) {
            result.value = value;
            store.put(result);
          } else {
            store.put({ key, value });
          }
          resolve();
        }
        request.onerror = () => {
          reject(request.error);
        }
      });
    }
    /**
     * Get a key from the database.
     *
     * @function get
     * @param {string} key
     * @param {*} default_value
     */
    get(key, value) {
      const db = this.db;
      if(!Indexed.supported) return this.fallback.get(db, key, value);
      return new Promise((resolve, reject) => {
        const trans = db.transaction(["main"], "readonly");
        const store = trans.objectStore("main");
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result?.value || value);
        }
        request.onerror = () => {
          reject(request.error);
        }
      });
    }
    /**
     * Get all the keys from the database.
     *
     * @function all
     * @returns {Object}
     */
    all() {
      const db = this.db;
      if(!Indexed.supported) return this.fallback.all(db);
      return new Promise((resolve, reject) => {
        const trans = db.transaction(["main"], "readonly");
        const store = trans.objectStore("main");
        const request = store.getAll();
        request.onsuccess = () => {
          let data = {};
          const result = request.result;
          result.forEach(item => {
            data[item.key] = item.value
          });
          resolve(data);
        }
        request.onerror = () => {
          reject(request.error);
        }
      });
    }
    /**
     * Delete a key from the database.
     *
     * @function delete
     * @param {string} key
     */
    delete(key) {
      const db = this.db;
      if(!Indexed.supported) return this.fallback.delete(db, key);
      return new Promise((resolve, reject) => {
        const trans = db.transaction(["main"], "readwrite");
        const store = trans.objectStore("main");
        const request = store.delete(key);
        request.onsuccess = () => {
          resolve();
        }
        request.onerror = () => {
          reject(request.error);
        }
      });
    }
    /**
     * Close the database connection.
     *
     * @function close
     */
    close() {
      const db = this.db;
      if(!Indexed.supported) return this.fallback.close(db);
      db.close();
    }
  }
  /**
   * Open a database.
   *
   * @function open
   * @param {string} name
   * @param {number} [version=1] version
   */
  open(name, version=1) {
    const fallback = this.fallback;
    if(!Indexed.supported) return new Indexed.Database(name, fallback);
    return new Promise((resolve, reject) => {
      const request = global.indexedDB.open(name, version);
      request.onupgradeneeded = evt => {
        const db = evt.target.result;
        const main = db.createObjectStore("main", { keyPath: "key" });
        main.createIndex("value", "value", { unique: false });
      }
      request.onsuccess = evt => {
        resolve(new Indexed.Database(evt.target.result, fallback));
      }
      request.onerror = evt => {
        reject(evt.target.error);
      }
    });
  }
  /**
   * Delete a database.
   *
   * @function delete
   * @param {string} name
   * @param {number} [version=1] version
   */
  delete(name, version=1) {
    if(!Indexed.supported) return this.fallback.delete(name, version);
    return new Promise((resolve, reject) => {
      const request = global.indexedDB.deleteDatabase(name, version);
      request.onsuccess = evt => {
        resolve();
      }
      request.onerror = evt => {
        reject(evt.target.error);
      }
      request.onblocked = evt => {
        reject(evt.target.error);
      }
    });
  }
  /**
   * Check if the database exists.
   *
   * @function check
   * @param {string} name
   * @param {number} [version=1] version
   */
  check(name, version=1) {
    if(!Indexed.supported) return this.fallback.check(name, version);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onsuccess = function(event) {
        const db = event.target.result;
        if(!db.objectStoreNames.contains("main")) {
          resolve(false);
          return;
        }
        const transaction = db.transaction("main");
        const store = transaction.objectStore("main");
        if(!store.indexNames.contains("key")) {
          resolve(false);
          return;
        }
        if(!store.indexNames.contains("value")) {
          resolve(false);
          return;
        }
        resolve(true);
      }
      request.onerror = evt => {
        reject(evt.target.error);
      }
    });
  }
  /**
   * Get all the database name and versions.
   *
   * @function all
   * @returns {Object}
   */
  async all() {
    if(!Indexed.supported) return this.fallback.all();
    return await global.indexedDB.databases();
  }
  /**
   * Open a database.
   *
   * @function open
   * @param {string} name
   * @param {number} [version=1] version
   */
  static async open(name, version) {
    const index = new Indexed();
    return await index.open(name, version);
  }
  /**
   * Delete a database.
   *
   * @function delete
   * @param {string} name
   * @param {number} [version=1] version
   */
  static async delete(name, version) {
    const index = new Indexed();
    return await index.delete(name, version);
  }
  /**
   * Check if the database exists.
   *
   * @function check
   * @param {string} name
   * @param {number} [version=1] version
   */
  static async check(name, version) {
    const index = new Indexed();
    return await index.check(name, version);
  }
  /**
   * Get all the database name and versions.
   *
   * @function all
   * @returns {Object}
   */
  static async all() {
    const index = new Indexed();
    return await index.all(name, version);
  }
}

/**
 * Create a fallback template for web storages (localStorage, and sessionStorage).
 *
 * @function fallbackForWebStorage
 * @param {WebStorage} [storage=localStorage] storage
 * @example
 * const fallback = Indexed.fallbackForWebStorage(window.localStorage);
 * const index = new Indexed();
 * index.fallback = fallback;
 */
Indexed.fallbackForWebStorage = (storage=global.localStorage) => {
  function getData(name) {
    return JSON.parse(storage.getItem(name));
  }
  function setData(name, val) {
    storage.setItem(name, JSON.stringify(val));
  }
  const fallback = {};
  fallback.all = async () => {
    const databases = [];
    for(let i = 0; i < storage.length; o++) {
      databases.push({
        name: storage.key(i),
        version: null
      });
    }
    return databases;
  }
  fallback.check = async name => {
    return storage[name] != null;
  }
  fallback.delete = async name => {
    storage.removeItem(name);
    return true;
  }
  fallback.open = {
    async set(db, key, value) {
      if(!fallback.check(db)) setData(db, {});
      const data = getData(db);
      data[key] = value;
      setData(db, data);
    },
    async get(db, key, value) {
      if(!fallback.check(db)) setData(db, {});
      const data = getData(db);
      return data[key] || value;
    },
    async delete(db, key) {
      if(!fallback.check(db)) setData(db, {});
      const data = getData(db);
      delete data[key];
      setData(db, data);
    },
    async all() {
      if(!fallback.check(db)) setData(db, {});
      return getData(db);
    },
    async close() {
      if(!fallback.check(db)) setData(db, {});
    }
  }
  return fallback;
}

/**
 * Create a fallback template for objects.
 *
 * @function fallbackForObject
 * @param {Function} getter
 * @param {Function} setter
 * @example
 * const database = {};
 * const getter = key => {
 *   return database[key];
 * }
 * const setter = (key, value) => {
 *   database[key] = value;
 * }
 * const fallback = Indexed.fallbackForObject(getter, setter);
 * const index = new Indexed();
 * index.fallback = fallback;
 */
Indexed.fallbackForObject = (getter, setter) => {
  const fallback = {};
  fallback.all = async () => {
    return Object.keys(getter());
  }
  fallback.check = async key => {
    return fallback.all().includes(key);
  }
  fallback.delete = async key => {
    const data = getter();
    delete data[key];
    setter(data);
  }
  fallback.open = {
    async set(db, key, val) {
      const data = getter();
      data[db] = data[db] || {};
      data[db][key] = val;
      setter(data);
    },
    async get(db, key, val) {
      const data = getter();
      data[db] = data[db] || {};
      return data[db][key] || val;
    },
    async delete(db, key) {
      const data = getter();
      data[db] = data[db] || {};
      delete data[db][key];
      setter(data);
    },
    async all(db) {
      const data = getter();
      data[db] = data[db] || {};
      return data[db];
    }
  }
  return fallback;
}

return Indexed;

}));
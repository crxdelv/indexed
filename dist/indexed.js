class Indexed {
  static supported = "indexedDB" in global;
  static version = "1.0.0";
  static Database = class {
    constructor(db) {
      this.db = db;
    }
    set(key, value, fallback=()=>{}) {
      if(!Indexed.supported) return fallback(key, value);
      const db = this.db;
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
    get(key, value, fallback=()=>{}) {
      if(!Indexed.supported) return fallback(key, value);
      const db = this.db;
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
    all(fallback=()=>{}) {
      if(!Indexed.supported) return fallback(key, value);
      const db = this.db;
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
    delete(key, value, fallback=()=>{}) {
      if(!Indexed.supported) return fallback(key, value);
      const db = this.db;
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
    close(fallback=()=>{}) {
      if(!Indexed.supported) return fallback(key, value);
      this.db.close();
    }
  }
  static open(name, version=1, fallback=()=>{}) {
    if(!Indexed.supported) return fallback(key, value);
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(name, version);
      request.onupgradeneeded = evt => {
        const db = evt.target.result;
        const main = db.createObjectStore("main", { keyPath: "key" });
        main.createIndex("value", "value", { unique: false });
      }
      request.onsuccess = evt => {
        resolve(new Indexed.Database(evt.target.result));
      }
      request.onerror = evt => {
        reject(evt.target.error);
      }
    });
  }
  static delete(name, version=1, fallback=()=>{}) {
    if(!Indexed.supported) return fallback(key, value);
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(name, version);
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
  static check(name, version=1, fallback=()=>{}) {
    if(!Indexed.supported) return fallback(key, value);
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
  static async all(fallback=()=>{}) {
    if(!Indexed.supported) return fallback(key, value);
    return await window.indexedDB.databases();
  }
}

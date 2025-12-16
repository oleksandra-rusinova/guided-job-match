// IndexedDB utility for storing templates with larger capacity than localStorage

const DB_NAME = 'PrototypeTemplatesDB';
const DB_VERSION = 2; // Increment version to add prototypes store
const STORE_NAMES = {
  question: 'questionTemplates',
  prototype: 'prototypeTemplates',
  applicationStep: 'applicationStepTemplates',
  prototypes: 'prototypes', // Add prototypes store
};

let db: IDBDatabase | null = null;

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!database.objectStoreNames.contains(STORE_NAMES.question)) {
        database.createObjectStore(STORE_NAMES.question, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORE_NAMES.prototype)) {
        database.createObjectStore(STORE_NAMES.prototype, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORE_NAMES.applicationStep)) {
        database.createObjectStore(STORE_NAMES.applicationStep, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(STORE_NAMES.prototypes)) {
        database.createObjectStore(STORE_NAMES.prototypes, { keyPath: 'id' });
      }
    };
  });
};

// Get all items from a store
export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Error reading from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('IndexedDB not available, falling back to localStorage:', error);
    return [];
  }
};

// Save item to store
export const saveToStore = async <T extends { id: string }>(storeName: string, item: T): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error saving to IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('IndexedDB not available:', error);
    throw error;
  }
};

// Delete item from store
export const deleteFromStore = async (storeName: string, id: string): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('IndexedDB not available:', error);
    throw error;
  }
};

// Save all items to store (replaces all)
export const saveAllToStore = async <T extends { id: string }>(storeName: string, items: T[]): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear existing items
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Add all new items
        let completed = 0;
        let hasError = false;
        
        if (items.length === 0) {
          resolve();
          return;
        }
        
        items.forEach((item) => {
          const addRequest = store.add(item);
          addRequest.onsuccess = () => {
            completed++;
            if (completed === items.length && !hasError) {
              resolve();
            }
          };
          addRequest.onerror = () => {
            hasError = true;
            console.error('Error adding item to IndexedDB:', addRequest.error);
            reject(addRequest.error);
          };
        });
      };
      
      clearRequest.onerror = () => {
        console.error('Error clearing IndexedDB store:', clearRequest.error);
        reject(clearRequest.error);
      };
    });
  } catch (error) {
    console.error('IndexedDB not available:', error);
    throw error;
  }
};

// Check if IndexedDB is available
export const isIndexedDBAvailable = (): boolean => {
  return typeof indexedDB !== 'undefined';
};

// Get storage usage estimate
export const getIndexedDBStorageUsage = async (): Promise<{ used: number; estimatedLimit: number; percentage: number }> => {
  if (!isIndexedDBAvailable()) {
    return { used: 0, estimatedLimit: 0, percentage: 0 };
  }
  
  try {
    const database = await initDB();
    let totalSize = 0;
    
    // Estimate size by getting all data
    for (const storeName of Object.values(STORE_NAMES)) {
      try {
        const items = await getAllFromStore(storeName);
        const serialized = JSON.stringify(items);
        totalSize += new Blob([serialized]).size;
      } catch (error) {
        // Skip stores that don't exist yet
        console.warn(`Skipping store ${storeName} in size calculation:`, error);
      }
    }
    
    // IndexedDB typically has much larger limits (hundreds of MB to GB)
    // Use a conservative estimate of 100MB per origin (can be much larger)
    const estimatedLimit = 100 * 1024 * 1024; // 100MB
    const percentage = (totalSize / estimatedLimit) * 100;
    
    return { used: totalSize, estimatedLimit, percentage };
  } catch (error) {
    console.error('Error calculating IndexedDB storage:', error);
    return { used: 0, estimatedLimit: 0, percentage: 0 };
  }
};


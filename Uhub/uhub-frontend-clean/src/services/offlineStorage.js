// Offline Storage Service for IT Service Management
class OfflineStorageService {
  constructor() {
    this.dbName = 'ITServiceDB';
    this.dbVersion = 1;
    this.db = null;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('offlineRequests')) {
          const offlineRequestsStore = db.createObjectStore('offlineRequests', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          offlineRequestsStore.createIndex('status', 'status', { unique: false });
          offlineRequestsStore.createIndex('createdAt', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineComments')) {
          const offlineCommentsStore = db.createObjectStore('offlineComments', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          offlineCommentsStore.createIndex('requestId', 'request_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('offlineAttachments')) {
          const offlineAttachmentsStore = db.createObjectStore('offlineAttachments', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          offlineAttachmentsStore.createIndex('requestId', 'request_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          syncQueueStore.createIndex('type', 'type', { unique: false });
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Offline Request Management
  async saveOfflineRequest(request) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineRequests'], 'readwrite');
      const store = transaction.objectStore('offlineRequests');
      
      const offlineRequest = {
        ...request,
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isOffline: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const request_store = store.add(offlineRequest);
      
      request_store.onsuccess = () => {
        console.log('Request saved offline:', offlineRequest.id);
        resolve(offlineRequest);
      };
      
      request_store.onerror = () => {
        console.error('Failed to save request offline');
        reject(request_store.error);
      };
    });
  }

  async getOfflineRequests() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineRequests'], 'readonly');
      const store = transaction.objectStore('offlineRequests');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        console.error('Failed to get offline requests');
        reject(getAllRequest.error);
      };
    });
  }

  async removeOfflineRequest(id) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineRequests'], 'readwrite');
      const store = transaction.objectStore('offlineRequests');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        console.log('Offline request removed:', id);
        resolve();
      };
      
      deleteRequest.onerror = () => {
        console.error('Failed to remove offline request');
        reject(deleteRequest.error);
      };
    });
  }

  // Offline Comments Management
  async saveOfflineComment(comment) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineComments'], 'readwrite');
      const store = transaction.objectStore('offlineComments');
      
      const offlineComment = {
        ...comment,
        id: `offline_comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isOffline: true,
        created_at: new Date().toISOString()
      };

      const request_store = store.add(offlineComment);
      
      request_store.onsuccess = () => {
        console.log('Comment saved offline:', offlineComment.id);
        resolve(offlineComment);
      };
      
      request_store.onerror = () => {
        console.error('Failed to save comment offline');
        reject(request_store.error);
      };
    });
  }

  async getOfflineComments(requestId) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['offlineComments'], 'readonly');
      const store = transaction.objectStore('offlineComments');
      const index = store.index('requestId');
      const getAllRequest = index.getAll(requestId);
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        console.error('Failed to get offline comments');
        reject(getAllRequest.error);
      };
    });
  }

  // Sync Queue Management
  async addToSyncQueue(action, data) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      
      const syncItem = {
        type: action,
        data: data,
        timestamp: new Date().toISOString(),
        attempts: 0,
        maxAttempts: 3
      };

      const request_store = store.add(syncItem);
      
      request_store.onsuccess = () => {
        console.log('Item added to sync queue:', action);
        resolve(syncItem);
      };
      
      request_store.onerror = () => {
        console.error('Failed to add item to sync queue');
        reject(request_store.error);
      };
    });
  }

  async getSyncQueue() {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        console.error('Failed to get sync queue');
        reject(getAllRequest.error);
      };
    });
  }

  async removeFromSyncQueue(id) {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        console.log('Item removed from sync queue:', id);
        resolve();
      };
      
      deleteRequest.onerror = () => {
        console.error('Failed to remove item from sync queue');
        reject(deleteRequest.error);
      };
    });
  }

  // Cache Management
  async cacheData(key, data) {
    try {
      const cache = await caches.open('it-service-cache');
      const response = new Response(JSON.stringify(data));
      await cache.put(key, response);
      console.log('Data cached:', key);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  async getCachedData(key) {
    try {
      const cache = await caches.open('it-service-cache');
      const response = await cache.match(key);
      if (response) {
        const data = await response.json();
        console.log('Data retrieved from cache:', key);
        return data;
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
    }
    return null;
  }

  async clearCache() {
    try {
      const cache = await caches.open('it-service-cache');
      const keys = await cache.keys();
      await Promise.all(keys.map(key => cache.delete(key)));
      console.log('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Sync Management
  async syncOfflineData() {
    if (!navigator.onLine) {
      console.log('Device is offline, skipping sync');
      return;
    }

    try {
      const syncQueue = await this.getSyncQueue();
      console.log('Syncing offline data:', syncQueue.length, 'items');

      for (const item of syncQueue) {
        try {
          await this.syncItem(item);
          await this.removeFromSyncQueue(item.id);
        } catch (error) {
          console.error('Failed to sync item:', item, error);
          // Increment attempts and remove if max attempts reached
          item.attempts = (item.attempts || 0) + 1;
          if (item.attempts >= item.maxAttempts) {
            await this.removeFromSyncQueue(item.id);
          }
        }
      }

      // Sync offline requests
      const offlineRequests = await this.getOfflineRequests();
      for (const request of offlineRequests) {
        try {
          await this.syncOfflineRequest(request);
          await this.removeOfflineRequest(request.id);
        } catch (error) {
          console.error('Failed to sync offline request:', request, error);
        }
      }

      console.log('Offline data sync completed');
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  async syncItem(item) {
    // Implement specific sync logic based on item type
    switch (item.type) {
      case 'create_request':
        // Sync request creation
        break;
      case 'update_request':
        // Sync request update
        break;
      case 'add_comment':
        // Sync comment addition
        break;
      default:
        console.log('Unknown sync item type:', item.type);
    }
  }

  async syncOfflineRequest(request) {
    // Implement request sync logic
    console.log('Syncing offline request:', request.id);
    // This would typically make an API call to sync the request
  }

  // Utility Methods
  async getStorageInfo() {
    if (!this.db) await this.init();
    
    const offlineRequests = await this.getOfflineRequests();
    const syncQueue = await this.getSyncQueue();
    
    return {
      offlineRequests: offlineRequests.length,
      syncQueue: syncQueue.length,
      isOnline: navigator.onLine,
      lastSync: localStorage.getItem('lastSync') || 'Never'
    };
  }

  async clearAllOfflineData() {
    if (!this.db) await this.init();
    
    const transaction = this.db.transaction([
      'offlineRequests', 
      'offlineComments', 
      'offlineAttachments', 
      'syncQueue'
    ], 'readwrite');

    await Promise.all([
      transaction.objectStore('offlineRequests').clear(),
      transaction.objectStore('offlineComments').clear(),
      transaction.objectStore('offlineAttachments').clear(),
      transaction.objectStore('syncQueue').clear()
    ]);

    await this.clearCache();
    console.log('All offline data cleared');
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorageService();

export default offlineStorage;

// 离线支持工具类

// 网络状态监控器
class NetworkMonitor {
  constructor() {
    this.isOnline = true;
    this.callbacks = [];
    this.init();
  }

  init() {
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      const wasOnline = this.isOnline;
      this.isOnline = res.isConnected;
      
      if (wasOnline !== this.isOnline) {
        this.notifyCallbacks(this.isOnline);
      }
    });

    // 获取初始网络状态
    wx.getNetworkType({
      success: (res) => {
        this.isOnline = res.networkType !== 'none';
      }
    });
  }

  // 添加网络状态变化回调
  addCallback(callback) {
    this.callbacks.push(callback);
  }

  // 移除回调
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  // 通知所有回调
  notifyCallbacks(isOnline) {
    this.callbacks.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('网络状态回调执行失败:', error);
      }
    });
  }

  // 获取网络状态
  getNetworkStatus() {
    return this.isOnline;
  }
}

// 离线数据管理器
class OfflineDataManager {
  constructor() {
    this.storagePrefix = 'offline_';
    this.syncQueue = [];
    this.maxCacheSize = 100; // 最大缓存条目数
    this.cacheExpireTime = 24 * 60 * 60 * 1000; // 24小时过期
  }

  // 设置离线数据
  setOfflineData(key, data, expireTime = this.cacheExpireTime) {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expireTime: Date.now() + expireTime
    };

    try {
      wx.setStorageSync(this.storagePrefix + key, JSON.stringify(cacheData));
      this.cleanupExpiredCache();
    } catch (error) {
      console.error('设置离线数据失败:', error);
    }
  }

  // 获取离线数据
  getOfflineData(key) {
    try {
      const cacheStr = wx.getStorageSync(this.storagePrefix + key);
      if (!cacheStr) return null;

      const cache = JSON.parse(cacheStr);
      
      // 检查是否过期
      if (Date.now() > cache.expireTime) {
        this.removeOfflineData(key);
        return null;
      }

      return cache.data;
    } catch (error) {
      console.error('获取离线数据失败:', error);
      return null;
    }
  }

  // 删除离线数据
  removeOfflineData(key) {
    try {
      wx.removeStorageSync(this.storagePrefix + key);
    } catch (error) {
      console.error('删除离线数据失败:', error);
    }
  }

  // 获取所有离线数据键
  getAllOfflineKeys() {
    try {
      const info = wx.getStorageInfoSync();
      return info.keys.filter(key => key.startsWith(this.storagePrefix));
    } catch (error) {
      console.error('获取离线数据键失败:', error);
      return [];
    }
  }

  // 清理过期缓存
  cleanupExpiredCache() {
    const keys = this.getAllOfflineKeys();
    const now = Date.now();
    
    keys.forEach(key => {
      try {
        const cacheStr = wx.getStorageSync(key);
        if (cacheStr) {
          const cache = JSON.parse(cacheStr);
          if (now > cache.expireTime) {
            wx.removeStorageSync(key);
          }
        }
      } catch (error) {
        // 删除损坏的缓存
        wx.removeStorageSync(key);
      }
    });

    // 如果缓存过多，删除最老的
    const remainingKeys = this.getAllOfflineKeys();
    if (remainingKeys.length > this.maxCacheSize) {
      const cacheList = remainingKeys.map(key => {
        try {
          const cacheStr = wx.getStorageSync(key);
          const cache = JSON.parse(cacheStr);
          return { key, timestamp: cache.timestamp };
        } catch (error) {
          return { key, timestamp: 0 };
        }
      }).sort((a, b) => a.timestamp - b.timestamp);

      const toDelete = cacheList.slice(0, remainingKeys.length - this.maxCacheSize);
      toDelete.forEach(item => {
        wx.removeStorageSync(item.key);
      });
    }
  }

  // 获取缓存统计
  getCacheStats() {
    const keys = this.getAllOfflineKeys();
    let totalSize = 0;
    let expiredCount = 0;
    const now = Date.now();

    keys.forEach(key => {
      try {
        const cacheStr = wx.getStorageSync(key);
        totalSize += cacheStr.length;
        
        const cache = JSON.parse(cacheStr);
        if (now > cache.expireTime) {
          expiredCount++;
        }
      } catch (error) {
        // 忽略损坏的缓存
      }
    });

    return {
      totalCount: keys.length,
      totalSize: totalSize,
      expiredCount: expiredCount,
      maxCacheSize: this.maxCacheSize
    };
  }
}

// 数据同步队列管理器
class SyncQueueManager {
  constructor() {
    this.storageKey = 'sync_queue';
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5秒后重试
    this.loadQueue();
  }

  // 加载同步队列
  loadQueue() {
    try {
      const queueStr = wx.getStorageSync(this.storageKey);
      if (queueStr) {
        this.queue = JSON.parse(queueStr);
      }
    } catch (error) {
      console.error('加载同步队列失败:', error);
      this.queue = [];
    }
  }

  // 保存同步队列
  saveQueue() {
    try {
      wx.setStorageSync(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('保存同步队列失败:', error);
    }
  }

  // 添加同步任务
  addSyncTask(task) {
    const syncTask = {
      id: Date.now() + Math.random(),
      ...task,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending' // pending, processing, completed, failed
    };

    this.queue.push(syncTask);
    this.saveQueue();
    
    // 如果在线，立即处理
    if (networkMonitor.getNetworkStatus()) {
      this.processQueue();
    }
  }

  // 处理同步队列
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      // 按时间戳排序，先处理早的任务
      this.queue.sort((a, b) => a.timestamp - b.timestamp);

      while (this.queue.length > 0) {
        const task = this.queue[0];
        
        if (task.status === 'completed') {
          this.queue.shift();
          continue;
        }

        task.status = 'processing';
        this.saveQueue();

        try {
          await this.executeTask(task);
          task.status = 'completed';
          this.queue.shift();
        } catch (error) {
          task.retryCount++;
          task.status = 'failed';
          
          if (task.retryCount < this.maxRetries) {
            task.status = 'pending';
            // 移到队列末尾，稍后重试
            this.queue.push(this.queue.shift());
            
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          } else {
            // 达到最大重试次数，从队列中移除
            console.error('同步任务失败，已达到最大重试次数:', task);
            this.queue.shift();
          }
        }

        this.saveQueue();
      }
    } finally {
      this.processing = false;
    }
  }

  // 执行同步任务
  async executeTask(task) {
    const { type, data, apiFunction } = task;
    
    switch (type) {
      case 'create':
        return await apiFunction(data);
      case 'update':
        return await apiFunction(data.id, data);
      case 'delete':
        return await apiFunction(data.id);
      default:
        throw new Error(`未知的同步任务类型: ${type}`);
    }
  }

  // 获取队列状态
  getQueueStatus() {
    const status = {
      total: this.queue.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    this.queue.forEach(task => {
      status[task.status]++;
    });

    return status;
  }

  // 清空已完成的任务
  clearCompletedTasks() {
    this.queue = this.queue.filter(task => task.status !== 'completed');
    this.saveQueue();
  }

  // 重试失败的任务
  retryFailedTasks() {
    this.queue.forEach(task => {
      if (task.status === 'failed') {
        task.status = 'pending';
        task.retryCount = 0;
      }
    });
    this.saveQueue();
    
    if (networkMonitor.getNetworkStatus()) {
      this.processQueue();
    }
  }
}

// 离线优先API包装器
class OfflineFirstAPI {
  constructor(apiFunction, options = {}) {
    this.apiFunction = apiFunction;
    this.cacheKey = options.cacheKey;
    this.cacheExpire = options.cacheExpire || 30 * 60 * 1000; // 30分钟
    this.syncable = options.syncable || false; // 是否需要同步
  }

  // 获取数据（离线优先）
  async get(params = {}) {
    const cacheKey = this.getCacheKey('get', params);
    
    // 先尝试从缓存获取
    const cachedData = offlineDataManager.getOfflineData(cacheKey);
    
    if (networkMonitor.getNetworkStatus()) {
      // 在线时获取最新数据
      try {
        const response = await this.apiFunction(params);
        
        // 缓存数据
        if (response && response.data) {
          offlineDataManager.setOfflineData(cacheKey, response.data, this.cacheExpire);
        }
        
        return response;
      } catch (error) {
        // 网络请求失败，返回缓存数据
        if (cachedData) {
          console.warn('网络请求失败，返回缓存数据:', error);
          return { data: cachedData, fromCache: true };
        }
        throw error;
      }
    } else {
      // 离线时返回缓存数据
      if (cachedData) {
        return { data: cachedData, fromCache: true };
      }
      throw new Error('无网络连接且无缓存数据');
    }
  }

  // 创建数据（支持离线队列）
  async create(data) {
    if (networkMonitor.getNetworkStatus()) {
      try {
        return await this.apiFunction(data);
      } catch (error) {
        if (this.syncable) {
          // 添加到同步队列
          syncQueueManager.addSyncTask({
            type: 'create',
            data,
            apiFunction: this.apiFunction
          });
        }
        throw error;
      }
    } else {
      if (this.syncable) {
        // 离线时添加到同步队列
        syncQueueManager.addSyncTask({
          type: 'create',
          data,
          apiFunction: this.apiFunction
        });
        
        // 返回模拟成功响应
        return { data: { ...data, id: Date.now() }, offline: true };
      }
      throw new Error('无网络连接');
    }
  }

  // 更新数据（支持离线队列）
  async update(id, data) {
    if (networkMonitor.getNetworkStatus()) {
      try {
        return await this.apiFunction(id, data);
      } catch (error) {
        if (this.syncable) {
          syncQueueManager.addSyncTask({
            type: 'update',
            data: { id, ...data },
            apiFunction: this.apiFunction
          });
        }
        throw error;
      }
    } else {
      if (this.syncable) {
        syncQueueManager.addSyncTask({
          type: 'update',
          data: { id, ...data },
          apiFunction: this.apiFunction
        });
        
        return { data: { id, ...data }, offline: true };
      }
      throw new Error('无网络连接');
    }
  }

  // 删除数据（支持离线队列）
  async delete(id) {
    if (networkMonitor.getNetworkStatus()) {
      try {
        return await this.apiFunction(id);
      } catch (error) {
        if (this.syncable) {
          syncQueueManager.addSyncTask({
            type: 'delete',
            data: { id },
            apiFunction: this.apiFunction
          });
        }
        throw error;
      }
    } else {
      if (this.syncable) {
        syncQueueManager.addSyncTask({
          type: 'delete',
          data: { id },
          apiFunction: this.apiFunction
        });
        
        return { data: { id }, offline: true };
      }
      throw new Error('无网络连接');
    }
  }

  // 生成缓存键
  getCacheKey(method, params) {
    if (this.cacheKey) {
      return typeof this.cacheKey === 'function' 
        ? this.cacheKey(method, params)
        : this.cacheKey;
    }
    
    return `${method}_${JSON.stringify(params)}`;
  }
}

// 离线支持混合器
const offlineSupportMixin = {
  data() {
    return {
      isOnline: true,
      syncStatus: {
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      }
    };
  },

  onLoad() {
    // 监听网络状态
    networkMonitor.addCallback((isOnline) => {
      this.setData({ isOnline });
      
      if (isOnline) {
        // 网络恢复时自动同步
        this.syncOfflineData();
      }
    });

    // 初始化网络状态
    this.setData({ isOnline: networkMonitor.getNetworkStatus() });
  },

  methods: {
    // 同步离线数据
    async syncOfflineData() {
      try {
        await syncQueueManager.processQueue();
        this.updateSyncStatus();
      } catch (error) {
        console.error('同步离线数据失败:', error);
      }
    },

    // 更新同步状态
    updateSyncStatus() {
      const status = syncQueueManager.getQueueStatus();
      this.setData({ syncStatus: status });
    },

    // 重试失败的同步任务
    retryFailedSync() {
      syncQueueManager.retryFailedTasks();
      this.updateSyncStatus();
    },

    // 清空已完成的同步任务
    clearCompletedSync() {
      syncQueueManager.clearCompletedTasks();
      this.updateSyncStatus();
    },

    // 获取离线数据
    getOfflineData(key) {
      return offlineDataManager.getOfflineData(key);
    },

    // 设置离线数据
    setOfflineData(key, data, expireTime) {
      offlineDataManager.setOfflineData(key, data, expireTime);
    }
  }
};

// 创建全局实例
const networkMonitor = new NetworkMonitor();
const offlineDataManager = new OfflineDataManager();
const syncQueueManager = new SyncQueueManager();

// 网络状态恢复时自动同步
networkMonitor.addCallback((isOnline) => {
  if (isOnline) {
    syncQueueManager.processQueue();
  }
});

module.exports = {
  // 类
  NetworkMonitor,
  OfflineDataManager,
  SyncQueueManager,
  OfflineFirstAPI,
  
  // 全局实例
  networkMonitor,
  offlineDataManager,
  syncQueueManager,
  
  // 混合器
  offlineSupportMixin
} 
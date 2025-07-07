// 性能优化工具类

// 防抖函数 - 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时
function debounce(func, delay = 300) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

// 节流函数 - 规定在一个单位时间内，只能触发一次函数
function throttle(func, delay = 300) {
  let inThrottle;
  return function (...args) {
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, delay);
    }
  };
}

// 图片懒加载管理器
class LazyImageManager {
  constructor() {
    this.images = [];
    this.observer = null;
    this.init();
  }

  init() {
    // 创建交叉观察器
    this.observer = wx.createIntersectionObserver({
      rootMargin: '50px'
    });

    this.observer.observe('.lazy-image', (res) => {
      if (res.intersectionRatio > 0) {
        this.loadImage(res.id);
      }
    });
  }

  // 添加懒加载图片
  addImage(id, src) {
    this.images.push({ id, src, loaded: false });
  }

  // 加载图片
  loadImage(id) {
    const image = this.images.find(img => img.id === id);
    if (image && !image.loaded) {
      // 预加载图片
      wx.getImageInfo({
        src: image.src,
        success: () => {
          image.loaded = true;
          // 通知页面更新图片
          this.notifyImageLoaded(id, image.src);
        },
        fail: () => {
          console.error('图片加载失败:', image.src);
        }
      });
    }
  }

  // 通知图片加载完成
  notifyImageLoaded(id, src) {
    // 可以通过事件系统通知页面更新
    wx.triggerEvent('imageLoaded', { id, src });
  }

  // 销毁观察器
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// 缓存管理器
class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemorySize = 50; // 最大内存缓存数量
    this.storagePrefix = 'cache_';
    this.defaultExpireTime = 30 * 60 * 1000; // 30分钟
  }

  // 设置内存缓存
  setMemoryCache(key, value, expireTime = this.defaultExpireTime) {
    // 如果超过最大缓存数量，删除最老的缓存
    if (this.memoryCache.size >= this.maxMemorySize) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      value,
      expireTime: Date.now() + expireTime
    });
  }

  // 获取内存缓存
  getMemoryCache(key) {
    const cache = this.memoryCache.get(key);
    if (!cache) return null;

    // 检查是否过期
    if (Date.now() > cache.expireTime) {
      this.memoryCache.delete(key);
      return null;
    }

    return cache.value;
  }

  // 设置本地存储缓存
  setStorageCache(key, value, expireTime = this.defaultExpireTime) {
    const cacheData = {
      value,
      expireTime: Date.now() + expireTime
    };

    try {
      wx.setStorageSync(this.storagePrefix + key, JSON.stringify(cacheData));
    } catch (error) {
      console.error('设置存储缓存失败:', error);
    }
  }

  // 获取本地存储缓存
  getStorageCache(key) {
    try {
      const cacheStr = wx.getStorageSync(this.storagePrefix + key);
      if (!cacheStr) return null;

      const cache = JSON.parse(cacheStr);
      
      // 检查是否过期
      if (Date.now() > cache.expireTime) {
        wx.removeStorageSync(this.storagePrefix + key);
        return null;
      }

      return cache.value;
    } catch (error) {
      console.error('获取存储缓存失败:', error);
      return null;
    }
  }

  // 删除缓存
  removeCache(key) {
    this.memoryCache.delete(key);
    wx.removeStorageSync(this.storagePrefix + key);
  }

  // 清空所有缓存
  clearCache() {
    this.memoryCache.clear();
    
    // 清空本地存储中的缓存
    try {
      const info = wx.getStorageInfoSync();
      info.keys.forEach(key => {
        if (key.startsWith(this.storagePrefix)) {
          wx.removeStorageSync(key);
        }
      });
    } catch (error) {
      console.error('清空存储缓存失败:', error);
    }
  }

  // 获取缓存统计信息
  getCacheStats() {
    return {
      memorySize: this.memoryCache.size,
      maxMemorySize: this.maxMemorySize
    };
  }
}

// 数据分页管理器
class PaginationManager {
  constructor(options = {}) {
    this.pageSize = options.pageSize || 20;
    this.currentPage = 1;
    this.totalCount = 0;
    this.totalPages = 0;
    this.data = [];
    this.loading = false;
    this.hasMore = true;
    this.apiFunction = options.apiFunction;
    this.onDataUpdate = options.onDataUpdate || (() => {});
    this.onError = options.onError || (() => {});
  }

  // 加载第一页数据
  async loadFirstPage(params = {}) {
    this.currentPage = 1;
    this.data = [];
    this.hasMore = true;
    
    return await this.loadData(params);
  }

  // 加载下一页数据
  async loadNextPage(params = {}) {
    if (!this.hasMore || this.loading) {
      return { success: false, message: '没有更多数据' };
    }

    this.currentPage++;
    return await this.loadData(params);
  }

  // 刷新数据
  async refreshData(params = {}) {
    return await this.loadFirstPage(params);
  }

  // 加载数据
  async loadData(params = {}) {
    if (this.loading) return { success: false, message: '正在加载中' };

    this.loading = true;

    try {
      const requestParams = {
        page: this.currentPage,
        pageSize: this.pageSize,
        ...params
      };

      const response = await this.apiFunction(requestParams);
      
      if (response && response.data) {
        const { list = [], total = 0, page = 1, pageSize = this.pageSize } = response.data;
        
        this.totalCount = total;
        this.totalPages = Math.ceil(total / pageSize);
        
        if (this.currentPage === 1) {
          this.data = list;
        } else {
          this.data = [...this.data, ...list];
        }
        
        this.hasMore = this.currentPage < this.totalPages;
        
        this.onDataUpdate({
          data: this.data,
          currentPage: this.currentPage,
          totalPages: this.totalPages,
          totalCount: this.totalCount,
          hasMore: this.hasMore
        });
        
        return { success: true, data: this.data };
      }
      
      return { success: false, message: '数据格式错误' };
    } catch (error) {
      this.onError(error);
      return { success: false, message: error.message || '加载失败' };
    } finally {
      this.loading = false;
    }
  }

  // 获取当前状态
  getState() {
    return {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      totalCount: this.totalCount,
      totalPages: this.totalPages,
      hasMore: this.hasMore,
      loading: this.loading,
      dataCount: this.data.length
    };
  }

  // 重置状态
  reset() {
    this.currentPage = 1;
    this.totalCount = 0;
    this.totalPages = 0;
    this.data = [];
    this.loading = false;
    this.hasMore = true;
  }
}

// 性能监控器
class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
  }

  // 开始计时
  mark(name) {
    this.marks.set(name, Date.now());
  }

  // 结束计时并计算耗时
  measure(name, startMark) {
    const endTime = Date.now();
    const startTime = this.marks.get(startMark);
    
    if (startTime) {
      const duration = endTime - startTime;
      this.measures.set(name, duration);
      console.log(`性能监控 - ${name}: ${duration}ms`);
      return duration;
    }
    
    return 0;
  }

  // 获取所有测量结果
  getAllMeasures() {
    return Object.fromEntries(this.measures);
  }

  // 清空所有记录
  clear() {
    this.marks.clear();
    this.measures.clear();
  }

  // 监控页面加载性能
  monitorPageLoad(pageName) {
    const app = getApp();
    const startTime = Date.now();
    
    // 监控页面onLoad
    const originalOnLoad = getCurrentPages().pop().onLoad;
    getCurrentPages().pop().onLoad = function(options) {
      const loadTime = Date.now() - startTime;
      console.log(`页面加载性能 - ${pageName}: ${loadTime}ms`);
      
      if (originalOnLoad) {
        originalOnLoad.call(this, options);
      }
    };
  }
}

// 内存优化器
class MemoryOptimizer {
  constructor() {
    this.cleanupTasks = [];
    this.intervalId = null;
  }

  // 添加清理任务
  addCleanupTask(task) {
    this.cleanupTasks.push(task);
  }

  // 开始自动清理
  startAutoCleanup(interval = 60000) { // 默认每分钟清理一次
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, interval);
  }

  // 停止自动清理
  stopAutoCleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // 执行清理
  cleanup() {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('清理任务执行失败:', error);
      }
    });
    
    // 清理页面栈
    this.cleanupPageStack();
  }

  // 清理页面栈
  cleanupPageStack() {
    const pages = getCurrentPages();
    const maxPages = 10; // 最大页面数量
    
    if (pages.length > maxPages) {
      console.warn(`页面栈过深: ${pages.length}页，建议优化页面跳转逻辑`);
    }
  }

  // 清理无用的定时器
  clearTimers() {
    // 这里可以添加定时器清理逻辑
    console.log('清理定时器');
  }
}

// 网络优化器
class NetworkOptimizer {
  constructor() {
    this.requestQueue = [];
    this.concurrentLimit = 5; // 并发请求限制
    this.retryTimes = 3; // 重试次数
  }

  // 添加请求到队列
  addRequest(requestFunc, priority = 0) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        requestFunc,
        priority,
        resolve,
        reject,
        retryCount: 0
      });
      
      this.processQueue();
    });
  }

  // 处理请求队列
  async processQueue() {
    // 按优先级排序
    this.requestQueue.sort((a, b) => b.priority - a.priority);
    
    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.concurrentLimit);
      
      await Promise.allSettled(batch.map(async (request) => {
        try {
          const result = await request.requestFunc();
          request.resolve(result);
        } catch (error) {
          if (request.retryCount < this.retryTimes) {
            request.retryCount++;
            this.requestQueue.unshift(request); // 重新加入队列
          } else {
            request.reject(error);
          }
        }
      }));
    }
  }

  // 预加载资源
  preloadResources(urls) {
    urls.forEach(url => {
      if (url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg')) {
        // 预加载图片
        wx.getImageInfo({ src: url });
      }
    });
  }
}

// 创建全局实例
const lazyImageManager = new LazyImageManager();
const cacheManager = new CacheManager();
const performanceMonitor = new PerformanceMonitor();
const memoryOptimizer = new MemoryOptimizer();
const networkOptimizer = new NetworkOptimizer();

// 启动自动优化
memoryOptimizer.startAutoCleanup();

module.exports = {
  // 函数
  debounce,
  throttle,
  
  // 类
  LazyImageManager,
  CacheManager,
  PaginationManager,
  PerformanceMonitor,
  MemoryOptimizer,
  NetworkOptimizer,
  
  // 全局实例
  lazyImageManager,
  cacheManager,
  performanceMonitor,
  memoryOptimizer,
  networkOptimizer
} 
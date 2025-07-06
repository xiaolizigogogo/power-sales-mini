// 安全工具帮助函数

/**
 * 安全获取当前页面路径
 * @param {object} context - 页面上下文 (this)
 * @returns {string} 页面路径
 */
function getSafePagePath(context = null) {
  try {
    // 优先使用传入的上下文中的路径
    if (context && context.route) {
      return context.route;
    }
    
    // 尝试从页面栈获取
    const pages = getCurrentPages();
    if (pages && pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      if (currentPage) {
        return currentPage.route || currentPage.__route__ || 'unknown';
      }
    }
    
    return 'unknown';
  } catch (error) {
    console.warn('获取页面路径失败:', error);
    return 'unknown';
  }
}

/**
 * 安全执行函数，捕获错误
 * @param {function} fn - 要执行的函数
 * @param {any} defaultValue - 错误时的默认返回值
 * @returns {any} 函数执行结果或默认值
 */
function safeExecute(fn, defaultValue = null) {
  try {
    return fn();
  } catch (error) {
    console.warn('函数执行失败:', error);
    return defaultValue;
  }
}

/**
 * 安全获取页面实例
 * @returns {object|null} 当前页面实例
 */
function getSafeCurrentPage() {
  try {
    const pages = getCurrentPages();
    return pages && pages.length > 0 ? pages[pages.length - 1] : null;
  } catch (error) {
    console.warn('获取当前页面失败:', error);
    return null;
  }
}

/**
 * 安全设置数据到页面
 * @param {object} context - 页面上下文
 * @param {object} data - 要设置的数据
 * @param {function} callback - 回调函数
 */
function safeSetData(context, data, callback = null) {
  try {
    if (context && context.setData && typeof context.setData === 'function') {
      context.setData(data, callback);
    } else {
      console.warn('setData 方法不可用');
    }
  } catch (error) {
    console.error('setData 执行失败:', error);
  }
}

/**
 * 安全获取存储数据
 * @param {string} key - 存储键
 * @param {any} defaultValue - 默认值
 * @returns {any} 存储的值或默认值
 */
function safeGetStorage(key, defaultValue = null) {
  try {
    return wx.getStorageSync(key) || defaultValue;
  } catch (error) {
    console.warn(`获取存储数据失败 (${key}):`, error);
    return defaultValue;
  }
}

/**
 * 安全设置存储数据
 * @param {string} key - 存储键
 * @param {any} value - 要存储的值
 * @returns {boolean} 是否设置成功
 */
function safeSetStorage(key, value) {
  try {
    wx.setStorageSync(key, value);
    return true;
  } catch (error) {
    console.warn(`设置存储数据失败 (${key}):`, error);
    return false;
  }
}

/**
 * 安全显示提示
 * @param {string} title - 提示内容
 * @param {string} icon - 图标类型
 * @param {number} duration - 持续时间
 */
function safeShowToast(title, icon = 'none', duration = 2000) {
  try {
    wx.showToast({
      title: title || '操作完成',
      icon: icon,
      duration: duration
    });
  } catch (error) {
    console.warn('显示提示失败:', error);
  }
}

/**
 * 防抖函数 - 简化版
 * @param {function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {function} 防抖后的函数
 */
function simpleDebounce(func, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数 - 简化版
 * @param {function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {function} 节流后的函数
 */
function simpleThrottle(func, delay = 300) {
  let timer;
  return function (...args) {
    if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        func.apply(this, args);
      }, delay);
    }
  };
}

/**
 * 安全的JSON解析
 * @param {string} jsonString - JSON字符串
 * @param {any} defaultValue - 解析失败时的默认值
 * @returns {any} 解析结果或默认值
 */
function safeJSONParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON解析失败:', error);
    return defaultValue;
  }
}

/**
 * 安全的JSON字符串化
 * @param {any} obj - 要转换的对象
 * @param {string} defaultValue - 转换失败时的默认值
 * @returns {string} JSON字符串或默认值
 */
function safeJSONStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('JSON字符串化失败:', error);
    return defaultValue;
  }
}

module.exports = {
  getSafePagePath,
  safeExecute,
  getSafeCurrentPage,
  safeSetData,
  safeGetStorage,
  safeSetStorage,
  safeShowToast,
  simpleDebounce,
  simpleThrottle,
  safeJSONParse,
  safeJSONStringify
} 
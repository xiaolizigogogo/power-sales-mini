// 本地存储工具类

// 存储数据
function setStorage(key, data) {
  try {
    wx.setStorageSync(key, data)
    return true
  } catch (error) {
    console.error('存储数据失败:', error)
    return false
  }
}

// 异步存储数据
function setStorageAsync(key, data) {
  return new Promise((resolve, reject) => {
    wx.setStorage({
      key: key,
      data: data,
      success: () => {
        resolve(true)
      },
      fail: (error) => {
        console.error('异步存储数据失败:', error)
        reject(error)
      }
    })
  })
}

// 获取数据
function getStorage(key, defaultValue = null) {
  try {
    const data = wx.getStorageSync(key)
    return data !== '' ? data : defaultValue
  } catch (error) {
    console.error('获取存储数据失败:', error)
    return defaultValue
  }
}

// 异步获取数据
function getStorageAsync(key, defaultValue = null) {
  return new Promise((resolve) => {
    wx.getStorage({
      key: key,
      success: (res) => {
        resolve(res.data)
      },
      fail: () => {
        resolve(defaultValue)
      }
    })
  })
}

// 删除数据
function removeStorage(key) {
  try {
    wx.removeStorageSync(key)
    return true
  } catch (error) {
    console.error('删除存储数据失败:', error)
    return false
  }
}

// 异步删除数据
function removeStorageAsync(key) {
  return new Promise((resolve, reject) => {
    wx.removeStorage({
      key: key,
      success: () => {
        resolve(true)
      },
      fail: (error) => {
        console.error('异步删除存储数据失败:', error)
        reject(error)
      }
    })
  })
}

// 清空所有存储
function clearStorage() {
  try {
    wx.clearStorageSync()
    return true
  } catch (error) {
    console.error('清空存储失败:', error)
    return false
  }
}

// 异步清空所有存储
function clearStorageAsync() {
  return new Promise((resolve, reject) => {
    wx.clearStorage({
      success: () => {
        resolve(true)
      },
      fail: (error) => {
        console.error('异步清空存储失败:', error)
        reject(error)
      }
    })
  })
}

// 获取存储信息
function getStorageInfo() {
  try {
    return wx.getStorageInfoSync()
  } catch (error) {
    console.error('获取存储信息失败:', error)
    return {
      keys: [],
      currentSize: 0,
      limitSize: 0
    }
  }
}

// 异步获取存储信息
function getStorageInfoAsync() {
  return new Promise((resolve, reject) => {
    wx.getStorageInfo({
      success: (res) => {
        resolve(res)
      },
      fail: (error) => {
        console.error('异步获取存储信息失败:', error)
        reject(error)
      }
    })
  })
}

// 检查key是否存在
function hasStorage(key) {
  try {
    const data = wx.getStorageSync(key)
    return data !== ''
  } catch (error) {
    return false
  }
}

// 批量设置存储
function setBatchStorage(dataMap) {
  const results = {}
  for (const key in dataMap) {
    if (dataMap.hasOwnProperty(key)) {
      results[key] = setStorage(key, dataMap[key])
    }
  }
  return results
}

// 批量获取存储
function getBatchStorage(keys, defaultValue = null) {
  const results = {}
  keys.forEach(key => {
    results[key] = getStorage(key, defaultValue)
  })
  return results
}

// 批量删除存储
function removeBatchStorage(keys) {
  const results = {}
  keys.forEach(key => {
    results[key] = removeStorage(key)
  })
  return results
}

// 存储JSON数据
function setJsonStorage(key, data) {
  try {
    const jsonString = JSON.stringify(data)
    return setStorage(key, jsonString)
  } catch (error) {
    console.error('存储JSON数据失败:', error)
    return false
  }
}

// 获取JSON数据
function getJsonStorage(key, defaultValue = null) {
  try {
    const jsonString = getStorage(key)
    if (jsonString) {
      return JSON.parse(jsonString)
    }
    return defaultValue
  } catch (error) {
    console.error('获取JSON数据失败:', error)
    return defaultValue
  }
}

// 存储用户相关的常用数据操作

// 存储用户信息
function setUserInfo(userInfo) {
  return setStorage('userInfo', userInfo)
}

// 获取用户信息
function getUserInfo() {
  return getStorage('userInfo', null)
}

// 清除用户信息
function clearUserInfo() {
  return removeStorage('userInfo')
}

// 存储用户token
function setToken(token) {
  return setStorage('token', token)
}

// 获取用户token
function getToken() {
  return getStorage('token', '')
}

// 清除用户token
function clearToken() {
  return removeStorage('token')
}

// 存储应用设置
function setAppSettings(settings) {
  return setJsonStorage('appSettings', settings)
}

// 获取应用设置
function getAppSettings() {
  return getJsonStorage('appSettings', {
    theme: 'light',
    language: 'zh-CN',
    notifications: true,
    autoLogin: true
  })
}

// 更新应用设置
function updateAppSettings(newSettings) {
  const currentSettings = getAppSettings()
  const updatedSettings = Object.assign(currentSettings, newSettings)
  return setAppSettings(updatedSettings)
}

// 存储搜索历史
function addSearchHistory(keyword) {
  if (!keyword || keyword.trim() === '') return false
  
  let history = getJsonStorage('searchHistory', [])
  
  // 移除重复项
  history = history.filter(item => item !== keyword)
  
  // 添加到开头
  history.unshift(keyword)
  
  // 限制历史记录数量
  if (history.length > 20) {
    history = history.slice(0, 20)
  }
  
  return setJsonStorage('searchHistory', history)
}

// 获取搜索历史
function getSearchHistory() {
  return getJsonStorage('searchHistory', [])
}

// 清除搜索历史
function clearSearchHistory() {
  return removeStorage('searchHistory')
}

// 删除单个搜索历史
function removeSearchHistoryItem(keyword) {
  let history = getSearchHistory()
  history = history.filter(item => item !== keyword)
  return setJsonStorage('searchHistory', history)
}

// 存储浏览历史
function addBrowseHistory(item) {
  if (!item || !item.id) return false
  
  let history = getJsonStorage('browseHistory', [])
  
  // 移除重复项
  history = history.filter(historyItem => historyItem.id !== item.id)
  
  // 添加时间戳
  item.browseTime = new Date().getTime()
  
  // 添加到开头
  history.unshift(item)
  
  // 限制历史记录数量
  if (history.length > 50) {
    history = history.slice(0, 50)
  }
  
  return setJsonStorage('browseHistory', history)
}

// 获取浏览历史
function getBrowseHistory() {
  return getJsonStorage('browseHistory', [])
}

// 清除浏览历史
function clearBrowseHistory() {
  return removeStorage('browseHistory')
}

// 存储草稿数据
function saveDraft(key, data) {
  const drafts = getJsonStorage('drafts', {})
  drafts[key] = {
    data: data,
    saveTime: new Date().getTime()
  }
  return setJsonStorage('drafts', drafts)
}

// 获取草稿数据
function getDraft(key) {
  const drafts = getJsonStorage('drafts', {})
  return drafts[key] ? drafts[key].data : null
}

// 删除草稿数据
function removeDraft(key) {
  const drafts = getJsonStorage('drafts', {})
  delete drafts[key]
  return setJsonStorage('drafts', drafts)
}

// 获取所有草稿
function getAllDrafts() {
  return getJsonStorage('drafts', {})
}

// 清除所有草稿
function clearAllDrafts() {
  return removeStorage('drafts')
}

// 清除过期草稿（7天前的）
function clearExpiredDrafts() {
  const drafts = getAllDrafts()
  const expireTime = new Date().getTime() - 7 * 24 * 60 * 60 * 1000 // 7天
  
  for (const key in drafts) {
    if (drafts[key].saveTime < expireTime) {
      delete drafts[key]
    }
  }
  
  return setJsonStorage('drafts', drafts)
}

// 存储缓存数据（带过期时间）
function setCache(key, data, expireTime = null) {
  const cacheData = {
    data: data,
    createTime: new Date().getTime(),
    expireTime: expireTime
  }
  return setStorage(`cache_${key}`, cacheData)
}

// 获取缓存数据
function getCache(key) {
  const cacheData = getStorage(`cache_${key}`)
  if (!cacheData) return null
  
  // 检查是否过期
  if (cacheData.expireTime && new Date().getTime() > cacheData.expireTime) {
    removeStorage(`cache_${key}`)
    return null
  }
  
  return cacheData.data
}

// 清除过期缓存
function clearExpiredCache() {
  const storageInfo = getStorageInfo()
  const currentTime = new Date().getTime()
  
  storageInfo.keys.forEach(key => {
    if (key.startsWith('cache_')) {
      const cacheData = getStorage(key)
      if (cacheData && cacheData.expireTime && currentTime > cacheData.expireTime) {
        removeStorage(key)
      }
    }
  })
}

// 获取存储使用情况
function getStorageUsage() {
  const info = getStorageInfo()
  return {
    used: info.currentSize,
    total: info.limitSize,
    usage: info.limitSize > 0 ? (info.currentSize / info.limitSize * 100).toFixed(2) + '%' : '0%',
    keys: info.keys
  }
}

module.exports = {
  // 基础存储操作
  setStorage,
  setStorageAsync,
  getStorage,
  getStorageAsync,
  removeStorage,
  removeStorageAsync,
  clearStorage,
  clearStorageAsync,
  getStorageInfo,
  getStorageInfoAsync,
  hasStorage,
  
  // 批量操作
  setBatchStorage,
  getBatchStorage,
  removeBatchStorage,
  
  // JSON数据操作
  setJsonStorage,
  getJsonStorage,
  
  // 用户相关数据
  setUserInfo,
  getUserInfo,
  clearUserInfo,
  setToken,
  getToken,
  clearToken,
  
  // 应用设置
  setAppSettings,
  getAppSettings,
  updateAppSettings,
  
  // 搜索历史
  addSearchHistory,
  getSearchHistory,
  clearSearchHistory,
  removeSearchHistoryItem,
  
  // 浏览历史
  addBrowseHistory,
  getBrowseHistory,
  clearBrowseHistory,
  
  // 草稿数据
  saveDraft,
  getDraft,
  removeDraft,
  getAllDrafts,
  clearAllDrafts,
  clearExpiredDrafts,
  
  // 缓存数据
  setCache,
  getCache,
  clearExpiredCache,
  
  // 存储信息
  getStorageUsage
} 
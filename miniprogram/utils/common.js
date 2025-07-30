// 通用工具类

// 显示消息提示
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({
    title: title,
    icon: icon === 'error' ? 'none' : icon,
    duration: duration,
    mask: true
  })
}

// 显示加载提示
function showLoading(title = '加载中...') {
  wx.showLoading({
    title: title,
    mask: true
  })
}

// 隐藏加载提示
function hideLoading() {
  wx.hideLoading()
}

// 显示确认对话框
function showConfirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title: title,
      content: content,
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

// 显示操作菜单
function showActionSheet(itemList) {
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      itemList: itemList,
      success: (res) => {
        resolve(res.tapIndex)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 格式化日期
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second)
}

// 格式化时间（包含日期和时间）
function formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
  return formatDate(date, format)
}

// 格式化货币（金额）
function formatCurrency(amount, precision = 2, symbol = '¥') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${symbol}0.00`
  }
  
  const num = parseFloat(amount)
  const formatted = num.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  })
  return `${symbol}${formatted}`
}

// 格式化相对时间
function formatRelativeTime(date) {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return formatDate(d, 'MM-DD')
  } else if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

// 格式化金额
function formatMoney(amount, precision = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00'
  }
  
  const num = parseFloat(amount)
  
  // 如果金额超过1000，转换为万元单位
  if (num >= 1000) {
    const wanAmount = num / 10000
    return wanAmount.toLocaleString('zh-CN', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    }) + '万'
  }
  
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  })
}

// 格式化数字（添加千分位）
function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0'
  }
  return parseInt(num).toLocaleString('zh-CN')
}

// 格式化百分比
function formatPercent(value, precision = 1) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%'
  }
  return `${(parseFloat(value) * 100).toFixed(precision)}%`
}

// 验证手机号
function validatePhone(phone) {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(phone)
}

// 验证邮箱
function validateEmail(email) {
  const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return reg.test(email)
}

// 验证身份证号
function validateIdCard(idCard) {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return reg.test(idCard)
}

// 生成UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// 防抖函数
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 深拷贝
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item))
  }
  
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  
  return obj
}

// 获取设备信息
function getSystemInfo() {
  return new Promise((resolve) => {
    wx.getSystemInfo({
      success: (res) => {
        resolve(res)
      },
      fail: () => {
        resolve({})
      }
    })
  })
}

// 获取网络状态
function getNetworkType() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success: (res) => {
        resolve(res.networkType)
      },
      fail: () => {
        resolve('unknown')
      }
    })
  })
}

// 跳转到页面
function navigateTo(url, params = {}) {
  let queryString = ''
  if (Object.keys(params).length > 0) {
    queryString = '?' + Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
  }
  
  wx.navigateTo({
    url: url + queryString,
    fail: (err) => {
      console.error('页面跳转失败:', err)
      showToast('页面跳转失败', 'error')
    }
  })
}

// 返回上一页
function navigateBack(delta = 1) {
  wx.navigateBack({
    delta: delta,
    fail: () => {
      wx.switchTab({
        url: '/pages/index/index'
      })
    }
  })
}

// 切换到Tab页面
function switchTab(url) {
  wx.switchTab({
    url: url,
    fail: (err) => {
      console.error('Tab页面切换失败:', err)
    }
  })
}

// 重定向到页面
function redirectTo(url, params = {}) {
  let queryString = ''
  if (Object.keys(params).length > 0) {
    queryString = '?' + Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&')
  }
  
  wx.redirectTo({
    url: url + queryString,
    fail: (err) => {
      console.error('页面重定向失败:', err)
    }
  })
}

// 设置页面标题
function setNavigationBarTitle(title) {
  wx.setNavigationBarTitle({
    title: title
  })
}

// 显示分享菜单
function showShareMenu() {
  wx.showShareMenu({
    withShareTicket: true
  })
}

// 隐藏分享菜单
function hideShareMenu() {
  wx.hideShareMenu()
}

// 复制到剪贴板
function setClipboardData(data) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data: data,
      success: () => {
        showToast('复制成功')
        resolve(true)
      },
      fail: (err) => {
        showToast('复制失败', 'error')
        reject(err)
      }
    })
  })
}

// 获取剪贴板内容
function getClipboardData() {
  return new Promise((resolve, reject) => {
    wx.getClipboardData({
      success: (res) => {
        resolve(res.data)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 拨打电话
function makePhoneCall(phoneNumber) {
  wx.makePhoneCall({
    phoneNumber: phoneNumber,
    fail: (err) => {
      console.error('拨打电话失败:', err)
      showToast('拨打电话失败', 'error')
    }
  })
}

// 预览图片
function previewImage(current, urls = []) {
  wx.previewImage({
    current: current,
    urls: urls.length > 0 ? urls : [current]
  })
}

// 选择图片
function chooseImage(count = 1, sizeType = ['compressed'], sourceType = ['album', 'camera']) {
  return new Promise((resolve, reject) => {
    wx.chooseImage({
      count: count,
      sizeType: sizeType,
      sourceType: sourceType,
      success: (res) => {
        resolve(res.tempFilePaths)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 上传文件
function uploadFile(url, filePath, name = 'file', formData = {}) {
  return new Promise((resolve, reject) => {
    const uploadTask = wx.uploadFile({
      url: url,
      filePath: filePath,
      name: name,
      formData: formData,
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          resolve(data)
        } catch (e) {
          resolve(res.data)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
    
    return uploadTask
  })
}

// 下载文件
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath)
        } else {
          reject(new Error('下载失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 保存图片到相册
function saveImageToPhotosAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        showToast('保存成功')
        resolve(true)
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          showToast('请授权访问相册', 'error')
        } else {
          showToast('保存失败', 'error')
        }
        reject(err)
      }
    })
  })
}

// 震动反馈
function vibrateShort() {
  wx.vibrateShort({
    fail: () => {
      // 静默失败
    }
  })
}

// 长震动反馈
function vibrateLong() {
  wx.vibrateLong({
    fail: () => {
      // 静默失败
    }
  })
}

// 获取位置信息
function getLocation(type = 'wgs84') {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: type,
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          speed: res.speed,
          accuracy: res.accuracy
        })
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 打开地图选择位置
function chooseLocation() {
  return new Promise((resolve, reject) => {
    wx.chooseLocation({
      success: (res) => {
        resolve({
          name: res.name,
          address: res.address,
          latitude: res.latitude,
          longitude: res.longitude
        })
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 打开地图查看位置
function openLocation(latitude, longitude, name = '', address = '') {
  wx.openLocation({
    latitude: latitude,
    longitude: longitude,
    name: name,
    address: address,
    fail: (err) => {
      console.error('打开地图失败:', err)
      showToast('打开地图失败', 'error')
    }
  })
}

// 获取微信运动步数
function getWeRunData() {
  return new Promise((resolve, reject) => {
    wx.getWeRunData({
      success: (res) => {
        resolve(res.encryptedData)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

// 数组去重
function uniqueArray(arr, key = null) {
  if (!Array.isArray(arr)) return []
  
  if (key) {
    const seen = new Map()
    return arr.filter(item => {
      const value = item[key]
      if (seen.has(value)) {
        return false
      }
      seen.set(value, true)
      return true
    })
  }
  
  return [...new Set(arr)]
}

// 数组排序
function sortArray(arr, key = null, order = 'asc') {
  if (!Array.isArray(arr)) return []
  
  return arr.sort((a, b) => {
    let valueA = key ? a[key] : a
    let valueB = key ? b[key] : b
    
    // 处理数字类型
    if (typeof valueA === 'string' && !isNaN(valueA)) {
      valueA = parseFloat(valueA)
    }
    if (typeof valueB === 'string' && !isNaN(valueB)) {
      valueB = parseFloat(valueB)
    }
    
    if (order === 'desc') {
      return valueB > valueA ? 1 : valueB < valueA ? -1 : 0
    } else {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
    }
  })
}

// 检查是否为空值
function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// 安全的JSON解析
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str)
  } catch (e) {
    console.warn('JSON解析失败:', e)
    return defaultValue
  }
}

// 安全的JSON字符串化
function safeJsonStringify(obj, defaultValue = '{}') {
  try {
    return JSON.stringify(obj)
  } catch (e) {
    console.warn('JSON字符串化失败:', e)
    return defaultValue
  }
}

// 导出所有工具函数
module.exports = {
  // UI工具
  showToast,
  showLoading,
  hideLoading,
  showConfirm,
  showActionSheet,
  
  // 格式化工具
  formatDate,
  formatRelativeTime,
  formatMoney,
  formatNumber,
  formatPercent,
  formatTime,
  formatCurrency,
  
  // 验证工具
  validatePhone,
  validateEmail,
  validateIdCard,
  
  // 通用工具
  generateUUID,
  debounce,
  throttle,
  deepClone,
  
  // 系统工具
  getSystemInfo,
  getNetworkType,
  
  // 导航工具
  navigateTo,
  navigateBack,
  switchTab,
  redirectTo,
  setNavigationBarTitle,
  
  // 分享工具
  showShareMenu,
  hideShareMenu,
  
  // 剪贴板工具
  setClipboardData,
  getClipboardData,
  
  // 设备功能
  makePhoneCall,
  vibrateShort,
  vibrateLong,
  
  // 媒体工具
  previewImage,
  chooseImage,
  uploadFile,
  downloadFile,
  saveImageToPhotosAlbum,
  
  // 位置工具
  getLocation,
  chooseLocation,
  openLocation,
  
  // 微信功能
  getWeRunData,
  
  // 数据处理工具
  uniqueArray,
  sortArray,
  isEmpty,
  safeJsonParse,
  safeJsonStringify
} 
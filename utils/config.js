// 全局配置文件

// 开发环境
const isDev = false;

// API 配置
const apiConfig = {
  // API 基础路径 - 小程序端专用路径
  baseURL: isDev ? 'http://localhost:8000/api/v1/mini' : 'https://dyh.zytcft.com/power/api/v1/mini',
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 上传文件大小限制（字节）
  maxFileSize: 10 * 1024 * 1024, // 10MB
  
  // 允许上传的文件类型
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // 图片压缩配置
  imageCompressOptions: {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920
  }
}

// 缓存配置
const cacheConfig = {
  // 默认缓存时间（毫秒）
  defaultExpireTime: 24 * 60 * 60 * 1000, // 24小时
  
  // 最大缓存数量
  maxCacheItems: 100,
  
  // 自动清理间隔（毫秒）
  cleanInterval: 60 * 60 * 1000 // 1小时
}

// 用户配置
const userConfig = {
  // 用户信息过期时间（毫秒）
  userInfoExpireTime: 7 * 24 * 60 * 60 * 1000, // 7天
  
  // Token 过期时间（毫秒）
  tokenExpireTime: 30 * 24 * 60 * 60 * 1000, // 30天
  
  // 自动登录过期时间（毫秒）
  autoLoginExpireTime: 90 * 24 * 60 * 60 * 1000 // 90天
}

// 应用配置
const appConfig = {
  // 应用名称
  appName: '电力销售小程序',
  
  // 应用版本
  version: '1.0.0',
  
  // 主题配置
  theme: {
    primaryColor: '#1890ff',
    successColor: '#52c41a',
    warningColor: '#faad14',
    errorColor: '#f5222d',
    textColor: '#333333',
    backgroundColor: '#f5f5f5'
  },
  
  // 分页配置
  pagination: {
    pageSize: 10,
    maxPageSize: 50
  },
  
  // 列表配置
  list: {
    loadMoreThreshold: 50, // 距底部多少像素触发加载更多
    defaultPageSize: 10
  },
  
  // 图片配置
  image: {
    defaultAvatar: '/assets/images/default-avatar.png',
    defaultCover: '/assets/images/default-cover.png',
    defaultThumbnail: '/assets/images/default-thumbnail.png'
  }
}

// 业务配置
const businessConfig = {
  // 客户状态
  customerStatus: {
    POTENTIAL: 'potential', // 潜在客户
    FOLLOWING: 'following', // 跟进中
    SIGNED: 'signed', // 已签约
    LOST: 'lost' // 已流失
  },
  
  // 订单状态
  orderStatus: {
    PENDING: 'pending', // 待处理
    PROCESSING: 'processing', // 处理中
    COMPLETED: 'completed', // 已完成
    CANCELLED: 'cancelled' // 已取消
  },
  
  // 产品类型
  productTypes: {
    DEVICE: 'device', // 设备
    SERVICE: 'service', // 服务
    SOLUTION: 'solution' // 解决方案
  },
  
  // 支付方式
  paymentMethods: {
    WECHAT: 'wechat', // 微信支付
    ALIPAY: 'alipay', // 支付宝
    BANK_TRANSFER: 'bank_transfer' // 银行转账
  }
}

// 正则表达式配置
const regexConfig = {
  // 手机号码
  phone: /^1[3-9]\d{9}$/,
  
  // 邮箱
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // 身份证号
  idCard: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
  
  // 密码（至少包含数字和字母，长度8-20位）
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/,
  
  // URL
  url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
  
  // 金额（最多两位小数）
  money: /^\d+(\.\d{1,2})?$/
}

// 错误信息配置
const errorConfig = {
  network: {
    timeout: '请求超时，请检查网络连接',
    offline: '网络连接失败，请检查网络设置',
    error: '网络请求失败，请稍后重试'
  },
  
  auth: {
    invalid: '登录已失效，请重新登录',
    unauthorized: '您没有权限访问此功能',
    loginRequired: '请先登录后再操作'
  },
  
  form: {
    required: '请填写必填项',
    invalid: '输入格式不正确',
    confirm: '两次输入不一致'
  },
  
  file: {
    sizeExceed: '文件大小超出限制',
    typeNotAllowed: '不支持的文件类型',
    uploadFailed: '文件上传失败'
  }
}

// 导出所有配置
module.exports = {
  isDev,
  apiConfig,
  cacheConfig,
  userConfig,
  appConfig,
  businessConfig,
  regexConfig,
  errorConfig
} 
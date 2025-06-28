// 环境配置管理工具

// 环境类型
const ENV_TYPES = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
}

// 当前环境（可以通过修改这个值来切换环境）
const CURRENT_ENV = ENV_TYPES.DEVELOPMENT

// 环境配置
const envConfigs = {
  [ENV_TYPES.DEVELOPMENT]: {
    apiBaseURL: 'http://localhost:8000/mini',
    enableDebug: true,
    enableMock: true,
    logLevel: 'debug'
  },
  [ENV_TYPES.PRODUCTION]: {
    apiBaseURL: 'https://dyh.zytcft.com/power/mini',
    enableDebug: false,
    enableMock: false,
    logLevel: 'error'
  }
}

// 获取当前环境配置
function getCurrentConfig() {
  return envConfigs[CURRENT_ENV] || envConfigs[ENV_TYPES.DEVELOPMENT]
}

// 判断是否为开发环境
function isDevelopment() {
  return CURRENT_ENV === ENV_TYPES.DEVELOPMENT
}

// 判断是否为生产环境
function isProduction() {
  return CURRENT_ENV === ENV_TYPES.PRODUCTION
}

// 获取API基础URL
function getApiBaseURL() {
  return getCurrentConfig().apiBaseURL
}

// 是否启用调试模式
function isDebugEnabled() {
  return getCurrentConfig().enableDebug
}

// 是否启用Mock数据
function isMockEnabled() {
  return getCurrentConfig().enableMock
}

// 日志级别
function getLogLevel() {
  return getCurrentConfig().logLevel
}

// 控制台日志（只在开发环境显示）
function log(...args) {
  if (isDebugEnabled()) {
    console.log('[PowerSales]', ...args)
  }
}

function warn(...args) {
  if (isDebugEnabled()) {
    console.warn('[PowerSales]', ...args)
  }
}

function error(...args) {
  console.error('[PowerSales]', ...args)
}

module.exports = {
  ENV_TYPES,
  CURRENT_ENV,
  getCurrentConfig,
  isDevelopment,
  isProduction,
  getApiBaseURL,
  isDebugEnabled,
  isMockEnabled,
  getLogLevel,
  log,
  warn,
  error
} 
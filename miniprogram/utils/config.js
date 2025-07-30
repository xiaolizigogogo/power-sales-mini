// 开发环境配置
const devConfig = {
  apiBaseUrl: 'http://localhost:8000/api/v1/mini',
  env: 'dev'
};

// 生产环境配置
const prodConfig = {
  apiBaseUrl: 'https://dyh.zytcft.com/power/api/v1/mini',
  env: 'prod'
};

// 根据环境选择配置
const isDev = false; // 使用生产环境
const config = isDev ? devConfig : prodConfig;

// API 配置对象 - 与 api.js 中的引用保持一致
const apiConfig = {
  baseURL: config.apiBaseUrl,
  timeout: 10000
};

module.exports = {
  ...config,
  apiConfig
}; 
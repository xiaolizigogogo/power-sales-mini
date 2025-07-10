// 开发环境配置
const devConfig = {
  apiBaseUrl: 'http://localhost:8080',
  env: 'dev'
};

// 生产环境配置
const prodConfig = {
  apiBaseUrl: 'https://api.example.com',
  env: 'prod'
};

// 根据环境选择配置
const isDev = true; // 可以根据实际情况修改
const config = isDev ? devConfig : prodConfig;

module.exports = config; 
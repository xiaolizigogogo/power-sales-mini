const config = require('./config');
const { getToken } = require('./auth');

/**
 * 统一请求处理
 * @param {Object} options 请求配置
 * @returns {Promise} 请求结果
 */
const request = (options) => {
  const { url, method = 'GET', data = {}, header = {}, ...rest } = options;

  // 获取完整URL
  const baseUrl = config.apiBaseUrl || '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  // 获取token
  const token = getToken();
  const defaultHeader = {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  return new Promise((resolve, reject) => {
    wx.request({
      url: fullUrl,
      method: method.toUpperCase(),
      data,
      header: { ...defaultHeader, ...header },
      ...rest,
      success: (res) => {
        const { data: responseData, statusCode } = res;
        
        // 请求成功
        if (statusCode >= 200 && statusCode < 300) {
          resolve(responseData);
          return;
        }

        // 未授权
        if (statusCode === 401) {
          // 可以在这里处理token过期等情况
          wx.navigateTo({
            url: '/pages/auth/login/login'
          });
          reject(new Error('未授权或登录已过期'));
          return;
        }

        // 其他错误
        reject(new Error(responseData.message || '请求失败'));
      },
      fail: (error) => {
        console.error('请求失败:', error);
        reject(new Error('网络请求失败'));
      }
    });
  });
};

module.exports = {
  request
}; 
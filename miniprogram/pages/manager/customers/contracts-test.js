// pages/manager/customers/contracts-test.js
const { customerAPI } = require('../../../utils/api');

Page({
  data: {
    customerId: 43,
    testResult: '',
    loading: false
  },

  onLoad() {
    this.testContractAPI();
  },

  async testContractAPI() {
    this.setData({ loading: true, testResult: '开始测试...' });
    
    try {
      console.log('开始测试合同列表API');
      // 获取当前登录人id
      const userInfo = wx.getStorageSync('userInfo');
      const managerId = userInfo && userInfo.id ? userInfo.id : (userInfo && userInfo.data && userInfo.data.id ? userInfo.data.id : null);
      const response = await customerAPI.getUserContracts(this.data.customerId, {
        page: 1,
        pageSize: 10,
        managerId // 新增managerId参数
      });
      
      console.log('API响应:', response);
      
      this.setData({
        testResult: JSON.stringify(response, null, 2),
        loading: false
      });
      
    } catch (error) {
      console.error('测试失败:', error);
      this.setData({
        testResult: `测试失败: ${error.message}`,
        loading: false
      });
    }
  },

  onRetry() {
    this.testContractAPI();
  }
}); 
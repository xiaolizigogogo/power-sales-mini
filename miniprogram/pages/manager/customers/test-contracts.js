// 合同列表测试页面
const app = getApp();
const apiService = require('../../../utils/api').apiService;

Page({
  data: {
    customerId: '1', // 测试客户ID
    contracts: [],
    loading: false,
    testResults: []
  },

  onLoad() {
    console.log('合同列表测试页面加载完成');
    this.testContractAPI();
  },

  async testContractAPI() {
    this.setData({ loading: true });
    const results = [];

    // 测试1: 获取客户合同列表
    console.log('=== 测试1: 获取客户合同列表 ===');
    try {
      const result = await apiService.get(`/mini/manager/customers/${this.data.customerId}/contracts`, {
        page: 1,
        pageSize: 10
      });
      
      console.log('✅ 客户合同列表API调用成功:', result);
      results.push({
        test: '获取客户合同列表',
        status: 'success',
        data: result
      });

      if (result.code === 200 && result.data && result.data.records) {
        this.setData({
          contracts: result.data.records
        });
      }
    } catch (error) {
      console.error('❌ 客户合同列表API调用失败:', error);
      results.push({
        test: '获取客户合同列表',
        status: 'error',
        error: error.message
      });
    }

    // 测试2: 检查token
    console.log('=== 测试2: 检查token ===');
    const token = wx.getStorageSync('token');
    results.push({
      test: '检查token',
      status: token ? 'success' : 'error',
      data: token ? '有token' : '没有token'
    });

    // 测试3: 检查用户信息
    console.log('=== 测试3: 检查用户信息 ===');
    const userInfo = wx.getStorageSync('userInfo');
    results.push({
      test: '检查用户信息',
      status: userInfo ? 'success' : 'error',
      data: userInfo || '没有用户信息'
    });

    this.setData({
      testResults: results,
      loading: false
    });
  },

  // 手动重新测试
  onRetestTap() {
    this.setData({ 
      testResults: [],
      contracts: []
    });
    this.testContractAPI();
  },

  // 查看合同详情
  onViewContract(e) {
    const contractId = e.currentTarget.dataset.id;
    console.log('查看合同详情:', contractId);
    
    wx.showModal({
      title: '合同详情',
      content: `合同ID: ${contractId}\n功能开发中...`,
      showCancel: false
    });
  },

  // 签署合同
  onSignContract(e) {
    const contractId = e.currentTarget.dataset.id;
    const contractNo = e.currentTarget.dataset.contractNo;
    
    wx.showModal({
      title: '确认签署',
      content: `确定要签署合同 ${contractNo} 吗？`,
      success: (res) => {
        if (res.confirm) {
          this.signContract(contractId);
        }
      }
    });
  },

  // 签署合同API调用
  async signContract(contractId) {
    try {
      wx.showLoading({
        title: '签署中...',
        mask: true
      });
      
      const res = await apiService.put(`/mini/manager/contracts/${contractId}/sign`, {
        remarks: '客户经理签署'
      });
      
      if (res.code === 200) {
        wx.showToast({
          title: '签署成功',
          icon: 'success'
        });
        
        // 重新加载合同列表
        this.testContractAPI();
      }
    } catch (error) {
      console.error('签署合同失败:', error);
      wx.showToast({
        title: '签署失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 
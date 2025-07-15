const { api, apiService } = require('../../../utils/api');
const util = require('../../../utils/common');
const app = getApp();

// 调试信息：检查导入的模块
console.log('=== 订单详情页面模块导入 ===');
console.log('📦 api模块:', api);
console.log('📦 api模块类型:', typeof api);
console.log('📦 api模块方法:', Object.keys(api));
console.log('📦 util模块:', util);
console.log('📦 util模块类型:', typeof util);
console.log('📦 util模块方法:', Object.keys(util));
console.log('📦 app模块:', app);
console.log('📦 app模块类型:', typeof app);
console.log('📦 app全局数据:', app.globalData);
console.log('=== 模块导入完成 ===');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: true,
    refreshing: false,
    
    // 订单状态流程配置
    statusFlow: [
      { key: 'pending', name: '待确认', icon: 'pending' },
      { key: 'negotiating', name: '商务洽谈', icon: 'chat' },
      { key: 'confirmed', name: '已确认', icon: 'success' },
      { key: 'contract', name: '合同签署', icon: 'contract' },
      { key: 'active', name: '服务中', icon: 'service' },
      { key: 'completed', name: '已完成', icon: 'completed' }
    ],

    // 服务数据
    serviceData: {
      monthlyUsage: 0,
      monthlySavings: 0,
      totalSavings: 0
    },

    // 操作确认弹窗
    showConfirmDialog: false,
    confirmDialog: {
      title: '',
      message: '',
      action: ''
    },

    // 联系服务经理操作表
    showContactSheet: false,
    contactActions: [
      { name: '拨打电话', value: 'call' },
      { name: '发送短信', value: 'sms' },
      { name: '微信联系', value: 'wechat' }
    ],

    // 支付方式选择
    showPaymentSheet: false,
    paymentMethods: [
      { 
        name: '微信支付', 
        value: 'wechat', 
        icon: '/images/payment/wechat.png',
        desc: '推荐使用，安全便捷'
      },
      { 
        name: '支付宝', 
        value: 'alipay', 
        icon: '/images/payment/alipay.png',
        desc: '支持花呗分期付款'
      },
      { 
        name: '银行卡支付', 
        value: 'bank', 
        icon: '/images/payment/bank.png',
        desc: '支持储蓄卡和信用卡'
      }
    ],

    // 合同预览
    showContractPreview: false,
    contractUrl: '',

    statusMap: {
      'pending': '待处理',
      'negotiating': '商务洽谈中',
      'confirmed': '已确认',
      'contract': '待签约',
      'paid': '已支付',
      'service': '服务中',
      'active': '服务中',
      'completed': '已完成',
      'cancelled': '已取消',
      'rejected': '已拒绝'
    },
    statusColorMap: {
      'pending': '#ff9500',
      'negotiating': '#007aff',
      'confirmed': '#34c759',
      'paid': '#30d158',
      'service': '#0066cc',
      'completed': '#28a745',
      'cancelled': '#ff3b30',
      'rejected': '#ff3b30'
    },
    isManager: false, // 是否为客户经理
    showNegotiationPopup: false,
    negotiationForm: {
      content: '',
      files: []
    },
    submitting: false
  },

  onLoad(options) {
    console.log('=== 订单详情页面加载 ===');
    console.log('页面参数:', options);
    
    if (options.id) {
      console.log('✅ 订单ID存在:', options.id);
      this.setData({ orderId: options.id });
      
      // 只调用必要的API
      this.loadOrderDetail();
      this.checkUserRole();
    } else {
      console.error('❌ 订单ID不存在');
      this.showError('订单ID不能为空');
    }
  },

  onShow() {
    console.log('=== 订单详情页面显示 ===');
    // 移除重复的API调用，只在首次加载时调用
    if (!this.data.orderInfo || !this.data.orderInfo.id) {
      if (this.data.orderId) {
        this.loadOrderDetail();
      }
    }
  },

  onPullDownRefresh() {
    this.refreshOrderDetail();
  },

  onShareAppMessage() {
    const orderInfo = this.data.orderInfo;
    return {
      title: `我的订单 - ${orderInfo?.productName || '电力服务'}`,
      path: `/pages/orders/detail/detail?id=${this.data.orderId}`,
      imageUrl: orderInfo?.productImage || '/images/share/order.png'
    };
  },

  // 加载订单详情
  async loadOrderDetail() {
    console.log('=== 开始加载订单详情 ===');
    console.log('订单ID:', this.data.orderId);
    console.log('API对象:', api);
    console.log('getOrderDetail方法:', api.getOrderDetail);
    console.log('getOrderDetail方法类型:', typeof api.getOrderDetail);
    console.log('API对象的所有方法:', Object.keys(api));
    
    try {
      this.setData({ loading: true });
      
      // 检查API方法是否存在
      if (typeof api.getOrderDetail !== 'function') {
        console.error('❌ getOrderDetail方法不存在');
        console.error('尝试使用orderAPI.getOrderDetail');
        if (typeof api.orderAPI?.getOrderDetail === 'function') {
          console.log('✅ 使用orderAPI.getOrderDetail');
          const response = await api.orderAPI.getOrderDetail(this.data.orderId);
          console.log('orderAPI响应:', response);
        } else {
          console.error('❌ orderAPI.getOrderDetail也不存在');
          throw new Error('getOrderDetail方法未找到');
        }
      } else {
        console.log('✅ 调用api.getOrderDetail');
        console.log('调用参数:', this.data.orderId);
        
        const startTime = Date.now();
        const response = await api.getOrderDetail(this.data.orderId);
        const endTime = Date.now();
        
        console.log('⏱️ API调用耗时:', endTime - startTime, 'ms');
        console.log('📡 API响应:', response);
        console.log('📡 API响应类型:', typeof response);
        console.log('📡 API响应结构:', {
          hasData: !!response,
          hasSuccess: response && 'success' in response,
          hasCode: response && 'code' in response,
          hasData: response && 'data' in response,
          responseKeys: response ? Object.keys(response) : 'null'
        });
        
        // 兼容不同的响应格式
        const isSuccess = response && (
          (response.success === true) || 
          (response.code === 200) || 
          (response.code === 0)
        );
        
        if (isSuccess) {
          console.log('✅ API调用成功');
          const orderData = response.data || response;
          console.log('📦 订单数据:', orderData);
          console.log('📦 订单数据类型:', typeof orderData);
          console.log('📦 订单数据字段:', orderData ? Object.keys(orderData) : 'null');
          
          const orderInfo = this.processOrderData(orderData);
          console.log('🔄 处理后的订单信息:', orderInfo);
          console.log('🔄 处理后的订单信息字段:', Object.keys(orderInfo));
          
          this.setData({ 
            orderInfo,
            loading: false 
          });
          console.log('✅ 页面数据更新完成');
          
          // 设置页面标题
          wx.setNavigationBarTitle({
            title: `订单详情 - ${orderInfo.orderNo}`
          });
          console.log('✅ 页面标题设置完成:', `订单详情 - ${orderInfo.orderNo}`);

          // 如果订单状态为服务中，加载服务数据
          if (orderInfo.status === 'service' || orderInfo.status === 'completed') {
            console.log('🔄 订单状态为服务中，开始加载服务数据');
            this.loadServiceData();
          } else {
            console.log('ℹ️ 订单状态不是服务中，跳过服务数据加载:', orderInfo.status);
          }
        } else {
          console.error('❌ API返回错误');
          console.error('响应内容:', response);
          const errorMsg = response?.message || response?.msg || '获取订单详情失败';
          console.error('错误信息:', errorMsg);
          this.showError(errorMsg);
        }
      }
    } catch (error) {
      console.error('❌ 加载订单详情失败:', error);
      console.error('❌ 错误类型:', error.constructor.name);
      console.error('❌ 错误消息:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
      console.error('❌ 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        orderId: this.data.orderId,
        apiMethod: typeof api.getOrderDetail
      });
      this.showError(`网络错误: ${error.message}`);
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
      console.log('=== 订单详情加载完成 ===');
    }
  },

  // 加载服务数据
  async loadServiceData() {
    console.log('=== 开始加载服务数据 ===');
    console.log('订单ID:', this.data.orderId);
    console.log('API对象:', api);
    console.log('getServiceData方法:', api.getServiceData);
    console.log('getServiceData方法类型:', typeof api.getServiceData);
    console.log('API对象的所有方法:', Object.keys(api));
    
    try {
      // 检查是否有getServiceData方法
      if (typeof api.getServiceData === 'function') {
        console.log('✅ 调用api.getServiceData');
        console.log('调用参数:', this.data.orderId);
        
        const startTime = Date.now();
        const response = await api.getServiceData(this.data.orderId);
        const endTime = Date.now();
        
        console.log('⏱️ 服务数据API调用耗时:', endTime - startTime, 'ms');
        console.log('📡 服务数据响应:', response);
        console.log('📡 服务数据响应类型:', typeof response);
        console.log('📡 服务数据响应结构:', {
          hasData: !!response,
          hasSuccess: response && 'success' in response,
          hasCode: response && 'code' in response,
          hasData: response && 'data' in response,
          responseKeys: response ? Object.keys(response) : 'null'
        });
        
        // 兼容不同的响应格式
        const isSuccess = response && (
          (response.success === true) || 
          (response.code === 200) || 
          (response.code === 0)
        );
        
        if (isSuccess) {
          console.log('✅ 服务数据API调用成功');
          const serviceData = response.data || response;
          console.log('📊 服务数据:', serviceData);
          console.log('📊 服务数据类型:', typeof serviceData);
          console.log('📊 服务数据字段:', serviceData ? Object.keys(serviceData) : 'null');
          
          this.setData({ 
            serviceData: serviceData 
          });
          console.log('✅ 服务数据设置完成');
        } else {
          console.error('❌ 获取服务数据失败');
          console.error('响应内容:', response);
          throw new Error(response?.message || '获取服务数据失败');
        }
      } else {
        console.log('⚠️ getServiceData方法不存在，使用模拟数据');
        console.log('⚠️ 可用的API方法:', Object.keys(api).filter(key => key.includes('Service') || key.includes('Data')));
        throw new Error('getServiceData方法未实现');
      }
    } catch (error) {
      console.error('❌ 加载服务数据失败:', error);
      console.error('❌ 错误类型:', error.constructor.name);
      console.error('❌ 错误消息:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
      console.error('❌ 使用模拟数据');
      
      // 使用模拟数据
      const mockServiceData = {
        monthlyUsage: 12500,
        monthlySavings: 3200,
        totalSavings: 15600
      };
      
      console.log('📊 设置模拟服务数据:', mockServiceData);
      this.setData({
        serviceData: mockServiceData
      });
      console.log('✅ 模拟服务数据设置完成');
    }
    console.log('=== 服务数据加载完成 ===');
  },

  // 刷新订单详情
  async refreshOrderDetail() {
    this.setData({ refreshing: true });
    await this.loadOrderDetail();
    this.setData({ refreshing: false });
  },

  // 处理订单数据
  processOrderData(orderData) {
    const util = require('../../../utils/common');
    
    // 格式化时间
    if (orderData.createdAt) {
      orderData.createTimeFormatted = util.formatTime(new Date(orderData.createdAt), 'YYYY-MM-DD HH:mm');
    }
    
    if (orderData.updatedAt) {
      orderData.updateTimeFormatted = util.formatTime(new Date(orderData.updatedAt), 'YYYY-MM-DD HH:mm');
    }
    
    if (orderData.serviceStartDate) {
      orderData.serviceStartDateFormatted = util.formatTime(new Date(orderData.serviceStartDate), 'YYYY-MM-DD');
    }
    
    if (orderData.serviceEndDate) {
      orderData.serviceEndDateFormatted = util.formatTime(new Date(orderData.serviceEndDate), 'YYYY-MM-DD');
    }
    
    // 格式化金额
    if (orderData.amount) {
      orderData.amountFormatted = util.formatCurrency(orderData.amount);
    }
    
    // 初始化默认值
    if (!orderData.negotiations) {
      orderData.negotiations = [];
    }
    
    return orderData;
  },

  // 格式化手机号
  formatPhone(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
  },

  // 取消订单
  onCancelOrder() {
    const that = this;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success(res) {
        if (res.confirm) {
          that.cancelOrder();
        }
      }
    });
  },

  // 确认对话框操作
  async onConfirmDialogConfirm() {
    const action = this.data.confirmDialog.action;
    this.setData({ showConfirmDialog: false });

    if (action === 'cancel') {
      await this.cancelOrder();
    }
  },

  // 取消确认对话框
  onConfirmDialogCancel() {
    this.setData({ showConfirmDialog: false });
  },

  // 执行取消订单
  async cancelOrder() {
    try {
      wx.showLoading({ title: '取消中...' });
      
      console.log('🚀 开始取消订单，订单ID:', this.data.orderId);
      
      const response = await api.cancelOrder(this.data.orderId);
      
      console.log('📡 取消订单API响应:', response);
      console.log('📡 响应类型:', typeof response);
      console.log('📡 响应结构:', {
        hasCode: response && 'code' in response,
        hasSuccess: response && 'success' in response,
        hasData: response && 'data' in response,
        hasMessage: response && 'message' in response,
        responseKeys: response ? Object.keys(response) : 'null'
      });
      
      // 兼容不同的响应格式
      const isSuccess = response && (
        response.code === 200 || 
        response.code === 0 || 
        response.success === true
      );
      
      console.log('✅ 判断结果:', { isSuccess, code: response?.code, success: response?.success });
      
      if (isSuccess) {
        wx.showToast({
          title: '订单已取消',
          icon: 'success'
        });
        
        console.log('🔄 开始刷新订单信息');
        // 刷新订单信息
        await this.loadOrderDetail();
        
        console.log('🔄 触发父页面刷新');
        // 触发父页面刷新
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage) {
          console.log('🔄 父页面存在，调用刷新方法');
          if (typeof prevPage.refreshOrderList === 'function') {
            prevPage.refreshOrderList();
          } else if (typeof prevPage.loadOrders === 'function') {
            prevPage.loadOrders(true);
          } else if (typeof prevPage.onShow === 'function') {
            prevPage.onShow();
          }
        }
      } else {
        const errorMessage = response?.message || '取消失败';
        console.error('❌ 取消订单失败:', errorMessage);
        wx.showToast({
          title: errorMessage,
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('❌ 取消订单异常:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 支付订单
  onPayOrder() {
    wx.showToast({
      title: '跳转支付页面',
      icon: 'none'
    });
    // TODO: 实现支付功能
  },

  // 支付方式选择
  onPaymentMethodSelect(e) {
    const method = e.currentTarget.dataset.method;
    this.setData({ showPaymentSheet: false });
    this.processPayment(method);
  },

  // 取消支付选择
  onPaymentSheetCancel() {
    this.setData({ showPaymentSheet: false });
  },

  // 处理支付
  async processPayment(method) {
    try {
      wx.showLoading({ title: '发起支付...' });
      
      const response = await api.createPayment({
        orderId: this.data.orderId,
        paymentMethod: method
      });
      
      if (response.success) {
        if (method === 'wechat') {
          // 微信支付
          await this.processWechatPayment(response.data);
        } else if (method === 'alipay') {
          // 支付宝支付
          this.processAlipayPayment(response.data);
        } else if (method === 'bank') {
          // 银行卡支付
          this.processBankPayment(response.data);
        }
      } else {
        wx.showToast({
          title: response.message || '支付发起失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('支付处理失败:', error);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 微信支付处理
  async processWechatPayment(paymentData) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: paymentData.timeStamp,
        nonceStr: paymentData.nonceStr,
        package: paymentData.package,
        signType: paymentData.signType,
        paySign: paymentData.paySign,
        success: (res) => {
          wx.showToast({
            title: '支付成功',
            icon: 'success'
          });
          this.loadOrderDetail(); // 刷新订单状态
          resolve(res);
        },
        fail: (res) => {
          if (res.errMsg !== 'requestPayment:fail cancel') {
            wx.showToast({
              title: '支付失败',
              icon: 'none'
            });
          }
          reject(res);
        }
      });
    });
  },

  // 支付宝支付处理
  processAlipayPayment(paymentData) {
    wx.showToast({
      title: '暂不支持支付宝',
      icon: 'none'
    });
  },

  // 银行卡支付处理
  processBankPayment(paymentData) {
    wx.navigateTo({
      url: `/pages/payment/bank/bank?orderId=${this.data.orderId}`
    });
  },

  // 联系服务经理
  onContactManager() {
    wx.showToast({
      title: '联系客服功能',
      icon: 'none'
    });
    // TODO: 实现联系客服功能
  },

  // 联系方式选择
  onContactMethodSelect(e) {
    const method = e.currentTarget.dataset.method;
    const managerInfo = this.data.orderInfo.managerInfo;
    
    this.setData({ showContactSheet: false });

    switch (method) {
      case 'call':
        wx.makePhoneCall({
          phoneNumber: managerInfo.phone,
          fail: (res) => {
            wx.showToast({
              title: '拨打失败',
              icon: 'none'
            });
          }
        });
        break;
      case 'sms':
        wx.showToast({
          title: '短信功能开发中',
          icon: 'none'
        });
        break;
      case 'wechat':
        wx.showToast({
          title: '微信联系功能开发中',
          icon: 'none'
        });
        break;
    }
  },

  // 取消联系选择
  onContactSheetCancel() {
    this.setData({ showContactSheet: false });
  },

  // 查看合同
  onViewContract() {
    wx.showToast({
      title: '查看合同功能',
      icon: 'none'
    });
    // TODO: 实现查看合同功能
  },

  // 再次购买
  onBuyAgain() {
    const productId = this.data.orderInfo.productId;
    if (productId) {
      wx.navigateTo({
        url: `/pages/products/detail/detail?id=${productId}`
      });
    }
  },

  // 申请退款
  onRequestRefund() {
    wx.navigateTo({
      url: `/pages/refund/apply/apply?orderId=${this.data.orderId}`
    });
  },

  // 查看物流
  onViewLogistics() {
    wx.navigateTo({
      url: `/pages/logistics/detail/detail?orderId=${this.data.orderId}`
    });
  },

  // 评价订单
  onEvaluateOrder() {
    wx.navigateTo({
      url: `/pages/evaluation/create/create?orderId=${this.data.orderId}`
    });
  },

  // 复制订单号
  onCopyOrderNo() {
    wx.setClipboardData({
      data: this.data.orderInfo.orderNo,
      success: () => {
        wx.showToast({
          title: '订单号已复制',
          icon: 'success'
        });
      }
    });
  },

  // 复制联系方式
  onCopyPhone() {
    const phone = this.data.orderInfo.managerInfo?.phone;
    if (phone) {
      wx.setClipboardData({
        data: phone,
        success: () => {
          wx.showToast({
            title: '电话号码已复制',
            icon: 'success'
          });
        }
      });
    }
  },

  // 显示错误信息
  showError(message) {
    console.error('=== 显示错误信息 ===');
    console.error('❌ 错误消息:', message);
    console.error('❌ 错误时间:', new Date().toISOString());
    console.error('❌ 当前页面:', getCurrentPages()[getCurrentPages().length - 1].route);
    console.error('❌ 当前订单ID:', this.data.orderId);
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    });
    
    // 如果是严重错误，返回上一页
    setTimeout(() => {
      console.log('🔄 3秒后自动返回上一页');
      wx.navigateBack();
    }, 2000);
  },

  // 检查用户角色
  async checkUserRole() {
    console.log('=== 开始检查用户角色 ===');
    console.log('API对象:', api);
    console.log('getUserInfo方法:', api.getUserInfo);
    console.log('getUserInfo方法类型:', typeof api.getUserInfo);
    console.log('API对象的所有方法:', Object.keys(api));
    
    try {
      console.log('✅ 调用api.getUserInfo');
      const startTime = Date.now();
      const response = await api.getUserInfo();
      const endTime = Date.now();
      
      console.log('⏱️ 用户信息API调用耗时:', endTime - startTime, 'ms');
      console.log('📡 用户信息响应:', response);
      console.log('📡 用户信息响应类型:', typeof response);
              console.log('📡 用户信息响应结构:', {
          hasData: !!response,
          hasSuccess: response && 'success' in response,
          hasCode: response && 'code' in response,
          hasData: response && 'data' in response,
          responseKeys: response ? Object.keys(response) : 'null'
        });
        
        // 兼容不同的响应格式
        const isSuccess = response && (
          (response.success === true) || 
          (response.code === 200) || 
          (response.code === 0)
        );
        
                if (isSuccess) {
          console.log('✅ 用户信息API调用成功');
          const userInfo = response.data || response;
        console.log('👤 用户信息:', userInfo);
        console.log('👤 用户信息类型:', typeof userInfo);
        console.log('👤 用户信息字段:', userInfo ? Object.keys(userInfo) : 'null');
        console.log('👤 用户角色:', userInfo.role);
        console.log('👤 用户ID:', userInfo.id);
        console.log('👤 用户姓名:', userInfo.name);
        
        const isManager = userInfo.role === 'manager' || userInfo.role === 'admin';
        console.log('👤 是否为管理员:', isManager);
        
        this.setData({
          isManager: isManager
        });
        console.log('✅ 用户角色设置完成:', isManager);
      } else {
        console.error('❌ 获取用户信息失败');
        console.error('响应内容:', response);
        console.error('错误信息:', response?.message);
      }
    } catch (error) {
      console.error('❌ 检查用户角色失败:', error);
      console.error('❌ 错误类型:', error.constructor.name);
      console.error('❌ 错误消息:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
      console.error('❌ 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        apiMethod: typeof api.getUserInfo
      });
    }
    console.log('=== 用户角色检查完成 ===');
  },

  // 显示商务洽谈弹窗
  showNegotiation() {
    this.setData({
      showNegotiationPopup: true
    })
  },

  // 关闭商务洽谈弹窗
  closeNegotiation() {
    this.setData({
      showNegotiationPopup: false,
      'negotiationForm.content': '',
      'negotiationForm.files': []
    })
  },

  // 输入洽谈内容
  onNegotiationInput(e) {
    this.setData({
      'negotiationForm.content': e.detail
    })
  },

  // 上传文件
  async uploadFile() {
    try {
      const res = await wx.chooseMessageFile({
        count: 5,
        type: 'file',
        extension: ['doc', 'docx', 'pdf', 'xls', 'xlsx']
      })

      const files = this.data.negotiationForm.files.concat(res.tempFiles)
      this.setData({
        'negotiationForm.files': files
      })
    } catch (error) {
      console.error('选择文件失败:', error)
    }
  },

  // 删除文件
  removeFile(e) {
    const { index } = e.currentTarget.dataset
    const files = this.data.negotiationForm.files
    files.splice(index, 1)
    this.setData({
      'negotiationForm.files': files
    })
  },

  // 提交商务洽谈记录
  async submitNegotiation() {
    const { content, files } = this.data.negotiationForm
    if (!content.trim()) {
      wx.showToast({
        title: '请输入洽谈内容',
        icon: 'none'
      })
      return
    }

    this.setData({ submitting: true })

    try {
      // 先上传文件
      const uploadedFiles = []
      for (const file of files) {
        const res = await app.uploadFile({
          filePath: file.path,
          name: 'file'
        })
        uploadedFiles.push(res.data)
      }

      // 提交洽谈记录 - 使用 manager 接口
      const res = await apiService.post(`/manager/orders/${this.data.orderInfo.id}/negotiations`, {
        content,
        files: uploadedFiles
      })
      
      if (res.code !== 200) {
        throw new Error(res.message || '提交失败')
      }

      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })

      // 重新加载订单详情
      this.loadOrderDetail()
      this.closeNegotiation()

    } catch (error) {
      console.error('提交洽谈记录失败:', error)
      wx.showToast({
        title: '提交失败',
        icon: 'none'
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 更新订单状态
  async updateOrderStatus(e) {
    const { status } = e.currentTarget.dataset
    
    try {
      // 使用 manager 接口更新订单状态
      const res = await apiService.put(`/manager/orders/${this.data.orderInfo.id}/status`, { status })
      
      if (res.code === 200) {
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })

        // 重新加载订单详情
        this.loadOrderDetail()
      } else {
        throw new Error(res.message || '更新失败')
      }

    } catch (error) {
      console.error('更新订单状态失败:', error)
      wx.showToast({
        title: '更新失败',
        icon: 'none'
      })
    }
  },

  // 联系客户/客户经理
  makePhoneCall() {
    const { orderInfo } = this.data
    const phone = this.data.isManager ? orderInfo.customerPhone : orderInfo.managerInfo.phone
    
    wx.makePhoneCall({
      phoneNumber: phone,
      fail(error) {
        console.error('拨打电话失败:', error)
      }
    })
  },

  // 预览文件
  previewFile(e) {
    const { url } = e.currentTarget.dataset
    wx.downloadFile({
      url,
      success(res) {
        wx.openDocument({
          filePath: res.tempFilePath,
          fail(error) {
            console.error('打开文件失败:', error)
            wx.showToast({
              title: '打开文件失败',
              icon: 'none'
            })
          }
        })
      },
      fail(error) {
        console.error('下载文件失败:', error)
        wx.showToast({
          title: '下载文件失败',
          icon: 'none'
        })
      }
    })
  },

  // 获取服务状态文本
  getServiceStatusText(status) {
    const statusMap = {
      'pending': '待开通',
      'activating': '开通中',
      'active': '服务中',
      'suspended': '已暂停',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  // 测试API调用
  async testAPI() {
    console.log('=== 开始测试API调用 ===');
    console.log('当前时间:', new Date().toISOString());
    
    // 检查token状态
    const token = wx.getStorageSync('token');
    console.log('🔑 当前token状态:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPrefix: token ? token.substring(0, 10) + '...' : 'null'
    });
    
    if (!token) {
      console.error('❌ 没有token，无法进行API测试');
      return;
    }
    
    try {
      // 测试getUserInfo
      console.log('🧪 测试getUserInfo API');
      const userResponse = await api.getUserInfo();
      console.log('✅ getUserInfo响应:', userResponse);
      console.log('✅ getUserInfo响应类型:', typeof userResponse);
      console.log('✅ getUserInfo响应结构:', {
        hasData: !!userResponse,
        hasSuccess: userResponse && 'success' in userResponse,
        hasCode: userResponse && 'code' in userResponse,
        hasData: userResponse && 'data' in userResponse,
        responseKeys: userResponse ? Object.keys(userResponse) : 'null'
      });
      
      // 测试getOrderDetail
      console.log('🧪 测试getOrderDetail API');
      const orderResponse = await api.getOrderDetail(this.data.orderId || '1');
      console.log('✅ getOrderDetail响应:', orderResponse);
      console.log('✅ getOrderDetail响应类型:', typeof orderResponse);
      console.log('✅ getOrderDetail响应结构:', {
        hasData: !!orderResponse,
        hasSuccess: orderResponse && 'success' in orderResponse,
        hasCode: orderResponse && 'code' in orderResponse,
        hasData: orderResponse && 'data' in orderResponse,
        responseKeys: orderResponse ? Object.keys(orderResponse) : 'null'
      });
      
      // 分析响应格式
      console.log('📊 响应格式分析:');
      if (userResponse && userResponse.code === 200) {
        console.log('✅ getUserInfo使用标准格式 (code: 200)');
      } else if (userResponse && userResponse.success === true) {
        console.log('✅ getUserInfo使用success格式');
      } else if (userResponse && userResponse.data) {
        console.log('✅ getUserInfo使用data格式');
      } else {
        console.log('❓ getUserInfo使用未知格式');
      }
      
      if (orderResponse && orderResponse.code === 200) {
        console.log('✅ getOrderDetail使用标准格式 (code: 200)');
      } else if (orderResponse && orderResponse.success === true) {
        console.log('✅ getOrderDetail使用success格式');
      } else if (orderResponse && orderResponse.data) {
        console.log('✅ getOrderDetail使用data格式');
      } else {
        console.log('❓ getOrderDetail使用未知格式');
      }
      
    } catch (error) {
      console.error('❌ API测试失败:', error);
      console.error('❌ 错误类型:', error.constructor.name);
      console.error('❌ 错误消息:', error.message);
      console.error('❌ 错误堆栈:', error.stack);
    }
    
    console.log('=== API测试完成 ===');
  },

  // 开通服务
  async startService() {
    try {
      wx.showLoading({ title: '正在处理' });
      const res = await api.startOrderService(this.data.orderId);
      if (res.success) {
        wx.showToast({ title: '服务开通成功' });
        this.refreshOrderDetail();
      } else {
        wx.showToast({ title: res.message || '开通失败', icon: 'error' });
      }
    } catch (error) {
      console.error('开通服务失败:', error);
      wx.showToast({ title: '开通失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  // 生成合同
  async generateContract() {
    try {
      wx.showLoading({ title: '生成合同中' });
      
      // 这里调用生成合同的API
      const res = await apiService.post(`/manager/orders/${this.data.orderInfo.id}/contract`, {
        type: 'standard',
        generateDate: new Date().toISOString()
      });
      
      if (res.code === 200) {
        wx.showToast({ 
          title: '合同生成成功', 
          icon: 'success' 
        });
        
        // 可以跳转到合同预览页面
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/contract/preview?orderId=${this.data.orderInfo.id}`
          });
        }, 1500);
      } else {
        throw new Error(res.message || '生成合同失败');
      }
    } catch (error) {
      console.error('生成合同失败:', error);
      wx.showToast({ 
        title: error.message || '生成合同失败', 
        icon: 'none' 
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 查看服务报告
  async viewServiceReport() {
    try {
      wx.showLoading({ title: '加载报告' });
      const res = await api.getServiceReport(this.data.orderId);
      if (res.success && res.data) {
        // 这里假设返回的是报告文件的URL
        wx.downloadFile({
          url: res.data.reportUrl,
          success(res) {
            wx.openDocument({
              filePath: res.tempFilePath,
              success() {
                console.log('打开服务报告成功');
              },
              fail() {
                wx.showToast({ title: '打开报告失败', icon: 'error' });
              }
            });
          },
          fail() {
            wx.showToast({ title: '下载报告失败', icon: 'error' });
          }
        });
      } else {
        wx.showToast({ title: '获取报告失败', icon: 'error' });
      }
    } catch (error) {
      console.error('查看服务报告失败:', error);
      wx.showToast({ title: '获取报告失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  // 发送续约提醒
  async sendRenewalNotice() {
    try {
      wx.showLoading({ title: '发送提醒' });
      const res = await api.sendRenewalNotice(this.data.orderId);
      if (res.success) {
        wx.showToast({ title: '续约提醒已发送' });
      } else {
        wx.showToast({ title: res.message || '发送失败', icon: 'error' });
      }
    } catch (error) {
      console.error('发送续约提醒失败:', error);
      wx.showToast({ title: '发送失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  // 查看用电报告
  async viewUsageReport() {
    try {
      wx.showLoading({ title: '加载报告' });
      const res = await api.getUsageReport(this.data.orderId);
      if (res.success && res.data) {
        // 这里假设返回的是用电报告数据
        wx.navigateTo({
          url: `/pages/reports/usage-detail/index?id=${this.data.orderId}`,
          success: () => {
            // 将报告数据传递给下一个页面
            const eventChannel = this.getOpenerEventChannel();
            eventChannel.emit('reportData', { data: res.data });
          }
        });
      } else {
        wx.showToast({ title: '获取报告失败', icon: 'error' });
      }
    } catch (error) {
      console.error('查看用电报告失败:', error);
      wx.showToast({ title: '获取报告失败', icon: 'error' });
    } finally {
      wx.hideLoading();
    }
  },

  onSignContract(e) {
    const orderId = this.data.orderId || (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id);
    if (!orderId) {
      wx.showToast({ title: '订单ID缺失', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: 5,
      success: (chooseRes) => {
        wx.showLoading({ title: '上传中...', mask: true });
        const uploadPromises = chooseRes.tempFilePaths.map(path => {
          return new Promise((resolve, reject) => {
            wx.uploadFile({
              url: 'http://localhost:8000/api/v1/mini/manager/oss/upload', // 替换为你的后端地址
              filePath: path,
              name: 'file',
              header: {
                'Authorization': 'Bearer ' + (wx.getStorageSync('token') || '')
              },
              success: (res) => {
                try {
                  const data = JSON.parse(res.data);
                  if (data.code === 0 && data.data) {
                    resolve(data.data);
                  } else {
                    reject(data.msg || '上传失败');
                  }
                } catch (err) {
                  reject('上传返回解析失败');
                }
              },
              fail: reject
            });
          });
        });
        Promise.all(uploadPromises)
          .then(urls => {
            wx.hideLoading();
            // 上传成功后，保存图片URL到订单合同表
            wx.request({
              url: `http://localhost:8000/api/v1/mini/manager/orders/${orderId}/contracts`,
              method: 'POST',
              header: {
                'content-type': 'application/json',
                'Authorization': wx.getStorageSync('token') || ''
              },
              data: {
                files: urls
              },
              success: (res) => {
                if (res.data && res.data.code === 0) {
                  wx.showToast({ title: '合同图片已上传', icon: 'success' });
                  // 可选：调用签约API或刷新页面
                  // this.updateOrderStatus({ currentTarget: { dataset: { status: 'active' } } });
                } else {
                  wx.showToast({ title: res.data.msg || '保存失败', icon: 'none' });
                }
              },
              fail: () => {
                wx.showToast({ title: '网络错误', icon: 'none' });
              }
            });
          })
          .catch(err => {
            wx.hideLoading();
            wx.showToast({ title: err.toString(), icon: 'none' });
          });
      },
      fail: () => {
        wx.showToast({ title: '未选择图片', icon: 'none' });
      }
    });
  },
}); 
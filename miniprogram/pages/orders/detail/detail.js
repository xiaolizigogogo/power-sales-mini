const api = require('../../../utils/api');
const util = require('../../../utils/util');

Page({
  data: {
    orderId: null,
    orderInfo: null,
    loading: true,
    refreshing: false,
    
    // 订单状态流程配置
    statusFlow: [
      { key: 'pending', name: '待确认', icon: 'pending' },
      { key: 'confirmed', name: '商务洽谈', icon: 'chat' },
      { key: 'contract', name: '合同签署', icon: 'contract' },
      { key: 'service', name: '服务开通', icon: 'service' },
      { key: 'completed', name: '服务中', icon: 'completed' }
    ],

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
    contractUrl: ''
  },

  onLoad(options) {
    console.log('订单详情页面加载:', options);
    if (options.id) {
      this.setData({ orderId: options.id });
      this.loadOrderDetail();
    } else {
      this.showError('订单ID不能为空');
    }
  },

  onShow() {
    // 页面显示时刷新数据
    if (this.data.orderId) {
      this.loadOrderDetail();
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
    try {
      this.setData({ loading: true });
      
      const response = await api.getOrderDetail(this.data.orderId);
      
      if (response.success) {
        const orderInfo = this.processOrderData(response.data);
        this.setData({ 
          orderInfo,
          loading: false 
        });
        
        // 设置页面标题
        wx.setNavigationBarTitle({
          title: `订单详情 - ${orderInfo.orderNo}`
        });
      } else {
        this.showError(response.message || '获取订单详情失败');
      }
    } catch (error) {
      console.error('加载订单详情失败:', error);
      this.showError('网络错误，请重试');
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  // 刷新订单详情
  async refreshOrderDetail() {
    this.setData({ refreshing: true });
    await this.loadOrderDetail();
    this.setData({ refreshing: false });
  },

  // 处理订单数据
  processOrderData(orderData) {
    return {
      ...orderData,
      // 格式化创建时间
      createTimeFormatted: util.formatTime(new Date(orderData.createdAt)),
      // 格式化更新时间
      updateTimeFormatted: util.formatTime(new Date(orderData.updatedAt)),
      // 格式化服务时间
      serviceStartDateFormatted: orderData.serviceStartDate ? 
        util.formatDate(new Date(orderData.serviceStartDate)) : '',
      serviceEndDateFormatted: orderData.serviceEndDate ? 
        util.formatDate(new Date(orderData.serviceEndDate)) : '',
      // 格式化金额
      amountFormatted: util.formatCurrency(orderData.amount),
      // 计算当前状态在流程中的位置
      currentStatusIndex: this.data.statusFlow.findIndex(item => item.key === orderData.status),
      // 判断是否可以取消
      canCancel: ['pending', 'confirmed'].includes(orderData.status),
      // 判断是否可以支付
      canPay: orderData.status === 'confirmed' && !orderData.isPaid,
      // 判断是否可以查看合同
      canViewContract: ['contract', 'service', 'completed'].includes(orderData.status),
      // 格式化联系人信息
      managerInfo: orderData.assignedEmployee ? {
        ...orderData.assignedEmployee,
        phoneFormatted: this.formatPhone(orderData.assignedEmployee.phone)
      } : null
    };
  },

  // 格式化手机号
  formatPhone(phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
  },

  // 取消订单
  onCancelOrder() {
    this.setData({
      showConfirmDialog: true,
      confirmDialog: {
        title: '取消订单',
        message: '确定要取消这个订单吗？取消后无法恢复。',
        action: 'cancel'
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
      
      const response = await api.cancelOrder(this.data.orderId);
      
      if (response.success) {
        wx.showToast({
          title: '订单已取消',
          icon: 'success'
        });
        
        // 刷新订单信息
        await this.loadOrderDetail();
        
        // 触发父页面刷新
        const pages = getCurrentPages();
        const prevPage = pages[pages.length - 2];
        if (prevPage) {
          prevPage.refreshOrderList && prevPage.refreshOrderList();
        }
      } else {
        wx.showToast({
          title: response.message || '取消失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('取消订单失败:', error);
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
    this.setData({ showPaymentSheet: true });
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
    if (!this.data.orderInfo.managerInfo) {
      wx.showToast({
        title: '暂未分配服务经理',
        icon: 'none'
      });
      return;
    }
    this.setData({ showContactSheet: true });
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
    if (!this.data.orderInfo.contractUrl) {
      wx.showToast({
        title: '合同文件不存在',
        icon: 'none'
      });
      return;
    }

    // 预览合同文件
    wx.downloadFile({
      url: this.data.orderInfo.contractUrl,
      success: (res) => {
        wx.openDocument({
          filePath: res.tempFilePath,
          fileType: 'pdf',
          fail: (error) => {
            console.error('打开合同文件失败:', error);
            wx.showToast({
              title: '文件打开失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (error) => {
        console.error('下载合同文件失败:', error);
        wx.showToast({
          title: '文件下载失败',
          icon: 'none'
        });
      }
    });
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
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    });
    
    // 如果是严重错误，返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 2000);
  }
}); 
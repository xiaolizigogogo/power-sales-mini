const { checkRoleAccess } = require('../../../utils/auth');
const { request } = require('../../../utils/api');

Page({
  data: {
    products: []
  },

  onLoad(options) {
    // 检查角色权限
    if (!checkRoleAccess('products')) {
      return;
    }

    const { ids } = options;
    if (ids) {
      this.loadProducts(ids.split(','));
    }
  },

  // 加载产品数据
  async loadProducts(ids) {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      const products = await Promise.all(
        ids.map(id => request('GET', `/products/${id}`))
      );

      // 处理产品数据
      const processedProducts = products.map(res => {
        const product = res.data;
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          voltage: product.voltage,
          type: product.type,
          peakPrice: product.peakPrice,
          valleyPrice: product.valleyPrice,
          discounts: product.discounts || [
            '首年享受9.5折优惠',
            '用电量达标返点',
            '节假日特惠价'
          ],
          services: [
            {
              name: '7×24小时服务',
              included: true
            },
            {
              name: '专属客户经理',
              included: product.hasManager
            },
            {
              name: '定期巡检',
              included: product.hasInspection
            },
            {
              name: '故障优先处理',
              included: product.hasPriority
            },
            {
              name: '节能诊断',
              included: product.hasEnergyDiagnosis
            }
          ],
          serviceTime: product.serviceTime || '7×24小时',
          responseTime: product.responseTime || '2小时内响应'
        };
      });

      this.setData({
        products: processedProducts
      });
    } catch (error) {
      console.error('加载产品数据失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 跳转到计算器
  goToCalculator(e) {
    const { id } = e.currentTarget.dataset;
    const product = this.data.products.find(p => p.id === id);
    
    wx.navigateTo({
      url: `/pages/products/calculator/calculator?id=${id}&name=${encodeURIComponent(product.name)}&price=${product.price}`
    });
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail() {
        wx.showToast({
          title: '拨打失败，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  // 创建订单
  createOrder(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/orders/create/create?productId=${id}`
    });
  },

  onShareAppMessage() {
    const { products } = this.data;
    const productNames = products.map(p => p.name).join('VS');
    return {
      title: `${productNames} - 产品对比`,
      path: `/pages/products/compare/compare?ids=${products.map(p => p.id).join(',')}`
    };
  }
}); 
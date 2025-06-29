const app = getApp();

Page({
  data: {
    loading: true,
    id: null,
    detail: null,
    showShare: false
  },

  onLoad(options) {
    const { id } = options;
    console.log('产品详情页加载，ID:', id);
    this.setData({ id });
    
    // 立即加载模拟数据，确保页面不空白
    this.loadMockData();
    
    // 尝试加载真实数据
    this.loadData();
  },

  // 加载数据
  async loadData() {
    if (!this.data.id) return;

    this.setData({ loading: false }); // 不显示loading，因为已有模拟数据

    try {
      console.log('尝试加载产品详情，ID:', this.data.id);
      // 尝试调用实际的产品详情接口
      const res = await app.request({
        url: `/products/${this.data.id}`
      });

      console.log('产品详情加载成功:', res);
      if (res && res.data) {
        this.setData({
          detail: res.data
        });
        console.log('真实产品详情数据设置成功');
      }

    } catch (error) {
      console.error('加载产品详情失败:', error)
      console.log('保持使用模拟数据');
      // 不需要重新加载模拟数据，因为已经在onLoad中加载了
    } finally {
      this.setData({ loading: false });
    }
  },

  // 加载模拟数据
  loadMockData() {
    const mockProducts = {
      1: {
        id: 1,
        name: '工商业基础用电套餐',
        description: '适合中小型工商业企业，提供稳定可靠的电力供应服务，包含基础的用电量和优惠政策。专业的电力服务团队为您提供全方位的用电保障，让您的企业用电无忧。',
        price: '0.65',
        originalPrice: '0.75',
        images: ['/assets/images/product-1.png', '/assets/images/product-banner-1.png'],
        categoryName: '工商业用电',
        voltage: '10',
        phase: '三',
        capacity: '100-1000kW',
        scopes: [
          '中小型制造企业',
          '商业综合体',
          '办公楼宇',
          '工业园区',
          '物流仓储'
        ],
        policies: [
          '首年享受9.5折优惠',
          '用电量达标额外返点',
          '免费提供用电咨询',
          '24小时应急保障',
          '绿色通道快速办理'
        ],
        process: [
          {
            step: '01',
            title: '需求咨询',
            description: '联系客服了解详细需求，获取专业用电方案'
          },
          {
            step: '02', 
            title: '方案制定',
            description: '根据企业用电情况制定个性化电力服务方案'
          },
          {
            step: '03',
            title: '合同签署',
            description: '确认方案后签署正式服务合同'
          },
          {
            step: '04',
            title: '服务开通',
            description: '完成相关手续，正式开通电力服务'
          }
        ]
      },
      2: {
        id: 2,
        name: '工商业标准用电套餐',
        description: '针对中等规模工商业企业设计，提供更多用电量和更优惠的价格，适合稳定发展的企业。享受更多优惠政策和专属服务，助力企业降本增效。',
        price: '0.62',
        originalPrice: '0.72',
        images: ['/assets/images/product-2.png', '/assets/images/product-banner-2.png'],
        categoryName: '工商业用电',
        voltage: '35',
        phase: '三',
        capacity: '1000-5000kW',
        scopes: [
          '大型制造企业',
          '工业园区',
          '数据中心',
          '医院学校',
          '商业中心'
        ],
        policies: [
          '首年享受9折优惠',
          '阶梯电价更优惠',
          '专属客户经理服务',
          '优先抢修保障',
          '用电数据分析报告'
        ],
        process: [
          {
            step: '01',
            title: '需求评估',
            description: '专业团队上门评估用电需求和现状'
          },
          {
            step: '02',
            title: '方案设计',
            description: '定制专属电力服务方案和价格政策'
          },
          {
            step: '03',
            title: '协议签署',
            description: '签署长期合作协议，锁定优惠价格'
          },
          {
            step: '04',
            title: '服务启动',
            description: '配置专属客户经理，启动全方位服务'
          }
        ]
      }
    }

    // 根据ID获取对应的模拟数据，如果没有则使用默认数据
    const detail = mockProducts[this.data.id] || {
      id: this.data.id,
      name: '电力产品套餐',
      description: '专业的电力供应服务，为您提供稳定可靠的电力保障。我们致力于为各类企业提供优质、高效、经济的电力解决方案。',
      price: '0.60',
      originalPrice: '0.70',
      images: ['/assets/images/product-default.png'],
      categoryName: '工商业用电',
      voltage: '10',
      phase: '三',
      capacity: '根据需求定制',
      scopes: [
        '各类工商业企业',
        '事业单位',
        '民营企业',
        '外资企业',
        '个体工商户'
      ],
      policies: [
        '新客户享受优惠价格',
        '长期合作更多折扣',
        '免费用电咨询服务',
        '专业技术支持',
        '完善的售后保障'
      ],
      process: [
        {
          step: '01',
          title: '咨询了解',
          description: '联系我们了解产品详情和服务内容'
        },
        {
          step: '02',
          title: '需求分析',
          description: '分析您的用电需求，制定合适方案'
        },
        {
          step: '03',
          title: '签约办理',
          description: '签署服务协议，办理相关手续'
        },
        {
          step: '04',
          title: '服务启动',
          description: '正式启动电力服务，享受优质保障'
        }
      ]
    }

    this.setData({ detail })
  },

  // 预览图片
  previewImage(e) {
    const { current } = e.currentTarget.dataset;
    const { images } = this.data.detail;

    wx.previewImage({
      current,
      urls: images
    });
  },

  // 显示分享面板
  showSharePanel() {
    this.setData({ showShare: true });
  },

  // 隐藏分享面板
  hideSharePanel() {
    this.setData({ showShare: false });
  },

  // 分享给好友
  onShareAppMessage() {
    const { detail } = this.data;
    return {
      title: detail.name,
      path: `/pages/products/detail/detail?id=${detail.id}`,
      imageUrl: detail.images[0]
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { detail } = this.data;
    return {
      title: detail.name,
      query: `id=${detail.id}`,
      imageUrl: detail.images[0]
    };
  },

  // 复制链接
  copyLink() {
    wx.setClipboardData({
      data: `${app.globalData.baseUrl}/products/${this.data.id}`,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
        this.hideSharePanel();
      }
    });
  },

  // 生成海报
  async generatePoster() {
    wx.showLoading({
      title: '生成中...',
      mask: true
    });

    try {
      // 这里应该调用生成海报接口
      const res = await app.request({
        url: `/products/${this.data.id}/poster`
      });

      // 保存图片到相册
      await wx.saveImageToPhotosAlbum({
        filePath: res.data.posterUrl
      });

      wx.showToast({
        title: '已保存到相册',
        icon: 'success'
      });

    } catch (error) {
      wx.showToast({
        title: error.message || '生成失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.hideSharePanel();
    }
  },

  // 跳转到计算器
  goToCalculator() {
    wx.navigateTo({
      url: `/pages/products/calculator/calculator?id=${this.data.id}`
    });
  },

  // 联系客服
  contactService() {
    console.log('用户点击联系客服');
    
    const options = ['拨打客服电话', '在线客服咨询', '微信客服'];
    
    wx.showActionSheet({
      itemList: options,
      success: (res) => {
        console.log('用户选择客服方式:', res.tapIndex);
        
        switch (res.tapIndex) {
          case 0:
            // 拨打客服电话
            wx.showModal({
              title: '拨打客服电话',
              content: '客服热线：400-123-4567\n服务时间：09:00-18:00',
              confirmText: '立即拨打',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.makePhoneCall({
                    phoneNumber: '400-123-4567',
                    fail: () => {
                      wx.showToast({
                        title: '拨打失败，请手动拨打400-123-4567',
                        icon: 'none',
                        duration: 3000
                      });
                    }
                  });
                }
              }
            });
            break;
            
          case 1:
            // 在线客服咨询
            wx.showModal({
              title: '在线客服',
              content: '即将跳转到在线客服页面，客服将为您提供专业的产品咨询服务',
              confirmText: '进入咨询',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  // 这里可以跳转到客服聊天页面或打开客服链接
                  wx.showToast({
                    title: '客服功能开发中',
                    icon: 'none'
                  });
                }
              }
            });
            break;
            
          case 2:
            // 微信客服
            wx.showModal({
              title: '微信客服',
              content: '微信搜索"电力服务助手"小程序客服，或扫描客服二维码添加微信客服',
              confirmText: '知道了',
              showCancel: false
            });
            break;
        }
      },
      fail: () => {
        console.log('用户取消选择客服方式');
      }
    });
  },

  // 立即购买
  handleBuy() {
    console.log('用户点击购买按钮');
    
    // 检查产品信息
    if (!this.data.detail) {
      wx.showToast({
        title: '产品信息加载中',
        icon: 'none'
      });
      return;
    }
    
    // 检查用户登录状态
    if (!app.globalData.isLogin) {
      wx.showModal({
        title: '需要登录',
        content: '购买前需要先登录，是否前往登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/auth/login/login'
            });
          }
        }
      });
      return;
    }
    
    // 显示购买选项
    wx.showModal({
      title: '购买咨询',
      content: `您选择的是「${this.data.detail.name}」，该产品需要专业评估用电需求。是否联系客服进行详细咨询？`,
      confirmText: '立即咨询',
      cancelText: '查看更多',
      success: (res) => {
        if (res.confirm) {
          this.contactService();
        } else {
          // 跳转到订单创建页面或产品计算器
          wx.navigateTo({
            url: `/pages/products/calculator/calculator?id=${this.data.id}`
          });
        }
      }
    });
  }
}); 
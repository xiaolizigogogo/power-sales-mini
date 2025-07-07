// pages/manager/profile/index.js
const app = getApp();
const { roleManager } = require('../../../utils/role-manager');
const { getSafePagePath } = require('../../../utils/safe-helpers');
const { api } = require('../../../utils/api');

Page({
  data: {
    userInfo: {
      id: '',
      username: '',
      name: '',
      phone: '',
      email: '',
      avatar: '',
      company: '',
      position: '客户经理',
      isOnline: true,
      isWechatBound: false,
      registerTime: '',
      lastLoginTime: ''
    },
    stats: {
      customerCount: 0,
      followCount: 0,
      orderCount: 0,
      revenue: 0
    },
    version: '1.0.0',
    updateTime: '2025-01-11',
    showAccountInfo: false
  },

  onLoad: function (options) {
    this.loadUserInfo();
    this.loadStats();
  },

  onShow: function () {
    // 每次显示时刷新数据
    this.loadUserInfo();
    this.loadStats();
    this.updateTabBar();
  },

  // 更新自定义tabBar
  updateTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      const tabbar = this.getTabBar();
      const userType = roleManager.getCurrentUserType();
      
      console.log('客户经理个人资料页面 - 更新tabBar, 用户类型:', userType);
      
      if (userType === 'manager') {
        // 调用自定义tabBar组件的updateTabBar方法
        if (typeof tabbar.updateTabBar === 'function') {
          tabbar.updateTabBar();
        }
        
        // 设置当前选中的tab（个人资料页面是第5个，索引为4）
        if (typeof tabbar.setActiveTab === 'function') {
          tabbar.setActiveTab(4);
        } else {
          tabbar.setData({
            active: 4
          });
        }
        
        console.log('客户经理个人资料页面 - tabBar更新完成');
      }
    }
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const currentUser = roleManager.getCurrentUserInfo();
      
      // 从后台API获取完整用户信息
      console.log('正在从后台获取用户信息...');
      const response = await api.getUserInfo();
      
      console.log('后台用户信息响应:', response);
      
      // 格式化用户信息
      const serverUserInfo = response.data || response;
      
      // 详细调试微信绑定状态
      console.log('服务器返回的微信绑定相关字段:', {
        isWechatBound: serverUserInfo.isWechatBound,
        wechatBound: serverUserInfo.wechatBound,
        openId: serverUserInfo.openId,
        wechatOpenId: serverUserInfo.wechatOpenId,
        openid: serverUserInfo.openid, // 可能是小写的openid
        wechat_bound: serverUserInfo.wechat_bound, // 可能是下划线格式
        bindStatus: serverUserInfo.bindStatus,
        wechatBindStatus: serverUserInfo.wechatBindStatus
      });
      
      // 优先检查后台明确返回的绑定状态字段，然后检查openId是否存在
      let wechatBoundStatus = false;
      let wechatOpenId = '';
      
      // 先尝试获取openId
      wechatOpenId = serverUserInfo.openId || 
                    serverUserInfo.wechatOpenId || 
                    serverUserInfo.openid || 
                    '';
      
      // 判断绑定状态：优先使用明确的绑定状态字段，否则根据openId判断
      if (serverUserInfo.isWechatBound !== undefined) {
        wechatBoundStatus = serverUserInfo.isWechatBound;
      } else if (serverUserInfo.wechatBound !== undefined) {
        wechatBoundStatus = serverUserInfo.wechatBound;
      } else if (serverUserInfo.wechat_bound !== undefined) {
        wechatBoundStatus = serverUserInfo.wechat_bound;
      } else if (serverUserInfo.bindStatus !== undefined) {
        wechatBoundStatus = serverUserInfo.bindStatus;
      } else if (serverUserInfo.wechatBindStatus !== undefined) {
        wechatBoundStatus = serverUserInfo.wechatBindStatus;
      } else {
        // 如果没有明确的绑定状态字段，根据openId判断
        wechatBoundStatus = wechatOpenId && wechatOpenId.trim() !== '';
      }
      
      console.log('微信绑定状态判断结果:', {
        wechatBoundStatus,
        wechatOpenId,
        hasOpenId: !!wechatOpenId && wechatOpenId.trim() !== ''
      });
      
      const fullUserInfo = {
        id: serverUserInfo.id || currentUser.id || 'manager001',
        username: serverUserInfo.username || serverUserInfo.employeeNo || currentUser.username || '经理001',
        name: serverUserInfo.name || serverUserInfo.realName || currentUser.name || '张经理',
        phone: serverUserInfo.phone || serverUserInfo.phoneNumber || currentUser.phone || '13800138000',
        email: serverUserInfo.email || currentUser.email || '',
        avatar: serverUserInfo.avatar || serverUserInfo.avatarUrl || currentUser.avatar || '',
        company: serverUserInfo.company || serverUserInfo.companyName || currentUser.company || '某某电力公司',
        position: serverUserInfo.position || serverUserInfo.jobTitle || currentUser.position || '客户经理',
        department: serverUserInfo.department || serverUserInfo.departmentName || '',
        isOnline: true,
        isWechatBound: wechatBoundStatus,
        openId: wechatOpenId,
        registerTime: serverUserInfo.registerTime || serverUserInfo.createTime || '2024-01-01',
        lastLoginTime: serverUserInfo.lastLoginTime || serverUserInfo.lastLogin || '2025-01-11 10:00:00'
      };

      console.log('格式化后的用户信息:', fullUserInfo);
      
      this.setData({ userInfo: fullUserInfo });
      
      // 更新本地存储的用户信息
      roleManager.setCurrentUser('manager', fullUserInfo);
      
    } catch (error) {
      console.error('加载用户信息失败:', error);
      
      // 如果API调用失败，使用本地存储的用户信息作为后备
      const localUserInfo = roleManager.getCurrentUserInfo();
      
      // 判断本地存储的微信绑定状态
      let localWechatBound = false;
      const localOpenId = localUserInfo.openId || localUserInfo.openid || '';
      
      if (localUserInfo.isWechatBound !== undefined) {
        localWechatBound = localUserInfo.isWechatBound;
      } else if (localUserInfo.wechatBound !== undefined) {
        localWechatBound = localUserInfo.wechatBound;
      } else {
        localWechatBound = localOpenId && localOpenId.trim() !== '';
      }
      
      const fallbackUserInfo = {
        id: localUserInfo.id || 'manager001',
        username: localUserInfo.username || '经理001',
        name: localUserInfo.name || '张经理',
        phone: localUserInfo.phone || '13800138000',
        email: localUserInfo.email || '',
        avatar: localUserInfo.avatar || '',
        company: localUserInfo.company || '某某电力公司',
        position: localUserInfo.position || '客户经理',
        isOnline: true,
        isWechatBound: localWechatBound,
        openId: localOpenId,
        registerTime: localUserInfo.registerTime || '2024-01-01',
        lastLoginTime: localUserInfo.lastLoginTime || '2025-01-11 10:00:00'
      };
      
      this.setData({ userInfo: fallbackUserInfo });
      console.log('使用本地用户信息作为后备:', fallbackUserInfo);
      console.log('本地用户信息微信绑定状态:', {
        localWechatBound,
        localOpenId,
        originalLocalInfo: localUserInfo
      });
    }
  },

  // 加载统计数据
  async loadStats() {
    try {
      // 模拟API调用
      const stats = {
        customerCount: 156,
        followCount: 89,
        orderCount: 23,
        revenue: 125.6
      };

      this.setData({ stats });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 修改头像
  async onChangeAvatar() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        const tempPath = res.tempFilePaths[0];
        
        // 这里应该上传到服务器
        // const avatarUrl = await this.uploadAvatar(tempPath);
        
        this.setData({
          'userInfo.avatar': tempPath
        });
        
        wx.showToast({
          title: '头像更新成功',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('修改头像失败:', error);
      wx.showToast({
        title: '修改头像失败',
        icon: 'error'
      });
    }
  },

  // 编辑个人信息
  onEditProfile() {
    wx.navigateTo({
      url: '/pages/manager/profile/edit'
    });
  },

  // 显示账户信息
  onShowAccountInfo() {
    this.setData({ showAccountInfo: true });
  },

  // 关闭账户信息弹窗
  onCloseAccountInfo() {
    this.setData({ showAccountInfo: false });
  },

  // 绑定/解绑微信
  async onBindWechat() {
    try {
      const { userInfo } = this.data;
      
      if (userInfo.isWechatBound) {
        // 解绑微信
        wx.showModal({
          title: '确认解绑',
          content: '解绑后将无法使用微信一键登录功能，确定要解绑吗？',
          success: async (res) => {
            if (res.confirm) {
              await this.unbindWechat();
            }
          }
        });
      } else {
        // 绑定微信
        await this.bindWechat();
      }
    } catch (error) {
      console.error('微信绑定操作失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'error'
      });
    }
  },

  // 绑定微信
  async bindWechat() {
    try {
      // 先获取用户信息（必须在用户触发事件中直接调用）
      const userProfile = await wx.getUserProfile({
        desc: '用于绑定微信账号'
      });
      
      if (!userProfile.userInfo) {
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'error'
        });
        return;
      }
      
      wx.showLoading({
        title: '绑定中...'
      });
      
      // 再获取微信授权
      const loginRes = await wx.login();
      
      if (loginRes.code) {
        // 准备绑定数据
        const bindData = {
          code: loginRes.code,  // 主要用于后端获取openid
          nickName: userProfile.userInfo.nickName,
          avatarUrl: userProfile.userInfo.avatarUrl,
          gender: userProfile.userInfo.gender,
          language: userProfile.userInfo.language,
          city: userProfile.userInfo.city,
          province: userProfile.userInfo.province,
          country: userProfile.userInfo.country
        };
        
        console.log('绑定微信数据:', bindData);
        
        // 调用API绑定微信
        const bindResult = await api.bindWechat(bindData);
        
        console.log('绑定微信结果:', bindResult);
        
        if (bindResult.success || bindResult.code === 200) {
          // 更新UI状态
          this.setData({
            'userInfo.isWechatBound': true,
            'userInfo.avatar': userProfile.userInfo.avatarUrl,
            'userInfo.openId': bindResult.data?.openId || ''
          });
          
                      // 更新本地存储的用户信息
            const currentUser = roleManager.getCurrentUserInfo();
            roleManager.setCurrentUser('manager', {
              ...currentUser,
              isWechatBound: true,
              avatar: userProfile.userInfo.avatarUrl,
              openId: bindResult.data?.openId || ''
            });
          
          wx.hideLoading();
          wx.showToast({
            title: '微信绑定成功',
            icon: 'success'
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: bindResult.message || '绑定失败',
            icon: 'error'
          });
        }
      } else {
        wx.hideLoading();
        wx.showToast({
          title: '获取微信授权失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('绑定微信失败:', error);
      wx.hideLoading();
      
      if (error.errMsg && error.errMsg.includes('getUserProfile:fail auth deny')) {
        wx.showToast({
          title: '用户拒绝授权',
          icon: 'error'
        });
      } else if (error.errMsg && error.errMsg.includes('getUserProfile:fail can only be invoked by user TAP gesture')) {
        wx.showToast({
          title: '请点击按钮进行授权',
          icon: 'error'
        });
      } else {
        wx.showToast({
          title: '绑定失败，请重试',
          icon: 'error'
        });
      }
    }
  },

  // 解绑微信
  async unbindWechat() {
    try {
      wx.showLoading({
        title: '解绑中...'
      });
      
      // 调用API解绑微信
      const unbindResult = await api.unbindWechat();
      
      console.log('解绑微信结果:', unbindResult);
      
      if (unbindResult.success || unbindResult.code === 200) {
        // 更新UI状态
        this.setData({
          'userInfo.isWechatBound': false,
          'userInfo.openId': ''
        });
        
        // 更新本地存储的用户信息
        const currentUser = roleManager.getCurrentUserInfo();
        roleManager.setCurrentUser('manager', {
          ...currentUser,
          isWechatBound: false,
          openId: ''
        });
        
        wx.hideLoading();
        wx.showToast({
          title: '微信解绑成功',
          icon: 'success'
        });
      } else {
        wx.hideLoading();
        wx.showToast({
          title: unbindResult.message || '解绑失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('解绑微信失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '解绑失败，请重试',
        icon: 'error'
      });
    }
  },



  // 修改密码
  onChangePassword() {
    wx.navigateTo({
      url: '/pages/manager/profile/change-password'
    });
  },

  // 跳转到各个页面
  onViewWorkplace() {
    wx.switchTab({
      url: '/pages/manager/workplace/workplace'
    });
  },

  onViewCustomers() {
    wx.switchTab({
      url: '/pages/manager/customers/list'
    });
  },

  onViewFollows() {
    wx.switchTab({
      url: '/pages/manager/follow/list'
    });
  },

  onViewOrders() {
    wx.navigateTo({
      url: '/pages/manager/orders/index'
    });
  },

  onViewPerformance() {
    wx.switchTab({
      url: '/pages/manager/performance/index'
    });
  },

  onViewSettings() {
    wx.navigateTo({
      url: '/pages/manager/settings/index'
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.performLogout();
        }
      }
    });
  },

  // 执行退出登录
  async performLogout() {
    try {
      // 清除登录状态
      roleManager.clearUserInfo();
      
      // 清除缓存
      await wx.clearStorage();
      
      wx.showToast({
        title: '退出登录成功',
        icon: 'success'
      });
      
      // 跳转到登录页面
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/auth/login/login'
        });
      }, 1000);
    } catch (error) {
      console.error('退出登录失败:', error);
      wx.showToast({
        title: '退出失败',
        icon: 'error'
      });
    }
  },

  // 上传头像
  async uploadAvatar(tempPath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: 'https://api.example.com/upload/avatar',
        filePath: tempPath,
        name: 'avatar',
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data.url);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (error) {
            reject(error);
          }
        },
        fail: (error) => {
          reject(error);
        }
      });
    });
  }
}); 
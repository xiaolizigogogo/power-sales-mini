// pages/manager/profile/index.js
const app = getApp();
const { roleManager } = require('../../../utils/role-manager');
const { userExperienceMixin } = require('../../../utils/user-experience');
const { getSafePagePath } = require('../../../utils/safe-helpers');

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
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const userInfo = roleManager.getCurrentUserInfo();
      
      // 模拟从服务器获取完整用户信息
      const fullUserInfo = {
        id: userInfo.id || 'manager001',
        username: userInfo.username || '经理001',
        name: userInfo.name || '张经理',
        phone: userInfo.phone || '13800138000',
        email: userInfo.email || 'manager@example.com',
        avatar: userInfo.avatar || '',
        company: userInfo.company || '某某电力公司',
        position: userInfo.position || '客户经理',
        isOnline: true,
        isWechatBound: userInfo.isWechatBound || false,
        registerTime: userInfo.registerTime || '2024-01-01',
        lastLoginTime: userInfo.lastLoginTime || '2025-01-11 10:00:00'
      };

      this.setData({ userInfo: fullUserInfo });
    } catch (error) {
      console.error('加载用户信息失败:', error);
      this.showError('加载用户信息失败');
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
        
        this.showSuccess('头像更新成功');
      }
    } catch (error) {
      console.error('修改头像失败:', error);
      this.showError('修改头像失败');
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
      this.showError('操作失败');
    }
  },

  // 绑定微信
  async bindWechat() {
    try {
      // 获取微信授权
      const loginRes = await wx.login();
      
      if (loginRes.code) {
        // 获取用户信息
        const userProfile = await wx.getUserProfile({
          desc: '用于绑定微信账号'
        });
        
        if (userProfile.userInfo) {
          // 调用API绑定微信
          const bindResult = await this.callBindWechatAPI(loginRes.code, userProfile);
          
          if (bindResult.success) {
            this.setData({
              'userInfo.isWechatBound': true,
              'userInfo.avatar': userProfile.userInfo.avatarUrl
            });
            
            this.showSuccess('微信绑定成功');
          } else {
            this.showError(bindResult.message || '绑定失败');
          }
        }
      }
    } catch (error) {
      console.error('绑定微信失败:', error);
      this.showError('绑定失败');
    }
  },

  // 解绑微信
  async unbindWechat() {
    try {
      // 调用API解绑微信
      const unbindResult = await this.callUnbindWechatAPI();
      
      if (unbindResult.success) {
        this.setData({
          'userInfo.isWechatBound': false
        });
        
        this.showSuccess('微信解绑成功');
      } else {
        this.showError(unbindResult.message || '解绑失败');
      }
    } catch (error) {
      console.error('解绑微信失败:', error);
      this.showError('解绑失败');
    }
  },

  // 调用绑定微信API
  async callBindWechatAPI(code, userProfile) {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '绑定成功'
        });
      }, 1000);
    });
  },

  // 调用解绑微信API
  async callUnbindWechatAPI() {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: '解绑成功'
        });
      }, 1000);
    });
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
      
      this.showSuccess('退出登录成功');
      
      // 跳转到登录页面
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/auth/login/login'
        });
      }, 1000);
    } catch (error) {
      console.error('退出登录失败:', error);
      this.showError('退出失败');
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

// 混入用户体验功能
Object.assign(Page.prototype, userExperienceMixin.methods); 
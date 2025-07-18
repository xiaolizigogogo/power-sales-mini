// pages/auth/username-login/index.js
const app = getApp();
const { roleManager, USER_TYPES } = require('../../../utils/role-manager');
const { userExperienceMixin } = require('../../../utils/user-experience');
const { safeGetStorage, safeSetStorage } = require('../../../utils/safe-helpers');

Page({
  data: {
    loginForm: {
      username: '',
      password: ''
    },
    showPassword: false,
    rememberPassword: false,
    loading: false,
    showBindWechat: false,
    binding: false,
    wechatInfo: {
      nickName: '',
      avatarUrl: ''
    }
  },

  onLoad: function (options) {
    this.loadSavedCredentials();
  },

  // 加载保存的凭证
  loadSavedCredentials() {
    const savedCredentials = safeGetStorage('saved_credentials');
    if (savedCredentials) {
      this.setData({
        'loginForm.username': savedCredentials.username || '',
        'loginForm.password': savedCredentials.password || '',
        rememberPassword: true
      });
    }
  },

  // 用户名输入
  onUsernameInput(e) {
    this.setData({
      'loginForm.username': e.detail.value
    });
  },

  // 密码输入
  onPasswordInput(e) {
    this.setData({
      'loginForm.password': e.detail.value
    });
  },

  // 切换密码显示
  onTogglePassword() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 切换记住密码
  onToggleRemember() {
    this.setData({
      rememberPassword: !this.data.rememberPassword
    });
  },

  // 登录
  async onLogin() {
    const { loginForm, rememberPassword } = this.data;
    
    if (!this.validateForm()) {
      return;
    }

    this.setData({ loading: true });

    try {
      // 调用登录API
      const loginResult = await this.callLoginAPI(loginForm);
      
      if (loginResult.success) {
        // 保存凭证
        if (rememberPassword) {
          this.saveCredentials(loginForm);
        } else {
          this.clearSavedCredentials();
        }
        
        // 设置用户信息
        const userInfo = {
          id: loginResult.user.id,
          username: loginResult.user.username,
          name: loginResult.user.name,
          phone: loginResult.user.phone,
          email: loginResult.user.email,
          avatar: loginResult.user.avatar,
          company: loginResult.user.company,
          position: loginResult.user.position,
          token: loginResult.token,
          isWechatBound: loginResult.user.isWechatBound || false
        };
        
        roleManager.setCurrentUser(USER_TYPES.MANAGER, userInfo);
        
        this.showSuccess('登录成功');
        
        // 如果未绑定微信，询问是否绑定
        if (!userInfo.isWechatBound) {
          setTimeout(() => {
            this.askForWechatBinding();
          }, 1000);
        } else {
          this.navigateToMain();
        }
      } else {
        this.showError(loginResult.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      this.showError('登录失败，请重试');
    } finally {
      this.setData({ loading: false });
    }
  },

  // 验证表单
  validateForm() {
    const { loginForm } = this.data;
    
    if (!loginForm.username.trim()) {
      this.showError('请输入用户名');
      return false;
    }
    
    if (!loginForm.password.trim()) {
      this.showError('请输入密码');
      return false;
    }
    
    if (loginForm.username.length < 3) {
      this.showError('用户名至少3个字符');
      return false;
    }
    
    if (loginForm.password.length < 6) {
      this.showError('密码至少6个字符');
      return false;
    }
    
    return true;
  },

  // 调用登录API
  async callLoginAPI(loginForm) {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟验证
        if (loginForm.username === 'manager001' && loginForm.password === '123456') {
          resolve({
            success: true,
            user: {
              id: 'manager001',
              username: 'manager001',
              name: '张经理',
              phone: '13800138000',
              email: 'manager001@example.com',
              avatar: '',
              company: '某某电力公司',
              position: '客户经理',
              isWechatBound: false
            },
            token: 'mock_token_' + Date.now()
          });
        } else if (loginForm.username === 'manager002' && loginForm.password === '123456') {
          resolve({
            success: true,
            user: {
              id: 'manager002',
              username: 'manager002',
              name: '李经理',
              phone: '13800138001',
              email: 'manager002@example.com',
              avatar: '',
              company: '某某电力公司',
              position: '高级客户经理',
              isWechatBound: true
            },
            token: 'mock_token_' + Date.now()
          });
        } else {
          resolve({
            success: false,
            message: '用户名或密码错误'
          });
        }
      }, 1000);
    });
  },

  // 保存凭证
  saveCredentials(loginForm) {
    safeSetStorage('saved_credentials', {
      username: loginForm.username,
      password: loginForm.password
    });
  },

  // 清除保存的凭证
  clearSavedCredentials() {
    wx.removeStorageSync('saved_credentials');
  },

  // 询问是否绑定微信
  async askForWechatBinding() {
    try {
      // 获取微信信息
      const wechatInfo = await this.getWechatInfo();
      
      this.setData({
        wechatInfo,
        showBindWechat: true
      });
    } catch (error) {
      console.error('获取微信信息失败:', error);
      this.navigateToMain();
    }
  },

  // 获取微信信息
  async getWechatInfo() {
    try {
      const loginRes = await wx.login();
      
      if (loginRes.code) {
        // 在实际项目中，这里应该调用后端API获取微信信息
        return {
          nickName: '微信用户',
          avatarUrl: ''
        };
      }
      
      throw new Error('获取微信登录code失败');
    } catch (error) {
      throw error;
    }
  },

  // 关闭绑定弹窗
  onCloseBindWechat() {
    this.setData({ showBindWechat: false });
    this.navigateToMain();
  },

  // 跳过绑定
  onSkipBind() {
    this.setData({ showBindWechat: false });
    this.navigateToMain();
  },

  // 确认绑定
  async onConfirmBind() {
    this.setData({ binding: true });
    
    try {
      // 调用绑定API
      const bindResult = await this.callBindWechatAPI();
      
      if (bindResult.success) {
        this.showSuccess('微信绑定成功');
        
        // 更新用户信息
        const currentUser = roleManager.getCurrentUserInfo();
        currentUser.isWechatBound = true;
        roleManager.setUserInfo(currentUser, USER_TYPES.MANAGER);
        
        this.setData({ showBindWechat: false });
        this.navigateToMain();
      } else {
        this.showError(bindResult.message || '绑定失败');
      }
    } catch (error) {
      console.error('绑定失败:', error);
      this.showError('绑定失败，请重试');
    } finally {
      this.setData({ binding: false });
    }
  },

  // 调用绑定微信API
  async callBindWechatAPI() {
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

  // 跳转到主页面
  navigateToMain() {
    wx.reLaunch({
      url: '/pages/menu/manager/workplace/workplace'
    });
  },

  // 微信一键登录
  async onWechatLogin() {
    try {
      this.showLoading('微信登录中...');
      
      // 获取微信登录code
      const loginRes = await wx.login();
      
      if (loginRes.code) {
        // 调用微信登录API
        const wechatLoginResult = await this.callWechatLoginAPI(loginRes.code);
        
        if (wechatLoginResult.success) {
          // 设置用户信息
          roleManager.setUserInfo(wechatLoginResult.user, USER_TYPES.MANAGER);
          
          this.showSuccess('微信登录成功');
          this.navigateToMain();
        } else {
          this.showError(wechatLoginResult.message || '微信登录失败');
        }
      } else {
        this.showError('获取微信登录授权失败');
      }
    } catch (error) {
      console.error('微信登录失败:', error);
      this.showError('微信登录失败');
    } finally {
      this.hideLoading();
    }
  },

  // 调用微信登录API
  async callWechatLoginAPI(code) {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟已绑定的用户
        resolve({
          success: true,
          user: {
            id: 'manager002',
            username: 'manager002',
            name: '李经理',
            phone: '13800138001',
            email: 'manager002@example.com',
            avatar: '',
            company: '某某电力公司',
            position: '高级客户经理',
            isWechatBound: true
          },
          token: 'mock_token_' + Date.now()
        });
      }, 1000);
    });
  },

  // 忘记密码
  onForgotPassword() {
    wx.navigateTo({
      url: '/pages/auth/forgot-password/index'
    });
  },

  // 注册账号
  onRegister() {
    wx.navigateTo({
      url: '/pages/auth/register/index'
    });
  },

  // 使用演示账号
  onUseDemoAccount(e) {
    const { username, password } = e.currentTarget.dataset;
    
    this.setData({
      'loginForm.username': username,
      'loginForm.password': password
    });
    
    this.showSuccess('已填入演示账号');
  }
});

// 混入用户体验功能
Object.assign(Page.prototype, userExperienceMixin.methods); 
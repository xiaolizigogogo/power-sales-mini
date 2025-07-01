const { checkRoleAccess } = require('../../../utils/auth');
const { request } = require('../../../utils/api');

Page({
  data: {
    userInfo: null,
    form: {
      name: '',
      phone: '',
      email: '',
      position: '',
      department: ''
    },
    canSubmit: false,
    showVerifyPopup: false,
    verifyCode: '',
    counting: 0,
    phoneVerified: false
  },

  onLoad() {
    // 检查角色权限
    if (!checkRoleAccess('profile')) {
      return;
    }
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      const res = await request('GET', '/api/user/info');
      const userInfo = res.data;
      
      this.setData({
        userInfo,
        form: {
          name: userInfo.name || '',
          phone: userInfo.phone || '',
          email: userInfo.email || '',
          position: userInfo.position || '',
          department: userInfo.department || ''
        },
        phoneVerified: !!userInfo.phone
      });

      this.checkForm();
    } catch (error) {
      console.error('加载用户信息失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 选择头像
  async chooseAvatar() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      const tempFilePath = res.tempFilePaths[0];
      
      wx.showLoading({
        title: '上传中...'
      });

      // 上传头像
      const uploadRes = await request('POST', '/api/user/avatar', {
        file: tempFilePath
      });

      this.setData({
        'userInfo.avatar': uploadRes.data.url
      });

      wx.showToast({
        title: '上传成功'
      });
    } catch (error) {
      console.error('上传头像失败:', error);
      wx.showToast({
        title: '上传失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 表单输入
  onInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;

    this.setData({
      [`form.${field}`]: value
    });

    this.checkForm();
  },

  // 检查表单
  checkForm() {
    const { form, phoneVerified } = this.data;
    const canSubmit = form.name && 
      form.phone && 
      phoneVerified && 
      /^1[3-9]\d{9}$/.test(form.phone) &&
      (!form.email || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email));

    this.setData({ canSubmit });
  },

  // 验证手机号
  verifyPhone() {
    this.setData({
      showVerifyPopup: true,
      verifyCode: ''
    });
  },

  // 关闭验证弹窗
  closeVerifyPopup() {
    this.setData({
      showVerifyPopup: false
    });
  },

  // 验证码输入
  onCodeInput(e) {
    this.setData({
      verifyCode: e.detail
    });
  },

  // 发送验证码
  async sendCode() {
    const { phone } = this.data.form;
    
    try {
      await request('POST', '/api/sms/send', {
        phone,
        type: 'verify'
      });

      // 开始倒计时
      this.setData({ counting: 60 });
      this.startCounting();

      wx.showToast({
        title: '发送成功'
      });
    } catch (error) {
      console.error('发送验证码失败:', error);
      wx.showToast({
        title: '发送失败，请重试',
        icon: 'none'
      });
    }
  },

  // 倒计时
  startCounting() {
    if (this.data.counting <= 0) return;

    setTimeout(() => {
      this.setData({
        counting: this.data.counting - 1
      });
      this.startCounting();
    }, 1000);
  },

  // 确认验证
  async confirmVerify() {
    const { phone } = this.data.form;
    const { verifyCode } = this.data;

    try {
      await request('POST', '/api/sms/verify', {
        phone,
        code: verifyCode
      });

      this.setData({
        phoneVerified: true,
        showVerifyPopup: false
      });

      this.checkForm();

      wx.showToast({
        title: '验证成功'
      });
    } catch (error) {
      console.error('验证失败:', error);
      wx.showToast({
        title: '验证失败，请重试',
        icon: 'none'
      });
    }
  },

  // 提交表单
  async submitForm() {
    if (!this.data.canSubmit) return;

    wx.showLoading({
      title: '保存中...'
    });

    try {
      await request('PUT', '/api/user/info', this.data.form);

      wx.showToast({
        title: '保存成功'
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  }
}); 
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
    // 开发模式下跳过角色权限检查
    const isDev = true; // 临时设置为开发模式
    
    if (!isDev && !checkRoleAccess('profile')) {
      return;
    }
    this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    try {
      // 在开发模式下使用模拟数据
      const isDev = true; // 临时设置为开发模式
      
      if (isDev) {
        const mockUserInfo = {
          name: '张三',
          phone: '13800138000',
          email: 'zhangsan@example.com',
          position: '工程师',
          department: '技术部',
          avatar: '/assets/images/icons/about.png'
        };
        
        this.setData({
          userInfo: mockUserInfo,
          form: {
            name: mockUserInfo.name || '',
            phone: mockUserInfo.phone || '',
            email: mockUserInfo.email || '',
            position: mockUserInfo.position || '',
            department: mockUserInfo.department || ''
          },
          phoneVerified: true // 开发模式下默认已验证
        });
      } else {
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
      }

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
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      const tempFilePath = res.tempFiles[0].tempFilePath;
      
      wx.showLoading({
        title: '上传中...'
      });

      // 在开发模式下模拟上传成功
      const isDev = true; // 临时设置为开发模式
      
      if (isDev) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 直接使用临时文件路径
        this.setData({
          'userInfo.avatar': tempFilePath
        });
      } else {
        // 上传头像
        const uploadRes = await request('POST', '/api/user/avatar', {
          file: tempFilePath
        });

        this.setData({
          'userInfo.avatar': uploadRes.data.url
        });
      }

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
    
    // 开发模式下放宽验证条件
    const isDev = true; // 临时设置为开发模式
    
    let canSubmit = false;
    
    if (isDev) {
      // 开发模式下只需要姓名和手机号
      canSubmit = form.name && form.phone && form.phone.length === 11;
    } else {
      // 生产模式下需要完整验证
      canSubmit = form.name && 
        form.phone && 
        phoneVerified && 
        /^1[3-9]\d{9}$/.test(form.phone) &&
        (!form.email || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email));
    }

    this.setData({ canSubmit });
  },

  // 验证手机号
  verifyPhone() {
    // 开发模式下直接验证成功
    const isDev = true; // 临时设置为开发模式
    
    if (isDev) {
      this.setData({
        phoneVerified: true
      });
      this.checkForm();
      
      wx.showToast({
        title: '开发模式：手机号已验证',
        icon: 'none'
      });
    } else {
      this.setData({
        showVerifyPopup: true,
        verifyCode: ''
      });
    }
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
      verifyCode: e.detail.value
    });
  },

  // 发送验证码
  async sendCode() {
    const { phone } = this.data.form;
    
    try {
      // 在开发模式下模拟发送成功
      const isDev = true; // 临时设置为开发模式
      
      if (isDev) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await request('POST', '/api/sms/send', {
          phone,
          type: 'verify'
        });
      }

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
      // 在开发模式下模拟验证成功
      const isDev = true; // 临时设置为开发模式
      
      if (isDev) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 开发模式下任何6位数字都验证成功
        if (verifyCode.length === 6) {
          this.setData({
            phoneVerified: true,
            showVerifyPopup: false
          });

          this.checkForm();

          wx.showToast({
            title: '验证成功'
          });
        } else {
          throw new Error('验证码格式错误');
        }
      } else {
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
      }
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
      // 在开发模式下模拟保存成功
      const isDev = true; // 临时设置为开发模式
      
      if (isDev) {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 更新本地数据
        this.setData({
          userInfo: {
            ...this.data.userInfo,
            ...this.data.form
          }
        });
      } else {
        await request('PUT', '/api/user/info', this.data.form);
      }

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
// 全局配置组件
const api = require('../../utils/api.js')
const storage = require('../../utils/storage.js')
const common = require('../../utils/common.js')

Component({
  properties: {},
  
  data: {
    isLoading: false,
    globalConfig: {
      // 应用基础配置
      appName: '电力渠道销售平台',
      version: '1.0.0',
      
      // API配置
      apiConfig: {
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000
      },
      
      // 业务配置
      businessConfig: {
        // 订单状态配置
        orderStatus: {
          'pending': { name: '待确认', color: '#FFA500', icon: 'clock' },
          'negotiating': { name: '商务洽谈', color: '#1890FF', icon: 'chat' },
          'contract_signing': { name: '合同签署', color: '#722ED1', icon: 'edit' },
          'service_starting': { name: '服务开通', color: '#13C2C2', icon: 'play' },
          'in_service': { name: '服务中', color: '#52C41A', icon: 'check' },
          'completed': { name: '已完成', color: '#8C8C8C', icon: 'check-circle' },
          'cancelled': { name: '已取消', color: '#FF4D4F', icon: 'close' }
        },
        
        // 跟进类型配置
        followTypes: {
          'phone': { name: '电话联系', icon: 'phone', color: '#1890FF' },
          'wechat': { name: '微信沟通', icon: 'message', color: '#52C41A' },
          'visit': { name: '上门拜访', icon: 'home', color: '#FA8C16' },
          'email': { name: '邮件联系', icon: 'mail', color: '#722ED1' },
          'meeting': { name: '会议洽谈', icon: 'team', color: '#13C2C2' },
          'other': { name: '其他方式', icon: 'more', color: '#8C8C8C' }
        },
        
        // 客户状态配置
        customerStatus: {
          'new': { name: '新客户', color: '#1890FF', icon: 'user-add' },
          'contacted': { name: '已联系', color: '#FA8C16', icon: 'phone' },
          'interested': { name: '有意向', color: '#722ED1', icon: 'heart' },
          'negotiating': { name: '洽谈中', color: '#13C2C2', icon: 'chat' },
          'signed': { name: '已签约', color: '#52C41A', icon: 'check' },
          'lost': { name: '已流失', color: '#FF4D4F', icon: 'close' }
        },
        
        // 产品类型配置
        productTypes: {
          'basic': { name: '基础套餐', color: '#1890FF', description: '适合小微企业' },
          'standard': { name: '标准套餐', color: '#52C41A', description: '适合中小企业' },
          'premium': { name: '高级套餐', color: '#722ED1', description: '适合大中型企业' },
          'enterprise': { name: '企业套餐', color: '#FA8C16', description: '适合大型企业集团' },
          'custom': { name: '定制套餐', color: '#13C2C2', description: '个性化定制方案' }
        },
        
        // 认证状态配置
        authStatus: {
          'unverified': { name: '未认证', color: '#8C8C8C', icon: 'exclamation' },
          'pending': { name: '认证中', color: '#FA8C16', icon: 'clock' },
          'verified': { name: '已认证', color: '#52C41A', icon: 'check-circle' },
          'rejected': { name: '认证失败', color: '#FF4D4F', icon: 'close-circle' }
        },
        
        // 行业类型配置
        industries: [
          { value: 'manufacturing', label: '制造业' },
          { value: 'retail', label: '零售业' },
          { value: 'service', label: '服务业' },
          { value: 'construction', label: '建筑业' },
          { value: 'agriculture', label: '农业' },
          { value: 'transportation', label: '交通运输业' },
          { value: 'technology', label: '科技业' },
          { value: 'finance', label: '金融业' },
          { value: 'education', label: '教育业' },
          { value: 'healthcare', label: '医疗卫生' },
          { value: 'other', label: '其他' }
        ],
        
        // 用电容量配置
        capacityRanges: [
          { value: '0-100', label: '100kW以下', min: 0, max: 100 },
          { value: '100-500', label: '100-500kW', min: 100, max: 500 },
          { value: '500-1000', label: '500-1000kW', min: 500, max: 1000 },
          { value: '1000-5000', label: '1000-5000kW', min: 1000, max: 5000 },
          { value: '5000+', label: '5000kW以上', min: 5000, max: null }
        ]
      },
      
      // UI配置
      uiConfig: {
        // 颜色主题
        colors: {
          primary: '#1890FF',
          success: '#52C41A',
          warning: '#FA8C16',
          error: '#FF4D4F',
          info: '#13C2C2',
          text: '#262626',
          textSecondary: '#8C8C8C',
          border: '#E8E8E8',
          background: '#F5F5F5'
        },
        
        // 字体大小
        fontSizes: {
          xs: '20rpx',
          sm: '24rpx',
          md: '28rpx',
          lg: '32rpx',
          xl: '36rpx',
          xxl: '40rpx'
        },
        
        // 间距配置
        spacing: {
          xs: '8rpx',
          sm: '16rpx',
          md: '24rpx',
          lg: '32rpx',
          xl: '48rpx'
        }
      }
    }
  },
  
  lifetimes: {
    attached() {
      this.initGlobalConfig()
    }
  },
  
  methods: {
    // 初始化全局配置
    async initGlobalConfig() {
      try {
        this.setData({ isLoading: true })
        
        // 从本地存储获取用户配置
        const userConfig = await storage.get('userConfig') || {}
        
        // 合并配置
        const mergedConfig = this.mergeConfig(this.data.globalConfig, userConfig)
        
        // 更新全局配置
        this.setData({ 
          globalConfig: mergedConfig,
          isLoading: false 
        })
        
        // 触发配置初始化完成事件
        this.triggerEvent('configReady', { config: mergedConfig })
        
      } catch (error) {
        console.error('初始化全局配置失败:', error)
        this.setData({ isLoading: false })
      }
    },
    
    // 合并配置
    mergeConfig(defaultConfig, userConfig) {
      return common.deepMerge(defaultConfig, userConfig)
    },
    
    // 获取配置项
    getConfig(key) {
      return common.getNestedValue(this.data.globalConfig, key)
    },
    
    // 更新配置项
    updateConfig(key, value) {
      const config = common.setNestedValue(this.data.globalConfig, key, value)
      this.setData({ globalConfig: config })
      
      // 保存到本地存储
      storage.set('userConfig', config)
      
      // 触发配置更新事件
      this.triggerEvent('configUpdate', { key, value, config })
    },
    
    // 获取订单状态信息
    getOrderStatus(status) {
      return this.getConfig('businessConfig.orderStatus.' + status) || { name: status, color: '#8C8C8C', icon: 'question' }
    },
    
    // 获取跟进类型信息
    getFollowType(type) {
      return this.getConfig('businessConfig.followTypes.' + type) || { name: type, icon: 'more', color: '#8C8C8C' }
    },
    
    // 获取客户状态信息
    getCustomerStatus(status) {
      return this.getConfig('businessConfig.customerStatus.' + status) || { name: status, color: '#8C8C8C', icon: 'user' }
    },
    
    // 获取产品类型信息
    getProductType(type) {
      return this.getConfig('businessConfig.productTypes.' + type) || { name: type, color: '#8C8C8C', description: '' }
    },
    
    // 获取认证状态信息
    getAuthStatus(status) {
      return this.getConfig('businessConfig.authStatus.' + status) || { name: status, color: '#8C8C8C', icon: 'question' }
    },
    
    // 获取行业列表
    getIndustries() {
      return this.getConfig('businessConfig.industries') || []
    },
    
    // 获取用电容量范围
    getCapacityRanges() {
      return this.getConfig('businessConfig.capacityRanges') || []
    },
    
    // 格式化金额
    formatAmount(amount) {
      return common.formatCurrency(amount)
    },
    
    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD') {
      return common.formatDate(date, format)
    },
    
    // 获取主题颜色
    getThemeColor(type = 'primary') {
      return this.getConfig('uiConfig.colors.' + type) || '#1890FF'
    },
    
    // 获取字体大小
    getFontSize(size = 'md') {
      return this.getConfig('uiConfig.fontSizes.' + size) || '28rpx'
    },
    
    // 获取间距
    getSpacing(size = 'md') {
      return this.getConfig('uiConfig.spacing.' + size) || '24rpx'
    }
  }
}) 
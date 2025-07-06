// 数据验证工具类
class Validator {
  constructor() {
    this.rules = {}
    this.messages = {}
  }

  // 添加验证规则
  addRule(field, rule, message = '') {
    if (!this.rules[field]) {
      this.rules[field] = []
    }
    this.rules[field].push(rule)
    
    if (message) {
      if (!this.messages[field]) {
        this.messages[field] = []
      }
      this.messages[field].push(message)
    }
  }

  // 验证单个字段
  validateField(field, value) {
    if (!this.rules[field]) {
      return { valid: true, message: '' }
    }

    for (let i = 0; i < this.rules[field].length; i++) {
      const rule = this.rules[field][i]
      const result = rule(value)
      
      if (!result.valid) {
        return {
          valid: false,
          message: result.message || (this.messages[field] ? this.messages[field][i] : '验证失败')
        }
      }
    }

    return { valid: true, message: '' }
  }

  // 验证所有字段
  validate(data) {
    const errors = {}
    let valid = true

    for (const field in this.rules) {
      const value = data[field]
      const result = this.validateField(field, value)
      
      if (!result.valid) {
        errors[field] = result.message
        valid = false
      }
    }

    return { valid, errors }
  }

  // 清空所有规则
  clear() {
    this.rules = {}
    this.messages = {}
  }

  // 重置指定字段的规则
  clearField(field) {
    delete this.rules[field]
    delete this.messages[field]
  }
}

// 常用验证规则
const validationRules = {
  // 必填验证
  required: (message = '此项为必填项') => {
    return (value) => {
      const valid = value !== undefined && value !== null && value !== ''
      return { valid, message: valid ? '' : message }
    }
  },

  // 长度验证
  minLength: (min, message = `长度不能少于${min}个字符`) => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const valid = value.length >= min
      return { valid, message: valid ? '' : message }
    }
  },

  maxLength: (max, message = `长度不能超过${max}个字符`) => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const valid = value.length <= max
      return { valid, message: valid ? '' : message }
    }
  },

  // 手机号验证
  phone: (message = '请输入正确的手机号') => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const phoneRegex = /^1[3-9]\d{9}$/
      const valid = phoneRegex.test(value)
      return { valid, message: valid ? '' : message }
    }
  },

  // 邮箱验证
  email: (message = '请输入正确的邮箱地址') => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const valid = emailRegex.test(value)
      return { valid, message: valid ? '' : message }
    }
  },

  // 身份证验证
  idCard: (message = '请输入正确的身份证号') => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
      const valid = idCardRegex.test(value)
      return { valid, message: valid ? '' : message }
    }
  },

  // 数字验证
  number: (message = '请输入数字') => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const valid = !isNaN(value) && !isNaN(parseFloat(value))
      return { valid, message: valid ? '' : message }
    }
  },

  // 数值范围验证
  range: (min, max, message = `请输入${min}到${max}之间的数值`) => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const num = parseFloat(value)
      const valid = !isNaN(num) && num >= min && num <= max
      return { valid, message: valid ? '' : message }
    }
  },

  // 最小值验证
  min: (min, message = `数值不能小于${min}`) => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const num = parseFloat(value)
      const valid = !isNaN(num) && num >= min
      return { valid, message: valid ? '' : message }
    }
  },

  // 最大值验证
  max: (max, message = `数值不能大于${max}`) => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const num = parseFloat(value)
      const valid = !isNaN(num) && num <= max
      return { valid, message: valid ? '' : message }
    }
  },

  // 正则表达式验证
  pattern: (regex, message = '格式不正确') => {
    return (value) => {
      if (!value) return { valid: true, message: '' }
      const valid = regex.test(value)
      return { valid, message: valid ? '' : message }
    }
  },

  // 自定义验证
  custom: (validator, message = '验证失败') => {
    return (value) => {
      try {
        const valid = validator(value)
        return { valid, message: valid ? '' : message }
      } catch (error) {
        return { valid: false, message: error.message || message }
      }
    }
  }
}

// 预定义验证器
const validators = {
  // 客户信息验证器
  customer: () => {
    const validator = new Validator()
    
    validator.addRule('name', validationRules.required('客户姓名不能为空'))
    validator.addRule('name', validationRules.minLength(2, '客户姓名至少2个字符'))
    validator.addRule('name', validationRules.maxLength(20, '客户姓名不能超过20个字符'))
    
    validator.addRule('phone', validationRules.required('手机号不能为空'))
    validator.addRule('phone', validationRules.phone())
    
    validator.addRule('email', validationRules.email())
    
    validator.addRule('companyName', validationRules.required('公司名称不能为空'))
    validator.addRule('companyName', validationRules.minLength(2, '公司名称至少2个字符'))
    validator.addRule('companyName', validationRules.maxLength(50, '公司名称不能超过50个字符'))
    
    validator.addRule('position', validationRules.maxLength(30, '职位不能超过30个字符'))
    
    validator.addRule('industry', validationRules.required('行业不能为空'))
    
    validator.addRule('annualConsumption', validationRules.min(0, '年用电量不能为负数'))
    
    return validator
  },

  // 跟进记录验证器
  followRecord: () => {
    const validator = new Validator()
    
    validator.addRule('customerId', validationRules.required('客户ID不能为空'))
    validator.addRule('title', validationRules.required('跟进标题不能为空'))
    validator.addRule('title', validationRules.maxLength(50, '跟进标题不能超过50个字符'))
    
    validator.addRule('content', validationRules.required('跟进内容不能为空'))
    validator.addRule('content', validationRules.maxLength(500, '跟进内容不能超过500个字符'))
    
    validator.addRule('followType', validationRules.required('跟进类型不能为空'))
    validator.addRule('priority', validationRules.required('优先级不能为空'))
    
    return validator
  },

  // 登录验证器
  login: () => {
    const validator = new Validator()
    
    validator.addRule('phone', validationRules.required('手机号不能为空'))
    validator.addRule('phone', validationRules.phone())
    
    validator.addRule('password', validationRules.required('密码不能为空'))
    validator.addRule('password', validationRules.minLength(6, '密码至少6个字符'))
    
    return validator
  },

  // 短信验证码验证器
  smsCode: () => {
    const validator = new Validator()
    
    validator.addRule('phone', validationRules.required('手机号不能为空'))
    validator.addRule('phone', validationRules.phone())
    
    validator.addRule('code', validationRules.required('验证码不能为空'))
    validator.addRule('code', validationRules.pattern(/^\d{6}$/, '验证码格式不正确'))
    
    return validator
  },

  // 业绩目标验证器
  performanceTarget: () => {
    const validator = new Validator()
    
    validator.addRule('targetAmount', validationRules.required('目标金额不能为空'))
    validator.addRule('targetAmount', validationRules.min(0, '目标金额不能为负数'))
    
    validator.addRule('targetCustomers', validationRules.required('目标客户数不能为空'))
    validator.addRule('targetCustomers', validationRules.min(0, '目标客户数不能为负数'))
    
    validator.addRule('period', validationRules.required('目标周期不能为空'))
    
    return validator
  }
}

// 快速验证函数
const quickValidate = {
  // 验证手机号
  phone: (phone) => {
    if (!phone) return { valid: false, message: '手机号不能为空' }
    const phoneRegex = /^1[3-9]\d{9}$/
    const valid = phoneRegex.test(phone)
    return { valid, message: valid ? '' : '请输入正确的手机号' }
  },

  // 验证邮箱
  email: (email) => {
    if (!email) return { valid: true, message: '' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const valid = emailRegex.test(email)
    return { valid, message: valid ? '' : '请输入正确的邮箱地址' }
  },

  // 验证身份证
  idCard: (idCard) => {
    if (!idCard) return { valid: false, message: '身份证号不能为空' }
    const idCardRegex = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
    const valid = idCardRegex.test(idCard)
    return { valid, message: valid ? '' : '请输入正确的身份证号' }
  },

  // 验证必填项
  required: (value, fieldName = '此项') => {
    const valid = value !== undefined && value !== null && value !== ''
    return { valid, message: valid ? '' : `${fieldName}不能为空` }
  },

  // 验证长度
  length: (value, min, max, fieldName = '此项') => {
    if (!value) return { valid: true, message: '' }
    const len = value.length
    let valid = true
    let message = ''
    
    if (min && len < min) {
      valid = false
      message = `${fieldName}长度不能少于${min}个字符`
    } else if (max && len > max) {
      valid = false
      message = `${fieldName}长度不能超过${max}个字符`
    }
    
    return { valid, message }
  },

  // 验证数值范围
  range: (value, min, max, fieldName = '此项') => {
    if (!value) return { valid: true, message: '' }
    const num = parseFloat(value)
    
    if (isNaN(num)) {
      return { valid: false, message: `${fieldName}必须是数字` }
    }
    
    let valid = true
    let message = ''
    
    if (min !== undefined && num < min) {
      valid = false
      message = `${fieldName}不能小于${min}`
    } else if (max !== undefined && num > max) {
      valid = false
      message = `${fieldName}不能大于${max}`
    }
    
    return { valid, message }
  }
}

// 表单验证混合器
const formValidationMixin = {
  data() {
    return {
      formErrors: {},
      formValid: true
    }
  },
  
  methods: {
    // 验证单个字段
    validateField(field, value, rules) {
      const validator = new Validator()
      
      rules.forEach(rule => {
        if (typeof rule === 'function') {
          validator.addRule(field, rule)
        } else if (rule.rule && rule.message) {
          validator.addRule(field, rule.rule, rule.message)
        }
      })
      
      const result = validator.validateField(field, value)
      
      if (!result.valid) {
        this.setData({
          [`formErrors.${field}`]: result.message,
          formValid: false
        })
      } else {
        this.setData({
          [`formErrors.${field}`]: '',
          formValid: true
        })
      }
      
      return result
    },
    
    // 验证表单
    validateForm(data, validator) {
      const result = validator.validate(data)
      
      this.setData({
        formErrors: result.errors,
        formValid: result.valid
      })
      
      return result
    },
    
    // 清空验证错误
    clearValidationErrors() {
      this.setData({
        formErrors: {},
        formValid: true
      })
    }
  }
}

module.exports = {
  Validator,
  validationRules,
  validators,
  quickValidate,
  formValidationMixin
} 
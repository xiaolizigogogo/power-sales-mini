const { api, apiService } = require('../../../utils/api');
const util = require('../../../utils/common');

Page({
  data: {
    // 客户基本信息
    basicInfo: {
      companyName: ''
    },
    
    // 用电设施信息
    facilityInfo: {
      transformerCount: '',
      totalCapacity: '',
      voltageLevel: '',
      electricityNature: '',
      userCodes: ['', '', '']
    },
    
    // 用电量特征
    electricityInfo: {
      companySize: '', // large, medium, small
      monthlyFluctuation: '' // stable, normal, large
    },
    
    // 风险偏好评估
    riskPreference: {
      riskTolerance: '', // low, medium_low, medium_high, high
      budgetManagement: '' // very_strict, strict, normal, loose
    },
    
    // 管理能力评估
    managementCapability: {
      energyTeam: '', // professional, part_time, none
      technicalCapability: '', // high, medium, low
      marketKnowledge: '' // very_knowledgeable, knowledgeable, normal, none
    },
    
    // 合同偏好
    contractPreference: {
      contractPeriod: '', // 1, 2, 3
      settlementMethod: '', // monthly, quarterly, yearly
      serviceContent: '' // basic, value_added, custom
    },
    
    // 评分结果
    matchingResults: {
      fixedPrice: 0,
      fixedServiceFee: 0,
      priceDifference: 0,
      marketPrice: 0,
      spotTime: 0,
      recommendations: []
    },
    
    // 页面状态
    currentStep: 0,
    totalSteps: 6,
    loading: false,
    showResults: false
  },

  onLoad(options) {
    console.log('客户匹配功能页面加载');
  },

  // 步骤导航
  nextStep() {
    if (this.data.currentStep < this.data.totalSteps - 1) {
      this.setData({
        currentStep: this.data.currentStep + 1
      });
    }
  },

  prevStep() {
    if (this.data.currentStep > 0) {
      this.setData({
        currentStep: this.data.currentStep - 1
      });
    }
  },

  // 基本信息输入
  onBasicInfoInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`basicInfo.${field}`]: value
    });
  },

  // 用电设施信息输入
  onFacilityInfoInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`facilityInfo.${field}`]: value
    });
  },

  // 用户编号输入
  onUserCodeInput(e) {
    const { index } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`facilityInfo.userCodes[${index}]`]: value
    });
  },

  // 用电量信息输入
  onElectricityInfoInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`electricityInfo.${field}`]: value
    });
  },

  // 月度数据输入
  onMonthlyDataInput(e) {
    const { month, field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`electricityInfo.monthlyData[${month}].${field}`]: value
    });
  },

  // 评估选项选择
  onAssessmentChange(e) {
    const { category, field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`${category}.${field}`]: value
    });
  },

  // 企业特征输入
  onCompanyFeatureInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`companyFeatures.${field}`]: value
    });
  },

  // 特殊需求输入
  onSpecialNeedInput(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    this.setData({
      [`specialNeeds.${field}`]: value
    });
  },

  // 计算评分
  calculateMatchingScore() {
    const {
      electricityInfo,
      riskPreference,
      managementCapability,
      contractPreference
    } = this.data;

    // 数据验证
    if (!electricityInfo.companySize || !electricityInfo.monthlyFluctuation) {
      wx.showToast({
        title: '请完善用电量特征信息',
        icon: 'none'
      });
      return { results: {}, recommendations: [] };
    }

    if (!riskPreference.riskTolerance || !riskPreference.budgetManagement) {
      wx.showToast({
        title: '请完善风险偏好评估',
        icon: 'none'
      });
      return { results: {}, recommendations: [] };
    }

    if (!managementCapability.energyTeam || !managementCapability.technicalCapability) {
      wx.showToast({
        title: '请完善管理能力评估',
        icon: 'none'
      });
      return { results: {}, recommendations: [] };
    }

    if (!contractPreference.contractPeriod || !contractPreference.settlementMethod || !contractPreference.serviceContent) {
      wx.showToast({
        title: '请完善合同偏好',
        icon: 'none'
      });
      return { results: {}, recommendations: [] };
    }

    // 用电量特征评分（30分）
    const electricityScore = this.calculateElectricityScore(electricityInfo);
    
    // 风险偏好评分（30分）
    const riskScore = this.calculateRiskScore(riskPreference);
    
    // 管理能力评分（40分）
    const managementScore = this.calculateManagementScore(managementCapability);

    // 计算各合同类型匹配度
    const results = {
      fixedPrice: this.calculateFixedPriceScore(electricityScore, riskScore, managementScore),
      fixedServiceFee: this.calculateFixedServiceFeeScore(electricityScore, riskScore, managementScore),
      priceDifference: this.calculatePriceDifferenceScore(electricityScore, riskScore, managementScore),
      marketPrice: this.calculateMarketPriceScore(electricityScore, riskScore, managementScore),
      spotTime: this.calculateSpotTimeScore(electricityScore, riskScore, managementScore)
    };

    // 调试输出
    console.log('=== 评分计算调试 ===');
    console.log('基础评分:', { electricityScore, riskScore, managementScore });
    console.log('合同评分:', results);
    console.log('客户数据:', { electricityInfo, riskPreference, managementCapability });

    // 生成推荐
    const recommendations = this.generateRecommendations(results);

    this.setData({
      'matchingResults': { ...results, recommendations },
      showResults: true
    });

    return { results, recommendations };
  },

  // 用电量特征评分（100分）
  calculateElectricityScore(electricityInfo) {
    let score = 0;
    
    // 用电量大小评分（50分）
    const sizeMap = {
      'large': 50, // 大型企业（年用电量大于1000万度）
      'medium': 35, // 中型企业（年用电量100-1000万度）
      'small': 20 // 小型企业（年用电量小于100万度）
    };
    score += sizeMap[electricityInfo.companySize] || 0;
    
    // 用电稳定性评分（50分）
    const stabilityMap = {
      'stable': 50, // 稳定（波动小于10%）
      'normal': 35, // 一般（波动10-30%）
      'large': 20 // 波动大（波动大于30%）
    };
    score += stabilityMap[electricityInfo.monthlyFluctuation] || 0;
    
    return score;
  },

  // 风险偏好评分（100分）
  calculateRiskScore(riskPreference) {
    let score = 0;
    
    // 风险承受能力评分（70分）
    const riskMap = {
      'low': 20, // 低风险
      'medium_low': 40, // 中低风险
      'medium_high': 60, // 中高风险
      'high': 70 // 高风险
    };
    score += riskMap[riskPreference.riskTolerance] || 0;
    
    // 预算管理严格程度评分（30分）
    const budgetMap = {
      'very_strict': 15, // 非常严格
      'strict': 25, // 比较严格
      'normal': 30, // 一般
      'loose': 30 // 较宽松
    };
    score += budgetMap[riskPreference.budgetManagement] || 0;
    
    return score;
  },

  // 管理能力评分（100分）
  calculateManagementScore(managementCapability) {
    let score = 0;
    
    // 能源管理能力评分（50分）
    const teamMap = {
      'professional': 50, // 专业团队
      'part_time': 35, // 一定认知
      'none': 20 // 基础管理
    };
    score += teamMap[managementCapability.energyTeam] || 0;
    
    // 技术能力评分（25分）
    const technicalMap = {
      'high': 25, // 有储能设备或调峰能力
      'medium': 20, // 用电时间可以灵活调整
      'low': 10 // 其他（无特殊技术能力）
    };
    score += technicalMap[managementCapability.technicalCapability] || 0;
    
    // 电力市场了解程度评分（25分）
    const knowledgeMap = {
      'very_knowledgeable': 25, // 非常了解
      'knowledgeable': 20, // 比较了解
      'normal': 15, // 一般了解
      'none': 10 // 不了解
    };
    // 如果为空值，默认为"none"
    const marketKnowledge = managementCapability.marketKnowledge || 'none';
    score += knowledgeMap[marketKnowledge] || 0;
    
    return score;
  },

  // 各合同类型评分计算
  calculateFixedPriceScore(electricityScore, riskScore, managementScore) {
    // 固定价合同适合：用电稳定 + 低风险偏好 + 基础管理能力
    // 用电稳定性权重高，风险承受能力低，管理能力要求不高
    const stabilityWeight = 0.4;
    const riskWeight = 0.4;
    const managementWeight = 0.2;
    
    // 风险评分需要反向计算（风险越低，越适合固定价）
    const riskInverted = 100 - riskScore;
    
    // 用电稳定性加分（稳定用电更适合固定价）
    const stabilityBonus = electricityScore >= 70 ? 10 : 0;
    
    return Math.round(electricityScore * stabilityWeight + 
                     riskInverted * riskWeight + 
                     managementScore * managementWeight + stabilityBonus);
  },

  calculateFixedServiceFeeScore(electricityScore, riskScore, managementScore) {
    // 固定服务费合同适合：中等用电量 + 中低风险偏好 + 一定认知能力
    const electricityWeight = 0.3;
    const riskWeight = 0.3;
    const managementWeight = 0.4;
    
    // 管理能力加分（有一定管理能力更适合）
    const managementBonus = managementScore >= 60 ? 8 : 0;
    
    return Math.round(electricityScore * electricityWeight + 
                     riskScore * riskWeight + 
                     managementScore * managementWeight + managementBonus);
  },

  calculatePriceDifferenceScore(electricityScore, riskScore, managementScore) {
    // 价差分成合同适合：用电量波动 + 中高风险偏好 + 一定认知能力
    const electricityWeight = 0.3;
    const riskWeight = 0.4;
    const managementWeight = 0.3;
    
    // 用电量评分需要反向计算（波动越大，越适合价差分成）
    const electricityInverted = Math.max(0, 100 - electricityScore);
    
    // 风险偏好加分（中高风险更适合）
    const riskBonus = riskScore >= 60 ? 10 : 0;
    
    return Math.round(electricityInverted * electricityWeight + 
                     riskScore * riskWeight + 
                     managementScore * managementWeight + riskBonus);
  },

  calculateMarketPriceScore(electricityScore, riskScore, managementScore) {
    // 市场成交价合同适合：大型企业 + 高风险偏好 + 专业团队能力
    const electricityWeight = 0.3;
    const riskWeight = 0.3;
    const managementWeight = 0.4;
    
    // 企业规模加分（大型企业更适合）
    const sizeBonus = electricityScore >= 80 ? 10 : 0;
    
    // 管理能力加分（专业团队更适合）
    const managementBonus = managementScore >= 80 ? 10 : 0;
    
    return Math.round(electricityScore * electricityWeight + 
                     riskScore * riskWeight + 
                     managementScore * managementWeight + sizeBonus + managementBonus);
  },

  calculateSpotTimeScore(electricityScore, riskScore, managementScore) {
    // 现货分时合同适合：技术能力 + 用电时间可调 + 管理能力
    const electricityWeight = 0.2;
    const riskWeight = 0.2;
    const managementWeight = 0.6;
    
    // 技术能力加分（有技术能力更适合）
    const technicalBonus = managementScore >= 70 ? 15 : 0;
    
    return Math.round(electricityScore * electricityWeight + 
                     riskScore * riskWeight + 
                     managementScore * managementWeight + technicalBonus);
  },

  // 生成推荐
  generateRecommendations(results) {
    const recommendations = [];
    const { fixedPrice, fixedServiceFee, priceDifference, marketPrice, spotTime } = results;
    
    // 按评分排序
    const scores = [
      { type: '固定价合同', score: fixedPrice, threshold: 60 },
      { type: '固定服务费合同', score: fixedServiceFee, threshold: 65 },
      { type: '价差分成合同', score: priceDifference, threshold: 70 },
      { type: '市场成交价合同', score: marketPrice, threshold: 75 },
      { type: '现货分时合同', score: spotTime, threshold: 70 }
    ];
    
    scores.sort((a, b) => b.score - a.score);
    
    // 生成推荐（至少推荐前3个）
    scores.forEach((item, index) => {
      if (item.score >= item.threshold || index < 3) {
        recommendations.push({
          rank: index + 1,
          type: item.type,
          score: item.score,
          matchLevel: this.getMatchLevel(item.score),
          reason: this.getRecommendationReason(item.type),
          risk: this.getRiskDescription(item.type)
        });
      }
    });
    
    return recommendations;
  },

  // 获取匹配等级
  getMatchLevel(score) {
    if (score >= 85) return '高度匹配';
    if (score >= 70) return '良好匹配';
    if (score >= 55) return '一般匹配';
    return '低度匹配';
  },

  // 获取推荐理由
  getRecommendationReason(type) {
    const reasons = {
      '固定价合同': '价格完全锁定，风险最低，适合对价格稳定性要求极高的企业',
      '固定服务费合同': '服务费固定，电价市场化，适合希望控制服务成本的企业',
      '价差分成合同': '风险共担，收益共享，适合愿意承担一定风险的企业',
      '市场成交价合同': '完全市场化，可能获得最低价格，适合风险承受能力强的大型企业',
      '现货分时合同': '分时计价，鼓励错峰用电，适合有调峰能力的企业'
    };
    return reasons[type] || '';
  },

  // 获取风险描述
  getRiskDescription(type) {
    const risks = {
      '固定价合同': '市场价格下跌时可能觉得价格偏高',
      '固定服务费合同': '电价部分随市场波动',
      '价差分成合同': '需要承担一定价格风险',
      '市场成交价合同': '价格完全市场化，风险最高',
      '现货分时合同': '需要调整用电习惯'
    };
    return risks[type] || '';
  },

  // 提交客户信息
  async submitCustomerInfo() {
    try {
      this.setData({ loading: true });
      
      // 计算评分
      const { results, recommendations } = this.calculateMatchingScore();
      
      // 准备提交数据
      const submitData = {
        // 基本信息
        companyName: this.data.basicInfo.companyName,
        
        // 用电设施信息（JSON字符串）
        facilityInfo: JSON.stringify(this.data.facilityInfo),
        
        // 用电量特征（JSON字符串）
        electricityInfo: JSON.stringify(this.data.electricityInfo),
        
        // 风险偏好评估（JSON字符串）
        riskPreference: JSON.stringify(this.data.riskPreference),
        
        // 管理能力评估（JSON字符串）
        managementCapability: JSON.stringify(this.data.managementCapability),
        
        // 合同偏好（JSON字符串）
        contractPreference: JSON.stringify(this.data.contractPreference),
        
        // 匹配结果（JSON字符串）
        matchingResults: JSON.stringify(results),
        recommendations: JSON.stringify(recommendations),
        
        // 提交时间
        submitTime: new Date().toISOString()
      };
      
      // 调用API保存数据
      const response = await api.submitCustomerMatching(submitData);
      
      if (response.code === 200) {
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        
        // 显示结果
        this.setData({
          showResults: true,
          loading: false
        });
      } else {
        throw new Error(response.message || '提交失败');
      }
      
    } catch (error) {
      console.error('提交客户信息失败:', error);
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
      this.setData({ loading: false });
    }
  },

  // 保存草稿
  async saveDraft() {
    try {
      const draftData = {
        basicInfo: this.data.basicInfo,
        facilityInfo: this.data.facilityInfo,
        electricityInfo: this.data.electricityInfo,
        riskPreference: this.data.riskPreference,
        managementCapability: this.data.managementCapability,
        contractPreference: this.data.contractPreference,
        saveTime: new Date().toISOString()
      };
      
      // 保存到本地存储
      wx.setStorageSync('customer_matching_draft', draftData);
      
      wx.showToast({
        title: '草稿已保存',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('保存草稿失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 加载草稿
  loadDraft() {
    try {
      const draftData = wx.getStorageSync('customer_matching_draft');
      if (draftData) {
        // 恢复数据到各个部分
        const dataToRestore = {};
        
        if (draftData.basicInfo) {
          dataToRestore.basicInfo = draftData.basicInfo;
        }
        if (draftData.facilityInfo) {
          dataToRestore.facilityInfo = draftData.facilityInfo;
        }
        if (draftData.electricityInfo) {
          dataToRestore.electricityInfo = draftData.electricityInfo;
        }
        if (draftData.riskPreference) {
          dataToRestore.riskPreference = draftData.riskPreference;
        }
        if (draftData.managementCapability) {
          dataToRestore.managementCapability = draftData.managementCapability;
        }
        if (draftData.contractPreference) {
          dataToRestore.contractPreference = draftData.contractPreference;
        }
        
        this.setData(dataToRestore);
        
        wx.showToast({
          title: '草稿已加载',
          icon: 'success'
        });
      }
    } catch (error) {
      console.error('加载草稿失败:', error);
    }
  },

  // 重置表单
  resetForm() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有信息吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            basicInfo: {
              companyName: ''
            },
            facilityInfo: {
              transformerCount: '',
              totalCapacity: '',
              voltageLevel: '',
              electricityNature: '',
              userCodes: ['', '', '']
            },
            electricityInfo: {
              companySize: '',
              monthlyFluctuation: ''
            },
            riskPreference: {
              riskTolerance: '',
              budgetManagement: ''
            },
            managementCapability: {
              energyTeam: '',
              technicalCapability: '',
              marketKnowledge: ''
            },
            contractPreference: {
              contractPeriod: '',
              settlementMethod: '',
              serviceContent: ''
            },
            currentStep: 0,
            showResults: false
          });
          
          wx.showToast({
            title: '已重置',
            icon: 'success'
          });
        }
      }
    });
  }
}); 
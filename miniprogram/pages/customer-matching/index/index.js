const { api, apiService } = require('../../../utils/api');
const util = require('../../../utils/common');

Page({
  data: {
    // 客户基本信息
    basicInfo: {
      companyName: '',
      creditCode: '',
      legalPerson: '',
      registeredAddress: '',
      bankName: '',
      bankAccount: '',
      contactPerson: '',
      contactPhone: ''
    },
    
    // 用电设施信息
    facilityInfo: {
      transformerCount: '',
      totalCapacity: '',
      voltageLevel: '',
      electricityNature: '',
      userCodes: ['', '', '']
    },
    
    // 用电量信息
    electricityInfo: {
      annualTotal: '',
      averageMonthly: '',
      maxMonthly: '',
      minMonthly: '',
      monthlyData: Array(12).fill().map(() => ({
        total: '',
        peak: '',
        high: '',
        normal: '',
        valley: ''
      }))
    },
    
    // 用电稳定性评估
    stabilityAssessment: {
      monthlyFluctuation: 'stable', // stable, normal, large
      seasonalFeature: 'none', // none, summer, winter, spring_autumn
      workHolidayDiff: 'small', // small, normal, large
      loadCurveFeature: 'stable' // stable, double_peak, single_peak, fluctuating
    },
    
    // 企业特征信息
    companyFeatures: {
      companySize: '', // large, medium, small
      industryType: '',
      mainProduct: '',
      productionFeature: 'continuous', // continuous, intermittent, seasonal
      priceSensitivity: 'very_sensitive', // very_sensitive, sensitive, normal, insensitive
      budgetManagement: 'very_strict', // very_strict, strict, normal, loose
      riskTolerance: 'low', // low, medium, high, very_high
      costControl: 'strict' // strict, normal, loose
    },
    
    // 管理能力信息
    managementCapability: {
      energyTeam: 'none', // professional, part_time, none
      marketKnowledge: 'none', // very_knowledgeable, knowledgeable, normal, none
      tradingExperience: 'none', // rich, some, none
      dispatchCapability: 'weak', // strong, medium, weak
      storageEquipment: 'no', // yes, no, planned
      peakShavingCapability: 'no', // yes, no, partial
      timeAdjustable: 'no', // flexible, slight, no
      productionFlexibility: 'low' // high, medium, low
    },
    
    // 特殊需求
    specialNeeds: {
      priceRequirement: '',
      serviceRequirement: '',
      technicalRequirement: '',
      otherRequirement: '',
      contractPeriod: '1', // 1, 2, 3
      settlementMethod: 'monthly', // monthly, quarterly, yearly
      serviceContent: 'basic' // basic, value_added, custom
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
      stabilityAssessment,
      companyFeatures,
      managementCapability
    } = this.data;

    // 用电量特征评分（30分）
    const electricityScore = this.calculateElectricityScore(electricityInfo, stabilityAssessment);
    
    // 风险偏好评分（30分）
    const riskScore = this.calculateRiskScore(companyFeatures);
    
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

    // 生成推荐
    const recommendations = this.generateRecommendations(results);

    this.setData({
      'matchingResults': { ...results, recommendations },
      showResults: true
    });

    return { results, recommendations };
  },

  // 用电量特征评分
  calculateElectricityScore(electricityInfo, stabilityAssessment) {
    let score = 0;
    
    // 用电量大小评分（15分）
    const annualTotal = parseFloat(electricityInfo.annualTotal) || 0;
    if (annualTotal > 1000) {
      score += 15; // 大型企业
    } else if (annualTotal > 100) {
      score += 10; // 中型企业
    } else {
      score += 5; // 小型企业
    }
    
    // 用电稳定性评分（15分）
    const stabilityMap = {
      'stable': 15,
      'normal': 10,
      'large': 5
    };
    score += stabilityMap[stabilityAssessment.monthlyFluctuation] || 0;
    
    return score;
  },

  // 风险偏好评分
  calculateRiskScore(companyFeatures) {
    let score = 0;
    
    // 风险承受能力评分（20分）
    const riskMap = {
      'low': 5,
      'medium': 10,
      'high': 15,
      'very_high': 20
    };
    score += riskMap[companyFeatures.riskTolerance] || 0;
    
    // 预算管理严格程度评分（10分）
    const budgetMap = {
      'very_strict': 5,
      'strict': 8,
      'normal': 10,
      'loose': 10
    };
    score += budgetMap[companyFeatures.budgetManagement] || 0;
    
    return score;
  },

  // 管理能力评分
  calculateManagementScore(managementCapability) {
    let score = 0;
    
    // 能源管理能力评分（20分）
    const teamMap = {
      'professional': 20,
      'part_time': 15,
      'none': 10
    };
    score += teamMap[managementCapability.energyTeam] || 0;
    
    // 技术能力评分（10分）
    if (managementCapability.storageEquipment === 'yes' || managementCapability.peakShavingCapability === 'yes') {
      score += 10;
    } else if (managementCapability.timeAdjustable === 'flexible') {
      score += 8;
    } else {
      score += 5;
    }
    
    // 电力市场了解程度评分（10分）
    const knowledgeMap = {
      'very_knowledgeable': 10,
      'knowledgeable': 8,
      'normal': 5,
      'none': 3
    };
    score += knowledgeMap[managementCapability.marketKnowledge] || 0;
    
    return score;
  },

  // 各合同类型评分计算
  calculateFixedPriceScore(electricityScore, riskScore, managementScore) {
    // 固定价合同适合：用电稳定 + 低风险偏好 + 基础管理能力
    const stabilityWeight = 0.4;
    const riskWeight = 0.4;
    const managementWeight = 0.2;
    
    return Math.round(electricityScore * stabilityWeight + 
                     (30 - riskScore) * riskWeight + 
                     managementScore * managementWeight);
  },

  calculateFixedServiceFeeScore(electricityScore, riskScore, managementScore) {
    // 固定服务费合同适合：中等用电量 + 中低风险偏好 + 一定认知能力
    const electricityWeight = 0.3;
    const riskWeight = 0.3;
    const managementWeight = 0.4;
    
    return Math.round(electricityScore * electricityWeight + 
                     riskScore * riskWeight + 
                     managementScore * managementWeight);
  },

  calculatePriceDifferenceScore(electricityScore, riskScore, managementScore) {
    // 价差分成合同适合：用电量波动 + 中高风险偏好 + 一定认知能力
    const electricityWeight = 0.3;
    const riskWeight = 0.4;
    const managementWeight = 0.3;
    
    return Math.round((60 - electricityScore) * electricityWeight + 
                     riskScore * riskWeight + 
                     managementScore * managementWeight);
  },

  calculateMarketPriceScore(electricityScore, riskScore, managementScore) {
    // 市场成交价合同适合：大型企业 + 高风险偏好 + 专业团队能力
    const electricityWeight = 0.3;
    const riskWeight = 0.3;
    const managementWeight = 0.4;
    
    return Math.round(electricityScore * electricityWeight + 
                     riskScore * riskWeight + 
                     managementScore * managementWeight);
  },

  calculateSpotTimeScore(electricityScore, riskScore, managementScore) {
    // 现货分时合同适合：技术能力 + 用电时间可调 + 管理能力
    const electricityWeight = 0.2;
    const riskWeight = 0.2;
    const managementWeight = 0.6;
    
    return Math.round(electricityScore * electricityWeight + 
                     riskScore * riskWeight + 
                     managementScore * managementWeight);
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
    
    // 生成推荐
    scores.forEach((item, index) => {
      if (item.score >= item.threshold) {
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
    if (score >= 80) return '高度匹配';
    if (score >= 70) return '良好匹配';
    if (score >= 60) return '一般匹配';
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
        ...this.data.basicInfo,
        ...this.data.facilityInfo,
        ...this.data.electricityInfo,
        ...this.data.stabilityAssessment,
        ...this.data.companyFeatures,
        ...this.data.managementCapability,
        ...this.data.specialNeeds,
        matchingResults: results,
        recommendations: recommendations,
        submitTime: new Date().toISOString()
      };
      
      // 调用API保存数据
      const response = await apiService.request({
        url: '/customer-matching/submit',
        method: 'POST',
        data: submitData
      });
      
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
        ...this.data.basicInfo,
        ...this.data.facilityInfo,
        ...this.data.electricityInfo,
        ...this.data.stabilityAssessment,
        ...this.data.companyFeatures,
        ...this.data.managementCapability,
        ...this.data.specialNeeds,
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
        Object.keys(draftData).forEach(key => {
          if (this.data.hasOwnProperty(key)) {
            this.setData({
              [key]: draftData[key]
            });
          }
        });
        
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
              companyName: '',
              creditCode: '',
              legalPerson: '',
              registeredAddress: '',
              bankName: '',
              bankAccount: '',
              contactPerson: '',
              contactPhone: ''
            },
            facilityInfo: {
              transformerCount: '',
              totalCapacity: '',
              voltageLevel: '',
              electricityNature: '',
              userCodes: ['', '', '']
            },
            electricityInfo: {
              annualTotal: '',
              averageMonthly: '',
              maxMonthly: '',
              minMonthly: '',
              monthlyData: Array(12).fill().map(() => ({
                total: '',
                peak: '',
                high: '',
                normal: '',
                valley: ''
              }))
            },
            stabilityAssessment: {
              monthlyFluctuation: 'stable',
              seasonalFeature: 'none',
              workHolidayDiff: 'small',
              loadCurveFeature: 'stable'
            },
            companyFeatures: {
              companySize: '',
              industryType: '',
              mainProduct: '',
              productionFeature: 'continuous',
              priceSensitivity: 'very_sensitive',
              budgetManagement: 'very_strict',
              riskTolerance: 'low',
              costControl: 'strict'
            },
            managementCapability: {
              energyTeam: 'none',
              marketKnowledge: 'none',
              tradingExperience: 'none',
              dispatchCapability: 'weak',
              storageEquipment: 'no',
              peakShavingCapability: 'no',
              timeAdjustable: 'no',
              productionFlexibility: 'low'
            },
            specialNeeds: {
              priceRequirement: '',
              serviceRequirement: '',
              technicalRequirement: '',
              otherRequirement: '',
              contractPeriod: '1',
              settlementMethod: 'monthly',
              serviceContent: 'basic'
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
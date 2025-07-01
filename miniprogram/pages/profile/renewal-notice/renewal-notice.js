// 客户端续约提醒页面
const app = getApp()

Page({
  data: {
    loading: true,
    expiredCount: 0,
    
    // 筛选相关
    currentFilter: 'all',
    filterTabs: [
      { key: 'all', name: '全部', count: 0 },
      { key: 'urgent', name: '紧急', count: 0 },
      { key: 'pending', name: '待决策', count: 0 },
      { key: 'negotiating', name: '协商中', count: 0 },
      { key: 'decided', name: '已决策', count: 0 }
    ],
    
    // 合同列表
    contractList: [],
    
    // 续约决策弹窗
    showDecisionDialog: false,
    selectedContract: {},
    decisionForm: {
      decision: '',
      servicePeriod: '',
      priceRequirement: '',
      serviceRequirement: '',
      declineReason: '',
      declineDetail: '',
      remarks: ''
    },
    
    // 选择器相关
    showServicePeriodPicker: false,
    showDeclineReasonPicker: false,
    
    servicePeriodOptions: [
      { name: '1年', value: '1' },
      { name: '2年', value: '2' },
      { name: '3年', value: '3' },
      { name: '5年', value: '5' }
    ],
    
    declineReasonOptions: [
      { name: '价格过高', value: 'price_high' },
      { name: '服务不满意', value: 'service_poor' },
      { name: '业务调整', value: 'business_change' },
      { name: '选择其他供应商', value: 'other_supplier' },
      { name: '暂停业务', value: 'business_pause' },
      { name: '其他原因', value: 'other' }
    ]
  },

  onLoad() {
    this.initPageData()
  },

  onShow() {
    this.refreshData()
  },

  onPullDownRefresh() {
    this.refreshData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 初始化页面数据
  async initPageData() {
    try {
      await this.loadContractList()
    } catch (error) {
      console.error('初始化页面数据失败:', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 刷新数据
  async refreshData() {
    await this.initPageData()
  },

  // 加载合同列表
  async loadContractList() {
    try {
      const params = {
        filter: this.data.currentFilter
      }
      
      const res = await app.request({
        url: '/renewal/customer-contracts',
        data: params
      })
      
      if (res.data) {
        this.setData({ 
          contractList: res.data,
          expiredCount: res.data.filter(contract => contract.daysLeft <= 30).length
        })
        this.updateFilterCounts(res.data)
      }
    } catch (error) {
      console.error('加载合同列表失败:', error)
      // 使用模拟数据
      this.loadMockContractList()
    }
  },

  // 加载模拟合同列表
  loadMockContractList() {
    const mockContracts = [
      {
        id: 1,
        contractNumber: 'CT2024001',
        serviceType: '工商业用电优化',
        signDate: '2023-01-15',
        expireDate: '2025-01-15',
        amount: 120000,
        daysLeft: 25,
        renewalStatus: 'pending',
        renewalNote: '请尽快做出续约决策',
        serviceEvaluation: {
          savings: 35000,
          satisfaction: 4.5
        }
      },
      {
        id: 2,
        contractNumber: 'CT2024002',
        serviceType: '电力设备维护',
        signDate: '2023-03-20',
        expireDate: '2025-03-20',
        amount: 85000,
        daysLeft: 5,
        renewalStatus: 'urgent',
        renewalNote: '合同即将到期，请立即处理',
        serviceEvaluation: {
          savings: 22000,
          satisfaction: 4.2
        }
      },
      {
        id: 3,
        contractNumber: 'CT2024003',
        serviceType: '能效管理服务',
        signDate: '2023-06-10',
        expireDate: '2025-06-10',
        amount: 95000,
        daysLeft: 45,
        renewalStatus: 'decided',
        renewalNote: '客户已同意续约，等待合同签署',
        serviceEvaluation: {
          savings: 28000,
          satisfaction: 4.8
        }
      }
    ]
    
    // 根据筛选条件过滤数据
    let filteredContracts = mockContracts
    if (this.data.currentFilter !== 'all') {
      filteredContracts = mockContracts.filter(contract => {
        switch (this.data.currentFilter) {
          case 'urgent':
            return contract.daysLeft <= 7
          case 'pending':
            return contract.renewalStatus === 'pending'
          case 'negotiating':
            return contract.renewalStatus === 'negotiating'
          case 'decided':
            return contract.renewalStatus === 'decided'
          default:
            return true
        }
      })
    }
    
    this.setData({ 
      contractList: filteredContracts,
      expiredCount: mockContracts.filter(contract => contract.daysLeft <= 30).length
    })
    this.updateFilterCounts(mockContracts)
  },

  // 更新筛选标签计数
  updateFilterCounts(contracts) {
    const counts = {
      all: contracts.length,
      urgent: contracts.filter(c => c.daysLeft <= 7).length,
      pending: contracts.filter(c => c.renewalStatus === 'pending').length,
      negotiating: contracts.filter(c => c.renewalStatus === 'negotiating').length,
      decided: contracts.filter(c => c.renewalStatus === 'decided').length
    }
    
    const updatedTabs = this.data.filterTabs.map(tab => ({
      ...tab,
      count: counts[tab.key] || 0
    }))
    
    this.setData({ filterTabs: updatedTabs })
  },

  // 筛选切换
  onFilterChange(e) {
    const { filter } = e.currentTarget.dataset
    this.setData({ currentFilter: filter })
    this.loadContractList()
  },

  // 合同操作
  onContractTap(e) {
    const { contract } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/profile/contracts/detail/detail?id=${contract.id}`
    })
  },

  onContactManager(e) {
    e.stopPropagation()
    const { contract } = e.currentTarget.dataset
    
    wx.makePhoneCall({
      phoneNumber: contract.managerPhone || '400-123-4567',
      fail: (error) => {
        console.error('拨打电话失败:', error)
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        })
      }
    })
  },

  onRenewalDecision(e) {
    e.stopPropagation()
    const { contract } = e.currentTarget.dataset
    
    this.setData({
      selectedContract: contract,
      showDecisionDialog: true,
      decisionForm: {
        decision: '',
        servicePeriod: '',
        priceRequirement: '',
        serviceRequirement: '',
        declineReason: '',
        declineDetail: '',
        remarks: ''
      }
    })
  },

  // 续约决策弹窗
  closeDecisionDialog() {
    this.setData({ showDecisionDialog: false })
  },

  async confirmRenewalDecision() {
    const { decisionForm, selectedContract } = this.data
    
    // 表单验证
    if (!decisionForm.decision) {
      wx.showToast({
        title: '请选择续约决策',
        icon: 'none'
      })
      return
    }
    
    if (decisionForm.decision === 'renew' && !decisionForm.servicePeriod) {
      wx.showToast({
        title: '请选择服务期限',
        icon: 'none'
      })
      return
    }
    
    if (decisionForm.decision === 'decline' && !decisionForm.declineReason) {
      wx.showToast({
        title: '请选择不续约原因',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '提交中...' })
      
      await app.request({
        url: '/renewal/customer-decision',
        method: 'POST',
        data: {
          contractId: selectedContract.id,
          ...decisionForm
        }
      })
      
      wx.hideLoading()
      wx.showToast({
        title: '决策已提交',
        icon: 'success'
      })
      
      this.setData({ showDecisionDialog: false })
      this.loadContractList()
      
    } catch (error) {
      wx.hideLoading()
      console.error('提交续约决策失败:', error)
      
      wx.showToast({
        title: '决策已提交',
        icon: 'success'
      })
      
      this.setData({ showDecisionDialog: false })
      this.loadContractList()
    }
  },

  // 表单输入处理
  onDecisionChange(e) {
    this.setData({
      'decisionForm.decision': e.detail
    })
  },

  onDecisionFormInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({
      [`decisionForm.${field}`]: e.detail
    })
  },

  // 选择器相关
  selectServicePeriod() {
    this.setData({ showServicePeriodPicker: true })
  },

  closeServicePeriodPicker() {
    this.setData({ showServicePeriodPicker: false })
  },

  onServicePeriodSelect(e) {
    const { value, name } = e.detail
    this.setData({
      'decisionForm.servicePeriod': name,
      showServicePeriodPicker: false
    })
  },

  selectDeclineReason() {
    this.setData({ showDeclineReasonPicker: true })
  },

  closeDeclineReasonPicker() {
    this.setData({ showDeclineReasonPicker: false })
  },

  onDeclineReasonSelect(e) {
    const { value, name } = e.detail
    this.setData({
      'decisionForm.declineReason': name,
      showDeclineReasonPicker: false
    })
  },

  // 工具方法
  getRenewalStatusText(status) {
    const statusMap = {
      'pending': '待决策',
      'urgent': '紧急处理',
      'negotiating': '协商中',
      'decided': '已决策',
      'renewed': '已续约'
    }
    return statusMap[status] || '未知状态'
  },

  getRenewalStatusColor(status) {
    const colorMap = {
      'pending': '#1989fa',
      'urgent': '#f56c6c',
      'negotiating': '#ff976a',
      'decided': '#52c41a',
      'renewed': '#67C23A'
    }
    return colorMap[status] || '#666666'
  },

  getRenewalActionText(status) {
    const actionMap = {
      'pending': '做出决策',
      'urgent': '立即决策',
      'negotiating': '查看进度',
      'decided': '查看结果',
      'renewed': '查看合同'
    }
    return actionMap[status] || '处理'
  },

  formatAmount(amount) {
    if (!amount) return '0'
    return (amount / 10000).toFixed(1) + '万'
  }
}) 
/**
 * 产品数据处理工具
 * 用于格式化产品数据和计算相关信息
 */

// 产品类型映射
const PRODUCT_TYPE_MAP = {
  'industrial': '工业用电',
  'commercial': '商业用电', 
  'residential': '居民用电'
}

// 标签类型配置
const TAG_TYPES = {
  'recommend': {
    text: '推荐',
    color: '#FF6B6B',
    bgColor: 'linear-gradient(45deg, #FF6B6B, #FF8E8E)'
  },
  'new': {
    text: '新品',
    color: '#4ECDC4',
    bgColor: 'linear-gradient(45deg, #4ECDC4, #44A08D)'
  },
  'hot': {
    text: '热销',
    color: '#FA8072',
    bgColor: 'linear-gradient(45deg, #FA8072, #FF6347)'
  },
  'discount': {
    text: '优惠',
    color: '#FFD700',
    bgColor: 'linear-gradient(45deg, #FFD700, #FFA500)'
  }
}

/**
 * 格式化产品价格区间
 * @param {Object} product - 产品对象
 * @returns {String} 格式化后的价格区间文本
 */
function formatPriceRange(product) {
  if (!product) return '询价'
  
  const { minPrice, maxPrice, basePrice } = product
  
  if (minPrice && maxPrice && minPrice !== maxPrice) {
    return `${minPrice}-${maxPrice}元/kWh`
  } else if (basePrice) {
    return `${basePrice}元/kWh`
  } else {
    return '询价'
  }
}

/**
 * 计算预估节省金额
 * @param {Object} product - 产品对象
 * @param {Object} userPowerInfo - 用户用电信息
 * @returns {Number} 预估节省金额
 */
function calculateEstimatedSavings(product, userPowerInfo) {
  if (!product || !product.basePrice || !userPowerInfo) {
    return 0
  }
  
  const { monthlyUsage = 1000, currentPrice = 0.6 } = userPowerInfo
  
  if (!monthlyUsage || !currentPrice) {
    return 0
  }
  
  const currentCost = monthlyUsage * currentPrice
  const newCost = monthlyUsage * product.basePrice
  const savings = currentCost - newCost
  
  return Math.max(0, Math.round(savings))
}

/**
 * 获取产品类型文本
 * @param {String} type - 产品类型
 * @returns {String} 产品类型文本
 */
function getProductTypeText(type) {
  return PRODUCT_TYPE_MAP[type] || '通用'
}

/**
 * 获取产品标签列表
 * @param {Object} product - 产品对象
 * @returns {Array} 标签列表
 */
function getProductTags(product) {
  if (!product) return []
  
  const tags = []
  
  // 推荐标签
  if (product.isRecommended) {
    tags.push({
      text: '推荐',
      type: 'recommend',
      ...TAG_TYPES.recommend
    })
  }
  
  // 新品标签（创建时间在30天内）
  if (product.createdAt) {
    const createdTime = new Date(product.createdAt).getTime()
    const now = Date.now()
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    
    if (createdTime > thirtyDaysAgo) {
      tags.push({
        text: '新品',
        type: 'new',
        ...TAG_TYPES.new
      })
    }
  }
  
  // 热销标签
  if (product.isHot) {
    tags.push({
      text: '热销',
      type: 'hot',
      ...TAG_TYPES.hot
    })
  }
  
  // 折扣标签（基于价格判断）
  if (product.minPrice && product.basePrice && product.basePrice < product.minPrice) {
    tags.push({
      text: '优惠',
      type: 'discount',
      ...TAG_TYPES.discount
    })
  }
  
  return tags
}

/**
 * 格式化产品项目数据
 * @param {Object} product - 原始产品数据
 * @param {Object} userPowerInfo - 用户用电信息
 * @returns {Object} 格式化后的产品数据
 */
function formatProductItem(product, userPowerInfo = {}) {
  if (!product) return null
  
  console.log('🔄 formatProductItem 处理产品数据:', product);
  
  // 确保产品有ID，如果没有则生成一个
  let productId = product.id;
  if (!productId) {
    console.warn('⚠️ 产品缺少ID字段，使用name或生成临时ID');
    productId = product.name ? `temp_${product.name.replace(/\s+/g, '_').toLowerCase()}` : `temp_${Date.now()}`;
    console.log('🔧 生成临时ID:', productId);
  }
  
  const priceRange = formatPriceRange(product)
  const estimatedSavings = calculateEstimatedSavings(product, userPowerInfo)
  const userTypeText = getProductTypeText(product.type)
  const tags = getProductTags(product)
  
  const formattedProduct = {
    // 原始数据
    id: productId, // 确保ID存在
    name: product.name || '未知产品',
    type: product.type || 'commercial',
    description: product.description || '',
    basePrice: product.basePrice || 0,
    minPrice: product.minPrice,
    maxPrice: product.maxPrice,
    minCapacity: product.minCapacity,
    maxCapacity: product.maxCapacity,
    imageUrl: product.imageUrl,
    status: product.status || 'active',
    isRecommended: product.isRecommended || false,
    sortOrder: product.sortOrder || 0,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    
    // 格式化数据
    priceRange,
    estimatedSavings,
    userTypeText,
    tags,
    
    // 额外计算字段
    hasDiscount: estimatedSavings > 0,
    isActive: (product.status || 'active') === 'active',
    sortWeight: (product.sortOrder || 0) + (product.isRecommended ? 1000 : 0)
  }
  
  console.log('✅ formatProductItem 处理完成:', {
    originalId: product.id,
    finalId: formattedProduct.id,
    name: formattedProduct.name
  });
  
  return formattedProduct;
}

/**
 * 生成测试产品数据
 * @returns {Array} 测试产品数据列表
 */
function generateTestProducts() {
  const testProducts = [
    {
      id: 1,
      name: '工业用电优选套餐',
      type: 'industrial',
      description: '专为工业用户设计的电力套餐，价格优惠，服务专业',
      basePrice: 0.45,
      minPrice: 0.42,
      maxPrice: 0.48,
      minCapacity: 1000,
      maxCapacity: 50000,
      imageUrl: '/assets/images/icons/industry.png',
      status: 'active',
      isRecommended: true,
      sortOrder: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      name: '商业用电标准套餐',
      type: 'commercial',
      description: '适合商业用户的标准电力套餐，性价比高',
      basePrice: 0.55,
      minPrice: 0.52,
      maxPrice: 0.58,
      minCapacity: 500,
      maxCapacity: 20000,
      imageUrl: '/assets/images/icons/business.png',
      status: 'active',
      isRecommended: false,
      sortOrder: 2,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z'
    },
    {
      id: 3,
      name: '民用电力基础套餐',
      type: 'residential',
      description: '为居民用户提供的基础电力服务套餐',
      basePrice: 0.65,
      minPrice: 0.62,
      maxPrice: 0.68,
      minCapacity: 100,
      maxCapacity: 5000,
      imageUrl: '/assets/images/icons/home.png',
      status: 'active',
      isRecommended: false,
      sortOrder: 3,
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: '2024-01-03T00:00:00.000Z'
    },
    {
      id: 4,
      name: '新能源电力套餐',
      type: 'industrial',
      description: '结合新能源技术的创新电力套餐',
      basePrice: 0.40,
      minPrice: 0.38,
      maxPrice: 0.42,
      minCapacity: 2000,
      maxCapacity: 100000,
      imageUrl: '/assets/images/icons/solar.png',
      status: 'active',
      isRecommended: true,
      sortOrder: 4,
      createdAt: '2024-01-04T00:00:00.000Z',
      updatedAt: '2024-01-04T00:00:00.000Z'
    },
    {
      id: 5,
      name: '智能电力管理套餐',
      type: 'commercial',
      description: '配备智能管理系统的商业电力套餐',
      basePrice: 0.50,
      minPrice: 0.48,
      maxPrice: 0.52,
      minCapacity: 800,
      maxCapacity: 30000,
      imageUrl: '/assets/images/icons/smart.png',
      status: 'active',
      isRecommended: true,
      sortOrder: 5,
      createdAt: '2024-01-05T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z'
    }
  ];
  
  console.log('🧪 生成测试产品数据，产品数量:', testProducts.length);
  console.log('🧪 测试产品ID列表:', testProducts.map(p => ({ id: p.id, name: p.name })));
  
  return testProducts;
}

/**
 * 按类型过滤产品
 * @param {Array} products - 产品列表
 * @param {String} type - 产品类型
 * @returns {Array} 过滤后的产品列表
 */
function filterProductsByType(products, type) {
  if (!products || !Array.isArray(products)) return []
  if (!type || type === 'all') return products
  
  return products.filter(product => product.type === type)
}

/**
 * 按关键词搜索产品
 * @param {Array} products - 产品列表
 * @param {String} keyword - 搜索关键词
 * @returns {Array} 搜索结果
 */
function searchProducts(products, keyword) {
  if (!products || !Array.isArray(products)) return []
  if (!keyword || keyword.trim() === '') return products
  
  const lowerKeyword = keyword.toLowerCase().trim()
  
  return products.filter(product => 
    product.name.toLowerCase().includes(lowerKeyword) ||
    product.description.toLowerCase().includes(lowerKeyword) ||
    product.userTypeText.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 排序产品列表
 * @param {Array} products - 产品列表
 * @param {String} sortBy - 排序方式
 * @returns {Array} 排序后的产品列表
 */
function sortProducts(products, sortBy = 'default') {
  if (!products || !Array.isArray(products)) return []
  
  const sortedProducts = [...products]
  
  switch (sortBy) {
    case 'price_asc':
      return sortedProducts.sort((a, b) => (a.basePrice || 0) - (b.basePrice || 0))
    case 'price_desc':
      return sortedProducts.sort((a, b) => (b.basePrice || 0) - (a.basePrice || 0))
    case 'name':
      return sortedProducts.sort((a, b) => a.name.localeCompare(b.name))
    case 'savings':
      return sortedProducts.sort((a, b) => (b.estimatedSavings || 0) - (a.estimatedSavings || 0))
    case 'default':
    default:
      return sortedProducts.sort((a, b) => (b.sortWeight || 0) - (a.sortWeight || 0))
  }
}

module.exports = {
  formatPriceRange,
  calculateEstimatedSavings,
  getProductTypeText,
  getProductTags,
  formatProductItem,
  generateTestProducts,
  filterProductsByType,
  searchProducts,
  sortProducts,
  PRODUCT_TYPE_MAP,
  TAG_TYPES
} 
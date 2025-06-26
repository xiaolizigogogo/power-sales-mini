// 图标映射表 - 用 emoji 和 Unicode 符号替代图片
const iconMap = {
  // 箭头类
  'arrow-right': '→',
  'arrow-left': '←',
  'arrow-up': '↑',
  'arrow-down': '↓',
  
  // 功能类
  'search': '🔍',
  'close': '✕',
  'check': '✓',
  'filter': '🔽',
  'settings': '⚙️',
  'refresh': '🔄',
  'download': '📥',
  'upload': '📤',
  'copy': '📋',
  'share': '📤',
  'export': '📊',
  
  // 业务类
  'calendar': '📅',
  'contact': '📞',
  'contract': '📄',
  'customers': '👥',
  'orders': '📋',
  'follow': '👁️',
  'target': '🎯',
  'reminder': '⏰',
  
  // 用户类
  'avatar': '👤',
  'user': '👤',
  'profile': '👤',
  
  // 其他
  'about': 'ℹ️',
  'feedback': '💬',
  'service': '🛠️',
  'home': '🏠',
  'business': '🏢',
  'agriculture': '🌾',
  'temporary': '⚡',
  'calculator': '🧮'
}

// 空状态图标
const emptyIcons = {
  'no-data': '📭',
  'network-error': '🌐',
  'no-search': '🔍',
  'no-order': '📋',
  'no-customer': '👥',
  'default': '📂',
  'empty-follow': '👁️',
  'orders': '📋',
  'order': '📋'
}

// 获取图标
function getIcon(iconName) {
  return iconMap[iconName] || '•'
}

// 获取空状态图标
function getEmptyIcon(type) {
  return emptyIcons[type] || emptyIcons.default
}

// 获取用户头像文字
function getAvatarText(name) {
  if (!name) return '👤'
  return name.charAt(0).toUpperCase()
}

module.exports = {
  iconMap,
  emptyIcons,
  getIcon,
  getEmptyIcon,
  getAvatarText
} 
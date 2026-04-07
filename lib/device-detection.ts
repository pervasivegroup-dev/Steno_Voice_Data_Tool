/**
 * Device detection utility
 * Detects OS, browser, device type, and miscellaneous information
 */

export interface DeviceInfo {
  os: string
  browser: string
  device: string
  misc: string
}

/**
 * Detects the operating system with version from user agent
 */
function detectOS(): string {
  if (typeof window === 'undefined') return 'Unknown'
  
  const userAgent = window.navigator.userAgent
  const userAgentLower = userAgent.toLowerCase()
  
  // Windows versions
  if (userAgentLower.includes('windows nt 10.0')) {
    const match = userAgent.match(/Windows NT 10\.0[^)]*\)/i)
    return match ? `Windows 10/11 ${match[0]}` : 'Windows 10/11'
  }
  if (userAgentLower.includes('windows nt 6.3')) return 'Windows 8.1'
  if (userAgentLower.includes('windows nt 6.2')) return 'Windows 8'
  if (userAgentLower.includes('windows nt 6.1')) return 'Windows 7'
  if (userAgentLower.includes('windows nt 6.0')) return 'Windows Vista'
  if (userAgentLower.includes('windows nt 5.1')) return 'Windows XP'
  if (userAgentLower.includes('windows')) {
    const match = userAgent.match(/Windows[^;)]*/i)
    return match ? match[0] : 'Windows'
  }
  
  // macOS versions
  if (userAgentLower.includes('mac os x')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/i)
    if (match) {
      const version = match[1].replace(/_/g, '.')
      return `macOS ${version}`
    }
    return 'macOS'
  }
  if (userAgentLower.includes('mac')) return 'macOS'
  
  // Linux
  if (userAgentLower.includes('linux')) {
    const match = userAgent.match(/Linux[^)]*\)/i)
    return match ? match[0] : 'Linux'
  }
  
  // Android versions
  if (userAgentLower.includes('android')) {
    const match = userAgent.match(/Android ([\d.]+)/i)
    if (match) {
      return `Android ${match[1]}`
    }
    return 'Android'
  }
  
  // iOS versions
  if (userAgentLower.includes('iphone') || userAgentLower.includes('ipad') || userAgentLower.includes('ipod')) {
    const match = userAgent.match(/OS ([\d_]+)/i)
    if (match) {
      const version = match[1].replace(/_/g, '.')
      return `iOS ${version}`
    }
    return 'iOS'
  }
  
  // Unix
  if (userAgentLower.includes('unix')) return 'Unix'
  
  // Fallback to platform
  if (window.navigator.platform) {
    return window.navigator.platform
  }
  
  return 'Unknown'
}

/**
 * Detects the browser with version from user agent
 */
function detectBrowser(): string {
  if (typeof window === 'undefined') return 'Unknown'
  
  const userAgent = window.navigator.userAgent
  const userAgentLower = userAgent.toLowerCase()
  
  // Edge (Chromium-based)
  if (userAgentLower.includes('edg/')) {
    const match = userAgent.match(/Edg\/([\d.]+)/i)
    if (match) {
      return `Edge ${match[1]}`
    }
    return 'Edge'
  }
  
  // Chrome (must check before Safari)
  if (userAgentLower.includes('chrome/') && !userAgentLower.includes('edg')) {
    const match = userAgent.match(/Chrome\/([\d.]+)/i)
    if (match) {
      return `Chrome ${match[1]}`
    }
    return 'Chrome'
  }
  
  // Firefox
  if (userAgentLower.includes('firefox/')) {
    const match = userAgent.match(/Firefox\/([\d.]+)/i)
    if (match) {
      return `Firefox ${match[1]}`
    }
    return 'Firefox'
  }
  
  // Safari (must check after Chrome)
  if (userAgentLower.includes('safari/') && !userAgentLower.includes('chrome')) {
    const match = userAgent.match(/Version\/([\d.]+).*Safari/i)
    if (match) {
      return `Safari ${match[1]}`
    }
    return 'Safari'
  }
  
  // Opera
  if (userAgentLower.includes('opr/') || userAgentLower.includes('opera/')) {
    const match = userAgent.match(/(?:OPR|Opera)\/([\d.]+)/i)
    if (match) {
      return `Opera ${match[1]}`
    }
    return 'Opera'
  }
  
  // Internet Explorer
  if (userAgentLower.includes('msie')) {
    const match = userAgent.match(/MSIE ([\d.]+)/i)
    if (match) {
      return `Internet Explorer ${match[1]}`
    }
    return 'Internet Explorer'
  }
  if (userAgentLower.includes('trident/')) {
    const match = userAgent.match(/rv:([\d.]+)/i)
    if (match) {
      return `Internet Explorer ${match[1]}`
    }
    return 'Internet Explorer'
  }
  
  // Fallback to appName and appVersion
  if (window.navigator.appName && window.navigator.appVersion) {
    return `${window.navigator.appName} ${window.navigator.appVersion}`
  }
  
  return 'Unknown'
}

/**
 * Detects the device type with detailed information
 */
function detectDevice(): string {
  if (typeof window === 'undefined') return 'Unknown'
  
  const userAgent = window.navigator.userAgent
  const userAgentLower = userAgent.toLowerCase()
  const info: string[] = []
  
  // Device type detection
  const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  
  if (isTablet) {
    info.push('Tablet')
  } else if (isMobile) {
    info.push('Mobile')
  } else {
    info.push('Desktop')
  }
  
  // Device model detection
  if (userAgentLower.includes('iphone')) {
    const match = userAgent.match(/iPhone[^)]*/i)
    if (match) {
      info.push(match[0])
    } else {
      info.push('iPhone')
    }
  } else if (userAgentLower.includes('ipad')) {
    const match = userAgent.match(/iPad[^)]*/i)
    if (match) {
      info.push(match[0])
    } else {
      info.push('iPad')
    }
  } else if (userAgentLower.includes('android')) {
    // Try to extract device model from Android user agent
    const match = userAgent.match(/Android[^;]*; ([^)]+)\)/i)
    if (match && match[1]) {
      info.push(match[1].trim())
    }
  }
  
  // CPU architecture
  if ((window.navigator as any).cpuClass) {
    info.push(`CPU: ${(window.navigator as any).cpuClass}`)
  }
  
  // Hardware concurrency (number of CPU cores)
  if (window.navigator.hardwareConcurrency) {
    info.push(`Cores: ${window.navigator.hardwareConcurrency}`)
  }
  
  // Device memory (if available)
  if ((window.navigator as any).deviceMemory) {
    info.push(`RAM: ${(window.navigator as any).deviceMemory}GB`)
  }
  
  return info.join(', ') || 'Unknown'
}

/**
 * Collects miscellaneous device information
 */
function getMiscInfo(): string {
  if (typeof window === 'undefined') return 'N/A'
  
  const info: string[] = []
  
  // Full user agent
  info.push(`UA: ${window.navigator.userAgent}`)
  
  // Screen resolution and color depth
  if (window.screen) {
    info.push(`Screen: ${window.screen.width}x${window.screen.height}`)
    if (window.screen.colorDepth) {
      info.push(`ColorDepth: ${window.screen.colorDepth}bit`)
    }
    if (window.screen.pixelDepth) {
      info.push(`PixelDepth: ${window.screen.pixelDepth}bit`)
    }
    // Available screen size (excluding OS bars)
    if (window.screen.availWidth && window.screen.availHeight) {
      info.push(`Avail: ${window.screen.availWidth}x${window.screen.availHeight}`)
    }
  }
  
  // Viewport size
  if (window.innerWidth && window.innerHeight) {
    info.push(`Viewport: ${window.innerWidth}x${window.innerHeight}`)
  }
  
  // Languages
  if (window.navigator.language) {
    info.push(`Lang: ${window.navigator.language}`)
  }
  if (window.navigator.languages && window.navigator.languages.length > 0) {
    info.push(`Langs: ${window.navigator.languages.join(', ')}`)
  }
  
  // Platform
  if (window.navigator.platform) {
    info.push(`Platform: ${window.navigator.platform}`)
  }
  
  // User agent data (if available - newer browsers)
  if ((window.navigator as any).userAgentData) {
    const uaData = (window.navigator as any).userAgentData
    if (uaData.brands && uaData.brands.length > 0) {
      const brands = uaData.brands.map((b: any) => `${b.brand} ${b.version}`).join(', ')
      info.push(`Brands: ${brands}`)
    }
    if (uaData.mobile !== undefined) {
      info.push(`Mobile: ${uaData.mobile}`)
    }
    if (uaData.platform) {
      info.push(`UAPlatform: ${uaData.platform}`)
    }
  }
  
  // Touch support
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    info.push(`Touch: Yes (${navigator.maxTouchPoints || 0} points)`)
  } else {
    info.push('Touch: No')
  }
  
  // Connection info (if available)
  if ((navigator as any).connection) {
    const conn = (navigator as any).connection
    const connInfo: string[] = []
    if (conn.effectiveType) connInfo.push(conn.effectiveType)
    if (conn.downlink) connInfo.push(`Down: ${conn.downlink}Mbps`)
    if (conn.rtt) connInfo.push(`RTT: ${conn.rtt}ms`)
    if (connInfo.length > 0) {
      info.push(`Connection: ${connInfo.join(', ')}`)
    }
  }
  
  // Timezone
  try {
    info.push(`TZ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
  } catch (e) {
    // Ignore if timezone detection fails
  }
  
  // Cookie enabled
  info.push(`Cookies: ${navigator.cookieEnabled ? 'Yes' : 'No'}`)
  
  // Online status
  info.push(`Online: ${navigator.onLine ? 'Yes' : 'No'}`)
  
  return info.join(' | ') || 'N/A'
}

/**
 * Gets complete device information
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    os: detectOS(),
    browser: detectBrowser(),
    device: detectDevice(),
    misc: getMiscInfo()
  }
}


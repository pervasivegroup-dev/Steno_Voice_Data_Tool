const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { networkInterfaces } = require('os')

// Function to find OpenSSL executable
function findOpenSSL() {
  const possiblePaths = [
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files (x86)\\Git\\usr\\bin\\openssl.exe',
    'C:\\msys64\\usr\\bin\\openssl.exe',
    'openssl' // System PATH
  ]
  
  for (const openSSLPath of possiblePaths) {
    try {
      if (openSSLPath === 'openssl') {
        execSync('openssl version', { stdio: 'ignore' })
        return 'openssl'
      } else if (fs.existsSync(openSSLPath)) {
        return openSSLPath
      }
    } catch (error) {
      // Continue to next path
    }
  }
  
  return null
}

// Function to get all network IPs
function getNetworkIPs() {
  const interfaces = networkInterfaces()
  const ips = ['127.0.0.1'] // Always include localhost
  
  Object.keys(interfaces).forEach(interfaceName => {
    const interface = interfaces[interfaceName]
    interface.forEach(alias => {
      if (alias.family === 'IPv4' && !alias.internal) {
        ips.push(alias.address)
      }
    })
  })
  
  return ips
}

const keyPath = path.join(__dirname, 'localhost-key.pem')
const certPath = path.join(__dirname, 'localhost.pem')

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('SSL certificates already exist')
  console.log('To regenerate with current network IPs, delete the existing certificates first.')
  process.exit(0)
}

console.log('Detecting network IPs...')
const networkIPs = getNetworkIPs()
console.log('Found IPs:', networkIPs.join(', '))

console.log('Looking for OpenSSL...')
const openSSLPath = findOpenSSL()

if (!openSSLPath) {
  console.error('❌ OpenSSL not found!')
  console.log('\nPlease install one of the following:')
  console.log('1. Git for Windows (includes OpenSSL): https://git-scm.com/download/win')
  console.log('2. MSYS2: https://www.msys2.org/')
  console.log('3. Or use mkcert (recommended): https://github.com/FiloSottile/mkcert')
  process.exit(1)
}

console.log(`✅ Found OpenSSL at: ${openSSLPath}`)
console.log('Generating self-signed SSL certificate...')

try {
  // Create a config file for the certificate with all detected IPs
  let configContent = `[req]
distinguished_name = req
[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost`

  // Add all detected IPs
  networkIPs.forEach((ip, index) => {
    configContent += `\nIP.${index + 1} = ${ip}`
  })

  const configPath = path.join(__dirname, 'cert.conf')
  fs.writeFileSync(configPath, configContent)

  // Generate private key
  execSync(`"${openSSLPath}" genrsa -out "${keyPath}" 2048`)
  
  // Generate certificate
  execSync(`"${openSSLPath}" req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -extensions v3_req -config "${configPath}"`)
  
  // Clean up config file
  fs.unlinkSync(configPath)
  
  console.log('✅ SSL certificates generated successfully!')
  console.log('You can now run: npm run dev:https')
  console.log('\nAccess URLs:')
  console.log('• https://localhost:3000')
  networkIPs.forEach(ip => {
    if (ip !== '127.0.0.1') {
      console.log(`• https://${ip}:3000`)
    }
  })
} catch (error) {
  console.error('Error generating certificates:', error.message)
  console.log('\nAlternative: Install mkcert (recommended):')
  console.log('1. Install mkcert: https://github.com/FiloSottile/mkcert')
  console.log(`2. Run: mkcert localhost ${networkIPs.join(' ')}`)
  console.log('3. Rename the generated files to localhost-key.pem and localhost.pem')
}

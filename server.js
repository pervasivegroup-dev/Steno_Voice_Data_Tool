const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')
const { networkInterfaces } = require('os')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0' // Listen on all interfaces
const port = 3000

// Only run HTTPS server in development
if (!dev) {
  console.log('❌ This HTTPS server is for development only!')
  console.log('For production, use your existing server with proper SSL certificates.')
  console.log('Run: npm run start (for production)')
  process.exit(1)
}

const app = next({ dev, hostname: 'localhost', port })
const handle = app.getRequestHandler()

// Check if SSL certificates exist
const keyPath = path.join(__dirname, 'localhost-key.pem')
const certPath = path.join(__dirname, 'localhost.pem')

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('❌ SSL certificates not found!')
  console.log('Run: npm run generate-cert')
  process.exit(1)
}

// Create self-signed certificate for development
const httpsOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath)
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      // Get all network IPs for display
      const interfaces = networkInterfaces()
      const networkIPs = []
      
      Object.keys(interfaces).forEach(interfaceName => {
        const interface = interfaces[interfaceName]
        interface.forEach(alias => {
          if (alias.family === 'IPv4' && !alias.internal) {
            networkIPs.push(alias.address)
          }
        })
      })
      
      console.log(`> Ready on https://localhost:${port}`)
      if (networkIPs.length > 0) {
        console.log('> Also available on:')
        networkIPs.forEach(ip => {
          console.log(`  • https://${ip}:${port}`)
        })
      }
      console.log('> Note: You may need to accept the SSL certificate warning')
    })
})

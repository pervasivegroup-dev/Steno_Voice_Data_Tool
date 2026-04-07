const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const path = require('path')
const fs = require('fs')
const { decodeParams } = require('./lib/param-obfuscation')

const dev = process.env.NODE_ENV !== 'production'

// Clean HOSTNAME - remove protocol if present (https:// or http://)
let hostname = process.env.HOSTNAME || '0.0.0.0'
if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
  hostname = hostname.replace(/^https?:\/\//, '').split('/')[0]
}
// Remove port if included in hostname
hostname = hostname.split(':')[0]

const port = parseInt(process.env.PORT) || 3000

console.log('Environment variables:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', process.env.PORT, '->', port)
console.log('HOSTNAME:', process.env.HOSTNAME, '->', hostname)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  console.log('Next.js app prepared successfully')
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      const { pathname, query } = parsedUrl

      // Block access to sensitive server files and configuration files
      const blockedFiles = [
        '/server.js',
        '/production-server.js',
        '/package.json',
        '/package-lock.json',
        '/.env',
        '/.env.local',
        '/.env.production',
        '/next.config.mjs',
        '/tsconfig.json',
        '/Dockerfile',
        '/deploy.sh',
        '/lib/param-obfuscation.js'
      ]
      
      if (blockedFiles.some(blocked => pathname === blocked || pathname.startsWith(blocked + '/'))) {
        res.statusCode = 403
        res.setHeader('Content-Type', 'text/plain')
        res.end('Forbidden')
        return
      }

      // Block access to any .js files in root directory (except those explicitly allowed)
      // Allow pcm-processor.js as it's needed for audio recording (served from public directory)
      if (pathname.endsWith('.js') && !pathname.startsWith('/public/') && 
          !pathname.startsWith('/_next/') && !pathname.startsWith('/recording_examples/') &&
          pathname !== '/pcm-processor.js') {
        // Check if it's trying to access a root-level JS file
        const pathSegments = pathname.split('/').filter(Boolean)
        if (pathSegments.length === 1 && pathSegments[0].endsWith('.js')) {
          res.statusCode = 403
          res.setHeader('Content-Type', 'text/plain')
          res.end('Forbidden')
          return
        }
      }

      // Handle pcm-processor.js from public directory (Next.js serves public files at root)
      if (pathname === '/pcm-processor.js') {
        const filePath = path.join(__dirname, 'public', 'pcm-processor.js')
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/javascript')
          res.setHeader('Cache-Control', 'public, max-age=31536000')
          fs.createReadStream(filePath).pipe(res)
          return
        }
      }

      // Handle static files from public directory
      if (pathname.startsWith('/public/') || pathname.startsWith('/recording_examples/')) {
        const filePath = path.join(__dirname, pathname)
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath)
          const contentType = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.pdf': 'application/pdf',
            '.json': 'application/json'
          }[ext] || 'application/octet-stream'
          
          res.setHeader('Content-Type', contentType)
          res.setHeader('Cache-Control', 'public, max-age=31536000')
          fs.createReadStream(filePath).pipe(res)
          return
        }
      }

      // Handle Next.js static files
      if (pathname.startsWith('/_next/static/')) {
        const filePath = path.join(__dirname, '.next', 'static', pathname.replace('/_next/static/', ''))
        if (fs.existsSync(filePath)) {
          const ext = path.extname(filePath)
          const contentType = {
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.map': 'application/json'
          }[ext] || 'application/octet-stream'
          
          res.setHeader('Content-Type', contentType)
          res.setHeader('Cache-Control', 'public, max-age=31536000')
          fs.createReadStream(filePath).pipe(res)
          return
        }
      }

      // Check if user has required parameters
      
      // Check for obscured parameters
      let hasValidParams = false
      let decodedParams = null
      
      // Try to decode obscured parameters
      if (query.token) {
        decodedParams = decodeParams(query.token)
        hasValidParams = !!decodedParams
      }
      
      // Fallback: Check for regular parameters (for backward compatibility)
      if (!hasValidParams) {
        const requiredParams = ['record_id', 'diabetes_life']
        hasValidParams = requiredParams.every(param => query[param])
      }
      
      // If accessing root without required parameters, show access denied
      if (pathname === '/' && !hasValidParams) {
        res.statusCode = 403
        res.setHeader('Content-Type', 'text/html')
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Access Denied</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  text-align: center; 
                  padding: 50px; 
                  background-color: #f5f5f5;
                }
                .container {
                  max-width: 500px;
                  margin: 0 auto;
                  background: white;
                  padding: 40px;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 { color: #e74c3c; }
                p { color: #666; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Access Denied</h1>
                <p>This application requires specific parameters to access.</p>
                <p>Please contact your administrator for the correct access link.</p>
              </div>
            </body>
          </html>
        `)
        return
      }

      // Handle all other requests with Next.js
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
      console.log(`> Ready on http://${hostname}:${port}`)
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use!`)
        console.error('Please check if another process is using this port.')
        console.error('You can kill the process with: lsof -ti:' + port + ' | xargs kill -9')
        process.exit(1)
      } else {
        console.error('Server error:', err)
        process.exit(1)
      }
    })
}).catch((err) => {
  console.error('Failed to prepare Next.js app:', err)
  process.exit(1)
})

// Parameter obfuscation utilities
// Uses base64 encoding to obscure URL parameters

function encodeParams(recordId, diabetesLife) {
  const params = {
    r: recordId,
    d: diabetesLife
  }
  return Buffer.from(JSON.stringify(params)).toString('base64')
}

function decodeParams(encodedParams) {
  try {
    const decoded = JSON.parse(Buffer.from(encodedParams, 'base64').toString())
    return {
      recordId: decoded.r,
      diabetesLife: decoded.d
    }
  } catch (error) {
    console.error('Failed to decode parameters:', error)
    return null
  }
}

module.exports = {
  encodeParams,
  decodeParams
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  // Extract parameters from the simple redirect
  const recordId = searchParams.get('r') || searchParams.get('record_id')
  const diabetesLife = searchParams.get('d') || searchParams.get('diabetes_life')
  
  if (!recordId) {
    return new NextResponse('Missing required parameters', { status: 400 })
  }
  
  // Simple base64 encoding (no external dependencies)
  const params = {
    r: recordId,
    d: diabetesLife || 'Nej'
  }
  const token = Buffer.from(JSON.stringify(params)).toString('base64')
  
  // Redirect to the main app with obscured parameters
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
  const redirectUrl = `${baseUrl}/?token=${token}`
  
  return NextResponse.redirect(redirectUrl)
}

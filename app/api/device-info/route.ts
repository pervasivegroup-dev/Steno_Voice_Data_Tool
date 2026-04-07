import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { record_id, os, browser, device, misc } = body

    if (!record_id) {
      return NextResponse.json(
        { error: 'record_id is required' },
        { status: 400 }
      )
    }

    const redcapApiUrl = process.env.REDCAP_API_URL
    const redcapApiToken = process.env.REDCAP_API_TOKEN
    
    if (!redcapApiUrl || !redcapApiToken) {
      console.error('RedCAP API configuration missing')
      return NextResponse.json(
        { error: 'RedCAP API not configured' },
        { status: 500 }
      )
    }

    // Prepare data for RedCAP API
    const recordData = [{
      record_id: record_id,
      os: os || 'Unknown',
      browser: browser || 'Unknown',
      device: device || 'Unknown',
      misc: misc || 'N/A'
    }]

    // Create form data for RedCAP API
    const formData = new FormData()
    formData.append('token', redcapApiToken)
    formData.append('content', 'record')
    formData.append('action', 'import')
    formData.append('format', 'json')
    formData.append('type', 'flat')
    formData.append('data', JSON.stringify(recordData))
    formData.append('returnContent', 'count')
    formData.append('returnFormat', 'json')

    // Send to RedCAP
    const response = await fetch(redcapApiUrl, {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      const result = await response.json()
      console.log('Device info submitted successfully:', result)
      return NextResponse.json({
        success: true,
        message: 'Device info submitted successfully',
        recordId: record_id
      })
    } else {
      const errorText = await response.text()
      console.error('Error submitting device info:', errorText)
      return NextResponse.json(
        { 
          error: 'Failed to submit device info',
          details: errorText
        },
        { status: response.status }
      )
    }

  } catch (error) {
    console.error('Error submitting device info:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit device info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}


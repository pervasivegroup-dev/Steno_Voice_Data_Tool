import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const recordId = formData.get('record_id') as string
    const totalRecordings = formData.get('total_recordings') as string
    const timestamp = formData.get('timestamp') as string

    // Extract audio files
    const audioFiles: { questionType: string; blob: Blob; filename: string }[] = []
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('audio_') && value instanceof Blob) {
        const questionType = key.replace('audio_', '')
        // Use the original filename from FormData if available, otherwise use default
        const filename = value.name && value.name !== 'blob' ? value.name : `${questionType}.wav`
        audioFiles.push({
          questionType,
          blob: value,
          filename: filename
        })
      }
    }

    if (audioFiles.length === 0) {
      return NextResponse.json(
        { error: 'No audio files found' },
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

    // Upload audio files directly to RedCAP record fields (matching Python implementation)
    const uploadResults: Array<{questionType: string, filename: string, success: boolean, error?: string}> = []
    
    for (const audioFile of audioFiles) {
      const arrayBuffer = await audioFile.blob.arrayBuffer()
      
      // Create FormData for direct file upload to RedCAP record field
      const formData = new FormData()
      formData.append('token', redcapApiToken)
      formData.append('content', 'file')
      formData.append('action', 'import')
      formData.append('record', recordId)
      formData.append('field', audioFile.questionType) // Direct field name mapping
      formData.append('returnFormat', 'json')
      
      // Create a Blob from the arrayBuffer with proper MIME type
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/wav' })
      formData.append('file', audioBlob, audioFile.filename)

      try {
        const fileResponse = await fetch(redcapApiUrl, {
          method: 'POST',
          body: formData
        })

        if (fileResponse.ok) {
          const responseText = await fileResponse.text()
          console.log(`Successfully uploaded ${audioFile.filename} to field ${audioFile.questionType}`)
          
          uploadResults.push({
            questionType: audioFile.questionType,
            filename: audioFile.filename,
            success: true
          })
        } else {
          const errorText = await fileResponse.text()
          console.error(`Error uploading ${audioFile.filename}:`, errorText)
          uploadResults.push({
            questionType: audioFile.questionType,
            filename: audioFile.filename,
            success: false,
            error: `HTTP ${fileResponse.status}: ${errorText}`
          })
        }
      } catch (error) {
        console.error(`Upload failed for ${audioFile.filename}:`, error)
        uploadResults.push({
          questionType: audioFile.questionType,
          filename: audioFile.filename,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Count successful uploads
    const successfulUploads = uploadResults.filter(result => result.success).length
    const failedUploads = uploadResults.filter(result => !result.success)
    
    console.log(`Upload completed: ${successfulUploads}/${uploadResults.length} successful`)

    return NextResponse.json({
      success: successfulUploads > 0,
      message: `Recordings submitted: ${successfulUploads}/${uploadResults.length} successful`,
      recordId,
      totalRecordings: uploadResults.length,
      successfulUploads,
      failedUploads: failedUploads.map(f => f.filename),
      uploadResults
    })

  } catch (error) {
    console.error('Error submitting recordings:', error)
    return NextResponse.json(
      { 
        error: 'Failed to submit recordings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

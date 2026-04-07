"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ProgressHeader } from "@/components/ui/progress-header"
import { QuestionCard } from "@/components/ui/question-card"
import { RecordingControls } from "@/components/ui/recording-controls"
import { AudioPlayer } from "@/components/ui/audio-player"
import { NavigationControls } from "@/components/ui/navigation-controls"
import { SuccessScreen } from "@/components/ui/success-screen"
import { Hotline } from "@/components/ui/hotline"
import { ExamplePlayer } from "@/components/ui/example-player"
import { WebAudioRecorder } from "@/lib/webaudio-recorder"
import { getDeviceInfo } from "@/lib/device-detection"
import { AUDIO_QUESTIONS, EXAMPLE_SOURCES } from "@/lib/audio-questions"

interface AudioRecording {
  url: string
  duration: number
  blob?: Blob
}

export default function AudioQuestionsPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [recordings, setRecordings] = useState<Record<string, AudioRecording>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStartingRecording, setIsStartingRecording] = useState(false)
  const [stopExampleAudio, setStopExampleAudio] = useState(0)
  
  // Development Mode Configuration - Change this to false for production
  const isDevelopmentMode = false
  
  const timerRef = useRef<{ timeout: NodeJS.Timeout | null; interval: NodeJS.Timeout | null }>({
    timeout: null,
    interval: null,
  })
  const patakaTimerRef = useRef<NodeJS.Timeout | null>(null)
  const webAudioRecorderRef = useRef<WebAudioRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null)

  // Extract URL query parameters - use useEffect to avoid hydration issues
  const [recordId, setRecordId] = useState('')
  const [diabetesLifeParam, setDiabetesLifeParam] = useState<string | null>(null)
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      
      // Check for obscured token first
      const token = urlParams.get('token')
      if (token) {
        try {
          // Try to decode base64 token
          const decoded = JSON.parse(atob(token))
          setRecordId(decoded.r || '')
          setDiabetesLifeParam(decoded.d)
        } catch (error) {
          console.error('Failed to decode token:', error)
          // Fallback to regular parameters
          setRecordId(urlParams.get('record_id') || '')
          setDiabetesLifeParam(urlParams.get('diabetes_life'))
        }
      } else {
        // Fallback to regular parameters
        setRecordId(urlParams.get('record_id') || '')
        setDiabetesLifeParam(urlParams.get('diabetes_life'))
      }
    }
  }, [])

  // Send device information immediately when page loads
  useEffect(() => {
    if (typeof window !== 'undefined' && recordId) {
      const deviceInfo = getDeviceInfo()
      
      // Send device info to API
      fetch('/api/device-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record_id: recordId,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          device: deviceInfo.device,
          misc: deviceInfo.misc
        })
      })
      .then(response => {
        if (response.ok) {
          console.log('Device info sent successfully')
        } else {
          console.error('Failed to send device info:', response.statusText)
        }
      })
      .catch(error => {
        console.error('Error sending device info:', error)
      })
    }
  }, [recordId])

  // Filter questions based on diabetes_life parameter
  const filteredQuestions = diabetesLifeParam === 'Ja' 
    ? AUDIO_QUESTIONS  // Show all questions including diabetes_life
    : AUDIO_QUESTIONS.filter(q => q.id !== 'diabetes_life')  // Hide diabetes_life question
  
  const currentQuestion = filteredQuestions[currentQuestionIndex]

  // Preload AudioWorklet processor for faster recording start
  useEffect(() => {
    const preloadProcessor = async () => {
      try {
        if (typeof window !== 'undefined' && window.AudioContext && window.AudioWorklet) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          await audioContext.audioWorklet.addModule('/pcm-processor.js')
          audioContext.close()
          console.log('AudioWorklet processor preloaded successfully')
        }
      } catch (error) {
        console.warn('Failed to preload AudioWorklet processor:', error)
      }
    }
    
    preloadProcessor()
  }, [])

  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      clearAllTimers()
      if (webAudioRecorderRef.current && isRecording) {
        webAudioRecorderRef.current.stop()
      }
    }
  }, [])

  const clearTimers = () => {
    if (timerRef.current?.timeout) {
      clearTimeout(timerRef.current.timeout)
      timerRef.current.timeout = null
    }
    if (timerRef.current?.interval) {
      clearInterval(timerRef.current.interval)
      timerRef.current.interval = null
    }
    setCountdown(0)
  }

  const clearAllTimers = () => {
    clearTimers()
    if (patakaTimerRef.current) {
      clearTimeout(patakaTimerRef.current)
      patakaTimerRef.current = null
    }
  }

  const startRecording = async () => {
    if (isRecording) {
      console.log("Already recording, ignoring start request")
      return
    }

    try {
      // Check if AudioWorklet is supported
      if (!window.AudioContext || !window.AudioWorklet) {
        alert("Din browser understøtter ikke PCM optagelse. Brug en nyere version af Chrome, Firefox eller Safari.")
        return
      }
      
      // If question already recorded, delete the existing recording first
      if (recordings[currentQuestion.id]) {
        console.log("Question type already recorded, deleting existing recording before starting new one")
        deleteRecording(currentQuestion.id)
        // Wait a moment for deletion to complete
        setTimeout(() => {
          startNewPCMRecording()
        }, 100)
        return
      }

      startNewPCMRecording()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      alert("Kunne ikke få adgang til mikrofon. Kontroller at du har givet tilladelse til at bruge mikrofon.")
    }
  }

  const startNewPCMRecording = async () => {
    try {
      // Show loading state immediately
      setIsStartingRecording(true)
      
      // Create new WebAudioRecorder instance
      const recorder = new WebAudioRecorder()
      webAudioRecorderRef.current = recorder
      
      // Start recording with callback when audio data is actually received
      await recorder.start(() => {
        // This callback is called when the first audio data is received
        setIsStartingRecording(false)
    setIsRecording(true)
        console.log("Recording UI activated - audio data detected")
      })

      if (currentQuestion.id === "pataka") {
        // Clear any existing timers first
        clearTimers()
        setCountdown(0)
        
        // Set up countdown interval
        timerRef.current.interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev >= 10) {
              // When countdown reaches 10, stop the recording and clear the interval
              stopRecording()
              return 0
            }
            return prev + 1
          })
        }, 1000)
      }
    } catch (error) {
      console.error("Error starting PCM recording:", error)
      setIsStartingRecording(false)
      setIsRecording(false)
      alert("Fejl ved start af optagelse. Prøv igen.")
    }
  }

  const stopRecording = async () => {
    if (webAudioRecorderRef.current && isRecording) {
      try {
        const audioBlob = await webAudioRecorderRef.current.stop()
      const audioUrl = URL.createObjectURL(audioBlob)
      
        // Calculate duration using Web Audio API
      let duration = 0
      try {
        const audioContext = new AudioContext()
        const arrayBuffer = await audioBlob.arrayBuffer()
          
          // Check if the buffer has valid audio data
          if (arrayBuffer.byteLength > 0) {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
        duration = audioBuffer.duration
          } else {
            console.warn('Empty audio buffer, using fallback duration')
            duration = 1 // Short fallback for empty recordings
          }
        audioContext.close()
      } catch (error) {
        console.error('Error calculating duration:', error)
          // Fallback estimation based on recording time
          duration = Math.max(0.5, (Date.now() - (Date.now() - 3000)) / 1000) // Estimate based on typical recording length
      }
      
      const finalDuration = Math.max(0.1, Math.round(duration * 100) / 100)
        console.log(`PCM Recording duration for ${currentQuestion.id}: ${duration}s -> ${finalDuration}s`)
      
      setRecordings((prev: Record<string, AudioRecording>) => ({
        ...prev,
        [currentQuestion.id]: {
          url: audioUrl,
          duration: finalDuration,
          blob: audioBlob
        }
      }))

        setIsRecording(false)
        webAudioRecorderRef.current = null
      } catch (error) {
        console.error("Error stopping PCM recording:", error)
      setIsRecording(false)
        alert("Fejl ved stop af optagelse.")
      }
    }
    clearAllTimers()
  }

  const playRecording = async (questionId: string) => {
    const recording = recordings[questionId]
    if (!recording) return

    try {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }

      audioContextRef.current = new AudioContext()
      const response = await fetch(recording.url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)

      audioSourceRef.current = audioContextRef.current.createBufferSource()
      audioSourceRef.current.buffer = audioBuffer
      audioSourceRef.current.connect(audioContextRef.current.destination)

      audioSourceRef.current.onended = () => {
        setIsPlaying(null)
      }

      audioSourceRef.current.start(0)
      setIsPlaying(questionId)
    } catch (error) {
      console.error("Error playing audio:", error)
    }
  }

  const stopPlayback = () => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop()
      audioSourceRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsPlaying(null)
  }

  const deleteRecording = (questionId: string) => {
    const recording = recordings[questionId]
    if (recording) {
      URL.revokeObjectURL(recording.url)
    }
    
    setRecordings((prev: Record<string, AudioRecording>) => {
      const newRecordings = { ...prev }
      delete newRecordings[questionId]
      return newRecordings
    })
    clearAllTimers()
  }

  const nextQuestion = () => {
    if (isRecording || isPlaying) {
      console.log("Cannot navigate while recording or playing")
      return
    }
    
    // Stop any playing audio before navigating
    stopPlayback()
    setStopExampleAudio(prev => prev + 1) // Trigger example audio stop
    
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
    clearAllTimers()
  }

  const previousQuestion = () => {
    if (isRecording || isPlaying) {
      console.log("Cannot navigate while recording or playing")
      return
    }
    
    // Stop any playing audio before navigating
    stopPlayback()
    setStopExampleAudio(prev => prev + 1) // Trigger example audio stop
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
    clearAllTimers()
  }

  const downloadAllRecordings = () => {
    const today = new Date()
    const dateString = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`
    
    Object.entries(recordings).forEach(([questionType, recording]) => {
      if (recording.blob) {
        const url = URL.createObjectURL(recording.blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${recordId}_${questionType}_${dateString}.wav`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        console.log(`Downloaded: ${a.download}`)
      }
    })
  }

  const submitAllRecordings = async () => {
    if (Object.keys(recordings).length === 0) {
      alert("Ingen optagelser at sende. Optag mindst én øvelse først.")
      return
    }

    setIsSubmitting(true)
    
    try {
      if (isDevelopmentMode) {
        // DEVELOPMENT MODE: Just download files, don't send to RedCAP
        console.log("🔧 DEVELOPMENT MODE: Downloading all PCM recordings...")
        downloadAllRecordings()
        
        // Simulate a brief delay for user feedback
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log("✅ Development mode: Files downloaded successfully!")
        setIsSubmitted(true)
      } else {
        // PRODUCTION MODE: Send to RedCAP
        console.log("📤 PRODUCTION MODE: Sending recordings to RedCAP...")
        
      // Convert recordings to FormData for upload
      const formData = new FormData()
      formData.append('record_id', recordId)
      
      const today = new Date()
      const dateString = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`
      
      Object.entries(recordings).forEach(([questionType, recording]) => {
        if (recording.blob) {
            const filename = `${recordId}_${questionType}_${dateString}.wav`
            formData.append(`audio_${questionType}`, recording.blob as Blob, filename)
        }
      })

      // Add metadata
      formData.append('total_recordings', Object.keys(recordings).length.toString())
      formData.append('timestamp', new Date().toISOString())

      // Send to your backend API endpoint that handles RedCAP integration
      const response = await fetch('/api/submit-recordings', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        console.log("🎉 All recordings submitted successfully!", result)
        setIsSubmitted(true)
      } else {
        throw new Error(`Upload failed: ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error("Error submitting recordings:", error)
      alert("Fejl ved afsendelse af optagelser. Prøv igen senere.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return <SuccessScreen />
  }

  const hasCurrentRecording = !!recordings[currentQuestion.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col p-1 xs:p-2 sm:p-4">
      {/* Logo - positioned to avoid overlap across all resolutions */}
      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 z-10 xs:top-2 sm:top-3 sm:left-3 sm:transform-none md:top-4 md:left-4">
        <img
          src="/midt-steno-logo.png"
          alt="Midt Steno Logo"
          className="h-12 w-auto xs:h-14 sm:h-16 md:h-18 lg:h-20 xl:h-22"
        />
      </div>
      
      
      <div className="flex-1 flex items-center justify-center pt-16 xs:pt-18 sm:pt-12 md:pt-8">
        <Card className="w-full max-w-2xl bg-white shadow-2xl border-0">
          <CardHeader className="pb-2 sm:pb-3">
            <ProgressHeader
              currentQuestionIndex={currentQuestionIndex}
              totalQuestions={filteredQuestions.length}
            />
          </CardHeader>

          <CardContent className="space-y-3 sm:space-y-4">
            <div className="relative">
              <QuestionCard text={currentQuestion.text} />
      
              <ExamplePlayer 
                src={EXAMPLE_SOURCES[currentQuestion.id]} 
                isRecording={isRecording || isStartingRecording}
                onStop={stopExampleAudio}
              />
            </div>

            <div className="flex flex-col items-center space-y-3 sm:space-y-4 p-3 sm:p-4 bg-slate-50 rounded-xl">
              <RecordingControls
                isRecording={isRecording}
                isStartingRecording={isStartingRecording}
                countdown={countdown}
                showCountdown={true}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
              />

              {hasCurrentRecording && !isRecording && (
                <AudioPlayer
                  recording={recordings[currentQuestion.id]}
                  isPlaying={isPlaying === currentQuestion.id}
                  onPlay={() => playRecording(currentQuestion.id)}
                  onPause={stopPlayback}
                  onDelete={() => deleteRecording(currentQuestion.id)}
                />
              )}
            </div>
            
          </CardContent>

        <NavigationControls
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={filteredQuestions.length}
          hasCurrentRecording={hasCurrentRecording}
          totalRecordings={Object.keys(recordings).length}
          onPrevious={previousQuestion}
          onNext={nextQuestion}
          onSubmit={submitAllRecordings}
          isPlaying={!!isPlaying}
          isRecording={isRecording}
        />

        {isSubmitting && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="bg-white p-6 rounded-lg shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-lg font-semibold">Sender optagelser...</span>
              </div>
            </div>
          </div>
        )}
        </Card>
      </div>
      
      {/* Hotline moved to bottom of page */}
      <div className="max-w-2xl w-full mx-auto">
        <Hotline />
      </div>
    </div>
  )
}
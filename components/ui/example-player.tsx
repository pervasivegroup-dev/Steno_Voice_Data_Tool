"use client"

import { useState, useRef, useEffect } from "react"
import { Volume2, Pause, Play } from "lucide-react"

type ExamplePlayerProps = {
  src?: string
  label?: string
  isRecording?: boolean
  onStop?: number
}

export function ExamplePlayer({
  src,
  label = "Lyt til eksempel",
  isRecording = false,
  onStop,
}: ExamplePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Pause audio when recording starts
  useEffect(() => {
    if (isRecording && isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [isRecording, isPlaying])

  // Stop audio when onStop trigger changes
  useEffect(() => {
    if (onStop !== undefined && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }, [onStop])

  // Reset audio when src changes (new question)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
      setIsPlaying(false)
    }
  }, [src])

  if (!src) return null

  const togglePlayPause = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src)
      audioRef.current.onended = () => {
        setIsPlaying(false)
      }
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error)
      })
      setIsPlaying(true)
    }
  }

  return (
    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
      {/* 🔊 Play/Pause button */}
      <button
        type="button"
        aria-label={label}
        onClick={togglePlayPause}
        title={label}
        className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-1 sm:space-x-1.5 border border-white"
      >
        {isPlaying ? (
          <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        ) : (
          <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        )}
        <span className="text-xs sm:text-sm font-semibold">
          {isPlaying ? "Pause" : "Lyt til eksempel"}
        </span>
      </button>
    </div>
  )
}


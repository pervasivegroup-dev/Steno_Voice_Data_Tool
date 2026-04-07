"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw } from "lucide-react"

interface AudioPlayerProps {
  recording: {
    url: string
    duration: number
  }
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onDelete: () => void
}

export function AudioPlayer({ recording, isPlaying, onPlay, onPause, onDelete }: AudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1
          return next >= recording.duration ? recording.duration : next
        })
      }, 1000)
    } else {
      if (interval) {
        clearInterval(interval)
      }
      // Reset current time when not playing
      if (!isPlaying) {
        setCurrentTime(0)
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isPlaying, recording.duration])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center space-x-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm w-full max-w-md">
      <Button
        onClick={isPlaying ? onPause : onPlay}
        variant="ghost"
        size="icon"
        className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
        aria-label={isPlaying ? "Pause afspilning" : "Afspil optagelse"}
      >
        {isPlaying ? <Pause className="w-6 h-6 text-slate-700" /> : <Play className="w-6 h-6 text-slate-700 ml-0.5" />}
      </Button>

      <div className="flex-grow">
        <div className="text-sm font-semibold text-slate-800 mb-1">
          {formatTime(currentTime)} / {formatTime(recording.duration)}
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentTime / recording.duration) * 100}%` }}
          />
        </div>
      </div>

      <Button
        onClick={onDelete}
        variant="outline"
        size="sm"
        className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors bg-transparent"
      >
        <RotateCcw className="w-4 h-4 mr-2 text-slate-600" />
        <span className="text-slate-700">Optag igen</span>
      </Button>
    </div>
  )
}

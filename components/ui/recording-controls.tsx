"use client"

import { Button } from "@/components/ui/button"
import { Mic, Square } from "lucide-react"

interface RecordingControlsProps {
  isRecording: boolean
  isStartingRecording?: boolean
  countdown: number
  showCountdown?: boolean
  onStartRecording: () => void
  onStopRecording: () => void
}

export function RecordingControls({
  isRecording,
  isStartingRecording = false,
  countdown,
  showCountdown = true,
  onStartRecording,
  onStopRecording,
}: RecordingControlsProps) {
  return (
    <div className="flex flex-col items-center space-y-3 sm:space-y-4">
      <div className="flex items-center space-x-4">
        {isStartingRecording ? (
          <Button
            disabled
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg transition-all duration-200 flex flex-col items-center justify-center border-4 border-white"
            aria-label="Starter optagelse"
          >
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-white border-t-transparent"></div>
          </Button>
        ) : isRecording ? (
          <Button
            onClick={onStopRecording}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center border-4 border-white"
            aria-label="Stop optagelse"
          >
            <Square className="w-6 h-6 sm:w-8 sm:h-8 fill-white" />
            {showCountdown && countdown > 0 && <span className="text-xs font-bold text-white mt-1">{countdown}s</span>}
          </Button>
        ) : (
          <Button
            onClick={onStartRecording}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 border-4 border-white"
            aria-label="Start optagelse"
          >
            <Mic className="w-12 h-12 sm:w-18 sm:h-18 text-white" />
          </Button>
        )}
      </div>

      {isStartingRecording && (
        <div className="flex items-center space-x-2 text-yellow-600">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm font-semibold">Starter optagelse...</span>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center space-x-2 text-red-600">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm font-semibold">Optager...</span>
        </div>
      )}
    </div>
  )
}

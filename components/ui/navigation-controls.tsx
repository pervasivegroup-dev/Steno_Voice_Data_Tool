"use client"
import { Button } from "@/components/ui/button"

interface NavigationControlsProps {
  currentQuestionIndex: number
  totalQuestions: number
  hasCurrentRecording: boolean
  totalRecordings: number
  onPrevious: () => void
  onNext: () => void
  onSubmit: () => void
  isPlaying?: boolean
  isRecording?: boolean
}

export function NavigationControls({
  currentQuestionIndex,
  totalQuestions,
  hasCurrentRecording,
  totalRecordings,
  onPrevious,
  onNext,
  onSubmit,
  isPlaying = false,
  isRecording = false,
}: NavigationControlsProps) {
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1
  const canSubmit = totalRecordings === totalQuestions
  
  // Disable navigation if recording or playing
  const navigationDisabled = isRecording || isPlaying
  
  return (
    <div className="p-6 border-t border-slate-200 bg-slate-50">
      <div className="flex justify-between items-center">
        <Button
          onClick={onPrevious}
          disabled={currentQuestionIndex === 0 || navigationDisabled}
          variant="outline"
          className="px-6 py-2 border-slate-300 hover:border-slate-400 hover:bg-white transition-colors bg-transparent"
        >
          <span className="text-slate-700 font-medium">Forrige</span>
        </Button>
        {isLastQuestion ? (
          <Button
            onClick={onSubmit}
            disabled={!canSubmit || navigationDisabled}
            className="px-8 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Indsend alle optagelser
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!hasCurrentRecording || navigationDisabled}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Næste
          </Button>
        )}
      </div>
      <div className="mt-4 text-center text-sm text-slate-600">
        <p className="font-medium">
          Færdige optagelser: <span className="text-blue-600 font-semibold">{totalRecordings}</span> af {totalQuestions}
        </p>
        {navigationDisabled && (
          <p className="text-orange-600 font-medium mt-1">
            {isRecording ? "Optager..." : "Afspiller..."} - Navigation er midlertidigt deaktiveret
          </p>
        )}
      </div>
    </div>
  )
}
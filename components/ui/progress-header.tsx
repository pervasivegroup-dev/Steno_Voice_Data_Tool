import { Progress } from "@/components/ui/progress"

interface ProgressHeaderProps {
  currentQuestionIndex: number
  totalQuestions: number
  status?: string
}

export function ProgressHeader({ currentQuestionIndex, totalQuestions }: ProgressHeaderProps) {
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <div className="text-sm font-medium text-slate-600">
          Spørgsmål {currentQuestionIndex + 1} af {totalQuestions}
        </div>
      </div>
      <Progress value={progress} className="w-full h-2" />
    </div>
  )
}

interface QuestionCardProps {
  text: string
}

export function QuestionCard({ text }: QuestionCardProps) {
  return (
    <div className="text-center p-3 pt-20 xs:p-4 xs:pt-22 sm:p-6 sm:pt-24 md:pt-26 min-h-[160px] xs:min-h-[180px] sm:min-h-[200px] bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg">
      <p className="text-xs xs:text-sm sm:text-base leading-relaxed text-slate-800 font-medium whitespace-pre-line">
        {text}
      </p>
    </div>
  )
}


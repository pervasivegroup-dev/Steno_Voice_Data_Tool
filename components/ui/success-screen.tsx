import { Card, CardContent } from "@/components/ui/card"

export function SuccessScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-0">
        <CardContent className="text-center p-12">
          <div className="mb-8">
            <img
              src="/midt-steno-logo.png"
              alt="Midt Steno Logo"
              className="h-24 w-auto mx-auto mb-6"
            />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-8">Tak for din deltagelse!</h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-lg mx-auto">
            Dine optagelser er blevet indsendt til Steno Voice. Du kan nu lukke siden.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

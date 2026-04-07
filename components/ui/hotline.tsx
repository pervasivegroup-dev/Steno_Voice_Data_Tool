export function Hotline() {
  const contactName = process.env.NEXT_PUBLIC_CONTACT_NAME || "Project Administrator"
  const contactPhone = process.env.NEXT_PUBLIC_CONTACT_PHONE || ""

  return (
    <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-slate-700">
      Hvis du støder ind i problemer kan du kontakte projektansvarlig{" "}
      <span className="font-semibold">{contactName}</span>
      {contactPhone && (
        <>, på:{" "}
          <a href={`tel:${contactPhone}`} className="text-blue-700 hover:underline">
            {contactPhone}
          </a>
        </>
      )}
    </div>
  )
}

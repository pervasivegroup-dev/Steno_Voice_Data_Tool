export const AUDIO_QUESTIONS = [
  {
    id: "a_phonation",
    text: 'Tag nu en dyb indånding, tryk på den blå optageknap nedenfor, og sig lyden "a" (som i ordet [kat]) så længe som muligt. Stop optagelsen ved at trykke på knappen igen, når du løber tør for luft.',
  },
  {
    id: "pataka",
    text: 'Tryk på den blå optageknap nedenfor, og gentag stavelserne /PaTaKa/ så hurtigt som muligt i 10 sekunder. Stop optagelsen ved at trykke på knappen igen, når tiden er gået',
  },
  {
    id: "counting",
    text: 'Tryk på den blå optageknap nedenfor, og tæl fra 1 til 20 i normalt tempo uden pause. Stop optagelsen ved at trykke på knappen igen, når du er færdig',
  },
  {
    id: "text_reading",
    text: 'Tryk på den blå optageknap nedenfor og læs venligst følgende tekst højt. Stop optagelsen ved at trykke på knappen igen, når du er færdig \n \n Enhver har ret til at tænke frit, til samvittigheds- og religionsfrihed; denne ret omfatter frihed til at skifte religion eller overbevisning såvel som frihed til enten alene eller sammen med andre, offentligt eller privat at udøve sin religion eller overbevisning gennem gudstjeneste, undervisning, religiøse skikke og overholdelse af rituelle forskrifter.',
  },
  {
    id: "diabetes_life",
    text: 'Tryk på den blå optageknap nedenfor, og beskriv med dine egne ord, livet med diabetes? Forsøg at beskriv hvordan du oplever livet med diabetes. Forsøg at være så præcis som muligt. Stop optagelsen ved at trykke på knappen igen, når du er færdig',
  },
]

export const EXAMPLE_SOURCES: Record<string, string> = {
  text_reading: "/recording_examples/text_roede.mp3",
  a_phonation: "/recording_examples/a_roede.mp3",
  counting: "/recording_examples/counting_roede.mp3",
  pataka: "/recording_examples/pataka_roede.mp3",
}


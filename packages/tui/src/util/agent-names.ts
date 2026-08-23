const CALLSIGNS = [
  // Sci-fi
  "Mercury",
  "Apollo",
  "Orion",
  "Nova",
  "Phoenix",
  "Zenith",
  "Pulsar",
  "Quasar",
  "Nebula",
  "Vulcan",
  // Retro
  "Rebel",
  "Maverick",
  "Ace",
  "Blitz",
  "Rocket",
  "Turbo",
  "Chrome",
  "Steel",
  "Nitro",
  "Axle",
  // Auto
  "Cobra",
  "Stingray",
  "GT40",
  "Spyder",
  "Raptor",
  "Talon",
  "Viper",
  "Evo",
  "Impreza",
  "Bronco",
]

let counter = 0

export function nextCallsign(): string {
  const name = CALLSIGNS[counter % CALLSIGNS.length]
  counter++
  return name
}

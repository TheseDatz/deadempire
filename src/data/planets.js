const planetModules = import.meta.glob('./planets/*.json', { eager: true, import: 'default' })

function normalizePlanet(planet) {
  return {
    ...planet,
    color: planet.color || '#4fc3ff',
    moons: planet.moons || [],
    locations: planet.locations || [],
    notes: planet.notes || '',
  }
}

export const planets = Object.values(planetModules)
  .map(normalizePlanet)
  .sort((first, second) => first.name.localeCompare(second.name))

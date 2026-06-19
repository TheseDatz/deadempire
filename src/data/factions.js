const factionModules = import.meta.glob('./factions/*.json', { eager: true, import: 'default' })

function normalizeFaction(faction) {
  return {
    ...faction,
    borderColor: faction.borderColor || '#4fc3ff',
    notes: faction.notes || '',
  }
}

export const factions = Object.values(factionModules)
  .map(normalizeFaction)
  .sort((first, second) => first.name.localeCompare(second.name))

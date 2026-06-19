const npcModules = import.meta.glob('./npcs/*.json', { eager: true, import: 'default' })

function normalizeNpc(npc) {
  return {
    ...npc,
    skills: npc.skills || [],
    gear: npc.gear || [],
  }
}

export const npcs = Object.values(npcModules)
  .map(normalizeNpc)
  .sort((first, second) => first.name.localeCompare(second.name))

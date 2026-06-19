const logModules = import.meta.glob('./game-log-entries/*.json', { eager: true, import: 'default' })

function normalizeLog(log) {
  return {
    ...log,
    participatingCharacters: log.participatingCharacters || [],
    body: Array.isArray(log.body) ? log.body : [log.body].filter(Boolean),
  }
}

export const gameLogs = Object.values(logModules)
  .map(normalizeLog)
  .sort((first, second) => new Date(second.date) - new Date(first.date))

export function getGameLog(slug) {
  return gameLogs.find((log) => log.slug === slug)
}

export function getGameLogPlayers() {
  return [...new Set(gameLogs.flatMap((log) => log.participatingCharacters))].sort()
}

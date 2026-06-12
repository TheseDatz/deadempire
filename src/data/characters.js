const REPO_OWNER = 'TheseDatz'
const REPO_NAME = 'deadempire-data'
const BRANCH = 'main'
const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`

async function loadJsonFolder(folder) {
  const response = await fetch(`${GITHUB_API_BASE}/${folder}?ref=${BRANCH}`)

  if (!response.ok) {
    throw new Error(`Could not load ${folder} from ${REPO_OWNER}/${REPO_NAME}`)
  }

  const files = await response.json()
  const jsonFiles = files.filter((file) => file.type === 'file' && file.name.endsWith('.json'))

  return Promise.all(
    jsonFiles.map(async (file) => {
      const jsonResponse = await fetch(file.download_url)

      if (!jsonResponse.ok) {
        throw new Error(`Could not load ${file.name}`)
      }

      return jsonResponse.json()
    }),
  )
}

export async function loadPlayerCharacters() {
  return loadJsonFolder('playercharacters')
}

export async function loadImportantNpcs() {
  return []
}

export async function loadAllCharacters() {
  const [playerCharacters, importantNpcs] = await Promise.all([
    loadPlayerCharacters(),
    loadImportantNpcs(),
  ])

  return {
    playerCharacters,
    importantNpcs,
    allCharacters: [...playerCharacters, ...importantNpcs],
  }
}

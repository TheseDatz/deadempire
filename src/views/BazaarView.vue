<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { getSession, isAdminSession, onAuthStateChange } from '../services/auth'
import {
  createBazaarItem,
  loadBazaarItems,
  loadImperialTradeSelection,
  updateBazaarItem,
  updateImperialTradeSelection,
} from '../services/bazaar'

const IMPERIAL_STORE = 'Imperial Trade Network'
const PAGE_SIZE = 10

const shops = [
  IMPERIAL_STORE,
  'Blaster Techs.',
  'Mandalorian Procurement',
  'Curious Oddities',
  'Biochemical Industries',
  'Adv. Defense Networks',
  'Kryat Ship Lot',
  'Jawa Provisions',
]

const allItems = ref([])

const sellerPools = {
  [IMPERIAL_STORE]: [
    'TK-421',
    'ISB Annex Cresh',
    'Lt. Vanko',
    'Bureau Surplus Desk',
    'Officer Drel',
    'ST-1109',
    'Procurement Office 17',
  ],
  'Blaster Techs.': [
    'Merr-Sonn Outlet 44',
    'SoroSuub Refurb Desk',
    'Kova Spark',
    'Benthic Arms Salvage',
    'Jessa Vorn',
    'Outer Rim Range Supply',
  ],
  'Mandalorian Procurement': [
    'Clan Ordo Broker',
    'Haran Supply',
    'Teroch Venn',
    'Clan Wren Annex',
    'Kyrimorut Lots',
    'Vexa Rook',
  ],
  'Curious Oddities': [
    'Vela Voss',
    'Nix of No Fixed Stall',
    'Orren Pell',
    'Madame Sular',
    'Tavi Quill',
    'The Third Crate',
  ],
  'Biochemical Industries': [
    'BioInd Desk',
    'Novagen Samples',
    'Kariis Chemworks',
    'VitaGel Returns',
    'Lab Annex 4',
    'Cresh Medical Waste',
  ],
  'Adv. Defense Networks': [
    'ADN Counter',
    'Kuat Armor Finishes',
    'Rellin Plateworks',
    'Daro Vance',
    'CoreSec Surplus',
    'Vesh Tactical Display',
  ],
  'Kryat Ship Lot': [
    'Lot Seven',
    'Corellian Dock Remnants',
    'Tressa Vale',
    'Byblos Yard Rejects',
    'Kryat Hull Exchange',
    'Navo Starframes',
  ],
  'Jawa Provisions': [
    'Utinni Crate',
    'Tteek',
    'Nka Nka',
    'Sandcrawler Shelf 9',
    'Ronto Road Bin',
    'Wimateeka',
  ],
}

const selectedShop = ref(IMPERIAL_STORE)
const selectedCategory = ref('ANY')
const searchTerm = ref('')
const minCost = ref('1')
const maxCost = ref('1000000000')
const currentPage = ref(1)
const imperialSelection = ref([])
const selectedItem = ref(null)
const generatedSellers = ref({})
const isLoading = ref(true)
const isCreateModalOpen = ref(false)
const isLootModalOpen = ref(false)
const isSavingItem = ref(false)
const loadErrorMessage = ref('')
const createErrorMessage = ref('')
const createMessage = ref('')
const lootErrorMessage = ref('')
const lootResults = ref([])
const editingItemSlug = ref('')
const itemForm = ref(createBlankItemForm())
const lootForm = ref(createBlankLootForm())
const session = ref(null)
let unsubscribe = null

const isAdmin = computed(() => isAdminSession(session.value))
const itemsById = computed(() => Object.fromEntries(allItems.value.map((item) => [item.id, item])))

const categories = computed(() => {
  const values = storeAvailableItems.value.map((item) => item.category)
  return ['ANY', ...new Set(values)]
})

const storeAvailableItems = computed(() =>
  allItems.value.filter((item) => item.stores.includes(selectedShop.value)),
)

const imperialItems = computed(() => {
  const selectedIds = imperialSelection.value.length
    ? imperialSelection.value
    : allItems.value.filter((item) => item.stores.includes(IMPERIAL_STORE)).slice(0, PAGE_SIZE).map((item) => item.id)
  const selectedItems = selectedIds
    .map((id) => itemsById.value[id])
    .filter((item) => item && item.stores.includes(IMPERIAL_STORE))

  return selectedItems.length ? selectedItems : storeAvailableItems.value.slice(0, PAGE_SIZE)
})

const visibleStoreItems = computed(() =>
  selectedShop.value === IMPERIAL_STORE ? imperialItems.value : storeAvailableItems.value,
)

const filteredItems = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  const minimum = Number(minCost.value) || 0
  const maximum = Number(maxCost.value) || Number.POSITIVE_INFINITY

  return visibleStoreItems.value.filter((item) => {
    const displayCost = getDisplayCostBounds(item)
    const matchesCategory = selectedCategory.value === 'ANY' || item.category === selectedCategory.value
    const matchesCost = displayCost.max >= minimum && displayCost.min <= maximum
    const haystack = [item.name, item.category, item.description, item.tagline, item.note, getGeneratedSeller(item)]
      .join(' ')
      .toLowerCase()

    return matchesCategory && matchesCost && (!query || haystack.includes(query))
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / PAGE_SIZE)))
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredItems.value.slice(start, start + PAGE_SIZE).map((item) => ({
    ...item,
    seller: getGeneratedSeller(item),
  }))
})
const paginationStart = computed(() => (filteredItems.value.length ? (currentPage.value - 1) * PAGE_SIZE + 1 : 0))
const paginationEnd = computed(() => Math.min(currentPage.value * PAGE_SIZE, filteredItems.value.length))

function getImperialPrice(item) {
  return Math.ceil(item.costRange[0] / 100)
}

function getDisplayCostBounds(item) {
  if (selectedShop.value === IMPERIAL_STORE) {
    const price = getImperialPrice(item)
    return { min: price, max: price }
  }

  return { min: item.costRange[0], max: item.costRange[1] }
}

function formatPrice(item) {
  if (selectedShop.value === IMPERIAL_STORE) {
    return String(getImperialPrice(item))
  }

  return `${item.costRange[0]}-${item.costRange[1]}`
}

function getRandomItemIds(items, count) {
  return [...items]
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((item) => item.id)
}

function getRandomSeller(store) {
  const pool = sellerPools[store] || ['Anonymous Seller']
  return pool[Math.floor(Math.random() * pool.length)]
}

function assignSellersForStore(store, items) {
  const existingStoreSellers = generatedSellers.value[store] || {}
  const nextStoreSellers = { ...existingStoreSellers }

  items.forEach((item) => {
    if (!nextStoreSellers[item.id]) {
      nextStoreSellers[item.id] = getRandomSeller(store)
    }
  })

  generatedSellers.value = {
    ...generatedSellers.value,
    [store]: nextStoreSellers,
  }
}

function getGeneratedSeller(item, store = selectedShop.value) {
  return generatedSellers.value[store]?.[item.id] || item.seller || 'Anonymous Seller'
}

function saveImperialSelection(ids) {
  imperialSelection.value = ids
}

function ensureImperialSelection() {
  const imperialAvailableItems = allItems.value.filter((item) => item.stores.includes(IMPERIAL_STORE))
  const validSelection = imperialSelection.value.filter((id) => itemsById.value[id]?.stores.includes(IMPERIAL_STORE))

  if (validSelection.length) {
    imperialSelection.value = validSelection.slice(0, PAGE_SIZE)
    return imperialSelection.value
  }

  const generatedSelection = imperialAvailableItems.slice(0, PAGE_SIZE).map((item) => item.id)
  saveImperialSelection(generatedSelection)
  return generatedSelection
}

async function randomizeImperialSelection() {
  const imperialAvailableItems = allItems.value.filter((item) => item.stores.includes(IMPERIAL_STORE))
  const nextSelection = getRandomItemIds(imperialAvailableItems, PAGE_SIZE)
  const { slugs, error } = await updateImperialTradeSelection(nextSelection)

  if (error) {
    loadErrorMessage.value = error.message
  } else {
    saveImperialSelection(slugs.length ? slugs : nextSelection)
  }

  currentPage.value = 1
}

function resetFilters() {
  selectedCategory.value = 'ANY'
  searchTerm.value = ''
  minCost.value = '1'
  maxCost.value = '1000000000'
  currentPage.value = 1
}

function goToPreviousPage() {
  currentPage.value = Math.max(1, currentPage.value - 1)
}

function goToNextPage() {
  currentPage.value = Math.min(totalPages.value, currentPage.value + 1)
}

function createBlankItemForm() {
  return {
    slug: '',
    name: '',
    category: '',
    stores: [selectedShop.value],
    imageUrl: '',
    costMin: '0',
    costMax: '0',
    description: '',
    tagline: '',
    note: '',
    time: '1d',
    count: '1',
    color: '#9be7ff',
  }
}

function createBlankLootForm() {
  return {
    stores: [selectedShop.value],
    count: '3',
    maxCost: '100',
  }
}

function itemToForm(item) {
  return {
    slug: item.slug || item.id || '',
    name: item.name || '',
    category: item.category || '',
    stores: [...(item.stores || [])],
    imageUrl: item.imageUrl || '',
    costMin: String(item.costRange?.[0] ?? 0),
    costMax: String(item.costRange?.[1] ?? 0),
    description: item.description || '',
    tagline: item.tagline || '',
    note: item.note || '',
    time: item.time || '',
    count: String(item.count || 1),
    color: item.color || '#9be7ff',
  }
}

function openItemInfo(item) {
  selectedItem.value = item
}

function closeItemInfo() {
  selectedItem.value = null
}

function openCreateModal() {
  createErrorMessage.value = ''
  editingItemSlug.value = ''
  itemForm.value = createBlankItemForm()
  isCreateModalOpen.value = true
}

function openEditModal(item) {
  createErrorMessage.value = ''
  createMessage.value = ''
  editingItemSlug.value = item.slug || item.id
  itemForm.value = itemToForm(item)
  selectedItem.value = null
  isCreateModalOpen.value = true
}

function closeCreateModal() {
  if (isSavingItem.value) {
    return
  }

  isCreateModalOpen.value = false
}

function openLootModal() {
  lootErrorMessage.value = ''
  lootResults.value = []
  lootForm.value = createBlankLootForm()
  isLootModalOpen.value = true
}

function closeLootModal() {
  isLootModalOpen.value = false
}

function toggleItemStore(store) {
  const stores = itemForm.value.stores

  if (stores.includes(store)) {
    itemForm.value.stores = stores.filter((existingStore) => existingStore !== store)
  } else {
    itemForm.value.stores = [...stores, store]
  }
}

function toggleLootStore(store) {
  const stores = lootForm.value.stores

  if (stores.includes(store)) {
    lootForm.value.stores = stores.filter((existingStore) => existingStore !== store)
  } else {
    lootForm.value.stores = [...stores, store]
  }
}

function getRandomItems(items, count) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count)
}

function generateLootTable() {
  lootErrorMessage.value = ''
  lootResults.value = []

  const selectedStores = lootForm.value.stores
  const requestedCount = Math.max(1, Number(lootForm.value.count) || 1)
  const maximumCost = Number(lootForm.value.maxCost) || 0

  if (!selectedStores.length) {
    lootErrorMessage.value = 'Select at least one store.'
    return
  }

  if (maximumCost <= 0) {
    lootErrorMessage.value = 'Enter a maximum credit value greater than 0.'
    return
  }

  const eligibleItems = allItems.value.filter((item) => {
    const matchesStore = item.stores.some((store) => selectedStores.includes(store))
    return matchesStore && item.costRange[1] <= maximumCost
  })

  if (!eligibleItems.length) {
    lootErrorMessage.value = 'No items match those loot table filters.'
    return
  }

  lootResults.value = getRandomItems(eligibleItems, requestedCount)
}

async function saveNewItem() {
  createErrorMessage.value = ''
  createMessage.value = ''
  isSavingItem.value = true

  const result = editingItemSlug.value
    ? await updateBazaarItem(editingItemSlug.value, itemForm.value)
    : await createBazaarItem(itemForm.value)
  const { item, error } = result

  if (error) {
    createErrorMessage.value = error.message
  } else if (item) {
    const existingIndex = allItems.value.findIndex((existingItem) => existingItem.id === item.id)

    if (existingIndex >= 0) {
      allItems.value.splice(existingIndex, 1, item)
    } else {
      allItems.value.push(item)
    }

    allItems.value = [...allItems.value].sort((firstItem, secondItem) => firstItem.name.localeCompare(secondItem.name))
    createMessage.value = `${editingItemSlug.value ? 'Updated' : 'Created'} ${item.name}.`
    editingItemSlug.value = ''
    isCreateModalOpen.value = false
  }

  isSavingItem.value = false
}

watch([selectedShop, selectedCategory, searchTerm, minCost, maxCost], () => {
  currentPage.value = 1
})

watch(
  [selectedShop, visibleStoreItems],
  () => {
    assignSellersForStore(selectedShop.value, visibleStoreItems.value)
  },
  { immediate: true },
)

watch(categories, () => {
  if (!categories.value.includes(selectedCategory.value)) {
    selectedCategory.value = 'ANY'
  }
})

watch(totalPages, () => {
  currentPage.value = Math.min(currentPage.value, totalPages.value)
})

onMounted(async () => {
  const { session: activeSession } = await getSession()
  session.value = activeSession

  isLoading.value = true
  loadErrorMessage.value = ''

  const [{ items, error }, { slugs, error: selectionError }] = await Promise.all([
    loadBazaarItems(),
    loadImperialTradeSelection(),
  ])

  if (error) {
    loadErrorMessage.value = error.message
  } else if (selectionError) {
    loadErrorMessage.value = selectionError.message
  } else {
    allItems.value = items
    imperialSelection.value = slugs
    ensureImperialSelection()
  }

  isLoading.value = false

  unsubscribe = onAuthStateChange((activeSession) => {
    session.value = activeSession
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<template>
  <main class="bazaar-page min-h-screen px-4 pb-16 pt-32 text-stone-100 sm:px-6">
    <section class="mx-auto max-w-7xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Outer Rim Commerce</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Bazaar</h1>

      <section class="bazaar-terminal mt-10" aria-label="Bazaar market listings">
        <div class="bazaar-titlebar">
          <label class="bazaar-shop-select">
            <span class="sr-only">Select shop</span>
            <select v-model="selectedShop" aria-label="Select bazaar shop">
              <option v-for="shop in shops" :key="shop">{{ shop }}</option>
            </select>
          </label>
        </div>

        <div class="bazaar-shell">
          <aside class="bazaar-filters" aria-label="Filter result">
            <h3>Filter Result:</h3>

            <label class="bazaar-filter">
              <span>Category:</span>
              <select v-model="selectedCategory" aria-label="Category">
                <option v-for="category in categories" :key="category">{{ category }}</option>
              </select>
            </label>

            <label class="bazaar-filter">
              <span>Search Terms:</span>
              <input v-model="searchTerm" type="text" aria-label="Search terms" />
            </label>

            <label class="bazaar-filter">
              <span>Cost Range:</span>
              <input v-model="minCost" type="number" min="0" aria-label="Minimum cost" />
              <input v-model="maxCost" type="number" min="0" aria-label="Maximum cost" />
            </label>

            <button
              v-if="selectedShop === IMPERIAL_STORE && isAdmin"
              class="bazaar-randomize-button"
              type="button"
              @click="randomizeImperialSelection"
            >
              Randomize
            </button>

            <button v-if="isAdmin" class="bazaar-randomize-button" type="button" @click="openCreateModal">
              New Item
            </button>

            <button v-if="isAdmin" class="bazaar-randomize-button" type="button" @click="openLootModal">
              Loot Table
            </button>

            <div class="bazaar-filter-actions">
              <button type="button" @click="resetFilters">Reset</button>
              <button type="button" @click="currentPage = 1">Search C</button>
            </div>
          </aside>

          <section class="bazaar-results" aria-label="Market search results">
            <div class="bazaar-table-head" aria-hidden="true">
              <span>Image</span>
              <span>Name</span>
              <span>Time</span>
              <span>Seller</span>
              <span>Price</span>
              <span>Buy</span>
            </div>

            <ol class="bazaar-list">
              <li v-if="isLoading" class="bazaar-empty-row">Loading bazaar listings...</li>
              <li v-else-if="loadErrorMessage" class="bazaar-empty-row bazaar-error-row">{{ loadErrorMessage }}</li>
              <template v-else>
                <li v-for="item in pagedItems" :key="`${selectedShop}-${item.id}`" class="bazaar-row">
                  <div class="bazaar-item-icon" :style="{ '--rarity': item.color }">
                    <img :src="item.imageUrl" :alt="item.name" />
                    <span>{{ item.count }}</span>
                  </div>
                  <div class="bazaar-item-name">
                    <strong :style="{ color: item.color }">{{ item.name }}</strong>
                  </div>
                  <div>{{ item.time }}</div>
                <div class="bazaar-seller">{{ item.seller }}</div>
                <div class="bazaar-price">
                  <span v-if="selectedShop === IMPERIAL_STORE" class="bazaar-requisition-prefix">REC.</span>
                  <span v-else class="bazaar-credit-symbol" aria-hidden="true">R</span>
                  {{ formatPrice(item) }}
                </div>
                  <button
                    class="bazaar-buy-button"
                    type="button"
                    :aria-label="`View ${item.name} info`"
                    @click="openItemInfo(item)"
                  >
                    INFO
                  </button>
                </li>
                <li v-if="!pagedItems.length" class="bazaar-empty-row">No listings match this search.</li>
              </template>
            </ol>

            <footer class="bazaar-pagination">
              <button type="button" aria-label="Previous page" :disabled="currentPage === 1" @click="goToPreviousPage">
                &lt;
              </button>
              <span>Showing {{ paginationStart }}-{{ paginationEnd }}/{{ filteredItems.length }}</span>
              <button type="button" aria-label="Next page" :disabled="currentPage === totalPages" @click="goToNextPage">
                &gt;
              </button>
            </footer>
          </section>
        </div>

        <nav class="bazaar-tabs" aria-label="Bazaar tabs">
          <button class="bazaar-tab-active" type="button">Buy</button>
        </nav>
      </section>

      <p v-if="createMessage" class="profile-message mt-5">{{ createMessage }}</p>
    </section>

    <div v-if="isLootModalOpen" class="bazaar-modal-backdrop" role="presentation" @click.self="closeLootModal">
      <section class="bazaar-modal bazaar-create-modal" role="dialog" aria-modal="true" aria-labelledby="bazaar-loot-title">
        <div class="bazaar-modal-header">
          <div>
            <p>Admin Market Tools</p>
            <h2 id="bazaar-loot-title">Loot Table Pull</h2>
          </div>
          <button type="button" aria-label="Close loot table tool" @click="closeLootModal">x</button>
        </div>

        <form class="bazaar-create-form" @submit.prevent="generateLootTable">
          <div class="bazaar-create-grid">
            <label>
              <span>Number of Items</span>
              <input v-model="lootForm.count" type="number" min="1" required />
            </label>

            <label>
              <span>Max Credit Value</span>
              <input v-model="lootForm.maxCost" type="number" min="1" required />
            </label>
          </div>

          <fieldset class="bazaar-store-fieldset">
            <legend>Draw From Stores</legend>
            <label v-for="shop in shops" :key="shop">
              <input
                type="checkbox"
                :checked="lootForm.stores.includes(shop)"
                @change="toggleLootStore(shop)"
              />
              <span>{{ shop }}</span>
            </label>
          </fieldset>

          <div class="bazaar-create-actions">
            <button class="bazaar-randomize-button" type="submit">Generate</button>
            <button class="bazaar-randomize-button" type="button" @click="closeLootModal">Close</button>
          </div>

          <p v-if="lootErrorMessage" class="profile-message profile-message-error">{{ lootErrorMessage }}</p>

          <section v-if="lootResults.length" class="bazaar-loot-results">
            <article v-for="item in lootResults" :key="`loot-${item.id}`" class="bazaar-loot-row">
              <img :src="item.imageUrl" :alt="item.name" />
              <div>
                <h3 :style="{ color: item.color }">{{ item.name }}</h3>
                <p>{{ item.category }} | {{ item.stores.join(', ') }}</p>
                <p>{{ item.tagline }}</p>
              </div>
              <span>
                <span class="bazaar-credit-symbol" aria-hidden="true">R</span>
                {{ item.costRange[0] }}-{{ item.costRange[1] }}
              </span>
            </article>
          </section>
        </form>
      </section>
    </div>

    <div v-if="isCreateModalOpen" class="bazaar-modal-backdrop" role="presentation" @click.self="closeCreateModal">
      <section class="bazaar-modal bazaar-create-modal" role="dialog" aria-modal="true" aria-labelledby="bazaar-create-title">
        <div class="bazaar-modal-header">
          <div>
            <p>Admin Market Tools</p>
            <h2 id="bazaar-create-title">{{ editingItemSlug ? 'Edit Bazaar Item' : 'New Bazaar Item' }}</h2>
          </div>
          <button type="button" aria-label="Close new item form" :disabled="isSavingItem" @click="closeCreateModal">x</button>
        </div>

        <form class="bazaar-create-form" @submit.prevent="saveNewItem">
          <div class="bazaar-create-grid">
            <label>
              <span>Name</span>
              <input v-model="itemForm.name" type="text" required placeholder="Odd little thing" />
            </label>

            <label>
              <span>Slug</span>
              <input v-model="itemForm.slug" type="text" placeholder="auto-generated from name" />
            </label>

            <label>
              <span>Category</span>
              <input v-model="itemForm.category" type="text" required placeholder="Curios" />
            </label>

            <label>
              <span>Image URL</span>
              <input v-model="itemForm.imageUrl" type="url" placeholder="Optional; generated if blank" />
            </label>

            <label>
              <span>Minimum Cost</span>
              <input v-model="itemForm.costMin" type="number" min="0" required />
            </label>

            <label>
              <span>Maximum Cost</span>
              <input v-model="itemForm.costMax" type="number" min="0" required />
            </label>

            <label>
              <span>Time</span>
              <input v-model="itemForm.time" type="text" placeholder="1d" />
            </label>

            <label>
              <span>Quantity</span>
              <input v-model="itemForm.count" type="number" min="1" required />
            </label>

            <label>
              <span>Color</span>
              <input v-model="itemForm.color" type="color" />
            </label>
          </div>

          <fieldset class="bazaar-store-fieldset">
            <legend>Stores</legend>
            <label v-for="shop in shops" :key="shop">
              <input
                type="checkbox"
                :checked="itemForm.stores.includes(shop)"
                @change="toggleItemStore(shop)"
              />
              <span>{{ shop }}</span>
            </label>
          </fieldset>

          <label>
            <span>Tagline</span>
            <input v-model="itemForm.tagline" type="text" placeholder="Short flavor line" />
          </label>

          <label>
            <span>Description</span>
            <textarea v-model="itemForm.description" rows="3" placeholder="Short description"></textarea>
          </label>

          <label>
            <span>Note</span>
            <textarea v-model="itemForm.note" rows="3" placeholder="Short note"></textarea>
          </label>

          <div class="bazaar-create-actions">
            <button class="bazaar-randomize-button" type="submit" :disabled="isSavingItem">
              {{ isSavingItem ? 'Saving...' : editingItemSlug ? 'Save Changes' : 'Create Item' }}
            </button>
            <button class="bazaar-randomize-button" type="button" :disabled="isSavingItem" @click="closeCreateModal">
              Cancel
            </button>
          </div>

          <p v-if="createErrorMessage" class="profile-message profile-message-error">{{ createErrorMessage }}</p>
        </form>
      </section>
    </div>

    <div v-if="selectedItem" class="bazaar-modal-backdrop" role="presentation" @click.self="closeItemInfo">
      <section class="bazaar-modal" role="dialog" aria-modal="true" :aria-labelledby="`bazaar-item-${selectedItem.id}`">
        <div class="bazaar-modal-header">
          <div>
            <p>{{ selectedItem.category }}</p>
            <h2 :id="`bazaar-item-${selectedItem.id}`">{{ selectedItem.name }}</h2>
          </div>
          <div class="bazaar-modal-header-actions">
            <button v-if="isAdmin" type="button" @click="openEditModal(selectedItem)">Edit Item</button>
            <button type="button" aria-label="Close item info" @click="closeItemInfo">x</button>
          </div>
        </div>

        <div class="bazaar-modal-body">
          <img :src="selectedItem.imageUrl" :alt="selectedItem.name" />

          <dl>
            <div>
              <dt>Cost Range</dt>
              <dd>
                <span class="bazaar-credit-symbol" aria-hidden="true">R</span>
                {{ selectedItem.costRange[0] }}-{{ selectedItem.costRange[1] }}
              </dd>
            </div>
            <div>
              <dt>Current Store Price</dt>
              <dd>
                <span v-if="selectedShop === IMPERIAL_STORE" class="bazaar-requisition-prefix">REC.</span>
                <span v-else class="bazaar-credit-symbol" aria-hidden="true">R</span>
                {{ formatPrice(selectedItem) }}
              </dd>
            </div>
            <div>
              <dt>Available In</dt>
              <dd>{{ selectedItem.stores.join(', ') }}</dd>
            </div>
            <div>
              <dt>Seller</dt>
              <dd>{{ selectedItem.seller }}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd>{{ selectedItem.time }}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{{ selectedItem.count }}</dd>
            </div>
            <div>
              <dt>Tagline</dt>
              <dd>{{ selectedItem.tagline }}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{{ selectedItem.description }}</dd>
            </div>
            <div>
              <dt>Note</dt>
              <dd>{{ selectedItem.note }}</dd>
            </div>
            <div>
              <dt>Image URL</dt>
              <dd>{{ selectedItem.imageUrl }}</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.bazaar-page {
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 242, 167, 0.08), transparent 24%),
    radial-gradient(circle at 80% 18%, rgba(79, 195, 255, 0.11), transparent 28%),
    radial-gradient(circle at 28px 34px, rgba(255, 255, 255, 0.9) 1px, transparent 1.6px),
    radial-gradient(circle at 120px 80px, rgba(217, 245, 255, 0.56) 1px, transparent 1.5px),
    linear-gradient(180deg, #010308 0%, #030711 52%, #010206 100%);
  background-attachment: fixed;
  background-size: auto, auto, 220px 220px, 300px 300px, auto;
}

.bazaar-terminal {
  position: relative;
  overflow: hidden;
  border: 2px solid #14a9e8;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(79, 195, 255, 0.18), transparent 28%),
    linear-gradient(180deg, rgba(6, 38, 55, 0.96), rgba(0, 8, 15, 0.96));
  box-shadow:
    0 0 0 1px rgba(155, 231, 255, 0.64),
    0 0 24px rgba(20, 151, 255, 0.54),
    inset 0 0 36px rgba(79, 195, 255, 0.16);
}

.bazaar-terminal::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(120deg, transparent 0 58%, rgba(79, 195, 255, 0.14) 58.2% 58.7%, transparent 59%),
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0 1px, transparent 1px 5px);
  opacity: 0.72;
}

.bazaar-titlebar {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: flex-start;
  gap: 16px;
  border-bottom: 1px solid rgba(155, 231, 255, 0.72);
  background: linear-gradient(180deg, rgba(28, 165, 211, 0.7), rgba(4, 44, 65, 0.9));
  padding: 4px 10px;
}

.bazaar-shop-select {
  position: relative;
  display: inline-grid;
  min-width: min(420px, calc(100vw - 96px));
}

.bazaar-shop-select::after {
  content: '';
  position: absolute;
  right: 12px;
  top: 50%;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid #ffc84b;
  filter: drop-shadow(0 0 4px rgba(255, 196, 64, 0.46));
  pointer-events: none;
  transform: translateY(-35%);
}

.bazaar-shop-select select {
  appearance: none;
  width: 100%;
  border: 0;
  background: transparent;
  color: #ffc84b;
  font-size: clamp(1.05rem, 2.2vw, 1.55rem);
  font-weight: 900;
  line-height: 1;
  outline: none;
  padding: 2px 34px 2px 0;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.92),
    0 0 8px rgba(255, 196, 64, 0.38);
  text-transform: uppercase;
}

.bazaar-shop-select option {
  background: #06121b;
  color: #ffc84b;
}

.bazaar-shop-select select:focus-visible {
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.92),
    0 0 10px rgba(255, 196, 64, 0.56);
}

.bazaar-titlebar button,
.bazaar-pagination button,
.bazaar-buy-button {
  border: 1px solid rgba(79, 195, 255, 0.84);
  background: rgba(1, 10, 18, 0.72);
  color: #9be7ff;
  font-weight: 900;
  line-height: 1;
  box-shadow:
    inset 0 0 10px rgba(79, 195, 255, 0.2),
    0 0 10px rgba(20, 151, 255, 0.3);
}

.bazaar-titlebar button {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  font-size: 18px;
}

.bazaar-shell {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  gap: 8px;
  padding: 8px;
}

.bazaar-filters,
.bazaar-results {
  border: 1px solid rgba(79, 195, 255, 0.72);
  background: rgba(0, 8, 14, 0.86);
  box-shadow:
    inset 0 0 18px rgba(79, 195, 255, 0.08),
    0 0 12px rgba(20, 151, 255, 0.24);
}

.bazaar-filters {
  display: grid;
  align-content: start;
  gap: 6px;
  min-height: 560px;
  padding: 12px 12px 10px;
}

.bazaar-filters h3 {
  color: #ffc84b;
  font-size: 16px;
  font-weight: 900;
  text-shadow: 0 0 8px rgba(255, 196, 64, 0.38);
}

.bazaar-filter {
  display: grid;
  gap: 3px;
}

.bazaar-filter span {
  color: #29caff;
  font-size: 14px;
  font-weight: 900;
  line-height: 1.1;
  text-shadow: 0 0 7px rgba(79, 195, 255, 0.78);
}

.bazaar-filter select,
.bazaar-filter input {
  min-width: 0;
  width: 100%;
  height: 25px;
  border: 1px solid rgba(79, 195, 255, 0.86);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(3, 23, 35, 0.94), rgba(0, 4, 8, 0.94));
  color: #d9f5ff;
  font-size: 14px;
  font-weight: 800;
  outline: none;
  padding: 2px 7px;
  box-shadow:
    inset 0 0 8px rgba(79, 195, 255, 0.22),
    0 0 7px rgba(20, 151, 255, 0.35);
}

.bazaar-filter option {
  background: #06121b;
  color: #d9f5ff;
}

.bazaar-filter-actions {
  display: grid;
  gap: 7px;
  margin-top: auto;
}

.bazaar-filter-actions button,
.bazaar-randomize-button,
.bazaar-tabs button {
  height: 24px;
  border: 1px solid rgba(79, 195, 255, 0.82);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(2, 22, 34, 0.9), rgba(0, 4, 9, 0.96));
  color: #9be7ff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  text-transform: uppercase;
  box-shadow:
    inset 0 0 12px rgba(79, 195, 255, 0.12),
    0 0 8px rgba(20, 151, 255, 0.24);
}

.bazaar-randomize-button {
  margin-top: 8px;
  width: 100%;
}

.bazaar-results {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-width: 0;
  overflow: hidden;
}

.bazaar-table-head,
.bazaar-row {
  display: grid;
  grid-template-columns: 76px minmax(190px, 1.7fr) 70px minmax(120px, 0.9fr) 116px 72px;
  align-items: center;
}

.bazaar-table-head {
  min-height: 26px;
  border-bottom: 1px solid rgba(79, 195, 255, 0.68);
  background: linear-gradient(180deg, rgba(20, 88, 119, 0.68), rgba(4, 18, 29, 0.86));
}

.bazaar-table-head span {
  border-left: 1px solid rgba(79, 195, 255, 0.28);
  color: #bdefff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  padding: 0 8px;
  text-shadow: 0 0 6px rgba(79, 195, 255, 0.78);
}

.bazaar-list {
  min-height: 560px;
  overflow: hidden;
  padding: 0;
}

.bazaar-row {
  min-height: 56px;
  border-bottom: 1px solid rgba(20, 151, 255, 0.32);
  color: #29caff;
  font-size: 14px;
  font-weight: 900;
  list-style: none;
  padding: 4px 10px 4px 12px;
  text-shadow: 0 0 5px rgba(20, 151, 255, 0.56);
}

.bazaar-row:hover {
  background: rgba(79, 195, 255, 0.08);
}

.bazaar-item-icon {
  position: relative;
  width: 54px;
  height: 54px;
  border: 2px solid var(--rarity);
  border-radius: 7px;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.45), transparent 24%),
    linear-gradient(135deg, color-mix(in srgb, var(--rarity) 36%, #071018), #071018 68%);
  box-shadow:
    inset 0 0 10px rgba(255, 255, 255, 0.18),
    0 0 10px color-mix(in srgb, var(--rarity) 64%, transparent);
}

.bazaar-item-icon img {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  object-fit: cover;
}

.bazaar-item-icon span {
  position: absolute;
  bottom: 2px;
  right: 4px;
  color: #f8fdff;
  font-size: 14px;
  font-weight: 900;
  text-shadow: 0 1px 3px #000;
}

.bazaar-item-name {
  padding-right: 12px;
}

.bazaar-item-name strong {
  font-size: 16px;
  line-height: 1.1;
}

.bazaar-seller {
  color: #27bfff;
  font-size: 12px;
}

.bazaar-empty-row {
  display: grid;
  min-height: 560px;
  place-items: center;
  color: rgba(217, 245, 255, 0.78);
  font-size: 12px;
  font-weight: 900;
  list-style: none;
  text-transform: uppercase;
}

.bazaar-price {
  color: #54ff76;
  display: flex;
  align-items: center;
  gap: 5px;
}

.bazaar-price span {
  color: #54ff76;
}

.bazaar-credit-symbol {
  display: inline-block;
  font-family: 'Naboo AF Aurebesh', Arial, Helvetica, sans-serif;
  font-size: 17px;
  line-height: 1;
  transform: translateY(1px);
}

.bazaar-requisition-prefix {
  color: #54ff76;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
}

.bazaar-buy-button {
  display: inline-flex;
  width: 48px;
  height: 24px;
  align-items: center;
  justify-content: center;
  gap: 1px;
  border-radius: 7px;
  font-size: 11px;
  letter-spacing: 0;
  justify-self: center;
}

.bazaar-pagination {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-top: 1px solid rgba(79, 195, 255, 0.64);
  color: #29caff;
  font-size: 18px;
  font-weight: 900;
  text-shadow: 0 0 7px rgba(20, 151, 255, 0.74);
}

.bazaar-pagination button {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 5px;
  font-size: 20px;
}

.bazaar-pagination button:disabled {
  cursor: default;
  opacity: 0.38;
}

.bazaar-tabs {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 0;
  border-top: 1px solid rgba(79, 195, 255, 0.74);
  padding: 0 8px 6px;
}

.bazaar-tabs button {
  border-radius: 0 0 4px 4px;
}

.bazaar-tabs .bazaar-tab-active {
  background: linear-gradient(180deg, rgba(25, 168, 215, 0.7), rgba(4, 45, 65, 0.96));
  color: #06141b;
  text-shadow: 0 1px 0 rgba(155, 231, 255, 0.82);
}

.bazaar-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: rgba(0, 4, 8, 0.76);
  padding: 20px;
}

.bazaar-modal {
  width: min(720px, 100%);
  max-height: min(86vh, 820px);
  overflow-y: auto;
  border: 2px solid rgba(79, 195, 255, 0.86);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(79, 195, 255, 0.14), transparent 32%),
    linear-gradient(180deg, rgba(4, 28, 42, 0.98), rgba(0, 8, 14, 0.98));
  box-shadow:
    0 0 0 1px rgba(155, 231, 255, 0.5),
    0 20px 70px rgba(0, 0, 0, 0.62),
    0 0 28px rgba(20, 151, 255, 0.42),
    inset 0 0 28px rgba(79, 195, 255, 0.1);
}

.bazaar-modal-header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid rgba(79, 195, 255, 0.62);
  background: linear-gradient(180deg, rgba(20, 88, 119, 0.68), rgba(4, 18, 29, 0.86));
  padding: 14px 16px;
}

.bazaar-modal-header p {
  color: #ffc84b;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.bazaar-modal-header h2 {
  margin-top: 4px;
  color: #4fc3ff;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 32px;
  font-weight: 900;
  line-height: 1.1;
}

.bazaar-modal-header-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
}

.bazaar-modal-header button {
  display: inline-grid;
  min-width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(79, 195, 255, 0.84);
  background: rgba(1, 10, 18, 0.72);
  color: #9be7ff;
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
  padding: 0 9px;
  text-transform: uppercase;
}

.bazaar-modal-body {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 18px;
  padding: 16px;
}

.bazaar-modal-body > img {
  width: 132px;
  height: 132px;
  border: 2px solid rgba(79, 195, 255, 0.72);
  border-radius: 7px;
  object-fit: cover;
  box-shadow: 0 0 16px rgba(20, 151, 255, 0.28);
}

.bazaar-modal dl {
  display: grid;
  gap: 10px;
}

.bazaar-modal dl div {
  display: grid;
  gap: 3px;
  border-bottom: 1px solid rgba(79, 195, 255, 0.14);
  padding-bottom: 8px;
}

.bazaar-modal dt {
  color: #29caff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.bazaar-modal dd {
  color: rgba(217, 245, 255, 0.86);
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.bazaar-create-modal {
  width: min(860px, 100%);
}

.bazaar-create-form {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.bazaar-create-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bazaar-create-form label {
  display: grid;
  gap: 6px;
}

.bazaar-create-form label span,
.bazaar-store-fieldset legend {
  color: #29caff;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow: 0 0 7px rgba(79, 195, 255, 0.78);
}

.bazaar-create-form input,
.bazaar-create-form textarea {
  width: 100%;
  border: 1px solid rgba(79, 195, 255, 0.72);
  border-radius: 4px;
  background: linear-gradient(180deg, rgba(3, 23, 35, 0.94), rgba(0, 4, 8, 0.94));
  color: #d9f5ff;
  font: inherit;
  font-size: 14px;
  font-weight: 800;
  outline: none;
  padding: 9px 10px;
  box-shadow:
    inset 0 0 8px rgba(79, 195, 255, 0.16),
    0 0 7px rgba(20, 151, 255, 0.22);
}

.bazaar-create-form input[type='color'] {
  height: 39px;
  padding: 3px;
}

.bazaar-create-form textarea {
  line-height: 1.45;
  resize: vertical;
}

.bazaar-store-fieldset {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px 12px;
  border: 1px solid rgba(79, 195, 255, 0.28);
  border-radius: 4px;
  padding: 12px;
}

.bazaar-store-fieldset legend {
  padding: 0 6px;
}

.bazaar-store-fieldset label {
  display: flex;
  align-items: center;
  gap: 9px;
}

.bazaar-store-fieldset input {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.bazaar-create-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.bazaar-create-actions .bazaar-randomize-button {
  width: auto;
  min-width: 130px;
  margin-top: 0;
  padding: 0 14px;
}

.bazaar-loot-results {
  display: grid;
  gap: 8px;
  border-top: 1px solid rgba(79, 195, 255, 0.24);
  padding-top: 12px;
}

.bazaar-loot-row {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(79, 195, 255, 0.24);
  background: rgba(0, 8, 14, 0.42);
  padding: 8px;
}

.bazaar-loot-row img {
  width: 54px;
  height: 54px;
  border: 1px solid rgba(79, 195, 255, 0.58);
  border-radius: 5px;
  object-fit: cover;
}

.bazaar-loot-row h3 {
  font-size: 15px;
  font-weight: 900;
  line-height: 1.1;
}

.bazaar-loot-row p {
  margin-top: 3px;
  color: rgba(217, 245, 255, 0.72);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
}

.bazaar-loot-row > span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #54ff76;
  font-size: 14px;
  font-weight: 900;
  white-space: nowrap;
}

@media (max-width: 920px) {
  .bazaar-shell {
    grid-template-columns: 1fr;
  }

  .bazaar-filters {
    min-height: 0;
  }

  .bazaar-table-head {
    display: none;
  }

  .bazaar-row {
    grid-template-columns: 64px minmax(0, 1fr) 72px 58px;
    gap: 4px 10px;
    padding: 8px 10px;
  }

  .bazaar-row > div:nth-child(4) {
    display: none;
  }

  .bazaar-price {
    justify-content: end;
  }

  .bazaar-buy-button {
    grid-column: 4;
    grid-row: 1 / span 2;
  }

  .bazaar-tabs {
    grid-template-columns: 1fr;
  }

  .bazaar-modal-body {
    grid-template-columns: 1fr;
  }

  .bazaar-modal-body > img {
    width: 96px;
    height: 96px;
  }

  .bazaar-create-grid,
  .bazaar-store-fieldset {
    grid-template-columns: 1fr;
  }

  .bazaar-loot-row {
    grid-template-columns: 54px minmax(0, 1fr);
  }

  .bazaar-loot-row > span {
    grid-column: 2;
  }
}
</style>




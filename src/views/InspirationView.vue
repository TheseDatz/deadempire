<script setup>
import { computed, ref } from 'vue'

const moodTabs = [
  {
    id: 'videos',
    label: 'Videos',
    eyebrow: 'Visual Tone',
    items: [
      { title: 'The Empire After The Fire', note: 'A reference for old power trying to survive its own collapse.', videoId: 'YdgmH9Vv2-I' },
      { title: 'Scoundrels On The Edge', note: 'Useful for characters who live by charm, nerve, and bad timing.', videoId: 'vVkUglhoon0' },
      { title: 'The Cost Of Orders', note: 'Good touchstone material for duty, guilt, loyalty, and regret.', videoId: '2Pc6wQwrYJM' },
      { title: 'Outer Rim Pressure', note: 'A mood reference for desperate ports, local bosses, and thin margins.', videoId: 'LbpDxrew4A0' },
      { title: 'Hope In Bad Places', note: 'For the moments when decency survives under grime and fear.', videoId: 'VTF314pggJU' },
      { title: 'Trouble Finds The Crew', note: 'A spark for chases, sudden jobs, and plans that fail loudly.', videoId: 'jwHtU4Zbzu0' },
    ],
  },
  {
    id: 'images',
    label: 'Images',
    eyebrow: 'Moodboard',
    items: [
      { title: 'Image Placeholder 1', placeholder: true },
      { title: 'Image Placeholder 2', placeholder: true },
      { title: 'Image Placeholder 3', placeholder: true },
      { title: 'Image Placeholder 4', placeholder: true },
      { title: 'Image Placeholder 5', placeholder: true },
      { title: 'Image Placeholder 6', placeholder: true },
    ],
  },
  {
    id: 'music',
    label: 'Music',
    eyebrow: 'Table Sound',
    items: [
      { title: 'Music Reference 1', videoId: 'DZHshyzeoK0' },
      { title: 'Music Reference 2', videoId: '6uMNnZtIS6s' },
      { title: 'Music Reference 3', videoId: '7wMiMDBHnJ0' },
      { title: 'Music Reference 4', videoId: 'f9D8gHY2OPE' },
      { title: 'Music Reference 5', videoId: 'MQ_oZYHySKk' },
      { title: 'Music Reference 6', videoId: 'ZZ9Ecb0skIE' },
    ],
  },
]

const activeMoodTab = ref(moodTabs[0].id)
const activeMood = computed(() => moodTabs.find((tab) => tab.id === activeMoodTab.value) ?? moodTabs[0])

const types = [
  'Dashing smuggler', 'Disgraced officer', 'Debt-bound slicer', 'Exiled noble', 'Streetwise mechanic',
  'Retired scout', 'Corporate defector', 'Burned spy', 'Cantina performer', 'Black-market medic',
  'Idealistic deserter', 'Haunted bodyguard', 'Temple scavenger', 'Fugitive customs agent', 'Dockside bruiser',
  'Salvage captain', 'Reluctant bounty hunter', 'Shady quartermaster', 'Gambler with a code', 'Failed revolutionary',
  'Mandalorian foundling', 'Outer Rim preacher', 'Information broker', 'Prison escapee', 'Clone Wars veteran',
  'HoloNet forger', 'Spice runner', 'Wayward scholar', 'Sabacc cheat', 'Underworld courier',
  'Former inquisitorial aide', 'Shipyard saboteur', 'Disowned heir', 'Mercenary pilot', 'Junk dealer mystic',
  'Local resistance fixer', 'Imperial war orphan', 'Guild negotiator', 'Asteroid miner', 'Rogue protocol expert',
  'Frontier marshal', 'Separatist holdout', 'Wounded ace', 'Crime family accountant', 'Refugee organizer',
  'Disillusioned stormtrooper', 'Droid-rights agitator', 'Relic hunter', 'Failed holostar', 'Quiet assassin',
]

const species = [
  'Human', 'Twi\'lek', 'Rodian', 'Bothan', 'Mon Calamari', 'Quarren', 'Sullustan', 'Duros', 'Zabrak', 'Togruta',
  'Nautolan', 'Mirialan', 'Chiss', 'Pantoran', 'Mandalorian Human', 'Corellian Human', 'Wookiee', 'Trandoshan',
  'Weequay', 'Nikto', 'Devaronian', 'Ithorian', 'Gran', 'Aqualish', 'Bith', 'Kel Dor', 'Gotal', 'Gungan',
  'Toydarian', 'Neimoidian', 'Kaminoan', 'Geonosian', 'Ewok', 'Jawa', 'Tusken Raider', 'Hutt', 'Besalisk',
  'Lasat', 'Pau\'an', 'Utai', 'Kaleesh', 'Kiffar', 'Clawdite', 'Falleen', 'Selkath', 'Ryn', 'Shistavanen',
  'Muun', 'Sakiyan', 'Dathomirian',
]

const homeWorlds = [
  'Mandalore', 'Coruscant', 'Corellia', 'Alderaan', 'Chandrilla', 'Kuat', 'Fondor', 'Brentaal IV', 'Anaxes',
  'Taris', 'Nar Shaddaa', 'Nal Hutta', 'Tatooine', 'Jakku', 'Lothal', 'Ryloth', 'Rodia', 'Bothawui',
  'Mon Cala', 'Dac', 'Sullust', 'Duro', 'Iridonia', 'Shili', 'Glee Anselm', 'Mirial', 'Csilla', 'Pantora',
  'Kashyyyk', 'Trandosha', 'Kessel', 'Ord Mantell', 'Bespin', 'Mimban', 'Jedha', 'Dathomir', 'Serenno',
  'Muunilinst', 'Cato Neimoidia', 'Geonosis', 'Kamino', 'Endor', 'Yavin 4', 'Hoth', 'Mustafar', 'Lothal',
  'Vardos', 'Scarif', 'Saleucami', 'Felucia', 'Onderon',
]

const premises = [
  'Fleeing from his debts', 'Looking for someone', 'Trying to clear a family name', 'Hiding an Imperial past',
  'Carrying stolen data', 'Owing a favor to the wrong syndicate', 'Protecting a younger sibling',
  'Searching for a vanished mentor', 'Running from a court-martial', 'Trying to buy passage home',
  'Hunting the person who framed them', 'Keeping a forbidden relic secret', 'Escorting a dangerous witness',
  'Selling information to survive', 'Trying to recover a lost ship', 'Following a half-true prophecy',
  'Seeking revenge on a corrupt moff', 'Paying off a medical debt', 'Trying to disappear after Endor',
  'Looking for proof of a massacre', 'Smuggling refugees through Imperial space', 'Trying to rescue a prisoner',
  'Blackmailed into one last job', 'Keeping their crew from starving', 'Searching for a stolen droid',
  'Haunted by orders they followed', 'Chasing a rumor about buried credits', 'Trying to defect without dying',
  'Guarding a map they cannot read', 'Seeking pardon from the New Republic', 'Trying to sabotage a warlord',
  'Carrying a message from a dead friend', 'Looking for a buyer for cursed cargo', 'Hiding from bounty hunters',
  'Trying to free their home port', 'Seeking the truth about a clone wars battle', 'Protecting a secret child',
  'Trying to steal back their identity', 'Following a signal from unknown space', 'Avoiding an arranged marriage',
  'Trying to repay a life debt', 'Searching for a missing squadmate', 'Keeping a mutiny from starting',
  'Chasing a legendary hyperspace route', 'Trying to expose an ISB cell', 'Escaping a crime family',
  'Trying to rebuild a ruined reputation', 'Looking for a safe place to believe in something',
  'Selling one lie while hiding a worse truth', 'Trying to make one decent choice before it is too late',
]

const randomItem = (items) => items[Math.floor(Math.random() * items.length)]

const spark = ref({
  type: randomItem(types),
  species: randomItem(species),
  homeWorld: randomItem(homeWorlds),
  premise: randomItem(premises),
})

function randomizeSpark() {
  spark.value = {
    type: randomItem(types),
    species: randomItem(species),
    homeWorld: randomItem(homeWorlds),
    premise: randomItem(premises),
  }
}
</script>

<template>
  <main class="inspiration-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto grid max-w-6xl gap-8">
      <header class="inspiration-hero">
        <p>Player Resources</p>
        <h1>Inspiration</h1>
        <span>Images, sounds, and character sparks for a frayed galaxy where survival still leaves room for hope.</span>
      </header>

      <section class="inspiration-panel">
        <div class="inspiration-section-heading">
          <div>
            <p>{{ activeMood.eyebrow }}</p>
            <h2>Mood Board</h2>
          </div>

          <div class="inspiration-tabs" aria-label="Mood board tabs">
            <button
              v-for="tab in moodTabs"
              :key="tab.id"
              type="button"
              :class="{ 'inspiration-tab-active': activeMoodTab === tab.id }"
              @click="activeMoodTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div class="mood-grid">
          <article v-for="item in activeMood.items" :key="item.title" class="mood-card">
            <div v-if="item.videoId" class="mood-video">
              <iframe
                :src="`https://www.youtube-nocookie.com/embed/${item.videoId}`"
                :title="item.title"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              />
            </div>
            <div v-else-if="item.placeholder" class="mood-placeholder" aria-hidden="true" />
            <img v-else :src="item.image" :alt="item.title" loading="lazy" />
            <div v-if="activeMood.id !== 'videos' && activeMood.id !== 'music' && activeMood.id !== 'images'">
              <h3>{{ item.title }}</h3>
              <p>{{ item.note }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="inspiration-panel spark-panel">
        <div class="inspiration-section-heading">
          <div>
            <p>Concept Engine</p>
            <h2>Character Spark</h2>
          </div>
          <button class="spark-random-button" type="button" @click="randomizeSpark">Randomize</button>
        </div>

        <div class="spark-grid">
          <article>
            <span>Type</span>
            <strong>{{ spark.type }}</strong>
          </article>
          <article>
            <span>Species</span>
            <strong>{{ spark.species }}</strong>
          </article>
          <article>
            <span>Home World</span>
            <strong>{{ spark.homeWorld }}</strong>
          </article>
          <article>
            <span>Premise</span>
            <strong>{{ spark.premise }}</strong>
          </article>
        </div>
      </section>

      <section class="inspiration-panel setting-panel">
        <div class="inspiration-section-heading">
          <div>
            <p>Campaign Frame</p>
            <h2>Dead Empire</h2>
          </div>
        </div>

        <div class="setting-grid">
          <article>
            <h3>The Shape Of Play</h3>
            <p>
              This campaign follows people who are not clean heroes. They have debts, uniforms, warrants,
              old loyalties, and reasons to keep moving. The galaxy is still recognizably Star Wars:
              fast ships, dangerous cantinas, impossible odds, and choices that matter.
            </p>
          </article>
          <article>
            <h3>The Mood</h3>
            <p>
              The tone can turn grim, especially around the wreckage of the Empire and the people trapped
              inside it, but it should never become empty. Even in interrogation rooms, ruined ports, and
              doomed missions, there is still loyalty, humor, mercy, and the stubborn possibility of light.
            </p>
          </article>
          <article>
            <h3>Useful Character Questions</h3>
            <p>
              Who do you owe? What did you do during the war? Who would call you a coward, a criminal, or
              a friend? What is the one line you are still trying not to cross?
            </p>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

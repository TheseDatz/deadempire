<script setup>
import { computed, ref } from 'vue'

const timelineEvents = [
  {
    year: '19 BBY',
    title: 'Creation of the Empire',
    body:
      'The Galactic Republic is reorganized into the Galactic Empire. The great Jedi Purge begins, and more power is vested in the Emperor. The new order officially begins.',
  },
  {
    year: '2 BBY',
    title: 'Rebel Alliance Formed',
    body:
      'Mon Mothma and scattered rebel cells begin organizing into a larger movement, turning isolated resistance into the first true shape of the Rebel Alliance.',
  },
  {
    year: '0 BBY',
    title: 'Destruction of Alderaan',
    body:
      'The Death Star destroys Alderaan, marking the Empire\'s brutality immediately before the Battle of Yavin and hardening rebel resolve across the galaxy.',
  },
  {
    year: '0 ABY',
    title: 'Battle of Yavin',
    body:
      'The Rebel Alliance destroys the first Death Star above Yavin, proving the Empire can bleed and giving scattered resistance cells a symbol powerful enough to rally behind.',
  },
  {
    year: '3 ABY',
    title: 'Battle of Hoth',
    body:
      'The Rebel Alliance is driven from Echo Base and scattered across the stars, a reminder that the victory at Endor did not come from a position of strength.',
  },
  {
    year: '4 ABY',
    title: 'Battle of Endor',
    body:
      'The second Death Star is destroyed, Emperor Palpatine is killed, and Darth Vader dies aboard the station. The victory breaks the illusion of Imperial invincibility.',
  },
  {
    year: '4 ABY',
    title: 'Operation Cinder Orders',
    body:
      'Loyalists to Palpatine are approached by Sentinel contingency droids and given orders to commence Operation Cinder.',
  },
  {
    year: '4 ABY',
    title: 'The Withered Whisper Refuses',
    body:
      'Lord Fel has the Sentinel droid sent to The Withered Whisper destroyed, re-affirming the crew\'s loyalty to Vader rather than Palpatine. He addresses the crew and blames the Emperor\'s weakness for the disastrous events of the last few weeks.',
  },
  {
    year: '4 ABY',
    title: 'Gallius Rax Becomes Regent',
    body:
      'Fleet Admiral Gallius Rax becomes temporary Regent of the Empire and begins consolidating authority around Palpatine\'s final contingency.',
  },
  {
    year: '4 ABY',
    title: 'Operation Cinder Begins',
    body:
      'Gallius Rax begins implementing Operation Cinder, ordering the destruction of Vardos, a loyalist planet.',
  },
  {
    year: '4 ABY',
    title: 'Battle of Vardos',
    body:
      'The ISB and concerned Naval officers led by Grand Admiral Sloane undermine Rax\'s authority, launching a massive battle above Vardos that ends with the deaths of both Sloane and Rax.',
  },
  {
    year: '4 ABY',
    title: 'Mas Amedda Named Regent',
    body:
      'The ISB names Grand Vizier Mas Amedda as the new Regent of the Empire.',
  },
  {
    year: '5 ABY',
    title: 'Uprising on Chandrilla',
    body:
      'The core fleet is weakened after the Battle of Vardos, allowing the Rebel Alliance and defecting planetary defense forces around Chandrilla to claim a large section of the Core Worlds.',
  },
  {
    year: '5 ABY',
    title: 'Prakith Declares Its Neutrality',
    body:
      'Former Imperial Moff Foga Brill fortifies Prakith and declares the world neutral in the continuing war. Several nearby Deep Core governors join him, preferring isolation to destruction or submission to the ISB. Brill pledges to rejoin the galaxy once the civil war ends, but his defiance makes the ISB look weak and inspires more systems to consider independence.',
  },
  {
    year: '5 ABY',
    title: 'Formation of the New Republic',
    body:
      'Rebel leaders gather around Chandrilla and attempt to transform their military alliance into a government. The declaration is bold, but legitimacy still has to be won system by system.',
  },
  {
    year: '5 ABY',
    title: 'Beginning of the Campaign',
    body:
      'The Withered Whisper waits at the edge of known space while the Empire fractures and the New Republic searches for enemies to bring to trial. Lord Fel has called the crew to the bridge.',
  },
]

const timelineYears = [...new Set(timelineEvents.map((event) => event.year))]
const selectedTimelineYear = ref(timelineYears[timelineYears.length - 1])
const selectedTimelineEvents = computed(() =>
  timelineEvents.filter((event) => event.year === selectedTimelineYear.value),
)
</script>

<template>
  <main class="primer-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="primer-crawl-section mx-auto max-w-5xl">
      <div class="primer-gold-divider" aria-hidden="true" />

      <div class="primer-crawl-viewport">
        <div class="primer-crawl">
          <p>
            The Emperor is Dead.
          </p>
          <p>
            More than ten million Imperials have lost their lives. Across the galaxy traitors rejoice and
            declare a NEW REPUBLIC centered on CHANDRILLA.
          </p>
          <p>
            Merely months since the battle of ENDOR, the galaxy has turned to chaos. The remnants of the
            EMPIRE splinter and crack with Moffs, Governors, and Admirals all vying for power. Every
            choice carries weight. Alliances will be tested, old secrets will surface, and the fate of the
            galaxy will be written in BLOOD.
          </p>
        </div>
      </div>

      <div class="primer-gold-divider primer-gold-divider-lower" aria-hidden="true" />

      <section class="reference-card reference-card-alert">
        <h3>Getting Started</h3>
        <p>
          This primer gathers the campaign context you need before stepping into Dead Empire:
          the state of the <RouterLink to="/map">galaxy</RouterLink>, the
          <RouterLink to="/Factions">factions</RouterLink> moving in the aftermath, and the
          immediate pressure surrounding your character's first choices.
        </p>
      </section>

      <section class="reference-card reference-card-alert">
        <h3>The Galaxy at Large</h3>
        <p>
          The <RouterLink to="/map">galaxy</RouterLink> is no longer ruled by a single steady hand.
          <RouterLink to="/Planets">Coruscant</RouterLink> remains trapped beneath
          <RouterLink to="/Factions">Imperial</RouterLink> control, where the
          <RouterLink to="/Factions">Imperial Security Bureau</RouterLink> props up Grand Vizier Mas
          Amedda attempting to rally the remaining loyalists. The Navy has grown restless and is rife
          with disloyalty. Assassinations, false arrests, and coups are quickly spreading through the
          ranks of the <RouterLink to="/Factions">Empire</RouterLink>. Beyond the capital, entire
          sectors have decided to declare independence.
        </p>
        <p>
          The <RouterLink to="/Factions">New Republic</RouterLink> is still more declaration than
          certainty, rallying around <RouterLink to="/Planets">Chandrilla</RouterLink> while trying
          to turn scattered rebel victories into legitimate government. Most of the Republic forces
          are scattered across the outer rim, with a large but dated fleet protecting
          <RouterLink to="/Planets">Chandrilla</RouterLink>. Between these powers lie frightened
          worlds, ambitious warlords, criminal syndicates, corporate holdouts, and local militias all
          trying to shape the next order before someone else shapes it for them.
        </p>
      </section>

      <section class="reference-card reference-card-alert">
        <h3>The Withered Whisper</h3>
        <p>
          At the edges of known space lingers a single Imperial II Star Destroyer, The Withered
          Whisper. Nearly 40,000 men and women call the vessel their home. The crew has been chosen
          specifically for their loyalty to the deceased Lord Vader and his chosen agents, the
          inquisitors. Two such men now command the vessel. The Third Brother, now known to you as
          Lord Galen Fel, and his ever loyal servant The Sixteenth Brother, the Dathomirian Riot Ooldos.
        </p>
        <p>
          The Withered Whisper has not yet chosen to make itself known to the rest of the
          <RouterLink to="/Factions">Empire</RouterLink>, choosing to watch silently while the Moffs
          and Governors kill one another. One thing is clear though, if The Withered Whisper falls
          into the hands of the <RouterLink to="/Factions">New Republic</RouterLink> all aboard are
          to be tried as war criminals.
        </p>
        <p>
          Whatever your origins, all of you place your trust in Lord Fel to deliver you from this
          precarious situation. The question is, will that trust last?
        </p>
      </section>

      <section class="reference-card reference-card-alert">
        <h3>Call To Adventure</h3>
        <p>
          All of you, crew members of The Withered Whisper, have been called to muster on the
          starship's bridge. Fresh orders are expected from Lord Fel himself.
        </p>
        <p>
          The time for waiting has passed. Soon, The Withered Whisper must reveal itself and rejoin
          the <RouterLink to="/map">galaxy</RouterLink>.
        </p>
      </section>

      <div class="primer-gold-divider" aria-hidden="true" />

      <section class="primer-timeline">
        <div class="rules-section-heading">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Campaign Record</p>
            <h2>Timeline</h2>
          </div>
        </div>

        <div class="primer-timeline-years" aria-label="Timeline years">
          <button
            v-for="year in timelineYears"
            :key="year"
            type="button"
            :class="{ 'primer-timeline-year-active': selectedTimelineYear === year }"
            @click="selectedTimelineYear = year"
          >
            {{ year }}
          </button>
        </div>

        <div class="primer-timeline-events">
          <article
            v-for="event in selectedTimelineEvents"
            :key="`${event.year}-${event.title}`"
            class="reference-card reference-card-alert"
          >
            <p class="primer-timeline-year-label">{{ event.year }}</p>
            <h3>{{ event.title }}</h3>
            <p>{{ event.body }}</p>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

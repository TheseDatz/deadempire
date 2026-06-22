<script setup>
defineProps({
  combatant: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['delete', 'set-side'])
</script>

<template>
  <article class="combatant-row" :class="`combatant-row-${combatant.side}`">
    <label class="combat-field combat-turn-order">
      <span>Order</span>
      <input v-model.number="combatant.turnOrder" type="number" min="1" />
    </label>

    <label class="combat-field combat-name">
      <span>Name</span>
      <input v-model="combatant.name" />
    </label>

    <label class="combat-field combat-strength">
      <span>Strength</span>
      <input v-model="combatant.strength" />
    </label>

    <label class="combat-field combat-temp-difficulty">
      <span>Temp. Diff.</span>
      <input v-model="combatant.tempDifficulty" />
    </label>

    <label class="combat-field combat-actions">
      <span>Actions</span>
      <input v-model.number="combatant.actions" type="number" min="0" />
    </label>

    <label class="combat-field combat-health">
      <span>Health</span>
      <select v-model="combatant.health">
        <option>Healthy</option>
        <option>Stunned</option>
        <option>Wounded</option>
        <option>Incapacitated</option>
        <option>Mortally Wounded</option>
      </select>
    </label>

    <label class="combat-prone-toggle">
      <input v-model="combatant.knockedProne" type="checkbox" />
      <span>Knocked Prone</span>
    </label>

    <div class="combat-side-buttons" aria-label="Side color">
      <button type="button" class="combat-side-red" aria-label="Set side red" @click="emit('set-side', 'red')"></button>
      <button
        type="button"
        class="combat-side-yellow"
        aria-label="Set side yellow"
        @click="emit('set-side', 'yellow')"
      ></button>
      <button type="button" class="combat-side-blue" aria-label="Set side blue" @click="emit('set-side', 'blue')"></button>
      <button
        type="button"
        class="combat-side-green"
        aria-label="Set side green"
        @click="emit('set-side', 'green')"
      ></button>
    </div>

    <button class="combat-delete-button" type="button" aria-label="Delete combatant" @click="emit('delete')">Delete</button>
  </article>
</template>

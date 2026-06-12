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

    <label class="combat-field">
      <span>Strength</span>
      <input v-model="combatant.strength" />
    </label>

    <label class="combat-field">
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

    <div class="combat-side-buttons" aria-label="Side color">
      <button type="button" class="combat-side-red" @click="emit('set-side', 'red')">Red</button>
      <button type="button" class="combat-side-yellow" @click="emit('set-side', 'yellow')">Yellow</button>
      <button type="button" class="combat-side-blue" @click="emit('set-side', 'blue')">Blue</button>
    </div>

    <button class="combat-delete-button" type="button" @click="emit('delete')">Delete</button>
  </article>
</template>

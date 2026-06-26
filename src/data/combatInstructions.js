export const combatInstructions = [
  {
    step: 'Step 1',
    title: 'Set the Round',
    details:
      'A round is the official five-second slice of action. Track the current combat round with Turn, and track the current action pass with Cur. Action.',
  },
  {
    step: 'Step 2',
    title: 'Set Sides and Initiative',
    details:
      'Decide which sides are in the fight. The highest-Perception character on each side rolls Perception. The winning side chooses whether to act first or last this round.',
  },
  {
    step: 'Step 3',
    title: 'Declare First Actions',
    details:
      'Starting with the first side, characters act from highest Perception to lowest. Each character declares how many total actions they will take this round before rolling their first action.',
  },
  {
    step: 'Step 4',
    title: 'Apply Multiple-Action Costs',
    details:
      'Drawing, reloading, attacking, dodging, parrying, switching modes, and similar choices each count as actions. For each action beyond the first, subtract -1D from all skill and attribute rolls that round except damage, resistance, and initiative.',
  },
  {
    step: 'Step 5',
    title: 'Resolve Surprise',
    details:
      'If one side is surprised, the attackers take their first action before the surprised side can dodge or parry. After that, continue with normal side order and Perception order.',
  },
  {
    step: 'Step 6',
    title: 'Set Attack Difficulty',
    details:
      'For ranged attacks, use range bands: point-blank is Very Easy, short is Easy, medium is Moderate, and long is Difficult. For melee, use the weapon difficulty. Brawling is usually Very Easy.',
  },
  {
    step: 'Step 7',
    title: 'Handle Reactions',
    details:
      'Targets may dodge, parry, or make a full reaction when attacked. A normal reaction becomes the new attack difficulty for that attack type for the rest of the round. A full reaction adds the roll to the attack difficulty.',
  },
  {
    step: 'Step 8',
    title: 'Roll the Attack',
    details:
      'Roll the relevant skill or default attribute. Add fire control if the weapon has it. If the roll meets or beats the final difficulty, the attack hits.',
  },
  {
    step: 'Step 9',
    title: 'Resolve Cover and Blasts',
    details:
      'Apply visibility and cover modifiers before the attack roll. If a shot misses only because of cover, roll damage against the cover and pass reduced damage through if it breaks. For grenades, place the blast or roll deviation on a miss.',
  },
  {
    step: 'Step 10',
    title: 'Roll Damage',
    details:
      'Roll weapon damage against the target Strength plus armor. Compare the difference on the damage chart and update health, penalties, armor damage, or weapon damage as needed.',
  },
  {
    step: 'Step 11',
    title: 'Advance Action Passes',
    details:
      'When every combatant with a first action has acted, set Cur. Action to 2 and repeat for second actions. Skip characters with no action left. Continue until all declared actions are resolved.',
  },
  {
    step: 'Step 12',
    title: 'End the Round',
    details:
      'Apply stun and wound effects, mark ammo or fire-rate limits, clear reactions that only lasted this round, reset Cur. Action to 1, advance Turn, and roll initiative again if needed.',
  },
]

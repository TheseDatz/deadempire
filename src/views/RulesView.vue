<script setup>
import { computed, ref } from 'vue'
import ReferenceList from '../components/ReferenceList.vue'
import { combatReferences } from '../data/combatReferences'

const searchTerm = ref('')
const activeReference = ref('getting-started')
const referenceTabs = ref(null)

const scrollReferenceTabs = (event) => {
  if (!referenceTabs.value) {
    return
  }

  const scrollAmount = event.deltaX || event.deltaY
  referenceTabs.value.scrollLeft += scrollAmount
}

const resources = [
  { label: 'D6 Holocron', href: 'http://d6holocron.com/' },
  { label: 'Rancor Pit', href: 'https://www.rancorpit.com/' },
  { label: '', href: '' },
  { label: '', href: '' },
  { label: '', href: '' },
  { label: '', href: '' },
]

const referenceSections = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'player-handout', label: 'Player Handout' },
  { id: 'basics', label: 'Basics' },
  { id: 'force-points', label: 'Force & Points' },
  { id: 'character-advancement', label: 'Character Advancement' },
  { id: 'combat', label: 'Combat' },
  { id: 'droids', label: 'Droids' },
  { id: 'starships', label: 'Starships' },
  { id: 'space-combat', label: 'Space Combat' },
  { id: 'gamemaster', label: 'Gamemaster' },
]

const basicsDifficultyRows = [
  ['Very Easy', '1-5'],
  ['Easy', '6-10'],
  ['Moderate', '11-15'],
  ['Difficult', '16-20'],
  ['Very Difficult', '21-30'],
  ['Heroic', '30+'],
]

const basicsModifierRows = [
  ['+1-5', 'Slight'],
  ['+6-10', 'Good'],
  ['+11-15', 'Decisive'],
  ['+16+', 'Overpowered'],
]

const gettingStartedSteps = [
  {
    number: '1',
    title: 'Read the Primer page',
    optional: false,
    id: 'primer',
  },
  {
    number: '1.1',
    title: 'Visit the Information page',
    optional: true,
    id: 'information',
  },
  {
    number: '2',
    title: 'Review the other reference tabs',
    optional: false,
    id: 'references',
  },
  {
    number: '3',
    title: 'Familiarize yourself with the dice system',
    optional: false,
    id: 'dice',
  },
  {
    number: '4',
    title: 'Check out the Combat Tool',
    optional: false,
    id: 'combat-tool',
  },
  {
    number: '5',
    title: 'Log in',
    optional: false,
    id: 'login',
  },
  {
    number: '6',
    title: 'Create a character',
    optional: false,
    id: 'character',
  },
]

const playerHandoutReferences = [
  {
    title: 'What You Are Doing',
    summary:
      'You play a character living in the Star Wars galaxy. The gamemaster describes the situation, you decide what your character tries to do, and the dice help determine what happens next.',
    bullets: [
      'No board required: The game happens through conversation, imagination, character choices, and dice rolls.',
      'The gamemaster: The GM acts as storyteller and referee, presenting scenes, calling for rolls, and describing the results.',
      'Your job: Think like your character, say what they do, and help create a memorable story with the rest of the table.',
    ],
  },
  {
    title: 'Table Goals',
    summary:
      'The point is not to beat the other players or build the mathematically best character. The point is to make a fun Star Wars story together.',
    bullets: [
      'Cooperate: The characters usually have a better chance when the players work together.',
      'Play boldly: Be heroic, dramatic, funny, desperate, clever, or messy when the scene calls for it.',
      'Keep things moving: Do not freeze up over rules. Describe your intent, and the gamemaster will tell you what to roll.',
    ],
  },
  {
    title: 'Additional Rules for This Campaign',
    alert: true,
    summaryAlert: true,
    summary:
      'Important table disclaimer: characters in Dead Empire may not be traditional good-guy protagonists, but players are still expected to be kind, respectful, and cooperative with each other outside of roleplay. In character, the party should still be able to work together.',
    bullets: [
      'Playing an evil character: Evil does not mean acting like a murder hobo or a psychopath. Your character can be ruthless, selfish, ambitious, or morally compromised without derailing the table or making the game miserable for other players.',
      'Party cooperation: Conflict, tension, and distrust can be interesting in roleplay, but they should support the story rather than break the group.',
      'Player responsibility: If a character choice would make the game worse for everyone else, choose a different angle or check with the gamemaster first.',
    ],
    sections: [
      {
        title: 'Dark Side Points',
        body:
          'Dark Side Points in this campaign do not follow the standard REUP rules. Instead, the gamemaster uses them to create complications, give enemies advantages, and generally keep things more interesting. This avoids punishing characters simply for acting immorally.',
      },
      {
        title: 'Lines & Veils',
        body:
          'Players are expected to abide by our shared lines and veils. Lines are content boundaries that do not appear in the game. Veils are subjects that may exist in the story, but are handled off-screen, briefly, or without explicit detail.',
        table: {
          columns: ['Lines', 'Veils'],
          items: {
            Lines: [],
            Veils: [],
          },
        },
      },
    ],
  },
  {
    title: 'Character Basics',
    summary:
      'Your character sheet tells you who your character is, what they are good at, and what resources they can call on during play.',
    bullets: [
      'Background and personality: These details help you make choices in character. You can usually adjust them with gamemaster approval.',
      'Attributes: Every character has Dexterity, Knowledge, Mechanical, Perception, Strength, and Technical.',
      'Equipment and points: Characters also track gear, Move, Character Points, Force Points, and possibly Dark Side Points.',
    ],
  },
  {
    title: 'The Six Attributes',
    summary:
      'Attributes are broad areas of natural ability. If you do not have a specific skill for a task, you usually roll the related attribute instead.',
    bullets: [
      'Dexterity: Agility, hand-eye coordination, shooting, dodging, and many physical combat actions.',
      'Knowledge: What your character knows about cultures, languages, worlds, survival, and the wider galaxy.',
      'Mechanical: Piloting, driving, operating vehicles, plotting hyperspace routes, and firing vehicle or starship weapons.',
      'Perception: Awareness, social instincts, searching, sneaking, bargaining, conning, and reading a situation.',
      'Strength: Physical power, toughness, brawling, climbing, jumping, stamina, and resisting damage.',
      'Technical: Repairing, modifying, programming, fixing droids, treating injuries, and working with technology.',
    ],
  },
  {
    title: 'Dice Codes',
    summary:
      'Abilities are written as die codes such as 2D, 3D, or 4D+2. The number before D tells you how many six-sided dice to roll; any plus value is added to the total.',
    bullets: [
      'Example: 3D means roll three six-sided dice and add them together.',
      'Example: 3D+2 means roll three dice, add them together, then add 2 more.',
      'General feel: 2D is ordinary, 3D is capable, and 4D is notably strong for many starting characters.',
    ],
  },
  {
    title: 'Skills',
    summary:
      'Skills are focused things your character has learned. Each skill sits under an attribute and starts from that attribute value unless you improve it.',
    bullets: [
      'Skill dice: During character creation, you spend extra dice on the skills you want your character to be better at.',
      'Useful examples: Blaster, dodge, melee combat, streetwise, survival, astrogation, starfighter piloting, bargain, con, sneak, brawling, first aid, and repair skills all come up often.',
      'Ask when unsure: If you do not know which skill applies, describe what you want to do and the gamemaster will choose the roll.',
    ],
  },
  {
    title: 'How Rolls Work',
    summary:
      'When an action has uncertainty or danger, the gamemaster asks for a roll. Roll the skill if you have it; otherwise roll the related attribute.',
    bullets: [
      'Difficulty rolls: If your total equals or beats the difficulty number, you succeed. If it is lower, you fail or succeed with trouble at the GM direction.',
      'Opposed rolls: When another character directly resists you, both sides roll and the higher total usually wins.',
      'Describe intent first: The dice resolve the action, but what you say you are trying to accomplish matters.',
    ],
  },
  {
    title: 'Rounds and Multiple Actions',
    summary:
      'Fast scenes are divided into rounds of roughly five seconds. A character can do one main action cleanly, or attempt more actions with penalties.',
    bullets: [
      'One action: Roll the normal skill or attribute die code.',
      'Two actions: Subtract 1D from every action that round.',
      'Three actions: Subtract 2D from every action that round, and continue increasing the penalty by 1D for each extra action.',
      'Practical advice: Extra actions are powerful, but they make every roll less reliable.',
    ],
  },
  {
    title: 'The Wild Die',
    summary:
      'One die in every attribute or skill roll is the Wild Die. It can create big heroic moments, unlucky complications, or strange turns in the scene.',
    bullets: [
      'On 2-5: Add the Wild Die normally.',
      'On 6: Add it, roll it again, and keep adding as long as it keeps coming up 6.',
      'On 1: Tell the gamemaster. They may count it normally, remove it and your highest die, or introduce a complication.',
    ],
  },
  {
    title: 'Character Points, Force Points, and the Dark Side',
    summary:
      'Special points let characters push harder in important moments, but they are limited resources and sometimes carry story consequences.',
    bullets: [
      'Character Points: Spend one after a roll but before the result is announced to add one extra die. They are also used for advancement between adventures.',
      'Force Points: Declare before rolling to double your dice for the round. You cannot spend Character Points in the same round.',
      'Dark Side Points: In REUP as written, enough Dark Side Points can cause a character to fall to the dark side and leave player control. Dead Empire uses its own campaign-specific rules for this.',
    ],
  },
]

const basicsReferences = [
  {
    title: 'Core Rule',
    summary:
      'When your character attempts something risky, uncertain, opposed, or dramatic, the gamemaster calls for a roll. Roll the relevant skill, or the related attribute if you do not have that skill.',
    bullets: [
      'Meet or beat: If your total is equal to or higher than the difficulty, the action succeeds.',
      'Below the difficulty: If your total is lower, the action fails or succeeds with a cost, depending on the situation and the gamemaster ruling.',
      'Say your intent: Describe what you want to accomplish before the dice hit the table.',
    ],
  },
  {
    title: 'Die Codes',
    summary:
      'Stats are written as die codes such as 3D or 4D+2. The number before D is how many six-sided dice you roll, and any +1 or +2 is added to the final total.',
    bullets: [
      'Example: 3D means roll three dice and add them together.',
      'Example: 3D+2 means roll three dice, add them together, then add 2.',
      'Skills start from attributes: A skill usually begins at the same value as the attribute it belongs to, then improves from there.',
    ],
  },
  {
    title: 'The Wild Die',
    summary:
      'One die in every skill or attribute roll is the Wild Die. It adds uncertainty, lucky breaks, and complications.',
    bullets: [
      'Wild Die 6: Add the 6, roll it again, and keep adding as long as it keeps rolling 6.',
      'Wild Die 1: Tell the gamemaster. They may count it normally, remove dice from the total, or introduce a complication.',
      'Everything else: Add the die normally.',
    ],
  },
  {
    title: 'Rounds and Actions',
    summary:
      'In fast scenes, play is broken into rounds. A round is only a few seconds in the fiction, so doing more than one thing at once gets harder.',
    bullets: [
      'One action: Roll normally.',
      'Multiple actions: Subtract 1D from every roll for each action beyond the first.',
      'Use judgment: Extra actions can be worth it, but they make every roll less reliable.',
    ],
  },
  {
    title: 'Spending Points',
    summary:
      'Character Points and Force Points let you push harder when the moment matters.',
    bullets: [
      'Character Points: Add an extra die after rolling but before the gamemaster announces the result.',
      'Force Points: Declare before rolling to double your dice for the round.',
      'Resource choice: Character Points also help improve skills later, so spending them always has a cost.',
    ],
  },
]

const forcePointsReferences = [
  {
    title: 'Character Points',
    summary:
      'Character Points are a minor manifestation of the Force and represent a character pushing themself. They are more common than Force Points, less powerful, and there is no limit to how many a character can have.',
    bullets: [
      'Spending points: Spend one Character Point to roll one extra die and add it to a skill or attribute total.',
      'Exploding 6: If the extra die rolls a 6, add it and roll again, continuing as long as it keeps rolling 6.',
      'Timing: You may wait until after a skill or attribute roll before spending Character Points, but they must be spent before anyone else takes an action.',
      'Limit: You cannot spend Character Points in the same round or scene as a Force Point or when calling on the dark side.',
    ],
  },
  {
    title: 'Force Points',
    summary:
      'Force Points represent a character giving everything they have to use skill, talent, luck, and the Force to accomplish something important.',
    bullets: [
      'Force Points: Force Points represent a character giving everything they have. Spending one doubles all of the character skill, attribute, and special ability die codes for the rest of the round, but does not double things outside the character, such as weapon damage or starship hull.',
      'Limits: All player characters begin with at least one Force Point. Non-Force-sensitive characters can have up to five Force Points, while Force-sensitive characters can have any number.',
      'Scene use: A Force Point may apply to one continuous action in a scene, but the bonus ends as soon as the character shifts to a different action.',
      'Getting points back: In REUP, heroic use gets the point back at the end of the adventure, while a dramatically appropriate heroic use may return the point and award an extra one.',
      'Misuse: Evil or selfish use can cost the point permanently.',
    ],
  },
  {
    title: 'Dark Side Points',
    summary:
      'In REUP as written, Dark Side Points can eventually turn a character into a dark side character. Dead Empire changes how this works for player characters.',
    bullets: [
      'Dead Empire rule: Player characters do not become GM PCs from the standard REUP Dark Side Point rule.',
      'Complications: Dark Side Points are used by the gamemaster to create complications, give enemies advantages, and keep the story tense.',
      'Purpose: This keeps immoral choices meaningful without punishing players by taking their characters away.',
    ],
  },
  {
    title: 'The Three Force Skills',
    summary:
      'Force powers are built from three skills: control, sense, and alter. A power may use one of these skills or combine several of them.',
    bullets: [
      'Control: Mastery over the Jedi own body and internal connection to the Force.',
      'Sense: Awareness of the Force beyond the self, including living beings, danger, connections, and hidden information.',
      'Alter: Changing the flow or effect of the Force, including moving objects, affecting perceptions, or influencing others.',
    ],
  },
  {
    title: 'What Force Powers Are',
    summary:
      'Force powers are specific trained applications of control, sense, and alter. They describe what can be attempted, which Force skills are rolled, and what difficulties apply.',
    bullets: [
      'Known powers only: A character normally cannot use a Force power they have not learned.',
      'Specific tools: Powers are intentionally narrow so players and the gamemaster know what is possible at the table.',
      'Creative stretching: The gamemaster may allow a power to be stretched beyond its exact description, usually by raising the difficulty based on how far the attempt goes.',
      'Impossible is still impossible: Some uses remain beyond the power no matter how high the roll is.',
    ],
  },
  {
    title: 'Using Force Powers',
    summary:
      'Activating a Force power requires the listed Force skill roll or rolls. If a power uses multiple skills, each skill counts as a separate action.',
    bullets: [
      'Consecutive rounds: The character may roll each required Force skill over multiple rounds at full dice.',
      'Same round: The character may try to activate a multi-skill power in one round, but normal multiple-action penalties apply.',
      'Resistance: Some powers allow the target to resist with control, Perception, or another listed roll.',
      'Gamemaster modifiers: The gamemaster may apply situational modifiers in addition to the listed difficulty.',
    ],
  },
  {
    title: 'Relationship Modifiers',
    summary:
      'Some Force powers are easier or harder depending on how well the Force user knows the target.',
    columns: ['Relationship', 'Difficulty Modifier'],
    rows: [
      ['Close relatives', '+0'],
      ['Close friends', '+2'],
      ['Friends', '+5'],
      ['Acquaintances', '+7'],
      ['Slight acquaintances', '+10'],
      ['Met once', '+12'],
      ['Known by reputation only', '+15'],
      ['Complete strangers', '+20'],
      ['Strangers of another species', '+30'],
    ],
  },
  {
    title: 'Proximity Modifiers',
    summary:
      'Some Force powers become harder when the target is farther away.',
    columns: ['Distance to Target', 'Difficulty Modifier'],
    rows: [
      ['Touching', '+0'],
      ['In line of sight', '+2'],
      ['Not in sight, 1-100 meters away', '+5'],
      ['101 meters to 10 km away', '+7'],
      ['11 to 1,000 km away', '+10'],
      ['Same planet, over 1,000 km away', '+15'],
      ['Same system, different planet', '+20'],
      ['Different star system', '+30'],
    ],
  },
  {
    title: 'Keeping Powers Up',
    summary:
      'Some powers can remain active after they are successfully activated. If a power can be kept up, its description says so.',
    bullets: [
      'Declare it: The player must say the power is being kept up when it is activated.',
      'Ongoing action cost: A kept-up power continues to count as using its Force skill or skills, reducing other actions as normal.',
      'Dropping powers: The character may drop the power voluntarily.',
      'Damage interruption: If the character is stunned, wounded, or worse, kept-up powers drop automatically.',
    ],
  },
  {
    title: 'Reading Force Power Descriptions',
    summary:
      'Force power entries list the mechanical pieces needed to use that power in play.',
    bullets: [
      'Difficulties: A power lists the control, sense, and/or alter difficulties required to activate it.',
      'Required powers: Some powers require knowing other powers first.',
      'Time to use: If a power lists a time to use, the effect takes that long. If no time is listed, assume one round.',
      'Effect: The effect explains what the power does after successful activation.',
      'Warning: Some powers are inherently dark and can create Dark Side Point consequences when used.',
    ],
  },
  {
    title: 'Intuitive and Dramatic Force Use',
    summary:
      'In exceptional moments, the gamemaster may allow a character to reach beyond what they have formally learned.',
    bullets: [
      'Intuitive powers: A Force user may temporarily manifest an unknown power in a crisis at gamemaster discretion.',
      'Possible costs: The gamemaster may require Character Points, Force Points, special conditions, or treat it as a one-time effect.',
      'Dramatic use option: REUP presents an optional rule where a character may attempt an unknown power by spending 10 Character Points and one Force Point, if they have seen the power before and the moment is dramatic enough.',
      'Risk remains: The normal Force skill rolls still apply, and selfish or cruel use can carry dark side consequences.',
    ],
  },
  {
    title: 'Creating New Force Powers',
    summary:
      'New Force powers are possible in the fiction, but they are rare and usually belong to deeply trained masters or unusual Force traditions.',
    goldNote:
      'Discuss new Force powers with me first. I will allow them if they are possible in the story and balanced for the campaign.',
    bullets: [
      'Gamemaster control: The gamemaster can simply disallow new power creation.',
      'Long-term study: Creating powers should require serious training, research, story time, and strong justification.',
      'Lost traditions: Some powers may come from rare Force traditions, ancient records, or forgotten teachings rather than normal Jedi instruction.',
    ],
  },
  {
    title: 'Atonement and Redemption',
    summary:
      'REUP includes rules for falling to the dark side, redemption, and atonement. Dead Empire keeps the moral weight but uses campaign-specific consequences.',
    bullets: [
      'Atonement: A character trying to cleanse Dark Side Points must make a serious, sustained effort to reject cruelty and prevent evil.',
      'Time and conduct: REUP treats atonement as a long process that can be interrupted if the character earns more Dark Side Points.',
      'Redemption: Returning from the dark side usually requires a sincere, selfless choice at a dramatically important moment.',
      'Dead Empire note: Player characters are not automatically taken away as GM PCs, but Dark Side Points still invite complications, pressure, and consequences.',
    ],
  },
]

const characterAdvancementReferences = [
  {
    title: 'Advancement Overview',
    summary:
      'Characters improve by spending Character Points, usually between adventures. Advancement represents practice, experience, training, and lessons learned from the trouble your character survives.',
    bullets: [
      'Character Points: Awarded after adventures and spent to improve skills, learn new abilities, or push rolls during play.',
      'Between adventures: Most improvement happens during downtime, though the gamemaster may allow training during a long lull in an adventure.',
      'One pip at a time: Most improvements move a die code by one pip, such as 3D to 3D+1, 3D+1 to 3D+2, or 3D+2 to 4D.',
    ],
  },
  {
    title: 'Improving Skills',
    summary:
      'To improve a normal skill by one pip, spend Character Points equal to the number before the D in the current skill code.',
    bullets: [
      'Cost: Raising a 4D skill to 4D+1 costs 4 Character Points. Raising 4D+2 to 5D also counts as one pip and costs 4 Character Points.',
      'Limit: A skill can normally improve only one pip between adventures, though you may improve multiple different skills.',
      'Used recently: If you used the skill in the last adventure, no training time is required.',
    ],
  },
  {
    title: 'Specializations',
    summary:
      'Specializations are narrow versions of skills, such as a specific model of ship or weapon. They improve separately from the base skill.',
    bullets: [
      'Cost: Improving a specialization by one pip costs half the number before the D, rounded up.',
      'Separate ratings: Improving a base skill does not raise its specialization, and improving a specialization does not raise the base skill.',
      'Teacher requirement: A teacher for a specialization must have either the base skill or that specialization at least as high as the new rating.',
    ],
  },
  {
    title: 'Training Time',
    summary:
      'If you did not use the skill or specialization in the last adventure, you must train before the improvement takes effect.',
    bullets: [
      'With a teacher: Training takes one day per Character Point spent.',
      'Without a teacher: Training takes two days per Character Point spent.',
      'Focused practice: You cannot train more than one skill at a time or train while actively adventuring.',
      'Reducing time: You may spend one extra Character Point per day removed from training time, but training must still take at least one day.',
    ],
  },
  {
    title: 'Teachers',
    summary:
      'Teachers make training faster, but they must be skilled enough to teach the new rating you are trying to reach.',
    bullets: [
      'Skill level: The teacher needs the relevant skill at least equal to the rating you will have after training.',
      'Availability: The gamemaster is not required to provide a teacher, especially for rare, advanced, or unusual skills.',
      'Cost in the story: Teachers may ask for payment, service, favors, missions, or other commitments.',
    ],
  },
  {
    title: 'Advanced Skills',
    summary:
      'Advanced skills represent complex specialized fields. They cost more and always require training.',
    bullets: [
      'Improvement cost: Raising an advanced skill by one pip costs twice the number before the D.',
      'Training with a teacher: One week per Character Point spent.',
      'Training without a teacher: Two weeks per Character Point spent.',
      'Minimum training: Training time can be reduced with extra Character Points, but never below one week.',
    ],
  },
  {
    title: 'Learning New Skills',
    summary:
      'A character can learn a new normal skill or specialization by buying it one pip above the linked attribute.',
    bullets: [
      'Cost: Pay Character Points equal to the attribute number before the D to gain the skill at attribute value +1 pip.',
      'Recent use: If you used the attribute for that kind of action in the last adventure, there may be no training time.',
      'Unusual skills: Rare skills, strange specializations, or setting-specific knowledge may require finding a suitable teacher, place, or equipment.',
    ],
  },
  {
    title: 'Learning Advanced Skills',
    summary:
      'Advanced skills can only be learned if you meet their prerequisites, then pay the Character Point cost to gain the skill at 1D.',
    bullets: [
      'Prerequisites: You must have the required supporting skills before learning the advanced skill.',
      'Typical cost: Many advanced skills cost 2 Character Points to learn at 1D.',
      'Training time: Use the advanced skill training rules, usually weeks rather than days.',
    ],
  },
  {
    title: 'Improving Attributes',
    summary:
      'Attributes can improve one pip at a time, but they are expensive, slow, and limited by species maximums.',
    bullets: [
      'Cost: Spend Character Points equal to the number before the D times 10.',
      'Training: With a teacher, training takes one week per Character Point spent. Without a teacher, it takes two weeks per Character Point spent.',
      'Linked skills: When an attribute improves by one pip, all normal skills under that attribute also improve by one pip.',
      'Species maximum: After training, the new attribute must pass the species maximum check. If it fails, the attribute does not improve and half the Character Points are refunded.',
    ],
  },
  {
    title: 'Improving Move',
    summary:
      'Move improves one meter at a time and cannot exceed the species maximum.',
    bullets: [
      'Cost: Spend Character Points equal to the character current Move score.',
      'Training: With a teacher, training takes one week per Character Point spent. Without a teacher, it takes two weeks per Character Point spent.',
      'Minimum time: Extra Character Points can reduce the training time by one day each, but training must still take at least one week.',
    ],
  },
  {
    title: 'Becoming Force-Sensitive',
    summary:
      'A non-Force-sensitive character may become Force-sensitive after play begins, but it is a major change.',
    bullets: [
      'Cost: Becoming Force-sensitive costs 20 Character Points and has no training time requirement.',
      'Immediate benefit: The character gains one extra Force Point.',
      'Ongoing responsibility: The character must now follow the rules and expectations for Force-sensitive characters.',
      'Permanent change: Once a character becomes Force-sensitive, they do not later lose that sensitivity.',
    ],
  },
  {
    title: 'Force Training Overview',
    summary:
      'Only Force-sensitive characters can learn Force skills and Force powers. In most cases, learning the Force requires a teacher, rare records, a holocron, or another source approved by the gamemaster.',
    bullets: [
      'Force skills: The three core Force skills are control, sense, and alter.',
      'Starting characters: Some templates may begin with Force skills, implying prior training before the campaign began.',
      'Campaign control: The gamemaster decides whether teachers, holocrons, lost texts, or other Force traditions are available.',
    ],
  },
  {
    title: 'Finding a Force Teacher',
    summary:
      'A character who wants to learn control, sense, or alter normally needs a teacher. Finding one can be a major story goal, especially in eras where trained Force users are rare.',
    bullets: [
      'Teacher rating: A teacher must have at least 3D in the Force skill being taught, and must exceed the student skill level.',
      'Not guaranteed: The gamemaster does not have to provide a teacher just because a character wants one.',
      'Other sources: Holocrons, texts, datatapes, or hidden lore may sometimes count as instruction, depending on the campaign.',
    ],
  },
  {
    title: 'Learning a Force Skill',
    summary:
      'Learning a new Force skill is a major advancement step. It requires intensive study and starts the character at 1D in that skill.',
    bullets: [
      'Cost: Learning control, sense, or alter costs 10 Character Points.',
      'Training time: Learning a Force skill takes one week of intensive study.',
      'Reducing time: Training time may be reduced by one day per additional Character Point spent, to a minimum of one day.',
      'First power: When the skill is learned, the teacher also teaches one Force power connected to that skill.',
    ],
  },
  {
    title: 'Improving Force Skills',
    summary:
      'Force skills improve one pip at a time, much like other skills, but teachers matter more and training is expected.',
    bullets: [
      'With a teacher: Improving a Force skill by one pip costs Character Points equal to the current number before the D.',
      'Without a teacher: The Character Point cost is doubled.',
      'Training time: With a teacher, train one day per Character Point spent. Without a teacher, train two days per Character Point spent.',
      'New power: Each time a Force skill improves one pip, the character may learn one new Force power tied to the improved skill.',
    ],
  },
  {
    title: 'Learning Force Powers',
    summary:
      'Force powers are specific ways to apply control, sense, and alter. A Jedi cannot use a power they have not learned.',
    bullets: [
      'With skill improvement: A character may learn a new power whenever a related Force skill improves by one pip.',
      'Without skill improvement: A character may learn a new Force power by spending 5 Character Points.',
      'Multi-skill powers: A power using two Force skills counts as two powers when taught. A power using all three Force skills counts as three powers.',
      'Availability: Some powers may require specific teachers, traditions, holocrons, eras, or gamemaster approval.',
    ],
  },
  {
    title: 'Special Abilities',
    summary:
      'Some species or characters have special abilities that can improve over time, but those rules are specific to the ability.',
    bullets: [
      'Check the ability: Costs, limits, and training time are listed in the special ability description.',
      'Ask the gamemaster: If the ability does not list advancement rules, the gamemaster decides whether it can improve and how.',
    ],
  },
]

const droidReferences = [
  {
    title: 'Droids in the Galaxy',
    summary:
      'Droids are intelligent machines built for specific jobs across the galaxy. They handle work that is complex, dangerous, repetitive, dull, or better suited to programmed precision than organic instinct.',
    bullets: [
      'Specialized design: Most droids excel at one or two kinds of work rather than having broad organic versatility.',
      'Logic over intuition: Droids can be highly intelligent and capable of learning, but they often lack organic-style intuition and associative thinking.',
      'Personality programming: Many droids are given personalities so organics can interact with them more naturally.',
      'Communication: Some droids speak normally, while others use dense electronic languages that are easiest for other droids to understand.',
    ],
  },
  {
    title: 'First Degree Droids',
    summary:
      'First degree droids specialize in scientific, medical, and mathematical work.',
    bullets: [
      'Typical roles: Medicine, physical sciences, analysis, and complex technical support.',
      'Common use: They are often paired with organic experts to help complete specialized tasks.',
      'Example type: Surgical and medical droids.',
    ],
  },
  {
    title: 'Second Degree Droids',
    summary:
      'Second degree droids are built for engineering, environmental, technical, and applied science duties.',
    bullets: [
      'Function over appearance: These droids may look plain or utilitarian, causing organics to underestimate them.',
      'Typical roles: Maintenance, repairs, astrogation support, environmental work, and shipboard technical duties.',
      'Example type: Astromech droids such as R-series units.',
    ],
  },
  {
    title: 'Third Degree Droids',
    summary:
      'Third degree droids are designed for social interaction and work involving organic beings.',
    bullets: [
      'Typical roles: Protocol, translation, etiquette, teaching, diplomacy, and organic relations.',
      'Design style: They are often shaped or presented in ways that their intended owners find familiar or comfortable.',
      'Example type: Protocol droids.',
    ],
  },
  {
    title: 'Fourth Degree Droids',
    summary:
      'Fourth degree droids are military, combat, and security machines. Many are illegal or heavily restricted in civilized systems.',
    bullets: [
      'Typical roles: Defense, security, assassination, battlefield support, and enforcement.',
      'Legal risk: Lethal autonomous droids are banned or controlled in many places because of past disasters.',
      'Story use: Governments, criminals, corporations, and hidden military projects may still deploy them.',
    ],
  },
  {
    title: 'Fifth Degree Droids',
    summary:
      'Fifth degree droids perform menial, industrial, and physically demanding labor.',
    bullets: [
      'Typical roles: Lifting, mining, salvage, sanitation, waste control, transport, and simple labor.',
      'Common and cheap: They are among the most widespread and affordable droids in the galaxy.',
      'Limited processors: Many have only the programming and knowledge needed for their assigned task.',
    ],
  },
  {
    title: 'Playing a Droid Character',
    summary:
      'Droid player characters use different creation assumptions than organic characters and should be built collaboratively with the gamemaster.',
    bullets: [
      'Different life experience: Droids are activated, programmed, bought, modified, wiped, damaged, repaired, and repurposed.',
      'Purpose matters: A droid original function should shape its skills, behavior, attachments, and personality.',
      'Collaborative build: Talk with the gamemaster about Move, installed equipment, attachments, legal issues, and whether the droid concept fits the campaign.',
    ],
  },
  {
    title: 'Creating a New Droid Model',
    summary:
      'A starting droid character is built from 25D divided between attributes, skills, and attachments.',
    bullets: [
      'No organic split: Organic characters usually divide dice between attributes and skills, but droids divide their starting dice between attributes, skills, and permanent attachments.',
      'Attribute range: Droids are not bound by organic species minimums and maximums, though technology still limits what is possible.',
      'Attachments: Installed equipment can provide permanent bonuses or capabilities and is part of the droid build.',
      'Alternate method: The gamemaster may instead give a credit budget and use droid construction or modification rules.',
    ],
  },
  {
    title: 'Using an Existing Droid Model',
    summary:
      'A player may base a character on a stock droid model, but not every droid type is suitable for player character use.',
    bullets: [
      'Start with stock stats: Add up the model attributes, skills, and attachments while ignoring special abilities or story factors that do not count toward the normal dice total.',
      'Exactly 25D: If the model already totals 25D, it can generally be copied as the starting character.',
      'Under 25D: If the model has fewer than 25D, the difference becomes build dice.',
      'Unsuitable models: Extremely large, narrow-purpose, or awkward droids may not work as player characters without special approval.',
    ],
  },
  {
    title: 'Build Dice',
    summary:
      'Build dice are extra dice used to bring an existing stock droid model up to player character strength.',
    bullets: [
      'How to calculate: Subtract the stock model dice total from 25D.',
      'Where they go: Build dice may be spent on skills and attachments.',
      'Restriction: Build dice from an existing model cannot be spent to improve attributes.',
      'Concept first: Choose additions that fit the droid history, owner modifications, and intended campaign role.',
    ],
  },
  {
    title: 'Droid Skills at Creation',
    summary:
      'Droids can be more specialized than organic starting characters and may begin with high skill ratings tied to their programming.',
    bullets: [
      'Higher specialization: A new droid character can generally start with a skill up to 4D above its governing attribute.',
      'Existing model skills: Stock droids may already have skills integrated into the model.',
      'No stacking past limits: If a stock model already has a skill 4D or more above its attribute, build dice normally cannot raise that skill at creation.',
      'Gamemaster veto: The gamemaster may disallow skills that do not make sense for the droid design or story explanation.',
    ],
  },
  {
    title: 'Droid Identity',
    summary:
      'Droid identity usually begins with a designation, model, owner history, and purpose, but can grow into a distinct personality over time.',
    bullets: [
      'Designation: Droid names are often alphanumeric model or serial codes, though organics frequently shorten them or use nicknames.',
      'Manufacturer: The company or culture that built the droid can shape its programming, assumptions, and behavior.',
      'Primary function: Even after many adventures, a droid often retains habits and priorities from its original purpose.',
      'Activation age: How long the droid has been active affects how much experience, wear, and personality drift it has accumulated.',
    ],
  },
  {
    title: 'Simulated Emotions and Personality',
    summary:
      'Droid emotions are usually programmed responses, but experience and modification can make those responses complex and distinctive.',
    bullets: [
      'Function-driven behavior: Medical droids may be soothing, protocol droids polite, assassin droids aggressive, and labor droids blunt or task-focused.',
      'Learned quirks: Damage, owners, upgrades, bad repairs, or unusual experiences can create new habits.',
      'Useful roleplay question: Decide why the droid reacts the way it does, especially if its personality conflicts with its intended function.',
    ],
  },
  {
    title: 'Droid Character Traits',
    summary:
      'Personality traits can make a droid feel like more than equipment. They should create roleplay texture without making the droid impossible to adventure with.',
    bullets: [
      'Example traits: Argumentative, curious, pompous, talkative, paranoid, sullen, obsequious, obsessive, low-confidence, or prone to exaggeration.',
      'Glitches: A persistent malfunction, odd voice, stuck subroutine, or backup personality can create memorable behavior.',
      'Use restraint: A quirk is most fun when it adds flavor without constantly blocking the group.',
    ],
  },
  {
    title: 'Previous Owners',
    summary:
      'A droid may have served many owners before the campaign, and those owners can explain skills, habits, contacts, enemies, and old obligations.',
    bullets: [
      'Possible histories: Government aide, smuggler assistant, bounty hunter property, shop helper, pirate captive, mercenary support unit, or black market resale.',
      'Repurposed function: A droid may have been used for work far outside its original design.',
      'Story hooks: Old owners, stolen property claims, hidden data, forgotten missions, or people who recognize the droid can all matter later.',
    ],
  },
  {
    title: 'Memory Wipes',
    summary:
      'Memory wipes reset a droid memory and personality matrix toward factory standards, but they are not always perfect.',
    bullets: [
      'Common maintenance: Many owners wipe droids regularly or wipe newly purchased droids before use.',
      'Lost history: A wiped droid may not remember former owners or experiences, even if others remember it.',
      'Fragments remain: Sloppy or incomplete wipes can leave quirks, memory flashes, protocols, or unexplained habits.',
      'Roleplay angle: A droid may know it was wiped and become curious, anxious, or obsessive about who it used to be.',
    ],
  },
  {
    title: 'Reading Droid Stat Blocks',
    summary:
      'Droid entries can describe either famous individual droids or stock models available in the galaxy.',
    bullets: [
      'Type: Manufacturer, make, and model.',
      'Attributes and skills: Individual droids list their own stats; stock droids show typical or minimum model capabilities.',
      'Equipped with: Built-in tools, hardware, attachments, sensors, weapons, or specialized systems.',
      'Special skills and abilities: Unique programming or capabilities that ordinary characters may not have.',
      'Story factors: Non-mechanical notes about how the droid behaves or how others respond to it.',
      'Move, size, cost, and equipment: Practical details for play, travel, purchase, and use.',
    ],
  },
]

const starshipReferences = [
  {
    title: 'Hyperdrives and Hyperspace',
    summary:
      'Hyperdrives move starships into hyperspace, an alternate dimension where ships can cross interstellar distances far faster than light.',
    bullets: [
      'Jumping: The hyperdrive motivator engages, accelerates the ship past lightspeed, and carries it into hyperspace.',
      'Returning: When the hyperdrive shuts down, the ship drops back into realspace at its previous realspace speed.',
      'Mass shadows: Realspace objects cast hyperspace shadows. Hitting one can destroy a ship instantly.',
      'Safety systems: Ships use mass shadow sensors to drop out before impact, but those systems are not perfect.',
    ],
  },
  {
    title: 'Nav Computers and Astromechs',
    summary:
      'Hyperspace travel is too complex to calculate by instinct. Most ships rely on nav computers or astromech droids to plot safe courses.',
    bullets: [
      'Nav data: Computers store route coordinates, stars, planets, gravity wells, debris, asteroid fields, gas clouds, and known hazards.',
      'Astromech support: Ships without full nav computers often rely on astromech droids to store coordinates.',
      'Blind jumps: Jumping without coordinates is possible, but extremely dangerous.',
    ],
  },
  {
    title: 'Hyperspace Routes',
    summary:
      'Hyperspace routes are established paths linking worlds, much like roads connect settlements on a planet.',
    bullets: [
      'Known routes: Well-traveled routes are safer and faster because hazards are better mapped.',
      'Changing routes: Travel times can decrease as routes become better understood or increase when new hazards drift into the path.',
      'Indirect travel: Nearby systems can still require long routes if debris, gravity, or other hazards block a direct path.',
      'New routes: Scouts may explore new paths through many cautious micro-jumps rather than one blind leap.',
    ],
  },
  {
    title: 'Hyperdrive Multipliers',
    summary:
      'A hyperdrive class is a multiplier. Lower numbers are faster, so a x1 drive is faster than x2, and x0.5 is faster still.',
    bullets: [
      'Common civilian drives: Many civilian ships have x2 or slower hyperdrives.',
      'Military drives: Military vessels and starfighters often have x1 drives.',
      'Travel math: Multiply the route standard duration by the ship hyperdrive multiplier to get travel time.',
      'Backup drives: Some ships have very slow backup hyperdrives, often x10 or worse, useful for limping to help.',
    ],
  },
  {
    title: 'Astrogation Procedure',
    summary:
      'A hyperspace trip usually needs three decisions: set the astrogation difficulty, calculate the jump, and determine travel duration.',
    bullets: [
      'Base difficulty: Most trips begin around Moderate, but familiar easy routes can be lower and dangerous routes can be much higher.',
      'Success: If the astrogation roll meets or beats the difficulty, the trip proceeds safely.',
      'Miss by 10 or more: The ship cannot enter hyperspace and must calculate again.',
      'Miss by 1-9: The ship enters hyperspace but suffers an astrogation mishap.',
    ],
  },
  {
    title: 'Astrogation Modifiers',
    summary:
      'Astrogation difficulty changes based on ship condition, available navigation data, obstacles, and how rushed the jump is.',
    columns: ['Situation', 'Modifier'],
    rows: [
      ['No nav computer or astromech', '+30'],
      ['Hasty entry', 'x2 difficulty'],
      ['Lightly damaged ship', '+5'],
      ['Heavily damaged ship', '+10'],
      ['Each extra hour added to trip', '-1'],
      ['Each hour saved from trip', '+1'],
      ['Obstacles or hazards', '+1-30 or more'],
    ],
  },
  {
    title: 'Calculating a Jump',
    summary:
      'The time required to calculate a hyperspace jump depends on how familiar the route is and whether the crew knows where they are.',
    bullets: [
      'Well-traveled route: About one minute if using known or precalculated coordinates.',
      'Emergency jump: Can be attempted in one round, but the astrogation difficulty is doubled.',
      'Known systems: A normal route between known systems takes about half an hour to calculate.',
      'Unfamiliar destination: A system the ship has never jumped to before can take a few hours.',
      'Lost position: If the ship does not know where it is, it may take a day to determine position and plot a new route.',
    ],
  },
  {
    title: 'Trip Duration',
    summary:
      'Every route has a standard duration for a x1 hyperdrive. The ship hyperdrive multiplier adjusts that time.',
    bullets: [
      'Sector travel: Systems in the same sector may take hours to days.',
      'Regional travel: Systems in different sectors of the same region may take several hours to several days.',
      'Neighboring regions: Travel can take several days to weeks.',
      'Distant regions: Travel can take weeks to months.',
      'Route quality: Well-traveled routes can cut time dramatically, while hazardous routes can add days, weeks, or months.',
    ],
  },
  {
    title: 'Astrogation Mishaps',
    summary:
      'A close astrogation failure can send the ship into trouble without simply destroying the campaign.',
    bullets: [
      'Hyperdrive cut-out: Sensors detect a mass shadow and drop the ship into realspace, forcing a new route.',
      'Damaged hyperdrive: The ship may need repairs or be forced onto a slow backup drive.',
      'Radiation fluctuations: The trip duration changes unpredictably.',
      'Off course: The ship arrives in the wrong system.',
      'Ship damage: Other systems can be damaged, and the worst results can leave the ship heavily damaged or no longer spaceworthy.',
      'Adventure hook: Mishaps are best used to create complications, discoveries, delays, or new scenes.',
    ],
  },
  {
    title: 'Stopping Hyperspace Jumps',
    summary:
      'A ship under pressure may try to flee into hyperspace, but damage, ionization, tractor beams, and rushed calculations make that harder.',
    bullets: [
      'Time pressure: Safe jumps require calculations, from one minute on familiar routes to much longer for obscure routes.',
      'Hasty jumps: A one-round emergency jump doubles the astrogation difficulty.',
      'Damage: Light damage adds +5 and heavy damage adds +10 to astrogation difficulty.',
      'Ionization: Each controls ionized result adds +5.',
      'Tractor beams: A tractor beam can add its damage roll to the jump difficulty.',
    ],
  },
  {
    title: 'Booking Passage',
    summary:
      'Characters without a ship can buy passage on liners, transports, or freighters traveling to the right system.',
    bullets: [
      'Passenger liners: Major worlds are often served by regular liners with options ranging from cheap seats to luxury staterooms.',
      'Costs: Short, spartan travel may cost a few hundred credits, while luxury cruises can cost many thousands.',
      'Let the crew work: For normal passage, the characters buy tickets and the ship crew handles travel.',
      'Complications: Pirates, customs searches, contraband investigations, and political suspicion can still turn a simple trip into trouble.',
      'Independent freighters: A cheaper option may be a freighter with spare bunks already heading to the destination, though comfort is limited.',
    ],
  },
  {
    title: 'Chartering a Ship',
    summary:
      'Characters can hire an independent captain to take them where they need to go, usually with more privacy and control than a liner.',
    bullets: [
      'Cost: Chartering can be expensive, sometimes 10,000 credits or more.',
      'Control: The characters may be able to choose departure time, arrival time, route, or cargo handling.',
      'Privacy: Charters are useful for sensitive passengers, secret cargo, or avoiding routine liner attention.',
      'Remote worlds: Some destinations are so isolated that a charter may be the only practical way to get there.',
    ],
  },
  {
    title: 'Passing Time on Trips',
    summary:
      'Interstellar trips can take hours, days, or weeks. The crew may have little to do while computers handle the journey.',
    bullets: [
      'Luxury liners: Passengers may have meals, music, games, entertainment, and social opportunities.',
      'Small freighters: Cramped quarters, limited food, and stale entertainment can create tension.',
      'Useful downtime: Characters can study, gamble, repair gear, talk, recover, or roleplay relationships.',
      'Adventure seeds: Trips are good places for rumors, passenger encounters, sabotage, inspections, or ominous messages.',
    ],
  },
  {
    title: 'Space Encounters',
    summary:
      'Arriving from hyperspace can lead directly into encounters, especially after mishaps or travel through dangerous regions.',
    bullets: [
      'Authorities: Imperial, Republic, New Republic, local, or alien patrols may inspect ships and cargo.',
      'Traders and smugglers: Other spacers can provide information, jobs, misinformation, or trouble.',
      'Natural hazards: Gas clouds, rogue planetoids, asteroid fields, energy storms, mynocks, and space life can create complications.',
      'Unknown systems: Misjumps or exploration can reveal lost colonies, resources, alien civilizations, or forgotten technology.',
    ],
  },
  {
    title: 'Spacer Documents',
    summary:
      'Legal starship operation depends on paperwork, transponders, and Bureau of Ships and Services records.',
    bullets: [
      'Ship operating license: Lists ship specifications, origin, manufacturer, registry, owner, and transponder codes.',
      'Transponder codes: The ship fingerprint. A mismatch suggests illegal operation, forgery, or tampering.',
      'Captain license: Captains are expected to be licensed for the class of ship they fly.',
      'Arms load-out permit: Non-military ships with weapons or boosted shields may need permits for each weapon or upgraded shield system.',
    ],
  },
  {
    title: 'Starports',
    summary:
      'Starports vary from bare landing fields to massive Imperial or Republic facilities with strict customs, military presence, and high-end services.',
    bullets: [
      'Landing field: A cleared strip with little or no control, repair, refueling, or reliable service.',
      'Limited services: Basic beacon, small command tower, limited storage, and basic repair sheds.',
      'Standard class: Full control center, restocking, and a small shipyard for minor repairs and modifications.',
      'Stellar class: Handles nearly any vessel, often with advanced repairs, customs, and naval presence.',
      'Imperial/Republic class: Luxurious, heavily regulated, well-defended, and strict about inspections and identification.',
    ],
  },
  {
    title: 'Starport Fees and Maintenance',
    summary:
      'Docking, restocking, and maintenance are routine costs of starship travel.',
    bullets: [
      'Docking fees: Standard or better ports often charge around 50 credits per day, while busy major ports can charge much more.',
      'Automatic restocking: Standard class or better ports may automatically restock fluids, oxygen, basic food converter supplies, waste removal, and basic checks unless declined.',
      'Restocking formula: Base fee x crew and passenger capacity x days of consumables renewed.',
      'Overhauls: Ships should receive a major maintenance overhaul after roughly every 20 hyperspace jumps.',
      'Neglect: Skipping maintenance can justify complications, misjumps, or serious mechanical failures.',
    ],
  },
  {
    title: 'Starport Flight Protocols',
    summary:
      'Starport procedures create structure, delays, and opportunities for trouble during arrival and departure.',
    bullets: [
      'METOSP: Message to Spacers broadcasts share traffic, hazards, naval activity, starport details, and control channels.',
      'Arrival: Incoming ships identify themselves, provide captain and ship information, and may undergo transponder verification.',
      'Landing clearance: Control assigns approach vectors, traffic patterns, and docking areas.',
      'Departure: Ships request clearance, provide flight plans, and follow outbound traffic vectors before setting up hyperspace jumps.',
      'Fines: Ignoring approach or departure instructions can lead to fines, inspections, or worse.',
    ],
  },
]

const spaceCombatReferences = [
  {
    title: 'Additional Rules for This Campaign',
    alert: true,
    summary:
      'Dead Empire uses a simplified space combat system. Use the instructions panel on the Space Combat page for the campaign rules. The rest of this tab mainly summarizes standard REUP space combat for reference.',
    links: [{ label: 'Open Space Combat Page', to: '/space-combat' }],
  },
  {
    title: 'Running Space Combat',
    summary:
      'Space battles should feel fast, cinematic, and dangerous. The goal is exciting Star Wars action, not measuring every turn with perfect precision.',
    bullets: [
      'Narrate clearly: Describe relative position, hazards, incoming fire, and immediate danger so players know what choices matter.',
      'Use judgment: Set a difficulty, call for the relevant roll, and keep the battle moving when exact tracking would slow the scene.',
      'Scenes over math: Use scenes, rounds, and encounters flexibly to keep the pacing close to the movies.',
      'Visual aids optional: Counters or miniatures can help show relative positions, but detailed maps are not required.',
    ],
  },
  {
    title: 'Space Units',
    summary:
      'Starships move at enormous speeds, so the rules use Space units instead of tracking thousands of kilometers.',
    bullets: [
      'Proportional movement: Ships keep their relative speeds without needing huge distance numbers.',
      'Ranges: Starship weapon ranges are also listed in Space units.',
      'Mapping option: For detailed battles, 1 inch on the table can equal 1 Space unit.',
    ],
  },
  {
    title: 'Starship Movement Basics',
    summary:
      'Starship movement works like vehicle movement. A ship can move once per round, and moving is normally an action.',
    bullets: [
      'Space score: A ship Space rating is how many Space units it moves at cruising speed.',
      'Piloting roll: Roll capital ship piloting, space transports, or starfighter piloting as appropriate.',
      'Maneuverability: Add the ship maneuverability code to the pilot skill roll.',
      'Failure: If the roll is below the difficulty, the ship suffers a movement failure.',
    ],
  },
  {
    title: 'Movement Speeds',
    summary:
      'Pilots choose how fast they are moving. Higher speed covers more distance but increases danger and limits other actions.',
    columns: ['Speed', 'Effect'],
    rows: [
      ['Cautious', 'Up to half Space; often free in easier terrain'],
      ['Cruising', 'Up to Space; normal movement speed'],
      ['High Speed', 'Up to double Space; harder in dangerous terrain'],
      ['All-Out', 'Up to four times Space; pilot can do nothing else'],
    ],
  },
  {
    title: 'Cautious Movement',
    summary:
      'Cautious movement is slow, careful flying, up to half the ship Space rating rounded up.',
    bullets: [
      'Easy terrain: In Very Easy, Easy, and Moderate space, cautious movement is a free action and needs no roll.',
      'Hard terrain: In Difficult, Very Difficult, or Heroic space, roll piloting but reduce the difficulty one level.',
      'Use case: Best for careful navigation through dangerous areas when speed is less important than control.',
    ],
  },
  {
    title: 'Cruising Movement',
    summary:
      'Cruising movement is the normal speed for a starship and moves up to the ship Space rating.',
    bullets: [
      'Action cost: Cruising movement counts as an action.',
      'Easy terrain: Very Easy, Easy, and Moderate space can be crossed automatically.',
      'Hard terrain: Difficult, Very Difficult, and Heroic space require a piloting roll.',
    ],
  },
  {
    title: 'High Speed and All-Out Movement',
    summary:
      'High speed and all-out movement push the ship harder, increasing danger and limiting what the pilot can do.',
    bullets: [
      'High speed: Moves up to twice Space and requires a roll even in easier terrain.',
      'High speed in hard terrain: Difficult or worse terrain increases by one difficulty level.',
      'All-out: Moves up to four times Space, but the pilot cannot fire, dodge, or take other actions.',
      'All-out difficulty: Easier terrain increases one difficulty level; Difficult or worse increases two levels.',
    ],
  },
  {
    title: 'Acceleration and Long-Distance Strain',
    summary:
      'Ships cannot instantly jump between every speed, and sustained high-speed travel can strain the vessel.',
    bullets: [
      'Acceleration: A ship may increase or decrease speed by one level per round.',
      'Partial movement: A ship can move anywhere from half its current move speed up to the full amount.',
      'All-out strain: Continuous all-out movement requires hull checks every 10 minutes, with rising difficulty.',
      'High-speed strain: Continuous high speed requires hull checks every hour, also with rising difficulty.',
      'Failure: Strain may force rest time or cause mechanical failure requiring repair.',
    ],
  },
  {
    title: 'Starship Terrain Difficulties',
    summary:
      'Terrain difficulty represents hazards, traffic, debris, combat density, and how hard it is to maneuver safely.',
    columns: ['Difficulty', 'Example'],
    rows: [
      ['Very Easy 1-5', 'Clear space with no hazards'],
      ['Easy 6-10', 'Near other ships or minor obstacles'],
      ['Moderate 11-15', 'Crowded space or moderate debris'],
      ['Difficult 16-20', 'Starfighter combat or heavy debris'],
      ['Very Difficult 21-30', 'Dense ships, asteroids, or debris'],
      ['Heroic 31+', 'Nearly impossible flight path, such as extreme Death Star-style terrain'],
    ],
  },
  {
    title: 'Maneuver Modifiers',
    summary:
      'The base difficulty covers simple flight. Add modifiers when a pilot attempts a more impressive or dangerous maneuver.',
    columns: ['Modifier', 'Maneuver'],
    rows: [
      ['+1-5', 'Fairly easy maneuver'],
      ['+6-10', 'Somewhat difficult maneuver'],
      ['+11-15', 'Very difficult maneuver'],
      ['+16+', 'Almost impossible maneuver'],
    ],
  },
  {
    title: 'Movement Failures',
    summary:
      'A failed movement roll can cause slipping, spinning, lost control, or collision depending on how badly the roll failed.',
    columns: ['Missed By', 'Result'],
    rows: [
      ['1-3', 'Slight slip; movement completes, -1D to pilot actions this round'],
      ['4-6', 'Slip; half movement, -3D this round and -1D next round'],
      ['7-10', 'Spin; quarter movement, no control this round or next'],
      ['11-15', 'Minor collision if possible, otherwise wild spin'],
      ['16-20', 'Collision if possible, otherwise wild spin'],
      ['21+', 'Major collision if possible, otherwise out of control'],
    ],
  },
  {
    title: 'Collisions',
    summary:
      'Collision damage depends on how fast the ship was moving and may be modified by the angle or object hit.',
    columns: ['Speed', 'Collision Damage'],
    rows: [
      ['Cautious', '2D'],
      ['Cruise', '4D'],
      ['High Speed', '6D'],
      ['All-Out', '10D'],
      ['Head-on crash', '+3D'],
      ['Rear-end or sideswipe', '-3D'],
      ['T-bone', '+0D'],
    ],
  },
  {
    title: 'Starship Attacks',
    summary:
      'Starship combat uses five-second rounds and works much like normal combat.',
    bullets: [
      'Set difficulty: Determine the target number from the weapon range in Space units.',
      'Attack roll: Roll starship gunnery for starfighter-scale weapons or capital ship gunnery for capital-scale weapons.',
      'Fire control: Add the weapon fire control dice to the attack roll.',
      'Damage: If the attack hits, roll weapon damage and compare it to the target hull and shields as appropriate.',
    ],
  },
  {
    title: 'Starship Dodges',
    summary:
      'A pilot can make a starship dodge as a reaction to incoming fire.',
    bullets: [
      'Reaction roll: Roll the appropriate piloting skill plus ship maneuverability.',
      'New difficulty: The dodge result becomes the new difficulty number to hit the ship.',
      'Full reaction: A full starship dodge is the only action that pilot takes that round and adds to the base attack difficulties.',
    ],
  },
  {
    title: 'Shields',
    summary:
      'Starship shields help absorb damage, but they must be placed into fire arcs to protect against attacks from that direction.',
    bullets: [
      'Particle shields: Deflect physical objects, missiles, and torpedoes. If lowered, reduce hull by -2D.',
      'Combat shields: Shield dice are divided among front, back, left, and right arcs.',
      'Difficulty: Covering one arc is Easy, two arcs Moderate, three arcs Difficult, and four arcs Very Difficult.',
      'Damage resistance: Hits from a covered arc add those shield dice to the hull roll.',
    ],
  },
  {
    title: 'Starship Weapons',
    summary:
      'Starship weapons use familiar weapon rules: range, fire control, fire rate, ammo, crew, fire arcs, scale, and damage.',
    bullets: [
      'Full cover: Starships provide full cover to occupants.',
      'Fire-linked weapons: Multiple weapons may fire together as one attack, with stats listed for the linked group.',
      'Separate fire: Fire-linked weapons can sometimes fire separately, but damage is reduced using combined-fire logic.',
      'Atmosphere range: Some weapons list separate ranges for atmospheric flight or firing into atmosphere from orbit.',
    ],
  },
  {
    title: 'Ion Cannons',
    summary:
      'Ion cannons disrupt electronics and computer systems rather than causing normal physical damage.',
    bullets: [
      'No shield protection: Shields do not protect against ion cannon damage.',
      'Damage comparison: Roll ion damage against hull code to determine controls ionized or controls dead results.',
      'Use case: Ion weapons are ideal for disabling ships without destroying them.',
    ],
  },
  {
    title: 'Missiles, Bombs, and Proton Torpedoes',
    summary:
      'Physical ordnance delivers heavy damage but is harder to target against fast-moving ships.',
    columns: ['Target Speed', 'Difficulty Increase'],
    rows: [
      ['Space 3 / Atmosphere 100-150', '+5'],
      ['Space 4 / Atmosphere 151-200', '+10'],
      ['Space 5 / Atmosphere 201-250', '+15'],
      ['Space 6+ / Atmosphere 251+', '+20'],
    ],
  },
  {
    title: 'Tractor Beams',
    summary:
      'Military tractor beams capture ships so they can be boarded, searched, or pulled into a hangar.',
    bullets: [
      'Attack first: A tractor beam hits like a normal attack roll against range difficulty.',
      'Capture roll: Roll tractor damage against the target hull. If tractor damage equals or beats hull, the target is caught.',
      'No resistance: A caught ship that does not resist is reeled in 5 Space units per round.',
      'Resistance: If the target resists, compare tractor damage to hull each round to see whether it breaks free, is pulled in, or suffers drive damage.',
    ],
  },
  {
    title: 'Targeting Ship Locations',
    summary:
      'Gunners can call shots against specific parts of a ship, usually to disable rather than destroy.',
    columns: ['Target', 'Modifier'],
    rows: [
      ['Primary section', '+2D difficulty'],
      ['Subsection', '+4D difficulty'],
      ['Specific location', '+8D difficulty'],
      ['Light location damage', '-1D or -1 Move'],
      ['Heavy location damage', '-2D or -2 Move'],
      ['Severe location damage', 'System disabled'],
      ['Destroyed location', 'Catastrophic damage'],
    ],
  },
  {
    title: 'Power Control Option',
    summary:
      'For more technical battles, crews may reroute power from inactive or less important systems to active systems.',
    bullets: [
      'Extra power: A ship can usually channel up to +2D into a system by taking power from somewhere else.',
      'Common uses: Boosting weapons, shields, communications, or active sensors.',
      'Tradeoff: Power taken from one arc, weapon, or system leaves that area weaker or unavailable.',
      'Difficulty: Simple rerouting is Moderate, multiple systems to one target is Difficult, and multiple systems to multiple targets is Very Difficult.',
    ],
  },
  {
    title: 'Starship Damage Chart',
    summary:
      'Starship damage compares weapon or collision damage to the ship hull roll, plus shields if they apply.',
    columns: ['Damage Beats Hull By', 'Effect'],
    rows: [
      ['0-3', 'Shields blown or controls ionized'],
      ['4-8', 'Lightly damaged'],
      ['9-12', 'Heavily damaged'],
      ['13-15', 'Severely damaged'],
      ['16+', 'Destroyed'],
    ],
  },
  {
    title: 'Damage Effects',
    summary:
      'Damage can degrade maneuverability, shields, weapons, hyperdrives, movement, and eventually the whole ship.',
    bullets: [
      'Shields blown: Reduce shields by -1D; if no shields remain, treat as controls ionized.',
      'Controls ionized: Temporary -1D to maneuverability, shields, weapon fire control, and weapon damage.',
      'Light damage: Can reduce maneuverability, shields, Move, damage a weapon, or damage the hyperdrive.',
      'Heavy damage: More serious system loss; another light or heavy result can escalate to severe damage.',
      'Severe damage: The ship may be dead in space, losing weapons, losing hyperdrives, disintegrating, or about to explode.',
      'Destroyed: The ship explodes and everyone aboard is killed unless the story says otherwise.',
    ],
  },
  {
    title: 'Lost Moves and Passenger Damage',
    summary:
      'Move losses stack and can eventually leave a ship dead in space or destroyed. Passengers may also be injured by ship damage.',
    columns: ['Result', 'Effect'],
    rows: [
      ['-1 Move', 'No all-out speed; limited to high speed'],
      ['-2 Moves', 'Limited to cruising speed'],
      ['-3 Moves', 'Limited to cautious speed'],
      ['-4 Moves', 'Sublight drives disabled; dead in space'],
      ['-5 Moves', 'Ship destroyed'],
      ['Light ship damage', 'Passengers may suffer 1D character-scale damage'],
      ['Heavy ship damage', 'Passengers may suffer 3D character-scale damage'],
      ['Severe ship damage', 'Passengers may suffer 6D character-scale damage'],
      ['Destroyed ship', 'Passengers may suffer 12D character-scale damage'],
    ],
  },
  {
    title: 'Ships in Atmosphere',
    summary:
      'Ships with an Atmosphere listing can fly in atmosphere using vehicle movement and combat rules, while still using starship damage rules.',
    bullets: [
      'Atmosphere listing: The first number is Move, and the second is all-out speed in kilometers per hour.',
      'No listing: Ships without an Atmosphere listing, such as many capital ships, cannot normally enter planetary atmosphere.',
      'Rules blend: Use vehicle movement and combat for atmospheric maneuvering, but use the starship damage chart for damage.',
    ],
  },
]

const referenceHaystack = (reference) => {
  return [
    reference.title,
    reference.summary,
    reference.goldNote,
    ...(reference.bullets ?? []),
    ...(reference.rows ?? []).flat(),
    ...(reference.sections ?? []).flatMap((section) => [
      section.title,
      section.body,
      ...(section.table?.columns ?? []),
    ]),
  ]
    .join(' ')
    .toLowerCase()
}

const filterReferences = (references, query) => {
  if (!query) {
    return references
  }

  return references.filter((reference) => referenceHaystack(reference).includes(query))
}

const activeReferenceLabel = computed(() => {
  return referenceSections.find((section) => section.id === activeReference.value)?.label ?? 'Reference'
})

const filteredReferences = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()

  if (activeReference.value === 'combat') {
    return filterReferences(combatReferences, query)
  }

  if (activeReference.value === 'character-advancement') {
    return filterReferences(characterAdvancementReferences, query)
  }

  if (activeReference.value === 'force-points') {
    return filterReferences(forcePointsReferences, query)
  }

  if (activeReference.value === 'droids') {
    return filterReferences(droidReferences, query)
  }

  if (activeReference.value === 'starships') {
    return filterReferences(starshipReferences, query)
  }

  if (activeReference.value === 'space-combat') {
    return filterReferences(spaceCombatReferences, query)
  }

  return []
})
</script>

<template>
  <main class="rules-page min-h-screen px-6 pb-16 pt-32 text-stone-100">
    <section class="mx-auto max-w-7xl">
      <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Rules Reference</p>
      <h1 class="mt-2 font-serif text-5xl font-bold text-[#4fc3ff]">Dead Empire Rules</h1>

      <section class="rules-intro mt-10">
        <p class="rules-disclaimer">
          Dead Empire is an unofficial, non-commercial fan site for a private tabletop campaign.
          Star Wars and related names, characters, locations, artwork, and trademarks are the
          property of Lucasfilm Ltd. and/or The Walt Disney Company. This site is not affiliated
          with, sponsored by, endorsed by, or approved by Lucasfilm, Disney, West End Games, or any
          current rights holder. Rules references are provided for play aid purposes and are
          summarized or independently written unless otherwise noted.
        </p>
      </section>

      <section class="rules-resource-grid mt-6" aria-label="Rules resources">
        <section class="rules-resource-box">
          <h2>REUP Rules</h2>
          <p>This site is built to be compatible with the Star Wars: REUP system.</p>
          <a
            class="rules-primary-link"
            href="http://d6holocron.com/downloads/books/REUP.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Open REUP Rules
          </a>
        </section>

        <section class="rules-resource-box">
          <h2>Other Resources</h2>
          <div class="rules-resource-links">
            <template v-for="(resource, index) in resources" :key="resource.href || `placeholder-${index}`">
              <a
                v-if="resource.href"
                class="tool-card"
                :href="resource.href"
                target="_blank"
                rel="noreferrer"
              >
                {{ resource.label }}
              </a>
              <div v-else class="tool-card tool-card-placeholder" aria-hidden="true"></div>
            </template>
          </div>
        </section>
      </section>

      <div class="rules-reference-divider mt-12" aria-hidden="true"></div>

      <div class="rules-reference-tabs-frame mt-8">
        <nav
          ref="referenceTabs"
          class="rules-reference-tabs"
          aria-label="Rules references"
          @wheel.prevent="scrollReferenceTabs"
        >
          <button
            v-for="section in referenceSections"
            :key="section.id"
            type="button"
            :class="{ 'rules-reference-tab-active': activeReference === section.id }"
            @click="activeReference = section.id"
          >
            {{ section.label }}
          </button>
        </nav>
      </div>

      <section class="rules-reference-panel mt-12">
        <div class="rules-section-heading">
          <div>
            <p class="text-sm font-bold uppercase tracking-[0.28em] text-cyan-100/70">Index</p>
            <h2>{{ activeReferenceLabel }} Reference</h2>
          </div>
        </div>

        <label
          v-if="
            activeReference === 'combat' ||
            activeReference === 'character-advancement' ||
            activeReference === 'force-points' ||
            activeReference === 'droids' ||
            activeReference === 'starships' ||
            activeReference === 'space-combat'
          "
          class="reference-search mt-5"
        >
          <span>Search {{ activeReferenceLabel }} Reference</span>
          <input
            v-model="searchTerm"
            type="search"
            :placeholder="
              activeReference === 'combat'
                ? 'Search cover, stun, scale...'
                : activeReference === 'character-advancement'
                  ? 'Search skills, training, teachers...'
                  : activeReference === 'force-points'
                    ? 'Search Force Points, powers, proximity...'
                    : activeReference === 'droids'
                      ? 'Search droid classes, build dice, memory wipes...'
                      : activeReference === 'starships'
                        ? 'Search hyperdrives, astrogation, starports...'
                        : 'Search shields, movement, damage...'
            "
          />
        </label>

        <p v-if="activeReference === 'getting-started'" class="getting-started-intro mt-5">
          Welcome to Dead Empire. Whether you are joining the campaign or just looking around, the
          steps below will help you get familiar with the website, the setting, and the basics of
          the system before play begins.
        </p>

        <ol v-if="activeReference === 'getting-started'" class="getting-started-list mt-6">
          <li v-for="step in gettingStartedSteps" :key="step.title">
            <span class="getting-started-step-number">{{ step.number }}</span>
            <div>
              <h3>{{ step.title }} <span v-if="step.optional">(Optional)</span></h3>
              <p v-if="step.id === 'primer'">
                To begin, it is helpful to read our
                <RouterLink to="/Primer">Primer page</RouterLink>. The Primer gives a brief
                overview of the galaxy just before the start of the campaign. After reading through
                the Primer, you may want to visit
                <RouterLink to="/map">the galaxy map</RouterLink>,
                <RouterLink to="/Characters">the Characters page</RouterLink>,
                <RouterLink to="/Planets">the Planets page</RouterLink>, or
                <RouterLink to="/Factions">the Factions page</RouterLink>, all of which are
                available in the header.
              </p>
              <p v-else-if="step.id === 'information'">
                If you are interested in this project, the thought behind it, and some other
                nonsense, feel free to check out the
                <RouterLink to="/Information">website Information page</RouterLink>.
              </p>
              <p v-else-if="step.id === 'references'">
                Take a moment to either read through the REUP rules or look through the summarized
                reference tabs. Do not worry about remembering everything. The only tab you need to
                be familiar with at first is the Player Handout tab.
              </p>
              <p v-else-if="step.id === 'dice'">
                Click the dice icon in the bottom right of the screen and get used to rolling dice
                on this website. If you are logged in, all dice rolls are recorded in the
                <RouterLink to="/roll-log">Roll Log</RouterLink>.
              </p>
              <p v-else-if="step.id === 'combat-tool'">
                The Combat Tool will mostly be used by the game master, but you can
                <RouterLink to="/combat">check it out here</RouterLink>. It may be helpful to read
                through the instructions page, available by clicking the instructions button, since
                it will help you get familiar with how combat works.
              </p>
              <p v-else-if="step.id === 'login'">
                When you feel ready and have some ideas in your head, the game master will provide
                you with an account for this website. Click the
                <RouterLink to="/profile">Login</RouterLink> button and use the provided username
                and password. Logging in unlocks character creation and some additional sections of
                the site.
              </p>
              <p v-else-if="step.id === 'character'">
                Go to your <RouterLink to="/profile">profile</RouterLink> and click the create
                character button. Follow the wizard steps to create your first character. Be sure to
                let the game master know after you have completed your character, and ask the game
                master any questions you have.
              </p>
            </div>
          </li>
        </ol>

        <div v-if="activeReference === 'player-handout'" class="rules-reference-list mt-5">
          <ReferenceList :references="playerHandoutReferences" />
        </div>

        <div v-if="activeReference === 'basics'" class="rules-reference-list mt-5">
          <section class="reference-card basics-tables-card">
            <h3>Difficulty Numbers and Modifiers</h3>
            <p>
              Use these as quick targets when judging how hard an action is and how strongly the
              final roll exceeds the difficulty.
            </p>
            <div class="basics-table-grid">
              <div class="basics-table">
                <h4>Difficulty Numbers</h4>
                <div class="basics-table-row basics-table-head">
                  <span>Difficulty</span>
                  <span>Number</span>
                </div>
                <div v-for="row in basicsDifficultyRows" :key="row[0]" class="basics-table-row">
                  <span>{{ row[0] }}</span>
                  <span>{{ row[1] }}</span>
                </div>
              </div>
              <div class="basics-table">
                <h4>Result Modifiers</h4>
                <div class="basics-table-row basics-table-head">
                  <span>Margin</span>
                  <span>Result</span>
                </div>
                <div v-for="row in basicsModifierRows" :key="row[0]" class="basics-table-row">
                  <span>{{ row[0] }}</span>
                  <span>{{ row[1] }}</span>
                </div>
              </div>
            </div>
          </section>
          <ReferenceList :references="basicsReferences" />
        </div>

        <div v-if="activeReference === 'force-points'" class="rules-reference-list rules-reference-scroll mt-5">
          <ReferenceList :references="filteredReferences" />
        </div>

        <div
          v-if="activeReference === 'character-advancement'"
          class="rules-reference-list rules-reference-scroll mt-5"
        >
          <ReferenceList :references="filteredReferences" />
        </div>

        <div v-if="activeReference === 'droids'" class="rules-reference-list rules-reference-scroll mt-5">
          <ReferenceList :references="filteredReferences" />
        </div>

        <div v-if="activeReference === 'space-combat'" class="rules-reference-list rules-reference-scroll mt-5">
          <ReferenceList :references="filteredReferences" />
        </div>

        <div v-if="activeReference === 'starships'" class="rules-reference-list rules-reference-scroll mt-5">
          <ReferenceList :references="filteredReferences" />
        </div>

        <div v-if="activeReference === 'gamemaster'" class="rules-reference-list mt-5">
          <section class="reference-card">
            <h3>Gamemaster</h3>
            <p>Gamemaster references will be added here.</p>
          </section>
        </div>

        <div v-if="activeReference === 'combat'" class="rules-reference-list rules-reference-scroll mt-5">
          <ReferenceList :references="filteredReferences" />
        </div>
      </section>
    </section>
  </main>
</template>

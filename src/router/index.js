import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import BestiaryView from '../views/BestiaryView.vue'
import CharactersView from '../views/CharactersView.vue'
import CombatView from '../views/CombatView.vue'
import FactionsView from '../views/FactionsView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import PlanetsView from '../views/PlanetsView.vue'
import PlayerCharacterView from '../views/PlayerCharacterView.vue'
import RulesView from '../views/RulesView.vue'
import ToolsView from '../views/ToolsView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView,
    },
    {
      path: '/Gamemaster',
      name: 'gamemaster',
      component: PlaceholderView,
      props: { title: 'Gamemaster Info' },
    },
    {
      path: '/Characters',
      name: 'characters',
      component: CharactersView,
    },
    {
      path: '/bestiary',
      name: 'bestiary',
      component: BestiaryView,
    },
    {
      path: '/combat',
      name: 'combat',
      component: CombatView,
    },
    {
      path: '/tools',
      name: 'tools',
      component: ToolsView,
    },
    {
      path: '/playercharacter/:characterName',
      name: 'player-character',
      component: PlayerCharacterView,
      props: true,
    },
    {
      path: '/Information',
      name: 'information',
      component: PlaceholderView,
      props: { title: 'Information' },
    },
    {
      path: '/Inspiration',
      name: 'inspiration',
      component: PlaceholderView,
      props: { title: 'Inspiration' },
    },
    {
      path: '/Planets',
      name: 'planets',
      component: PlanetsView,
    },
    {
      path: '/Factions',
      name: 'factions',
      component: FactionsView,
    },
    {
      path: '/Rules',
      name: 'rules',
      component: RulesView,
    },
    {
      path: '/Game-Log',
      name: 'game-log',
      component: PlaceholderView,
      props: { title: 'Game Log' },
    },
  ],
})

export default router

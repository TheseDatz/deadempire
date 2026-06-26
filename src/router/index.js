import { createRouter, createWebHashHistory } from 'vue-router'
import AdminView from '../views/AdminView.vue'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import BestiaryView from '../views/BestiaryView.vue'
import CanvasView from '../views/CanvasView.vue'
import CharactersView from '../views/CharactersView.vue'
import CharacterWizardView from '../views/CharacterWizardView.vue'
import CombatView from '../views/CombatView.vue'
import FactionsView from '../views/FactionsView.vue'
import GameLogEntryView from '../views/GameLogEntryView.vue'
import GameLogView from '../views/GameLogView.vue'
import MapView from '../views/MapView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import PlanetsView from '../views/PlanetsView.vue'
import PlayerCharacterView from '../views/PlayerCharacterView.vue'
import PrimerView from '../views/PrimerView.vue'
import RollLogView from '../views/RollLogView.vue'
import ProfileView from '../views/ProfileView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import RulesView from '../views/RulesView.vue'
import SpaceCombatView from '../views/SpaceCombatView.vue'
import ToolsView from '../views/ToolsView.vue'
import { getSession, isAdminSession } from '../services/auth'

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
      path: '/space-combat',
      name: 'space-combat',
      component: SpaceCombatView,
    },
    {
      path: '/tools',
      name: 'tools',
      component: ToolsView,
    },
    {
      path: '/canvas',
      name: 'canvas',
      component: CanvasView,
    },
    {
      path: '/playercharacter/:characterName',
      name: 'player-character',
      component: PlayerCharacterView,
      props: true,
    },
    {
      path: '/character-wizard',
      name: 'character-wizard',
      component: CharacterWizardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/Information',
      name: 'information',
      component: PlaceholderView,
      props: { title: 'Information' },
    },
    {
      path: '/Primer',
      name: 'primer',
      component: PrimerView,
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
      path: '/map',
      name: 'map',
      component: MapView,
    },
    {
      path: '/Rules',
      name: 'rules',
      component: RulesView,
    },
    {
      path: '/log',
      name: 'game-log',
      component: GameLogView,
      alias: '/Game-Log',
    },
    {
      path: '/log/:logSlug',
      name: 'game-log-entry',
      component: GameLogEntryView,
    },
    {
      path: '/roll-log',
      name: 'roll-log',
      component: RollLogView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/403',
      name: 'forbidden',
      component: ForbiddenView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth && !to.meta.requiresAdmin) {
    return true
  }

  const { session } = await getSession()

  if (session) {
    if (to.meta.requiresAdmin && !isAdminSession(session)) {
      return { name: 'forbidden' }
    }

    return true
  }

  return {
    name: 'profile',
    query: { redirect: to.fullPath },
  }
})

export default router

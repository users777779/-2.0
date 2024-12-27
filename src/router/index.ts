import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GraphView from '../views/GraphView.vue'
import SpeciesView from '../views/SpeciesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/graph',
      name: 'graph',
      component: GraphView,
    },
    {
      path: '/species',
      name: 'species',
      component: SpeciesView,
    },
    {
      path: '/fishbase',
      name: 'fishbase',
      component: () => import('@/components/FishKnowledgeGraph.vue'),
    },
  ],
})

export default router

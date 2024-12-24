import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GraphView from '../views/GraphView.vue'
import SpeciesView from '../views/SpeciesView.vue'
import ChatView from '../views/ChatView.vue'

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
      path: '/chat',
      name: 'chat',
      component: ChatView,
    },
    {
      path: '/fishbase',
      name: 'fishbase',
      component: () => import('@/components/FishKnowledgeGraph.vue'),
    },
  ],
})

export default router

declare module 'vue-router' {
  import type { Router } from '@vue/router-type'
  import type { Component } from 'vue'
  export function useRouter(): Router
  export const RouterLink: Component
  export const RouterView: Component
  export function createRouter(options: any): Router
  export function createWebHistory(base?: string): any
  export * from '@vue/router-type'
}

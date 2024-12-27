<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import {
  HomeFilled,
  Collection,
  ArrowLeft,
  ArrowRight,
  Monitor,
  Moon,
  Sunny,
  FullScreen,
  Aim,
} from '@element-plus/icons-vue'
import { useDark } from '@vueuse/core'
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useFullscreen } from '@vueuse/core'

const isDark = useDark()
const isCollapse = ref(false)
const { width } = useWindowSize()
const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

const fullscreenIcon = computed(() => (isFullscreen.value ? Aim : FullScreen))
const fullscreenTooltip = computed(() => (isFullscreen.value ? '退出全屏' : '全屏'))

const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 自动在小屏幕上收缩侧边栏
watch(width, (newWidth) => {
  isCollapse.value = newWidth < 768
})

// 添加键盘快捷键
const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl + B 切换侧边栏
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault()
    toggleSidebar()
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  // 添加切换动画类
  document.documentElement.classList.add('theme-transitioning')
  setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning')
  }, 300)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="app-container">
    <nav :class="['sidebar', { collapsed: isCollapse }]">
      <div class="sidebar-header">
        <div class="logo-container">
          <img alt="Ocean logo" class="logo" src="@/assets/ocean-logo.svg" width="40" height="40" />
          <div class="title-container" v-show="!isCollapse">
            <h1>海智图谱</h1>
            <span class="subtitle">Ocean Fish Knowledge Graph</span>
          </div>
        </div>
      </div>
      <div class="sidebar-content">
        <div class="nav-links">
          <div class="nav-section">
            <span class="nav-section-title" v-show="!isCollapse">主要功能</span>
            <RouterLink to="/" class="nav-item" title="首页">
              <el-icon><HomeFilled /></el-icon>
              <span v-show="!isCollapse">首页</span>
            </RouterLink>
            <RouterLink to="/graph" class="nav-item" title="知识图谱">
              <el-icon><Monitor /></el-icon>
              <span v-show="!isCollapse">知识图谱</span>
            </RouterLink>
          </div>
          <div class="nav-section">
            <span class="nav-section-title" v-show="!isCollapse">物种管理</span>
            <RouterLink to="/species" class="nav-item" title="鱼类物种">
              <el-icon><Collection /></el-icon>
              <span v-show="!isCollapse">鱼类物种</span>
            </RouterLink>
          </div>
        </div>
      </div>
      <div class="sidebar-footer">
        <div class="collapse-trigger" @click="toggleSidebar">
          <div class="trigger-line"></div>
          <div class="trigger-icon">
            <el-icon><ArrowLeft v-if="!isCollapse" /><ArrowRight v-else /></el-icon>
          </div>
        </div>
      </div>
    </nav>
    <main :class="['main-content', { expanded: isCollapse }]">
      <header class="main-header">
        <div class="content-header">
          <el-breadcrumb>
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>当前页面</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-actions">
          <el-button
            class="theme-toggle"
            :class="{ 'is-dark': isDark }"
            circle
            @click="toggleTheme"
          >
            <el-icon><Moon v-if="!isDark" /><Sunny v-else /></el-icon>
          </el-button>
          <el-tooltip :content="fullscreenTooltip" placement="bottom">
            <el-button circle class="fullscreen-toggle" @click="toggleFullscreen">
              <el-icon><component :is="fullscreenIcon" /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </header>
      <RouterView />
    </main>
  </div>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

#app {
  height: 100%;
  width: 100%;
}

/* 主题切换过渡 */
html {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

html * {
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease,
    box-shadow 0.3s ease;
}

html.dark {
  --el-bg-color: #121212;
  --el-bg-color-overlay: #1d1d1d;
  --el-text-color-primary: #fff;
  --el-text-color-regular: #999;
  --el-border-color: rgba(255, 255, 255, 0.1);
}

.theme-transitioning * {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:root {
  /* 主色调 */
  --primary-color: #1a237e;
  --primary-light: #534bae;
  --primary-dark: #000051;

  /* 辅���色 */
  --secondary-color: #0288d1;
  --secondary-light: #5eb8ff;
  --secondary-dark: #005b9f;
}

html.dark {
  --el-bg-color: #121212;
  --el-bg-color-overlay: #1d1d1d;
  --el-text-color-primary: #fff;
  --el-text-color-regular: #999;
  --el-border-color: rgba(255, 255, 255, 0.1);
  /* 暗色主题下的主色调调整 */
  --primary-color: #3949ab;
  --primary-light: #6f74dd;
  --primary-dark: #00227b;
}
</style>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  background: var(--el-bg-color);
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 200px;
  background: var(--primary-color);
  color: white;
  padding: 0;
  display: flex;
  flex-direction: column;
  box-shadow:
    2px 0 8px rgba(0, 0, 0, 0.1),
    inset -1px 0 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1000;
  overflow: hidden;
  background: linear-gradient(180deg, var(--primary-color) 0%, var(--primary-dark) 100%);
}

.sidebar.collapsed {
  width: 64px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 16px 16px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  height: 64px;
  background: rgba(0, 0, 0, 0.1);
  position: relative;
  width: 100%;
  padding-right: 52px;
}

.title-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  min-width: 0;
  flex: 1;
  max-width: calc(100% - 40px);
}

.title-container h1 {
  font-size: 0.95rem;
  margin: 0;
  color: white;
  white-space: nowrap;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  transform-origin: left;
}

.subtitle {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: inherit;
  transform-origin: left;
}

.logo {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
  will-change: transform;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  position: relative;
  z-index: 2;
}

.nav-links {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  height: 100%;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  font-size: 13px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 6px;
  margin: 0 8px;
  margin-bottom: 2px;
  position: relative;
  backdrop-filter: blur(4px);
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(0deg, var(--secondary-light), var(--secondary-color));
  transform: scaleY(0);
  transition: transform 0.3s ease;
  border-radius: 0 2px 2px 0;
  box-shadow: 0 0 8px var(--secondary-color);
}

.nav-item.router-link-active::before {
  transform: scaleY(1);
}

.nav-item .el-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(2px);
}

.nav-item:hover .el-icon {
  color: white;
}

.nav-item.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-weight: 500;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.1),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-active .el-icon {
  color: white;
}

.nav-item:last-child {
  margin-bottom: 0;
}

.main-content {
  flex: 1;
  margin-left: 200px;
  padding: 0;
  overflow-x: hidden;
  min-width: 0;
  height: 100vh;
  overflow-y: auto;
  transition: margin-left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-bg-color-overlay) 100%);
}

.main-content.expanded {
  margin-left: 64px;
}

.content-header {
  display: flex;
  align-items: center;
}

:deep(.el-breadcrumb) {
  line-height: 1;
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
    overflow: hidden;
  }

  .main-content {
    margin-left: 64px;
  }

  .collapse-handle {
    display: none;
  }

  .nav-item {
    justify-content: center;
    padding: 12px;
    position: relative;
  }

  .nav-item:hover::after {
    content: attr(title);
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
  }

  .logo-container {
    padding-right: 16px;
    justify-content: center;
  }

  .nav-links {
    overflow: hidden;
  }
}

.theme-toggle {
  margin-right: 8px;
  width: 40px;
  height: 40px;
  border: 2px solid var(--secondary-color);
  background: transparent;
  transition: all 0.3s ease;
  color: var(--secondary-color);
}

.theme-toggle:hover {
  background: var(--secondary-color);
  color: white;
}

.theme-toggle .el-icon {
  font-size: 20px;
  transition: all 0.3s ease;
}

.theme-toggle.is-dark {
  background: var(--secondary-dark);
  border-color: var(--secondary-dark);
}

.theme-toggle.is-dark:hover {
  transform: rotate(-30deg);
  opacity: 0.9;
}

.nav-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  transform-origin: left;
  will-change: transform, opacity;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.1);
  margin-top: auto;
}

.collapse-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.trigger-line {
  flex: 1;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  margin-right: 12px;
  transition: all 0.3s ease;
}

.trigger-icon {
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.3s ease;
}

.collapse-trigger:hover {
  background: var(--secondary-color);
}

.collapse-trigger:hover .trigger-line {
  background: white;
}

.collapse-trigger:hover .trigger-icon {
  color: white;
  transform: scale(1.1);
}

.sidebar.collapsed .collapse-trigger {
  padding: 8px;
  justify-content: center;
}

.sidebar.collapsed .trigger-line {
  display: none;
}

@media (max-width: 768px) {
  .sidebar-footer {
    display: none;
  }
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--el-bg-color);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--el-border-color-light);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.sidebar.collapsed .nav-section-title {
  opacity: 0;
  transform: translateX(-10px) scale(0.8);
}

.sidebar.collapsed .logo-container h1,
.sidebar.collapsed .subtitle {
  opacity: 0;
  transform: translateX(-10px) scale(0.8);
}

.sidebar.collapsed .nav-item span {
  opacity: 0;
  transform: translateX(-15px) scale(0.8);
}

.sidebar.collapsed .logo {
  transform: scale(1.1);
}

.fullscreen-toggle {
  transition: all 0.3s ease;
}

.fullscreen-toggle:hover {
  background: var(--el-color-primary-light-3);
  color: white;
}

.fullscreen-toggle .el-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.fullscreen-toggle:hover .el-icon {
  transform: scale(1.2);
}

/* 全屏时的样式 */
:root:fullscreen .app-container {
  height: 100vh;
  width: 100vw;
}

:root:fullscreen .main-header {
  backdrop-filter: blur(10px);
  background: rgba(var(--el-bg-color-rgb), 0.8);
}

:root[class~='dark'] .subtitle {
  color: rgba(255, 255, 255, 0.45);
}

/* 调整收缩按钮的显示逻辑 */
@media (min-width: 769px) {
  .logo-container:hover .collapse-handle {
    opacity: 1;
    transform: translateY(-50%);
  }
}

/* 移动端隐藏收缩按钮 */
@media (max-width: 768px) {
  .sidebar {
    width: 64px;
    overflow: hidden;
  }

  .main-content {
    margin-left: 64px;
  }

  .collapse-handle {
    display: none;
  }

  .logo-container {
    padding-right: 16px;
    justify-content: center;
  }

  .nav-links {
    overflow: hidden;
  }
}
</style>

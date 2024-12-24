<template>
  <div class="icon-exporter">
    <h3>SVG 图标导出</h3>
    <div class="icon-grid">
      <div v-for="(icon, name) in icons" :key="name" class="icon-item">
        <div class="icon-preview">
          <component :is="icon" />
        </div>
        <div class="icon-name">{{ name }}</div>
        <el-button type="primary" size="small" @click="exportIcon(name, icon)"> 导出 </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import IconCommunity from './icons/IconCommunity.vue'
import IconDocumentation from './icons/IconDocumentation.vue'
import IconEcosystem from './icons/IconEcosystem.vue'
import IconSupport from './icons/IconSupport.vue'
import IconTooling from './icons/IconTooling.vue'
import { exportSvg, extractSvgFromComponent } from '@/utils/svgExporter'

const icons = {
  IconCommunity,
  IconDocumentation,
  IconEcosystem,
  IconSupport,
  IconTooling,
}

const exportIcon = async (name: string, component: any) => {
  // 获取组件的模板
  const template = component.__file
    ? await fetch(component.__file).then((res) => res.text())
    : component.template

  // 提取 SVG 内容
  const svgContent = extractSvgFromComponent(template)
  if (svgContent) {
    exportSvg(svgContent, name)
  }
}
</script>

<style scoped>
.icon-exporter {
  padding: 20px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.icon-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.icon-preview {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.icon-name {
  margin-bottom: 12px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}
</style>

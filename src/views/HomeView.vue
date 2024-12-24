<template>
  <div class="home-container">
    <div class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">
          <span class="gradient-text">海洋鱼类</span>
          <br />知识图谱系统
        </h1>
        <p class="hero-description">
          探索海洋生物的奥秘，发现水下世界的精彩
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="$router.push('/graph')">
            <el-icon><Monitor /></el-icon>浏览知识图谱
          </el-button>
          <el-button size="large" @click="$router.push('/chat')">
            <el-icon><ChatDotSquare /></el-icon>智能问答
          </el-button>
        </div>
      </div>
      <div class="hero-image">
        <img src="@/assets/ocean-hero.svg" alt="Ocean illustration" />
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">主要功能</h2>
      <div class="features-grid">
        <div class="feature-card" v-for="feature in features" :key="feature.title">
          <div class="feature-icon">
            <el-icon><component :is="feature.icon" /></el-icon>
          </div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
      </div>
    </div>

    <div class="stats-section">
      <div class="stat-card" v-for="stat in stats" :key="stat.label">
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Monitor, ChatDotSquare, Collection, Share } from '@element-plus/icons-vue'

const features = [
  {
    icon: 'Monitor',
    title: '知识图谱',
    description: '直观展示海洋鱼类之间的关系网络，帮助理解生态系统的复杂性'
  },
  {
    icon: 'ChatDotSquare',
    title: '智能问答',
    description: '基于知识图谱的智能问答系统，快速获取专业的海洋生物知识'
  },
  {
    icon: 'Collection',
    title: '物种档案',
    description: '详细记录海洋鱼类的特征、习性、分布等信息，建立完整的物种数据库'
  },
  {
    icon: 'Share',
    title: '知识共享',
    description: '促进海洋生物研究成果的传播与分享，推动海洋科学发展'
  }
]

const stats = [
  {
    value: '10,000+',
    label: '收录物种'
  },
  {
    value: '50,000+',
    label: '知识节点'
  },
  {
    value: '100,000+',
    label: '关系数量'
  },
  {
    value: '99.9%',
    label: '准确率'
  }
]
</script>

<style scoped>
.home-container {
  padding: 40px;
  max-width: 1400px;
  margin: 0 auto;
}

.hero-section {
  display: flex;
  align-items: center;
  gap: 60px;
  margin-bottom: 80px;
  min-height: 500px;
}

.hero-content {
  flex: 1;
}

.hero-title {
  font-size: 3.5rem;
  line-height: 1.2;
  margin-bottom: 24px;
  font-weight: 700;
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  position: relative;
}

.hero-description {
  font-size: 1.25rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 40px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
}

.hero-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-image img {
  max-width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
  animation: float 6s ease-in-out infinite;
}

.features-section {
  margin-bottom: 80px;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 48px;
  color: var(--el-text-color-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
}

.feature-card {
  padding: 32px;
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-light);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.feature-icon .el-icon {
  font-size: 24px;
  color: var(--el-color-primary);
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 16px;
  color: var(--el-text-color-primary);
}

.feature-card p {
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  padding: 40px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
}

.stat-card {
  text-align: center;
  padding: 24px;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-section {
    flex-direction: column;
    text-align: center;
    gap: 40px;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-title {
    font-size: 2.5rem;
  }
}

@media (max-width: 768px) {
  .home-container {
    padding: 20px;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 暗色主题适配 */
:root[class~='dark'] .feature-card {
  background: var(--el-bg-color);
  border-color: var(--el-border-color-darker);
}

:root[class~='dark'] .feature-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

:root[class~='dark'] .feature-icon {
  background: var(--el-color-primary-dark-9);
}
</style>

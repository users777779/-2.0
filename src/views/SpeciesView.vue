<template>
  <div class="species-container">
    <!-- 搜索和筛选区 -->
    <div class="filter-section">
      <el-input
        v-model="searchQuery"
        placeholder="搜索鱼类..."
        class="search-input"
        :prefix-icon="Search"
      >
        <template #append>
          <el-button type="primary">搜索</el-button>
        </template>
      </el-input>
      <el-select v-model="habitat" placeholder="栖息地" class="filter-select">
        <el-option label="深海" value="deep" />
        <el-option label="浅海" value="shallow" />
        <el-option label="珊瑚礁" value="coral" />
      </el-select>
      <el-select v-model="category" placeholder="分类" class="filter-select">
        <el-option label="软骨鱼类" value="cartilaginous" />
        <el-option label="硬骨鱼类" value="bony" />
      </el-select>
      <el-upload
        class="import-upload"
        accept=".json"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleImport"
      >
        <el-button type="success">导入数据</el-button>
      </el-upload>
    </div>

    <!-- 鱼类列表展示 -->
    <div class="species-grid">
      <el-card v-for="fish in fishList" :key="fish.id" class="fish-card">
        <template #header>
          <div class="card-header">
            <span>{{ fish.name }}</span>
            <el-tag size="small" :type="fish.endangered ? 'danger' : 'success'">
              {{ fish.endangered ? '濒危物种' : '数量稳定' }}
            </el-tag>
          </div>
        </template>
        <div class="card-content">
          <el-image :src="fish.image" class="fish-image" fit="cover" />
          <div class="fish-info">
            <p><strong>学名：</strong>{{ fish.scientificName }}</p>
            <p><strong>栖息地：</strong>{{ fish.habitat }}</p>
            <p><strong>平均体长：</strong>{{ fish.length }}cm</p>
          </div>
          <div class="card-actions">
            <el-button type="primary" text>详细信息</el-button>
            <el-button type="success" text>相关研究</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 分页控件 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[12, 24, 36, 48]"
        layout="total, sizes, prev, pager, next"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 搜索和筛选状态
const searchQuery = ref('')
const habitat = ref('')
const category = ref('')

// 分页状态
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(100)

// 模拟数据
const fishList = ref([
  {
    id: 1,
    name: '蓝鳍金枪鱼',
    scientificName: 'Thunnus thynnus',
    habitat: '深海',
    length: 200,
    endangered: true,
    image:
      'https://zh.wikipedia.org/wiki/%E5%8C%97%E6%96%B9%E8%93%9D%E9%B3%8D%E9%87%91%E6%9E%AA%E9%B1%BC#/media/File:Bluefin-big.jpg',
  },
  {
    id: 2,
    name: '大白鲨',
    scientificName: 'Carcharodon carcharias',
    habitat: '深海',
    length: 400,
    endangered: true,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/8/83/Great_white_shark_size_comparison.svg',
  },
  {
    id: 3,
    name: '小丑鱼',
    scientificName: 'Amphiprioninae',
    habitat: '珊瑚礁',
    length: 11,
    endangered: false,
    image:
      'https://zh.wikipedia.org/wiki/%E5%B0%8F%E4%B8%91%E9%AD%9A#/media/File:Clown_fish_in_the_Andaman_Coral_Reef.jpg',
  },
  {
    id: 4,
    name: '河豚',
    scientificName: 'Takifugu rubripes',
    habitat: '浅海',
    length: 40,
    endangered: false,
    image: 'https://zh.wikipedia.org/wiki/%E6%B7%A1%E6%B0%B4%E8%B1%9A#/media/File:Inia.jpg',
  },
  {
    id: 5,
    name: '锤头鲨',
    scientificName: 'Sphyrna mokarran',
    habitat: '深海',
    length: 350,
    endangered: true,
    image:
      'https://upload.wikimedia.org/wikipedia/commons/b/bf/Great_hammerhead_shark_-_Bimini.jpg',
  },
])

// 添加导入功能
const handleImport = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target?.result as string)
      // 验证导入的数据格式
      if (
        Array.isArray(importedData) &&
        importedData.every(
          (item) =>
            item.name &&
            item.scientificName &&
            item.habitat &&
            item.length &&
            typeof item.endangered === 'boolean',
        )
      ) {
        // 为导入的数据添加新的ID
        const newData = importedData.map((item, index) => ({
          ...item,
          id: fishList.value.length + index + 1,
        }))
        fishList.value = [...fishList.value, ...newData]
        ElMessage.success(`成功导入 ${newData.length} 条数据`)
      } else {
        ElMessage.error('数据格式不正确')
      }
    } catch (error) {
      ElMessage.error('导入失败：无效的JSON格式')
    }
  }
  reader.readAsText(file)
  return false
}
</script>

<style scoped>
.species-container {
  padding: 20px;
}

.filter-section {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.search-input {
  max-width: 400px;
}

.filter-select {
  width: 160px;
}

.species-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.fish-card {
  transition: all 0.3s ease;
}

.fish-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fish-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 16px;
}

.fish-info {
  margin-bottom: 16px;
}

.fish-info p {
  margin: 8px 0;
  color: var(--el-text-color-regular);
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>

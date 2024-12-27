<template>
  <div class="graph-container">
    <svg ref="svgRef" class="graph-svg"></svg>
    <div v-if="selectedNode" class="property-panel">
      <div class="panel-header">
        <h3>{{ selectedNode.name }}</h3>
        <el-button type="text" @click="selectedNode = null">
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      <div class="panel-content">
        <div class="panel-section">
          <div class="panel-section-title">基本信息</div>
          <div class="property-item">
            <span class="property-key">节点类型</span>
            <span class="node-type">{{ NODE_LABELS[selectedNode.label] }}</span>
          </div>
          <template v-if="selectedNode.label === 'Fish'">
            <div v-for="(value, key) in filteredProperties" :key="key" class="property-item">
              <span class="property-key">{{ key }}</span>
              <span class="property-value" :class="{ introduction: key === 'introduction' }">{{
                value
              }}</span>
            </div>
          </template>
        </div>

        <div v-if="selectedNode.label !== 'Fish' && relatedFishes.length > 0" class="panel-section">
          <div class="panel-section-title">相关鱼类</div>
          <div
            v-for="fish in relatedFishes"
            :key="fish.id"
            class="property-item related-fish"
            @click="handleRelatedFishClick(fish)"
          >
            <span class="property-key">{{ fish.name }}</span>
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>
    <div class="search-box">
      <el-input
        v-model="searchQuery"
        placeholder="搜索节点..."
        clearable
        :prefix-icon="Search"
        @input="handleSearch"
      >
        <template #append>
          <el-select v-model="searchType" placeholder="节点类型" clearable>
            <el-option v-for="(label, key) in NODE_LABELS" :key="key" :label="label" :value="key" />
          </el-select>
        </template>
      </el-input>
    </div>
    <div class="legend">
      <div class="legend-title">节点类型说明</div>
      <div class="legend-item" v-for="(label, key) in NODE_LABELS" :key="key">
        <div
          class="legend-color"
          :style="{ backgroundColor: getNodeColor(key as NodeLabel) }"
        ></div>
        <span class="legend-label">{{ label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import * as d3 from 'd3'
import { Search, Close, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { NodeWithPosition, LinkWithPosition, NodeLabel } from '@/types/graph'
import { NODE_LABELS } from '@/types/graph'
import { graphService } from '@/services/graphService'
import { neo4jService } from '@/services/neo4jService'

const svgRef = ref<SVGElement>()
const svg = ref<d3.Selection<SVGElement, unknown, null, undefined>>()
const simulation = ref<d3.Simulation<NodeWithPosition, LinkWithPosition>>()

const nodes = ref<NodeWithPosition[]>([])
const links = ref<LinkWithPosition[]>([])
const searchQuery = ref('')
const searchType = ref<NodeLabel | ''>('')

// 错误消息管理
const errorMessageTimers = new Map<string, number>()

// 显示错误消息的函数
const showErrorMessage = (message: string, duration = 3000) => {
  // 如果相同的错误消息已经在显示，则不重复显示
  if (errorMessageTimers.has(message)) {
    return
  }

  // 显示错误消息
  ElMessage.error({
    message,
    duration,
    onClose: () => {
      errorMessageTimers.delete(message)
    },
  })

  // 记录定时器
  errorMessageTimers.set(
    message,
    window.setTimeout(() => {
      errorMessageTimers.delete(message)
    }, duration),
  )
}

// 获取节点颜色
const getNodeColor = (label: NodeLabel): string => {
  const colors: Record<NodeLabel, string> = {
    Fish: '#3498db', // 蓝色，代表鱼类
    Family: '#e74c3c', // 红色，代表科
    Genus: '#2ecc71', // 绿色，代表属
    Order: '#9b59b6', // 紫色，代表目
    Region: '#f1c40f', // 黄色，代表地区
  }
  return colors[label] || '#95a5a6' // 默认灰色
}

// 添加选中节点的状态
const selectedNode = ref<NodeWithPosition | null>(null)

// 添加相关鱼类状态
const relatedFishes = ref<NodeWithPosition[]>([])

// 添加计算属性来过滤不需要显示的属性
const filteredProperties = computed(() => {
  if (!selectedNode.value?.properties) return {}

  const { identity, labels, elementId, ...rest } = selectedNode.value.properties
  return rest
})

// 修改节点点击事件处理
const handleNodeClick = async (event: MouseEvent, node: NodeWithPosition) => {
  if (event) {
    event.stopPropagation()
  }
  selectedNode.value = node

  // 如果不是鱼类节点，获取相关的鱼类节点
  if (node.label !== 'Fish') {
    try {
      const data = await graphService.getNodeWithRelations(node.id)
      // 过滤出鱼类节点
      relatedFishes.value = data.nodes.filter((n) => n.label === 'Fish')
    } catch (error) {
      console.error('获取相关鱼类失败:', error)
      showErrorMessage('获取相关鱼类失败')
    }
  } else {
    // 如果是鱼类节点，清空相关鱼类列表
    relatedFishes.value = []
  }
}

// 修改处理相关鱼类点击的函数
const handleRelatedFishClick = async (fish: NodeWithPosition) => {
  try {
    // 搜索该鱼类节点及其关系
    const data = await graphService.searchNodes(fish.name, 'Fish')

    // 更新图谱数据
    nodes.value = data.nodes
    links.value = data.relationships

    // 更新模拟器数据
    if (simulation.value) {
      simulation.value.nodes(nodes.value)
      simulation.value.force('link')?.links(links.value)
      simulation.value.alpha(1).restart()
    }

    // 更新选中节点
    selectedNode.value = fish
    relatedFishes.value = []

    // 等待节点位置更新
    await new Promise((resolve) => setTimeout(resolve, 100))

    // 找到对应的节点并居中显示
    const node = nodes.value.find((n) => n.id === fish.id)
    if (node && svg.value) {
      // 获取SVG的尺寸和当前缩放比例
      const svgElement = svg.value.node()
      if (!svgElement) return

      const width = svgElement.clientWidth
      const height = svgElement.clientHeight
      const currentTransform = d3.zoomTransform(svgElement)

      // 计算目标位置，使节点居中
      const scale = currentTransform.k
      const tx = width / 2 - (node.x || 0) * scale
      const ty = height / 2 - (node.y || 0) * scale

      // 平滑过渡到目标位置
      svg.value
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))

      // 高亮显示目标节点
      svg.value
        .select('g')
        .selectAll<SVGGElement, NodeWithPosition>('.node')
        .filter((d) => d.id === fish.id)
        .select('circle')
        .transition()
        .duration(750)
        .attr('r', (d) => (d.label === 'Fish' ? 25 : 20))
        .transition()
        .duration(750)
        .attr('r', (d) => (d.label === 'Fish' ? 20 : 15))
    }

    // 显示成功消息
    ElMessage({
      message: `已跳转到 ${fish.name}`,
      type: 'success',
      duration: 2000,
    })
  } catch (error) {
    console.error('跳转到相关鱼类失败:', error)
    showErrorMessage('跳转失败，请重试')
  }
}

// 添加缩放行为定义
const zoom = d3
  .zoom<SVGElement, unknown>()
  .scaleExtent([0.1, 4])
  .on('zoom', (event) => {
    svg.value?.select('g').attr('transform', event.transform)
  })

// 添加背景点击事件处理，用于关闭属性面板
const handleBackgroundClick = () => {
  selectedNode.value = null
}

// 初始化图谱
const initGraph = () => {
  if (!svgRef.value) return

  svg.value = d3.select(svgRef.value)
  const width = svgRef.value.clientWidth
  const height = svgRef.value.clientHeight

  // 添加背景点击事件
  svg.value.on('click', handleBackgroundClick)

  // 添加缩放行为
  svg.value.call(zoom)
  svg.value.append('g')

  simulation.value = d3
    .forceSimulation<NodeWithPosition, LinkWithPosition>()
    .force('charge', d3.forceManyBody().strength(-800))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force(
      'link',
      d3
        .forceLink<NodeWithPosition, LinkWithPosition>()
        .id((d) => d.id)
        .distance(150),
    )
    .on('tick', () => {
      updateNodes()
      updateLinks()
    })
}

// 更新节点位置
const updateNodes = () => {
  if (!svg.value) return

  const nodeElements = svg.value
    .select('g')
    .selectAll<SVGGElement, NodeWithPosition>('.node')
    .data(nodes.value, (d) => d.id)

  nodeElements.exit().remove()

  const nodeEnter = nodeElements.enter().append('g').attr('class', 'node').call(drag)

  // 为所有节点（包括新旧）添加点击事件
  svg.value
    .select('g')
    .selectAll<SVGGElement, NodeWithPosition>('.node')
    .on('click', (event, d) => {
      handleNodeClick(event, d)
    })

  nodeEnter
    .append('circle')
    .attr('class', 'node-circle')
    .attr('r', (d) => (d.label === 'Fish' ? 20 : 15))
    .attr('fill', (d) => getNodeColor(d.label))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  nodeEnter
    .append('text')
    .attr('dy', 30)
    .attr('text-anchor', 'middle')
    .text((d) => d.name)

  svg.value
    .select('g')
    .selectAll<SVGGElement, NodeWithPosition>('.node')
    .attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`)
}

// 更新连线位置
const updateLinks = () => {
  if (!svg.value) return

  const linkElements = svg.value
    .select('g')
    .selectAll<SVGGElement, LinkWithPosition>('.link')
    .data(
      links.value,
      (d) => `${(d.source as NodeWithPosition).id}-${(d.target as NodeWithPosition).id}`,
    )

  linkElements.exit().remove()

  const linkEnter = linkElements.enter().append('g').attr('class', 'link')

  linkEnter
    .append('path')
    .attr('class', 'link-path')
    .attr('stroke', '#4a5568')
    .attr('stroke-width', 2)
    .attr('fill', 'none')

  svg.value
    .select('g')
    .selectAll<SVGGElement, LinkWithPosition>('.link')
    .each(function (d: any) {
      const path = d3.select(this).select('path')

      // 获取节点和目标节点的位置
      const sourceX = d.source.x || 0
      const sourceY = d.source.y || 0
      const targetX = d.target.x || 0
      const targetY = d.target.y || 0

      // 计算节点半径
      const sourceRadius = d.source.label === 'Fish' ? 20 : 15
      const targetRadius = d.target.label === 'Fish' ? 20 : 15

      // 计算节点间的向量
      const dx = targetX - sourceX
      const dy = targetY - sourceY
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 如果节点重叠或距离太近，则使用直线
      if (distance < sourceRadius + targetRadius + 5) {
        path.attr('d', `M${sourceX},${sourceY}L${targetX},${targetY}`)
        return
      }

      // 计算连线与节点的交点
      const angle = Math.atan2(dy, dx)
      const startX = sourceX + (sourceRadius + 2) * Math.cos(angle)
      const startY = sourceY + (sourceRadius + 2) * Math.sin(angle)
      const endX = targetX - (targetRadius + 2) * Math.cos(angle)
      const endY = targetY - (targetRadius + 2) * Math.sin(angle)

      // 使用直线连接节点
      path.attr('d', `M${startX},${startY}L${endX},${endY}`)
    })
}

// 创建拖拽行为
const drag = d3
  .drag<SVGElement, NodeWithPosition>()
  .on('start', (event, d) => {
    if (!event.active) simulation.value?.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  })
  .on('drag', (event, d) => {
    d.fx = event.x
    d.fy = event.y
  })
  .on('end', (event, d) => {
    if (!event.active) simulation.value?.alphaTarget(0)
    d.fx = null
    d.fy = null
  })

// 加载初始数据
const loadInitialData = async () => {
  try {
    const data = await graphService.getInitialNodes()
    const width = svgRef.value?.clientWidth || 800
    const height = svgRef.value?.clientHeight || 600
    const centerX = width / 2
    const centerY = height / 2

    nodes.value = data.nodes.map((node) => ({
      ...node,
      x: centerX + (Math.random() - 0.5) * 100,
      y: centerY + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
    }))

    const nodeMap = new Map(nodes.value.map((node) => [node.id, node]))

    links.value = data.relationships
      .map((link) => {
        const sourceNode = nodeMap.get(link.source)
        const targetNode = nodeMap.get(link.target)
        if (sourceNode && targetNode) {
          return {
            ...link,
            source: sourceNode,
            target: targetNode,
          }
        }
        return null
      })
      .filter(Boolean) as LinkWithPosition[]

    if (simulation.value) {
      simulation.value.nodes(nodes.value)
      simulation.value.force(
        'link',
        d3
          .forceLink<NodeWithPosition, LinkWithPosition>(links.value)
          .id((d: NodeWithPosition) => d.id)
          .distance(150),
      )
      simulation.value.alpha(1).restart()
    }
  } catch (error) {
    console.error('加载初始数据失败:', error)
    showErrorMessage('加载图谱数据失败')
  }
}

// 处理搜索
const handleSearch = async () => {
  if (!searchQuery.value && !searchType.value) {
    await loadInitialData()
    return
  }

  try {
    let data
    const searchTerms = searchQuery.value.trim().split(/\s+/).filter(Boolean)

    if (searchTerms.length > 1) {
      // 检查是否包含类型关键词
      const typeKeywords = searchTerms.filter((term) =>
        Object.values(NODE_LABELS).some((label) => term.includes(label)),
      )

      if (typeKeywords.length > 1) {
        // 多类型搜索
        const types = typeKeywords
          .map((keyword) => {
            for (const [key, value] of Object.entries(NODE_LABELS)) {
              if (keyword.includes(value)) return key
            }
            return null
          })
          .filter(Boolean) as string[]

        data = await graphService.searchNodesByTypes(types)
      } else {
        // 多关键词搜索
        data = await graphService.searchNodes(searchQuery.value, searchType.value)
      }
    } else {
      // 单关键词搜索
      data = await graphService.searchNodes(searchQuery.value, searchType.value)
    }

    if (data.nodes.length === 0) {
      ElMessage({
        message: '未找到匹配的节点',
        type: 'warning',
        duration: 2000,
      })
      return
    }

    // 更新图谱显示
    nodes.value = data.nodes
    links.value = data.relationships
    simulation.value?.nodes(nodes.value)
    simulation.value?.force('link')?.links(links.value)
    simulation.value?.alpha(1).restart()

    // 显示搜索结果数量
    ElMessage({
      message: `找到 ${data.nodes.length} 个相关节点`,
      type: 'success',
      duration: 2000,
    })
  } catch (error) {
    console.error('搜索失败:', error)
    showErrorMessage('搜索失败')
  }
}

// 监听窗口大小变化
const handleResize = () => {
  if (!svgRef.value || !simulation.value) return
  const width = svgRef.value.clientWidth
  const height = svgRef.value.clientHeight
  simulation.value.force('center', d3.forceCenter(width / 2, height / 2))
  simulation.value.alpha(1).restart()
}

// 初始化
onMounted(async () => {
  try {
    await neo4jService.connect()
    initGraph()
    await loadInitialData()
    window.addEventListener('resize', handleResize)
  } catch (error) {
    console.error('初始化失败:', error)
    showErrorMessage('连接数据库失败，请检查网络连接')
  }
})

// 清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 监听搜索类型变化
watch(searchType, handleSearch)
</script>

<style scoped>
.graph-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  overflow: hidden;
}

.graph-svg {
  width: 100%;
  height: 100%;
}

.search-box {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 400px;
  z-index: 1;
}

:deep(.el-input-group__append) {
  padding: 0;
  background: transparent;
}

:deep(.el-select) {
  width: 120px;
}

:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.9);
}

/* 节点样式 */
:deep(.node) {
  cursor: pointer;
}

:deep(.node-circle) {
  transition: all 0.3s;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

:deep(.node:hover .node-circle) {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  transform: scale(1.15);
}

/* 节点文本样式 */
:deep(.node text) {
  fill: #2d3748;
  font-size: 12px;
  font-weight: 500;
  text-shadow:
    -1px -1px 3px white,
    1px -1px 3px white,
    -1px 1px 3px white,
    1px 1px 3px white;
  transition: all 0.3s;
}

:deep(.node:hover text) {
  font-size: 13px;
  font-weight: 600;
}

/* 连线样式 */
:deep(.link-path) {
  stroke: #4a5568;
  stroke-width: 2;
  stroke-linecap: round;
  transition: all 0.3s ease;
  opacity: 0.6;
}

:deep(.link:hover .link-path) {
  stroke: #3182ce;
  stroke-width: 2.5;
  opacity: 1;
}

.legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.legend-title {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 8px 0;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.legend-label {
  font-size: 13px;
  color: #4a5568;
}

/* 添加属性面板样式 */
.property-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 320px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  padding: 0;
  backdrop-filter: blur(10px);
  transform-origin: top right;
  animation: panel-slide-in 0.3s ease-out;
  pointer-events: auto;
}

@keyframes panel-slide-in {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px 12px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1a202c;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-header h3::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: v-bind("selectedNode?.label ? getNodeColor(selectedNode.label) : '#95a5a6'");
}

.panel-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 16px 20px;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.property-item {
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(247, 250, 252, 0.8);
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.property-item:hover {
  background: rgba(237, 242, 247, 0.9);
  transform: translateX(2px);
}

.property-key {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 4px;
  font-size: 13px;
}

.property-value {
  display: block;
  color: #2d3748;
  word-break: break-all;
  font-size: 14px;
  line-height: 1.5;
}

.node-type {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  background-color: v-bind("selectedNode?.label ? getNodeColor(selectedNode.label) : '#95a5a6'");
  margin-top: 8px;
}

.panel-section {
  margin-bottom: 16px;
}

.panel-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.introduction {
  font-size: 14px;
  line-height: 1.6;
  color: #4a5568;
  text-align: justify;
  margin-top: 8px;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

.related-fish {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 12px 16px;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(247, 250, 252, 0.8);
}

.related-fish:hover {
  background: rgba(237, 242, 247, 0.95);
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.related-fish .el-icon {
  color: #718096;
  transition: all 0.3s ease;
}

.related-fish:hover .el-icon {
  color: #4299e1;
  transform: translateX(2px);
}
</style>

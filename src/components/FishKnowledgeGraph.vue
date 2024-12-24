<template>
  <div class="graph-container">
    <svg ref="svgRef"></svg>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as d3 from 'd3'
import driver from '@/api/neo4j'

const svgRef = ref<SVGElement>()

onMounted(async () => {
  try {
    const session = driver.session()
    const result = await session.run('MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100')
    console.log('Neo4j 数据:', result)
    // 处理数据
    interface NodeProperties {
      name: string
      id?: string
      [key: string]: string | undefined
    }
    const nodes = new Map<string, NodeProperties>()
    const links: Array<{ source: string; target: string; type: string }> = []

    result.records.forEach((record) => {
      const source = record.get('n').properties as NodeProperties
      const target = record.get('m').properties
      const relationship = record.get('r').type

      // 添加节点
      if (!nodes.has(source.name)) {
        nodes.set(source.name, { id: source.name, ...source })
      }
      if (!nodes.has(target.name)) {
        nodes.set(target.name, { id: target.name, ...target })
      }

      // 添加连接
      links.push({
        source: source.name,
        target: target.name,
        type: relationship,
      })
    })
    // 创建力导向图
    const svg = d3.select(svgRef.value as SVGElement)
    const width = (svg.node() as SVGElement)?.parentElement?.clientWidth || 800
    const height = (svg.node() as SVGElement)?.parentElement?.clientHeight || 600

    interface SimNode extends NodeProperties {
      x?: number
      y?: number
      vx?: number
      vy?: number
      fx?: number | null
      fy?: number | null
      index?: number
    }

    const simulation = d3
      .forceSimulation(Array.from(nodes.values()) as SimNode[])
      .force(
        'link',
        d3.forceLink(links).id((d: SimNode) => d.id!),
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))

    // 绘制连接线
    const link = svg
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)

    // 绘制节点
    const node = svg
      .append('g')
      .selectAll('circle')
      .data(Array.from(nodes.values()))
      .join('circle')
      .attr('r', 5)
      .attr('fill', '#69b3a2')

    // 添加节点标签
    const labels = svg
      .append('g')
      .selectAll('text')
      .data(Array.from(nodes.values()))
      .join('text')
      .text((d) => d.name)
      .attr('font-size', '12px')
      .attr('dx', 8)
      .attr('dy', 3)

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y)

      labels.attr('x', (d) => d.x).attr('y', (d) => d.y)
    })

    await session.close()
  } catch (error) {
    console.error('Neo4j 连接错误:', error)
  }
})
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100vh;
  background: #fff;
}

svg {
  width: 100%;
  height: 100%;
}

/* 添加一些交互样式 */
circle:hover {
  fill: #ff7f0e;
  cursor: pointer;
}

line:hover {
  stroke: #ff7f0e;
  stroke-width: 2;
}
</style>

import { driver as createDriver, auth } from 'neo4j-driver'
import { neo4jConfig } from '@/config/neo4j.config'

const driver = createDriver(
  neo4jConfig.uri,
  auth.basic(neo4jConfig.username, neo4jConfig.password),
  {
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 30000,
  },
)

const MAX_RETRIES = 3
const RETRY_DELAY = 1000

async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      console.warn(`尝试 ${i + 1}/${MAX_RETRIES} 失败:`, error)
      if (i < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
      }
    }
  }

  throw lastError
}

// 测试连接
export async function testConnection() {
  return withRetry(async () => {
    const session = driver.session()
    try {
      await session.run('RETURN 1')
      console.log('Neo4j 连接成功')
      return true
    } catch (error) {
      console.error('Neo4j 连接失败:', error)
      return false
    } finally {
      await session.close()
    }
  })
}

// 获取图数据
export async function fetchGraphData() {
  const session = driver.session()
  try {
    const result = await session.run(`
      MATCH (n)-[r]->(m)
      WITH n, r, m
      LIMIT 300
      RETURN DISTINCT
        n.name as source_name,
        n.description as source_description,
        n.latinName as source_latin_name,
        labels(n)[0] as source_label,
        ID(n) as source_id,
        m.name as target_name,
        m.description as target_description,
        m.latinName as target_latin_name,
        labels(m)[0] as target_label,
        ID(m) as target_id,
        type(r) as relationship_type
    `)

    const nodes = new Map()
    const links = []

    result.records.forEach((record) => {
      // 处理源节点
      const sourceId = record.get('source_id').toNumber()
      if (!nodes.has(sourceId)) {
        nodes.set(sourceId, {
          id: sourceId,
          name: record.get('source_name'),
          label: record.get('source_label'),
          properties: {
            name: record.get('source_name'),
            description: record.get('source_description'),
            latinName: record.get('source_latin_name'),
          },
        })
      }

      // 处理目标节点，同样添加更多属性
      const targetId = record.get('target_id').toNumber()
      if (!nodes.has(targetId)) {
        nodes.set(targetId, {
          id: targetId,
          name: record.get('target_name'),
          label: record.get('target_label'),
          properties: {
            name: record.get('target_name'),
            description: record.get('target_description'),
            latinName: record.get('target_latin_name'),
          },
        })
      }

      links.push({
        source: sourceId,
        target: targetId,
        type: record.get('relationship_type'),
      })
    })

    return {
      nodes: Array.from(nodes.values()),
      links,
    }
  } finally {
    await session.close()
  }
}

// 获取相关节点
export async function fetchRelatedNodes(nodeId: number) {
  const session = driver.session()
  try {
    const result = await session.run('MATCH (n)-[r]-(m) WHERE ID(n) = $nodeId RETURN m', { nodeId })
    return result.records.map((record) => record.get('m'))
  } finally {
    await session.close()
  }
}

// 根据筛选条件获取图数据
export async function fetchGraphDataWithFilters(filters: {
  limit?: number
  labels?: string[]
  searchText?: string
}) {
  const session = driver.session()
  try {
    let query = 'MATCH (n)-[r]->(m)'
    const params: Record<string, any> = {}

    if (filters.labels?.length) {
      query += ` WHERE n:${filters.labels.join(' OR n:')}`
    }

    if (filters.searchText) {
      const searchCondition = filters.labels?.length ? ' AND' : ' WHERE'
      query += `${searchCondition} n.name CONTAINS $searchText`
      params.searchText = filters.searchText
    }

    query += ` RETURN n, r, m LIMIT ${filters.limit || 100}`

    const result = await session.run(query, params)
    return {
      nodes: result.records.map((record) => record.get('n')),
      links: result.records.map((record) => ({
        source: record.get('n'),
        target: record.get('m'),
        type: record.get('r').type,
      })),
    }
  } finally {
    await session.close()
  }
}

export default driver

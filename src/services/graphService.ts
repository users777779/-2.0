import { neo4jService } from './neo4jService'
import type { NodeWithPosition, LinkWithPosition } from '@/types/graph'
import neo4j from 'neo4j-driver'

class GraphService {
  // 获取初始节点数据
  async getInitialNodes() {
    const session = neo4jService.createSession()
    try {
      const result = await session.run(`
        MATCH (f:Fish)
        WITH f LIMIT 20
        OPTIONAL MATCH (f)-[r]-(related)
        WHERE type(r) IN ['BELONGS_TO_FAMILY', 'BELONGS_TO_GENUS', 'BELONGS_TO_ORDER', 'LOCATED_IN']
        RETURN COLLECT(DISTINCT {
          id: toString(id(f)),
          name: f.name,
          label: 'Fish',
          properties: f
        }) + COLLECT(DISTINCT {
          id: toString(id(related)),
          name: CASE
            WHEN related:Family THEN related.name
            WHEN related:Genus THEN related.name
            WHEN related:Order THEN related.name
            WHEN related:Region THEN related.region
            ELSE related.name
          END,
          label: CASE
            WHEN related:Family THEN 'Family'
            WHEN related:Genus THEN 'Genus'
            WHEN related:Order THEN 'Order'
            WHEN related:Region THEN 'Region'
            ELSE 'Unknown'
          END,
          properties: related
        }) as nodes,
        COLLECT(DISTINCT {
          source: toString(id(startNode(r))),
          target: toString(id(endNode(r))),
          type: type(r)
        }) as relationships
      `)

      const data = result.records[0]
      return {
        nodes: data.get('nodes') as NodeWithPosition[],
        relationships: data.get('relationships') as LinkWithPosition[],
      }
    } finally {
      await session.close()
    }
  }

  // 获取节点关系
  async getNodeWithRelations(nodeId: string) {
    const session = neo4jService.createSession()
    try {
      const result = await session.run(
        `
        MATCH (n)
        WHERE id(n) = $nodeId
        OPTIONAL MATCH (n)-[r]-(related)
        WHERE type(r) IN ['BELONGS_TO_FAMILY', 'BELONGS_TO_GENUS', 'BELONGS_TO_ORDER', 'LOCATED_IN']
        RETURN COLLECT(DISTINCT {
          id: toString(id(related)),
          name: CASE
            WHEN related:Family THEN related.name
            WHEN related:Genus THEN related.name
            WHEN related:Order THEN related.name
            WHEN related:Region THEN related.region
            ELSE related.name
          END,
          label: CASE
            WHEN related:Family THEN 'Family'
            WHEN related:Genus THEN 'Genus'
            WHEN related:Order THEN 'Order'
            WHEN related:Region THEN 'Region'
            ELSE labels(related)[0]
          END,
          properties: related
        }) as nodes,
        COLLECT(DISTINCT {
          source: toString(id(startNode(r))),
          target: toString(id(endNode(r))),
          type: type(r)
        }) as relationships
      `,
        { nodeId: neo4j.int(nodeId) },
      )

      const data = result.records[0]
      return {
        nodes: data.get('nodes') as NodeWithPosition[],
        relationships: data.get('relationships') as LinkWithPosition[],
      }
    } finally {
      await session.close()
    }
  }

  // 搜索节点
  async searchNodes(query: string, label?: string) {
    const session = neo4jService.createSession()
    try {
      // 将搜索词按空格分割，支持多关键词搜索
      const keywords = query.trim().split(/\s+/).filter(Boolean)

      let cypher = ''

      if (keywords.length > 1) {
        // 多关键词搜索：查找同时匹配多个关键词的节点
        cypher = `
          MATCH (n)
          WHERE (n:Fish OR n:Family OR n:Genus OR n:Order OR n:Region)
          AND ALL(keyword IN $keywords WHERE
            toLower(n.name) CONTAINS toLower(keyword)
            OR toLower(coalesce(n.region, '')) CONTAINS toLower(keyword)
            OR toLower(coalesce(n.introduction, '')) CONTAINS toLower(keyword)
            OR ANY(label IN labels(n) WHERE toLower(label) CONTAINS toLower(keyword))
          )
        `
      } else {
        // 单关键词搜索
        cypher = `
          MATCH (n)
          WHERE (n:Fish OR n:Family OR n:Genus OR n:Order OR n:Region)
          AND (
            toLower(n.name) CONTAINS toLower($query)
            OR toLower(coalesce(n.region, '')) CONTAINS toLower($query)
            OR toLower(coalesce(n.introduction, '')) CONTAINS toLower($query)
            OR ANY(label IN labels(n) WHERE toLower(label) CONTAINS toLower($query))
          )
        `
      }

      // 如果指定了节点类型，添加类型过滤
      if (label) {
        cypher += ` AND n:${label}`
      }

      // 获取匹配节点及其相关节点
      cypher += `
        WITH n
        OPTIONAL MATCH (n)-[r]-(related)
        WHERE type(r) IN ['BELONGS_TO_FAMILY', 'BELONGS_TO_GENUS', 'BELONGS_TO_ORDER', 'LOCATED_IN']
        WITH n, related, r
        LIMIT 100
        RETURN COLLECT(DISTINCT {
          id: toString(id(n)),
          name: CASE
            WHEN n:Region THEN n.region
            ELSE n.name
          END,
          label: labels(n)[0],
          properties: n
        }) + COLLECT(DISTINCT {
          id: toString(id(related)),
          name: CASE
            WHEN related:Region THEN related.region
            ELSE related.name
          END,
          label: labels(related)[0],
          properties: related
        }) as nodes,
        COLLECT(DISTINCT {
          source: toString(id(startNode(r))),
          target: toString(id(endNode(r))),
          type: type(r)
        }) as relationships
      `

      const result = await session.run(cypher, keywords.length > 1 ? { keywords } : { query })

      const data = result.records[0]
      return {
        nodes: data.get('nodes') as NodeWithPosition[],
        relationships: data.get('relationships') as LinkWithPosition[],
      }
    } finally {
      await session.close()
    }
  }

  // 通过多个类型搜索节点
  async searchNodesByTypes(types: string[]) {
    const session = neo4jService.createSession()
    try {
      const cypher = `
        MATCH (n)
        WHERE ALL(type IN $types WHERE n:${type})
        WITH n
        OPTIONAL MATCH (n)-[r]-(related)
        WHERE type(r) IN ['BELONGS_TO_FAMILY', 'BELONGS_TO_GENUS', 'BELONGS_TO_ORDER', 'LOCATED_IN']
        WITH n, related, r
        LIMIT 100
        RETURN COLLECT(DISTINCT {
          id: toString(id(n)),
          name: CASE
            WHEN n:Region THEN n.region
            ELSE n.name
          END,
          label: labels(n)[0],
          properties: n
        }) + COLLECT(DISTINCT {
          id: toString(id(related)),
          name: CASE
            WHEN related:Region THEN related.region
            ELSE related.name
          END,
          label: labels(related)[0],
          properties: related
        }) as nodes,
        COLLECT(DISTINCT {
          source: toString(id(startNode(r))),
          target: toString(id(endNode(r))),
          type: type(r)
        }) as relationships
      `

      const result = await session.run(cypher, { types })
      const data = result.records[0]
      return {
        nodes: data.get('nodes') as NodeWithPosition[],
        relationships: data.get('relationships') as LinkWithPosition[],
      }
    } finally {
      await session.close()
    }
  }
}

export const graphService = new GraphService()

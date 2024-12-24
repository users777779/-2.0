import { neo4jService } from './neo4jService'
import type { NodeWithPosition } from '@/types/graph'

interface QAResponse {
  answer: string
  relatedNodes: NodeWithPosition[]
}

class QAService {
  private async searchRelatedNodes(question: string): Promise<NodeWithPosition[]> {
    const session = neo4jService.createSession()
    try {
      // 首先尝试使用全文索引搜索
      try {
        const result = await session.run(
          `
          CALL db.index.fulltext.queryNodes("nodeFulltext", $question)
          YIELD node, score
          WHERE score > 0
          WITH node, score
          OPTIONAL MATCH (node)-[r]-(related)
          WHERE related.name IS NOT NULL AND related.name <> 'Unnamed Node'
          WITH node, score, collect(DISTINCT related) as relatedNodes
          RETURN DISTINCT
            node,
            score,
            size(relatedNodes) as relatedCount
          ORDER BY score DESC, relatedCount DESC
          LIMIT 5
          `,
          { question },
        )

        const nodes = result.records.map((record) => ({
          id: record.get('node').identity.low,
          name: record.get('node').properties.name,
          label: record.get('node').labels[0],
          properties: record.get('node').properties,
          x: 0,
          y: 0,
          searchScore: record.get('score'),
        }))

        if (nodes.length > 0) {
          return nodes
        }
      } catch (error) {
        console.warn('全文索引搜索失败，使用备用搜索方法:', error)
      }

      // 如果全文索引搜索失败或没有结果，使用模糊匹配搜索
      const fallbackResult = await session.run(
        `
        MATCH (n)
        WHERE n.name IS NOT NULL
        AND n.name <> 'Unnamed Node'
        AND (
          toLower(n.name) CONTAINS toLower($searchTerm)
          OR
          ANY(prop IN keys(n) WHERE
            prop <> 'name'
            AND toString(n[prop]) CONTAINS toLower($searchTerm)
          )
        )
        WITH n,
          CASE
            WHEN toLower(n.name) CONTAINS toLower($searchTerm) THEN 2
            ELSE 1
          END as score
        OPTIONAL MATCH (n)-[r]-(related)
        WHERE related.name IS NOT NULL AND related.name <> 'Unnamed Node'
        WITH n, score, collect(DISTINCT related) as relatedNodes
        RETURN DISTINCT
          n as node,
          score,
          size(relatedNodes) as relatedCount
        ORDER BY score DESC, relatedCount DESC
        LIMIT 5
        `,
        { searchTerm: question },
      )

      return fallbackResult.records.map((record) => ({
        id: record.get('node').identity.low,
        name: record.get('node').properties.name,
        label: record.get('node').labels[0],
        properties: record.get('node').properties,
        x: 0,
        y: 0,
        searchScore: record.get('score'),
      }))
    } finally {
      await session.close()
    }
  }

  private async getNodeContext(nodeIds: number[]): Promise<string> {
    if (!nodeIds.length) return ''

    const session = neo4jService.createSession()
    try {
      const result = await session.run(
        `
        MATCH (n)
        WHERE id(n) IN $nodeIds
        OPTIONAL MATCH (n)-[r]-(m)
        WHERE m.name IS NOT NULL AND m.name <> 'Unnamed Node'
        WITH n,
             collect(DISTINCT type(r) + ': ' + m.name) as relations,
             n.description as description,
             n.characteristics as characteristics,
             n.habitat as habitat
        RETURN n.name as name,
               description,
               characteristics,
               habitat,
               relations
        `,
        { nodeIds: nodeIds.map((id) => neo4j.int(id)) },
      )

      return result.records
        .map((record) => {
          const name = record.get('name')
          const description = record.get('description')
          const characteristics = record.get('characteristics')
          const habitat = record.get('habitat')
          const relations = record.get('relations')

          let context = `节点名称: ${name}\n`
          if (description) context += `描述: ${description}\n`
          if (characteristics) context += `特征: ${characteristics}\n`
          if (habitat) context += `栖息地: ${habitat}\n`
          if (relations.length) context += `关系: ${relations.join(', ')}\n`

          return context
        })
        .join('\n\n')
    } finally {
      await session.close()
    }
  }

  async ask(question: string): Promise<QAResponse> {
    try {
      // 1. 搜索相关节点
      const relatedNodes = await this.searchRelatedNodes(question)

      // 2. 获取节点上下文
      const context = await this.getNodeContext(relatedNodes.map((node) => node.id))

      // 3. 构建提示词
      const prompt = `
基于以下知识图谱中的信息回答问题。如果无法回答,请说明原因。

知识背景:
${context}

问题: ${question}

请用简洁专业的语言回答,并在适当的时候引用具体的数据来源。
`
      // 4. 调用智谱API获取回答
      const response = await fetch(
        'https://open.bigmodel.cn/api/paas/v3/model-api/chatglm_turbo/invoke',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_ZHIPU_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'chatglm_turbo',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            top_p: 0.9,
            request_id: Date.now().toString(),
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`智谱API调用失败: ${errorData.msg || response.statusText}`)
      }

      const data = await response.json()

      if (!data.data || !data.data.choices || !data.data.choices[0]) {
        throw new Error('智谱API返回数据格式错误')
      }

      return {
        answer: data.data.choices[0].content,
        relatedNodes,
      }
    } catch (error) {
      console.error('问答失败:', error)
      if (error instanceof Error) {
        throw new Error(`问答失败: ${error.message}`)
      } else {
        throw new Error('问答失败: 未知错误')
      }
    }
  }
}

export const qaService = new QAService()

// 图谱控制器
import { Request, Response } from 'express'
import { GraphService } from '../services/graphService'

export class GraphController {
  private graphService: GraphService

  constructor() {
    this.graphService = new GraphService()
  }

  // 获取图谱数据
  async getGraphData(req: Request, res: Response) {
    try {
      const { limit, offset, labels } = req.query
      const data = await this.graphService.getGraphData({
        limit: Number(limit),
        offset: Number(offset),
        labels: labels as string[],
      })
      res.json(data)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  // 搜索节点
  async searchNodes(req: Request, res: Response) {
    try {
      const { query, type } = req.query
      const results = await this.graphService.searchNodes(String(query), String(type))
      res.json(results)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  // 获取节点详情
  async getNodeDetails(req: Request, res: Response) {
    try {
      const { id } = req.params
      const nodeId = Number(id)

      if (isNaN(nodeId)) {
        return res.status(400).json({ error: 'Invalid node ID' })
      }

      const result = await this.graphService.getNodeWithRelations(nodeId)

      if (!result || !result[0]?.result) {
        return res.status(404).json({ error: 'Node not found' })
      }

      res.json(result)
    } catch (error: any) {
      console.error('Error getting node details:', error)
      res.status(500).json({
        error: 'Failed to get node details',
        message: error.message,
      })
    }
  }

  // 获取节点关系类型
  async getNodeRelationshipTypes(req: Request, res: Response) {
    try {
      const { id } = req.params
      const types = await this.graphService.getNodeRelationshipTypes(Number(id))
      res.json(types)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }

  // 按类型获取相关节点
  async getRelatedNodesByType(req: Request, res: Response) {
    try {
      const { id, type } = req.params
      const nodes = await this.graphService.getRelatedNodesByType(Number(id), type)
      res.json(nodes)
    } catch (error: any) {
      res.status(500).json({ error: error.message })
    }
  }
}

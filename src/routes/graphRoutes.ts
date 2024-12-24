import { Router } from 'express'
import { GraphController } from '../controllers/graphController'

const router = Router()
const controller = new GraphController()

// 获取图谱数据
router.get('/graph', controller.getGraphData.bind(controller))

// 搜索节点
router.get('/search', controller.searchNodes.bind(controller))

// 获取节点详情
router.get('/nodes/:id', controller.getNodeDetails.bind(controller))

// 获取相关节点
router.get('/nodes/:id/related', controller.getRelatedNodes.bind(controller))

// 获取节点关系类型
router.get('/nodes/:id/relationship-types', controller.getNodeRelationshipTypes.bind(controller))

// 按类型获取相关节点
router.get('/nodes/:id/related/:type', controller.getRelatedNodesByType.bind(controller))

export default router

import express from 'express'
import cors from 'cors'
import { config } from './config'
import graphRoutes from './routes/graphRoutes'
import { errorHandler } from './middleware/errorHandler'

const app = express()

// 中间件
app.use(cors(config.server.cors))
app.use(express.json())

// 路由
app.use('/api', graphRoutes)

// 错误处理
app.use(errorHandler)

// 启动服务器
app.listen(config.server.port, () => {
  console.log(`Server running on port ${config.server.port}`)
})

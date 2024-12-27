# 项目架构图

```mermaid
graph TB
    subgraph API[API层]
        DB[(数据库)]
        DISK1[(存储1)]
        DISK2[(存储2)]
        SERVER[服务器]
    end

    subgraph Frontend[前端层]
        UI[用户界面]
        ROUTER[路由器]
        STORE[存储]
        COMPONENTS[组件]
    end

    subgraph Services[服务层]
        NEO4J[Neo4j服务]
        QA[问答服务]
        GRAPH[图形服务]
    end

    %% 连接关系
    DB --> SERVER
    DISK1 --> SERVER
    DISK2 --> DB
    UI --> ROUTER
    UI --> STORE
    UI --> COMPONENTS
    SERVER --> NEO4J
    SERVER --> QA
    SERVER --> GRAPH
    UI --> SERVER

    %% 样式定义
    classDef api fill:#f9f,stroke:#333,stroke-width:2px
    classDef frontend fill:#bbf,stroke:#333,stroke-width:2px
    classDef services fill:#bfb,stroke:#333,stroke-width:2px

    class API api
    class Frontend frontend
    class Services services
```

## 架构说明

1. **API层**

   - 数据库：负责数据持久化
   - 存储服务：提供文件存储功能
   - 服务器：处理API请求

2. **前端层**

   - 用户界面：Vue组件和视图
   - 路由器：Vue Router路由管理
   - 存储：Pinia状态管理
   - 组件：可复用的Vue组件

3. **服务层**
   - Neo4j服务：图数据库交互
   - 问答服务：处理QA相关功能
   - 图形服务：知识图谱管理

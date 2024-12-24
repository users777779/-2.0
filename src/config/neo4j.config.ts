export const neo4jConfig = {
  uri: import.meta.env.VITE_NEO4J_URI || 'neo4j://localhost:7689',
  username: import.meta.env.VITE_NEO4J_USERNAME || 'neo4j',
  password: import.meta.env.VITE_NEO4J_PASSWORD || 'Zjh165619.',
  database: import.meta.env.VITE_NEO4J_DATABASE || 'neo4j',
  options: {
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3小时
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 30000, // 30秒
    logging: {
      level: 'warn', // 设置日志级别
    },
  },
}

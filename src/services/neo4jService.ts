// Neo4j 服务
import neo4j, { Driver, Session } from 'neo4j-driver'

class Neo4jService {
  private driver: Driver | null = null

  async connect() {
    try {
      this.driver = neo4j.driver(
        'neo4j://localhost:7689',
        neo4j.auth.basic('neo4j', 'Zjh165619.'),
        {
          maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
          maxConnectionPoolSize: 50,
          connectionAcquisitionTimeout: 30000, // 30 seconds
        },
      )
      await this.driver.verifyConnectivity()
      console.log('Connected to Neo4j')
    } catch (error) {
      console.error('Neo4j connection error:', error)
      throw error
    }
  }

  createSession(): Session {
    if (!this.driver) {
      throw new Error('Driver not initialized. Call connect() first.')
    }
    return this.driver.session()
  }

  async close() {
    await this.driver?.close()
  }
}

export const neo4jService = new Neo4jService()

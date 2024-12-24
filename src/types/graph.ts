import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3'

export type NodeLabel = 'Fish' | 'Family' | 'Genus' | 'Order' | 'Region'

export const NODE_LABELS: Record<NodeLabel, string> = {
  Fish: '鱼类',
  Family: '科',
  Genus: '属',
  Order: '目',
  Region: '地区',
}

export interface Node {
  id: string
  name: string
  label: NodeLabel
  properties: Record<string, any>
}

export interface Link {
  source: string
  target: string
  type: string
}

export interface NodeWithPosition extends Node, SimulationNodeDatum {
  x?: number
  y?: number
  vx?: number
  vy?: number
}

export interface LinkWithPosition extends Link, SimulationLinkDatum<NodeWithPosition> {
  source: NodeWithPosition | string
  target: NodeWithPosition | string
}

import dagre from 'dagre'
import { Node, Edge } from '@xyflow/react'

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL'  // Default: 'LR' (left-to-right)
  nodeWidth?: number  // Default: 250
  nodeHeight?: number  // Default: 100
  rankSep?: number  // Vertical spacing between ranks (default: 100)
  nodeSep?: number  // Horizontal spacing between nodes (default: 80)
}

const defaultOptions: Required<LayoutOptions> = {
  direction: 'LR',
  nodeWidth: 250,
  nodeHeight: 100,
  rankSep: 100,
  nodeSep: 80,
}

/**
 * Apply dagre auto-layout to React Flow nodes and edges
 * Default direction is left-to-right (LR) for workflow visualization
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...defaultOptions, ...options }

  // Create a new directed graph
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))

  // Set graph layout options
  graph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
  })

  // Add nodes to the graph
  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    })
  })

  // Add edges to the graph
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(graph)

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id)

    return {
      ...node,
      position: {
        // Dagre places nodes from center, React Flow from top-left
        // Adjust position to account for this
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

/**
 * Get node dimensions based on node type
 * Used for calculating appropriate layout spacing
 */
export function getNodeDimensions(nodeType: string): { width: number; height: number } {
  switch (nodeType) {
    case 'triggerEventNode':
      return { width: 200, height: 80 }
    case 'requestTypeBranchNode':
      return { width: 180, height: 120 }
    case 'conditionNode':
      return { width: 300, height: 120 }
    case 'logicNode':
      return { width: 100, height: 60 }
    case 'actionNode':
      return { width: 280, height: 100 }
    case 'createTaskNode':
      return { width: 300, height: 140 }
    case 'transferNode':
      return { width: 250, height: 80 }
    case 'createProgramNode':
      return { width: 250, height: 80 }
    case 'tatCalculationNode':
      return { width: 320, height: 180 }
    default:
      return { width: 250, height: 100 }
  }
}

/**
 * Apply auto-layout with adaptive node sizing
 * Calculates appropriate dimensions for each node type
 */
export function getAdaptiveLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...defaultOptions, ...options }

  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))

  graph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
  })

  // Add nodes with adaptive dimensions
  nodes.forEach((node) => {
    const dimensions = getNodeDimensions(node.type || 'default')
    graph.setNode(node.id, {
      width: dimensions.width,
      height: dimensions.height,
    })
  })

  // Add edges
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target)
  })

  // Calculate layout
  dagre.layout(graph)

  // Apply positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = graph.node(node.id)
    const dimensions = getNodeDimensions(node.type || 'default')

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

/**
 * Calculate optimal zoom level to fit all nodes in viewport
 */
export function calculateFitZoom(
  nodes: Node[],
  viewportWidth: number,
  viewportHeight: number,
  padding: number = 50
): number {
  if (nodes.length === 0) return 1

  // Find bounding box of all nodes
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  nodes.forEach((node) => {
    const dimensions = getNodeDimensions(node.type || 'default')
    minX = Math.min(minX, node.position.x)
    minY = Math.min(minY, node.position.y)
    maxX = Math.max(maxX, node.position.x + dimensions.width)
    maxY = Math.max(maxY, node.position.y + dimensions.height)
  })

  const contentWidth = maxX - minX
  const contentHeight = maxY - minY

  const zoomX = (viewportWidth - padding * 2) / contentWidth
  const zoomY = (viewportHeight - padding * 2) / contentHeight

  // Use the smaller zoom to ensure everything fits
  return Math.min(zoomX, zoomY, 1) // Cap at 1 (100%)
}

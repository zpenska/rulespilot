import { useCallback, useMemo, useRef, DragEvent } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  EdgeChange,
  NodeChange,
  useReactFlow,
  ReactFlowProvider,
  ConnectionLineType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Rule } from '../types/rules'
import { ruleToNodes } from '../utils/ruleFlowConverter'
import { getAdaptiveLayoutedElements } from '../utils/autoLayout'
import ConditionNode from './flow/ConditionNode'
import LogicNode from './flow/LogicNode'
import ActionNode from './flow/ActionNode'
import TATCalculationNode from './flow/TATCalculationNode'
import TriggerEventNode from './flow/TriggerEventNode'
import RequestTypeBranchNode from './flow/RequestTypeBranchNode'
import NodePalette from './flow/NodePalette'

interface RuleFlowBuilderProps {
  rule: Partial<Rule>
  onNodesChange?: (nodes: Node[], edges: Edge[]) => void
}

function RuleFlowBuilderInner({ rule, onNodesChange }: RuleFlowBuilderProps) {
  // Convert rule to nodes and apply auto-layout
  const initialFlow = useMemo(() => {
    const flow = ruleToNodes(rule)
    // Apply left-to-right auto-layout with dagre
    return getAdaptiveLayoutedElements(flow.nodes, flow.edges, {
      direction: 'LR',  // Left-to-right
      rankSep: 150,      // Horizontal spacing between ranks
      nodeSep: 100,      // Vertical spacing between nodes in same rank
    })
  }, [rule])

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialFlow.nodes)
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialFlow.edges)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  // Custom node types
  const nodeTypes = useMemo(
    () => ({
      conditionNode: ConditionNode,
      logicNode: LogicNode,
      actionNode: ActionNode,
      tatCalculationNode: TATCalculationNode,
      triggerEventNode: TriggerEventNode,
      requestTypeBranchNode: RequestTypeBranchNode,
    }),
    []
  )

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
      if (onNodesChange) {
        onNodesChange(nodes, edges)
      }
    },
    [nodes, edges, onNodesChange, setEdges]
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      onNodesChangeInternal(changes)
      if (onNodesChange) {
        // Notify parent of node changes
        onNodesChange(nodes, edges)
      }
    },
    [onNodesChangeInternal, onNodesChange, nodes, edges]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChangeInternal(changes)
      if (onNodesChange) {
        onNodesChange(nodes, edges)
      }
    },
    [onEdgesChangeInternal, onNodesChange, nodes, edges]
  )

  const onDragStart = (event: DragEvent, nodeType: string, nodeData: Record<string, unknown> = {}) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType, ...nodeData })
    )
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const data = event.dataTransfer.getData('application/reactflow')
      if (!data) return

      const { nodeType, ...nodeData } = JSON.parse(data)

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: nodeData,
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [screenToFlowPosition, setNodes]
  )

  return (
    <div className="h-full w-full bg-bg-light flex">
      {/* Node Palette Sidebar */}
      <NodePalette onDragStart={onDragStart} />

      {/* React Flow Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={{
            type: 'default',
            animated: true,
            style: { stroke: '#5c4bd3', strokeWidth: 2 },
          }}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1, minZoom: 0.1 }}
          className="bg-bg-light"
        >
          <Background color="#e1e1e6" gap={16} />
          <Controls className="bg-white border border-table-border rounded-lg shadow-sm" />
        </ReactFlow>
      </div>
    </div>
  )
}

export default function RuleFlowBuilder(props: RuleFlowBuilderProps) {
  return (
    <ReactFlowProvider>
      <RuleFlowBuilderInner {...props} />
    </ReactFlowProvider>
  )
}

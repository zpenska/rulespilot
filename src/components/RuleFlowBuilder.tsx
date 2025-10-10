import { useCallback, useMemo, useRef, DragEvent, useState } from 'react'
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
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Rule } from '../types/rules'
import { ruleToNodes } from '../utils/ruleFlowConverter'
import { FIELD_DEFINITIONS, FIELD_CATEGORIES } from '../config/fieldDefinitions'
import ConditionNode from './flow/ConditionNode'
import LogicNode from './flow/LogicNode'
import ActionNode from './flow/ActionNode'
import TATCalculationNode from './flow/TATCalculationNode'
import NodePalette from './flow/NodePalette'

interface RuleFlowBuilderProps {
  rule: Partial<Rule>
  onNodesChange?: (nodes: Node[], edges: Edge[]) => void
}

function RuleFlowBuilderInner({ rule, onNodesChange }: RuleFlowBuilderProps) {
  // Convert rule to nodes
  const initialFlow = useMemo(() => ruleToNodes(rule), [rule])

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
    (changes: any) => {
      onNodesChangeInternal(changes)
      if (onNodesChange) {
        // Notify parent of node changes
        onNodesChange(nodes, edges)
      }
    },
    [onNodesChangeInternal, onNodesChange, nodes, edges]
  )

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onEdgesChangeInternal(changes)
      if (onNodesChange) {
        onNodesChange(nodes, edges)
      }
    },
    [onEdgesChangeInternal, onNodesChange, nodes, edges]
  )

  const onDragStart = (event: DragEvent, nodeType: string, nodeData: any = {}) => {
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
          connectionLineType="default"
          defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
          fitView
          fitViewOptions={{ padding: 0.3, maxZoom: 0.75 }}
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

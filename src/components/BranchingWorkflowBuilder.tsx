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
  ConnectionLineType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { X, Save, AlertCircle } from 'lucide-react'
import ConditionNode from './flow/ConditionNode'
import LogicNode from './flow/LogicNode'
import ActionNode from './flow/ActionNode'
import TriggerEventNode from './flow/TriggerEventNode'
import RequestTypeBranchNode from './flow/RequestTypeBranchNode'
import NodePalette from './flow/NodePalette'

interface BranchingWorkflowBuilderProps {
  onClose: () => void
  onSave?: (nodes: Node[], edges: Edge[]) => void
}

function BranchingWorkflowBuilderInner({ onClose, onSave }: BranchingWorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as Edge[])
  const [showSaveWarning, setShowSaveWarning] = useState(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  // Custom node types
  const nodeTypes = useMemo(
    () => ({
      conditionNode: ConditionNode,
      logicNode: LogicNode,
      actionNode: ActionNode,
      triggerEventNode: TriggerEventNode,
      requestTypeBranchNode: RequestTypeBranchNode,
    }),
    []
  )

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
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

      setNodes((nds) => [...nds, newNode])
    },
    [screenToFlowPosition, setNodes]
  )

  const handleSave = () => {
    if (nodes.length === 0) {
      alert('Canvas is empty. Add nodes before saving.')
      return
    }

    // Show warning about implementation
    setShowSaveWarning(true)
  }

  const handleConfirmSave = () => {
    // In a full implementation, this would:
    // 1. Analyze the flow to identify separate rule paths
    // 2. Convert each path to a Rule object
    // 3. Save multiple rules to database
    // For now, just pass to callback
    if (onSave) {
      onSave(nodes, edges)
    }
    setShowSaveWarning(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Branching Workflow Builder</h2>
            <p className="text-sm text-gray-600 mt-1">
              Build multiple rule paths with shared triggers and branches in one canvas
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Flow
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How to build branching workflows:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Drag trigger event and request type nodes from the palette to create shared entry points</li>
                <li>Add condition nodes for each rule's criteria</li>
                <li>Connect nodes to create multiple branching paths</li>
                <li>Add action nodes at the end of each rule path</li>
                <li>Save to create multiple rules from your branching flow</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Main Content - Palette + Canvas */}
        <div className="flex-1 flex overflow-hidden">
          {/* Node Palette Sidebar */}
          <NodePalette onDragStart={onDragStart} />

          {/* React Flow Canvas */}
          <div className="flex-1 bg-bg-light" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
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
              defaultViewport={{ x: 100, y: 100, zoom: 0.75 }}
              fitView
              fitViewOptions={{ padding: 0.2, maxZoom: 1, minZoom: 0.1 }}
              className="bg-bg-light"
            >
              <Background color="#e1e1e6" gap={16} />
              <Controls className="bg-white border border-table-border rounded-lg shadow-sm" />
            </ReactFlow>

            {/* Empty State */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    Start building your branching workflow
                  </p>
                  <p className="text-gray-400 text-sm">
                    Drag nodes from the left palette onto the canvas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">{nodes.length}</span> nodes,{' '}
              <span className="font-medium">{edges.length}</span> connections
            </div>
            <div className="text-xs">
              Tip: Connect trigger → conditions → actions to define rule paths
            </div>
          </div>
        </div>
      </div>

      {/* Save Warning Modal */}
      {showSaveWarning && (
        <div className="fixed inset-0 z-[60] bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Save Branching Flow</h3>
                <p className="text-sm text-gray-600 mb-4">
                  This will analyze your branching flow and create multiple workflow rules based on the
                  paths you've defined. Each complete path from trigger to action will become a separate rule.
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Note:</strong> In this version, the flow will be saved as a template.
                  Full rule generation from branching flows will be available in a future update.
                </p>
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowSaveWarning(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BranchingWorkflowBuilder(props: BranchingWorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <BranchingWorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  )
}

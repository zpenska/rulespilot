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
import { X, Save, AlertCircle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [showInstructions, setShowInstructions] = useState(false)
  const [paletteCollapsed, setPaletteCollapsed] = useState(false)
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
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Compact Header */}
        <div className="px-3 py-1 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-sm font-semibold text-gray-900">Branching Workflow Builder</h2>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Show instructions"
            >
              <HelpCircle className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-xs text-gray-600">
              {nodes.length} nodes, {edges.length} connections
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-1 border border-transparent rounded text-xs font-medium text-white bg-primary hover:bg-primary-hover"
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Collapsible Instructions Popup */}
        {showInstructions && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-[60] bg-blue-50 border-2 border-blue-200 rounded-lg shadow-xl p-4 max-w-2xl">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <h3 className="text-sm font-semibold text-blue-900">How to build branching workflows</h3>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 hover:bg-blue-100 rounded transition-colors"
              >
                <X className="w-3 h-3 text-blue-700" />
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-blue-900">
              <li>Drag trigger event and request type nodes from the palette to create shared entry points</li>
              <li>Add condition nodes for each rule's criteria</li>
              <li>Connect nodes to create multiple branching paths</li>
              <li>Add action nodes at the end of each rule path</li>
              <li>Save to create multiple rules from your branching flow</li>
            </ol>
          </div>
        )}

        {/* Main Content - Palette + Canvas */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Node Palette Sidebar - Collapsible */}
          {!paletteCollapsed && <NodePalette onDragStart={onDragStart} />}

          {/* Collapse/Expand Button */}
          <button
            onClick={() => setPaletteCollapsed(!paletteCollapsed)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-r-md shadow-md hover:bg-gray-50 transition-colors p-1"
            style={{ left: paletteCollapsed ? '0' : '256px' }}
            title={paletteCollapsed ? 'Show palette' : 'Hide palette'}
          >
            {paletteCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>

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

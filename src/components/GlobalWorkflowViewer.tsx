import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  Node,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { X, Info } from 'lucide-react'
import { Rule } from '../types/rules'
import { subscribeToRules } from '../services/rulesService'
import { mergeWorkflowRules, getRuleGroupSummary } from '../utils/mergeWorkflowRules'
import { getAdaptiveLayoutedElements } from '../utils/autoLayout'
import ConditionNode from './flow/ConditionNode'
import LogicNode from './flow/LogicNode'
import ActionNode from './flow/ActionNode'
import TriggerEventNode from './flow/TriggerEventNode'
import RequestTypeBranchNode from './flow/RequestTypeBranchNode'

interface GlobalWorkflowViewerProps {
  onClose: () => void
}

function GlobalWorkflowViewerInner({ onClose }: GlobalWorkflowViewerProps) {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const { fitView } = useReactFlow()

  // Subscribe to workflow rules
  useEffect(() => {
    const unsubscribe = subscribeToRules(
      (updatedRules) => {
        setRules(updatedRules)
        setLoading(false)
      },
      undefined,
      'workflow'
    )

    return () => unsubscribe()
  }, [])

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

  // Merge all rules into unified flow
  const mergedFlow = useMemo(() => {
    if (rules.length === 0) {
      return { nodes: [], edges: [] }
    }

    const merged = mergeWorkflowRules(rules)
    // Apply auto-layout with left-to-right direction
    return getAdaptiveLayoutedElements(merged.nodes, merged.edges, {
      direction: 'LR',
      rankSep: 200,
      nodeSep: 120,
    })
  }, [rules])

  // Get summary stats
  const summary = useMemo(() => getRuleGroupSummary(rules), [rules])

  // Fit view after nodes are rendered
  useEffect(() => {
    if (mergedFlow.nodes.length > 0) {
      // Wait a bit for nodes to render
      setTimeout(() => {
        fitView({ padding: 0.1, maxZoom: 0.8, minZoom: 0.1, duration: 800 })
      }, 100)
    }
  }, [mergedFlow.nodes.length, fitView])

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Clicked node:', node)
    // Future: Highlight entire rule path
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-[98vw] max-h-[98vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Global Workflow View</h2>
            <p className="text-sm text-gray-600 mt-1">
              All {summary.totalRules} workflow rules visualized together
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              {summary.totalRules} Total Rules
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {summary.triggerGroups} Trigger Groups
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
              {summary.requestTypeGroups.inpatient} Inpatient
            </span>
            <span className="text-sm text-gray-600">
              <span className="inline-block w-2 h-2 bg-green-600 rounded-full mr-1"></span>
              {summary.requestTypeGroups.outpatient} Outpatient
            </span>
            <span className="text-sm text-gray-600">
              <span className="inline-block w-2 h-2 bg-amber-600 rounded-full mr-1"></span>
              {summary.requestTypeGroups.any} Any Type
            </span>
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1 bg-bg-light">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading workflows...</p>
              </div>
            </div>
          ) : mergedFlow.nodes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 text-lg">No workflow rules found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Create workflow rules to see them visualized here
                </p>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={mergedFlow.nodes}
              edges={mergedFlow.edges}
              nodeTypes={nodeTypes}
              onNodeClick={handleNodeClick}
              fitView
              fitViewOptions={{ padding: 0.1, maxZoom: 0.8, minZoom: 0.1 }}
              defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
              minZoom={0.05}
              maxZoom={1.5}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              className="bg-bg-light"
            >
              <Background color="#e1e1e6" gap={16} />
              <Controls className="bg-white border border-table-border rounded-lg shadow-sm" />
            </ReactFlow>
          )}
        </div>

        {/* Footer with Legend */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-600">
              <span className="font-medium">Tip:</span> Each color represents a different rule path. Zoom and pan to explore.
            </div>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded border-2 border-purple-300 bg-purple-50"></div>
                <span>Triggers</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded border-2 border-amber-300 bg-amber-50"></div>
                <span>Request Type</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded border-2 border-blue-300 bg-blue-50"></div>
                <span>Conditions</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 rounded border-2 border-green-300 bg-green-50"></div>
                <span>Actions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GlobalWorkflowViewer(props: GlobalWorkflowViewerProps) {
  return (
    <ReactFlowProvider>
      <GlobalWorkflowViewerInner {...props} />
    </ReactFlowProvider>
  )
}

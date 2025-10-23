import { useState, useEffect } from 'react'
import { Save, RotateCcw, X } from 'lucide-react'
import { TATConfig } from '../types/rules'
import { DEFAULT_TAT_CONFIG, TAT_PAUSE_DESCRIPTION } from '../config/tatConfig'
import { getTATConfig, saveTATConfig } from '../services/tatConfigService'
import { getDictionaryOptions } from '../services/dictionaryService'

export default function TATConfigComponent() {
  const [config, setConfig] = useState<TATConfig>(DEFAULT_TAT_CONFIG)
  const [originalConfig, setOriginalConfig] = useState<TATConfig>(DEFAULT_TAT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [statusReasonOptions, setStatusReasonOptions] = useState<Array<{ value: string; label: string }>>([])

  useEffect(() => {
    loadConfig()
    loadStatusReasons()
  }, [])

  useEffect(() => {
    // Check if config has changes from original
    const changed = JSON.stringify(config.pauseStatusReasons.sort()) !== JSON.stringify(originalConfig.pauseStatusReasons.sort())
    setHasChanges(changed)
  }, [config, originalConfig])

  const loadConfig = async () => {
    try {
      const loadedConfig = await getTATConfig()
      setConfig(loadedConfig)
      setOriginalConfig(loadedConfig)
    } catch (error) {
      console.error('Error loading TAT config:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStatusReasons = async () => {
    try {
      const options = await getDictionaryOptions('Outcome_Reason')
      setStatusReasonOptions(options)
    } catch (error) {
      console.error('Error loading status reasons:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveTATConfig(config)
      setOriginalConfig(config)
      setHasChanges(false)
      alert('TAT configuration saved successfully!')
    } catch (error) {
      console.error('Error saving TAT config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to the last saved configuration?')) {
      setConfig(originalConfig)
    }
  }

  const handleToggleReason = (reasonCode: string) => {
    const newReasons = config.pauseStatusReasons.includes(reasonCode)
      ? config.pauseStatusReasons.filter(r => r !== reasonCode)
      : [...config.pauseStatusReasons, reasonCode]

    setConfig({ ...config, pauseStatusReasons: newReasons })
  }

  const handleRemoveReason = (reasonCode: string) => {
    setConfig({
      ...config,
      pauseStatusReasons: config.pauseStatusReasons.filter(r => r !== reasonCode)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading configuration...</div>
      </div>
    )
  }

  return (
    <div className="bg-white border-t border-gray-200">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              TAT Pause Configuration
            </h3>
            <p className="text-sm text-gray-600">
              {TAT_PAUSE_DESCRIPTION}
            </p>
          </div>

          {/* Status Reasons Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Select Status Reasons to Pause TAT Clock
            </h4>

            {/* Selected Reasons as Chips */}
            {config.pauseStatusReasons.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {config.pauseStatusReasons.map(reasonCode => {
                  const reason = statusReasonOptions.find(r => r.value === reasonCode)
                  return (
                    <div
                      key={reasonCode}
                      className="inline-flex items-center bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span className="mr-2">{reason?.label || reasonCode}</span>
                      <button
                        onClick={() => handleRemoveReason(reasonCode)}
                        className="hover:text-teal-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Checkbox List */}
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded p-3 bg-gray-50">
              {statusReasonOptions.map(option => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 p-2 hover:bg-white rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={config.pauseStatusReasons.includes(option.value)}
                    onChange={() => handleToggleReason(option.value)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Count Summary */}
            <div className="mt-3 text-xs text-gray-500">
              {config.pauseStatusReasons.length} status reason{config.pauseStatusReasons.length !== 1 ? 's' : ''} selected
            </div>
          </div>

          {/* Footer with Save/Reset buttons */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {hasChanges && (
                <span className="text-amber-600 font-medium">
                  You have unsaved changes
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                disabled={!hasChanges}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

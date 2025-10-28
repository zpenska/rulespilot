import { useState, useEffect } from 'react'
import { Plus, X, Save, Sparkles } from 'lucide-react'
import { SkillDefinition } from '../types/rules'
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getMedicalCodesFromNaturalLanguage } from '../services/ai/claude'

interface SkillFormProps {
  skill?: SkillDefinition | null
  onClose: () => void
  onSave: () => void
}

export default function SkillForm({ skill, onClose, onSave }: SkillFormProps) {
  const [skillName, setSkillName] = useState('')
  const [description, setDescription] = useState('')
  const [diagnosisInput, setDiagnosisInput] = useState('')
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>([])
  const [serviceInput, setServiceInput] = useState('')
  const [serviceCodes, setServiceCodes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // AI query states
  const [diagnosisAIQuery, setDiagnosisAIQuery] = useState('')
  const [serviceAIQuery, setServiceAIQuery] = useState('')
  const [loadingDiagnosisAI, setLoadingDiagnosisAI] = useState(false)
  const [loadingServiceAI, setLoadingServiceAI] = useState(false)

  useEffect(() => {
    if (skill) {
      setSkillName(skill.skillName)
      setDescription(skill.description)
      setDiagnosisCodes(skill.diagnosisCodes)
      setServiceCodes(skill.serviceCodes)
    }
  }, [skill])

  const handleAddDiagnosisCode = () => {
    const input = diagnosisInput.trim()
    if (!input) return

    // Handle comma-separated codes (e.g., "E11.9, E12.1, E13.0")
    const codes = input.split(',').map(c => c.trim()).filter(Boolean)

    // Process each code (could be a single code or a range)
    const newCodes: string[] = []
    codes.forEach(code => {
      // Check if it's already in the list
      if (!diagnosisCodes.includes(code) && !newCodes.includes(code)) {
        newCodes.push(code)
      }
    })

    if (newCodes.length > 0) {
      setDiagnosisCodes([...diagnosisCodes, ...newCodes])
      setDiagnosisInput('')
    }
  }

  const handleRemoveDiagnosisCode = (code: string) => {
    setDiagnosisCodes(diagnosisCodes.filter(c => c !== code))
  }

  const handleAddServiceCode = () => {
    const input = serviceInput.trim()
    if (!input) return

    // Handle comma-separated codes (e.g., "99213, 99214, 99215")
    const codes = input.split(',').map(c => c.trim()).filter(Boolean)

    // Process each code (could be a single code or a range)
    const newCodes: string[] = []
    codes.forEach(code => {
      // Check if it's already in the list
      if (!serviceCodes.includes(code) && !newCodes.includes(code)) {
        newCodes.push(code)
      }
    })

    if (newCodes.length > 0) {
      setServiceCodes([...serviceCodes, ...newCodes])
      setServiceInput('')
    }
  }

  const handleRemoveServiceCode = (code: string) => {
    setServiceCodes(serviceCodes.filter(c => c !== code))
  }

  const handleDiagnosisAIQuery = async () => {
    if (!diagnosisAIQuery.trim()) return

    setLoadingDiagnosisAI(true)
    try {
      const codes = await getMedicalCodesFromNaturalLanguage(diagnosisAIQuery, 'diagnosis')

      // Filter out codes that are already in the list
      const newCodes = codes.filter(code => !diagnosisCodes.includes(code))

      if (newCodes.length > 0) {
        setDiagnosisCodes([...diagnosisCodes, ...newCodes])
        setDiagnosisAIQuery('')
      } else {
        alert('No new codes found or all suggested codes are already added.')
      }
    } catch (error) {
      console.error('Error getting diagnosis codes from AI:', error)
      alert('Failed to get codes from AI. Please try again.')
    } finally {
      setLoadingDiagnosisAI(false)
    }
  }

  const handleServiceAIQuery = async () => {
    if (!serviceAIQuery.trim()) return

    setLoadingServiceAI(true)
    try {
      const codes = await getMedicalCodesFromNaturalLanguage(serviceAIQuery, 'service')

      // Filter out codes that are already in the list
      const newCodes = codes.filter(code => !serviceCodes.includes(code))

      if (newCodes.length > 0) {
        setServiceCodes([...serviceCodes, ...newCodes])
        setServiceAIQuery('')
      } else {
        alert('No new codes found or all suggested codes are already added.')
      }
    } catch (error) {
      console.error('Error getting service codes from AI:', error)
      alert('Failed to get codes from AI. Please try again.')
    } finally {
      setLoadingServiceAI(false)
    }
  }

  const handleSaveSkill = async () => {
    if (!skillName.trim()) {
      alert('Skill name is required')
      return
    }

    const skillData = {
      skillName: skillName.trim(),
      description: description.trim(),
      diagnosisCodes,
      serviceCodes,
      active: true,
      updatedAt: new Date().toISOString(),
    }

    setSaving(true)
    try {
      if (skill) {
        // Update existing skill
        const skillRef = doc(db, 'skills', skill.id)
        await updateDoc(skillRef, skillData)
      } else {
        // Create new skill
        await addDoc(collection(db, 'skills'), {
          ...skillData,
          createdAt: new Date().toISOString(),
        })
      }
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving skill:', error)
      alert('Error saving skill. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {skill ? 'Edit Skill' : 'Create New Skill'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Create a new skill and map it to relevant diagnoses
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveSkill}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : skill ? 'Update Skill' : 'Add Skill'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="max-w-3xl space-y-6">
          {/* Skill Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Skill Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              placeholder="e.g., Prior Authorization Review"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this skill does..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Map Diagnosis Codes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Map Diagnosis Codes
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Enter single codes, comma-separated codes, or ranges (e.g., "E11.9", "E11.0, E11.1, E11.9", "E11.0-E11.9")
            </p>

            {/* Manual Entry */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={diagnosisInput}
                onChange={(e) => setDiagnosisInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddDiagnosisCode()
                  }
                }}
                placeholder="e.g., E11.9, E12.1, E13.0"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleAddDiagnosisCode}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                title="Add codes manually"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* AI Query */}
            <div className="mb-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <label className="text-sm font-medium text-purple-900">
                  AI-Powered Code Search
                </label>
              </div>
              <p className="text-xs text-purple-700 mb-3">
                Describe what you're looking for in natural language (e.g., "give me all diagnosis codes for heart disease")
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={diagnosisAIQuery}
                  onChange={(e) => setDiagnosisAIQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleDiagnosisAIQuery()
                    }
                  }}
                  placeholder="e.g., all diagnosis codes for diabetes"
                  className="flex-1 px-4 py-2 border border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  disabled={loadingDiagnosisAI}
                />
                <button
                  onClick={handleDiagnosisAIQuery}
                  disabled={loadingDiagnosisAI || !diagnosisAIQuery.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  title="Use AI to find codes"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingDiagnosisAI ? 'Searching...' : 'AI Search'}
                </button>
              </div>
            </div>

            {diagnosisCodes.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                {diagnosisCodes.map((code) => (
                  <div
                    key={code}
                    className="inline-flex items-center bg-blue-100 rounded px-3 py-1.5 text-sm font-medium text-blue-800"
                  >
                    <span>{code}</span>
                    <button
                      onClick={() => handleRemoveDiagnosisCode(code)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Service Codes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Map Service Codes (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Enter single codes, comma-separated codes, or ranges (e.g., "99213", "99213, 99214, 99215", "99213-99215")
            </p>

            {/* Manual Entry */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddServiceCode()
                  }
                }}
                placeholder="e.g., 99213, 99214, 99215"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <button
                onClick={handleAddServiceCode}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                title="Add codes manually"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* AI Query */}
            <div className="mb-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <label className="text-sm font-medium text-purple-900">
                  AI-Powered Code Search
                </label>
              </div>
              <p className="text-xs text-purple-700 mb-3">
                Describe what you're looking for in natural language (e.g., "give me all service codes for office visits")
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serviceAIQuery}
                  onChange={(e) => setServiceAIQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleServiceAIQuery()
                    }
                  }}
                  placeholder="e.g., all CPT codes for physical therapy"
                  className="flex-1 px-4 py-2 border border-purple-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  disabled={loadingServiceAI}
                />
                <button
                  onClick={handleServiceAIQuery}
                  disabled={loadingServiceAI || !serviceAIQuery.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  title="Use AI to find codes"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingServiceAI ? 'Searching...' : 'AI Search'}
                </button>
              </div>
            </div>

            {serviceCodes.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
                {serviceCodes.map((code) => (
                  <div
                    key={code}
                    className="inline-flex items-center bg-green-100 rounded px-3 py-1.5 text-sm font-medium text-green-800"
                  >
                    <span>{code}</span>
                    <button
                      onClick={() => handleRemoveServiceCode(code)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

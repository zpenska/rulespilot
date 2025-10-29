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

type InputMode = 'manual' | 'ai'

export default function SkillForm({ skill, onClose, onSave }: SkillFormProps) {
  const [code, setCode] = useState('')
  const [skillName, setSkillName] = useState('')
  const [description, setDescription] = useState('')
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>([])
  const [serviceCodes, setServiceCodes] = useState<string[]>([])
  const [activationDate, setActivationDate] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [saving, setSaving] = useState(false)

  // Mode states for diagnosis and service inputs
  const [diagnosisMode, setDiagnosisMode] = useState<InputMode>('manual')
  const [serviceMode, setServiceMode] = useState<InputMode>('manual')

  // Input values
  const [diagnosisInput, setDiagnosisInput] = useState('')
  const [serviceInput, setServiceInput] = useState('')

  // Loading states for AI
  const [loadingDiagnosisAI, setLoadingDiagnosisAI] = useState(false)
  const [loadingServiceAI, setLoadingServiceAI] = useState(false)

  useEffect(() => {
    if (skill) {
      setCode(skill.code || '')
      setSkillName(skill.skillName)
      setDescription(skill.description)
      setDiagnosisCodes(skill.diagnosisCodes)
      setServiceCodes(skill.serviceCodes)
      setActivationDate(skill.activationDate || '')
      setExpirationDate(skill.expirationDate || '')
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
    if (!diagnosisInput.trim()) return

    setLoadingDiagnosisAI(true)
    try {
      const codes = await getMedicalCodesFromNaturalLanguage(diagnosisInput, 'diagnosis')

      // Filter out codes that are already in the list
      const newCodes = codes.filter(code => !diagnosisCodes.includes(code))

      if (newCodes.length > 0) {
        setDiagnosisCodes([...diagnosisCodes, ...newCodes])
        setDiagnosisInput('')
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
    if (!serviceInput.trim()) return

    setLoadingServiceAI(true)
    try {
      const codes = await getMedicalCodesFromNaturalLanguage(serviceInput, 'service')

      // Filter out codes that are already in the list
      const newCodes = codes.filter(code => !serviceCodes.includes(code))

      if (newCodes.length > 0) {
        setServiceCodes([...serviceCodes, ...newCodes])
        setServiceInput('')
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
      code: code.trim() || undefined,
      skillName: skillName.trim(),
      description: description.trim(),
      diagnosisCodes,
      serviceCodes,
      activationDate: activationDate || undefined,
      expirationDate: expirationDate || undefined,
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
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {skill ? 'Edit Skill' : 'Create Skill'}
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Map skills to relevant diagnosis and service codes
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
      <div className="flex-1 overflow-auto bg-bg-light">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Basic Information
            </h4>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Skill Code */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Skill Code (Optional)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., SKILL-001"
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>

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

          {/* Active Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Active From
              </label>
              <input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Active Through
              </label>
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
          </div>

          {/* Diagnosis Codes */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Map Diagnosis Codes
            </h4>

          <div>
            {/* Mode Toggle */}
            <div className="flex gap-1 mb-3 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => setDiagnosisMode('manual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  diagnosisMode === 'manual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setDiagnosisMode('ai')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 ${
                  diagnosisMode === 'ai'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                AI Search
              </button>
            </div>

            {/* Single Input Field */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={diagnosisInput}
                onChange={(e) => setDiagnosisInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (diagnosisMode === 'manual') {
                      handleAddDiagnosisCode()
                    } else {
                      handleDiagnosisAIQuery()
                    }
                  }
                }}
                placeholder={
                  diagnosisMode === 'manual'
                    ? 'e.g., E11.9, E12.1, E13.0'
                    : 'e.g., all diagnosis codes for diabetes'
                }
                className={`flex-1 px-4 py-2 border rounded-md focus:ring-2 ${
                  diagnosisMode === 'ai'
                    ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-500'
                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                }`}
                disabled={diagnosisMode === 'ai' && loadingDiagnosisAI}
              />
              {diagnosisMode === 'manual' ? (
                <button
                  onClick={handleAddDiagnosisCode}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                  title="Add codes"
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleDiagnosisAIQuery}
                  disabled={loadingDiagnosisAI || !diagnosisInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  title="Use AI to find codes"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingDiagnosisAI ? 'Searching...' : 'AI Search'}
                </button>
              )}
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500 mb-3">
              {diagnosisMode === 'manual'
                ? 'Enter single codes, comma-separated codes, or ranges (e.g., "E11.9", "E11.0-E11.9")'
                : 'Describe what codes you need in natural language and AI will find them for you'}
            </p>

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
          </div>

          {/* Service Codes */}
          <div className="bg-white rounded-xl shadow-sm border border-table-border p-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
              Map Service Codes (Optional)
            </h4>

          <div>
            {/* Mode Toggle */}
            <div className="flex gap-1 mb-3 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => setServiceMode('manual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  serviceMode === 'manual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Manual Entry
              </button>
              <button
                onClick={() => setServiceMode('ai')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors inline-flex items-center gap-1 ${
                  serviceMode === 'ai'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                AI Search
              </button>
            </div>

            {/* Single Input Field */}
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={serviceInput}
                onChange={(e) => setServiceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (serviceMode === 'manual') {
                      handleAddServiceCode()
                    } else {
                      handleServiceAIQuery()
                    }
                  }
                }}
                placeholder={
                  serviceMode === 'manual'
                    ? 'e.g., 99213, 99214, 99215'
                    : 'e.g., all CPT codes for office visits'
                }
                className={`flex-1 px-4 py-2 border rounded-md focus:ring-2 ${
                  serviceMode === 'ai'
                    ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-500'
                    : 'border-gray-300 focus:border-primary focus:ring-primary'
                }`}
                disabled={serviceMode === 'ai' && loadingServiceAI}
              />
              {serviceMode === 'manual' ? (
                <button
                  onClick={handleAddServiceCode}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                  title="Add codes"
                >
                  <Plus className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleServiceAIQuery}
                  disabled={loadingServiceAI || !serviceInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                  title="Use AI to find codes"
                >
                  <Sparkles className="w-4 h-4" />
                  {loadingServiceAI ? 'Searching...' : 'AI Search'}
                </button>
              )}
            </div>

            {/* Helper Text */}
            <p className="text-xs text-gray-500 mb-3">
              {serviceMode === 'manual'
                ? 'Enter single codes, comma-separated codes, or ranges (e.g., "99213", "99213-99215")'
                : 'Describe what codes you need in natural language and AI will find them for you'}
            </p>

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

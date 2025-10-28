import { useState, useEffect } from 'react'
import { Plus, X, Trash2, Edit2, Search } from 'lucide-react'
import { SkillDefinition } from '../types/rules'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../config/firebase'

export default function SkillsManager() {
  const [skills, setSkills] = useState<SkillDefinition[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  // Form state
  const [skillName, setSkillName] = useState('')
  const [description, setDescription] = useState('')
  const [diagnosisInput, setDiagnosisInput] = useState('')
  const [diagnosisCodes, setDiagnosisCodes] = useState<string[]>([])
  const [serviceInput, setServiceInput] = useState('')
  const [serviceCodes, setServiceCodes] = useState<string[]>([])

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const skillsRef = collection(db, 'skills')
      const snapshot = await getDocs(skillsRef)
      const skillsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SkillDefinition[]
      setSkills(skillsList)
    } catch (error) {
      console.error('Error loading skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (skill?: SkillDefinition) => {
    if (skill) {
      setEditingSkill(skill)
      setSkillName(skill.skillName)
      setDescription(skill.description)
      setDiagnosisCodes(skill.diagnosisCodes)
      setServiceCodes(skill.serviceCodes)
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const resetForm = () => {
    setEditingSkill(null)
    setSkillName('')
    setDescription('')
    setDiagnosisInput('')
    setDiagnosisCodes([])
    setServiceInput('')
    setServiceCodes([])
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    resetForm()
  }

  const handleAddDiagnosisCode = () => {
    const code = diagnosisInput.trim()
    if (code && !diagnosisCodes.includes(code)) {
      setDiagnosisCodes([...diagnosisCodes, code])
      setDiagnosisInput('')
    }
  }

  const handleRemoveDiagnosisCode = (code: string) => {
    setDiagnosisCodes(diagnosisCodes.filter(c => c !== code))
  }

  const handleAddServiceCode = () => {
    const code = serviceInput.trim()
    if (code && !serviceCodes.includes(code)) {
      setServiceCodes([...serviceCodes, code])
      setServiceInput('')
    }
  }

  const handleRemoveServiceCode = (code: string) => {
    setServiceCodes(serviceCodes.filter(c => c !== code))
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

    try {
      if (editingSkill) {
        // Update existing skill
        const skillRef = doc(db, 'skills', editingSkill.id)
        await updateDoc(skillRef, skillData)
      } else {
        // Create new skill
        await addDoc(collection(db, 'skills'), {
          ...skillData,
          createdAt: new Date().toISOString(),
        })
      }
      await loadSkills()
      handleCloseDialog()
    } catch (error) {
      console.error('Error saving skill:', error)
      alert('Error saving skill. Please try again.')
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return

    try {
      await deleteDoc(doc(db, 'skills', skillId))
      await loadSkills()
    } catch (error) {
      console.error('Error deleting skill:', error)
      alert('Error deleting skill. Please try again.')
    }
  }

  const filteredSkills = skills.filter(skill =>
    skill.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 flex flex-col bg-bg-light">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-table-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Skills Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage skills and map them to diagnosis and service codes</p>
          </div>
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Skill
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Skills Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg font-medium">No skills found</p>
            <p className="text-sm mt-2">Click "Add New Skill" to create your first skill</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-table-border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Skill Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis Codes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Codes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSkills.map((skill) => (
                  <tr key={skill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{skill.skillName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{skill.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {skill.diagnosisCodes.length === 0 ? (
                          <span className="text-sm text-gray-400">None</span>
                        ) : (
                          skill.diagnosisCodes.map((code) => (
                            <span
                              key={code}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {code}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {skill.serviceCodes.length === 0 ? (
                          <span className="text-sm text-gray-400">None</span>
                        ) : (
                          skill.serviceCodes.map((code) => (
                            <span
                              key={code}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                            >
                              {code}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenDialog(skill)}
                        className="text-primary hover:text-primary-hover mr-4"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Skill Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleCloseDialog} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-6 py-5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingSkill ? 'Edit Skill' : 'Add New Skill'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Create a new skill and map it to relevant diagnoses
                    </p>
                  </div>
                  <button onClick={handleCloseDialog} className="text-gray-400 hover:text-gray-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
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

                  {/* Map Diagnoses */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Map Diagnoses
                    </label>
                    <div className="flex gap-2 mb-2">
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
                        placeholder="Diagnosis Code (e.g., E11.9)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                      <button
                        onClick={handleAddDiagnosisCode}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                  </div>

                  {/* Map Service Codes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Map Service Codes (Optional)
                    </label>
                    <div className="flex gap-2 mb-2">
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
                        placeholder="Service Code (e.g., 99213)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      />
                      <button
                        onClick={handleAddServiceCode}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                  </div>
                </div>

                {/* Dialog Actions */}
                <div className="mt-8 flex items-center justify-end space-x-3">
                  <button
                    onClick={handleCloseDialog}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSkill}
                    className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-md"
                  >
                    {editingSkill ? 'Update Skill' : 'Add Skill'}
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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, Edit2, Power, PowerOff } from 'lucide-react'
import { SkillDefinition } from '../types/rules'
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

type TabFilter = 'all' | 'active' | 'inactive'

export default function SkillsManager() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState<SkillDefinition[]>([])
  const [filteredSkills, setFilteredSkills] = useState<SkillDefinition[]>([])
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSkills()
  }, [])

  useEffect(() => {
    // Filter skills based on active tab and search term
    let filtered = skills

    if (activeTab === 'active') {
      filtered = filtered.filter((s) => s.active)
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter((s) => !s.active)
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((s) =>
        s.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.diagnosisCodes.some(code => code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.serviceCodes.some(code => code.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredSkills(filtered)
  }, [skills, activeTab, searchTerm])

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

  const handleToggleStatus = async (skill: SkillDefinition) => {
    try {
      const skillRef = doc(db, 'skills', skill.id)
      await updateDoc(skillRef, {
        active: !skill.active,
        updatedAt: new Date().toISOString(),
      })
      await loadSkills()
    } catch (error) {
      console.error('Error toggling skill status:', error)
      alert('Error updating skill status. Please try again.')
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

  const activeCount = skills.filter((s) => s.active).length
  const inactiveCount = skills.filter((s) => !s.active).length

  return (
    <div className="bg-white rounded-b-xl px-3 py-4">
      {/* Filter Tabs and Search */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => setActiveTab('all')}
          className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium border-r border-gray-300 ${
            activeTab === 'all'
              ? 'bg-primary-light text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>All</span>
          <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
            activeTab === 'all' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
          }`}>
            {skills.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium border-r border-gray-300 ${
            activeTab === 'active'
              ? 'bg-primary-light text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>Active</span>
          <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
            activeTab === 'active' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
          }`}>
            {activeCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('inactive')}
          className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium ${
            activeTab === 'inactive'
              ? 'bg-primary-light text-gray-900'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>Inactive</span>
          <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
            activeTab === 'inactive' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-700'
          }`}>
            {inactiveCount}
          </span>
        </button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name, Code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-primary focus:border-primary w-64"
            />
          </div>
        </div>
      </div>

      {/* Table Container */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-gray-200 rounded-lg">
          <div className="text-center">
            <p className="text-gray-500">No skills found</p>
            {!searchTerm && activeTab === 'all' && (
              <button
                onClick={() => navigate('/skills/new')}
                className="mt-4 text-primary hover:text-primary-hover"
              >
                Create your first skill
              </button>
            )}
            {searchTerm && (
              <p className="text-sm mt-2">Try adjusting your search</p>
            )}
            {!searchTerm && activeTab !== 'all' && (
              <p className="text-sm mt-2">No {activeTab} skills found</p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-table-border bg-white shadow-sm overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(skill)}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        skill.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {skill.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleToggleStatus(skill)}
                        className={`p-1.5 rounded ${
                          skill.active
                            ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                        title={skill.active ? 'Deactivate' : 'Activate'}
                      >
                        {skill.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => navigate(`/skills/edit/${skill.id}`)}
                        className="text-primary hover:text-primary-hover p-1.5 rounded hover:bg-primary-light"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

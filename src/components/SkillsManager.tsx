import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, Power, PowerOff, MoreVertical } from 'lucide-react'
import { SkillDefinition } from '../types/rules'
import { collection, getDocs, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../config/firebase'

type TabFilter = 'all' | 'active' | 'inactive'

export default function SkillsManager() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState<SkillDefinition[]>([])
  const [filteredSkills, setFilteredSkills] = useState<SkillDefinition[]>([])
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  useEffect(() => {
    loadSkills()
  }, [])

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isButtonClick = Object.values(buttonRefs.current).some(
        (btn) => btn && btn.contains(event.target as Node)
      )

      if (!isButtonClick && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
        setDropdownPosition(null)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

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
        s.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleSelectAll = () => {
    if (selectedSkills.size === filteredSkills.length) {
      setSelectedSkills(new Set())
    } else {
      setSelectedSkills(new Set(filteredSkills.map((s) => s.id)))
    }
  }

  const handleSelectSkill = (skillId: string) => {
    const newSelected = new Set(selectedSkills)
    if (newSelected.has(skillId)) {
      newSelected.delete(skillId)
    } else {
      newSelected.add(skillId)
    }
    setSelectedSkills(newSelected)
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

  const handleBulkActivate = async () => {
    try {
      const batch = writeBatch(db)
      selectedSkills.forEach((skillId) => {
        const skillRef = doc(db, 'skills', skillId)
        batch.update(skillRef, {
          active: true,
          updatedAt: new Date().toISOString(),
        })
      })
      await batch.commit()
      setSelectedSkills(new Set())
      await loadSkills()
    } catch (error) {
      console.error('Error activating skills:', error)
      alert('Error activating skills. Please try again.')
    }
  }

  const handleBulkDeactivate = async () => {
    try {
      const batch = writeBatch(db)
      selectedSkills.forEach((skillId) => {
        const skillRef = doc(db, 'skills', skillId)
        batch.update(skillRef, {
          active: false,
          updatedAt: new Date().toISOString(),
        })
      })
      await batch.commit()
      setSelectedSkills(new Set())
      await loadSkills()
    } catch (error) {
      console.error('Error deactivating skills:', error)
      alert('Error deactivating skills. Please try again.')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedSkills.size} skills?`)) return

    try {
      const batch = writeBatch(db)
      selectedSkills.forEach((skillId) => {
        const skillRef = doc(db, 'skills', skillId)
        batch.delete(skillRef)
      })
      await batch.commit()
      setSelectedSkills(new Set())
      await loadSkills()
    } catch (error) {
      console.error('Error deleting skills:', error)
      alert('Error deleting skills. Please try again.')
    }
  }

  const handleToggleDropdown = (skillId: string) => {
    if (openDropdown === skillId) {
      setOpenDropdown(null)
      setDropdownPosition(null)
    } else {
      const button = buttonRefs.current[skillId]
      if (button) {
        const rect = button.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 4,
          right: window.innerWidth - rect.right
        })
      }
      setOpenDropdown(skillId)
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

      {/* Bulk Actions */}
      {selectedSkills.size > 0 && (
        <div className="rounded-lg border border-table-border bg-white shadow-sm mb-4">
          <div className="px-6 py-3 flex items-center space-x-2 bg-gray-50 border-b border-table-border">
            <span className="text-xs text-gray-500">
              {selectedSkills.size} selected
            </span>
            <button
              onClick={handleBulkActivate}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
            >
              <Power className="w-3 h-3 mr-1" />
              Activate
            </button>
            <button
              onClick={handleBulkDeactivate}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
            >
              <PowerOff className="w-3 h-3 mr-1" />
              Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading skills...</div>
        </div>
      ) : filteredSkills.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
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
          <table className="w-full divide-y divide-table-border" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '3%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
            </colgroup>
            <thead className="bg-bg-light sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSkills.size === filteredSkills.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                  Code
                </th>
                <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                  Skill Name
                </th>
                <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                  Diagnosis Codes
                </th>
                <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                  Service Codes
                </th>
                <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                  Updated
                </th>
                <th className="px-3 py-2 text-left text-sm font-medium text-table-header">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-table-border">
              {filteredSkills.map((skill) => (
                <tr
                  key={skill.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/skills/edit/${skill.id}`)}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedSkills.has(skill.id)}
                      onChange={() => handleSelectSkill(skill.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleStatus(skill)}
                      className={`inline-flex px-2.5 py-1 text-sm font-medium rounded-md ${
                        skill.active
                          ? 'bg-active-badge-bg text-active-badge-text'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {skill.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                    {skill.code || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                    {skill.skillName}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {skill.description || '-'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-0.5">
                      {skill.diagnosisCodes.length === 0 ? (
                        <span className="text-sm text-gray-400">-</span>
                      ) : skill.diagnosisCodes.length > 3 ? (
                        <>
                          {skill.diagnosisCodes.slice(0, 3).map((code) => (
                            <span
                              key={code}
                              className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-blue-50 text-blue-600"
                            >
                              {code}
                            </span>
                          ))}
                          <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-gray-50 text-gray-600">
                            +{skill.diagnosisCodes.length - 3}
                          </span>
                        </>
                      ) : (
                        skill.diagnosisCodes.map((code) => (
                          <span
                            key={code}
                            className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-blue-50 text-blue-600"
                          >
                            {code}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-0.5">
                      {skill.serviceCodes.length === 0 ? (
                        <span className="text-sm text-gray-400">-</span>
                      ) : skill.serviceCodes.length > 3 ? (
                        <>
                          {skill.serviceCodes.slice(0, 3).map((code) => (
                            <span
                              key={code}
                              className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-green-50 text-green-600"
                            >
                              {code}
                            </span>
                          ))}
                          <span className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-gray-50 text-gray-600">
                            +{skill.serviceCodes.length - 3}
                          </span>
                        </>
                      ) : (
                        skill.serviceCodes.map((code) => (
                          <span
                            key={code}
                            className="inline-flex px-1 py-0.5 rounded text-[10px] font-normal bg-green-50 text-green-600"
                          >
                            {code}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600">
                    {new Date(skill.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                    <button
                      ref={(el) => (buttonRefs.current[skill.id] = el)}
                      onClick={() => handleToggleDropdown(skill.id)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </button>

                    {openDropdown === skill.id && dropdownPosition && (
                      <div
                        ref={dropdownRef}
                        className="fixed w-40 bg-white rounded-md shadow-lg border border-gray-200 z-[9999]"
                        style={{
                          top: `${dropdownPosition.top}px`,
                          right: `${dropdownPosition.right}px`
                        }}
                      >
                        <div className="py-1">
                          <button
                            onClick={() => {
                              navigate(`/skills/edit/${skill.id}`)
                              setOpenDropdown(null)
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <span>Edit</span>
                          </button>
                          <div className="border-t border-gray-100"></div>
                          <button
                            onClick={() => {
                              handleDeleteSkill(skill.id)
                              setOpenDropdown(null)
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
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

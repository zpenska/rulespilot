import { RuleType } from '../types/rules'

interface RuleTypeTabsProps {
  currentTab: RuleType
  onTabChange: (tab: RuleType) => void
}

export default function RuleTypeTabs({ currentTab, onTabChange }: RuleTypeTabsProps) {
  const tabs: { value: RuleType; label: string }[] = [
    { value: 'workflow', label: 'Workflow' },
    { value: 'hints', label: 'Hints' },
    { value: 'skills', label: 'Skills' },
    { value: 'tat', label: 'TAT' },
    { value: 'pullQueue', label: 'Pull Queue' },
  ]

  return (
    <div className="px-6 pt-6 pb-0 bg-bg-light">
      <div className="bg-white rounded-t-lg shadow-sm border border-table-border border-b-0">
        <div className="px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => onTabChange(tab.value)}
                className={`py-4 text-sm font-medium border-b-2 ${
                  currentTab === tab.value
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

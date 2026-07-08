import React from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = ''
}) => {
  return (
    <div className={`flex border-b border-white/5 space-x-4 ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 pb-3.5 pt-1.5 px-1 border-b-2 font-medium text-xs uppercase tracking-wider transition-all cursor-pointer ${
              isActive
                ? 'border-purple-500 text-purple-400 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

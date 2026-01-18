import { useRef, useEffect } from 'react'

type TabValue = 'donuts' | 'berries' | 'results'

interface TabNavigationProps {
  activeTab: TabValue
  onTabChange: (tab: TabValue) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs: { value: TabValue; label: string }[] = [
    { value: 'donuts', label: 'ドーナツ選択' },
    { value: 'berries', label: 'きのみ個数入力' },
    { value: 'results', label: 'レシピ検索結果' },
  ]

  const tabRefs = useRef<Record<TabValue, HTMLButtonElement | null>>({
    donuts: null,
    berries: null,
    results: null,
  })

  // Focus active tab when it changes (for programmatic navigation)
  useEffect(() => {
    // Only focus if document doesn't already have focus on the tab
    const activeButton = tabRefs.current[activeTab]
    if (activeButton && document.activeElement !== activeButton) {
      activeButton.focus({ preventScroll: true })
    }
  }, [activeTab])

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex gap-4" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.value}
            ref={el => { tabRefs.current[tab.value] = el }}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.value}
            aria-controls={`${tab.value}-panel`}
            id={`${tab.value}-tab`}
            tabIndex={activeTab === tab.value ? 0 : -1}
            onClick={() => onTabChange(tab.value)}
            className={`py-2 px-4 border-b-2 font-medium transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-t ${
              activeTab === tab.value
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

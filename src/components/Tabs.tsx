interface TabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
  primaryColor?: string;
}

interface TabsProps {
  tabs: Array<{
    label: string;
    badge?: number;
  }>;
  activeTab: number;
  onTabChange: (index: number) => void;
  primaryColor?: string;
}

export function Tab({ label, isActive, onClick, badge, primaryColor = '#4D3EE0' }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
        isActive ? 'border-b-2' : ''
      }`}
      style={
        isActive
          ? { color: primaryColor, borderBottomColor: primaryColor }
          : { color: '#464F5E' }
      }
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span
          className="px-2 py-0.5 text-xs font-medium rounded-full"
          style={{
            backgroundColor: isActive ? `${primaryColor}20` : '#F3F4F6',
            color: isActive ? '#4D3EE0' : '#6B7280',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export default function Tabs({ tabs, activeTab, onTabChange, primaryColor = '#4D3EE0' }: TabsProps) {
  return (
    <div className="flex gap-4 border-b border-gray-200">
      {tabs.map((tab, index) => (
        <Tab
          key={index}
          label={tab.label}
          isActive={activeTab === index}
          onClick={() => onTabChange(index)}
          badge={tab.badge}
          primaryColor={primaryColor}
        />
      ))}
    </div>
  );
}


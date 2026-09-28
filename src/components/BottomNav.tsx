import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Landmark, 
  Activity,
  Coins,
  Menu 
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useRole } from '../context/RoleContext';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onToggleSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onToggleSidebar
}) => {
  const { t } = useLanguage();
  const { primaryTabs } = useRole();

  const TAB_CONFIG: Record<string, { key: string; icon: React.ComponentType<{ className?: string }> }> = {
    'dashboard': { key: 'nav.dashboard', icon: LayoutDashboard },
    'patients': { key: 'nav.patients', icon: Users },
    'teleconsultation': { key: 'nav.teleconsultation', icon: Stethoscope },
    'outbreak-monitoring': { key: 'nav.outbreakMonitoring', icon: Activity },
    'schemes': { key: 'nav.schemes', icon: Landmark },
    'incentive-claims': { key: 'nav.incentiveClaims', icon: Coins },
  };

  // Pick up to 4 key primary tabs available for this role
  const availableKeys = primaryTabs.filter(tab => TAB_CONFIG[tab]).slice(0, 4);

  const items = availableKeys.map(tab => ({
    id: tab,
    key: TAB_CONFIG[tab].key,
    icon: TAB_CONFIG[tab].icon
  }));

  return (
    <nav 
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex items-center justify-around"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`bottom-nav-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-colors cursor-pointer ${
              isActive ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-teal-700' : 'text-slate-500'}`} />
            <span className="text-[10px] mt-0.5 truncate max-w-[65px]">{t(item.key)}</span>
          </button>
        );
      })}

      <button
        id="bottom-nav-menu"
        onClick={onToggleSidebar}
        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-slate-500 hover:text-slate-900 cursor-pointer"
      >
        <Menu className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">{t('nav.menu', 'Menu')}</span>
      </button>
    </nav>
  );
};


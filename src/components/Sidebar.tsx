import React from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  Droplet, 
  Sparkles, 
  Users, 
  Video, 
  FileText, 
  Activity, 
  Coins, 
  ShieldCheck, 
  Stethoscope,
  Bell, 
  Settings, 
  HelpCircle, 
  Headphones, 
  Heart,
  X
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useRole } from '../context/RoleContext';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  unreadCount
}) => {
  const { t } = useLanguage();
  const { userProfile, primaryTabs } = useRole();

  const ALL_NAV_ITEMS: Record<ActiveTab, { key: string; icon: React.ComponentType<{ className?: string }> }> = {
    'dashboard': { key: 'nav.dashboard', icon: LayoutDashboard },
    'voice-input': { key: 'nav.voiceInput', icon: Mic },
    'blood-donation': { key: 'nav.bloodDonation', icon: Droplet },
    'awareness-content': { key: 'nav.awarenessContent', icon: Sparkles },
    'patients': { key: 'nav.patients', icon: Users },
    'teleconsultation': { key: 'nav.teleconsultation', icon: Stethoscope },
    'health-records': { key: 'nav.healthRecords', icon: FileText },
    'outbreak-monitoring': { key: 'nav.outbreakMonitoring', icon: Activity },
    'incentive-claims': { key: 'nav.incentiveClaims', icon: Coins },
    'misinformation': { key: 'nav.misinformationCheck', icon: ShieldCheck },
    'notifications': { key: 'nav.notifications', icon: Bell },
    'settings': { key: 'nav.settings', icon: Settings },
    'help-support': { key: 'nav.helpSupport', icon: HelpCircle },
    'prescriptions': { key: 'nav.prescriptions', icon: FileText },
  };

  const navItems = primaryTabs
    .filter(tab => ALL_NAV_ITEMS[tab])
    .map(tab => ({
      id: tab,
      key: ALL_NAV_ITEMS[tab].key,
      icon: ALL_NAV_ITEMS[tab].icon,
      badge: tab === 'notifications' ? unreadCount : undefined
    }));

  const handleSelect = (id: ActiveTab) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => handleSelect('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <div className="relative">
                <Heart className="w-5 h-5 fill-white" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
              </div>
            </div>
            <div>
              <div className="font-bold text-slate-900 text-lg leading-tight flex items-center gap-1.5">
                <span>SynCura AI</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">
                  {userProfile.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-snug">
                Autonomous Healthcare System
              </p>
            </div>
          </div>

          <button
            id="close-sidebar-mobile-btn"
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const label = t(item.key);
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => handleSelect(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-teal-800' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>


      </aside>
    </>
  );
};


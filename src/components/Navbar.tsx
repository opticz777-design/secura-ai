import React, { useState } from 'react';
import { 
  Menu, 
  UserCheck, 
  ArrowRightLeft, 
  Bell, 
  ChevronDown, 
  Check, 
  User, 
  LogOut, 
  Sparkles,
  Wifi,
  WifiOff,
  Globe
} from 'lucide-react';
import { Role, NotificationItem } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useRole } from '../context/RoleContext';
import { HEALTH_CENTRES } from '../config/healthCentres';

interface NavbarProps {
  onToggleSidebar: () => void;
  unreadCount: number;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  unreadCount,
  notifications,
  onOpenNotifications
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { role, userProfile, setUser } = useRole();
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left section: Sidebar toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="navbar-hamburger-btn"
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right Section: Role switcher, Sync status, Language Switcher, Notifications & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="hidden xl:inline text-xs font-semibold text-slate-500">
              {t('navbar.role', 'Role')}: <strong className="text-slate-800">{role}</strong>
            </span>
          </div>

          {/* Sync / Offline status indicator */}
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
              isOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to toggle simulated offline sync"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('navbar.onlineSync', 'Online Sync')}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('navbar.offlineMode', 'Offline Mode')}</span>
              </>
            )}
          </button>

          {/* GLOBAL LANGUAGE SWITCHER PILL BUTTON */}
          <div className="relative">
            <button
              id="global-language-switcher-btn"
              onClick={() => {
                setShowLangDropdown(!showLangDropdown);
              }}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200/80 transition-all cursor-pointer shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{language === 'ml' ? 'ML' : 'EN'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Language Dropdown Menu */}
            {showLangDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scale-up">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  {t('navbar.language', 'Language')}
                </div>
                <div className="space-y-1">
                  <button
                    id="lang-option-en"
                    onClick={() => {
                      setLanguage('en');
                      setShowLangDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-colors cursor-pointer ${
                      language === 'en'
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>English</span>
                    {language === 'en' && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>

                  <button
                    id="lang-option-ml"
                    onClick={() => {
                      setLanguage('ml');
                      setShowLangDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-colors cursor-pointer ${
                      language === 'ml'
                        ? 'bg-teal-50 text-teal-900 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>മലയാളം (Malayalam)</span>
                    {language === 'ml' && <Check className="w-4 h-4 text-teal-600 shrink-0" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <button
            id="navbar-notifications-btn"
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            aria-label={t('navbar.viewNotifications', 'View Notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dynamic User Profile Display */}
          <div className="flex items-center gap-2.5 bg-slate-100/70 border border-slate-200/80 px-3 py-1.5 rounded-2xl">
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-600/30 shrink-0"
            />
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">{userProfile.name}</div>
              <div className="text-[11px] text-slate-500 font-medium">{userProfile.title} • {userProfile.center}</div>
            </div>
            
            <button
              onClick={async () => {
                try {
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
                } catch (e) {
                  console.error(e);
                }
                // Even if API fails, clear frontend state
                setUser(null);
              }}
              className="ml-2 p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


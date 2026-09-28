import React, { useState } from 'react';
import { Globe, User, Shield, MapPin } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useRole } from '../../context/RoleContext';

export const SettingsView: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { userProfile } = useRole();
  const [showClearSuccess, setShowClearSuccess] = useState(false);

  const langOptions = [
    { code: 'en' as const, label: 'English' },
    { code: 'ml' as const, label: 'മലയാളം (Malayalam)' },
  ];

  const handleClearCache = () => {
    const confirmClear = window.confirm(
      "Clear local application data?\n\nThis will remove locally stored SynCura AI preferences and temporary application data from this device. Your server-side healthcare records will not be deleted."
    );
    if (confirmClear) {
      // Safely clear keys that are not related to critical preferences if any existed
      // For now, we preserve 'syncura_app_language' to respect the user's preference
      const lang = localStorage.getItem('syncura_app_language');
      localStorage.clear();
      if (lang) {
        localStorage.setItem('syncura_app_language', lang);
      }
      setShowClearSuccess(true);
      setTimeout(() => setShowClearSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <h1 className="text-2xl font-bold text-slate-900">{t('settings.title', 'Application Settings')}</h1>
        <p className="text-sm text-slate-500 mt-1">Configure language and view account profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-teal-600" />
                <span>{t('settings.interfaceLanguage', 'App Interface Language')}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {langOptions.map((opt) => (
                  <button
                    key={opt.code}
                    id={`settings-lang-${opt.code}`}
                    onClick={() => setLanguage(opt.code)}
                    className={`p-3.5 rounded-2xl border font-bold text-center transition-all cursor-pointer ${
                      language === opt.code
                        ? 'bg-teal-700 text-white border-teal-700 shadow-md ring-2 ring-teal-600/30'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-4">
              <div>
                <span className="font-bold text-slate-900 block">Temporary Application Data</span>
                <span className="text-slate-500 mt-0.5 block">Clear local browser cache. Does not affect server data.</span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={handleClearCache}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors font-bold rounded-xl cursor-pointer"
                >
                  Clear Local Data
                </button>
                {showClearSuccess && (
                  <span className="text-teal-600 font-medium">Local data cleared.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-6">
             <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" />
                <span>Account Profile</span>
              </h3>
              
              <div className="flex items-center gap-3 mb-6">
                <img src={userProfile.avatar} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-200 object-cover" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{userProfile.name}</div>
                  <div className="text-xs text-slate-500">{userProfile.id}</div>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-slate-500 mb-1 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Role</div>
                  <div className="font-semibold text-slate-900">{userProfile.title}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Health Centre</div>
                  <div className="font-semibold text-slate-900">{userProfile.center}</div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

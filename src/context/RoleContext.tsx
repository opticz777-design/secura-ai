import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, ActiveTab, AuthUser } from '../types';
import { DEFAULT_AVATAR } from '../utils/constants';

export interface UserProfile {
  name: string;
  role: Role;
  title: string;
  center: string;
  avatar: string;
  id: string;
  badge: string;
}

export const USERS_BY_ROLE: Record<Role, UserProfile> = {
  'ASHA_WORKER': {
    name: 'Anita Devi',
    role: 'ASHA_WORKER',
    title: 'ASHA Worker',
    center: 'Primary Health Centre Chirakkal',
    avatar: DEFAULT_AVATAR,
    id: 'ASHA-KL-883921',
    badge: 'ASHA'
  },
  'DOCTOR': {
    name: 'Dr. Priya Nair',
    role: 'DOCTOR',
    title: 'Doctor / Medical Officer',
    center: 'Primary Health Centre Chirakkal',
    avatar: DEFAULT_AVATAR,
    id: 'MO-KL-440212',
    badge: 'DOCTOR'
  },
  'SUPERVISOR': {
    name: 'Rajesh Nair',
    role: 'SUPERVISOR',
    title: 'Health Extension Supervisor',
    center: 'Primary Health Centre Chirakkal',
    avatar: DEFAULT_AVATAR,
    id: 'HES-KL-991043',
    badge: 'SUPERVISOR'
  }
};

export const PRIMARY_TABS_BY_ROLE: Record<Role, ActiveTab[]> = {
  'ASHA_WORKER': [
    'dashboard',
    'voice-input',
    'blood-donation',
    'awareness-content',
    'patients',
    'teleconsultation',
    'health-records',
    'outbreak-monitoring',
    'incentive-claims',
    'misinformation',
    'notifications',
    'settings',
    'help-support'
  ],
  'DOCTOR': [
    'dashboard',
    'teleconsultation',
    'patients',
    'health-records',
    'outbreak-monitoring',
    'notifications',
    'settings'
  ],
  'SUPERVISOR': [
    'dashboard',
    'outbreak-monitoring',
    'patients',
    'incentive-claims',
    'health-records',
    'notifications',
    'settings'
  ]
};

export const SECONDARY_TABS_BY_ROLE: Record<Role, ActiveTab[]> = {
  'ASHA_WORKER': [],
  'DOCTOR': [
    'voice-input',
    'blood-donation',
    'awareness-content',
    'misinformation'
  ],
  'SUPERVISOR': [
    'voice-input',
    'blood-donation',
    'awareness-content',
    'misinformation',
    'teleconsultation'
  ]
};

interface RoleContextType {
  role: Role;
  userProfile: UserProfile;
  primaryTabs: ActiveTab[];
  secondaryTabs: ActiveTab[];
  isTabPrimary: (tab: ActiveTab) => boolean;
  allRoles: Role[];
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Default to ASHA_WORKER if no user, but the app should block access if unauthenticated anyway.
  const role = user?.role || 'ASHA_WORKER';

  const getInitialsSvg = (name: string) => {
    const initials = (name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230F766E"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-size="40" font-weight="bold" fill="%23FFFFFF">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${svg}`;
  };

  const formatCenter = (center?: string) => {
    if (!center) return 'Not available';
    if (center === 'Chirakkal') return 'Primary Health Centre Chirakkal';
    return center;
  };

  // Build the user profile dynamically from the backend auth data if available
  const baseProfile = USERS_BY_ROLE[role];
  const userProfile: UserProfile = user ? {
    ...baseProfile,
    name: user.displayName || 'Not available',
    center: formatCenter(user.healthCentre),
    id: user.ashaWorkerId || user.doctorId || user.supervisorId || 'Not available',
    avatar: getInitialsSvg(user.displayName)
  } : {
    ...baseProfile,
    avatar: getInitialsSvg(baseProfile.name)
  };

  const primaryTabs = PRIMARY_TABS_BY_ROLE[role];
  const secondaryTabs = SECONDARY_TABS_BY_ROLE[role];

  const isTabPrimary = (tab: ActiveTab) => primaryTabs.includes(tab);

  const allRoles: Role[] = [
    'ASHA_WORKER',
    'DOCTOR',
    'SUPERVISOR'
  ];

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiUrl}/auth/me`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error("Failed to restore session", err);
      } finally {
        setIsLoadingAuth(false);
      }
    };
    fetchMe();
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
        userProfile,
        primaryTabs,
        secondaryTabs,
        isTabPrimary,
        allRoles,
        user,
        setUser,
        isAuthenticated: !!user,
        isLoadingAuth
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

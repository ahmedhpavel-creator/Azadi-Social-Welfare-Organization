import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { AppSettings } from '../types';
import { LOGO_URL, ORGANIZATION_INFO } from '../constants';

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  logo: string; // Direct access to the active logo
}

const defaultSettings: AppSettings = {
  contactPhone: ORGANIZATION_INFO.contact.phone,
  adminUser: 'admin',
  adminPassHash: '',
  logoUrl: LOGO_URL,
  socialLinks: { facebook: '', youtube: '', twitter: '' }
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
  logo: LOGO_URL
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const data = await storage.getAppSettings();
      // Merge with defaults to ensure structure
      const merged = { ...defaultSettings, ...data };
      
      // If database has no logo, use the default one
      if (!merged.logoUrl) merged.logoUrl = LOGO_URL;
      
      setSettings(merged);
    } catch (e) {
      console.error("Failed to load settings context", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  const logo = settings.logoUrl || LOGO_URL;

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, logo }}>
      {children}
    </SettingsContext.Provider>
  );
};

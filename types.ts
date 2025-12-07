export type Language = 'en' | 'bn';

export interface LocalizedString {
  en: string;
  bn: string;
}

export interface AppSettings {
  contactPhone: string;
  adminUser: string;
  adminPassHash: string; // Simple base64 hash for simulation
  logoUrl?: string;
  socialLinks: {
    facebook: string;
    youtube: string;
    twitter: string;
  };
}

export interface Leader {
  id: string;
  name: LocalizedString;
  designation: LocalizedString;
  image: string;
  message: LocalizedString;
  bio?: LocalizedString; // Added bio field
  order: number;
}

export interface Member {
  id: string;
  name: LocalizedString;
  designation: LocalizedString;
  image: string;
  order: number;
  message?: LocalizedString;
}

export interface Event {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  location: string;
  date: string;
  image: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  category: string;
  caption: LocalizedString;
}

export interface Donation {
  id: string;
  donorName: string;
  mobile: string;
  amount: number;
  method: 'Bkash' | 'Nagad' | 'Cash';
  trxId: string;
  note?: string; // Added note field
  isAnonymous: boolean;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface OrganizationInfo {
  name: LocalizedString;
  slogan: LocalizedString;
  estDate: LocalizedString;
  address: string; // Keep simple for now or localize
  contact: {
    phone: string;
    email: string;
  };
}
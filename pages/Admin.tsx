import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { storage } from '../services/storage';
import { Donation, Expense, Leader, Member, Event, GalleryItem } from '../types';
import { LayoutDashboard, Users, Calendar, DollarSign, LogOut, Check, X, ShieldAlert, Lock, Loader2, User, ImageOff, Plus, Trash2, Pencil, Receipt, GripVertical, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown, UserPlus, Link2, Upload, Sparkles, Copy, MapPin, Image as ImageIcon, Settings, Phone, ArrowLeft, Facebook, Youtube, Twitter, Share2, Menu, CloudOff, RefreshCw, Database, Mail, TrendingDown, Tag, Bell } from 'lucide-react';
import { LOGO_URL, ADMIN_CONFIG } from '../constants';
import { generateEventSummary } from '../services/ai';
import { useSettings } from '../contexts/SettingsContext';

// --- HELPER FOR ID ---
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

declare const firebase: any;

// --- CONTEXT ---
interface AdminContextType {
    notify: (type: 'success' | 'error', msg: string) => void;
}
const AdminContext = createContext<AdminContextType>({ notify: () => {} });
const useAdmin = () => useContext(AdminContext);

// --- AUTHENTICATION STATE OBSERVER ---
const useAuth = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe using storage service wrapper to handle both Firebase users AND Local Fallback users
        const unsubscribe = storage.auth.subscribe((u: any) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { user, loading };
};

// --- HELPER COMPONENTS ---

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mb-4 border-4 border-red-50 dark:border-red-900/10">
                <Trash2 size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition">Cancel</button>
            <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition">Delete</button>
        </div>
      </div>
    </div>
  );
};

// --- SETTINGS COMPONENT ---
const ManageSettings = () => {
    // Use Global Settings Context
    const { settings, refreshSettings } = useSettings();
    const { notify } = useAdmin();
    const [loading, setLoading] = useState(false);
    const [testStatus, setTestStatus] = useState<{success?: boolean, msg?: string} | null>(null);
    const [testing, setTesting] = useState(false);
    const { user } = useAuth();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        contactPhone: '',
        facebook: '',
        youtube: '',
        twitter: '',
    });

    // Initial load from context
    useEffect(() => {
        if (settings) {
            setFormData({
                contactPhone: settings.contactPhone,
                facebook: settings.socialLinks?.facebook || '',
                youtube: settings.socialLinks?.youtube || '',
                twitter: settings.socialLinks?.twitter || '',
            });
            setLogoPreview(settings.logoUrl || null);
        }
    }, [settings]);

    const handleTestConnection = async () => {
        setTesting(true);
        setTestStatus(null);
        const result = await storage.checkConnection();
        setTestStatus({ success: result.success, msg: result.message });
        if (result.success) notify('success', 'Database Connected!');
        else notify('error', result.message);
        setTesting(false);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Strict size check before processing (2MB)
        if (file.size > 2 * 1024 * 1024) { 
            notify('error', "File is too large. Please upload an image smaller than 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const image = new Image();
            image.onload = () => {
                // Resize image to max 200x200 for logo to save space and prevent errors
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 200;
                const MAX_HEIGHT = 200;
                let width = image.width;
                let height = image.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(image, 0, 0, width, height);
                
                // Get compressed base64
                const dataUrl = canvas.toDataURL('image/png', 0.8);
                setLogoPreview(dataUrl);
            };
            image.src = readerEvent.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleGeneralSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const updated = { 
            ...settings, 
            contactPhone: formData.contactPhone,
            logoUrl: logoPreview || settings.logoUrl,
            socialLinks: {
                facebook: formData.facebook,
                youtube: formData.youtube,
                twitter: formData.twitter
            }
        };
        try {
            await storage.updateAppSettings(updated);
            await refreshSettings(); // Trigger global update
            
            notify('success', 'Settings & Logo Updated Successfully!');
        } catch (err) {
            console.error("Failed to save settings", err);
            notify('error', 'Failed to save settings.');
        }
    };

    const handlePasswordReset = async () => {
        if (!user?.email) return;
        if (user.uid.startsWith('local_')) {
            // Handled by local password change form below
            return;
        }
        if(confirm(`Send password reset email to ${user.email}?`)) {
            const res = await storage.auth.sendPasswordReset(user.email);
            if (res?.success) {
                notify('success', 'Reset email sent! Check your inbox.');
            } else {
                notify('error', res?.message || 'Failed to send email.');
            }
        }
    };
    
    // Local Admin Password Change
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
    const handleLocalPassChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passData.new !== passData.confirm) {
            notify('error', 'New passwords do not match');
            return;
        }
        
        // Update settings with new simple hash
        const newHash = btoa(passData.new);
        const updated = { ...settings, adminPassHash: newHash };
        await storage.updateAppSettings(updated);
        await refreshSettings();
        notify('success', 'Password Updated!');
        setPassData({ current: '', new: '', confirm: '' });
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-brand-600" /></div>;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Settings className="text-brand-600" /> System Settings
            </h2>

            {/* Connection Tester */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2"><Database size={18}/> Database Connection Status</h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Check if the Firebase Realtime Database is readable/writable.</p>
                </div>
                <div className="flex items-center gap-3">
                    {testStatus && (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${testStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {testStatus.msg}
                        </span>
                    )}
                    <button 
                        onClick={handleTestConnection} 
                        disabled={testing}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition disabled:opacity-50"
                    >
                        {testing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 
                        Test Connection
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* General Settings */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Phone size={18} /> General & Logo
                    </h3>
                    <form onSubmit={handleGeneralSave} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Official Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 border flex items-center justify-center overflow-hidden">
                                        {logoPreview ? (
                                            <img 
                                                src={logoPreview} 
                                                className="w-full h-full object-contain" 
                                                onError={(e) => { e.currentTarget.src = LOGO_URL; }} // Fallback on error
                                            />
                                        ) : <ImageIcon className="text-gray-400"/>}
                                    </div>
                                    <div className="flex-1">
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"/>
                                        <p className="text-[10px] text-gray-400 mt-1">Auto-resized to 200px. PNG/JPG supported.</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number</label>
                                <input 
                                    type="text" 
                                    className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.contactPhone}
                                    onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                             <h4 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><Share2 size={14}/> Social Media Links</h4>
                             <div className="space-y-3">
                                <div className="relative">
                                    <Facebook size={18} className="absolute left-3 top-3 text-blue-600"/>
                                    <input 
                                        type="text" 
                                        placeholder="Facebook Page URL"
                                        className="w-full pl-10 p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        value={formData.facebook}
                                        onChange={e => setFormData({...formData, facebook: e.target.value})}
                                    />
                                </div>
                                <div className="relative">
                                    <Youtube size={18} className="absolute left-3 top-3 text-red-600"/>
                                    <input 
                                        type="text" 
                                        placeholder="YouTube Channel URL"
                                        className="w-full pl-10 p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        value={formData.youtube}
                                        onChange={e => setFormData({...formData, youtube: e.target.value})}
                                    />
                                </div>
                                <div className="relative">
                                    <Twitter size={18} className="absolute left-3 top-3 text-sky-500"/>
                                    <input 
                                        type="text" 
                                        placeholder="Twitter/X Profile URL"
                                        className="w-full pl-10 p-2.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                        value={formData.twitter}
                                        onChange={e => setFormData({...formData, twitter: e.target.value})}
                                    />
                                </div>
                             </div>
                        </div>

                        <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded-xl font-bold hover:bg-brand-700 transition">Update Settings</button>
                    </form>
                </div>

                {/* Security Settings - Firebase Auth */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Lock size={18} /> Admin Profile
                    </h3>
                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl flex items-center gap-3">
                            {user?.photoURL ? (
                                <img src={user.photoURL} className="w-10 h-10 rounded-full" alt="Profile" />
                            ) : (
                                <div className="bg-gray-200 dark:bg-gray-600 p-2 rounded-full">
                                    <User size={24} />
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Logged in as</p>
                                <p className="font-bold text-gray-900 dark:text-white break-all">{user?.displayName || user?.email}</p>
                                {user?.uid.startsWith('local_') && (
                                    <span className="text-[10px] text-orange-500 font-bold bg-orange-100 px-2 py-0.5 rounded-full mt-1 inline-block">LOCAL ADMIN MODE</span>
                                )}
                            </div>
                        </div>
                        
                        {!user?.uid.startsWith('local_') && (
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">To change your password, we will send a secure reset link to your email address.</p>
                                <button onClick={handlePasswordReset} className="w-full bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2">
                                    <Mail size={18} /> Send Password Reset Email
                                </button>
                            </div>
                        )}
                        
                        {/* Local Admin Password Change Form */}
                        {user?.uid.startsWith('local_') && (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Change Local Password</h4>
                                <form onSubmit={handleLocalPassChange} className="space-y-3">
                                    <input type="password" placeholder="Current Password" value={passData.current} onChange={e => setPassData({...passData, current: e.target.value})} className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                                    <input type="password" placeholder="New Password" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                                    <input type="password" placeholder="Confirm New Password" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                                    <button type="submit" className="w-full bg-brand-600 text-white py-2 rounded font-bold text-sm">Update Password</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- LOGIN COMPONENT ---
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { logo } = useSettings();

  useEffect(() => {
    if (user && !authLoading) {
        navigate('/admin/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Attempt login
    const result = await storage.auth.login(email, password);
    
    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      let msg = "Login failed";
      // Ensure specific errors are shown
      if (result.message) msg = result.message;
      setError(msg);
    }
    setLoading(false);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" size={40}/></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-full flex items-center justify-center overflow-hidden p-1 shadow-md border border-gray-100">
                 <img 
                    src={logo} 
                    className="w-full h-full object-contain" 
                    alt="Logo"
                 />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Login</h1>
            <p className="text-gray-500 text-sm">Azadi Social Welfare Organization</p>
        </div>

        <div className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username or Email</label>
                    <input 
                        type="text" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                        required 
                        placeholder="admin"
                        autoCapitalize="none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white" required placeholder="••••••••" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition flex justify-center">
                    {loading ? <Loader2 className="animate-spin" /> : 'Login'}
                </button>
            </form>
        </div>
        
        <div className="mt-6 text-center text-xs text-gray-400">
             <p>Use <b>admin</b> / <b>admin123</b> to login if disconnected.</p>
        </div>
      </div>
    </div>
  );
};

// --- DASHBOARD HOME ---
const DashboardHome = () => {
    const [stats, setStats] = useState({
        donations: 0,
        pendingDonations: 0,
        leaders: 0,
        members: 0,
        events: 0
    });

    useEffect(() => {
        const load = async () => {
            const d = await storage.getDonations();
            const l = await storage.getLeaders();
            const m = await storage.getMembers();
            const e = await storage.getEvents();
            
            setStats({
                donations: d.filter(x => x.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0),
                pendingDonations: d.filter(x => x.status === 'pending').length,
                leaders: l.length,
                members: m.length,
                events: e.length
            });
        };
        load();
    }, []);

    const StatCard = ({ label, value, icon: Icon, color }: any) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} />
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Total Donations" value={`৳ ${stats.donations.toLocaleString()}`} icon={DollarSign} color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
                <StatCard label="Pending Review" value={stats.pendingDonations} icon={ShieldAlert} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" />
                <StatCard label="Total Members" value={stats.members + stats.leaders} icon={Users} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
                <StatCard label="Total Events" value={stats.events} icon={Calendar} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
            </div>
        </div>
    );
};

// --- MANAGE DONATIONS ---
const ManageDonations = () => {
    const { notify } = useAdmin();
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        const data = await storage.getDonations();
        setDonations(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleStatus = async (id: string, status: 'approved' | 'rejected') => {
        try {
            await storage.updateDonationStatus(id, status);
            notify('success', `Donation ${status}`);
            load();
        } catch (e) {
            notify('error', 'Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete this record?")) {
            try {
                await storage.deleteDonation(id);
                notify('success', 'Donation deleted');
                load();
            } catch (e) {
                notify('error', 'Failed to delete donation');
            }
        }
    }

    if (loading) return <Loader2 className="animate-spin text-brand-600" />;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><DollarSign/> Donations</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border dark:border-gray-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left min-w-[900px]">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold">
                            <tr>
                                <th className="p-4 whitespace-nowrap">Date</th>
                                <th className="p-4">Donor</th>
                                <th className="p-4 whitespace-nowrap">Amount</th>
                                <th className="p-4">Method/Trx</th>
                                <th className="p-4 whitespace-nowrap">Status</th>
                                <th className="p-4 whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {donations.map(d => (
                                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-4 dark:text-gray-300 whitespace-nowrap">{d.date}</td>
                                    <td className="p-4">
                                        <div className="font-bold dark:text-white">{d.donorName}</div>
                                        <div className="text-xs text-gray-500">{d.mobile}</div>
                                    </td>
                                    <td className="p-4 font-bold text-brand-600 whitespace-nowrap">৳ {d.amount}</td>
                                    <td className="p-4 dark:text-gray-300">
                                        <div>{d.method}</div>
                                        <div className="text-xs font-mono bg-gray-100 dark:bg-gray-600 px-1 rounded inline-block">{d.trxId}</div>
                                    </td>
                                    <td className="p-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            d.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                            d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {d.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {d.status === 'pending' && (
                                                <>
                                                    <button onClick={() => handleStatus(d.id, 'approved')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check size={16}/></button>
                                                    <button onClick={() => handleStatus(d.id, 'rejected')} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><X size={16}/></button>
                                                </>
                                            )}
                                            <button onClick={() => handleDelete(d.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- MANAGE EXPENSES ---
const ManageExpenses = () => {
    const { notify } = useAdmin();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [form, setForm] = useState<Partial<Expense>>({});
    const [isEditing, setIsEditing] = useState(false);

    const load = async () => {
        const data = await storage.getExpenses();
        setExpenses(data);
    };

    useEffect(() => { load(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const id = form.id || generateId();
            const data: Expense = { 
                id, 
                title: form.title || '', 
                description: form.description || '', 
                amount: Number(form.amount) || 0,
                category: form.category || 'General',
                date: form.date || new Date().toISOString().split('T')[0]
            };
            
            if (isEditing) await storage.updateExpense(data);
            else await storage.addExpense(data);
            
            notify('success', isEditing ? 'Expense updated' : 'Expense added');
            setForm({});
            setIsEditing(false);
            load();
        } catch (e) {
            notify('error', 'Failed to save expense');
        }
    };

    const handleEdit = (ex: Expense) => {
        setForm(ex);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete expense?")) {
            try {
                await storage.deleteExpense(id);
                notify('success', 'Expense deleted');
                load();
            } catch(e) { notify('error', 'Failed to delete expense'); }
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2">
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700 sticky top-24">
                    <h3 className="font-bold text-lg mb-4 dark:text-white">{isEditing ? 'Edit Expense' : 'Add Expense'}</h3>
                    <form onSubmit={handleSave} className="space-y-4">
                        <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Title" value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} required />
                        <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Amount" type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} required />
                        <select className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" value={form.category || 'General'} onChange={e => setForm({...form, category: e.target.value})}>
                            <option>General</option> <option>Event</option> <option>Salary</option> <option>Maintenance</option>
                        </select>
                        <input className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} required />
                        <div className="flex gap-2">
                            <button className="flex-1 bg-brand-600 text-white py-2 rounded font-bold">{isEditing ? 'Update' : 'Add'}</button>
                            {isEditing && <button type="button" onClick={() => {setIsEditing(false); setForm({});}} className="px-3 bg-gray-200 dark:bg-gray-700 rounded">Cancel</button>}
                        </div>
                    </form>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-4 overflow-x-auto">
                 <div className="min-w-[600px]">
                    {expenses.map(ex => (
                        <div key={ex.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex justify-between items-center mb-4">
                            <div>
                                <h4 className="font-bold dark:text-white">{ex.title}</h4>
                                <p className="text-sm text-gray-500 whitespace-nowrap">{ex.date} • {ex.category}</p>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-red-600 whitespace-nowrap">৳ {ex.amount}</div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => handleEdit(ex)} className="text-gray-400 hover:text-blue-500"><Pencil size={14}/></button>
                                    <button onClick={() => handleDelete(ex.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- MANAGE LEADERS ---
const ManageLeaders = () => {
    const { notify } = useAdmin();
    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [form, setForm] = useState<Partial<Leader>>({});
    const [isEditing, setIsEditing] = useState(false);

    const load = async () => {
        const data = await storage.getLeaders();
        setLeaders(data.sort((a, b) => a.order - b.order));
    };

    useEffect(() => { load(); }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 800 * 1024) { notify('error', "Image too large (max 800KB)"); return; }
        const reader = new FileReader();
        reader.onload = (re) => {
            setForm(prev => ({ ...prev, image: re.target?.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const id = form.id || generateId();
            const data: Leader = {
                id,
                name: { en: form.name?.en || '', bn: form.name?.bn || '' },
                designation: { en: form.designation?.en || '', bn: form.designation?.bn || '' },
                image: form.image || '',
                message: { en: form.message?.en || '', bn: form.message?.bn || '' },
                bio: { en: form.bio?.en || '', bn: form.bio?.bn || '' },
                order: Number(form.order) || leaders.length + 1
            };
            await storage.saveLeader(data);
            notify('success', isEditing ? 'Leader updated' : 'Leader added');
            setForm({});
            setIsEditing(false);
            load();
        } catch(e) { notify('error', 'Failed to save leader'); }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete leader?")) {
            try {
                await storage.deleteLeader(id);
                notify('success', 'Leader deleted');
                load();
            } catch(e) { notify('error', 'Failed to delete leader'); }
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4 dark:text-white">{isEditing ? 'Edit Leader' : 'Add Leader'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Name (English)" value={form.name?.en || ''} onChange={e => setForm({...form, name: {...form.name, en: e.target.value} as any})} />
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Name (Bengali)" value={form.name?.bn || ''} onChange={e => setForm({...form, name: {...form.name, bn: e.target.value} as any})} />
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Designation (English)" value={form.designation?.en || ''} onChange={e => setForm({...form, designation: {...form.designation, en: e.target.value} as any})} />
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Designation (Bengali)" value={form.designation?.bn || ''} onChange={e => setForm({...form, designation: {...form.designation, bn: e.target.value} as any})} />
                    
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">Image (Upload or URL)</label>
                        <div className="flex gap-2">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
                            <input className="p-2 border rounded dark:bg-gray-700 dark:text-white flex-1" placeholder="Or Image URL" value={form.image || ''} onChange={e => setForm({...form, image: e.target.value})} />
                        </div>
                    </div>

                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Order Priority" type="number" value={form.order || ''} onChange={e => setForm({...form, order: Number(e.target.value)})} />
                    <textarea className="p-2 border rounded dark:bg-gray-700 dark:text-white md:col-span-2" placeholder="Message (Quote)" value={form.message?.en || ''} onChange={e => setForm({...form, message: {...form.message, en: e.target.value} as any})} />
                    <textarea className="p-2 border rounded dark:bg-gray-700 dark:text-white md:col-span-2" placeholder="Bio / Details" value={form.bio?.en || ''} onChange={e => setForm({...form, bio: {...form.bio, en: e.target.value} as any})} />
                    
                    <div className="md:col-span-2 flex gap-2">
                        <button className="bg-brand-600 text-white px-6 py-2 rounded font-bold">{isEditing ? 'Update' : 'Add'}</button>
                        {isEditing && <button type="button" onClick={() => {setIsEditing(false); setForm({});}} className="bg-gray-200 px-4 rounded">Cancel</button>}
                    </div>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaders.map(l => (
                    <div key={l.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex gap-4">
                        <img src={l.image} className="w-16 h-16 rounded-full object-cover bg-gray-100" />
                        <div className="flex-1">
                            <h4 className="font-bold dark:text-white">{l.name?.en}</h4>
                            <p className="text-xs text-brand-600">{l.designation?.en}</p>
                            <p className="text-xs text-gray-500 mt-1">Order: {l.order}</p>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => {setForm(l); setIsEditing(true); window.scrollTo(0,0);}} className="text-blue-500 text-xs font-bold">Edit</button>
                                <button onClick={() => handleDelete(l.id)} className="text-red-500 text-xs font-bold">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MANAGE MEMBERS ---
const ManageMembers = () => {
    const { notify } = useAdmin();
    const [members, setMembers] = useState<Member[]>([]);
    const [form, setForm] = useState<Partial<Member>>({});
    const [isEditing, setIsEditing] = useState(false);

    const load = async () => {
        const data = await storage.getMembers();
        setMembers(data);
    };

    useEffect(() => { load(); }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 800 * 1024) { notify('error', "Image too large (max 800KB)"); return; }
        const reader = new FileReader();
        reader.onload = (re) => {
            setForm(prev => ({ ...prev, image: re.target?.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const id = form.id || generateId();
            const data: Member = {
                id,
                name: { en: form.name?.en || '', bn: form.name?.bn || '' },
                designation: { en: form.designation?.en || '', bn: form.designation?.bn || '' },
                image: form.image || '',
                order: Number(form.order) || 0
            };
            await storage.saveMember(data);
            notify('success', isEditing ? 'Member updated' : 'Member added');
            setForm({});
            setIsEditing(false);
            load();
        } catch (e) { notify('error', 'Failed to save member'); }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete member?")) {
            try {
                await storage.deleteMember(id);
                notify('success', 'Member deleted');
                load();
            } catch (e) { notify('error', 'Failed to delete member'); }
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4 dark:text-white">{isEditing ? 'Edit Member' : 'Add Member'}</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Name (English)" value={form.name?.en || ''} onChange={e => setForm({...form, name: {...form.name, en: e.target.value} as any})} />
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Name (Bengali)" value={form.name?.bn || ''} onChange={e => setForm({...form, name: {...form.name, bn: e.target.value} as any})} />
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Designation (English)" value={form.designation?.en || ''} onChange={e => setForm({...form, designation: {...form.designation, en: e.target.value} as any})} />
                    
                     <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">Image (Upload or URL)</label>
                        <div className="flex gap-2">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
                            <input className="p-2 border rounded dark:bg-gray-700 dark:text-white flex-1" placeholder="Or Image URL" value={form.image || ''} onChange={e => setForm({...form, image: e.target.value})} />
                        </div>
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                        <button className="bg-brand-600 text-white px-6 py-2 rounded font-bold">{isEditing ? 'Update' : 'Add'}</button>
                        {isEditing && <button type="button" onClick={() => {setIsEditing(false); setForm({});}} className="bg-gray-200 px-4 rounded">Cancel</button>}
                    </div>
                </form>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {members.map(m => (
                    <div key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 text-center">
                        <img src={m.image} className="w-20 h-20 rounded-full mx-auto mb-2 object-cover bg-gray-100" />
                        <h4 className="font-bold text-sm dark:text-white">{m.name?.en}</h4>
                        <p className="text-xs text-brand-600">{m.designation?.en}</p>
                        <div className="flex justify-center gap-2 mt-2">
                            <button onClick={() => {setForm(m); setIsEditing(true); window.scrollTo(0,0);}} className="text-blue-500 text-xs">Edit</button>
                            <button onClick={() => handleDelete(m.id)} className="text-red-500 text-xs">Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MANAGE EVENTS ---
const ManageEvents = () => {
    const { notify } = useAdmin();
    const [events, setEvents] = useState<Event[]>([]);
    const [form, setForm] = useState<Partial<Event>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [generating, setGenerating] = useState(false);

    const load = async () => {
        const data = await storage.getEvents();
        setEvents(data);
    };

    useEffect(() => { load(); }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 800 * 1024) { notify('error', "Image too large (max 800KB)"); return; }
        const reader = new FileReader();
        reader.onload = (re) => {
            setForm(prev => ({ ...prev, image: re.target?.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const id = form.id || generateId();
            const data: Event = {
                id,
                title: { en: form.title?.en || '', bn: form.title?.bn || '' },
                description: { en: form.description?.en || '', bn: form.description?.bn || '' },
                location: form.location || '',
                date: form.date || '',
                image: form.image || ''
            };
            await storage.saveEvent(data);
            notify('success', isEditing ? 'Event updated' : 'Event added');
            setForm({});
            setIsEditing(false);
            load();
        } catch (e) { notify('error', 'Failed to save event'); }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete event?")) {
            try {
                await storage.deleteEvent(id);
                notify('success', 'Event deleted');
                load();
            } catch (e) { notify('error', 'Failed to delete event'); }
        }
    };

    const handleGenerateSummary = async () => {
      if (!form.title?.en || !form.date) return alert("Please fill at least English Title and Date");
      setGenerating(true);
      try {
        const summary = await generateEventSummary({ ...form, id: 'temp' } as any);
        // Put the summary into description for user to edit
        setForm(prev => ({ ...prev, description: { ...prev.description, en: summary } as any }));
        notify('success', 'AI Summary generated');
      } catch (e) { notify('error', "AI Generation Failed"); }
      setGenerating(false);
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg dark:text-white">{isEditing ? 'Edit Event' : 'Add Event'}</h3>
                    <button onClick={handleGenerateSummary} disabled={generating} className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200">
                        {generating ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} AI Summary
                    </button>
                </div>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Title (English)" value={form.title?.en || ''} onChange={e => setForm({...form, title: {...form.title, en: e.target.value} as any})} />
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Title (Bengali)" value={form.title?.bn || ''} onChange={e => setForm({...form, title: {...form.title, bn: e.target.value} as any})} />
                    <textarea className="p-2 border rounded dark:bg-gray-700 dark:text-white md:col-span-2 h-24" placeholder="Description (English)" value={form.description?.en || ''} onChange={e => setForm({...form, description: {...form.description, en: e.target.value} as any})} />
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Location" value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} />
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Date (e.g. 2023-10-25)" type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} />
                    
                     <div className="md:col-span-2">
                        <label className="text-xs text-gray-500">Image (Upload or URL)</label>
                        <div className="flex gap-2">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="text-xs" />
                            <input className="p-2 border rounded dark:bg-gray-700 dark:text-white flex-1" placeholder="Or Image URL" value={form.image || ''} onChange={e => setForm({...form, image: e.target.value})} />
                        </div>
                         {form.image && (
                            <img src={form.image} className="h-20 w-auto object-cover mt-2 rounded border" />
                        )}
                    </div>

                    <div className="md:col-span-2 flex gap-2">
                        <button className="bg-brand-600 text-white px-6 py-2 rounded font-bold">{isEditing ? 'Update' : 'Add'}</button>
                        {isEditing && <button type="button" onClick={() => {setIsEditing(false); setForm({});}} className="bg-gray-200 px-4 rounded">Cancel</button>}
                    </div>
                </form>
            </div>
            <div className="space-y-4">
                {events.map(e => (
                    <div key={e.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col md:flex-row gap-4">
                        <img src={e.image} className="w-full md:w-48 h-32 object-cover rounded-lg bg-gray-100" />
                        <div className="flex-1">
                            <h4 className="font-bold text-lg dark:text-white">{e.title?.en}</h4>
                            <p className="text-sm text-brand-600 font-bold mb-2">{e.date} • {e.location}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{e.description?.en}</p>
                            <div className="flex gap-4 mt-3">
                                <button onClick={() => {setForm(e); setIsEditing(true); window.scrollTo(0,0);}} className="text-blue-500 font-bold text-sm">Edit</button>
                                <button onClick={() => handleDelete(e.id)} className="text-red-500 font-bold text-sm">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MANAGE GALLERY ---
const ManageGallery = () => {
    const { notify } = useAdmin();
    const [images, setImages] = useState<GalleryItem[]>([]);
    const [form, setForm] = useState<Partial<GalleryItem>>({});

    const load = async () => {
        const data = await storage.getGallery();
        setImages(data);
    };

    useEffect(() => { load(); }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 800 * 1024) { notify('error', "Image too large (max 800KB)"); return; }
        const reader = new FileReader();
        reader.onload = (re) => {
            setForm(prev => ({ ...prev, imageUrl: re.target?.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const id = generateId();
            const data: GalleryItem = {
                id,
                imageUrl: form.imageUrl || '',
                category: form.category || 'General',
                caption: { en: form.caption?.en || '', bn: form.caption?.bn || '' }
            };
            await storage.saveGalleryItem(data);
            notify('success', 'Image added to gallery');
            setForm({});
            load();
        } catch(e) { notify('error', 'Failed to add image'); }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete image?")) {
            try {
                await storage.deleteGalleryItem(id);
                notify('success', 'Image deleted');
                load();
            } catch(e) { notify('error', 'Failed to delete image'); }
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-2">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700">
                <h3 className="font-bold text-lg mb-4 dark:text-white">Add Image</h3>
                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="md:col-span-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center relative hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        {form.imageUrl ? (
                            <img src={form.imageUrl} className="h-40 mx-auto object-contain rounded-lg shadow-sm" />
                        ) : (
                            <div className="flex flex-col items-center text-gray-400">
                                <Upload size={40} className="mb-2"/>
                                <p className="text-sm font-bold">Click to Upload Image</p>
                                <p className="text-xs">Max 800KB</p>
                            </div>
                        )}
                    </div>
                    
                    <input className="p-2 border rounded dark:bg-gray-700 dark:text-white" placeholder="Caption (English)" value={form.caption?.en || ''} onChange={e => setForm({...form, caption: {...form.caption, en: e.target.value} as any})} />
                    <select className="p-2 border rounded dark:bg-gray-700 dark:text-white" value={form.category || 'General'} onChange={e => setForm({...form, category: e.target.value})}>
                        <option>General</option><option>Event</option><option>Distribution</option>
                    </select>
                    <button className="bg-brand-600 text-white px-6 py-2 rounded font-bold md:col-span-2">Add to Gallery</button>
                </form>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map(img => (
                    <div key={img.id} className="relative group bg-gray-100 rounded-xl overflow-hidden aspect-square">
                        <img src={img.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                             <button onClick={() => handleDelete(img.id)} className="p-2 bg-red-600 text-white rounded-full"><Trash2 size={16}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Admin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const { logo } = useSettings(); // Use context logo
  
  // Make offline status reactive
  const [isOffline, setIsOffline] = useState(storage.isOffline());
  
  // Notification State
  const [toast, setToast] = useState<{type: 'success'|'error', msg: string} | null>(null);

  const notify = (type: 'success'|'error', msg: string) => {
      setToast({type, msg});
      setTimeout(() => setToast(null), 3000);
  };
  
  useEffect(() => {
    const unsub = storage.subscribeToStatus((status) => setIsOffline(status));
    return () => unsub();
  }, []);
  
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await storage.retryConnection();
    // Force re-render/check
    setTimeout(() => {
        setIsRetrying(false);
    }, 1000);
  };

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/admin/login') {
      navigate('/admin/login');
    }
  }, [user, loading, location.pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;

  if (location.pathname === '/admin/login') {
    return (
        <AdminContext.Provider value={{ notify }}>
            <Login />
        </AdminContext.Provider>
    );
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/donations', label: 'Donations', icon: <DollarSign size={20} /> },
    { path: '/admin/expenses', label: 'Expenses', icon: <Receipt size={20} /> },
    { path: '/admin/leaders', label: 'Leaders', icon: <Users size={20} /> },
    { path: '/admin/members', label: 'Members', icon: <UserPlus size={20} /> },
    { path: '/admin/events', label: 'Events', icon: <Calendar size={20} /> },
    { path: '/admin/gallery', label: 'Gallery', icon: <ImageIcon size={20} /> },
    { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <AdminContext.Provider value={{ notify }}>
    <div className="flex min-h-screen relative bg-transparent"> 
      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-gray-900 text-white transition-transform duration-300 z-50 overflow-y-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 shadow-md">
             <img src={logo} className="w-full h-full object-contain" alt="Logo"/>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Admin Panel</h1>
            <p className="text-xs text-gray-500">Azadi Organization</p>
          </div>
        </div>
        
        {/* Offline Indicator - Reactive now */}
        {isOffline && (
            <div className="px-6 py-4 bg-orange-900/30 border-b border-orange-900/50">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-bold">
                    <CloudOff size={16} /> Offline Mode
                </div>
                <p className="text-[10px] text-orange-300/80 mt-1 leading-tight">
                    Cloud save unavailable. Changes saved locally. Check connection or login status.
                </p>
                <button 
                    onClick={handleRetry} 
                    disabled={isRetrying}
                    className="mt-3 w-full bg-orange-700 hover:bg-orange-600 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-2 transition"
                >
                    {isRetrying ? <Loader2 size={12} className="animate-spin"/> : <RefreshCw size={12}/>} Retry Connection
                </button>
            </div>
        )}
        
        <nav className="p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${location.pathname === item.path 
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          <button 
            onClick={() => { storage.auth.logout(); navigate('/admin/login'); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all font-medium text-sm mt-8"
          >
            <LogOut size={20} /> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
         {/* Mobile Header */}
         <div className="lg:hidden p-4 flex items-center justify-between bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"><Menu/></button>
                <span className="font-bold dark:text-white">Admin Panel</span>
            </div>
            <div className="w-10 h-10 shrink-0 bg-white rounded-full flex items-center justify-center overflow-hidden p-0.5 shadow-md border border-gray-100">
                <img src={logo} className="w-full h-full object-contain" alt="Logo"/>
            </div>
         </div>

         <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Routes>
                <Route path="dashboard" element={<DashboardHome />} />
                <Route path="leaders" element={<ManageLeaders />} />
                <Route path="members" element={<ManageMembers />} />
                <Route path="events" element={<ManageEvents />} />
                <Route path="donations" element={<ManageDonations />} />
                <Route path="expenses" element={<ManageExpenses />} />
                <Route path="gallery" element={<ManageGallery />} />
                <Route path="settings" element={<ManageSettings />} />
                <Route path="*" element={<DashboardHome />} />
            </Routes>
         </div>
      </main>

      {/* Toast Notification */}
      {toast && (
          <div className={`fixed bottom-4 right-4 z-[70] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 fade-in duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {toast.type === 'success' ? <Check size={20} /> : <ShieldAlert size={20} />}
              <span className="font-bold">{toast.msg}</span>
          </div>
      )}
    </div>
    </AdminContext.Provider>
  );
};

export default Admin;
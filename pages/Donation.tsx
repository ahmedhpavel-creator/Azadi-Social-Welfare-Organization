import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { TRANSLATIONS, ORGANIZATION_INFO, CALLIGRAPHY_URL } from '../constants';
import { storage } from '../services/storage';
import { Donation as DonationType } from '../types';
import { CheckCircle, Download, Printer, ImageOff, Loader2, CreditCard, User, Phone, Banknote, ShieldCheck, Share2, Copy, Heart, MessageSquare } from 'lucide-react';

const Donation: React.FC = () => {
  const { lang } = useLanguage();
  const { logo, settings } = useSettings();
  const contactPhone = settings.contactPhone;

  const [formData, setFormData] = useState({
    donorName: '',
    mobile: '',
    amount: '',
    method: 'Bkash',
    trxId: '',
    note: '',
    isAnonymous: false
  });
  const [submittedDonation, setSubmittedDonation] = useState<DonationType | null>(null);
  const [imgError, setImgError] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  // Stats & List
  const [stats, setStats] = useState({ month: 0, year: 0 });
  const [recentDonations, setRecentDonations] = useState<DonationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        // Calculate public stats & fetch list
        const donationsData = await storage.getDonations();
        const donations = donationsData.filter(d => d.status === 'approved');
        setRecentDonations(donations.slice(0, 10)); // Show last 10 approved donations

        const now = new Date();
        const thisMonth = donations.filter(d => {
          const dDate = new Date(d.date);
          return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
        }).reduce((sum, d) => sum + d.amount, 0);
        
        const thisYear = donations.filter(d => {
          const dDate = new Date(d.date);
          return dDate.getFullYear() === now.getFullYear();
        }).reduce((sum, d) => sum + d.amount, 0);

        setStats({ month: thisMonth, year: thisYear });
        setLoading(false);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const generateId = () => {
    return 'don_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newDonation: DonationType = {
      id: generateId(),
      donorName: formData.donorName,
      mobile: formData.mobile,
      amount: Number(formData.amount),
      method: formData.method as any,
      trxId: formData.trxId,
      note: formData.note,
      isAnonymous: formData.isAnonymous,
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    
    await storage.saveDonation(newDonation);
    setSubmittedDonation(newDonation);
    window.scrollTo(0,0);
  };

  const handlePrint = () => window.print();

  const handleWhatsAppShare = () => {
    if (!submittedDonation) return;
    const adminNumber = contactPhone;
    const message = `Assalamu Alaikum. I have submitted a donation.\n\nDonor: ${submittedDonation.donorName}\nAmount: ${submittedDonation.amount}\nMethod: ${submittedDonation.method}\nTrxID: ${submittedDonation.trxId}\nReceipt ID: ${submittedDonation.id.substring(0, 8).toUpperCase()}`;
    const url = `https://wa.me/+88${adminNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!submittedDonation) return;
    setGeneratingPdf(true);
    // Scroll to top to ensure html2canvas captures correctly without cropping
    window.scrollTo(0, 0);

    const input = document.getElementById('receipt');
    
    if (input) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Dynamic imports to prevent load issues
        // @ts-ignore
        const html2canvasModule = await import('html2canvas');
        const html2canvas = (html2canvasModule.default || html2canvasModule) as any;
        
        // @ts-ignore
        const jsPDFModule = await import('jspdf');
        const jsPDF = (jsPDFModule.default || jsPDFModule.jsPDF) as any;

        const canvas = await html2canvas(input, { 
            scale: 2, 
            useCORS: true, 
            logging: false, 
            backgroundColor: '#fffdf8', // Force background color to avoid dark mode issues in PDF
            windowWidth: input.scrollWidth,
            windowHeight: input.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;
        const availableWidth = pdfWidth - (margin * 2);
        const ratio = availableWidth / canvas.width;
        const finalHeight = canvas.height * ratio;
        
        pdf.addImage(imgData, 'PNG', margin, 20, availableWidth, finalHeight);
        pdf.save(`Donation_Receipt_${submittedDonation.id.substring(0, 8).toUpperCase()}.pdf`);
      } catch (error) {
        console.error(error);
        alert("Failed to generate PDF. Please try printing instead.");
      }
    }
    setGeneratingPdf(false);
  };

  if (submittedDonation) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 flex flex-col items-center justify-center p-4">
        {/* Receipt Container - Simulate Paper */}
        <div id="receipt" className="bg-[#fffdf8] p-6 sm:p-10 rounded-none shadow-2xl w-full max-w-2xl border border-gray-200 print-only-container relative overflow-hidden text-gray-800">
           {/* Decorative Top Border */}
           <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400"></div>
           
           {/* Watermark */}
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0">
             <img src={logo} className="w-[80%] h-[80%] object-contain grayscale" alt="" />
           </div>

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-brand-100 pb-6 mb-8 gap-4">
               <div className="flex items-center gap-4">
                   {!imgError ? (
                     <img src={logo} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" onError={() => setImgError(true)} />
                   ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center"><ImageOff size={24} className="text-gray-400" /></div>
                   )}
                   <div>
                      <h1 className="text-xl sm:text-2xl font-bold uppercase text-brand-800 tracking-tight">{ORGANIZATION_INFO.name.en}</h1>
                      <h2 className="text-base sm:text-lg font-bold font-bengali text-gray-600">{ORGANIZATION_INFO.name.bn}</h2>
                      <p className="text-xs text-gray-500 mt-1">{ORGANIZATION_INFO.address}</p>
                   </div>
               </div>
               <div className="text-left sm:text-right w-full sm:w-auto">
                 <div className="text-2xl sm:text-3xl font-bold text-gray-200 select-none">RECEIPT</div>
                 <div className="text-sm font-bold text-brand-600 mt-1">#{submittedDonation.id.substring(0, 8).toUpperCase()}</div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
               <div>
                 <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Donor Details</p>
                 <p className="font-bold text-lg text-gray-900 break-words">{submittedDonation.isAnonymous ? 'Anonymous Donor' : submittedDonation.donorName}</p>
                 {!submittedDonation.isAnonymous && <p className="text-gray-600">{submittedDonation.mobile}</p>}
               </div>
               <div className="text-right">
                 <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-1">Date & Time</p>
                 <p className="font-bold text-gray-900">{submittedDonation.date}</p>
               </div>
            </div>

            <div className="bg-brand-50 border border-brand-100 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600 font-medium">{TRANSLATIONS.get('amount', lang)}</span>
                <span className="font-bold text-3xl text-brand-700">৳ {submittedDonation.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-brand-200 pt-4 text-sm">
                 <div>
                   <span className="text-gray-500 mr-2">{TRANSLATIONS.get('method', lang)}:</span>
                   <span className="font-semibold">{submittedDonation.method}</span>
                 </div>
                 <div>
                   <span className="text-gray-500 mr-2">{TRANSLATIONS.get('trxId', lang)}:</span>
                   <span className="font-mono bg-white px-2 py-0.5 rounded border border-brand-200">{submittedDonation.trxId}</span>
                 </div>
              </div>
              {submittedDonation.note && (
                <div className="mt-4 pt-4 border-t border-brand-200">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Purpose / Note</p>
                    <p className="text-gray-800 italic">"{submittedDonation.note}"</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-end pt-12">
               <div className="text-center">
                  <div className="text-2xl font-arabic text-brand-800 mb-2">جزاك الله خيرا</div>
                  <p className="text-xs text-gray-400">May Allah reward you.</p>
               </div>
               <div className="text-right">
                  <div className="w-32 border-b border-gray-300 mb-2"></div>
                  <p className="text-xs text-gray-400 uppercase">Authorized Signature</p>
               </div>
            </div>
            
            <div className="mt-8 text-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${submittedDonation.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {submittedDonation.status === 'approved' ? <CheckCircle size={12} /> : <Loader2 size={12} />} {submittedDonation.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 no-print">
          <button 
            onClick={handleDownloadPDF} 
            disabled={generatingPdf}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-brand-500/30 transition disabled:opacity-70"
          >
             {generatingPdf ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
             Download PDF
          </button>
          
          <button 
             onClick={handleWhatsAppShare}
             className="flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3 rounded-full font-bold shadow-lg transition"
          >
            <Share2 size={20} /> Share to WhatsApp
          </button>

          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-bold shadow-lg transition"
          >
            <Printer size={20} /> {TRANSLATIONS.get('print', lang)}
          </button>
          
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-full font-bold shadow-lg border border-gray-200 transition">
             Make Another Donation
          </button>
        </div>
        <style>{`
          @media print {
            .print-only-container {
              box-shadow: none !important;
              border: 1px solid #ddd !important;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
             {/* Calligraphy at top of donation page */}
             <div className="flex justify-center mb-6">
                <img src={CALLIGRAPHY_URL} alt="Bismillah" className="h-16 md:h-20 opacity-80 filter dark:invert" />
             </div>
             <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-bengali">{TRANSLATIONS.get('donation_form', lang)}</h1>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
             {/* Stat Cards */}
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-brand-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition">
                <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/30 rounded-full flex items-center justify-center text-brand-600 dark:text-brand-400">
                   <Banknote size={24} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">{TRANSLATIONS.get('thisMonth', lang)}</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : `৳ ${stats.month.toLocaleString()}`}</div>
                </div>
             </div>
             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-brand-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                   <Banknote size={24} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total (Year)</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : `৳ ${stats.year.toLocaleString()}`}</div>
                </div>
             </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-brand-100 dark:border-gray-700 flex items-center gap-4 hover:shadow-md transition">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center text-pink-600 dark:text-pink-400">
                   <Phone size={24} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Send Money To</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white select-all">{loading ? 'Loading...' : contactPhone}</div>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 mb-12">
            <div className="md:grid md:grid-cols-5 h-full">
              {/* Left Decoration */}
              <div className="hidden md:block col-span-2 bg-gradient-to-br from-brand-600 to-brand-800 text-white p-10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                 <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                       <h3 className="text-2xl font-bold mb-4 font-bengali">আপনার দান, তাদের হাসি</h3>
                       <p className="opacity-90 leading-relaxed text-sm">Your contribution helps us provide education, food, and healthcare to those in need. Every taka counts.</p>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                          <ShieldCheck size={20} className="text-brand-200" />
                          <span className="text-sm font-medium">Secure Transaction</span>
                       </div>
                       <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                          <CheckCircle size={20} className="text-brand-200" />
                          <span className="text-sm font-medium">Instant Receipt</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Form Side */}
              <div className="col-span-3 p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{TRANSLATIONS.get('name', lang)}</label>
                    <div className="relative">
                       <User className="absolute left-3 top-3.5 text-brand-500" size={18} />
                       <input 
                        type="text" 
                        name="donorName" 
                        required 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none"
                        value={formData.donorName}
                        onChange={handleChange}
                        placeholder="Full Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{TRANSLATIONS.get('mobile', lang)}</label>
                     <div className="relative">
                       <Phone className="absolute left-3 top-3.5 text-brand-500" size={18} />
                       <input 
                        type="tel" 
                        name="mobile" 
                        required 
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="017..."
                      />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{TRANSLATIONS.get('amount', lang)}</label>
                       <div className="relative">
                          <span className="absolute left-3 top-3.5 text-brand-500 font-bold">৳</span>
                          <input 
                            type="number" 
                            name="amount" 
                            required 
                            min="10"
                            className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none"
                            value={formData.amount}
                            onChange={handleChange}
                          />
                       </div>
                    </div>
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{TRANSLATIONS.get('method', lang)}</label>
                       <div className="relative">
                          <CreditCard className="absolute left-3 top-3.5 text-brand-500" size={18} />
                          <select 
                            name="method" 
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none appearance-none cursor-pointer"
                            value={formData.method}
                            onChange={handleChange}
                          >
                            <option value="Bkash">Bkash</option>
                            <option value="Nagad">Nagad</option>
                            <option value="Cash">Cash</option>
                          </select>
                       </div>
                    </div>
                  </div>

                  <div>
                     <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{lang === 'en' ? 'Reference / Note' : 'মন্তব্য / কিসের জন্য'}</label>
                     <div className="relative">
                        <MessageSquare className="absolute left-3 top-3.5 text-brand-500" size={18} />
                        <input 
                          type="text" 
                          name="note" 
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none"
                          value={formData.note}
                          onChange={handleChange}
                          placeholder={lang === 'en' ? "e.g. Zakat, General Fund, Orphanage" : "যেমন: যাকাত, সাধারণ তহবিল, এতিমখানা"}
                        />
                     </div>
                  </div>
                  
                  {/* Payment Number Display */}
                  {(formData.method === 'Bkash' || formData.method === 'Nagad') && (
                    <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800 rounded-xl p-4 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300">
                      <div className="bg-pink-100 dark:bg-pink-800 p-2 rounded-full text-pink-600 dark:text-pink-300 shrink-0">
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Please send Money / Cash In to this official {formData.method} number:
                        </p>
                        <div className="text-xl font-bold text-pink-600 dark:text-pink-400 mt-1 select-all flex items-center gap-2">
                           {loading ? 'Loading...' : contactPhone}
                           <button type="button" onClick={() => navigator.clipboard.writeText(contactPhone)} className="text-xs font-normal bg-white dark:bg-gray-800 border px-2 py-1 rounded text-gray-500 hover:text-gray-800"><Copy size={12}/></button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{TRANSLATIONS.get('trxId', lang)}</label>
                    <input 
                      type="text" 
                      name="trxId" 
                      required 
                      placeholder="e.g. 9G7H..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition outline-none font-mono uppercase"
                      value={formData.trxId}
                      onChange={handleChange}
                    />
                    <p className="text-xs text-gray-400 mt-1 ml-1">Enter the Transaction ID received in SMS</p>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition">
                    <input 
                      type="checkbox" 
                      id="isAnonymous" 
                      name="isAnonymous"
                      className="w-5 h-5 text-brand-600 rounded focus:ring-brand-500 border-gray-300 cursor-pointer"
                      checked={formData.isAnonymous}
                      onChange={handleChange}
                    />
                    <label htmlFor="isAnonymous" className="text-sm font-medium text-gray-700 dark:text-gray-300 select-none cursor-pointer flex-1">
                      {TRANSLATIONS.get('hideName', lang)}
                    </label>
                  </div>

                  <button type="submit" className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 text-lg">
                    {TRANSLATIONS.get('submit', lang)} <CheckCircle size={22} />
                  </button>

                </form>
              </div>
            </div>
          </div>

          {/* Recent Contributors List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8">
            <h2 className="text-2xl font-bold text-center mb-8 font-bengali text-gray-900 dark:text-white flex items-center justify-center gap-2">
               <Heart className="text-red-500 fill-current" /> 
               {lang === 'en' ? 'Recent Contributors' : 'সাম্প্রতিক দাতা সদস্যবৃন্দ'}
            </h2>
            
            {!loading && recentDonations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentDonations.map((d) => (
                   <div key={d.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 flex justify-between items-center group hover:shadow-md transition">
                      <div>
                         <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {d.isAnonymous ? (lang === 'en' ? 'Anonymous' : 'একজন শুভাকাঙ্ক্ষী') : d.donorName}
                         </div>
                         <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                             {d.note ? (
                               <span className="bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 px-1.5 py-0.5 rounded">{d.note}</span>
                             ) : (
                               <span className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{d.method}</span>
                             )}
                         </div>
                      </div>
                      <div className="text-brand-600 dark:text-brand-400 font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm">
                         ৳ {d.amount.toLocaleString()}
                      </div>
                   </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                {loading ? 'Loading...' : (lang === 'en' ? 'No approved donations yet. Be the first to donate!' : 'এখনও কোন দান অনুমোদিত হয়নি। আপনিই প্রথম দান করুন!')}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Donation;

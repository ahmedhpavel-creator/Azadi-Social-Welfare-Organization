import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { ORGANIZATION_INFO, TRANSLATIONS } from '../constants';
import { Phone, Mail, MapPin, Heart, Facebook, Twitter, Youtube, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const { lang } = useLanguage();
  const { logo, settings } = useSettings();
  
  const phone = settings.contactPhone;
  const socialLinks = settings.socialLinks || { facebook: '', youtube: '', twitter: '' };

  return (
    <footer className="bg-gray-900 text-white relative no-print">
      {/* Gradient Top Border */}
      <div className="h-1 w-full bg-gradient-to-r from-brand-700 via-brand-500 to-brand-300"></div>
      
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-white rounded-full flex items-center justify-center p-1 overflow-hidden shadow-2xl shadow-black/50 ring-4 ring-white/20 relative z-10 transition-transform hover:scale-105">
                 <img src={logo} alt="Logo" className="w-full h-full object-contain" />
               </div>
               <div>
                  <h3 className="text-xl font-bold font-bengali text-white leading-tight">
                    {ORGANIZATION_INFO.name[lang]}
                  </h3>
                  <p className="text-xs text-brand-400 font-medium mt-1">EST. 1988</p>
               </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {ORGANIZATION_INFO.slogan[lang]}
            </p>
            <div className="flex gap-4">
               {socialLinks.facebook && (
                 <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors text-gray-400 hover:text-white border border-gray-700 hover:border-blue-500">
                   <Facebook size={16} />
                 </a>
               )}
               {socialLinks.youtube && (
                 <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 transition-colors text-gray-400 hover:text-white border border-gray-700 hover:border-red-500">
                   <Youtube size={16} />
                 </a>
               )}
               {socialLinks.twitter && (
                 <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-sky-500 transition-colors text-gray-400 hover:text-white border border-gray-700 hover:border-sky-500">
                   <Twitter size={16} />
                 </a>
               )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
             <h4 className="text-lg font-bold mb-6 text-white border-l-4 border-brand-500 pl-3">{lang === 'en' ? 'Quick Links' : 'দ্রুত লিঙ্ক'}</h4>
             <ul className="space-y-3">
               {[
                 { to: '/about', label: TRANSLATIONS.get('about', lang) },
                 { to: '/events', label: TRANSLATIONS.get('events', lang) },
                 { to: '/gallery', label: TRANSLATIONS.get('gallery', lang) },
                 { to: '/leaders', label: TRANSLATIONS.get('leaders', lang) },
               ].map((item, idx) => (
                 <li key={idx}>
                   <Link to={item.to} className="text-gray-400 hover:text-brand-400 transition-colors text-sm flex items-center gap-2 group">
                     <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-brand-500 transition-colors"></span>
                     {item.label}
                   </Link>
                 </li>
               ))}
               <li>
                 <Link to="/admin" className="text-gray-500 hover:text-gray-300 transition-colors text-sm flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-gray-500"></span>
                    {TRANSLATIONS.get('admin', lang)}
                 </Link>
               </li>
             </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white border-l-4 border-brand-500 pl-3">{lang === 'en' ? 'Contact Us' : 'যোগাযোগ'}</h4>
            <ul className="space-y-4">
               <li className="flex items-start gap-3 text-gray-400 text-sm">
                 <MapPin size={18} className="shrink-0 text-brand-500 mt-0.5" />
                 <span>{ORGANIZATION_INFO.address}</span>
               </li>
               <li className="flex items-center gap-3 text-gray-400 text-sm">
                 <Phone size={18} className="shrink-0 text-brand-500" />
                 <a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a>
               </li>
               <li className="flex items-center gap-3 text-gray-400 text-sm">
                 <Mail size={18} className="shrink-0 text-brand-500" />
                 <a href={`mailto:${ORGANIZATION_INFO.contact.email}`} className="hover:text-white transition-colors break-all">{ORGANIZATION_INFO.contact.email}</a>
               </li>
            </ul>
          </div>
          
          {/* CTA */}
          <div className="bg-gray-800 rounded-2xl p-6 text-center border border-gray-700 shadow-xl">
             <Heart size={32} className="text-brand-500 mx-auto mb-3" fill="currentColor" />
             <h5 className="font-bold text-white mb-2">{lang === 'en' ? 'Support Our Cause' : 'আমাদের পাশে দাঁড়ান'}</h5>
             <p className="text-xs text-gray-400 mb-4">{lang === 'en' ? 'Your contribution changes lives.' : 'আপনার অবদান জীবন বদলে দিতে পারে।'}</p>
             <Link to="/donate" className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-sm font-bold py-2.5 px-6 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 w-full justify-center">
               {TRANSLATIONS.get('donate', lang)} <ArrowRight size={16} />
             </Link>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} {ORGANIZATION_INFO.name.en}. All Rights Reserved.
          </p>
          <p className="text-xs text-gray-600 text-center md:text-right flex items-center gap-1">
             <span className="opacity-70">Developed by</span> 
             <span className="font-semibold text-gray-400">Ahmed Hossain Pavel</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
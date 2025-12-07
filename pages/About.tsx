import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ORGANIZATION_INFO, TRANSLATIONS } from '../constants';
import { storage } from '../services/storage';
import { Users, BookOpen, Heart, HandHelping, Trophy, Phone, Mail, MapPin } from 'lucide-react';

const About: React.FC = () => {
  const { lang } = useLanguage();
  const [phone, setPhone] = useState(ORGANIZATION_INFO.contact.phone);
  
  useEffect(() => {
    const loadSettings = async () => {
        const settings = await storage.getAppSettings();
        setPhone(settings.contactPhone);
    };
    loadSettings();
  }, []);

  const coreValues = [
    {
      icon: <Users size={32} />,
      title: { en: 'Unity', bn: 'ঐক্য' },
      desc: { en: 'United we stand to serve humanity.', bn: 'মানবসেবায় আমরা সবাই একতাবদ্ধ।' },
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
    },
    {
      icon: <BookOpen size={32} />,
      title: { en: 'Education', bn: 'শিক্ষা' },
      desc: { en: 'Light of knowledge for every child.', bn: 'প্রতিটি শিশুর জন্য শিক্ষার আলো।' },
      color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400'
    },
    {
      icon: <Heart size={32} />,
      title: { en: 'Peace', bn: 'শান্তি' },
      desc: { en: 'Promoting social harmony and peace.', bn: 'সামাজিক সম্প্রীতি ও শান্তি বজায় রাখা।' },
      color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
    },
    {
      icon: <HandHelping size={32} />,
      title: { en: 'Service', bn: 'সেবা' },
      desc: { en: 'Selfless service to the underprivileged.', bn: 'সুবিধাবঞ্চিতদের জন্য নিঃস্বার্থ সেবা।' },
      color: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
    },
    {
      icon: <Trophy size={32} />,
      title: { en: 'Sports', bn: 'ক্রীড়া' },
      desc: { en: 'Building character through sports.', bn: 'ক্রীড়ার মাধ্যমে চরিত্র ও স্বাস্থ্য গঠন।' },
      color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-brand-700 dark:text-brand-500 font-bengali">
            {ORGANIZATION_INFO.name[lang]}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {lang === 'en' 
              ? 'Established in 1988, we are a dedicated non-profit entity based in Sylhet, working tirelessly to uplift underprivileged communities through our five core pillars.' 
              : '১৯৮৮ সালে প্রতিষ্ঠিত, আমরা একটি নিবেদিত অলাভজনক সংস্থা যা সিলেটে অবস্থিত। আমাদের পাঁচটি মূল স্তম্ভের মাধ্যমে সুবিধাবঞ্চিত জনগোষ্ঠীর উন্নয়নে আমরা নিরলসভাবে কাজ করে যাচ্ছি।'}
          </p>
        </div>

        {/* Core Values / Slogan Section */}
        <div className="py-8">
           <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-white border-b-2 border-brand-100 dark:border-gray-700 inline-block px-8 pb-2 mx-auto block w-fit">
             {lang === 'en' ? 'Our Core Values' : 'আমাদের মূলমন্ত্র'}
           </h2>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {coreValues.map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center group hover:-translate-y-2">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${item.color}`}>
                      {item.icon}
                   </div>
                   <h3 className="text-xl font-bold font-bengali text-gray-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                     {item.title[lang]}
                   </h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">
                     {item.desc[lang]}
                   </p>
                </div>
              ))}
           </div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-brand-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-3xl border border-brand-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-2xl font-bold text-brand-800 dark:text-brand-400 mb-4 font-bengali flex items-center gap-2">
                 {TRANSLATIONS.get('mission', lang)}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                 {lang === 'en' 
                   ? 'To alleviate poverty, ensure basic rights, and promote education for all, creating a foundation for a self-reliant community.' 
                   : 'দারিদ্র্য বিমোচন, মৌলিক অধিকার নিশ্চিতকরণ এবং সবার জন্য শিক্ষা নিশ্চিত করার মাধ্যমে একটি স্বাবলম্বী সমাজের ভিত্তি তৈরি করা।'}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 p-8 rounded-3xl border border-blue-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-400 mb-4 font-bengali flex items-center gap-2">
                 {TRANSLATIONS.get('vision', lang)}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                 {lang === 'en' 
                   ? 'A society based on peace, equality, and mutual support where every individual has the opportunity to thrive.' 
                   : 'শান্তি, সাম্য এবং পারস্পরিক সহযোগিতার ভিত্তিতে এমন একটি সমাজ গঠন করা যেখানে প্রতিটি ব্যক্তির উন্নতির সুযোগ থাকে।'}
              </p>
            </div>
        </div>
          
        {/* Contact Info */}
        <div className="bg-gray-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           
           <h3 className="text-2xl font-bold mb-8 text-center relative z-10">{lang === 'en' ? 'Contact Us' : 'যোগাযোগ করুন'}</h3>
           
           <div className="grid md:grid-cols-3 gap-8 relative z-10">
              <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                    <Phone className="text-brand-400" size={24} />
                 </div>
                 <h4 className="font-bold mb-1">Phone</h4>
                 <p className="text-gray-300">{phone}</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                    <Mail className="text-brand-400" size={24} />
                 </div>
                 <h4 className="font-bold mb-1">Email</h4>
                 <p className="text-gray-300 break-all">{ORGANIZATION_INFO.contact.email}</p>
              </div>

              <div className="flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                    <MapPin className="text-brand-400" size={24} />
                 </div>
                 <h4 className="font-bold mb-1">Address</h4>
                 <p className="text-gray-300">{ORGANIZATION_INFO.address}</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default About;
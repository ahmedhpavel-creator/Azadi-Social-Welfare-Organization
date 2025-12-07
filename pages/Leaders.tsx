import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { storage } from '../services/storage';
import { TRANSLATIONS } from '../constants';
import { Quote } from 'lucide-react';
import { Leader } from '../types';

const Leaders: React.FC = () => {
  const { lang } = useLanguage();
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    const fetchLeaders = async () => {
        try {
            const data = await storage.getLeaders();
            if (Array.isArray(data)) {
                setLeaders(data.sort((a, b) => a.order - b.order));
            }
        } catch(e) {
            console.error("Failed to fetch leaders", e);
        }
    };
    fetchLeaders();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white font-bengali mb-4">
            {TRANSLATIONS.get('leaders', lang)}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {lang === 'en' 
              ? 'Meet the dedicated individuals guiding our vision and mission.' 
              : 'আমাদের লক্ষ্য ও উদ্দেশ্য বাস্তবায়নে নিবেদিতপ্রাণ ব্যক্তিবর্গের সাথে পরিচিত হোন।'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {leaders.map((leader) => (
            <div key={leader.id} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-100 dark:border-gray-800 flex flex-col">
              <div className="h-32 bg-gradient-to-r from-brand-600 to-brand-400 relative shrink-0">
                <div className="absolute inset-0 bg-black/10"></div>
              </div>
              
              <div className="px-8 pb-8 flex flex-col items-center">
                <div className="-mt-14 w-28 h-28 rounded-full border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden bg-gray-200 z-10 shrink-0 mb-5">
                  <img src={leader.image} alt={leader.name?.[lang]} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                
                <div className="text-center w-full flex-1 flex flex-col">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {leader.name?.[lang] || 'Unknown'}
                  </h2>
                  <p className="text-brand-600 dark:text-brand-400 font-semibold text-sm uppercase tracking-wide mb-6">
                    {leader.designation?.[lang] || ''}
                  </p>

                  {leader.bio?.[lang] && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed px-2">
                        {leader.bio[lang]}
                    </p>
                  )}
                  
                  <div className="relative bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl flex-1 flex items-center justify-center">
                    <Quote size={20} className="text-brand-200 dark:text-gray-700 absolute top-2 left-2" />
                    <p className="text-gray-600 dark:text-gray-300 text-sm italic relative z-10 leading-relaxed">
                      "{leader.message?.[lang] || ''}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Leaders;
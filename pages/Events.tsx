import React, { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { storage } from '../services/storage';
import { TRANSLATIONS } from '../constants';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Event } from '../types';

const Events: React.FC = () => {
  const { lang } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
        try {
            const data = await storage.getEvents();
            if(Array.isArray(data)) {
                setEvents(data);
            }
        } catch(e) {
            console.error("Failed to fetch events", e);
        }
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12 font-bengali text-gray-900 dark:text-white">
          {TRANSLATIONS.get('events', lang)}
        </h1>

        <div className="space-y-8 max-w-5xl mx-auto">
          {events.map((event) => {
            const dateObj = new Date(event.date);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' });
            
            return (
              <div key={event.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row group">
                <div className="md:w-2/5 h-64 md:h-auto relative overflow-hidden">
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                   <img src={event.image} alt={event.title?.[lang]} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   
                   <div className="absolute top-4 left-4 md:hidden bg-white/95 text-gray-900 rounded-lg p-2 text-center shadow-lg z-20 min-w-[60px]">
                      <span className="block text-xs font-bold uppercase text-gray-500">{month}</span>
                      <span className="block text-xl font-bold text-brand-600">{day}</span>
                   </div>
                </div>
                
                <div className="p-6 md:p-8 md:w-3/5 flex flex-col justify-center relative">
                   <div className="hidden md:block absolute top-8 right-8 bg-brand-50 dark:bg-gray-800 text-brand-700 dark:text-brand-400 rounded-xl p-3 text-center border border-brand-100 dark:border-gray-700 min-w-[70px]">
                      <span className="block text-sm font-bold uppercase tracking-wider opacity-70">{month}</span>
                      <span className="block text-2xl font-bold">{day}</span>
                   </div>

                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 pr-20">
                    {event.title?.[lang] || 'Untitled'}
                  </h2>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="flex items-center gap-1.5"><Calendar size={16} className="text-brand-500" /> {event.date}</span>
                    <span className="flex items-center gap-1.5"><MapPin size={16} className="text-brand-500" /> {event.location}</span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    {event.description?.[lang] || ''}
                  </p>
                </div>
              </div>
            );
          })}
          
          {events.length === 0 && (
             <div className="text-center py-20">
               <p className="text-gray-400 text-lg">No upcoming events.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
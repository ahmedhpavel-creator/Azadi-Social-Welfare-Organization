import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { TRANSLATIONS } from '../constants';
import { Image, Loader2 } from 'lucide-react';
import { storage } from '../services/storage';
import { GalleryItem } from '../types';

const Gallery: React.FC = () => {
  const { lang } = useLanguage();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGallery = async () => {
        try {
            const data = await storage.getGallery();
            if (Array.isArray(data)) {
                setImages(data);
            }
        } catch (e) {
            console.error("Failed to load gallery", e);
        } finally {
            setLoading(false);
        }
    };
    loadGallery();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4 font-bengali text-gray-900 dark:text-white">
          {TRANSLATIONS.get('gallery', lang)}
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
           {lang === 'en' ? 'Capturing moments of unity, service, and progress.' : 'ঐক্য, সেবা এবং অগ্রগতির মুহূর্তগুলো।'}
        </p>

        {loading ? (
           <div className="flex justify-center py-20">
               <Loader2 className="animate-spin text-brand-500" size={40} />
           </div>
        ) : (
            <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-200 dark:bg-gray-800 shadow-md cursor-pointer border border-gray-100 dark:border-gray-800">
                      <img 
                        src={img.imageUrl} 
                        alt={img.caption?.[lang]}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x600?text=No+Image')}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                        <span className="text-brand-300 text-xs font-bold uppercase tracking-wider mb-1">{img.category}</span>
                        <p className="text-white text-base font-medium font-bengali translate-y-2 group-hover:translate-y-0 transition-transform duration-300">{img.caption?.[lang] || ''}</p>
                      </div>
                      <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-sm p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                        <Image size={16} />
                      </div>
                    </div>
                  ))}
                </div>
                {images.length === 0 && (
                    <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Image size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">{lang === 'en' ? 'No images in gallery.' : 'গ্যালারিতে কোনো ছবি নেই।'}</p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default Gallery;
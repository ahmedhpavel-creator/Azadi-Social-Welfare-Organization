import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { generateChatResponse } from '../services/ai';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC = () => {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set initial welcome message based on language
    if (messages.length === 0) {
      setMessages([
        { 
          id: 'welcome', 
          role: 'model', 
          text: lang === 'en' 
            ? 'Assalamu Alaikum! I am the Azadi AI Assistant. How can I help you today?' 
            : 'আসসালামু আলাইকুম! আমি আজাদী এআই অ্যাসিস্ট্যান্ট। আমি আপনাকে কীভাবে সাহায্য করতে পারি?' 
        }
      ]);
    }
  }, [lang]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass full messages including id to support filtering in the service
      const responseText = await generateChatResponse(userMsg.text, messages);
      
      const botMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-3 sm:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center no-print border-2 border-white dark:border-gray-800
          ${isOpen ? 'bg-gray-800 dark:bg-gray-700 rotate-90' : 'bg-gradient-to-tr from-brand-600 to-brand-400'}`}
      >
        {isOpen ? <X color="white" size={20} /> : <MessageCircle color="white" size={24} fill="currentColor" className="text-white/20" />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-20 right-4 sm:bottom-24 sm:right-6 w-[calc(100vw-2rem)] sm:w-[320px] h-[450px] max-h-[65vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right border border-gray-100 dark:border-gray-700 no-print ring-1 ring-black/5
        ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-8 pointer-events-none'}`}
      >
        {/* Modern Compact Header */}
        <div className="bg-gradient-to-r from-brand-600 to-brand-500 p-3 flex items-center justify-between text-white shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
              <Bot size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Azadi Support</h3>
              <p className="text-[10px] text-brand-100 flex items-center gap-1 opacity-90">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                Active
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/50 scroll-smooth">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0 mt-0.5 border border-brand-200 dark:border-brand-800">
                   <Sparkles size={12} className="text-brand-600 dark:text-brand-400" />
                </div>
              )}
              <div 
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-brand-600 text-white rounded-br-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none'
                  }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 justify-start animate-pulse">
               <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0">
                  <Bot size={12} className="text-brand-600" />
               </div>
               <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-2xl rounded-bl-none border border-gray-100 dark:border-gray-700 flex items-center gap-1">
                 <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                 <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                 <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></span>
               </div>
            </div>
          )}
        </div>

        {/* Compact Input Area */}
        <form onSubmit={handleSend} className="p-2.5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'en' ? "Ask a question..." : "প্রশ্ন করুন..."}
            className="flex-1 bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-full px-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all placeholder:text-gray-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 flex items-center justify-center bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-transform active:scale-95 shadow-sm"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatBot;
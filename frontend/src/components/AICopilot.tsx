import React, { useState } from 'react';
import api from '../api';
import { MessageSquare, X, Send, BrainCircuit, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function AICopilot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: 'user' | 'ai', text: string}[]>([
    { sender: 'ai', text: `Hi ${user?.name}! I am your AI Copilot. Ask me about your ${user?.role === 'FINANCE' ? 'collections, risks, or anomalies' : 'invoices, payments, or billing changes'}.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg, customerId: user.customerId || user.customer?.id, role: user.role });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.reply }]);
    } catch (err: any) {
      const errorText = err.response?.data?.error || 'Sorry, I am having trouble connecting to my brain right now.';
      setMessages(prev => [...prev, { sender: 'ai', text: errorText }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-ups-brown text-ups-gold rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col h-[500px] max-h-[80vh]">
          <div className="bg-ups-brown p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <BrainCircuit className="text-ups-gold" size={20} />
              <span className="font-bold">AI Copilot</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={clsx("flex gap-3 max-w-[85%]", m.sender === 'user' ? "ml-auto flex-row-reverse" : "")}>
                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0", m.sender === 'user' ? "bg-ups-gold text-ups-brown" : "bg-ups-brown text-ups-gold")}>
                  {m.sender === 'user' ? <User size={16} /> : <BrainCircuit size={16} />}
                </div>
                <div className={clsx("p-3 rounded-2xl text-sm", m.sender === 'user' ? "bg-ups-gold text-ups-brown rounded-tr-none font-medium" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none")}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-ups-brown text-ups-gold">
                  <BrainCircuit size={16} />
                </div>
                <div className="p-3 bg-white border border-gray-200 text-gray-400 rounded-2xl rounded-tl-none text-sm flex gap-1">
                  <span className="animate-bounce">•</span><span className="animate-bounce" style={{animationDelay: '0.2s'}}>•</span><span className="animate-bounce" style={{animationDelay: '0.4s'}}>•</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a billing question..." 
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-ups-gold"
            />
            <button type="submit" disabled={loading} className="w-10 h-10 bg-ups-gold text-ups-brown rounded-full flex items-center justify-center hover:bg-[#e5a300] transition-colors shrink-0 disabled:opacity-50">
              <Send size={16} className="ml-1" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

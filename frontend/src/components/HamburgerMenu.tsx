import { useState } from 'react';
import { Menu, X, Home, Clock, LogOut, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HamburgerMenu({ role, onLogout }: { role: string, onLogout: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="md:hidden">
      <button onClick={() => setIsOpen(true)} className="p-2 text-ups-gold hover:text-white transition-colors">
        <Menu size={28} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          {/* Drawer */}
          <div className="relative w-64 bg-ups-brown h-full shadow-2xl flex flex-col transform transition-transform animate-slide-in-right ml-auto">
            <div className="p-6 flex justify-between items-center border-b border-[#4d291f]">
              <span className="text-ups-gold font-bold text-lg tracking-wider">Menu</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-4 flex flex-col gap-2">
              <button onClick={() => { setIsOpen(false); navigate(role === 'CUSTOMER' ? '/customer' : '/finance'); }} className="flex items-center gap-3 w-full p-4 text-left text-white hover:bg-[#4d291f] rounded-xl transition-colors font-medium">
                <Home size={20} className="text-ups-gold" /> Dashboard
              </button>
              
              {role === 'CUSTOMER' && (
                <button onClick={() => { setIsOpen(false); navigate('/history'); }} className="flex items-center gap-3 w-full p-4 text-left text-white hover:bg-[#4d291f] rounded-xl transition-colors font-medium">
                  <Clock size={20} className="text-ups-gold" /> Payment History
                </button>
              )}
              
              {role === 'FINANCE' && (
                <button onClick={() => { setIsOpen(false); navigate('/reconciliation'); }} className="flex items-center gap-3 w-full p-4 text-left text-white hover:bg-[#4d291f] rounded-xl transition-colors font-medium">
                  <CheckCircle size={20} className="text-ups-gold" /> Reconciliation
                </button>
              )}
            </div>
            
            <div className="p-4 border-t border-[#4d291f]">
              <button onClick={onLogout} className="flex items-center gap-3 w-full p-4 text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-bold">
                <LogOut size={20} /> Secure Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

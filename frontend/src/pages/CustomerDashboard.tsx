import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { FileText, CreditCard, Clock, Activity, LogOut, Search, Info } from 'lucide-react';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import HamburgerMenu from '../components/HamburgerMenu';

type Invoice = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
};

export default function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!user || user.role !== 'CUSTOMER') {
      navigate('/');
      return;
    }
    
    const targetCustomerId = user.customerId || user.customer?.id;
    const fetchData = () => {
      api.get(`/invoices?customerId=${targetCustomerId}`)
        .then(res => setInvoices(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 5000); // Auto-poll every 5s for real-time updates

    return () => clearInterval(intervalId);
  }, [user, navigate]);

  const outstanding = invoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);
  const paid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const pending = invoices.filter(i => i.status === 'PENDING').reduce((sum, inv) => sum + inv.outstandingAmount, 0);
  const overdue = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, inv) => sum + inv.outstandingAmount, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-ups-brown text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ups-gold rounded-lg flex items-center justify-center">
              <Activity className="text-ups-brown" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-ups-gold">UPS<span className="text-white font-light"> Smart Billing</span></h1>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <div className="hidden md:block">
              <p className="text-sm text-gray-300">Welcome,</p>
              <p className="font-semibold">{user?.customer?.companyName || user?.name}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="hidden md:block p-2 hover:bg-[#4d291f] rounded-full transition-colors group"
              title="Logout"
            >
              <LogOut size={20} className="text-gray-300 group-hover:text-white" />
            </button>
            <HamburgerMenu role="CUSTOMER" onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <KpiCard title="Total Outstanding" amount={outstanding} icon={<FileText size={24} />} color="blue" />
          <KpiCard title="Total Paid" amount={paid} icon={<CreditCard size={24} />} color="green" />
          <KpiCard title="Pending" amount={pending} icon={<Clock size={24} />} color="yellow" />
          <KpiCard title="Overdue" amount={overdue} icon={<Activity size={24} />} color="red" />
        </div>

        {/* Invoice List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">Recent Invoices</h2>
            <div className="flex gap-4">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 pl-3 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ups-gold appearance-none bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
              </select>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search invoices..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ups-gold focus:border-ups-gold transition-all w-64"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Invoice Number</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Balance</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading invoices...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No invoices found matching your criteria.</td></tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 pl-6 font-medium text-gray-900">{inv.invoiceNumber}</td>
                      <td className="p-4 text-gray-600">{formatDistanceToNow(new Date(inv.invoiceDate), { addSuffix: true })}</td>
                      <td className="p-4 text-gray-600">{format(new Date(inv.dueDate), 'MMM dd, yyyy')}</td>
                      <td className="p-4 text-right font-medium">${inv.totalAmount.toFixed(2)}</td>
                      <td className="p-4 text-right font-bold text-gray-900">${inv.outstandingAmount.toFixed(2)}</td>
                      <td className="p-4 text-center">
                        <span className={clsx("px-3 py-1 rounded-full text-xs font-bold border", getStatusColor(inv.status))}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => navigate(`/invoice/${inv.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="View Details">
                         <Info size={18} />
                       </button>
                       {inv.outstandingAmount > 0 && (
                         <button onClick={() => navigate(`/pay/${inv.id}`)} className="px-3 py-1 bg-ups-gold text-ups-brown text-sm font-bold rounded hover:bg-[#e5a300] transition-colors shadow-sm">
                           Pay
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    
    <div className="mt-8 flex justify-end">
      <button onClick={() => navigate('/history')} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors">
        <Clock size={20} /> View Payment History
      </button>
    </div>
  </main>
    </div>
  );
}

function KpiCard({ title, amount, icon, color }: { title: string, amount: number, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    red: 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group flex items-start gap-4">
      <div className={clsx("p-4 rounded-xl border transition-transform group-hover:scale-110", colorMap[color])}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-extrabold text-gray-900 mt-1">${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
      </div>
    </div>
  );
}

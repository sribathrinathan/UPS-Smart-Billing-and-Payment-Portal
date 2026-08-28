import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Activity, LogOut, TrendingUp, AlertTriangle, CheckCircle, ShieldAlert, AlertOctagon, Info } from 'lucide-react';
import clsx from 'clsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import HamburgerMenu from '../components/HamburgerMenu';

export default function FinanceDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!user || user.role !== 'FINANCE') {
      navigate('/');
      return;
    }
    
    const fetchData = () => {
      api.get('/finance/dashboard')
        .then(res => setData(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    };

    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 5000); // Auto-poll every 5s for real-time updates

    return () => clearInterval(intervalId);
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading || !data) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading Finance Intelligence...</div>;
  }

  const { kpis, anomalies, highRisk } = data;

  // Mock chart data based on KPIs for visuals
  const chartData = [
    { name: 'Paid', amount: kpis.paidAmount },
    { name: 'Pending', amount: kpis.pendingAmount },
    { name: 'Overdue', amount: kpis.overdueAmount },
  ];

  const filteredInvoices = data.allInvoices?.filter((inv: any) => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inv.customer?.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <header className="bg-ups-brown text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ups-gold rounded-lg flex items-center justify-center">
              <TrendingUp className="text-ups-brown" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-wide text-ups-gold">UPS<span className="text-white font-light"> Finance Intelligence</span></h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button onClick={() => navigate('/reconciliation')} className="hidden md:flex px-4 py-2 bg-white text-ups-brown font-bold rounded-lg hover:bg-gray-100 transition-colors items-center gap-2 shadow-sm text-sm">
              <CheckCircle size={18} /> Reconcile
            </button>
            <button onClick={handleLogout} className="hidden md:block p-2 hover:bg-[#4d291f] rounded-full transition-colors group">
              <LogOut size={20} className="text-gray-300 group-hover:text-white" />
            </button>
            <HamburgerMenu role="FINANCE" onLogout={handleLogout} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard title="Total Invoices" amount={kpis.totalInvoices} subtitle="All time count" isCount={true} />
          <StatCard title="Total Revenue" amount={kpis.totalValue} subtitle="All Invoices" />
          <StatCard title="Collected" amount={kpis.paidAmount} subtitle={`${kpis.collectionRate.toFixed(1)}% Collection Rate`} color="text-green-600" />
          <StatCard title="Pending Review" amount={kpis.pendingAmount} subtitle="In Processing" color="text-yellow-600" />
          <StatCard title="At Risk / Overdue" amount={kpis.overdueAmount} subtitle="Requires Action" color="text-red-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Revenue Distribution Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity size={20} className="text-ups-brown"/> Revenue Distribution
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(value: any) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="#FFB500" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* DSO Cash Flow Predictor */}
          <div className="bg-gradient-to-br from-ups-brown to-[#4d291f] p-6 rounded-2xl shadow-xl text-white relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <TrendingUp size={100} />
            </div>
            <h2 className="text-xl font-bold text-ups-gold mb-1 relative z-10 flex items-center gap-2">
              DSO Predictor
            </h2>
            <p className="text-sm text-gray-300 mb-4 relative z-10">AI forecasted 14-day cash flow recovery.</p>
            
            <div className="flex-1 w-full min-h-[200px] relative z-10 -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.cashFlowForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff80" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff80" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#331a12', border: '1px solid #FFB500', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#FFB500', fontWeight: 'bold' }}
                    formatter={(value: any) => [`$${value.toLocaleString()}`, 'Expected Cash']}
                  />
                  <Line type="monotone" dataKey="expectedCash" stroke="#FFB500" strokeWidth={4} dot={{ r: 4, fill: '#FFB500', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#fff', stroke: '#FFB500', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Intelligence Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Priority List */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <AlertOctagon className="text-ups-gold" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Collection Priority Engine</h2>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Risk Level</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {highRisk.length === 0 ? (
                     <tr><td colSpan={4} className="p-4 text-center text-gray-500">No high risk customers detected.</td></tr>
                   ) : highRisk.map((risk: any) => (
                     <tr key={risk.id} className="hover:bg-gray-50/50">
                       <td className="p-4 font-bold text-gray-900">{risk.invoice.customer.companyName}</td>
                       <td className="p-4 text-red-600 font-bold">${risk.invoice.outstandingAmount.toFixed(2)}</td>
                       <td className="p-4"><span className="px-2 py-1 bg-red-100 text-red-800 rounded font-bold text-xs">HIGH RISK ({risk.riskScore})</span></td>
                       <td className="p-4 text-center">
                         <div className="flex flex-col items-center gap-1">
                           <span className={clsx("text-[10px] uppercase tracking-wide font-black px-2 py-1 rounded", risk.riskScore > 85 ? "bg-red-200 text-red-900" : "bg-orange-100 text-orange-800")}>
                             {risk.riskScore > 85 ? 'Urgent Call' : 'Gentle Email'}
                           </span>
                           <button onClick={() => {
                              api.post('/ai/collection-email', { invoiceId: risk.invoice.id }).then(res => alert('Generated personalized email:\n\n' + res.data.emailText)).catch(() => alert('Failed to generate.'));
                           }} className="text-blue-600 hover:underline font-bold text-xs">Auto-Draft</button>
                         </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* High Risk */}
          <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden self-start">
            <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-800">
              <ShieldAlert size={20} />
              <h2 className="font-bold">High Collection Risk</h2>
            </div>
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              {highRisk.length === 0 ? <p className="text-gray-500">No high risk predictions.</p> : highRisk.map((risk: any) => (
                <div key={risk.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{risk.invoice.customer.companyName}</p>
                      <p className="text-sm text-gray-500">Invoice {risk.invoice.invoiceNumber}</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Score: {risk.riskScore}</span>
                  </div>
                  <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">AI Risk Factors:</p>
                    <ul className="list-disc pl-5">
                      {JSON.parse(risk.factorsJson).map((f: string, i: number) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Anomalies */}
          <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 overflow-hidden self-start">
            <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex items-center gap-2 text-yellow-800">
              <AlertTriangle size={20} />
              <h2 className="font-bold">Pending Anomalies (Pre-Invoice)</h2>
            </div>
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              {anomalies.length === 0 ? <p className="text-gray-500">No pending anomalies.</p> : anomalies.map((anomaly: any) => (
                <div key={anomaly.id} className="p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow flex items-start gap-4">
                  <div className="p-2 bg-yellow-100 text-yellow-800 rounded-lg">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="font-bold text-gray-900">{anomaly.anomalyType}</p>
                      <p className="text-sm font-bold text-red-600">+${anomaly.deviation}</p>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mt-1 mb-1">Invoice {anomaly.invoice?.invoiceNumber}</p>
                    <p className="text-sm text-gray-600">{anomaly.explanation}</p>
                    <div className="mt-3 flex gap-2">
                      <button 
                        onClick={() => navigate(`/invoice/${anomaly.invoiceId}`)}
                        className="text-xs px-3 py-1 bg-ups-gold hover:bg-yellow-500 text-ups-brown rounded font-bold transition-colors shadow-sm"
                      >
                        Review Invoice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Master Invoices Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50/50 gap-4">
            <h2 className="text-xl font-bold text-gray-900">All Invoices Master Ledger</h2>
            <div className="flex gap-4 w-full md:w-auto">
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
              <div className="relative flex-1 md:w-64">
                <input 
                  type="text" 
                  placeholder="Search invoice # or customer..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ups-gold focus:border-ups-gold transition-all"
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="border-b border-gray-100 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="p-4 pl-6">Invoice #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Total Amount</th>
                  <th className="p-4 text-right">Balance Due</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices?.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No invoices match your search criteria.</td></tr>
                ) : (
                  filteredInvoices?.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 pl-6 font-medium text-ups-brown">{inv.invoiceNumber}</td>
                      <td className="p-4 font-bold text-gray-900">{inv.customer?.companyName || 'Unknown'}</td>
                      <td className="p-4 text-gray-600">{formatDistanceToNow(new Date(inv.invoiceDate), { addSuffix: true })}</td>
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

function StatCard({ title, amount, subtitle, color = "text-gray-900", isCount = false }: { title: string, amount: number, subtitle: string, color?: string, isCount?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-ups-gold transition-colors">
      <p className="text-sm font-medium text-gray-500 tracking-wide">{title}</p>
      <p className={clsx("text-3xl font-extrabold mt-2", color)}>{isCount ? amount.toLocaleString() : `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</p>
      <p className="text-xs text-gray-400 mt-2 font-medium">{subtitle}</p>
    </div>
  );
}

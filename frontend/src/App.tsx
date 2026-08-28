import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CustomerDashboard from './pages/CustomerDashboard';
import FinanceDashboard from './pages/FinanceDashboard';
import InvoiceDetails from './pages/InvoiceDetails';
import PaymentSimulator from './pages/PaymentSimulator';
import PaymentHistory from './pages/PaymentHistory';
import PaymentReconciliation from './pages/PaymentReconciliation';
import AICopilot from './components/AICopilot';
import { useAuth } from './context/AuthContext';

import Register from './pages/Register';

const PrivateRoute = ({ children, role, allowedRoles }: { children: React.ReactNode, role?: string, allowedRoles?: string[] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  
  if (allowedRoles) {
    if (!allowedRoles.includes(user.role)) return <Navigate to={user.role === 'FINANCE' ? '/finance' : '/customer'} />;
  } else if (role && user.role !== role) {
    return <Navigate to={user.role === 'FINANCE' ? '/finance' : '/customer'} />;
  }
  
  return (
    <>
      {children}
      <AICopilot />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/customer" element={<PrivateRoute role="CUSTOMER"><CustomerDashboard /></PrivateRoute>} />
      <Route path="/finance" element={<PrivateRoute role="FINANCE"><FinanceDashboard /></PrivateRoute>} />
      <Route path="/invoice/:id" element={<PrivateRoute allowedRoles={['CUSTOMER', 'FINANCE']}><InvoiceDetails /></PrivateRoute>} />
      <Route path="/pay/:id" element={<PrivateRoute role="CUSTOMER"><PaymentSimulator /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute role="CUSTOMER"><PaymentHistory /></PrivateRoute>} />
      <Route path="/reconciliation" element={<PrivateRoute role="FINANCE"><PaymentReconciliation /></PrivateRoute>} />
    </Routes>
  );
}

export default App;

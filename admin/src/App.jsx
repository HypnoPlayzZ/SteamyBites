import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import only the necessary admin components
import { api } from './api.js';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import AdminRegisterPage from './pages/AdminRegisterPage.jsx';
import Footer from './components/FooterMain.jsx';
import { GlobalStyles } from './styles/GlobalStyles.jsx';


// --- Main Admin App ---
function App() {
  const [route, setRoute] = useState(window.location.hash || '#/admin-login');
  const [auth, setAuth] = useState({ token: null, name: null });
  const isAdminLoggedIn = !!auth.token;
  
  const handleHashChange = () => setRoute(window.location.hash || '#/admin-login');

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    const adminName = localStorage.getItem('admin_name');
    setAuth({ token: adminToken, name: adminName });

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoginSuccess = (token, name) => {
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_name', name);
      setAuth({ token, name });
      window.location.hash = '#/admin'; // Redirect to dashboard on successful login
  };

  const handleLogout = () => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_name');
      setAuth({ token: null, name: null });
      window.location.hash = '#/admin-login';
  };

  const renderPage = () => {
    if (!isAdminLoggedIn) {
        // If not logged in, show the login page regardless of the hash
        return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    
    // If logged in, render pages based on the route
    switch (route) {
      case '#/admin-register': return <AdminRegisterPage />;
      case '#/admin':
      default:
         return <AdminDashboard adminName={auth.name} handleLogout={handleLogout} />;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <GlobalStyles />
      <main className="container my-5 flex-grow-1">{renderPage()}</main>
      <Footer />
    </div>
  );
}

export default App;


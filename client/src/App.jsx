import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import the separated components
import { api } from './api.js';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CustomerDashboard from './pages/CustomerDashboard.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminRegisterPage from './pages/AdminRegisterPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import { AboutPage, ContactPage } from './pages/StaticPage.jsx';
import CartModal from './components/CartModalMain.jsx';
import Header from './components/HeaderMain.jsx';
import Footer from './components/FooterMain.jsx';
import { GlobalStyles } from './styles/GlobalStyles.jsx';


// --- Main App ---
function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [menuItems, setMenuItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  
  const [auth, setAuth] = useState({
      customer: { token: null, name: null },
      admin: { token: null, name: null }
  });

  const isCustomerLoggedIn = !!auth.customer.token;
  const isAdminLoggedIn = !!auth.admin.token;
  
  const handleHashChange = () => setRoute(window.location.hash || '#/');

  useEffect(() => {
    const customerToken = localStorage.getItem('customer_token');
    const customerName = localStorage.getItem('customer_name');
    const adminToken = localStorage.getItem('admin_token');
    const adminName = localStorage.getItem('admin_name');

    setAuth({
        customer: { token: customerToken, name: customerName },
        admin: { token: adminToken, name: adminName }
    });

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  useEffect(() => {
    api.get('/menu')
      .then(response => setMenuItems(response.data))
      .catch(error => console.error("Error fetching menu items:", error));
  }, []);

  const handleLoginSuccess = (token, name, role) => {
      if (role === 'admin') {
          localStorage.setItem('admin_token', token);
          localStorage.setItem('admin_name', name);
          setAuth(prev => ({ ...prev, admin: { token, name } }));
      } else {
          localStorage.setItem('customer_token', token);
          localStorage.setItem('customer_name', name);
          setAuth(prev => ({ ...prev, customer: { token, name } }));
      }
  };

  const handleLogout = (role) => {
      if (role === 'admin') {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_name');
          setAuth(prev => ({ ...prev, admin: { token: null, name: null } }));
          window.location.hash = '#/admin-login';
      } else {
          localStorage.removeItem('customer_token');
          localStorage.removeItem('customer_name');
          setAuth(prev => ({ ...prev, customer: { token: null, name: null } }));
          window.location.hash = '#/';
      }
  };

  const submitOrder = (finalTotal, appliedCoupon = null) => {
    const orderDetails = {
        items: cartItems.map(item => ({ 
            menuItemId: item._id, 
            quantity: item.quantity,
            variant: item.variant,
            priceAtOrder: item.priceAtOrder,
            instructions: item.instructions
        })),
        totalPrice: cartItems.reduce((total, item) => total + item.priceAtOrder * item.quantity, 0),
        finalPrice: finalTotal,
        appliedCoupon: appliedCoupon ? {
            code: appliedCoupon.code,
            discountType: appliedCoupon.discountType,
            discountValue: appliedCoupon.discountValue
        } : undefined,
        customerName: auth.customer.name
    };

    api.post('/orders', orderDetails)
        .then(() => { 
            alert('Order placed successfully!'); 
            setCartItems([]); 
            setShowCart(false); 
        })
        .catch(error => { 
            console.error('Error placing order:', error); 
            const errorMessage = error.response?.data?.message || 'There was a problem placing your order.';
            alert(errorMessage);
        });
  };
  
    const handleAddToCart = (itemToAdd, variant, quantity = 1, instructions = '') => {
        setCartItems(prevItems => {
            const cartId = `${itemToAdd._id}-${variant}-${instructions}`;
            const isItemInCart = prevItems.find(item => item.cartId === cartId);
            
            if (isItemInCart) { 
                return prevItems.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + quantity } : item); 
            }

            const newItem = { 
                ...itemToAdd, 
                quantity: quantity, 
                variant: variant,
                priceAtOrder: itemToAdd.price[variant],
                instructions: instructions,
                cartId: cartId
            };
            return [...prevItems, newItem];
        });
    };

  const renderPage = () => {
    switch (route) {
      case '#/about': return <AboutPage />;
      case '#/contact': return <ContactPage />;
      case '#/login': return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case '#/register': return <RegisterPage />;
      case '#/admin-login': return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
      case '#/admin': return isAdminLoggedIn ? <AdminDashboard adminName={auth.admin.name} handleLogout={handleLogout} /> : <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
      case '#/admin-register': return isAdminLoggedIn ? <AdminRegisterPage /> : <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
      case '#/dashboard': return isCustomerLoggedIn ? <CustomerDashboard userName={auth.customer.name} /> : <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case '#/': 
      default: 
        return <MenuPage onAddToCart={handleAddToCart} />;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <GlobalStyles />
      <Header 
        route={route}
        auth={auth}
        isCustomerLoggedIn={isCustomerLoggedIn}
        isAdminLoggedIn={isAdminLoggedIn}
        handleLogout={handleLogout}
        setShowCart={setShowCart}
        cartItems={cartItems}
      />
      <main className="container my-5 flex-grow-1">{renderPage()}</main>
      <Footer />
      <CartModal 
          show={showCart} 
          handleClose={() => setShowCart(false)} 
          cartItems={cartItems} 
          setCartItems={setCartItems} 
          submitOrder={submitOrder} 
          isLoggedIn={isCustomerLoggedIn}
      />
    </div>
  );
}

export default App;


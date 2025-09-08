import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, ListGroup, Badge, CloseButton, Table, Nav, Tab } from 'react-bootstrap';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// --- Custom Styles and Animations ---
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');

    body {
      font-family: 'Poppins', sans-serif;
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .fade-in {
      animation: fadeIn 0.5s ease-in-out forwards;
    }

    /* Header */
    .navbar-brand .fw-bold {
      color: #d9534f;
    }

    .nav-link.active {
      color: #d9534f !important;
    }

    /* Hero Section */
    .hero-section {
      background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://placehold.co/1200x400/333333/FFFFFF?text=Delicious+Food') no-repeat center center;
      background-size: cover;
      color: white;
      padding: 6rem 0;
      margin-bottom: 3rem;
      border-radius: 1rem;
      animation: fadeIn 1s ease-in-out;
    }
    
    .hero-section h1 {
      font-weight: 700;
      font-size: 3.5rem;
    }

    /* Menu Card */
    .menu-card {
      transition: all 0.3s ease;
      animation: fadeIn 0.5s ease-in-out forwards;
    }

    .menu-card:hover {
      transform: translateY(-10px);
      box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important;
    }

    /* Admin Tabs */
    .nav-tabs .nav-link {
      color: #6c757d;
    }
    .nav-tabs .nav-link.active {
      color: #d9534f;
      border-color: #d9534f #d9534f #fff;
    }
    
  `}</style>
);


// --- Page Components ---

const HeroSection = () => (
  <div className="hero-section text-center">
    <h1 className="display-4">Welcome to Steamy Bites</h1>
    <p className="lead">Experience the finest flavors and culinary delights.</p>
  </div>
);

const MenuPage = ({ items, onAddToCart }) => {
  if (items.length === 0) {
    return <div className="text-center"><div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }
  return (
    <div className="fade-in">
      <HeroSection />
      <h2 className="mb-4 text-center">Our Menu</h2>
      <div className="row">
        {items.map((item, index) => {
          const halfPrice = (item.price && typeof item.price.half === 'number') ? item.price.half.toFixed(2) : 'N/A';
          const fullPrice = (item.price && typeof item.price.full === 'number') ? item.price.full.toFixed(2) : 'N/A';

          return (
            <div className="col-md-6 col-lg-4 mb-4" key={item._id} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="card h-100 shadow-sm border-0 menu-card">
                <img src={item.imageUrl} className="card-img-top" alt={item.name} style={{height: '200px', objectFit: 'cover'}} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/CCCCCC/FFFFFF?text=Image+Not+Found'; }}/>
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text text-muted small">{item.description}</p>
                  <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold text-danger">Half: ${halfPrice}</span>
                          <Button variant="outline-danger" size="sm" onClick={() => onAddToCart(item, 'half')} disabled={halfPrice === 'N/A'}>Add</Button>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-danger">Full: ${fullPrice}</span>
                          <Button variant="danger" size="sm" onClick={() => onAddToCart(item, 'full')} disabled={fullPrice === 'N/A'}>Add</Button>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

const AboutPage = () => ( <div className="text-center fade-in"><h1>About Us</h1><p className="lead">Steamy Bites was founded with a passion for creating unforgettable dining experiences.</p><p>We believe in using the freshest ingredients to craft delicious meals that bring people together.</p></div> );
const ContactPage = () => ( <div className="text-center fade-in"><h1>Contact Us</h1><p className="lead">We'd love to hear from you!</p><p><strong>Address:</strong> 123 Foodie Lane, Flavor Town</p><p><strong>Phone:</strong> (555) 123-4567</p><p><strong>Email:</strong> contact@steamybites.com</p></div> );

// --- Admin Page Components ---

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = () => {
        axios.get('http://localhost:8001/api/orders')
            .then(response => { setOrders(response.data); setLoading(false); })
            .catch(error => { console.error("Error fetching orders:", error); setLoading(false); });
    };

    const handleStatusChange = (orderId, newStatus) => {
        axios.patch(`http://localhost:8001/api/orders/${orderId}`, { status: newStatus })
            .then(response => {
                setOrders(prevOrders => prevOrders.map(order => order._id === orderId ? response.data : order));
            })
            .catch(error => {
                console.error("Error updating order status:", error);
                alert('Failed to update order status.');
            });
    };
    
    if (loading) return <div className="text-center"><div className="spinner-border text-danger" role="status"></div></div>;
    if (orders.length === 0) return <div className="text-center"><h2>No orders found.</h2></div>;

    return (
        <Table striped bordered hover responsive>
            <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Order Time</th></tr></thead>
            <tbody>
                {orders.map((order, index) => (
                    <tr key={order._id}>
                        <td>{index + 1}</td>
                        <td>{order.customerName}</td>
                        <td>
                          <ul>
                            {order.items.map(item => (
                              <li key={`${item.menuItemId?._id}-${item.variant}`}>
                                {item.quantity}x {item.menuItemId ? `${item.menuItemId.name} (${item.variant})` : 'N/A'}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>${(order.totalPrice ?? 0).toFixed(2)}</td>
                        <td>
                            <Form.Select size="sm" value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)}>
                                <option>Received</option><option>Preparing</option><option>Out for Delivery</option><option>Completed</option>
                            </Form.Select>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

const MenuManager = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', price: { half: '', full: '' }, imageUrl: '' });

    useEffect(() => { fetchMenuItems(); }, []);
    
    const fetchMenuItems = () => {
        setLoading(true);
        axios.get('http://localhost:8001/api/menu')
            .then(response => { setMenuItems(response.data); setLoading(false); })
            .catch(error => { console.error("Error fetching menu items:", error); setLoading(false); });
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'half' || name === 'full') {
            setFormData(prev => ({ ...prev, price: { ...prev.price, [name]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleShowModal = (item = null) => {
        setCurrentItem(item);
        if (item) {
            // Ensure price is always an object, even for old data structures
            const price = (typeof item.price === 'object' && item.price !== null) 
                          ? item.price 
                          : { half: '', full: '' }; // Default for old items

            setFormData({
                _id: item._id, // Keep track of id for submission
                name: item.name || '',
                description: item.description || '',
                imageUrl: item.imageUrl || '',
                price: {
                    half: price.half?.toString() || '',
                    full: price.full?.toString() || ''
                }
            });
        } else {
            // This is for adding a new item
            setFormData({
                name: '',
                description: '',
                price: { half: '', full: '' },
                imageUrl: ''
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.name.trim() || !formData.description.trim()) {
            alert('Name and Description cannot be empty.'); return;
        }
        const halfPrice = parseFloat(formData.price.half);
        const fullPrice = parseFloat(formData.price.full);
        if (isNaN(halfPrice) || halfPrice <= 0 || isNaN(fullPrice) || fullPrice <= 0) {
            alert('Please enter valid, positive prices for both Half and Full variants.'); return;
        }

        // Exclude _id from the payload
        const { _id, ...dataToSubmit } = formData;
        const payload = { 
            ...dataToSubmit, 
            price: { half: halfPrice, full: fullPrice } 
        };

        const apiCall = currentItem
            ? axios.patch(`http://localhost:8001/api/menu/${currentItem._id}`, payload)
            : axios.post('http://localhost:8001/api/menu', payload);

        apiCall.then(() => { fetchMenuItems(); handleCloseModal(); })
               .catch(error => {
                    console.error('Error saving menu item:', error);
                    const errorMessage = error.response?.data?.message || 'Failed to save item.';
                    alert(errorMessage);
                });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            axios.delete(`http://localhost:8001/api/menu/${id}`)
                .then(() => fetchMenuItems())
                .catch(error => { console.error('Error deleting menu item:', error); alert('Failed to delete item.'); });
        }
    };
    
    if (loading) return <div className="text-center"><div className="spinner-border text-danger" role="status"></div></div>;

    return (
        <div>
            <Button variant="danger" className="mb-3" onClick={() => handleShowModal()}>Add New Menu Item</Button>
            <Table striped bordered hover responsive>
                <thead><tr><th>Name</th><th>Half Price</th><th>Full Price</th><th>Actions</th></tr></thead>
                <tbody>
                    {menuItems.map(item => {
                        const halfPrice = (item.price && typeof item.price.half === 'number') ? item.price.half.toFixed(2) : 'N/A';
                        const fullPrice = (item.price && typeof item.price.full === 'number') ? item.price.full.toFixed(2) : 'N/A';
                        return (
                            <tr key={item._id}>
                                <td>{item.name}</td>
                                <td>${halfPrice}</td>
                                <td>${fullPrice}</td>
                                <td>
                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(item)}>Edit</Button>
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleDelete(item._id)}>Delete</Button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton><Modal.Title>{currentItem ? 'Edit' : 'Add'} Menu Item</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" name="name" value={formData.name} onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Half Price</Form.Label><Form.Control type="number" step="0.01" name="half" value={formData.price.half} onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Full Price</Form.Label><Form.Control type="number" step="0.01" name="full" value={formData.price.full} onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Image URL</Form.Label><Form.Control type="text" name="imageUrl" value={formData.imageUrl} onChange={handleFormChange} /></Form.Group>
                        <Button variant="danger" type="submit">Save Changes</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};


const AdminPage = () => (
    <div className="fade-in">
        <h1 className="mb-4 text-center">Admin Dashboard</h1>
        <Tab.Container defaultActiveKey="orders">
            <Nav variant="tabs" className="mb-3 justify-content-center">
                <Nav.Item><Nav.Link eventKey="orders">Manage Orders</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="menu">Manage Menu</Nav.Link></Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="orders"><OrderManager /></Tab.Pane>
                <Tab.Pane eventKey="menu"><MenuManager /></Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    </div>
);


// --- Cart Modal Component ---
const CartModal = ({ show, handleClose, cartItems, setCartItems, submitOrder }) => {
    const [customerName, setCustomerName] = useState('');
    const handleQuantityChange = (cartId, quantity) => {
        if (quantity < 1) { setCartItems(cartItems.filter(item => item.cartId !== cartId)); } 
        else { setCartItems(cartItems.map(item => item.cartId === cartId ? { ...item, quantity: quantity } : item)); }
    };
    const calculateTotal = () => cartItems.reduce((total, item) => total + item.priceAtOrder * item.quantity, 0).toFixed(2);
    const handleSubmit = (e) => {
        e.preventDefault();
        if(!customerName.trim()) { alert("Please enter your name."); return; }
        submitOrder(customerName);
        setCustomerName('');
    }
    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton><Modal.Title>Your Order</Modal.Title></Modal.Header>
            <Modal.Body>
                {cartItems.length === 0 ? ( <p>Your cart is empty.</p> ) : (
                    <>
                        <ListGroup variant="flush">
                            {cartItems.map(item => (
                                <ListGroup.Item key={item.cartId} className="d-flex justify-content-between align-items-center">
                                    <div><h6 className="mb-0">{item.name} <span className="text-muted small">({item.variant})</span></h6><small className="text-muted">${item.priceAtOrder.toFixed(2)}</small></div>
                                    <div className="d-flex align-items-center">
                                        <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(item.cartId, item.quantity - 1)}>-</Button>
                                        <span className="mx-2">{item.quantity}</span>
                                        <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(item.cartId, item.quantity + 1)}>+</Button>
                                    </div>
                                    <CloseButton onClick={() => handleQuantityChange(item.cartId, 0)} />
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        <hr />
                        <div className="text-end"><h4>Total: ${calculateTotal()}</h4></div>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3"><Form.Label>Your Name</Form.Label><Form.Control type="text" placeholder="Enter your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></Form.Group>
                            <Button variant="danger" type="submit" className="w-100">Place Order</Button>
                        </Form>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};


// --- Main App ---
function App() {
  const [route, setRoute] = useState(window.location.hash || '#/');
  const [menuItems, setMenuItems] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [pageKey, setPageKey] = useState(Date.now());

  useEffect(() => {
    const handleHashChange = () => { setRoute(window.location.hash || '#/'); setPageKey(Date.now()); }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  
  useEffect(() => {
    axios.get('http://localhost:8001/api/menu')
      .then(response => setMenuItems(response.data))
      .catch(error => console.error("Error fetching menu items:", error));
  }, []);

  const handleAddToCart = (itemToAdd, variant) => {
    setCartItems(prevItems => {
        const cartId = `${itemToAdd._id}-${variant}`;
        const isItemInCart = prevItems.find(item => item.cartId === cartId);
        
        if (isItemInCart) { 
            return prevItems.map(item => item.cartId === cartId ? { ...item, quantity: item.quantity + 1 } : item); 
        }

        const newItem = { 
            ...itemToAdd, 
            quantity: 1, 
            variant: variant,
            priceAtOrder: itemToAdd.price[variant],
            cartId: cartId
        };
        return [...prevItems, newItem];
    });
  };

  const submitOrder = (customerName) => {
    const orderDetails = {
        items: cartItems.map(item => ({ 
            menuItemId: item._id, 
            quantity: item.quantity,
            variant: item.variant,
            priceAtOrder: item.priceAtOrder
        })),
        totalPrice: cartItems.reduce((total, item) => total + item.priceAtOrder * item.quantity, 0),
        customerName: customerName
    };
    axios.post('http://localhost:8001/api/orders', orderDetails)
        .then(response => { alert('Order placed successfully!'); setCartItems([]); setShowCart(false); })
        .catch(error => { console.error('Error placing order:', error); alert('There was a problem placing your order.'); });
  };

  const renderPage = () => {
    switch (route) {
      case '#/about': return <AboutPage />;
      case '#/contact': return <ContactPage />;
      case '#/admin': return <AdminPage />;
      case '#/': default: return <MenuPage items={menuItems} onAddToCart={handleAddToCart} />;
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <GlobalStyles />
      <header>
        <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
          <div className="container">
            <a className="navbar-brand d-flex align-items-center" href="#/">
  <img 
    src="https://lh3.googleusercontent.com/Ye0hjUzWm-MM4eTC3ma2TMvWviXUn2Ufdsqq7kEHCnKi5ZPSii3tW-D8Ei5C-4qgUCqGUHGXk0tk4AkJdnWPHAz7YbKEXYEjF2CeFn01" 
    alt="Steamy Bites Logo" 
    className="me-2 rounded-circle" 
    width="100" 
  />
  <span className="fw-bold">Steamy Bites</span>
</a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"><span className="navbar-toggler-icon"></span></button>
            <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item"><a className={`nav-link mx-2 ${route === '#/' ? 'active fw-bold border-bottom border-danger border-2' : ''}`} href="#/">Home</a></li>
                <li className="nav-item"><a className={`nav-link mx-2 ${route === '#/about' ? 'active fw-bold border-bottom border-danger border-2' : ''}`} href="#/about">About Us</a></li>
                <li className="nav-item"><a className={`nav-link mx-2 ${route === '#/contact' ? 'active fw-bold border-bottom border-danger border-2' : ''}`} href="#/contact">Contact Us</a></li>
                <li className="nav-item"><a className={`nav-link mx-2 ${route === '#/admin' ? 'active fw-bold border-bottom border-danger border-2' : ''}`} href="#/admin">Admin</a></li>
              </ul>
            </div>
            <Button variant="danger" onClick={() => setShowCart(true)} className="position-relative">Order Now <Badge pill bg="dark" className="position-absolute top-0 start-100 translate-middle">{cartItems.reduce((count, item) => count + item.quantity, 0)}</Badge></Button>
          </div>
        </nav>
      </header>
      <main className="container my-5 flex-grow-1" key={pageKey}>{renderPage()}</main>
      <footer className="bg-light text-center py-3"><div className="text-center">© 2025 Copyright: <a className="text-dark" href="#"> SteamyBites.com</a></div></footer>
      <CartModal show={showCart} handleClose={() => setShowCart(false)} cartItems={cartItems} setCartItems={setCartItems} submitOrder={submitOrder} />
    </div>
  );
}

export default App;


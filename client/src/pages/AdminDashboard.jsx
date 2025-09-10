import React, { useState, useEffect } from 'react';
import { Table, Nav, Tab, Form, Button, Modal, Card, Alert } from 'react-bootstrap';
import { api } from '../api';

// --- Admin Page Components ---
const AdminRegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        try {
            await api.post('/admin/register', { name, email, password });
            setSuccess('New admin registered successfully!');
            setName('');
            setEmail('');
            setPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Admin registration failed.');
        }
    };

    return (
         <div className="row justify-content-center fade-in mt-4">
            <div className="col-md-8">
                <Card className="shadow-sm">
                    <Card.Body className="p-5">
                        <h3 className="text-center mb-4">Register New Admin</h3>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" required /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Email address</Form.Label><Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" required /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Password</Form.Label><Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required /></Form.Group>
                            <Button variant="primary" type="submit" className="w-100">Register Admin</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

const OrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = () => {
        api.get('/admin/orders')
            .then(response => { setOrders(response.data); setLoading(false); })
            .catch(error => { console.error("Error fetching orders:", error); setLoading(false); });
    };

    const handleStatusChange = (orderId, newStatus) => {
        api.patch(`/admin/orders/${orderId}`, { status: newStatus })
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
                        <td><ul>{order.items.map(item => (<li key={`${item.menuItemId?._id}-${item.variant}`}>{item.quantity}x {item.menuItemId ? `${item.menuItemId.name} (${item.variant})` : 'N/A'}</li>))}</ul></td>
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
        api.get('/menu')
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
            const price = (typeof item.price === 'object' && item.price !== null) 
                          ? item.price 
                          : { half: '', full: '' };
            setFormData({
                name: item.name || '',
                description: item.description || '',
                imageUrl: item.imageUrl || '',
                price: { half: price.half?.toString() || '', full: price.full?.toString() || '' }
            });
        } else {
            setFormData({ name: '', description: '', price: { half: '', full: '' }, imageUrl: '' });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...formData, price: { half: parseFloat(formData.price.half), full: parseFloat(formData.price.full) } };

        const apiCall = currentItem
            ? api.patch(`/admin/menu/${currentItem._id}`, payload)
            : api.post('/admin/menu', payload);

        apiCall.then(() => { fetchMenuItems(); handleCloseModal(); })
               .catch(error => { console.error('Error saving menu item:', error); alert('Failed to save item.'); });
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            api.delete(`/admin/menu/${id}`)
                .then(() => fetchMenuItems())
                .catch(error => { console.error('Error deleting menu item:', error); alert('Failed to delete item.'); });
        }
    };
    
    if (loading) return <div className="text-center"><div className="spinner-border text-danger"></div></div>;

    return (
        <div>
            <Button variant="danger" className="mb-3" onClick={() => handleShowModal()}>Add New Menu Item</Button>
            <Table striped bordered hover responsive>
                <thead><tr><th>Name</th><th>Half Price</th><th>Full Price</th><th>Actions</th></tr></thead>
                <tbody>
                    {menuItems.map(item => {
                       const halfPrice = (item.price && typeof item.price.half === 'number') ? item.price.half.toFixed(2) : 'N/A';
                       const fullPrice = (item.price && typeof item.price.full === 'number') ? item.price.full.toFixed(2) : 'N/A';
                       return(
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

const ComplaintManager = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/complaints')
            .then(res => setComplaints(res.data))
            .catch(err => console.error("Failed to fetch complaints:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleStatusChange = (id, status) => {
        api.patch(`/admin/complaints/${id}`, { status })
            .then(res => {
                setComplaints(prev => prev.map(c => c._id === id ? res.data : c));
            })
            .catch(err => alert('Failed to update complaint status.'));
    };

    if (loading) return <div className="text-center"><div className="spinner-border text-danger"></div></div>;

    return (
        <Table striped bordered hover responsive>
            <thead><tr><th>Customer</th><th>Order Date</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>
                {complaints.map(c => (
                    <tr key={c._id}>
                        <td>{c.user ? `${c.user.name} (${c.user.email})` : 'User Not Found'}</td>
                        <td>{c.orderId ? new Date(c.orderId.createdAt).toLocaleString() : 'N/A'}</td>
                        <td>{c.message}</td>
                        <td>
                             <Form.Select size="sm" value={c.status} onChange={(e) => handleStatusChange(c._id, e.target.value)}>
                                <option>Pending</option><option>In Progress</option><option>Resolved</option>
                            </Form.Select>
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

const AdminDashboard = ({ adminName, handleLogout }) => (
    <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="text-center">Admin Dashboard</h1>
            <div>
                <span className="me-3">Welcome, {adminName}</span>
                <Button variant="outline-secondary" size="sm" onClick={() => handleLogout('admin')}>Logout</Button>
            </div>
        </div>
        <Tab.Container defaultActiveKey="orders">
            <Nav variant="tabs" className="mb-3 justify-content-center">
                <Nav.Item><Nav.Link eventKey="orders">Manage Orders</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="menu">Manage Menu</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="complaints">Manage Complaints</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link href="#/admin-register">Register New Admin</Nav.Link></Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="orders"><OrderManager /></Tab.Pane>
                <Tab.Pane eventKey="menu"><MenuManager /></Tab.Pane>
                <Tab.Pane eventKey="complaints"><ComplaintManager /></Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    </div>
);

export default AdminDashboard;


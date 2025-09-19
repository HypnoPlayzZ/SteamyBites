import React, { useState, useEffect, useRef } from 'react';
import { Nav, Tab, Form, Button, Modal, Card, Alert, Accordion, Badge, Table } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { api } from '../api';
import * as Tone from 'tone';

// --- New Order Modal ---
const NewOrderModal = ({ order, onAccept, onReject, show }) => {
    if (!order) return null;
    return (
        <Modal show={show} onHide={() => onReject(order._id)} centered backdrop="static" keyboard={false}>
            <Modal.Header className="bg-warning text-dark">
                <Modal.Title>🚨 New Order Received!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>Order #{order._id.slice(-6)}</h5>
                <p><strong>Customer:</strong> {order.customerName}</p>
                <ul>
                    {order.items.map(item => (
                        <li key={item.menuItemId?._id}>
                            {item.quantity}x {item.menuItemId?.name} ({item.variant})
                            {item.instructions && <small className="d-block text-muted"><em>"{item.instructions}"</em></small>}
                        </li>
                    ))}
                </ul>
                <hr/>
                <p className="fw-bold text-end">Total: ${(order.finalPrice ?? order.totalPrice).toFixed(2)}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={() => onReject(order._id)}>Reject</Button>
                <Button variant="success" onClick={() => onAccept(order._id)}>Accept Order</Button>
            </Modal.Footer>
        </Modal>
    );
};

// --- Order Card for Kanban View ---
const OrderCard = ({ order, onAction, actionText, actionVariant = 'primary' }) => (
    <Card className="mb-3 shadow-sm">
        <Card.Body>
            <Card.Title>Order #{order._id.slice(-6)}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{order.customerName}</Card.Subtitle>
            <ul>
                {order.items.map(item => (
                    <li key={item.menuItemId?._id}>
                        {item.quantity}x {item.menuItemId?.name} ({item.variant})
                        {item.instructions && <small className="d-block text-info"><em>"{item.instructions}"</em></small>}
                    </li>
                ))}
            </ul>
        </Card.Body>
        <Card.Footer className="d-grid">
            <Button variant={actionVariant} onClick={() => onAction(order._id)}>
                {actionText}
            </Button>
        </Card.Footer>
    </Card>
);


// --- Live Order Management Component ---
const LiveOrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const synth = useRef(null);
    const soundInterval = useRef(null);

    useEffect(() => {
        synth.current = new Tone.Synth().toDestination();
        const startAudio = () => {
            if (Tone.context.state !== 'running') {
                Tone.context.resume();
            }
            window.removeEventListener('click', startAudio);
        };
        window.addEventListener('click', startAudio);

        return () => {
            window.removeEventListener('click', startAudio);
        }
    }, []);

    const playNotificationSound = () => {
        stopNotificationSound();
        const play = () => {
             if (synth.current) {
                synth.current.triggerAttackRelease("C5", "8n", Tone.now());
                synth.current.triggerAttackRelease("G5", "8n", Tone.now() + 0.2);
            }
        };
        play();
        soundInterval.current = setInterval(play, 3000);
    };

    const stopNotificationSound = () => {
        if (soundInterval.current) {
            clearInterval(soundInterval.current);
            soundInterval.current = null;
        }
    };

    const fetchOrders = () => {
        api.get('/admin/orders')
            .then(response => {
                const fetchedOrders = response.data;
                const unacknowledged = fetchedOrders.filter(o => o.status === 'Received');

                if (!initialLoad && unacknowledged.length > 0 && unacknowledged.length > orders.filter(o => o.status === 'Received').length) {
                    playNotificationSound();
                }
                
                setOrders(fetchedOrders);
                if (initialLoad) setInitialLoad(false);
            })
            .catch(error => console.error("Error fetching orders:", error))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders();
        const pollInterval = setInterval(fetchOrders, 5000);
        return () => {
            clearInterval(pollInterval);
            stopNotificationSound();
        };
    }, []);
    
    const handleOrderStatusUpdate = (orderId, newStatus) => {
        api.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
            .then(response => {
                const updatedOrders = orders.map(o => o._id === orderId ? response.data : o);
                setOrders(updatedOrders);
                if (newStatus === 'Preparing' || newStatus === 'Rejected') {
                    if (!updatedOrders.some(o => o.status === 'Received')) {
                        stopNotificationSound();
                    }
                }
            })
            .catch(err => alert(`Failed to update order to ${newStatus}.`));
    };
    
    if (loading) return <div className="text-center"><div className="spinner-border text-danger" role="status"></div></div>;

    const newOrders = orders.filter(o => o.status === 'Received');
    const preparingOrders = orders.filter(o => o.status === 'Preparing');
    const readyOrders = orders.filter(o => o.status === 'Ready');
    const deliveryOrders = orders.filter(o => o.status === 'Out for Delivery');
    
    return (
        <>
            {newOrders.map(order => (
                <NewOrderModal 
                    key={order._id}
                    show={true} 
                    order={order} 
                    onAccept={() => handleOrderStatusUpdate(order._id, 'Preparing')}
                    onReject={() => handleOrderStatusUpdate(order._id, 'Rejected')}
                />
            ))}
            <div className="kanban-board row">
                <div className="col-md-4 col-lg-3">
                    <h4>Preparing ({preparingOrders.length})</h4>
                    {preparingOrders.map(o => <OrderCard key={o._id} order={o} onAction={() => handleOrderStatusUpdate(o._id, 'Ready')} actionText="Mark Ready" />)}
                </div>
                <div className="col-md-4 col-lg-3">
                    <h4>Ready for Delivery ({readyOrders.length})</h4>
                    {readyOrders.map(o => <OrderCard key={o._id} order={o} onAction={() => handleOrderStatusUpdate(o._id, 'Out for Delivery')} actionText="Out for Delivery" actionVariant="warning" />)}
                </div>
                <div className="col-md-4 col-lg-3">
                    <h4>Out for Delivery ({deliveryOrders.length})</h4>
                    {deliveryOrders.map(o => <OrderCard key={o._id} order={o} onAction={() => handleOrderStatusUpdate(o._id, 'Delivered')} actionText="Mark Delivered" actionVariant="success"/>)}
                </div>
            </div>
        </>
    );
};


// --- Admin Register Page Component ---
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

// --- Menu Management Component ---
const MenuManager = () => {
    const [menu, setMenu] = useState({});
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '', category: '', price: { half: '', full: '' }});
    const [imageFile, setImageFile] = useState(null);
    const [isClient, setIsClient] = useState(false);

    const fetchMenu = () => {
        setLoading(true);
        api.get('/menu')
            .then(response => { setMenu(response.data); setLoading(false); })
            .catch(error => { console.error("Error fetching menu items:", error); setLoading(false); });
    };

    useEffect(() => {
        fetchMenu();
        setIsClient(true);
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name === 'half' || name === 'full') {
            setFormData(prev => ({ ...prev, price: { ...prev.price, [name]: value } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleShowModal = (item = null) => {
        setCurrentItem(item);
        setImageFile(null);
        if (item) {
            const price = (typeof item.price === 'object' && item.price !== null) 
                          ? item.price 
                          : { half: '', full: '' };
            setFormData({
                name: item.name || '',
                description: item.description || '',
                category: item.category || 'Uncategorized',
                price: { half: price.half?.toString() || '', full: price.full?.toString() || '' }
            });
        } else {
            setFormData({ name: '', description: '', category: '', price: { half: '', full: '' } });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentItem(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('category', formData.category || 'Uncategorized');
        data.append('priceHalf', formData.price.half);
        data.append('priceFull', formData.price.full);
        
        if (imageFile) {
            data.append('image', imageFile);
        } else if (currentItem) {
            data.append('imageUrl', currentItem.imageUrl);
        }

        const apiCall = currentItem
            ? api.patch(`/admin/menu/${currentItem._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
            : api.post('/admin/menu', data, { headers: { 'Content-Type': 'multipart/form-data' } });

        try {
            await apiCall;
            fetchMenu();
            handleCloseModal();
        } catch (error) {
            console.error('Error saving menu item:', error);
            alert('Failed to save item.');
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            api.delete(`/admin/menu/${id}`)
                .then(() => fetchMenu())
                .catch(error => { console.error('Error deleting menu item:', error); alert('Failed to delete item.'); });
        }
    };

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination) return;

        const sourceCategory = source.droppableId;
        if (source.droppableId === destination.droppableId) {
            const items = Array.from(menu[sourceCategory]);
            const [reorderedItem] = items.splice(source.index, 1);
            items.splice(destination.index, 0, reorderedItem);

            setMenu(prevMenu => ({ ...prevMenu, [sourceCategory]: items }));

            const orderedIds = items.map(item => item._id);
            api.patch('/admin/menu/reorder', { category: sourceCategory, orderedIds })
               .catch(err => {
                    alert('Failed to save new order. Reverting changes.');
                    fetchMenu();
               });
        }
    };
    
    if (loading) return <div className="text-center"><div className="spinner-border text-danger" role="status"></div></div>;

    return (
        <div>
            <Button variant="danger" className="mb-3" onClick={() => handleShowModal()}>Add New Menu Item</Button>
            
            {isClient && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Accordion defaultActiveKey="0" alwaysOpen>
                        {Object.entries(menu).map(([category, items], index) => (
                            <Accordion.Item eventKey={index.toString()} key={category}>
                                <Accordion.Header>{category} ({items.length})</Accordion.Header>
                                <Accordion.Body>
                                    <div className="table-responsive">
                                        <Table striped bordered hover>
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '40px' }}></th>
                                                    <th>Name</th>
                                                    <th>Half Price</th>
                                                    <th>Full Price</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <Droppable droppableId={category}>
                                                {(provided) => (
                                                    <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                                        {items.map((item, idx) => (
                                                            <Draggable key={item._id} draggableId={item._id.toString()} index={idx}>
                                                                {(provided) => (
                                                                    <tr ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                        <td style={{ cursor: 'grab' }}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grip-vertical" viewBox="0 0 16 16">
                                                                                <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                                                            </svg>
                                                                        </td>
                                                                        <td>{item.name}</td>
                                                                        <td>${item.price.half != null ? item.price.half.toFixed(2) : 'N/A'}</td>
                                                                        <td>${item.price.full.toFixed(2)}</td>
                                                                        <td>
                                                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(item)}>Edit</Button>
                                                                            <Button variant="outline-secondary" size="sm" onClick={() => handleDelete(item._id)}>Delete</Button>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </tbody>
                                                )}
                                            </Droppable>
                                        </Table>
                                    </div>
                                </Accordion.Body>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                </DragDropContext>
            )}

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton><Modal.Title>{currentItem ? 'Edit' : 'Add'} Menu Item</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" name="name" value={formData.name} onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Category</Form.Label><Form.Control type="text" name="category" value={formData.category} onChange={handleFormChange} placeholder="e.g., Appetizers, Main Course" required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Half Price (Optional)</Form.Label><Form.Control type="number" step="0.01" name="half" value={formData.price.half} onChange={handleFormChange} /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Full / Item Price</Form.Label><Form.Control type="number" step="0.01" name="full" value={formData.price.full} onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Image</Form.Label>
                            {currentItem?.imageUrl && !imageFile && <img src={currentItem.imageUrl} alt="Current" width="100" className="mb-2 d-block"/>}
                            <Form.Control type="file" name="image" onChange={handleFileChange} />
                        </Form.Group>
                        <Button variant="danger" type="submit">Save Changes</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

// --- Main Admin Dashboard Component ---
const AdminDashboard = ({ adminName, handleLogout }) => (
    <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Admin Dashboard</h1>
            <div>
                <span className="me-3">Welcome, {adminName}</span>
                <Button variant="outline-secondary" size="sm" onClick={() => handleLogout('admin')}>Logout</Button>
            </div>
        </div>
        <Tab.Container defaultActiveKey="live-orders">
            <Nav variant="tabs" className="mb-3 justify-content-center">
                <Nav.Item><Nav.Link eventKey="live-orders">Live Orders</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="menu">Manage Menu</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link href="#/admin-register">Register New Admin</Nav.Link></Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="live-orders"><LiveOrderManager /></Tab.Pane>
                <Tab.Pane eventKey="menu"><MenuManager /></Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    </div>
);

export default AdminDashboard;


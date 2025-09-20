import React, { useState, useEffect, useRef } from 'react';
import { Nav, Tab, Form, Button, Modal, Card, Alert, Accordion, Badge, Dropdown, Table } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { api } from '../api';
import * as Tone from 'tone';

// --- New Order Modal ---
const NewOrderModal = ({ order, onAccept, onReject, show }) => {
    if (!order) return null;
    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(order.address)}`;
    return (
        <Modal show={show} onHide={() => onReject(order._id)} centered backdrop="static" keyboard={false}>
            <Modal.Header className="bg-warning text-dark">
                <Modal.Title>🚨 New Order Received!</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>Order #{order._id.slice(-6)}</h5>
                <p><strong>Customer:</strong> {order.customerName}</p>
                <p><strong>Address:</strong> <a href={mapUrl} target="_blank" rel="noopener noreferrer">{order.address}</a></p>
                <ul>
                    {order.items.map((item, index) => (
                        <li key={`${order._id}-item-${index}`}>
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
const OrderCard = ({ order, onAction, actionText, actionVariant = 'primary' }) => {
    const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(order.address)}`;
    return (
        <Card className="mb-3 shadow-sm">
            <Card.Body>
                <Card.Title>Order #{order._id.slice(-6)}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">{order.customerName}</Card.Subtitle>
                <Card.Text>
                    <strong>Address:</strong> <a href={mapUrl} target="_blank" rel="noopener noreferrer">View on Map</a>
                </Card.Text>
                <ul>
                    {order.items.map((item, index) => (
                        <li key={`${order._id}-item-${index}`}>
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
};


// --- Live Order Management Component ---
const LiveOrderManager = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const synth = useRef(null);
    const soundInterval = useRef(null);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        synth.current = new Tone.Synth().toDestination();
        const startAudio = () => {
            if (Tone.context.state !== 'running') { Tone.context.resume(); }
            window.removeEventListener('click', startAudio);
        };
        window.addEventListener('click', startAudio);
        return () => window.removeEventListener('click', startAudio);
    }, []);

    const playNotificationSound = () => {
        if(isMuted) return;
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
                const newOrdersCount = fetchedOrders.filter(o => o.status === 'Received').length;
                const previousNewOrdersCount = orders.filter(o => o.status === 'Received').length;

                if (!initialLoad && newOrdersCount > 0 && newOrdersCount > previousNewOrdersCount) {
                    playNotificationSound();
                } else if (newOrdersCount === 0) {
                    stopNotificationSound();
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
            <Button variant="outline-secondary" size="sm" className="mb-3" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? 'Unmute Notifications' : 'Mute Notifications'}
            </Button>
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
    const [menu, setMenu] = useState([]);
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
        const { source, destination, type } = result;
        if (!destination) return;

        if (type === 'CATEGORY') {
            const reorderedCategories = Array.from(menu);
            const [movedCategory] = reorderedCategories.splice(source.index, 1);
            reorderedCategories.splice(destination.index, 0, movedCategory);
            
            setMenu(reorderedCategories);

            const orderedCategoryNames = reorderedCategories.map(c => c.name);
            api.patch('/admin/categories/reorder', { orderedCategoryNames })
               .catch(err => {
                    alert('Failed to save category order. Reverting.');
                    fetchMenu();
               });
            return;
        }

        if (type === 'ITEM') {
            const sourceCategoryIndex = menu.findIndex(c => c.name === source.droppableId);
            const sourceCategory = menu[sourceCategoryIndex];
            
            const newMenuState = Array.from(menu);
            const sourceItems = Array.from(sourceCategory.items);
            const [movedItem] = sourceItems.splice(source.index, 1);

            if (source.droppableId === destination.droppableId) {
                sourceItems.splice(destination.index, 0, movedItem);
                newMenuState[sourceCategoryIndex] = { ...sourceCategory, items: sourceItems };
                setMenu(newMenuState);

                const orderedIds = sourceItems.map(item => item._id);
                api.patch('/admin/menu/reorder', { category: sourceCategory.name, orderedIds })
                   .catch(err => {
                        alert('Failed to save item order. Reverting.');
                        fetchMenu();
                   });
            }
        }
    };
    
    if (loading) return <div className="text-center"><div className="spinner-border text-danger" role="status"></div></div>;

    return (
        <div>
            <Button variant="danger" className="mb-3" onClick={() => handleShowModal()}>Add New Menu Item</Button>
            
            {isClient && (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="all-categories" type="CATEGORY">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                <Accordion defaultActiveKey="0" alwaysOpen>
                                    {menu.map((category, index) => (
                                        <Draggable key={category.name} draggableId={category.name} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps}>
                                                    <Accordion.Item eventKey={index.toString()} >
                                                        <Accordion.Header {...provided.dragHandleProps}>
                                                            <span style={{ cursor: 'grab', marginRight: '10px' }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grip-vertical" viewBox="0 0 16 16">
                                                                    <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                                                </svg>
                                                            </span>
                                                            {category.name} ({category.items.length})
                                                        </Accordion.Header>
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
                                                                    <Droppable droppableId={category.name} type="ITEM">
                                                                        {(provided) => (
                                                                            <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                                                                {category.items.map((item, idx) => (
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
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Accordion>
                            </div>
                        )}
                    </Droppable>
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


// --- Complaint Management Component ---
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
        <div className="table-responsive">
            <Table striped bordered hover>
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
        </div>
    );
};


// --- Bulk Upload Component ---
const BulkUploadManager = () => {
    const [csvFile, setCsvFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setCsvFile(e.target.files[0]);
        setUploadResult(null);
        setError('');
    };

    const handleUpload = async () => {
        if (!csvFile) {
            setError('Please select a CSV file to upload.');
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadResult(null);

        const formData = new FormData();
        formData.append('csvFile', csvFile);

        try {
            const response = await api.post('/admin/menu/upload-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadResult(response.data);
        } catch (err) {
            setError('Upload failed. Please check the file format or server logs.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadSample = () => {
        const csvContent = "Item,Category,Item Price,Half,Full\n" +
                           "Veg Momos,Appetizers,,130,250\n" +
                           "Paneer Chilli Dry,Main Course,,350,500\n" +
                           "Veg Burger,Snacks,100,,\n";
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) { 
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "sample-menu.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Card className="shadow-sm">
            <Card.Body className="p-4">
                <Card.Title>Upload Menu CSV</Card.Title>
                <Card.Text>
                    Upload a CSV file with columns: "Item", "Category", "Item Price", "Half", and "Full" to bulk update your menu.
                </Card.Text>
                <Form.Group className="mb-3">
                    <Form.Control type="file" accept=".csv" onChange={handleFileChange} />
                </Form.Group>
                <div className="d-flex gap-2">
                    <Button onClick={handleUpload} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                    <Button variant="outline-secondary" onClick={handleDownloadSample}>
                        Download Sample
                    </Button>
                </div>

                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                {uploadResult && (
                    <Alert variant="success" className="mt-3">
                        <Alert.Heading>Upload Complete!</Alert.Heading>
                        <p>{uploadResult.message}</p>
                        <hr />
                        <p className="mb-0">
                            Items Created: {uploadResult.created} | Items Updated: {uploadResult.updated}
                        </p>
                    </Alert>
                )}
            </Card.Body>
        </Card>
    );
};

// --- New Coupon Management Component ---
const CouponManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ code: '', description: '', discountType: 'percentage', discountValue: 0 });

    const fetchCoupons = () => {
        api.get('/admin/coupons').then(res => {
            setCoupons(res.data);
            setIsLoading(false);
        });
    };

    useEffect(fetchCoupons, []);

    const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/coupons', { ...formData, code: formData.code.toUpperCase() });
            setShowModal(false);
            fetchCoupons();
        } catch (error) {
            alert('Failed to create coupon. Make sure the code is unique.');
        }
    };
    
    const toggleCouponStatus = async (coupon) => {
        try {
            await api.patch(`/admin/coupons/${coupon._id}`, { isActive: !coupon.isActive });
            fetchCoupons();
        } catch (error) {
            alert('Failed to update coupon status.');
        }
    };

    if (isLoading) return <div className="text-center"><div className="spinner-border text-danger" role="status"></div></div>;

    return (
        <>
            <Button onClick={() => setShowModal(true)} className="mb-3">Create New Coupon</Button>
            <div className="table-responsive">
                <Table striped bordered hover>
                    <thead>
                        <tr><th>Code</th><th>Description</th><th>Type</th><th>Value</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {coupons.map(coupon => (
                            <tr key={coupon._id}>
                                <td>{coupon.code}</td>
                                <td>{coupon.description}</td>
                                <td>{coupon.discountType}</td>
                                <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `$${coupon.discountValue.toFixed(2)}`}</td>
                                <td>
                                    <Badge bg={coupon.isActive ? 'success' : 'secondary'}>
                                        {coupon.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                </td>
                                <td>
                                    <Button size="sm" variant={coupon.isActive ? 'warning' : 'success'} onClick={() => toggleCouponStatus(coupon)}>
                                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
            
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton><Modal.Title>Create Coupon</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3"><Form.Label>Coupon Code</Form.Label><Form.Control type="text" name="code" onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control type="text" name="description" onChange={handleFormChange} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Discount Type</Form.Label><Form.Select name="discountType" onChange={handleFormChange}><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></Form.Select></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Discount Value</Form.Label><Form.Control type="number" name="discountValue" onChange={handleFormChange} required /></Form.Group>
                        <Button type="submit">Create</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

// --- Main Admin Dashboard Component ---
const AdminDashboard = ({ adminName, handleLogout }) => {
    const [activeTab, setActiveTab] = useState('live-orders');
    return (
    <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Admin Dashboard</h1>
            <div>
                <span className="me-3">Welcome, {adminName}</span>
                <Button variant="outline-secondary" size="sm" onClick={() => handleLogout('admin')}>Logout</Button>
            </div>
        </div>
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
            <Nav variant="tabs" className="mb-3 justify-content-center">
                <Nav.Item><Nav.Link eventKey="live-orders">Live Orders</Nav.Link></Nav.Item>
                <Dropdown as={Nav.Item}>
                    <Dropdown.Toggle as={Nav.Link}>Menu & More</Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item eventKey="menu">Manage Menu</Dropdown.Item>
                        <Dropdown.Item eventKey="bulk-upload">Bulk Upload</Dropdown.Item>
                        <Dropdown.Item eventKey="coupons">Manage Coupons</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <Nav.Item><Nav.Link eventKey="complaints">Complaints</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link href="#/admin-register">Register Admin</Nav.Link></Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="live-orders"><LiveOrderManager /></Tab.Pane>
                <Tab.Pane eventKey="menu"><MenuManager /></Tab.Pane>
                <Tab.Pane eventKey="complaints"><ComplaintManager /></Tab.Pane>
                <Tab.Pane eventKey="bulk-upload"><BulkUploadManager /></Tab.Pane>
                <Tab.Pane eventKey="coupons"><CouponManager /></Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    </div>
);
}
export default AdminDashboard;


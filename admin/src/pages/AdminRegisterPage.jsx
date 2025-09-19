import React, { useState, useEffect } from 'react';
import { Table, Nav, Tab, Form, Button, Modal, Card, Alert, Accordion, Badge } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { api } from '../api';

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

// --- Order Management Component ---
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
        <div className="table-responsive">
            <table className="table table-striped table-bordered table-hover">
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
            </table>
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
        const destCategory = destination.droppableId;

        if (sourceCategory === destCategory) {
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
                                    <div className="d-none d-md-flex row fw-bold mb-2 border-bottom pb-2">
                                        <div className="col-1 text-center">Move</div>
                                        <div className="col">Name</div>
                                        <div className="col-2">Half Price</div>
                                        <div className="col-2">Full Price</div>
                                        <div className="col-3">Actions</div>
                                    </div>
                                    <Droppable droppableId={category}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                                {items.map((item, idx) => (
                                                    <Draggable key={item._id} draggableId={item._id.toString()} index={idx}>
                                                        {(provided) => (
                                                            <div
                                                                className="row align-items-center py-2 border-bottom"
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                            >
                                                                <div className="col-1 text-center" style={{ cursor: 'grab' }}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grip-vertical" viewBox="0 0 16 16">
                                                                        <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
                                                                    </svg>
                                                                </div>
                                                                <div className="col">{item.name}</div>
                                                                <div className="col-2">${item.price.half != null ? item.price.half.toFixed(2) : 'N/A'}</div>
                                                                <div className="col-2">${item.price.full.toFixed(2)}</div>
                                                                <div className="col-3">
                                                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowModal(item)}>Edit</Button>
                                                                    <Button variant="outline-secondary" size="sm" onClick={() => handleDelete(item._id)}>Delete</Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
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
            <table className="table table-striped table-bordered table-hover">
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
            </table>
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
            fetchCoupons(); // Refresh the list
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
            <Table striped bordered hover responsive>
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
const AdminDashboard = ({ adminName, handleLogout }) => (
    <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>Admin Dashboard</h1>
            <div>
                <span className="me-3">Welcome, {adminName}</span>
                <Button variant="outline-secondary" size="sm" onClick={() => handleLogout('admin')}>Logout</Button>
            </div>
        </div>
        <Tab.Container defaultActiveKey="menu">
            <Nav variant="tabs" className="mb-3 justify-content-center">
                <Nav.Item><Nav.Link eventKey="menu">Manage Menu</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="orders">Manage Orders</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="complaints">Manage Complaints</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="bulk-upload">Bulk Upload</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link eventKey="coupons">Manage Coupons</Nav.Link></Nav.Item>
                <Nav.Item><Nav.Link href="#/admin-register">Register New Admin</Nav.Link></Nav.Item>
            </Nav>
            <Tab.Content>
                <Tab.Pane eventKey="menu"><MenuManager /></Tab.Pane>
                <Tab.Pane eventKey="orders"><OrderManager /></Tab.Pane>
                <Tab.Pane eventKey="complaints"><ComplaintManager /></Tab.Pane>
                <Tab.Pane eventKey="bulk-upload"><BulkUploadManager /></Tab.Pane>
                <Tab.Pane eventKey="coupons"><CouponManager /></Tab.Pane>
            </Tab.Content>
        </Tab.Container>
    </div>
);

export default AdminDashboard;


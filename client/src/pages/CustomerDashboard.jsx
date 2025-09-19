import React, { useState, useEffect } from 'react';
import { Nav, Tab, Form, Button, Modal, Badge } from 'react-bootstrap';
import { api } from '../api';

// --- New Visual Order Status Tracker Component ---
const OrderStatusTracker = ({ status }) => {
    const statuses = ['Received', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];
    const currentStatusIndex = statuses.indexOf(status);

    // Handle 'Rejected' status separately
    if (status === 'Rejected') {
        return <Badge bg="danger">Order Rejected</Badge>;
    }

    return (
        <div className="d-flex align-items-center justify-content-between my-2">
            {statuses.map((s, index) => {
                const isActive = index <= currentStatusIndex;
                return (
                    <React.Fragment key={s}>
                        <div className="d-flex flex-column align-items-center">
                            <div className={`status-dot ${isActive ? 'active' : ''}`}></div>
                            <small className={isActive ? 'fw-bold' : 'text-muted'}>{s}</small>
                        </div>
                        {index < statuses.length - 1 && <div className={`status-line ${isActive && index < currentStatusIndex ? 'active' : ''}`}></div>}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const CustomerDashboard = ({ userName }) => {
    const [orders, setOrders] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showComplaintModal, setShowComplaintModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [complaintMessage, setComplaintMessage] = useState('');

    const fetchData = async () => {
        try {
            const [ordersRes, complaintsRes] = await Promise.all([
                api.get('/my-orders'),
                api.get('/my-complaints')
            ]);
            setOrders(ordersRes.data);
            setComplaints(complaintsRes.data);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };
    
    // Use polling to get live updates
    useEffect(() => {
        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);

    const handleOpenComplaintModal = (order) => {
        setSelectedOrder(order);
        setShowComplaintModal(true);
    };
    
    const handleCloseComplaintModal = () => {
        setShowComplaintModal(false);
        setSelectedOrder(null);
        setComplaintMessage('');
    };

    const handleComplaintSubmit = async (e) => {
        e.preventDefault();
        if (!complaintMessage.trim()) {
            alert('Please enter a message for your complaint.');
            return;
        }
        try {
            await api.post('/complaints', { orderId: selectedOrder._id, message: complaintMessage });
            alert('Complaint submitted successfully.');
            const complaintsRes = await api.get('/my-complaints');
            setComplaints(complaintsRes.data);
            handleCloseComplaintModal();
        } catch (error) {
            alert('Failed to submit complaint.');
            console.error(error);
        }
    };


    if (loading) return <div className="text-center"><div className="spinner-border text-danger"></div></div>;

    return (
        <div className="fade-in">
            <h1 className="mb-4">Welcome, {userName}!</h1>
            <Tab.Container defaultActiveKey="orders">
                <Nav variant="tabs" className="mb-3"><Nav.Item><Nav.Link eventKey="orders">My Orders</Nav.Link></Nav.Item><Nav.Item><Nav.Link eventKey="complaints">My Complaints</Nav.Link></Nav.Item></Nav>
                <Tab.Content>
                    <Tab.Pane eventKey="orders">
                        <h3>Order History</h3>
                        {orders.length > 0 ? (
                             <div className="table-responsive">
                                <table className="table table-striped table-bordered table-hover">
                                    <thead><tr><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order._id}>
                                                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    <ul>
                                                        {order.items.map(item => (
                                                            <li key={`${order._id}-${item.menuItemId?._id}-${item.variant}`}>
                                                                {item.quantity}x {item.menuItemId?.name} ({item.variant})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </td>
                                                <td>
                                                    {order.appliedCoupon ? (
                                                        <div>
                                                            <span style={{ textDecoration: 'line-through' }} className="text-muted d-block">${order.totalPrice.toFixed(2)}</span>
                                                            <strong className="d-block">${order.finalPrice.toFixed(2)}</strong>
                                                        </div>
                                                    ) : (
                                                        <span>${order.totalPrice.toFixed(2)}</span>
                                                    )}
                                                </td>
                                                <td style={{ minWidth: '300px' }}>
                                                    <OrderStatusTracker status={order.status} />
                                                </td>
                                                <td><Button variant="outline-secondary" size="sm" onClick={() => handleOpenComplaintModal(order)}>Raise Complaint</Button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p>You haven't placed any orders yet.</p>}
                    </Tab.Pane>
                    <Tab.Pane eventKey="complaints">
                         <h3>Complaint History</h3>
                         {complaints.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped table-bordered table-hover">
                                    <thead><tr><th>Order Date</th><th>Message</th><th>Status</th></tr></thead>
                                    <tbody>
                                        {complaints.map(c => (
                                            <tr key={c._id}>
                                                <td>{c.orderId ? new Date(c.orderId.createdAt).toLocaleDateString() : 'N/A'}</td>
                                                <td>{c.message}</td>
                                                <td><Badge bg={c.status === 'Resolved' ? 'success' : 'info'}>{c.status}</Badge></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         ) : <p>You have no complaint history.</p>}
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
            
            <Modal show={showComplaintModal} onHide={handleCloseComplaintModal}>
                <Modal.Header closeButton><Modal.Title>File a Complaint for Order #{selectedOrder?._id.slice(-6)}</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleComplaintSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Please describe the issue:</Form.Label>
                            <Form.Control as="textarea" rows={4} value={complaintMessage} onChange={(e) => setComplaintMessage(e.target.value)} required />
                        </Form.Group>
                        <Button variant="danger" type="submit">Submit Complaint</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default CustomerDashboard;

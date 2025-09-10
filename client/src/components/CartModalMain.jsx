import React from 'react';
import { Modal, Button, Form, ListGroup, Badge, CloseButton } from 'react-bootstrap';

const CartModal = ({ show, handleClose, cartItems, setCartItems, submitOrder, isLoggedIn }) => {
    const handleQuantityChange = (item, quantity) => {
        if (quantity < 1) { 
            setCartItems(cartItems.filter(cartItem => cartItem.cartId !== item.cartId)); 
        } else { 
            setCartItems(cartItems.map(cartItem => cartItem.cartId === item.cartId ? { ...cartItem, quantity: quantity } : cartItem)); 
        }
    };
    
    const calculateTotal = () => cartItems.reduce((total, item) => total + item.priceAtOrder * item.quantity, 0).toFixed(2);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert('Please log in to place an order.');
            window.location.hash = '#/login';
            handleClose();
        } else {
            submitOrder();
        }
    };
    
    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Your Order</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {cartItems.length === 0 ? ( 
                    <p>Your cart is empty.</p> 
                ) : (
                    <>
                        <ListGroup variant="flush">
                            {cartItems.map(item => (
                                <ListGroup.Item key={item.cartId} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-0">{item.name} ({item.variant})</h6>
                                        <small className="text-muted">${item.priceAtOrder.toFixed(2)}</small>
                                        {item.instructions && <small className="d-block text-muted"><em>"{item.instructions}"</em></small>}
                                    </div>
                                    <div className="d-flex align-items-center">
                                        <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(item, item.quantity - 1)}>-</Button>
                                        <span className="mx-2">{item.quantity}</span>
                                        <Button variant="outline-secondary" size="sm" onClick={() => handleQuantityChange(item, item.quantity + 1)}>+</Button>
                                    </div>
                                    <CloseButton onClick={() => handleQuantityChange(item, 0)} />
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        <hr />
                        <div className="text-end"><h4>Total: ${calculateTotal()}</h4></div>
                        <div className="d-grid">
                            <Button variant="danger" type="button" onClick={handleSubmit}>Place Order</Button>
                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default CartModal;


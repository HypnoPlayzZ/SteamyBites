import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup, Badge, CloseButton, Alert } from 'react-bootstrap';
import { api } from '../api';

const CartModal = ({ show, handleClose, cartItems, setCartItems, submitOrder, isLoggedIn }) => {
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');

    useEffect(() => {
        // Reset coupon state when the modal is closed or the cart becomes empty
        if (!show || cartItems.length === 0) {
            setCouponCode('');
            setAppliedCoupon(null);
            setCouponError('');
        }
    }, [show, cartItems]);

    const handleQuantityChange = (item, quantity) => {
        if (quantity < 1) { 
            setCartItems(cartItems.filter(cartItem => cartItem.cartId !== item.cartId)); 
        } else { 
            setCartItems(cartItems.map(cartItem => cartItem.cartId === item.cartId ? { ...cartItem, quantity: quantity } : cartItem)); 
        }
    };

    const subTotal = cartItems.reduce((total, item) => total + item.priceAtOrder * item.quantity, 0);
    const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
    const finalTotal = subTotal - discountAmount;

    const handleApplyCoupon = async () => {
        setCouponError('');
        try {
            const response = await api.post('/coupons/validate', { code: couponCode, cartTotal: subTotal });
            setAppliedCoupon(response.data);
        } catch (err) {
            setCouponError(err.response?.data?.message || 'Failed to apply coupon.');
            setAppliedCoupon(null);
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert('Please log in to place an order.');
            window.location.hash = '#/login';
            handleClose();
        } else {
            // Pass the final total and the applied coupon details to the submit function
            submitOrder(finalTotal, appliedCoupon?.coupon);
        }
    };
    
    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton><Modal.Title>Your Order</Modal.Title></Modal.Header>
            <Modal.Body>
                {cartItems.length === 0 ? ( <p>Your cart is empty.</p> ) : (
                    <>
                        <ListGroup variant="flush">
                            {cartItems.map(item => (
                                <ListGroup.Item key={item.cartId} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="mb-0">{item.name} ({item.variant})</h6>
                                        <small className="text-muted">${item.priceAtOrder.toFixed(2)}</small>
                                        {item.instructions && <small className="d-block text-info">Instructions: {item.instructions}</small>}
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
                        <div className="coupon-input-group mb-3">
                            <Form.Control 
                                placeholder="Enter coupon code" 
                                value={couponCode} 
                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                            />
                            <Button onClick={handleApplyCoupon}>Apply</Button>
                        </div>
                        {couponError && <Alert variant="danger" size="sm">{couponError}</Alert>}
                        {appliedCoupon && <Alert variant="success" size="sm">{appliedCoupon.message}</Alert>}
                        
                        <div className="text-end">
                            <h5>Subtotal: ${subTotal.toFixed(2)}</h5>
                            {appliedCoupon && <h5 className="text-success">Discount: -${discountAmount.toFixed(2)}</h5>}
                            <hr />
                            <h4>Total: ${finalTotal.toFixed(2)}</h4>
                        </div>
                        <div className="d-grid mt-3">
                            <Button variant="danger" type="button" onClick={handleSubmit}>Place Order</Button>
                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default CartModal;


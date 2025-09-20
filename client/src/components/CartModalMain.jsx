import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, ListGroup, CloseButton, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { api } from '../api';

const RESTAURANT_LOCATION = { lat: 28.6330, lon: 77.2194 }; // Centered in Delhi, India
const DELIVERY_RADIUS_KM = 2.5;

// Haversine formula to calculate distance
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

const CartModal = ({ show, handleClose, cartItems, setCartItems, submitOrder, isLoggedIn }) => {
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [address, setAddress] = useState('');
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const [deliveryCheck, setDeliveryCheck] = useState({ isDeliverable: null, message: '' });
    
    // Check if the page is loaded in a secure context (https)
    const isSecureContext = window.isSecureContext;

    useEffect(() => {
        if (!show || cartItems.length === 0) {
            setCouponCode('');
            setAppliedCoupon(null);
            setCouponError('');
            setAddress('');
            setDeliveryCheck({ isDeliverable: null, message: '' });
        }
    }, [show, cartItems]);

    useEffect(() => {
        const coords = address.split(',').map(s => parseFloat(s.trim()));
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            const distance = getDistanceFromLatLonInKm(RESTAURANT_LOCATION.lat, RESTAURANT_LOCATION.lon, coords[0], coords[1]);
            if (distance <= DELIVERY_RADIUS_KM) {
                setDeliveryCheck({ isDeliverable: true, message: `Great! You're within our ${DELIVERY_RADIUS_KM} km delivery radius.` });
            } else {
                setDeliveryCheck({ isDeliverable: false, message: `Sorry, you're ${distance.toFixed(1)} km away. We only deliver within ${DELIVERY_RADIUS_KM} km.` });
            }
        } else {
             setDeliveryCheck({ isDeliverable: !!address.trim(), message: '' });
        }
    }, [address]);

    const handleQuantityChange = (item, quantity) => {
        if (quantity < 1) {
            setCartItems(cartItems.filter(cartItem => cartItem.cartId !== item.cartId));
        } else {
            setCartItems(cartItems.map(cartItem => cartItem.cartId === item.cartId ? { ...cartItem, quantity } : cartItem));
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

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            setIsFetchingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setAddress(`${latitude}, ${longitude}`);
                    setIsFetchingLocation(false);
                },
                (error) => {
                    let errorMessage = 'Unable to retrieve your location. Please enter it manually.';
                    if(error.code === 1) {
                        errorMessage = 'Location permission denied. Please enable it in your browser settings.';
                    }
                    alert(errorMessage);
                    setIsFetchingLocation(false);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            alert('Please log in to place an order.');
            window.location.hash = '#/login';
            handleClose();
        } else if (!address.trim()) {
            alert('Please enter a delivery address.');
        } else if(deliveryCheck.isDeliverable === false){
             alert('Your location is outside our delivery radius.');
        } else {
            submitOrder(finalTotal, appliedCoupon?.coupon, address);
        }
    };
    
    const isOrderButtonDisabled = !address.trim() || deliveryCheck.isDeliverable === false;
    
    const gpsButtonTooltip = (props) => (
        <Tooltip id="button-tooltip" {...props}>
          GPS requires a secure (https) connection.
        </Tooltip>
      );

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
                        
                        <Form.Group className="mb-3">
                            <Form.Label className="fw-bold">Delivery Address</Form.Label>
                            <div className="d-flex gap-2">
                                <Form.Control 
                                    as="textarea"
                                    rows={2}
                                    placeholder="Enter your address or use GPS"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />
                                 <OverlayTrigger
                                    placement="top"
                                    overlay={!isSecureContext ? gpsButtonTooltip : <></>}
                                >
                                    <span className="d-inline-block">
                                        <Button 
                                            variant="outline-primary" 
                                            onClick={handleGetLocation} 
                                            disabled={isFetchingLocation || !isSecureContext}
                                            style={!isSecureContext ? { pointerEvents: 'none' } : {}}
                                        >
                                            {isFetchingLocation ? '...' : 'GPS'}
                                        </Button>
                                    </span>
                                </OverlayTrigger>
                            </div>
                            {deliveryCheck.message && (
                               <Alert variant={deliveryCheck.isDeliverable ? 'success' : 'danger'} className="mt-2 py-1 px-2" style={{fontSize: '0.8rem'}}>
                                    {deliveryCheck.message}
                                </Alert>
                            )}
                        </Form.Group>

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
                            <Button variant="danger" type="button" onClick={handleSubmit} disabled={isOrderButtonDisabled}>Place Order</Button>
                        </div>
                    </>
                )}
            </Modal.Body>
        </Modal>
    );
};

export default CartModal;


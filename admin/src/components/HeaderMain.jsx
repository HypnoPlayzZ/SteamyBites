import React from 'react';
import { Button, Nav, Badge } from 'react-bootstrap';

const Header = ({ route, auth, isCustomerLoggedIn, setShowCart, cartItems, handleLogout }) => {
    
    return (
        <header>
            <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
                <div className="container">
                    <a className="navbar-brand" href="#/">
                        <img src="https://lh3.googleusercontent.com/Ye0hjUzWm-MM4eTC3ma2TMvWviXUn2Ufdsqq7kEHCnKi5ZPSii3tW-D8Ei5C-4qgUCqGUHGXk0tk4AkJdnWPHAz7YbKEXYEjF2CeFn01" alt="Steamy Bites Logo" className="d-inline-block align-text-top me-2 rounded-circle" />
                        <span className="fw-bold">Steamy Bites</span>
                    </a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse justify-content-center" id="navbarNav">
                        <ul className="navbar-nav">
                            <li className="nav-item"><a className={`nav-link mx-2 ${route === '#/' ? 'active' : ''}`} href="#/">Home</a></li>
                            <li className="nav-item"><a className={`nav-link mx-2 ${route === '#/about' ? 'active' : ''}`} href="#/about">About Us</a></li>
                            <li className="nav-item"><a className={`nav-link mx-2 ${route === '#/contact' ? 'active' : ''}`} href="#/contact">Contact Us</a></li>
                        </ul>
                    </div>
                    <div className="d-flex align-items-center">
                        {isCustomerLoggedIn ? (
                            <>
                                <Nav.Link href={'#/dashboard'} className="me-3">{auth.customer.name}</Nav.Link>
                                <Button variant="outline-secondary" size="sm" onClick={() => handleLogout('customer')} className="me-3">Logout</Button>
                            </>
                        ) : (
                            <Nav.Link href="#/login" className="me-3">Customer Login</Nav.Link>
                        )}
                        
                        <Button variant="danger" onClick={() => setShowCart(true)} className="position-relative">
                            Order Now <Badge pill bg="dark" className="position-absolute top-0 start-100 translate-middle">{cartItems.reduce((count, item) => count + item.quantity, 0)}</Badge>
                        </Button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;

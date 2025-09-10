import React from 'react';
import { Button, Nav, Badge } from 'react-bootstrap';

const Header = ({ route, auth, isCustomerLoggedIn, isAdminLoggedIn, handleLogout, setShowCart, cartItems }) => {
    
    // Determine if the current page is part of the admin portal
    const isAdminPage = route.startsWith('#/admin');

    // This component will render the correct set of buttons for the right side of the header
    const renderNavButtons = () => {
        // If we are on an admin page, render nothing in the main header.
        // The admin dashboard will render its own user info and logout button.
        if (isAdminPage) {
            return null;
        }

        // If a customer is logged in, show their view.
        if (isCustomerLoggedIn) {
            return (
                <>
                    <Nav.Link href={'#/dashboard'} className="me-3">{auth.customer.name}</Nav.Link>
                    <Button variant="outline-secondary" size="sm" onClick={() => handleLogout('customer')} className="me-3">Logout</Button>
                    <Button variant="danger" onClick={() => setShowCart(true)} className="position-relative">
                        Order Now <Badge pill bg="dark" className="position-absolute top-0 start-100 translate-middle">{cartItems.reduce((count, item) => count + item.quantity, 0)}</Badge>
                    </Button>
                </>
            );
        }

        // Otherwise, show the default guest view with login buttons.
        return (
            <>
                <Nav.Link href="#/login" className="me-3">Customer Login</Nav.Link>
                <Nav.Link href="#/admin-login" className="me-3">Admin Login</Nav.Link>
                <Button variant="danger" onClick={() => setShowCart(true)} className="position-relative">
                    Order Now <Badge pill bg="dark" className="position-absolute top-0 start-100 translate-middle">{cartItems.reduce((count, item) => count + item.quantity, 0)}</Badge>
                </Button>
            </>
        );
    };

    return (
        <header>
            <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm sticky-top">
                <div className="container">
                    <a className="navbar-brand d-flex align-items-center" href="#/">
                        <img src="https://lh3.googleusercontent.com/Ye0hjUzWm-MM4eTC3ma2TMvWviXUn2Ufdsqq7kEHCnKi5ZPSii3tW-D8Ei5C-4qgUCqGUHGXk0tk4AkJdnWPHAz7YbKEXYEjF2CeFn01" alt="Steamy Bites Logo" className="d-inline-block align-text-top me-2 rounded-circle" width={80} />
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
                        {renderNavButtons()}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;


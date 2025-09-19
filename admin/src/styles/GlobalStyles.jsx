import React from 'react';

export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@300;400;600&display=swap');
    
    :root {
        --bg-light-start: #ffffff;
        --bg-light-end: #ffecd2;
        --bg-card: #ffffff;
        --text-dark: #212529;
        --text-muted: #6c757d;
        --primary-accent: #ff8c00;
        --primary-hover: #e67e00;
    }

    body { 
        font-family: 'Poppins', sans-serif; 
        background: linear-gradient(to right, var(--bg-light-start), var(--bg-light-end));
        color: var(--text-dark);
    }

    /* Animations */
    @keyframes fadeIn { 
        from { opacity: 0; transform: translateY(20px); } 
        to { opacity: 1; transform: translateY(0); } 
    }
    
    @keyframes pulse-orange {
        0% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(255, 140, 0, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 140, 0, 0); }
    }

    .fade-in { 
        animation: fadeIn 0.6s ease-in-out forwards; 
    }

    /* Header & Navigation */
    .navbar {
        background-color: rgba(255, 255, 255, 0.8) !important;
        backdrop-filter: blur(10px);
    }
    .navbar-brand .fw-bold { 
        color: var(--primary-accent); 
        font-family: 'Playfair Display', serif;
    }

    .nav-link {
        color: var(--text-dark) !important;
        transition: color 0.3s ease;
    }
    .nav-link:hover, .nav-link.active { 
        color: var(--primary-accent) !important; 
    }

    /* Buttons */
    .btn-danger, .btn-primary {
        background-color: var(--primary-accent);
        border: none;
        transition: background-color 0.3s ease, transform 0.2s ease;
    }
    .btn-danger:hover, .btn-primary:hover {
        background-color: var(--primary-hover);
        transform: scale(1.05);
        animation: pulse-orange 1.5s infinite;
    }
     .btn-outline-danger {
        color: var(--primary-accent);
        border-color: var(--primary-accent);
         transition: all 0.3s ease;
    }
    .btn-outline-danger:hover {
        background-color: var(--primary-accent);
        color: #ffffff;
        border-color: var(--primary-accent);
    }

    /* Hero Section */
    .hero-section { 
        background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop') no-repeat center center; 
        background-size: cover; 
        color: white; 
        padding: 8rem 0; 
        margin-bottom: 4rem; 
        border-radius: 1.5rem; 
        animation: fadeIn 1s ease-in-out; 
    }
    
    .hero-section h1 { 
        font-family: 'Playfair Display', serif;
        font-weight: 700; 
        font-size: 4rem; 
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    }

    /* --- Menu List Styles --- */
    .menu-list-container {
        background-color: var(--bg-card);
        padding: 2rem 3rem;
        border-radius: 1rem;
        box-shadow: 0 10px 40px rgba(0,0,0,0.08);
    }
    .menu-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #dee2e6;
        animation: fadeIn 0.5s ease-in-out forwards;
        transition: all 0.3s ease-in-out;
        border-radius: 0.75rem;
    }
    .menu-list-item:hover {
        transform: scale(1.03);
        background-color: #fffaf0;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }
    .menu-list-item:last-child {
        border-bottom: none;
    }
    .menu-item-details {
        flex: 1;
        padding-right: 2rem;
    }
    .item-name {
        font-weight: 600;
        color: var(--text-dark);
        font-size: 1.1rem;
    }
    .item-price {
        color: var(--text-muted);
        margin-bottom: 0.5rem;
    }
    .item-description {
        color: var(--text-muted);
        font-size: 0.9rem;
    }
    .menu-item-action {
        width: 150px;
        margin-left: 2rem;
        text-align: center;
    }
    .menu-item-image-container {
        position: relative;
    }
    .menu-item-image-container img {
        width: 150px;
        height: 150px;
        object-fit: cover;
        border-radius: 0.5rem;
        transition: transform 0.3s ease;
    }
     .menu-list-item:hover .menu-item-image-container img {
        transform: scale(1.1);
    }
    .add-button-container {
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
    }
    .add-button-container .btn {
        background-color: #fff;
        color: var(--primary-accent);
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    }
    .add-button-container .btn:hover {
        transform: scale(1.1) rotate(5deg);
        background-color: var(--primary-accent);
        color: #fff;
    }

    /* --- New, Attractive Coupon Styles --- */
    .coupon-section {
        animation: fadeIn 1s ease-in-out 0.5s;
        animation-fill-mode: both;
    }
    .coupon-scroll-container {
        display: flex;
        overflow-x: auto;
        gap: 1.5rem;
        padding: 1rem;
        scrollbar-width: thin;
        scrollbar-color: var(--primary-accent) #fff;
    }
    .coupon-card {
        flex: 0 0 280px;
        padding: 1.5rem;
        border-radius: 1rem;
        background: var(--primary-accent);
        color: white;
        text-align: center;
        position: relative;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        cursor: pointer;
    }
    .coupon-card:hover {
        transform: translateY(-10px) scale(1.05);
        box-shadow: 0 15px 30px rgba(230, 126, 34, 0.4);
    }
    /* Creates the "ticket" cutout effect */
    .coupon-card::before, .coupon-card::after {
        content: '';
        position: absolute;
        width: 30px;
        height: 30px;
        background: var(--bg-light-end);
        border-radius: 50%;
    }
    .coupon-card::before {
        top: 50%;
        left: -15px;
        transform: translateY(-50%);
    }
    .coupon-card::after {
        top: 50%;
        right: -15px;
        transform: translateY(-50%);
    }
    .coupon-code {
        font-weight: 700;
        font-family: 'Playfair Display', serif;
        margin-bottom: 0.5rem;
        font-size: 1.5rem;
        border: 2px dashed rgba(255,255,255,0.7);
        padding: 0.5rem;
        border-radius: 0.5rem;
    }
    .coupon-description {
        font-size: 0.9rem;
        opacity: 0.9;
    }
    .coupon-input-group {
        display: flex;
        gap: 0.5rem;
    }

    /* Forms and Modals */
    .card, .modal-content {
        background-color: var(--bg-card);
        color: var(--text-dark);
        border: none;
    }
    .form-control {
        background-color: #f8f9fa;
        border-color: #dee2e6;
        color: var(--text-dark);
    }
    .form-control:focus {
        background-color: #fff;
        border-color: var(--primary-accent);
        color: var(--text-dark);
        box-shadow: 0 0 0 0.25rem rgba(255, 140, 0, 0.25);
    }

    .list-group-item {
        background-color: transparent;
        border-color: #dee2e6;
    }

    .nav-tabs .nav-link.active { 
        background-color: var(--bg-card);
        color: var(--primary-accent); 
        border-color: #dee2e6 #dee2e6 var(--bg-card); 
    }

    footer {
        background-color: var(--bg-card) !important;
    }
    footer a {
        color: var(--primary-accent) !important;
    }
  `}</style>
);


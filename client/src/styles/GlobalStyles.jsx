import React from 'react';

export const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Poppins:wght@300;400;600&display=swap');
    
    :root {
        --bg-dark-start: #000000;
        --bg-dark-mid: #2a0800;
        --bg-dark-end: #430000;
        --bg-card: #1f1f1f;
        --text-light: #ffffff;
        --text-muted: #bdc3c7;
        --primary-accent: #e74c3c;
        --primary-hover: #c0392b;
    }

    body { 
        font-family: 'Poppins', sans-serif; 
        background: linear-gradient(to right, var(--bg-dark-start), var(--bg-dark-mid), var(--bg-dark-end));
        color: var(--text-light);
    }

    /* Animations */
    @keyframes fadeIn { 
        from { opacity: 0; transform: translateY(20px); } 
        to { opacity: 1; transform: translateY(0); } 
    }
    
    @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(231, 76, 60, 0); }
        100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); }
    }

    .fade-in { 
        animation: fadeIn 0.6s ease-in-out forwards; 
    }

    /* Header & Navigation */
    .navbar {
        background-color: rgba(15, 15, 15, 0.8) !important;
        backdrop-filter: blur(10px);
    }
    .navbar-brand .fw-bold { 
        color: var(--primary-accent); 
        font-family: 'Playfair Display', serif;
    }

    .nav-link {
        color: var(--text-muted) !important;
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
        animation: pulse-red 1.5s infinite;
    }
     .btn-outline-danger {
        color: var(--primary-accent);
        border-color: var(--primary-accent);
         transition: all 0.3s ease;
    }
    .btn-outline-danger:hover {
        background-color: var(--primary-accent);
        color: var(--text-light);
        border-color: var(--primary-accent);
    }

    /* Hero Section */
    .hero-section { 
        background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop') no-repeat center center; 
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
    }

    /* New Menu List Styles */
    .menu-list-container {
        background-color: var(--bg-card);
        padding: 2rem;
        border-radius: 1rem;
    }
    .menu-list-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1.5rem 0;
        border-bottom: 1px solid #444;
        animation: fadeIn 0.5s ease-in-out forwards;
    }
    .menu-list-item:last-child {
        border-bottom: none;
    }
    .menu-item-details {
        flex: 1;
    }
    .item-name {
        font-weight: 600;
        color: var(--text-light);
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
    }
    .add-button-container {
        position: absolute;
        bottom: -20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 0.5rem;
    }
    .add-button-container .btn {
        background-color: #fff;
        color: var(--primary-accent);
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }


    /* Forms and Modals */
    .card, .modal-content {
        background-color: var(--bg-card);
        color: var(--text-light);
    }
    .form-control {
        background-color: #333;
        border-color: #555;
        color: var(--text-light);
    }
    .form-control:focus {
        background-color: #333;
        border-color: var(--primary-accent);
        color: var(--text-light);
        box-shadow: 0 0 0 0.25rem rgba(231, 76, 60, 0.25);
    }

    .list-group-item {
        background-color: transparent;
        border-color: #444;
    }

    .nav-tabs .nav-link.active { 
        background-color: var(--bg-card);
        color: var(--primary-accent); 
        border-color: #444 #444 var(--bg-card); 
    }

    footer {
        background-color: var(--bg-card) !important;
    }
    footer a {
        color: var(--primary-accent) !important;
    }
  `}</style>
);


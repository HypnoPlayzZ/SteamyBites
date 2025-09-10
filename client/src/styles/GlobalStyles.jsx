import React from 'react';

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
    body { font-family: 'Poppins', sans-serif; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .fade-in { animation: fadeIn 0.5s ease-in-out forwards; }
    .navbar-brand .fw-bold { color: #d9534f; }
    .nav-link.active { color: #d9534f !important; }
    .hero-section { background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://placehold.co/1200x400/333333/FFFFFF?text=Delicious+Food') no-repeat center center; background-size: cover; color: white; padding: 6rem 0; margin-bottom: 3rem; border-radius: 1rem; animation: fadeIn 1s ease-in-out; }
    .hero-section h1 { font-weight: 700; font-size: 3.5rem; }
    .menu-card { transition: all 0.3s ease; animation: fadeIn 0.5s ease-in-out forwards; }
    .menu-card:hover { transform: translateY(-10px); box-shadow: 0 15px 30px rgba(0,0,0,0.1) !important; }
    .nav-tabs .nav-link { color: #6c757d; }
    .nav-tabs .nav-link.active { color: #d9534f; border-color: #d9534f #d9534f #fff; }
  `}</style>
);

export default GlobalStyles;

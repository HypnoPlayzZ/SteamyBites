import React from 'react';
import { Button } from 'react-bootstrap';

const HeroSection = () => (
  <div className="hero-section text-center">
    <h1 className="display-4">Welcome to Steamy Bites</h1>
    <p className="lead">Experience the finest flavors and culinary delights.</p>
  </div>
);

const MenuPage = ({ items, onAddToCart }) => {
  if (items.length === 0) {
    return <div className="text-center"><div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }
  return (
    <div className="fade-in">
      <HeroSection />
      <h2 className="mb-4 text-center">Our Menu</h2>
      <div className="row">
        {items.map((item, index) => {
          const halfPrice = (item.price && typeof item.price.half === 'number') ? item.price.half.toFixed(2) : 'N/A';
          const fullPrice = (item.price && typeof item.price.full === 'number') ? item.price.full.toFixed(2) : 'N/A';

          return (
            <div className="col-md-6 col-lg-4 mb-4" key={item._id} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="card h-100 shadow-sm border-0 menu-card">
                <img src={item.imageUrl} className="card-img-top" alt={item.name} style={{height: '200px', objectFit: 'cover'}} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/CCCCCC/FFFFFF?text=Image+Not+Found'; }}/>
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text text-muted small">{item.description}</p>
                  <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold text-danger">Half: ${halfPrice}</span>
                          <Button variant="outline-danger" size="sm" onClick={() => onAddToCart(item, 'half')} disabled={halfPrice === 'N/A'}>Add</Button>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-danger">Full: ${fullPrice}</span>
                          <Button variant="danger" size="sm" onClick={() => onAddToCart(item, 'full')} disabled={fullPrice === 'N/A'}>Add</Button>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default MenuPage;

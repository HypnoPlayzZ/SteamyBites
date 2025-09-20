import React, { useState, useEffect } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';

const HeroSection = () => (
  <div className="hero-section text-center">
    <h1 className="display-4">Welcome to Steamy Bites</h1>
    <p className="lead">Experience the finest flavors and culinary delights.</p>
  </div>
);

const CustomizationModal = ({ show, handleClose, item, onAddToCart }) => {
    const [variant, setVariant] = useState('full');
    const [quantity, setQuantity] = useState(1);
    const [instructions, setInstructions] = useState('');

    // Reset state when the modal opens with a new item
    useEffect(() => {
        if (item) {
            setVariant('full');
            setQuantity(1);
            setInstructions('');
        }
    }, [item]);


    const handleSubmit = () => {
        onAddToCart(item, variant, quantity, instructions);
        handleClose();
    };

    if (!item) return null;

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{item.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Size</Form.Label>
                        <Form.Control as="select" value={variant} onChange={e => setVariant(e.target.value)}>
                            {item.price.full != null && <option value="full">Full - ₹{item.price.full.toFixed(2)}</option>}
                            {item.price.half != null && <option value="half">Half - ₹{item.price.half.toFixed(2)}</option>}
                        </Form.Control>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10)))} min="1" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Cooking Instructions (Optional)</Form.Label>
                        <Form.Control as="textarea" rows={3} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g., make it extra spicy" />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={handleClose}>Close</Button>
                <Button variant="danger" onClick={handleSubmit}>Add to Cart</Button>
            </Modal.Footer>
        </Modal>
    );
};


const MenuPage = ({ items, onAddToCart }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleShowModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  if (items.length === 0) {
    return <div className="text-center"><div className="spinner-border text-danger" role="status"><span className="visually-hidden">Loading...</span></div></div>;
  }
  return (
    <div className="fade-in">
      <HeroSection />
      <div className="menu-list-container">
        <h2 className="mb-4">Recommended ({items.length})</h2>
        {items.map((item, index) => {
          const halfPrice = (item.price && typeof item.price.half === 'number') ? item.price.half.toFixed(2) : null;
          const fullPrice = (item.price && typeof item.price.full === 'number') ? item.price.full.toFixed(2) : null;

          return (
            <div className="menu-list-item" key={item._id} style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="menu-item-details">
                <h5 className="item-name">{item.name}</h5>
                {halfPrice && <p className="item-price">Half: ₹{halfPrice}</p>}
                {fullPrice && <p className="item-price">Full: ₹{fullPrice}</p>}
                <p className="item-description">{item.description}</p>
              </div>
              <div className="menu-item-action">
                <div className="menu-item-image-container">
                    <img src={item.imageUrl} alt={item.name} onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/150x150/2c2c2c/e74c3c?text=Steamy'; }}/>
                    <div className="add-button-container">
                        <Button variant="light" onClick={() => handleShowModal(item)}>ADD</Button>
                    </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <CustomizationModal show={showModal} handleClose={handleCloseModal} item={selectedItem} onAddToCart={onAddToCart} />
    </div>
  );
};

export default MenuPage;


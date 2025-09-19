import React from 'react';
import { Carousel, Container, Row, Col } from 'react-bootstrap';

export const AboutPage = () => (
    <div className="fade-in">
        <Container>
            <Row className="justify-content-center text-center mb-5">
                <Col md={8}>
                    <h1 className="display-4 font-weight-bold">Our Story</h1>
                    <p className="lead text-muted">
                        From a passion for authentic flavors to a celebration on your plate.
                    </p>
                </Col>
            </Row>

            <Row className="align-items-center mb-5">
                <Col md={6} className="mb-4 mb-md-0">
                    <Carousel interval={3000} className="shadow-lg rounded">
                        <Carousel.Item>
                            <img
                                className="d-block w-100 rounded"
                                src="/1.png"
                                alt="First slide - Our Kitchen"
                            />
                            <Carousel.Caption className="carousel-caption-background">
                                <h3>State-of-the-Art Kitchen</h3>
                                <p>Where culinary magic happens every day.</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                        <Carousel.Item>
                            <img
                                className="d-block w-100 rounded"
                                src="/2.jpeg"
                                alt="Second slide - Fresh Ingredients"
                            />
                            <Carousel.Caption className="carousel-caption-background">
                                <h3>Fresh & Local Ingredients</h3>
                                <p>We believe in quality you can taste.</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                        <Carousel.Item>
                            <img
                                className="d-block w-100 rounded"
                                src="/3.jpeg"
                                alt="Third slide - Our Signature Dish"
                            />
                            <Carousel.Caption className="carousel-caption-background">
                                <h3>Signature Dishes</h3>
                                <p>Crafted with love and a passion for perfection.</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                        <Carousel.Item>
                            <img
                                className="d-block w-100 rounded"
                                src="/4.jpeg"
                                alt="Fourth slide - Happy Customers"
                            />
                             <Carousel.Caption className="carousel-caption-background">
                                <h3>A Community of Food Lovers</h3>
                                <p>Join us for an unforgettable dining experience.</p>
                            </Carousel.Caption>
                        </Carousel.Item>
                    </Carousel>
                </Col>
                <Col md={6}>
                    <div className="about-text-animation">
                        <h3>Our Mission</h3>
                        <p>
                            Steamy Bites was founded with a simple mission: to create an unforgettable dining experience by blending traditional recipes with a modern twist. We believe that great food starts with the freshest, locally-sourced ingredients and a passion for culinary excellence.
                        </p>
                        <h3>Our Values</h3>
                        <p>
                            Quality, community, and creativity are at the heart of everything we do. We are dedicated to crafting delicious meals that not only delight the palate but also bring people together in a warm and welcoming atmosphere.
                        </p>
                    </div>
                </Col>
            </Row>
        </Container>
    </div>
);

export const ContactPage = () => (
    <div className="text-center fade-in">
        <h1>Contact Us</h1>
        <p className="lead">We'd love to hear from you!</p>
        <p><strong>Address:</strong> 423, Guru Ram Das Nagar, Laxmi Nagar, Delhi - 110092 Gali Number 5</p>
        <p><strong>Phone:</strong> 9810241274, 7042755625, 8178767938</p>
        <p><strong>Email:</strong> chtnbahuguna1@gmail.com</p>
    </div>
);


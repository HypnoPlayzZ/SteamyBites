import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { api } from '../api.js';

const LoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/login', { email, password });
            onLoginSuccess(response.data.token, response.data.userName, response.data.userRole);
            window.location.hash = '#/dashboard'; // Redirect after login
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="row justify-content-center fade-in">
            <div className="col-md-6">
                <Card className="shadow-sm">
                    <Card.Body className="p-5">
                        <h2 className="text-center mb-4">Customer Login</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="loginEmail"><Form.Label>Email address</Form.Label><Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" required /></Form.Group>
                            <Form.Group className="mb-3" controlId="loginPassword"><Form.Label>Password</Form.Label><Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required /></Form.Group>
                            <Button variant="danger" type="submit" className="w-100">Login</Button>
                        </Form>
                        <div className="text-center mt-3"><a href="#/register">Don't have an account? Register</a></div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;


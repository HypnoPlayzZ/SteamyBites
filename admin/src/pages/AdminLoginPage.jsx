import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { api } from '../api';

const AdminLoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/admin/login', { email, password });
            onLoginSuccess(response.data.token, response.data.userName, response.data.userRole);
            window.location.hash = '#/admin';
        } catch (err) {
            setError(err.response?.data?.message || 'Admin login failed.');
        }
    };

    return (
        <div className="row justify-content-center fade-in">
            <div className="col-md-6">
                <Card className="shadow-sm">
                    <Card.Body className="p-5">
                        <h2 className="text-center mb-4">Admin Portal Login</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email address</Form.Label>
                                <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Admin email" required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                            </Form.Group>
                            <Button variant="primary" type="submit" className="w-100">Login as Admin</Button>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default AdminLoginPage;


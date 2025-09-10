import React, { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { api } from '../api.js';

const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        try {
            await api.post('/auth/register', { name, email, password });
            setSuccess('Registration successful! You can now log in.');
            setTimeout(() => { window.location.hash = '#/login'; }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        }
    };
    
    return (
        <div className="row justify-content-center fade-in">
            <div className="col-md-6">
                <Card className="shadow-sm">
                    <Card.Body className="p-5">
                        <h2 className="text-center mb-4">Create Account</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" required /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Email address</Form.Label><Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" required /></Form.Group>
                            <Form.Group className="mb-3"><Form.Label>Password</Form.Label><Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required /></Form.Group>
                            <Button variant="danger" type="submit" className="w-100">Register</Button>
                        </Form>
                        <div className="text-center mt-3"><a href="#/login">Already have an account? Login</a></div>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default RegisterPage;

import React, { useState } from 'react';
import { Form, Button, Row, Col, Container, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function LoginForm(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = (event) => {
    event.preventDefault();
    const credentials = { username, password };
    props.login(credentials)
      .then(() => {
          navigate("/pages")}).catch(err => props.handleErrors(err) )
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '50vh' }} fluid>
      <Form onSubmit={handleSubmit} className="border rounded" style={{ maxHeight: '100vh', minWidth: '100vh' }}>
        <Row className="mt-5">
          <Col xs={{ offset: 4, span: 4 }}>
            <Form.Group controlId="username">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={username} onChange={(ev) => setUsername(ev.target.value)} required={true} />
            </Form.Group>
          </Col>
        </Row>
        <Row className="mt-5 mb-5">
          <Col xs={{ offset: 4, span: 4 }}>
            <Form.Group controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" value={password} onChange={(ev) => setPassword(ev.target.value)} required={true} minLength={6} />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col xs={6} className="mb-5">
            <Button type="submit" className="px-4">
              Login
            </Button>
          </Col>
          <Col xs={6}>
            <Link className="btn btn-danger ml-auto px-4" to="../pages">
              Cancel
            </Link>
          </Col>
        </Row>
      </Form>
    </Container>
  );
}

export { LoginForm };

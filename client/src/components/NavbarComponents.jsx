import React from 'react';
import { Navbar, Container, Row, Col, Button, Form } from 'react-bootstrap';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function NavHeader(props) {
  const { loggedin, handleLogout, title, user, handleTitle } = props;
  const [dirtTitle, setDirtTitle] = useState(false);
  const [skrachTitle, setSkrachTitle] = useState(title)

  const handleSubmit = (event) => {
    event.preventDefault();
    // Call the parent form's callback function with the contentObject
    handleTitle(skrachTitle);
    setDirtTitle(false);
    // Reset the form fields
    setSkrachTitle('')
  };
  

  return (
    <Navbar bg="primary" variant="dark" className="rounded">
      <Container fluid>
        <Row className="w-100">
          <Col className="d-flex align-items-center justify-content-start ">
           
             
              {dirtTitle ? 
              
                 <Form onSubmit={handleSubmit} validated>
                     <Form.Group >
                       <Form.Control
                         type="text"
                         minLength={2}
                         required={true}
                         value={skrachTitle}
                         onChange={(event) => setSkrachTitle(event.target.value)}
                       />
                     </Form.Group>
                     <Row className='mt-1'>
                          <Col>
                                <Button
                                  className="btn btn-success"
                                  type="submit"
                                >
                                  Submit
                                </Button>
                              </Col>
                              <Col >
                                <Button className="btn btn-danger" onClick={() => setDirtTitle(false)}>
                                  Cancel
                                </Button>
                              </Col>
                        </Row>
                   </Form>
              :
                <>
                <Link to="/pages" className="navbar-brand">{title}</Link>
                {loggedin && user.role === 'admin' &&  (
                  <Button onClick={() => setDirtTitle(true)} className="btn btn-outline-light"><i className="bi bi-pencil-square"></i></Button>
                  )}
                </>
                }

             

          </Col>
          <Col className="d-flex justify-content-end align-self-center">
            {loggedin ? (
              <Button onClick={handleLogout} className="btn btn-outline-light">
                Logout
              </Button>
            ) : (
              <Link to="/login" className="btn btn-outline-light">
                Login
              </Link>
            )}
          </Col>
        </Row>
      </Container>
    </Navbar>
  );
}

export default NavHeader;

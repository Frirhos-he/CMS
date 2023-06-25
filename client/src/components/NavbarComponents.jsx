import React from 'react';
import { Navbar, Container, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useState, useEffect, useContext } from 'react';
import { Link , useNavigate} from 'react-router-dom';
import { TitleForm } from './TitleForm';
import API from '../API';
import ErrorContenxt from '../errorContenxt';


function NavHeader(props) {
  const { loggedin, handleLogout, user, setMessage } = props;
  const [title, setTitle] = useState('');                    //used to store the title displayed
  const [dirtTitle, setDirtTitle] = useState(false);         //used make loading on title shown
  const [enabledForm, setEnabledForm] = useState(false);     //used to enable the form title
  const {handleErrors} = useContext(ErrorContenxt);
  const navigate = useNavigate();


  const handleTitle = async (changedTitle) => {
    try {
      const titleUpdate = await API.updateTitle(changedTitle);
      setTitle(titleUpdate)
      setMessage({ msg: `Title successfully changed`, type: 'success' });
      setEnabledForm(false);
    } catch (err) {
      handleErrors(err);
    }
  };
  
  const getTitle = async () => {
    try {
      setDirtTitle(true);
      const titleRes = await API.getTitle();  // a string of representing title
      setTitle(titleRes)
      setDirtTitle(false);
    } catch (err) {
      handleErrors(err);
      setTitle('');
      setDirtTitle(false);
    }
  }; 
  useEffect(() => {  
    getTitle();
  }, []);

  

  return (
    <Navbar bg="primary" variant="dark" className="rounded">
      <Container fluid>
        <Row className="w-100">
          <Col className="d-flex align-items-center justify-content-start ">     
             
              {!enabledForm ? 
                              <>
                              {dirtTitle ? 
                                 <Button variant="primary" disabled>
                                 <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
                                 Loading...
                               </Button>
                                :
                                <Link to="/pages" className="navbar-brand">{title}</Link>
                              }

                              {loggedin && user.role === 'admin' &&  (
                                <Button onClick={() => setEnabledForm(true)} className="btn btn-outline-light"><i className="bi bi-pencil-square"></i></Button>
                                )}
                              </>
              :
                <TitleForm setEnabledForm={setEnabledForm} handleTitle={handleTitle} title={title}/>            

              }
          </Col>
          <Col className="d-flex justify-content-end align-self-center">
            {loggedin ? (
              <Button onClick={(() => {handleLogout().then(() =>navigate("/"))})}
               className="btn btn-outline-light">
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

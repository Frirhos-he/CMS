import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { NotFoundLayout } from './components/PageLayout';
import { LoginForm } from './components/AuthComponents';
import NavHeader from './components/NavbarComponents';
import BackOfficeLayout from './components/BackOfficeComponents';
import FrontOfficeLayout from './components/FrontOfficeComponents';
import Page from './components/PageComponent';
import PageForm from './components/PageFormComponent';
import API from './API';
import { Container, Row, Alert } from 'react-bootstrap';
import ErrorContenxt from './errorContenxt';

import './App.css';

function App() {
  const [userLogged, setUserLogged] = useState({});            //used to store infos of the logged user
  const [users, setUsers] = useState([]);                      //used to store infos about the 
  const [loggedin, setLoggedin] = useState(false); 
  const [message, setMessage] = useState('');
  
    // If an error occurs, the error message will be shown
    const handleErrors = (err) => {
      let msg = '';
      if (err.error) msg = err.error;
      else if (String(err) === "string") msg = String(err);
      else msg = "Unknown Error";
      if(!(msg ==="Not authenticated" && !loggedin))   //exclude the case I am in FrontOffice
                setMessage({msg:msg, type:"danger"});
    } 


    const handleLogin = async (credentials) => {
      try {
        const user = await API.login(credentials);
        setUserLogged(user);
        setLoggedin(true);
        if ( user?.role === 'admin') {
          const usersInfo = await API.getUsers();
          setUsers(usersInfo);
        }
        setMessage({ msg: `Welcome, ${user.username}!`, type: 'success' });
      } catch (err) {
        setUserLogged({});
        setUsers([]);
        setLoggedin(false);
        handleErrors(err);
        throw err;
      }
    };

    const handleLogout = async () => {
      try{ 
      await API.logout();
      setUserLogged({});
      setLoggedin(false);
      setUsers([]);
      setMessage({ msg: `Successfully loggedout`, type: 'success' });
      return true;
      } catch (err) {
        handleErrors(err);
        return false;
      }
    };


    useEffect(() => {
      const checkAuth = async () => {
        try {
          const userObject = await API.getUserInfo();
          setUserLogged(userObject);
          setLoggedin(true);
          if ( userObject?.role === 'admin') {
            const usersInfo = await API.getUsers();
            setUsers(usersInfo);
          }
          setMessage({msg:"You are logged in", type: 'success'})
        } catch (err) {
          handleErrors(err);
          setUserLogged({});
        }
      };
    
      checkAuth();
      },[]);
      

  return (
    <BrowserRouter>
          <ErrorContenxt.Provider value={{ handleErrors }}>
          <Routes>
            <Route
              element={
                <>
                  <NavHeader handleLogout={handleLogout} loggedin={loggedin}
                     setMessage={setMessage}
                  user={userLogged} />
                  <Container fluid className="mt-3">
                    {message && (
                      <Row>
                        <Alert variant={message.type} onClose={() => setMessage('')} dismissible>
                          {message.msg}
                        </Alert>
                      </Row>
                    )}  
                      <Outlet />            
                  </Container>
                </>
              }
            >
              <Route path="/" element={<Navigate to="/pages" replace />} />
              <Route
                path="/pages"
                element={
                  loggedin ? (
                    <BackOfficeLayout
                      user={userLogged}
                    />
                  ) : (
                    <FrontOfficeLayout/>
                  )
                }
              />
              <Route
                path="/pages/add"
                element={
                  loggedin ? (
                    <PageForm
                      users={users}
                      userLogged={userLogged}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route
                path="/pages/:pageid/preview"
                element={<Page/>}
              />
              <Route
                path="/pages/:pageid/edit"
                element={
                  loggedin ? (
                    <PageForm
                      users={users}
                      userLogged={userLogged}
                    />
                  ) : (
                    <Navigate to="/login" />
                  )
                }
              />
              <Route path="/login" element={<LoginForm login={handleLogin}/>} />
              <Route path="*" element={<NotFoundLayout />} />
            </Route>
          </Routes>
          </ErrorContenxt.Provider>
        </BrowserRouter>
      );
    }

export default App;

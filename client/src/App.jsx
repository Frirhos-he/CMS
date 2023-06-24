import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { NotFoundLayout } from './components/PageLayout';
import { LoginForm } from './components/AuthComponents';
import NavHeader from './components/NavbarComponents';
import BackOfficeLayout from './components/BackOfficeComponents';
import FrontOfficeLayout from './components/FrontOfficeComponents';
import Page from './components/PageComponent';
import PageForm from './components/PageFormComponent';
import API from './API';
import { Container, Row, Alert, Button, Spinner } from 'react-bootstrap';

import './App.css';

function App() {
  const [userLogged, setUserLogged] = useState({});
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [images, setImages] = useState([]);
  const [loggedin, setLoggedin] = useState(false); 
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [dirtyPages, setDirtyPages] = useState(false);         //used to update pages
  const [dirtyAuth, setDirtyAuth] = useState(false);           //used to update auth
  const [dirtyImage, setDirtyImage] = useState(false);         //used to update image
  const [dirtyTitle, setDirtyTitle] = useState(false);         //used to update image

    // If an error occurs, the error message will be shown in a toast.
    const handleErrors = (err) => {
      let msg = '';
      if (err.error) msg = err.error;
      else if (String(err) === "string") msg = String(err);
      else msg = "Unknown Error";
      if(msg ==="Not authorized") setLoggedin(false);
      setMessage({msg:msg, type:"danger"}); // WARN: a more complex application requires a queue of messages. In this example only last error is shown.
    } 

    const getPages = async () => {
      try {
        setDirtyPages(true);
        if(loggedin){  
          if ( userLogged?.role === 'admin') {
            const usersInfo = await API.getUsers();
            setUsers(usersInfo);
          }
              const pages = await API.getPages();
              setPages(pages);
        } else {
              const pages = await API.getPublicatedPages();
              setPages(pages)
        }
        setDirtyPages(false);
      } catch (error) {
        setPages([]);
        setUsers([]);
        handleErrors(error);
        setDirtyPages(false);
      }
    };

    useEffect(() => {
      const checkAuth = async () => {
        try {
          setDirtyAuth(true);
          const userObject = await API.getUserInfo();
          setUserLogged(userObject);
          setLoggedin(true);
          setMessage({msg:"You are logged in", type: 'success'})
          setDirtyAuth(false);
        } catch (err) {
          handleErrors(err);
          setUserLogged({});
          setDirtyAuth(false);
        }
      };
    
      checkAuth();
      },[]);
      

  useEffect(() => {
      getPages();  //also when loggedin must add []
  },[loggedin])

    useEffect(() => {
      const getImages = async () => {
        try{
          setDirtyImage(true);
            const images = await API.getImages();
            setImages(images);
            setDirtyImage(false);
            } catch (err) {
            handleErrors(err);
            setDirtyImage(false);
        }
      };
      getImages();
    },[]);

    useEffect(() => {
    const getTitle = async () => {
      try {
        setDirtyTitle(true);
        const titleRes = await API.getTitle();  // title, not the object
        setTitle(titleRes)
        setDirtyTitle(false);
      } catch (err) {
        handleErrors(err);
        setTitle('');
        setDirtyTitle(false);
      }
    };   
    getTitle();
  }, []);


  const handleLogin = async (credentials) => {
    try {
      const user = await API.login(credentials);
      setUserLogged(user);
      setLoggedin(true);
      setMessage({ msg: `Welcome, ${user.username}!`, type: 'success' });
      return true;
    } catch (err) {
      setUserLogged({});
      setUsers([]);
      setLoggedin(false);
      setMessage({msg: "Wrong username/ password", type: 'danger'});
      throw err;
    }
  };

  const handleLogout = async () => {
    try{ 
    await API.logout();
    setUserLogged({});
    setUsers([]);
    setPages([])
    setLoggedin(false);
    setMessage({ msg: `Successfully loggedout`, type: 'success' })
    } catch (err) {
      handleErrors(err);
    }
  };

  const handleDeletePage = async (pageid) => {
    try{
    await API.deletePage(pageid);
    await getPages();
    } catch (err) {
      handleErrors(err);
    }
  };

  const addPage = async (page) => {
    try{
    await API.addPage(page);
    await getPages();
    return true;
    } catch (err) {
      throw err;
    }
  };

  const updatePage = async (pageid, page) => {
    try{
    await API.updatePage(pageid, page);
    await getPages();
    return true;
    } catch (err) {
      throw err;
    }
  };

  const handleTitle = async (skrachTitle) => {
    try {
      const titleUpdate = await API.updateTitle(skrachTitle);
      setTitle(titleUpdate)
      setMessage({ msg: `Title successfully changed`, type: 'success' });
    } catch (err) {
      handleErrors(err);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <>
              <NavHeader handleLogout={handleLogout} loggedin={loggedin} title={title} handleTitle={handleTitle} user={userLogged} />
              <Container fluid className="mt-3">
                {message && (
                  <Row>
                    <Alert variant={message.type} onClose={() => setMessage('')} dismissible>
                      {message.msg}
                    </Alert>
                  </Row>
                )}
                {!dirtyAuth && !dirtyImage && !dirtyPages && !dirtyTitle  ?  
                  <Outlet /> :         
                  
                  <Button variant="primary" disabled>
                  <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
                  Loading...
                </Button>
                }
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
                  pages={pages}
                  user={userLogged}
                  handleDeletePage={handleDeletePage}
                />
              ) : (
                <FrontOfficeLayout pages={pages} />
              )
            }
          />
          <Route
            path="/pages/add"
            element={
              loggedin ? (
                <PageForm
                  images={images}
                  role={userLogged?.role}
                  users={users}
                  userLogged={userLogged}
                  addPage={addPage}
                  handleErrors={handleErrors}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/pages/:pageid/preview"
            element={<Page handleErrors={handleErrors}  />}
          />
          <Route
            path="/pages/:pageid/edit"
            element={
              loggedin ? (
                <PageForm
                  pages={pages}
                  images={images}
                  role={userLogged?.role}
                  users={users}
                  userLogged={userLogged}
                  updatePage={updatePage}
                  handleErrors={handleErrors}
                />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route path="/login" element={<LoginForm login={handleLogin} handleErrors={handleErrors}/>} />
          <Route path="*" element={<NotFoundLayout />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

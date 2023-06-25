import { React, useState, useEffect, useContext } from 'react';
import { Row, Col, Table, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import API from '../API';
import ErrorContenxt from '../errorContenxt';

function BackOfficeLayout(props) {
  const { user } = props;
  const [loadingPages, setLoadingPages] = useState(false);         //used to update pages
  const [pages, setPages] = useState([]);                      //used to store infos of the pages available to the current 
  const {handleErrors} = useContext(ErrorContenxt);

  const getPages = async () => {
    try {
      setLoadingPages(true);
      if(user){  
            const pages = await API.getPages();
            const sortedPages = [...pages].sort(sortByPublicationDate);
            setPages(sortedPages);
      } else {
        setPages();
      }
    } catch (error) {
      setPages([]);
      handleErrors(error);
    }
    finally {
      setLoadingPages(false);
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

    useEffect(() => {
        getPages(); 
    },[user])


  return (
    <>
      <Row>
        <Col>
          <h1>Welcome to BackOfficeLayout!</h1>
          <p className="lead">We have {pages.length} pages.</p>
        </Col>
      </Row>
      {!loadingPages ? 
            <>
            <Row>
              <PageTable pages={pages} handleDeletePage={handleDeletePage} user={user} />
            </Row>
            <Row className="mt-4">
              <Col xs={{ offset: 10 }}>
                <Link className="btn btn-success px-3 py-2" to="./add">
                  <i className="bi bi-plus-circle-fill"></i>
                </Link>
              </Col>
            </Row>
            </>
            :
            <Button variant="primary" disabled>
            <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
            Loading...
          </Button>
      }
    </>
  );
}

function PageTable(props) {
  const { pages, handleDeletePage, user } = props;

  return (
    <Table striped>
      <thead>
        <tr>
          <th>Title</th>
          <th>Author</th>
          <th>Creation Date</th>
          <th>Publication Date</th>
          <th>Status</th>
          <th>Edit</th>
        </tr>
      </thead>
      <tbody>
        {pages.map((page) => (
          <PageRow page={page} key={page.id} user={user} handleDeletePage={handleDeletePage} />
        ))}
      </tbody>
    </Table>
  );
}

function PageRow(props) {
  const { page, handleDeletePage, user } = props;
  const status = getPageStatus(page.publicationDate);

  const enableChangesDelete = (page) => {

    if (page.authorid === user.id) return true;
    if (user.role === 'admin') return true;
    return false;
  };

  return (
    <tr>
      <td>{page.title}</td>
      <td>{page.author}</td>
      <td>{page.creationDate}</td>
      <td>{page.publicationDate}</td>
      <td>{status}</td>
      <td>
        {enableChangesDelete(page) && (
          <>
            <Link className="btn btn-primary" to={`/pages/${page.id}/edit`}  state={serializePage(page)}>
              <i className="bi bi-pencil-square"></i>
            </Link>
            &nbsp;
            <Button variant="danger" onClick={() => handleDeletePage(page.id)}>
              <i className="bi bi-trash" />
            </Button>
            &nbsp;
          </>
        )}
        <Link className="btn btn-success" to={`/pages/${page.id}/preview`}>
          <i className="bi bi-arrows-fullscreen"></i>
        </Link>
      </td>
    </tr>
  );
}
const sortByPublicationDate = (pageA, pageB) => {
  const dateA = dayjs(pageA.publicationDate);
  const dateB = dayjs(pageB.publicationDate);

  // Handle the case where publicationDate is an empty string
  if (dateA.isValid() && !dateB.isValid()) {
    return -1;
  } else if (!dateA.isValid() && dateB.isValid()) {
    return 1;
  }

  if (dateA.isBefore(dateB)) {
    return -1;
  } else if (dateA.isAfter(dateB)) {
    return 1;
  }

  return 0;
};
const getPageStatus = (publicationDate) => {
  if (!publicationDate) {
    return 'Draft';
  }

  const currentDate = dayjs().format('YYYY-MM-DD');

  if (currentDate < publicationDate) {
    return 'Scheduled';
  } else {
    return 'Published';
  }
};

function serializePage(page) { //because it is an object that contains vector! (remember that vector and object cannot be used in raw by useLocation)
  const serializedPage = JSON.stringify(page)
  return serializedPage;
}

export default BackOfficeLayout;

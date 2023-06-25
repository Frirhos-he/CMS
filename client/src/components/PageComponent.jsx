import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Image, Row, Col, Button, Spinner } from 'react-bootstrap';
import API from '../API';
import ErrorContenxt from '../errorContenxt';

function Page(props) {

  const { pageid } = useParams();
  const handleErrors = useContext(ErrorContenxt);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);

  const getPage = async (pid) => {
    try{
    setLoading(true)
    const page = await API.getPageById(pid);
    setContents(page.contents);
    setLoading(false)
    }catch(err){
      handleErrors(err);
    }
  };

  useEffect(() => {
    getPage(pageid);
  }, []);

  return (
    <Container fluid>
      { !loading ? 
      <Row className="justify-content-center">
        {contents.map((block) => {
          if (block.type === 'header') {
            return <h1 key={block.id}>{block.text}</h1>;
          } else if (block.type === 'paragraph') {
            return <p key={block.id}>{block.text}</p>;
          } else if (block.type === 'image') {
            return (
              <Image
                key={block.id}
                src={`../../public/media/${block.text}`}
                style={{ maxWidth: '25%', maxHeight: '25%' }}
                alt={block.text}
              />
            );
          }
          return null;
        })}
      </Row>
      : <Button variant="primary" disabled>
            <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
            Loading...
          </Button>
      }
      <Row className="mt-4">
        <Col md={{ offset: 10 }}>
          <Link to="/pages" className="btn btn-danger">
            Go back
          </Link>
        </Col>
      </Row>
    </Container>
  );
}

export default Page;

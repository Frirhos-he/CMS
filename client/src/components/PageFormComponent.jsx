import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { Form, Button, Table, Row, Col, Spinner} from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ContentForm } from './ContentFormComponent';
import API from '../API';

function PageForm(props) {
  const { pageid } = useParams();
  const { images, users, role, userLogged, updatePage, addPage, handleErrors } = props;
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [authorID, setAuthorID] = useState(userLogged.id);
  const [creationDate, setCreationDate] = useState(dayjs()); 
  const [publicationDate, setPublicationDate] = useState('');
  const [contents, setContents] = useState([]);
  const [observeContentForm, setObserveContentForm] = useState(false);
  const [editContent, setEditContent] = useState({});
  const [editPage, setEditPage] = useState(false);
  const [lastPosition, setLastPosition] = useState(0);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const getPage = async () => {
      try {
        setLoading(true);
        const page = await API.getPageById(pageid);
        setCreationDate(page.creationDate);
        setPublicationDate(page.publicationDate);
        setContents(page.contents);
        setAuthorID(page.authorid);
        setTitle(page.title);
        setEditPage(true);
        
        const maxPosition = page.contents.reduce((max, content) => {
          return content.position > max ? content.position : max;
        }, 0);
        
        setLastPosition(maxPosition);
        setLoading(false);
      } catch (error) {
        handleErrors(error)
        setLoading(false);
      }
    };

    if (pageid) {
      getPage();
    }
  }, [pageid]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    let result = false;
    const formattedPublicationDate = publicationDate ? dayjs(publicationDate) : publicationDate;
  
    const page = {
      title: title,
      authorid: authorID,
      creationDate: creationDate,
      publicationDate: formattedPublicationDate,
      contents: contents,
    };
  
    try {
      if (!editPage) {
        result = await addPage(page);
      } else {
        result = await updatePage(pageid, page);
      }
      if (result) {
        navigate('/');
        setEditPage(false);
        setPublicationDate("");
        setContents([]);
        setAuthorID("");
        setTitle("");
      }
    } catch (error) {
      handleErrors(error);
    }
  };
  

  const handleDeleteContent = (id) => {
    const elementToDelete = contents.find((content) => content.id === id);
    const positionToFix = elementToDelete.position;
    const updatedContents = contents.filter((content) => content.id !== id).map((content) => {
      const { id, position } = content;
      return {
        ...content,
        id: id > id ? id - 1 : id,
        position: position > positionToFix ? position - 1 : position,
      };
    });
    setContents(updatedContents);
  };

  const handleArrowUp = (id) => {
    const positionToFix = contents.find((content) => content.id === id).position;

    if (positionToFix === 1) return;

    const updatedContents = contents.map((content) => {
      if (content.id === id) {
        return { ...content, position: content.position - 1 };
      } else if (content.position === positionToFix - 1) {
        return { ...content, position: content.position + 1 };
      }
      return content;
    });
    setContents(updatedContents);
  };

  const handleArrowDown = (id) => {
    const positionToFix = contents.find((content) => content.id === id).position;
    const maxPosition = Math.max(...contents.map((con) => con.position));

    if (positionToFix === maxPosition) return;

    const updatedContents = contents.map((content) => {
      if (content.id === id) {
        return { ...content, position: content.position + 1 };
      } else if (content.position === positionToFix + 1) {
        return { ...content, position: content.position - 1 };
      }
      return content;
    });

    setContents(updatedContents);
  };

  const checkConditions = () => {
    let header = false;
    let imageOrParagraph = false;

    for (let i = 0; i < contents.length; i++) {
      const content = contents[i];
      if (content.type === 'header') {
        header = true;
      } else if (content.type === 'image' || content.type === 'paragraph') {
        imageOrParagraph = true;
      }
    }

    return header && imageOrParagraph;
  };

  const setNewContent = (contentObject) => {
    const newContents = [...contents, contentObject];
    setContents(newContents);
    setLastPosition((lastPosition) => lastPosition + 1);
  };

  const updateContent = (contentObject) => {
    const updatedContents = [...contents].map(content => {
      if (content.id === contentObject.id) {
        return contentObject; // Replace element with specific ID
      }
      return content; // Keep other elements unchanged
    });
    setContents(updatedContents);
    setEditContent({});
  }


  return (
    <>
    {loading ?   
    <Button variant="primary" disabled>
        <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true"/>
            Loading...
    </Button> :
            <>
                <Form onSubmit={handleSubmit} >
                  <Row>
                    <Col xs={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                          type="text"
                          minLength={2}
                          required={true}
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Publication Date</Form.Label>
                        <Form.Control
                          type="date"
                          value={publicationDate}
                          required={false}
                          onChange={(event) => setPublicationDate(event.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  {role === 'admin' && users && (
                    <Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Author</Form.Label>
                        <Form.Control
                          as="select"
                          required
                          value={authorID}
                          onChange={(event) => setAuthorID(event.target.value)}
                        >
                          <option value="">Open this select menu</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.username}
                            </option>
                          ))}
                        </Form.Control>
                      </Form.Group>
                    </Row>
                  )}
                  <Row>
                    <Col xs={{ offset: 4, span: 2 }}>
                      <Button
                        className="btn btn-success"
                        disabled={!checkConditions()}
                        type="submit"
                      >
                        Submit
                      </Button>
                    </Col>
                    <Col xs={{ span: 2 }}>
                      <Link to="/pages" relative="path" className="btn btn-danger">
                        Cancel
                      </Link>
                    </Col>
                  </Row>
                </Form>

                <ContentTable
                  contents={contents}
                  handleDeleteContent={handleDeleteContent}
                  handleArrowDown={handleArrowDown}
                  handleArrowUp={handleArrowUp}
                  observeContentForm={observeContentForm}
                  setObserveContentForm={setObserveContentForm}
                  setEditContent={setEditContent}
                />
                      {observeContentForm ? (
                        <ContentForm
                          pageid={pageid}
                          images={images}
                          setObserveContentForm={setObserveContentForm}
                          setNewContent={setNewContent}
                          lastId={contents.length ? Math.max(...contents.map((con) => con.id)) : 0} // it won't be used for the db just for frontend and handlingArrow
                          lastPosition={lastPosition}
                          editContent={editContent}
                          updateContent={updateContent}
                          
                        />
                      ) : (
                        <Button
                          className="btn btn-success"
                          onClick={() => {
                            setObserveContentForm(true);
                          }}
                        >
                          <i className="bi bi-plus-circle-fill"></i>
                        </Button>
                      )}
            </>
        }
    </>
  );
}

function ContentTable(props) {
  const contents = props.contents;
  const handleDeleteContent = props.handleDeleteContent;
  const handleArrowDown = props.handleArrowDown;
  const handleArrowUp = props.handleArrowUp;
  const observeContentForm = props.observeContentForm;
  const setObserveContentForm = props.setObserveContentForm;
  const setEditContent= props.setEditContent;

  return (
    <Table striped>
      <thead>
        <tr>
          <th>Type</th>
          <th>Text | URL </th>
          <th>Edit</th>
        </tr>
      </thead>
      <tbody>
        {contents
          .sort((a, b) => a.position - b.position)
          .map((content) => (
            <ContentRow
              content={content}
              key={content.id}
              handleDeleteContent={handleDeleteContent}
              handleArrowDown={handleArrowDown}
              handleArrowUp={handleArrowUp}
              observeContentForm={observeContentForm}
              setObserveContentForm={setObserveContentForm}
              setEditContent={setEditContent}
            />
          ))}
      </tbody>
    </Table>
  );
}

function ContentRow(props) {
  const contentRow = props.content;
  const handleDeleteContent = props.handleDeleteContent;
  const handleArrowDown = props.handleArrowDown;
  const handleArrowUp = props.handleArrowUp;
  const observeContentForm = props.observeContentForm;
  const setObserveContentForm = props.setObserveContentForm;
  const setEditContent = props.setEditContent;

  return (
    <tr>
      <td>{contentRow.type}</td>
      <td>{contentRow.text}</td>
      <td>
        <Button size="sm" variant="danger" onClick={() => handleDeleteContent(contentRow.id)}>
          <i className="bi bi-trash" />
        </Button>
        &nbsp;
        <Button size="sm" onClick={() => handleArrowUp(contentRow.id)}>
          <i className="bi bi-arrow-up" />
        </Button>
        &nbsp;
        <Button size="sm" onClick={() => handleArrowDown(contentRow.id)}>
          <i className="bi bi-arrow-down" />
        </Button>
        &nbsp;
        <Button size="sm"onClick={() => {setObserveContentForm(true);setEditContent(contentRow);}} disabled={observeContentForm}>
              <i className="bi bi-pencil-square"></i>
        </Button>
        &nbsp;
      </td>
    </tr>
  );
}

export default PageForm;

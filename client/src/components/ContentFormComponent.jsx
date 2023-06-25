import { useState } from 'react';
import { Form, Button, Row, Col, } from 'react-bootstrap';

function ContentForm(props) {
  const pageid = props.pageid 
  const images = props.images;
  const lastId = props.lastId;
  const lastPosition = props.lastPosition;
  const editContent = props.editContent;

  const [contentType, setContentType] = useState(Object.keys(editContent).length !== 0 ? editContent.type : 'header');
  const [text, setText] = useState(Object.keys(editContent).length !== 0 ? editContent.text : '');

  const handleSubmit = (event) => {
    event.preventDefault();


    if (Object.keys(editContent).length !== 0) { //update
      const updatedContent = { ...editContent };
      updatedContent.text = text;
      props.updateContent(updatedContent);
      
    }else { //new element
      const newPosition = lastPosition +1; 
      const newId = lastId+1;   // it won't be used for the db just for frontend and handlingArrow
      const contentObject = {
        id:   newId,
        pageid: pageid ? Number(pageid) : '',
        type: contentType,
        text: text,
        position: newPosition
      };
      // Call the parent form's callback function with the contentObject
      props.setNewContent(contentObject);

    }

    // Reset the form fields
    setContentType('header');
    setText('');
    props.setObserveContentForm(false);

  };

  return (
    <Form onSubmit={handleSubmit}>
       <Row>
        <Col>
      <Form.Group className='mb-3'>
        <Form.Label>Content Type</Form.Label>
        <Form.Control as='select' required value={contentType} onChange={(event) => setContentType(event.target.value)} disabled={Object.keys(editContent).length !== 0}>
          <option value='header'>Header</option>
          <option value='paragraph'>Paragraph</option>
          <option value='image'>Image</option>
        </Form.Control>
      </Form.Group>
      </Col>
      <Col>
      {(contentType === 'header' || contentType === 'paragraph') && <Form.Label>Text</Form.Label>}
      {contentType === 'image' && <Form.Label>Select an Image</Form.Label>}
      {contentType === 'image' ? (
        <Form.Control as='select' required value={text} onChange={(event) => setText(event.target.value)}>
          <option value=''>Open this select menu</option>
          {images.map((image) => (<option key={image.id} value={image.path}>{image.name}</option>))}
        </Form.Control>
      ) : (
        <Form.Control type='text' required value={text} onChange={(event) => setText(event.target.value)} />
      )}
      </Col>
      </Row>

      <Button variant='primary' type='submit' disabled={!contentType}>
        Create
      </Button>
    </Form>
  );
}

export {ContentForm};
import React from 'react';
import {Row, Col, Button, Form } from 'react-bootstrap';
import { useState } from 'react';

function TitleForm(props) {

    const { handleTitle, setEnabledForm, title} = props;
    const [skrachTitle, setSkrachTitle] = useState(title);        //used to store the draft title


    const handleSubmit = (event) => {
        event.preventDefault();
        handleTitle(skrachTitle);
      };


      return (
        <Form onSubmit={handleSubmit}>
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
                   <Button className="btn btn-danger" onClick={() => setEnabledForm(false)}>
                     Cancel
                   </Button>
                 </Col>
           </Row>
      </Form>
      )
}

export {TitleForm};
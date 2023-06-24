import React from 'react';
import { Row, Col, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

function FrontOfficeLayout(props) {
  const sortedPages = [...props.pages].sort(sortByPublicationDate);

  const filteredPages = sortedPages.filter((page) => {
    const pageStatus = getPageStatus(page.publicationDate);
    return pageStatus === 'Published';
  });

  return (
    <>
      <Row>
        <Col>
          <h1>Welcome to FrontOfficeLayout!</h1>
          <p className="lead">We have {filteredPages.length} published pages.</p>
        </Col>
      </Row>
      <Row>
        <PageTable pages={filteredPages} />
      </Row>
    </>
  );
}

function PageTable(props) {
  const { pages } = props;

  return (
    <Table striped>
      <thead>
        <tr>
          <th>Title</th>
          <th>Author</th>
          <th>Creation Date</th>
          <th>Publication Date</th>
          <th>Status</th>
          <th>Page preview</th>
        </tr>
      </thead>
      <tbody>
        {pages.map((page) => (
          <PageRow page={page} key={page.id} />
        ))}
      </tbody>
    </Table>
  );
}

function PageRow(props) {
  const status = getPageStatus(props.page.publicationDate);

  return (
    <tr>
      <td>{props.page.title}</td>
      <td>{props.page.author}</td>
      <td>{props.page.creationDate}</td>
      <td>{props.page.publicationDate}</td>
      <td>{status}</td>
      <td>
        <Link to={`/pages/${props.page.id}/preview`} className="btn btn-success" role="button">
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

export default FrontOfficeLayout;

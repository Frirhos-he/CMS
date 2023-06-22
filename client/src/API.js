'use strict';

import dayjs from 'dayjs';

const SERVER_URL = 'http://localhost:3001/api';

// USER APIs

const login = async (credentials) => {
  try {
    const response = await fetch(SERVER_URL + '/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      const user = await response.json();
      return user;
    } else {
      const errMessage = await response.json();  // {error:}
      throw errMessage;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};

const getUserInfo = async () => {
  try {
    const response = await fetch(SERVER_URL + '/sessions/current', {
      credentials: 'include',
    });

    if (response.ok) {
      const user = await response.json();
      return user;
    } else {
      const errMessage = await response.json();
      throw errMessage;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};

const getUsers = async () => {
  try {
    const response = await fetch(SERVER_URL + '/users',{
      credentials: 'include',
    });

    if (response.ok) {
      const users = await response.json();
      return users;
    } else {
      const errMessage = await response.json();
      throw errMessage;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};

const logout = async () => {
  try{
    const response = await fetch(SERVER_URL + '/sessions/current', {
      method: 'DELETE',
      credentials: 'include',
    });

    if (response.ok) {
      return null;
    } else {
      const errMessage = await response.json();
      throw errMessage;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};

// PAGES APIs

const getPages = async () => {
  try {
    const response = await fetch(SERVER_URL + '/pages');

    if (response.ok) {
      const pagesJson = await response.json();

      return pagesJson.map((p) => {
        const clientPage = {
          id: p.id,
          title: p.title,
          authorid: p.uid,
          author: p.username,
          creationDate: p.creationDate,
          publicationDate: p.publicationDate,
        };
        return clientPage;
      });
    } else {
      const errMessage = await response.json();
      throw errMessage;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};


const getPageByIdAndContents = async (id) => {
  try{
    const response = await fetch(SERVER_URL + `/pages/${id}`);

    if (response.ok) {
      const page = await response.json();
      // Order the contents array based on the position property
      const orderedContentsByPosition = page.contents.sort((a, b) => a.position - b.position);

      // Update the contents property with the ordered array
      page.contents = orderedContentsByPosition;

      return page;
    } else {
      const errMessage = await response.json();
      throw errMessage;
    }
}catch (error) {
  if (error.hasOwnProperty('error')) {
    throw error;
  } else {
    throw { error: "Cannot parse server response" }
  }
}
};

const updatePage = async (pageid, page) => {
  try {
    
  const response = await fetch(SERVER_URL + '/pages/' + pageid, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      id: pageid,
      title: page.title,
      authorid: page.authorid,
      creationDate: dayjs(page.creationDate).format('YYYY-MM-DD'),
      publicationDate: page.publicationDate ? dayjs(page.publicationDate).format('YYYY-MM-DD') : '',
      contents: page.contents,
    }),
  });

    if (!response.ok) {
      const errMessage = await response.json();
      throw errMessage;
    } else {
      return null;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};

const addPage = async (page) => {
  try {
  const response = await fetch(SERVER_URL + '/pages/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      title: page.title,
      authorid: page.authorid,
      creationDate: dayjs(page.creationDate).format('YYYY-MM-DD'),
      publicationDate: page.publicationDate.trim() !== '' ? dayjs(page.publicationDate).format('YYYY-MM-DD') : '',
      contents: page.contents,
    }),
  });

  if (!response.ok) {
    const errMessage = await response.json();
    throw errMessage;
  } else if (response.ok) {
    // the server always returns a JSON, even empty {}. Never null or non-json, otherwise the method will fail
    const pageAdded = await response.json();
    return pageAdded;
  }
} catch (error) {
  if (error.hasOwnProperty('error')) {
    throw error;
  } else {
    throw { error: "Cannot parse server response" }
  }
}
};

const deletePage = async (pageid) => {
  try{
  const response = await fetch(SERVER_URL + `/pages/${pageid}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const errMessage = await response.json();
    throw errMessage;
  } else if (response.ok) {
    const pageRemovedStatus = await response.json();
    return pageRemovedStatus;
  }
}catch (error) {
  if (error.hasOwnProperty('error')) {
    throw error;
  } else {
    throw { error: "Cannot parse server response" }
  }
}
};

const getImages = async () => {
  try {
    const response = await fetch(SERVER_URL + '/images');

    if (response.ok) {
      const imagesJson = await response.json();
      return imagesJson;
    } else {
      const errMessage = await response.json();
      throw errMessage;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};


// TITLE APIs

const getTitle = async () => {
  try {
    const response = await fetch(SERVER_URL + '/titles');

    if (response.ok) {
      const titleJSON = await response.json();
      return titleJSON.title;
    } else {
      const errMessage = await response.json();
      throw errMessage;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};


const updateTitle = async (title) => {
  try {

  const response = await fetch(SERVER_URL + '/titles' , {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      title: title,
    })
  });

    if (!response.ok) {

      const errMessage = await response.json();
      throw errMessage;
    } else {

      const titleObject = await response.json();
      return titleObject.title;
    }
  } catch (error) {
    if (error.hasOwnProperty('error')) {
      throw error;
    } else {
      throw { error: "Cannot parse server response" }
    }
  }
};

const API = {
  login,
  logout,
  getUserInfo,
  updatePage,
  getPages,
  getPageByIdAndContents,
  addPage,
  getUsers,
  deletePage,
  getImages,
  getTitle,
  updateTitle
};

export default API;

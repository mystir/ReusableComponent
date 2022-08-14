/* eslint-disable linebreak-style */
/* eslint-disable max-len */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */

import {openDB} from 'idb';

class CommentStore {
  constructor(init={}) {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }

    this.database = this.connectDB();

    const self = this;
    this.subscribers = [];

    this.database.then(async (db) => {
      // Make the database reusable from within the store
      this.db = db;

      const tx = db.transaction(['comments'], 'readwrite');
      const store = tx.objectStore('comments');

      return store.count();
    }).then((count) => {
      if (count > 0) {
        this.set('recordcount', count);
      }
    });

    this.state = new Proxy(init, {
      set(state, key, value) {
        state[key] = value;

        self.subscribers.forEach((subscriber) => subscriber(state));

        // Return true to indicate that the set was successful.
        return true;
      },
    });
  }

  subscribe(cb) {
    if (typeof cb !== 'function') {
      throw new Error('You must subscribe with a function');
    }

    // Add the callback to the list of subscribers
    this.subscribers.push(cb);

    cb(this.state);
  }

  // Provide a way to set a specific value from the state
  set(key, value) {
    this.state[key] = value;
  }

  // Provide a way to get a specific value from the state
  get(key) {
    return this.state[key];
  }

  connectDB() {
    return openDB('CommentsDB', 1, {upgrade(db) {
      if (!db.objectStoreNames.contains('comments')) {
        console.log('Making Comments Table...');

        const commentsTable = db.createObjectStore('comments', {keyPath: 'id', autoIncrement: true});
        commentsTable.createIndex('name', 'name', {unique: false});
        commentsTable.createIndex('email', 'email', {unique: false});
        commentsTable.createIndex('comment', 'comment', {unique: false});
        commentsTable.createIndex('time', 'time', {unique: false});
      }
    }});
  }

  addNewComment(form) {
    this.database.then(function(db) {
      const tx = db.transaction(['comments'], 'readwrite');
      const store = tx.objectStore('comments');
      const item = {
        name: form.formName.value,
        email: form.formEmail.value,
        comment: form.formComment.value,
        time: new Date(),
      };

      store.add(item);

      return store.count();
    }).then((count) => {
      console.log('Comment Added Successfully');
      this.set('recordcount', Math.max(0, count));
    });
  }

  deleteComment(id) {
    this.database.then((db) => {
      const tx = db.transaction(['comments'], 'readwrite');
      const store = tx.objectStore('comments');
      store.delete(id);

      return store.count();
    }).then((count) => {
      console.log('Comment deleted.');
      this.set('recordcount', Math.max(0, count));
    });
  }

  filterChangedTo(text) {
    this.set('filter', text);
  }
}

// --------------------------------------------------------------------

const commentStore = new CommentStore({recordcount: 0, filter: ''});


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form');
  const filter = document.getElementById('filterBy');

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    commentStore.addNewComment(form);
  });

  filter.addEventListener('input', (e) => {
    commentStore.filterChangedTo(e.target.value);
  });
});


// --------------------------------------------------------------------


class CommentSystem extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">
        `;

    const template = document.getElementById('template-comment-system');
    const node = document.importNode(template.content, true);
    shadow.append(node);

    this.comments = this.shadowRoot.querySelector('#allComments');
  }

  // Observe comment attribute for changes
  static get observedAttributes() {
    return ['recordcount', 'filter'];
  }

  connectedCallback() {
    commentStore.subscribe((state) => {
      this.setAttribute('recordcount', state.recordcount);
      this.setAttribute('filter', state.filter);
    });
  }

  // Change record count when attribute changes
  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (this.comments) {
      if (property === 'recordcount' || newValue == '') {
        // console.log('Total Records:', newValue);
        commentStore.database.then(function(db) {
          const tx = db.transaction(['comments'], 'readonly');
          const store = tx.objectStore('comments');

          return store.getAll();
        }).then((allRecords)=> {
          this.comments.textContent = '';

          allRecords.forEach((elm) => {
            this.listComment(elm);
          });
        });
      }

      if (property === 'filter' && newValue != '') {
        const options = document.getElementById('filterOptions');

        commentStore.database.then(function(db) {
          const tx = db.transaction(['comments'], 'readonly');
          const store = tx.objectStore('comments');

          return store.getAll();
        }).then((allRecords)=> {
          this.comments.textContent = '';

          allRecords.forEach((elm) => {
            if (options.value != 'Comment Length') {
              let filterChoice;
              switch (options.value) {
                case 'Author Name':
                  filterChoice = elm.name;
                  break;
                case 'Email Address':
                  filterChoice = elm.email;
                  break;
                default:
                  break;
              }

              if (filterChoice.toLowerCase().includes(newValue.toLowerCase())) {
                this.listComment(elm);
              }
            } else {
              if (elm.comment.length <= Number(newValue)) {
                this.listComment(elm);
              }
            }
          });
        });
      }
    }
  }

  listComment(elm) {
    const newCommentComponent = document.createElement('reusable-comment-component');
    newCommentComponent.setAttribute('id', elm.id);
    newCommentComponent.setAttribute('name', elm.name);
    newCommentComponent.setAttribute('email', elm.email);
    newCommentComponent.setAttribute('comment', elm.comment);
    newCommentComponent.setAttribute('time', elm.time);

    this.comments.prepend(newCommentComponent);
  }
}


// --------------------------------------------------------------------

class ReusableCommentComponent extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">
        `;
  }

  connectedCallback() {
    const template = document.getElementById('template-reusable-comment-component');
    const node = document.importNode(template.content, true);
    this.shadowRoot.appendChild(node);

    const name = this.shadowRoot.getElementById('name');
    name.textContent = this.getAttribute('name');

    const email = this.shadowRoot.getElementById('email');
    email.textContent = this.getAttribute('email');

    const comment = this.shadowRoot.getElementById('comment');
    comment.textContent = this.getAttribute('comment');

    const time = this.shadowRoot.getElementById('time');
    time.textContent = this.getAttribute('time');

    const closeBtn = this.shadowRoot.getElementById('closeBtn');

    closeBtn.addEventListener('click', () => {
      commentStore.deleteComment(Number(this.getAttribute('id')));
    });
  }
}

// --------------------------------------------------------------------


if (customElements.get('reusable-comment-component') === undefined) {
  customElements.define('reusable-comment-component', ReusableCommentComponent);
}

if (customElements.get('comment-system') === undefined) {
  customElements.define('comment-system', CommentSystem);
}


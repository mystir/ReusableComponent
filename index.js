/* eslint-disable max-len */
/* eslint-disable linebreak-style */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */

class CommentStore {
  constructor(init={}) {
    const self = this;
    this.subscribers = [];

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

  addNewComment(form) {
    this.set('comments', JSON.stringify({
      name: form.formName.value,
      email: form.formEmail.value,
      comment: form.formComment.value,
    }));

    return false;
  }
}

// --------------------------------------------------------------------

const commentStore = new CommentStore({'comments': JSON.stringify({
  name: '',
  email: '',
  comment: '',
})});

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
    return ['comments'];
  }

  connectedCallback() {
    commentStore.subscribe((state) => {
      this.setAttribute('comments', state.comments);
    });
  }

  // Change counter when number attribute changes
  attributeChangedCallback(property, oldValue, newValue) {
    newValue = JSON.parse(newValue);

    if (oldValue === newValue || newValue.name === '') return;
    if (property === 'comments' && this.comments) {
      const newCommentComponent = document.createElement('reusable-comment-component');
      newCommentComponent.setAttribute('name', newValue.name);
      newCommentComponent.setAttribute('email', newValue.email);
      newCommentComponent.setAttribute('comment', newValue.comment);
      const today = new Date();
      newCommentComponent.setAttribute('time', today);

      this.comments.prepend(newCommentComponent);
    }
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
  }
}

// --------------------------------------------------------------------


customElements.define('reusable-comment-component', ReusableCommentComponent);
customElements.define('comment-system', CommentSystem);

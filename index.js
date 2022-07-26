/* eslint-disable linebreak-style */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */

class ReusableCommentComponent extends HTMLElement {
    constructor() {
        // Always call super first in constructor
        super();            
        this.attachShadow({mode: 'open'});        
    }

    connectedCallback() {        
        const template = document.getElementById('my-template');
        const node = document.importNode(template.content, true);
        this.shadowRoot.appendChild(node);   
        
        const name = this.shadowRoot.getElementById('name');       
        name.textContent = this.getAttribute('name'); 

        const email = this.shadowRoot.getElementById('email');       
        email.textContent = this.getAttribute('email'); 

        const comment = this.shadowRoot.getElementById('comment');       
        comment.textContent = this.getAttribute('comment'); 
    }
}


customElements.define('reusable-comment-component', ReusableCommentComponent);
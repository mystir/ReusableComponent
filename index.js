/* eslint-disable linebreak-style */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */


class ReusableCommentComponent extends HTMLElement {
    constructor() {
        // Always call super first in constructor
        super();            
        let shadow = this.attachShadow({mode: 'open'});     
        shadow.innerHTML = `
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">
        `;   
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

        const time = this.shadowRoot.getElementById('time');       
        time.textContent = this.getAttribute('time'); 
    }
}


customElements.define('reusable-comment-component', ReusableCommentComponent);

function validateForm(form){
    const newCommentComponent = document.createElement("reusable-comment-component");     

    newCommentComponent.setAttribute('name', form.formName.value);             
    newCommentComponent.setAttribute('email', form.formEmail.value);           
    newCommentComponent.setAttribute('comment', form.formComment.value);

    let today = new Date();
    newCommentComponent.setAttribute('time', today);

    document.body.querySelector(".container-fluid").append(newCommentComponent);

    return false;
} 
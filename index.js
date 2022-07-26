/* eslint-disable linebreak-style */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */


// class ReusableCommentComponent extends HTMLElement {
//     constructor() {
//         // Always call super first in constructor
//         super();
//     }

//     static get observedAttributes() {
//         return ['open'];
//     }

//     attributeChangedCallback(attrName, oldValue, newValue) {
//         if (newValue !== oldValue) {
//             this[attrName] = this.hasAttribute(attrName);
//         }
//     }

//     connectedCallback() {
//         // this.innerHTML = `<h1>Best Bread!</h1>`;
//         const template = document.getElementById('reusable-comment-component');
//         const node = document.importNode(template.content, true);
//         this.appendChild(node);
//     }

//     get open() {
//         return this.hasAttribute('open');
//     }
  
//     set open(isOpen) {
//         if (isOpen) {
//             this.setAttribute('open', true);
//         } else {
//             this.removeAttribute('open');
//         }
//     }
// }


class ReusableCommentComponent extends HTMLElement {
    connectedCallback() {
        this.innerHTML = 
        `
        <form>
            <label for="name" class="input">Name:</label><br>
            <input type="text" id="name" name="name" required><br><br>
            <label for="email" class="input">Email: </label><br>
            <input type="text" id="email" name="email" required><br><br>
            <label for="comment" class="input">Comment:</label><br>
            <input type="text" id="comment" name="comment"><br><br>
        </form>        
        `;       
    }
}

customElements.define('reusable-comment-component', ReusableCommentComponent);
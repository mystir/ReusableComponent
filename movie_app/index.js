/* eslint-disable linebreak-style */
/* eslint-disable max-len */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */

import {openDB} from '../node_modules/idb';
import {api} from './movie-api';

class MovieStore {
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

      await self.db.put('apiKey', api, 'api');
      const key = await db.get('apiKey', 'api');

      if (key) {
        this.set('api', key);
      }

      this.set('search', '');
    });

    this.state = new Proxy(init, {
      async set(state, key, value) {
        state[key] = value;

        if (self.db) {
          if (key == 'api') {
            await self.db.put('apiKey', value, key);
          }
        }

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
    return openDB('database', 1, {upgrade(db) {
      console.log('Initializing Tables...');

      if (!db.objectStoreNames.contains('apiKey')) {
        db.createObjectStore('apiKey');
      }

      if (!db.objectStoreNames.contains('savedmovies')) {
        const SavedMoviesTable = db.createObjectStore('savedmovies', {keyPath: 'imdbID'});
        SavedMoviesTable.createIndex('imdbID', 'imdbID', {unique: true});
        SavedMoviesTable.createIndex('Title', 'Title', {unique: false});
        SavedMoviesTable.createIndex('Year', 'Year', {unique: false});
        SavedMoviesTable.createIndex('imdbRating', 'imdbRating', {unique: false});
        SavedMoviesTable.createIndex('Released', 'Released', {unique: false});
        SavedMoviesTable.createIndex('Poster', 'Poster', {unique: false});
        SavedMoviesTable.createIndex('isfav', 'isfav', {unique: false});
        SavedMoviesTable.createIndex('Notes', 'Notes', {unique: false});
      }
    }});
  }

  updateFavSavedMovies(obj, bool) {
    this.getNotes(obj.id).then((val) => {
      this.database.then((db) => {
        const tx = db.transaction(['savedmovies'], 'readwrite');
        const store = tx.objectStore('savedmovies');

        const movie = {
          imdbID: obj.id,
          Title: obj.title,
          Year: obj.year,
          imdbRating: obj.rating,
          Releasedlease: obj.releaseDate,
          Poster: obj.poster,
          isfav: bool,
          Notes: val,
        };

        return store.put(movie);
      }).then((movie) => {
        console.log('Favourite Movie Updated.');

        if (!bool && String(val).trim() == '') {
          this.removeFromSavedMovies(obj.id);
        }

        if (this.get('search') == '') {
          // small hack to force reload:
          this.set('search', 'x');
          this.set('search', '');
        }
      });
    });
  }

  updateNotesSavedMovies(obj, notes) {
    this.isFav(obj.id).then((val) => {
      this.database.then((db) => {
        const tx = db.transaction(['savedmovies'], 'readwrite');
        const store = tx.objectStore('savedmovies');

        const movie = {
          imdbID: obj.id,
          Title: obj.title,
          Year: obj.year,
          imdbRating: obj.rating,
          Releasedlease: obj.releaseDate,
          Poster: obj.poster,
          isfav: val,
          Notes: notes,
        };

        return store.put(movie);
      }).then((movie) => {
        console.log('Noted Movie Updated.');
        if (!val && notes.trim() == '') {
          this.removeFromSavedMovies(obj.id);
        }
      });
    });
  }

  removeFromSavedMovies(id) {
    this.database.then(function(db) {
      const tx = db.transaction(['savedmovies'], 'readwrite');
      const store = tx.objectStore('savedmovies');
      store.delete(id);

      return tx.complete;
    }).then(() => {
      console.log('Movie Removed.');
    });
  }

  searchForMovie(movie) {
    const url = `https://www.omdbapi.com/?apikey=${this.get('api')}&s=${movie}&type=movie`;

    // read from json
    fetch(url)
        .then((res) => {
          return res.json();
        })
        .then((out) => {
          this.set('movies', JSON.stringify({response: out.Response, results: out.Search}));
        }).catch((err)=> console.error(err));
  }

  apiChangedTo(text) {
    this.set('api', text);
  }

  searchChangedTo(text) {
    this.set('search', text);
    this.searchForMovie(text);
  }

  isFav(id) {
    return this.database.then(function(db) {
      const tx = db.transaction(['savedmovies'], 'readonly');
      const store = tx.objectStore('savedmovies');

      return store.get(id);
    }).then(function(id) {
      return id !== undefined && id.isfav ? true : false;
    });
  }

  getNotes(id) {
    return this.database.then(function(db) {
      const tx = db.transaction(['savedmovies'], 'readonly');
      const store = tx.objectStore('savedmovies');

      return store.get(id);
    }).then(function(id) {
      return id === undefined ? '' : id.Notes;
    });
  }
}

// --------------------------------------------------------------------

const movieStore = new MovieStore({api: api, movies: JSON.stringify({response: false, results: []})});

// --------------------------------------------------------------------


class MovieSearchForm extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();
    const shadow = this.attachShadow({mode: 'open'});
    shadow.innerHTML = `        
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">       
        `;

    const template = document.getElementById('template-movie-search-form');
    const node = document.importNode(template.content, true);
    shadow.append(node);

    this.search = this.shadowRoot.querySelector('#formMovie');
    this.reset = this.shadowRoot.querySelector('#resetBtn');
  }

  connectedCallback() {
    this.search.addEventListener('input', (e) => {
      movieStore.searchChangedTo(e.target.value);
    });

    this.reset.addEventListener('click', (e) => {
      this.search.value = '';
      movieStore.searchChangedTo('');
    });
  }
}

// --------------------------------------------------------------------


class MovieSystem extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();

    const shadow = this.attachShadow({mode: 'open'});
    shadow.innerHTML = `        
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">       
        `;

    const template = document.getElementById('template-movie-system');
    const node = document.importNode(template.content, true);
    shadow.append(node);

    this.movies = this.shadowRoot.querySelector('#allMovies');
  }

  // Observe comment attribute for changes
  static get observedAttributes() {
    return ['movies', 'search'];
  }

  connectedCallback() {
    movieStore.subscribe((state) => {
      this.setAttribute('movies', state.movies);
      this.setAttribute('search', state.search);
    });
  }

  // Change record count when attribute changes
  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (this.movies) {
      if (property === 'movies' && newValue != '') {
        newValue = JSON.parse(newValue);

        if (newValue.response == 'True') {
          this.movies.textContent = '';

          newValue.results.forEach((movie) => {
            const url = `https://www.omdbapi.com/?apikey=${movieStore.get('api')}&i=${movie.imdbID}`;

            // read from json to get specific movie details
            fetch(url)
                .then((res) => {
                  return res.json();
                })
                .then((out) => {
                  this.createMovieComponent(out);
                }).catch((err)=> console.error(err));
          });
        }
      }

      if (property === 'search' && newValue == '') {
        movieStore.database.then(function(db) {
          const tx = db.transaction(['savedmovies'], 'readonly');
          const store = tx.objectStore('savedmovies');

          return store.getAll();
        }).then((allRecords)=> {
          this.movies.textContent = '';

          allRecords.forEach((movie) => {
            if (movie.isfav) {
              this.createMovieComponent(movie);
            }
          });
        });
      }
    }
  }

  createMovieComponent(movie) {
    const newMovieComponent = document.createElement('reusable-movie-component');
    newMovieComponent.setAttribute('id', movie.imdbID);
    newMovieComponent.setAttribute('title', movie.Title);
    newMovieComponent.setAttribute('year', movie.Year);
    newMovieComponent.setAttribute('rating', movie.imdbRating);
    newMovieComponent.setAttribute('releaseDate', movie.Released);
    newMovieComponent.setAttribute('poster', movie.Poster);

    this.movies.append(newMovieComponent);
  }
}


// --------------------------------------------------------------------

class ReusableMovieComponent extends HTMLElement {
  constructor() {
    // Always call super first in constructor
    super();

    const shadow = this.attachShadow({mode: 'open'});

    shadow.innerHTML = `        
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0/dist/css/bootstrap.min.css" rel="stylesheet"
            integrity="sha384-gH2yIJqKdNHPEq0n4Mqa/HGKIhSkIHeL5AyhkYV8i59U5AR6csBvApHHNl/vI1Bx" crossorigin="anonymous">       
        `;
    this.showNotes = false;
  }

  async connectedCallback() {
    const template = document.getElementById('template-reusable-movie-component');
    const node = document.importNode(template.content, true);
    this.shadowRoot.appendChild(node);

    // ------- Setup Movie Object ----------

    const movieObj = {
      id: this.getAttribute('id'),
      title: this.getAttribute('title'),
      year: this.getAttribute('year'),
      rating: this.getAttribute('rating'),
      releaseDate: this.getAttribute('releaseDate'),
      poster: this.getAttribute('poster'),
      isfav: await movieStore.isFav(this.getAttribute('id')),
      notes: await movieStore.getNotes(this.getAttribute('id')),
    };

    const title = this.shadowRoot.getElementById('title');
    title.textContent = movieObj.title;

    const year = this.shadowRoot.getElementById('year');
    year.value = movieObj.year;

    const rating = this.shadowRoot.getElementById('rating');
    rating.value = movieObj.rating;

    const releaseDate = this.shadowRoot.getElementById('releaseDate');
    releaseDate.value = movieObj.releaseDate;

    const poster = this.shadowRoot.getElementById('poster');
    poster.setAttribute('src', movieObj.poster);


    // ------- Favorite Button Functionality ----------

    const fav = this.shadowRoot.getElementById('fav');

    // load from fav state
    fav.checked = movieObj.isfav;

    // set new fav state
    fav.addEventListener('change', function() {
      if (fav.checked) {
        movieStore.updateFavSavedMovies(movieObj, true);
      } else {
        movieStore.updateFavSavedMovies(movieObj, false);
      }
    });

    // ------- Notes Functionality ----------

    const notes = this.shadowRoot.getElementById('notes').querySelector('#notesContent');
    // load from notes state
    notes.textContent = movieObj.notes;

    // set new notes state
    notes.addEventListener('input', function() {
      movieStore.updateNotesSavedMovies(movieObj, notes.value);
    });

    const notesBtn = this.shadowRoot.getElementById('notesBtn');
    notesBtn.addEventListener('click', () => {
      if (!this.showNotes) {
        notesBtn.querySelector('i').textContent = 'Hide Notes';
        this.showNotes = true;
      } else {
        notesBtn.querySelector('i').textContent = 'View Notes';
        this.showNotes = false;
      }
    });


    const notesFunc = this.shadowRoot.querySelector('.collapsible');

    notesFunc.addEventListener('click', function() {
      notesFunc.classList.toggle('active');
      const content = notesFunc.nextElementSibling;
      if (content.style.maxHeight) {
        content.style.maxHeight = null;
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  }
}

// --------------------------------------------------------------------

if (customElements.get('movie-search-form') === undefined) {
  customElements.define('movie-search-form', MovieSearchForm);
}

if (customElements.get('reusable-movie-component') === undefined) {
  customElements.define('reusable-movie-component', ReusableMovieComponent);
}

if (customElements.get('movie-system') === undefined) {
  customElements.define('movie-system', MovieSystem);
}
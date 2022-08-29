/* eslint-disable linebreak-style */
/* eslint-disable max-len */
/* eslint-disable eol-last */
/* eslint-disable require-jsdoc */
/* eslint-disable no-unused-vars */

import {precacheAndRoute} from 'workbox-precaching';
import {offlineFallback, staticResourceCache, imageCache} from 'workbox-recipes';
import {setDefaultHandler} from 'workbox-routing';
import {NetworkOnly} from 'workbox-strategies';

// console.log('check onNeedRefresh button');

setDefaultHandler(new NetworkOnly());

precacheAndRoute(self.__WB_MANIFEST);

staticResourceCache();

imageCache();

offlineFallback({
  pageFallback: '/404.html',
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});



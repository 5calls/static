import React from 'react';
import { createRoot } from 'react-dom/client';
import $ from 'jquery';

import Location from './components/Location';
import Reps from './components/Reps';
import Script from './components/Script';
import Outcomes from './components/Outcomes';
import Share from './components/Share';
import StateProvider from './state/stateProvider';
import './utils/staticUtils';
import { ActBlue } from './common/models/actblue';
import OneSignal from 'react-onesignal';
import uuid from './utils/uuid';
import { postSubscriberDistrict } from './utils/api';
import PhoneSubscribe from './components/PhoneSubscribe';
import CallCount from './components/CallCount';
import APIForm from './components/APIForm';
import Settings from './components/Settings';
import GroupCallCount from './components/GroupCallCount';
import Bugsnag from '@bugsnag/js';
import { Slide, ToastContainer } from 'react-toastify';
import { LOCAL_STORAGE_KEYS } from './common/constants';
Bugsnag.start('67e3931dbe1bbf48991ce7d682ceb676');

type IslandConfig = {
  id: string;
  component: React.ComponentType<any>;
  hasStateProvider?: boolean;
  condition?: boolean;
};


OneSignal.init({
  appId: '5fd4ca41-9f6c-4149-a312-ae3e71b35c0e',
  path: '/js/',
  serviceWorkerParam: { scope: '/js/' }
}).then(() => {
  OneSignal.setExternalUserId(uuid.callerID());
});

declare global {
  interface Window {
    // actblue injects this object when it loads
    actblue?: ActBlue;
    // available on apple platforms that support apple pay, does not mean the user has a card set up
    ApplePaySession?: any;
  }
}

$(() => {
  // sub_id is the subscriber id from buttondown that we send in emails
  // if it exists, we want to store it so we can keep district info up to date
  const urlParams = new URLSearchParams(window.location.search);
  const subId = urlParams.get('sub_id');

  if (!subId) {
    return;
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.SUBSCRIBER, subId);

  // Remove sub_id from URL without reloading the page
  urlParams.delete('sub_id');
  const newUrl =
    window.location.pathname +
    (urlParams.toString() ? '?' + urlParams.toString() : '') +
    window.location.hash;
  window.history.replaceState({}, '', newUrl);

  // if there's already a district set, post it to the server
  const district = localStorage.getItem(LOCAL_STORAGE_KEYS.DISTRICT);
  if (district) {
    postSubscriberDistrict(subId, district);
  }
});

const handleRootRenderError = (error: any, component: string) => {
  if (`${error}`.includes('Minified React error #200')) {
    // nbd, we're on a page where no reps element is
  } else if (`${error}`.includes('Target container is not a DOM element.')) {
    // dev version of above
  } else {
    console.error(`error loading ${component} component: ${error}`);
  }
};



const startComponentRenders = () => {
  const setupOutcomesFloating = () => {
    const scriptElement = document.getElementById('react-script');
    const outcomesElement = document.getElementById('react-outcomes');

    if (scriptElement && outcomesElement) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting || entry.boundingClientRect.top <= 0) {
              // Add class when script is in view or above viewport
              outcomesElement.classList.add('outcomes-float');
            } else if (entry.boundingClientRect.top > 0) {
              // Remove class when script is below viewport
              outcomesElement.classList.remove('outcomes-float');
            }
          });
        },
        {
          threshold: 0,
          rootMargin: '0px'
        }
      );

      observer.observe(scriptElement);
    }
  };

  // Call the setup after a short delay to ensure elements are rendered
  setTimeout(setupOutcomesFloating, 100);

  const getGroupFromPath = (): string | null => {
    const path = window.location.pathname;
    //eslint-disable-next-line
    const match = path.match(/\/groups\/([^\/]+)\/?$/);
    return match ? match[1] : null;
  };

  const islands: IslandConfig[] = [
    { id: 'react-location', component: Location, hasStateProvider: true },
    { id: 'react-reps', component: Reps, hasStateProvider: true },
    { id: 'react-script', component: Script, hasStateProvider: true },
    { id: 'react-outcomes', component: Outcomes },
    { id: 'react-share', component: Share },
    { id: 'react-phone', component: PhoneSubscribe },
    { id: 'react-call-count', component: CallCount },
    { id: 'api-form', component: APIForm },
    { id: 'react-settings', component: Settings },
    {
      id: 'react-groupcounts',
      component: GroupCallCount,
      condition: Boolean(getGroupFromPath())
    },
    {
      id: 'toast-container',
      component: () => (
        <ToastContainer position="top-center" draggable transition={Slide} />
      )
    }
  ];

  islands.forEach(({ id, component, hasStateProvider, condition }) => {
    try {
      if (condition === false) {
        return;
      }
      const element = document.getElementById(id);
      if (!element) {
        return;
      }

      const el = React.createElement(component);
      if (hasStateProvider) {
        createRoot(element).render(<StateProvider>{el}</StateProvider>);
      } else {
        createRoot(element).render(el);
      }
    } catch (error) {
      handleRootRenderError(error, id);
    }
  });
};

startComponentRenders();

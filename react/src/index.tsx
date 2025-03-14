import React from "react";
import ReactDOM from "react-dom";
import firebase from "firebase/app";
import "firebase/auth";
import $ from "jquery";

import Location from "./components/Location";
import Reps from "./components/Reps";
import Script from "./components/Script";
import Outcomes from "./components/Outcomes";
import Share from "./components/Share";
import StateProvider from "./state/stateProvider";
import "./utils/staticUtils";
// import { ACTBLUE_EMBED_TOKEN } from "./common/constants";
import { ActBlue } from "./common/models/actblue";
import OneSignal from 'react-onesignal';
import uuid from "./utils/uuid";
import PhoneSubscribe from "./components/PhoneSubscribe";
import CallCount from "./components/CallCount";
import APIForm from "./components/APIForm";
import Settings from "./components/Settings";
import GroupCallCount from "./components/GroupCallCount";
import { postSubscriberDistrict } from "./utils/api";

firebase.initializeApp({
  apiKey: "AIzaSyCqbgwuM82Z4a3oBzzmPgi-208UrOwIgAA",
  authDomain: "southern-zephyr-209101.firebaseapp.com",
  databaseURL: "https://southern-zephyr-209101.firebaseio.com",
  projectId: "southern-zephyr-209101",
  storageBucket: "southern-zephyr-209101.appspot.com",
  messagingSenderId: "919201105905",
  appId: "1:919201105905:web:cb16c071be2bb896dfa650",
});

OneSignal.init({ appId: '5fd4ca41-9f6c-4149-a312-ae3e71b35c0e', path: '/js/', serviceWorkerParam: { scope: '/js/' } }).then(() => {
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

// this is like the latest $(document).ready()
$(() => {
  // sub_id is the subscriber id from buttondown that we send in emails
  // if it exists, we want to store it so we can keep district info up to date
  const urlParams = new URLSearchParams(window.location.search);
  const subId = urlParams.get('sub_id');
  
  if (subId) {
    localStorage.setItem('sub_id', subId);
    
    // Remove sub_id from URL without reloading the page
    urlParams.delete('sub_id');
    const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '') + window.location.hash;
    window.history.replaceState({}, '', newUrl);

    // if there's already a district set, post it to the server
    const district = localStorage.getItem("district");
    if (district) {
      postSubscriberDistrict(subId, district);
    }
  }
  
  // $("#actblue").on("click", (e) => {
  //   if (window.actblue && window.actblue.__initialized) {
  //     // double check that actblue has loaded, if it has, prevent that click
  //     e.preventDefault();

  //     // actblue express does not have apple pay support, see if directing apple pay-capable browsers
  //     // to an actblue window makes a difference in donations
  //     if (window.ApplePaySession) {
  //       window.fivecalls.openDonate(25, "applepay")
  //     } else {
  //       window.actblue
  //       .requestContribution({
  //         token: ACTBLUE_EMBED_TOKEN,
  //         refcodes: ["embed",uuid.callerID()],
  //       })
  //     }
  //   }
  // });
});

const handleRootRenderError = (error: any, component: string) => {
  if (`${error}`.includes("Minified React error #200")) {
    // nbd, we're on a page where no reps element is
  } else if (`${error}`.includes("Target container is not a DOM element.")) {
    // dev version of above
  } else {
    console.error(`error loading ${component} component: ${error}`);
  }
};

let firebaseAuthStartedUp = false;
firebase.auth().onAuthStateChanged((user) => {
  // console.log("auth state change with user:", user);

  if (!user) {
    firebase
      .auth()
      .signInAnonymously()
      .then((user) => {
        // ok user signed in
      })
      .catch((error) => {
        console.log("error signing in user", error);
      });
  }

  // only run the initial react renders once
  if (!firebaseAuthStartedUp) {
    startComponentRenders();
  }
  firebaseAuthStartedUp = true;
});

const startComponentRenders = () => {
  const setupOutcomesFloating = () => {
    const scriptElement = document.getElementById('react-script');
    const outcomesElement = document.getElementById('react-outcomes');
    
    if (scriptElement && outcomesElement) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
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
  
  try {
    ReactDOM.render(
      <React.StrictMode>
        <StateProvider>
          <Location />
        </StateProvider>
      </React.StrictMode>,
      document.getElementById("react-location")
    );
  } catch (error) {
    handleRootRenderError(error, "location");
  }

  try {
    ReactDOM.render(
      // we disabled strict mode here because we use findDOMNode in a very safe way (hopefully)
      <StateProvider>
        <Reps />
      </StateProvider>,
      document.getElementById("react-reps")
    );
  } catch (error) {
    handleRootRenderError(error, "reps");
  }

  try {
    ReactDOM.render(
      <StateProvider>
        <Script />
      </StateProvider>,
      document.getElementById("react-script")
    );
  } catch (error) {
    handleRootRenderError(error, "script");
  }

  try {
    ReactDOM.render(<Outcomes />, document.getElementById("react-outcomes"));
  } catch (error) {
    handleRootRenderError(error, "outcomes");
  }

  try {
    ReactDOM.render(<Share />, document.getElementById("react-share"));
  } catch (error) {
    handleRootRenderError(error, "share");
  }

  try {
    ReactDOM.render(<PhoneSubscribe />, document.getElementById("react-phone"));
  } catch (error) {
    handleRootRenderError(error, "phone");
  }

  try {
    ReactDOM.render(<CallCount />, document.getElementById("react-call-count"));
  } catch (error) {
    handleRootRenderError(error, "call-count");
  }

  try {
    ReactDOM.render(<APIForm />, document.getElementById("api-form"));
  } catch (error) {
    handleRootRenderError(error, "api-form");
  }

  try {
    ReactDOM.render(
    <Settings />,
    document.getElementById("react-settings"));
  } catch (error) {
    handleRootRenderError(error, "settings");
  }

  try {
    const groupId = getGroupFromPath();
    if (groupId) {
      ReactDOM.render(
        <GroupCallCount group={groupId} />,
        document.getElementById("react-groupcounts")
      );
    }
  } catch (error) {
    handleRootRenderError(error, "group-counts");
  }
};

const getGroupFromPath = (): string | null => {
  const path = window.location.pathname;
  //eslint-disable-next-line
  const match = path.match(/\/groups\/([^\/]+)\/?$/);
  return match ? match[1] : null;
};

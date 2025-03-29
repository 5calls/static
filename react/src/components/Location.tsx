import React, { useState, useEffect } from 'react';
import $ from 'jquery';
import { WithLocationProps } from '../state/locationState';
import { withCompleted, withLocation } from '../state/stateProvider';
import { getBrowserGeolocation } from '../utils/geolocation';
import { getContacts } from '../utils/api';
import { WithCompletedProps } from '../state/completedState';
import { toast } from 'react-toastify';

enum ComponentLocationState {
  NoLocation,
  BadLocation,
  HasLocation,
  GettingAutomatically,
  EnterManually
}

const ERROR_MESSAGE = (
  <div>
    <div>We weren&rsquo;t able to find that location!</div>
    <div> Please try again with a different address.</div>
  </div>
);

const Location: React.FC<WithLocationProps & WithCompletedProps> = (props) => {
  const [componentLocationState, setComponentLocationState] =
    useState<ComponentLocationState>(ComponentLocationState.NoLocation);
  const [manualAddress, setManualAddress] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    if (props.locationState && props.locationState.address) {
      setComponentLocationState(ComponentLocationState.HasLocation);
    }
    updateIssueCompletion();
  }, []);

  useEffect(() => {
    updateIssueCompletion();
  }, [props.completedIssueMap]);

  const updateIssueCompletion = () => {
    const completedIssueIds = Object.keys(props.completedIssueMap || {});
    if (completedIssueIds.length === 0) return;
    $('.i-bar-list-section .i-bar-item-check>div').each((_, el) => {
      const itemIssueID = $(el).data('issue-id') as string;

      if (itemIssueID && completedIssueIds.indexOf(`${itemIssueID}`) !== -1) {
        $(el).attr('class', 'i-bar-check-initial');
        $(el).find('i').first().attr('class', 'fa fa-check');
      }
    });
  };

  const handleManualAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setManualAddress(e.target.value);
  };

  const changeLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setComponentLocationState(ComponentLocationState.EnterManually);
  };

  const setLocationManually = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!manualAddress || manualAddress === '') {
      return;
    }

    getContacts(manualAddress)
      .then((contactList) => {
        props.setLocationAddress(manualAddress ?? '', contactList.location);
        setComponentLocationState(ComponentLocationState.HasLocation);
        document.dispatchEvent(new Event('updateReps'));
      })
      .catch((error) => {
        console.error(error);
        toast.error(ERROR_MESSAGE);
        setComponentLocationState(ComponentLocationState.NoLocation);
      });
  };

  const setLocationAutomatically = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setComponentLocationState(ComponentLocationState.GettingAutomatically);

    getBrowserGeolocation()
      .then((loc) => {
        const pairedLoc = `${loc.latitude},${loc.longitude}`;
        getContacts(pairedLoc)
          .then((contactList) => {
            props.setLocationAddress(pairedLoc, contactList.location);
            setComponentLocationState(ComponentLocationState.HasLocation);
            document.dispatchEvent(new Event('updateReps'));
          })
          .catch((error) => {
            console.log('error getting location after geoloc:', error);
            toast.error(ERROR_MESSAGE);
            setComponentLocationState(ComponentLocationState.NoLocation);
          });
      })
      .catch(() => {
        setComponentLocationState(ComponentLocationState.EnterManually);
      });
  };

  switch (componentLocationState) {
    case ComponentLocationState.NoLocation:
      return (
        <div>
          <span>Find your legislators</span>
          <form onSubmit={setLocationAutomatically}>
            <button className="button button-small button-red">
              Set your location
            </button>
          </form>
        </div>
      );
    case ComponentLocationState.GettingAutomatically:
      return (
        <div>
          <span className="i-bar-loading">
            <i className="fa fa-map-marker"></i>{' '}
            <b>Getting your location automatically&hellip;</b>
          </span>
          <form onSubmit={changeLocation}>
            <button className="button-link">
              Or enter an address manually
            </button>
          </form>
        </div>
      );
    case ComponentLocationState.HasLocation:
      return (
        <div>
          <span>Your location is</span>
          <strong>
            {props.locationState?.cachedCity || props.locationState?.address}
          </strong>
          <form onSubmit={changeLocation}>
            <button className="button-link">Change location</button>
          </form>
        </div>
      );
    case ComponentLocationState.EnterManually:
      return (
        <div>
          <span>Enter an address or ZIP code</span>
          <form onSubmit={setLocationManually}>
            <input
              name="address"
              type="text"
              placeholder="20500 or 1600 Pennsylvania Ave, Washington, DC"
              onChange={handleManualAddressChange}
            />
            <button className="button button-small button-red">Go</button>
          </form>
        </div>
      );
    case ComponentLocationState.BadLocation:
      return (
        <div>
          <span>no reps for that location</span>
        </div>
      );
    default:
      return null;
  }
};

export default withCompleted(
  withLocation((props) => {
    return (
      <>
        <Location {...props} />
      </>
    );
  })
);

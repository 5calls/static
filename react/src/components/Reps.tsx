import React, { createRef } from 'react';

import { toast } from 'react-toastify';
import { Contact } from '../common/models/contact';
import { OutcomeData } from '../common/models/contactEvent';
import { ContactList } from '../common/models/contactList';
import { WithCompletedProps } from '../state/completedState';
import { WithLocationProps } from '../state/locationState';
import { withCompleted, withLocation } from '../state/stateProvider';
import { getContacts, postOutcomeData } from '../utils/api';
import ContactUtils from '../utils/contactUtils';
import { useSettings } from '../utils/useSettings';
import ActiveContact from './ActiveContact';

interface Props {
  callingGroup?: string;
}

interface State {
  areas: string[];
  issueId: string;
  contactList: ContactList | undefined;
  activeContactIndex: number;
}

const TOAST_SETTINGS = {
  autoClose: 2500,
  position: 'bottom-center'
};

const TOAST_DELAY = 750;

type Outcome = 'contact' | 'voicemail' | 'skip' | 'unavailable';

const createAndSendToast = ({
  outcome,
  currentContact,
  nextContact
}: {
  outcome: Outcome;
  currentContact: Contact | undefined;
  nextContact: Contact | undefined;
}) => {
  let outcomeMessage = '';
  if (outcome === 'contact') {
    outcomeMessage = `Contacted ${currentContact?.name}!`;
  } else if (outcome === 'voicemail') {
    outcomeMessage = `Left a voicemail for ${currentContact?.name}!`;
  } else if (outcome === 'skip') {
    outcomeMessage = `Skipped ${currentContact?.name}.`;
  } else if (outcome === 'unavailable') {
    outcomeMessage = `${currentContact?.name} was unavailable.`;
  }

  const finalMessage = (
    <div style={{ marginLeft: '.5rem' }}>
      <div>{outcomeMessage}</div>
      {nextContact?.name && (
        <div style={{ marginTop: '.2rem' }}>
          Next up: call <b>{nextContact?.name}</b>.
        </div>
      )}
    </div>
  );

  if (outcome === 'contact' || outcome === 'voicemail') {
    toast.success(finalMessage, TOAST_SETTINGS);
  } else {
    toast.info(finalMessage, TOAST_SETTINGS);
  }
};

const RepsWithSettings = (
  props: Props & WithLocationProps & WithCompletedProps
) => {
  const { callingGroup } = useSettings();
  return <Reps {...props} callingGroup={callingGroup} />;
};

class Reps extends React.Component<
  Props & WithLocationProps & WithCompletedProps,
  State
> {
  _defaultAreas: string[] = [];
  _defaultContactList: ContactList | undefined = undefined;

  private componentRef = createRef<HTMLDivElement>();
  state = {
    areas: this._defaultAreas,
    issueId: '0000',
    contactList: this._defaultContactList,
    activeContactIndex: 0
  };

  componentDidMount() {
    let areaString = '';

    const thisComponent = this.componentRef.current;
    if (thisComponent && thisComponent.parentElement) {
      areaString = thisComponent.parentElement.dataset.repAreas ?? '';
      const areas = areaString.split(',');
      const issueId = thisComponent.parentElement.dataset.issueId ?? '';
      this.setState({ areas, issueId });
    }

    if (!this.state.contactList) {
      // if we don't have contacts, fetch the contacts
      this.updateContacts(areaString);
    }

    document.addEventListener('nextContact', (e) => {
      const outcome: string = (e as CustomEvent).detail;

      const contacts = this.contactsForArea(
        this.state.areas,
        this.state.contactList ?? ({} as ContactList)
      );

      let currentContact: Contact | undefined;
      if (contacts.length >= this.state.activeContactIndex) {
        currentContact = contacts[this.state.activeContactIndex];
      }

      if (outcome !== 'skip') {
        const viaParameter =
          window.location.host === '5calls.org' ? 'web' : 'test';

        gtag('event', 'conversion', {
            'send_to': 'AW-16875388196/mI3GCNKZurMaEKT65-4-'
        });

        const outcomeData: OutcomeData = {
          outcome: outcome,
          issueId: this.state.issueId,
          contactId: currentContact?.id ?? 'no-contact-id',
          via: viaParameter,
          group: this.props.callingGroup
        };
        postOutcomeData(outcomeData);
      }

      const isFinished = this.state.activeContactIndex >= contacts.length - 1;

      if (!isFinished) {
        const activeContactIndex = this.state.activeContactIndex + 1;
        this.setState({ activeContactIndex });
        this.reportUpdatedActiveContact(contacts[activeContactIndex]);

        document.getElementById('rep-contact')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'start'
        });

        setTimeout(() => {
          createAndSendToast({
            outcome: outcome as Outcome,
            currentContact,
            nextContact: contacts[activeContactIndex]
          });
        }, TOAST_DELAY);
      } else {
        this.props.setCompletedIssueMap({
          [this.state.issueId]: Date.now()
        });

        // if we load the next page too soon, the previous outcome is sometimes skipped
        // 300ms is something arbitrary I picked
        setTimeout(() => {
          window.location.pathname = window.location.pathname + '/done/';
        }, 300);
      }
    });
  }

  componentDidUpdate(prevProps: Props & WithLocationProps) {
    if (
      prevProps.locationState?.address !== this.props.locationState?.address
    ) {
      this.updateContacts(this.state.areas.join(','));
    }
  }

  reportUpdatedActiveContact(contact: Contact) {
    // yuck, I don't have a good way to sync state across different-root components yet
    // so script component just listens to this
    const activeContactEvent = new CustomEvent('activeContact', {
      detail: contact
    });
    document.dispatchEvent(activeContactEvent);
  }

  updateContacts(areas: string = '') {
    if (this.props.locationState) {
      getContacts(this.props.locationState.address, areas)
        .then((contactList) => {
          this.setState({ activeContactIndex: 0, contactList });
          const contacts = this.contactsForArea(this.state.areas, contactList);
          if (contacts.length > 0) {
            // start our script component with an active contact
            this.reportUpdatedActiveContact(contacts[0]);
            // report that reps loaded for outcomes to load
            const loadedRepsEvent = new CustomEvent('loadedReps');
            document.dispatchEvent(loadedRepsEvent);
          }
        })
        .catch((error) => {
          console.log('error getting reps:', error);
        });
    }
  }

  contactsForArea(areas: string[], contactList: ContactList): Contact[] {
    let contacts: Contact[] = [];

    contacts = ContactUtils.allContacts(contactList).filter((contact) => {
      for (const area of this.state.areas) {
        if (area === contact.area) {
          return true;
        }
      }
      return false;
    });

    return contacts;
  }

  contactComponent(
    contact: Contact,
    index: number,
    activeIndex: number
  ): JSX.Element {
    let photoURL = '/images/no-rep.png';
    if (contact.photoURL && contact.photoURL !== '') {
      photoURL = contact.photoURL ?? '/images/no-rep.png';
    }

    return (
      <li className={index === activeIndex ? 'active' : ''} key={contact.id}>
        <img
          alt={contact.name}
          src={photoURL}
          onError={(e) => {
            e.currentTarget.src = '/images/no-rep.png';
          }}
        />
        <h4>
          {contact.name} ({ContactUtils.partyAndState(contact)})
        </h4>
        <p>{contact.reason}</p>
      </li>
    );
  }

  render() {
    if (!this.state.contactList || !this.props.locationState?.address) {
      return (
        <div ref={this.componentRef}>
          <ul>
            <li>
              <img alt="No representative found" src="/images/no-rep.png" />
              <h4>No reps available</h4>
              <p>Please set your location to find your representatives</p>
            </li>
          </ul>
        </div>
      );
    }

    const contacts = this.contactsForArea(
      this.state.areas,
      this.state.contactList
    );
    let activeContact: Contact | undefined;
    if (contacts.length > 0) {
      activeContact = contacts[this.state.activeContactIndex];
    }

    return (
      <div ref={this.componentRef}>
        <ul>
          {contacts.map((contact, index) =>
            this.contactComponent(contact, index, this.state.activeContactIndex)
          )}
        </ul>
        {activeContact && <ActiveContact contact={activeContact} />}
      </div>
    );
  }
}

export default withLocation(withCompleted(RepsWithSettings));

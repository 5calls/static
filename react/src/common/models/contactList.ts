import { Contact } from './contact';

export enum ContactArea {
  USSenate = 'US Senate',
  USHouse = 'US House',
  Governor = 'Governor',
  AttorneysGeneral = 'AttorneysGeneral',
  SecretaryOfState = 'SecretaryOfState',
  StateUpper = 'StateUpper',
  StateLower = 'StateLower'
}

export class ContactList {
  public location: string;
  public lowAccuracy: boolean;
  public state: string;
  public district: string;
  public isSplit: boolean;
  public representatives: Contact[];

  constructor() {
    this.location = '';
    this.lowAccuracy = false;
    this.isSplit = false;
    this.state = '';
    this.district = '';
    this.representatives = [];
  }

  public senateReps(): Contact[] {
    return this.representatives.filter(
      (contact) => contact.area === ContactArea.USSenate
    );
  }

  // there may be multiple house reps returned here, only return one for now
  public houseRep(): Contact[] {
    const contacts: Contact[] = [];
    const houseRep = this.representatives.find(
      (contact) => contact.area === ContactArea.USHouse
    );
    if (houseRep) {
      contacts.push(houseRep);
    }
    return contacts;
  }

  public governor(): Contact[] {
    return this.representatives.filter(
      (contact) => contact.area === ContactArea.Governor
    );
  }

  public stateUpper(): Contact[] {
    return this.representatives.filter(
      (contact) => contact.area === ContactArea.StateUpper
    );
  }

  public stateLower(): Contact[] {
    return this.representatives.filter(
      (contact) => contact.area === ContactArea.StateLower
    );
  }

  public secState(): Contact[] {
    return this.representatives.filter(
      (contact) => contact.area === ContactArea.SecretaryOfState
    );
  }
  public attyGeneral(): Contact[] {
    return this.representatives.filter(
      (contact) => contact.area === ContactArea.AttorneysGeneral
    );
  }

  public generalizedLocationID(): string {
    return `${this.state}-${this.district}`;
  }
}

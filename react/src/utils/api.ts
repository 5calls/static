import axios from 'axios';
import * as querystring from 'querystring';

import OneSignal from 'react-onesignal';

import { Contact } from '../common/models/contact';
import { ContactList } from '../common/models/contactList';
import * as Constants from '../common/constants';
import { OutcomeData } from '../common/models/contactEvent';
import uuid from './uuid';
import { LOCAL_STORAGE_KEYS } from '../common/constants';

export const noLocationError = Error('no location entered');

interface ContactResponse {
  location: string;
  lowAccuracy: boolean;
  state: string;
  district: string;
  isSplit: boolean;
  representatives: Contact[];
}

export const getContacts = async (
  location: string,
  areas: string = ''
): Promise<ContactList> => {
  if (!location || location === '') {
    return Promise.reject(noLocationError);
  }

  let areasQuery = '';
  if (areas !== '') {
    areasQuery = `&areas=${encodeURIComponent(areas)},`;
  }

  return axios
    .get<ContactResponse>(
      `${Constants.REPS_API_URL}?location=${location}${areasQuery}`,
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    )
    .then((result) => {
      const contactList = new ContactList();
      contactList.lowAccuracy = result.data.lowAccuracy;
      contactList.location = result.data.location;
      contactList.representatives = result.data.representatives;
      contactList.state = result.data.state;
      contactList.district = result.data.district;
      contactList.isSplit = result.data.isSplit;
      if (contactList.generalizedLocationID() !== '-') {
        const districtId = contactList.generalizedLocationID();
        OneSignal.sendTag('districtID', districtId);
        localStorage.setItem(LOCAL_STORAGE_KEYS.DISTRICT, districtId);

        // if there's a sub_id in local storage, post it to the server since we've updated the district
        const subId = localStorage.getItem(LOCAL_STORAGE_KEYS.SUBSCRIBER);
        if (subId) {
          postSubscriberDistrict(subId, districtId);
        }
      }
      return Promise.resolve(contactList);
    })
    .catch((error) => {
      // console.error("bad address",error);
      return Promise.reject(error);
    });
};

export interface CountData {
  count: number; // total call count
}

export const getCountData = (): Promise<CountData> => {
  return axios
    .get(`${Constants.REPORT_API_URL}`)
    .then((response) => Promise.resolve(response.data))
    .catch((e) => Promise.reject(e));
};

export interface IssueCount {
  name: string;
  count: number;
}

export interface GroupCounts {
  total: number;
  issueCounts: IssueCount[];
}

export const getGroupCountData = (group: string): Promise<GroupCounts> => {
  return axios
    .get(`${Constants.REPORT_API_URL}?group=${encodeURIComponent(group)}`)
    .then((response) => Promise.resolve(response.data))
    .catch((e) => Promise.reject(e));
};

export const postOutcomeData = async (data: OutcomeData) => {
  const postData = querystring.stringify({
    result: data.outcome,
    contactid: data.contactId,
    issueid: data.issueId,
    via: data.via,
    callerid: uuid.callerID(),
    ...(data.group ? { group: data.group } : {})
  });

  return axios.post(`${Constants.REPORT_API_URL}`, postData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};

export const postAPIEmail = (email: string): Promise<boolean> => {
  const postData = querystring.stringify({
    email: email
  });
  return axios.post(Constants.API_TOKEN_URL, postData);
};

export const postSubscriberDistrict = (
  sub_id: string,
  district: string
): Promise<boolean> => {
  const postData = querystring.stringify({
    subscriber: sub_id,
    district: district,
    cid: uuid.callerID()
  });
  return axios.post(Constants.UPDATE_DISTRICT_API_URL, postData, {});
};

// sends a message to the server indicating the gclid and caller id
export const postGCLID = (gclid: string) => {
  const postData = querystring.stringify({
    gclid: gclid,
    cid: uuid.callerID()
  });
  return axios.post(Constants.GCLID_API_URL, postData, {});
};

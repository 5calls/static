import axios from "axios";
import * as querystring from "querystring";
import firebase from "firebase/app";
import "firebase/auth";
import OneSignal from 'react-onesignal';

import { Contact } from "../common/models/contact";
import { ContactList } from "../common/models/contactList";
import * as Constants from "../common/constants";
import { OutcomeData } from "../common/models/contactEvent";
import { UserCallDetails } from "../common/models/userStats";
import { CompletionMap } from "../state/completedState";
import uuid from "./uuid";

const prepareHeaders = async (): Promise<Headers> => {
  const idToken = await firebase.auth().currentUser?.getIdTokenResult();

  let headers: Headers = { "Content-Type": "application/json; charset=utf-8" };
  if (idToken) {
    headers.Authorization = "Bearer " + idToken.token;
  }

  return Promise.resolve(headers);
};

interface Headers {
  Authorization?: string;
  "Content-Type": string;
}

export const noLocationError = Error("no location entered");

interface ContactResponse {
  location: string;
  lowAccuracy: boolean;
  state: string;
  district: string;
  representatives: Contact[];
}

export const getContacts = async (location: string, areas: string = ""): Promise<ContactList> => {
  if (!location || location === "") {
    return Promise.reject(noLocationError);
  }

  const headers = await prepareHeaders();
  let areasQuery = "";
  if (areas !== "") {
    areasQuery = `&areas=${encodeURIComponent(areas)},`;
  }

  return axios
    .get<ContactResponse>(`${Constants.REPS_API_URL}?location=${location}${areasQuery}`, {
      headers: headers,
    })
    .then((result) => {
      const contactList = new ContactList();
      contactList.lowAccuracy = result.data.lowAccuracy;
      contactList.location = result.data.location;
      contactList.representatives = result.data.representatives;
      contactList.state = result.data.state;
      contactList.district = result.data.district
      if (contactList.generalizedLocationID() !== "-") {
        const locationId = contactList.generalizedLocationID();
        OneSignal.sendTag("districtID", locationId);
        localStorage.setItem("district", locationId);

        // if there's a sub_id in local storage, post it to the server
        const subId = localStorage.getItem("sub_id");
        if (subId) {
          postSubscriberDistrict(subId, locationId);
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
    ...(data.group ? { group: data.group } : {}),
  });

  const headers = await prepareHeaders();
  headers["Content-Type"] = "application/x-www-form-urlencoded";

  return axios
    .post(`${Constants.REPORT_API_URL}`, postData, {
      headers,
    })
    .then((response) => {
      return Promise.resolve(null);
    })
    .catch((e) => Promise.reject(e));
};

interface CompletedIssuesResponse {
  completed: CompletionMap;
}

export const getCompletedIssues = async (): Promise<CompletionMap> => {
  const headers = await prepareHeaders();

  return axios
    .get<CompletedIssuesResponse>(`${Constants.COMPLETED_API_URL}`, {
      headers: headers,
    })
    .then((result) => {
      return Promise.resolve(result.data.completed);
    })
    .catch((error) => {
      console.error("couldn't get completed issues", error);
      return Promise.reject(error);
    });
};

export const getUserCallDetails = (idToken: string) => {
  let today = new Date();
  // this is fine for now, we can add moment later
  today.setDate(today.getDate() - 60);
  const dateString =
    today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);

  return axios
    .get(`${Constants.PROFILE_API_URL}?timestamp=${dateString}`, {
      headers: { Authorization: "Bearer " + idToken },
    })
    .then((response) => {
      let profile = response.data as UserCallDetails;
      return Promise.resolve(profile);
    })
    .catch((e) => Promise.reject(e));
};

export const postPhoneRemind = (phone: string): Promise<Boolean> => {
  const postData = querystring.stringify({
    phone: phone,
    ref: "",
  });
  return axios
    .post(Constants.REMINDER_API_URL, postData)
    .then((response) => Promise.resolve(true))
    .catch((e) => Promise.reject(e));
};

export const postEmail = (email: string, sub: boolean, idToken: string): Promise<Boolean> => {
  const subscribe = sub ? "true" : "";

  const postData = querystring.stringify({
    email: email,
    subscribe: subscribe,
  });
  return axios
    .post(Constants.PROFILE_API_URL, postData, {
      headers: { Authorization: "Bearer " + idToken },
    })
    .then((response) => Promise.resolve(true))
    .catch((e) => Promise.reject(e));
};

export const postAPIEmail = (email: string): Promise<Boolean> => {
  const postData = querystring.stringify({
    email: email,
  });
  return axios
    .post(Constants.API_TOKEN_URL, postData)
    .then((response) => Promise.resolve(true))
    .catch((e) => Promise.reject(e));
};

export const postSubscriberDistrict = (sub_id: string, district: string): Promise<Boolean> => {
  const postData = querystring.stringify({
    sub_id: sub_id,
    district: district,
    cid: uuid.callerID(),
  });
  return axios
    .post(Constants.SUB_DISTRICT_API_URL, postData, {})
    .then((response) => Promise.resolve(true))
    .catch((e) => Promise.reject(e));
};
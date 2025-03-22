import React from "react";

import { LocationState, LocationContext, WithLocationProps } from "./locationState";
import Storage from "../utils/storage";
import { CompletedContext, CompletedIssueMap, WithCompletedProps } from "./completedState";

interface Props {
  children: React.ReactNode
}

interface State {
  locationState?: LocationState;
  completedIssueMap?: CompletedIssueMap;
  savedStateRestored: boolean;
}

export default class StateProvider extends React.Component<Props, State> {

  state: State = {
    locationState: undefined,
    savedStateRestored: false,
    completedIssueMap: {}
  };

  componentDidMount() {
    try {
      this.loadFromStorage();
    } catch (error) {
      console.log("could not parse localstorage, removing:", error);
      localStorage.removeItem("persist:fivecalls");
    }

    // if these events are fired, we should reload from storage
    document.addEventListener("updateReps", () => {
      this.loadFromStorage();
    });
  }

  loadFromStorage() {
    const appState = Storage.getStorageAsObject();
    this.setState({
      locationState: appState.locationState,
      completedIssueMap: appState.completedIssueMap,
      savedStateRestored: true,
    });
  }

  setLocationAddress(address: string, display: string) {
    // save the location and cached city in localstorage
    // if the backend passes "unknown address" just remove it

    const locationState: LocationState = {
      address: address,
      cachedCity: display,
      // splitDistrict: false,
      // invalidAddress: false,
      // locationFetchType: LocationFetchType.CACHED_ADDRESS,
    };
    Storage.saveLocation(locationState);
    this.setState({ locationState });
  }

  setCompletedIssueMap(updatedCompletedIssueMap: CompletedIssueMap) {
    const newCompletedIssueMap = {
      ...this.state.completedIssueMap,
      ...updatedCompletedIssueMap,
    }
    Storage.saveCompleted(
      newCompletedIssueMap
    );
    this.setState({
      completedIssueMap: newCompletedIssueMap
    })
  }

  render(): React.ReactNode {
    // simple version of the redux-persist gate where nothing is rendered until the persisted
    // data is loaded for the first time
    if (!this.state.savedStateRestored) {
      return <></>;
    }

    return (
      <LocationContext.Provider
        value={{
          locationState: this.state.locationState,
          setLocationAddress: (address: string, display: string) => this.setLocationAddress(address, display),
        }}
      >
        <CompletedContext.Provider
          value={{
            completedIssueMap: this.state.completedIssueMap || {},
            setCompletedIssueMap: (issueMapUpdates: CompletedIssueMap) => this.setCompletedIssueMap(issueMapUpdates),
          }}
        >
          {this.props.children}
        </CompletedContext.Provider>
      </LocationContext.Provider>
    );
  }
}

export const withLocation = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, keyof WithLocationProps>> => (props) => (
  <LocationContext.Consumer>
    {({ locationState, setLocationAddress }) => (
      <Component {...(props as P)} locationState={locationState} setLocationAddress={setLocationAddress} />
    )}
  </LocationContext.Consumer>
);

export const withCompleted = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, keyof WithCompletedProps>> => (props) => (
  <CompletedContext.Consumer>
    {({ completedIssueMap, setCompletedIssueMap }) => (
      <Component
        {...(props as P)}
        completedIssueMap={completedIssueMap}
        setCompletedIssueMap={setCompletedIssueMap}
      />
    )}
  </CompletedContext.Consumer>
);

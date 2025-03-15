import React from "react";
import $ from "jquery";

import { WithLocationProps } from "../state/locationState";
import { withCompleted, withLocation } from "../state/stateProvider";
import { getBrowserGeolocation } from "../utils/geolocation";
import { getCompletedIssues, getContacts } from "../utils/api";
import { CompletionMap, WithCompletedProps } from "../state/completedState";

enum ComponentLocationState {
  NoLocation,
  BadLocation,
  HasLocation,
  GettingAutomatically,
  EnterManually,
}

interface Props {}
interface State {
  componentLocationState: ComponentLocationState;
  manualAddress: string | undefined;
  locationError: string | undefined;
}

class Location extends React.Component<Props & WithLocationProps & WithCompletedProps, State> {
  _defaultManualAddress: string | undefined = undefined;
  _defaultLocationError: string | undefined = undefined;

  state = {
    componentLocationState: ComponentLocationState.NoLocation,
    manualAddress: this._defaultManualAddress,
    locationError: this._defaultLocationError,
  };

  componentDidMount() {
    // update the local component state based on our global state
    if (this.props.locationState && this.props.locationState.address) {
      this.setState({ componentLocationState: ComponentLocationState.HasLocation });
    }

    this.processIssueCompletion();
  }

  processIssueCompletion = () => {
    if (this.props.completed?.needsCompletionFetch) {
      getCompletedIssues().then((completed) => {
        this.props.setCompleted(completed);
        this.updateIssueCompletion(this.completedIDsFromCompletionMap(completed));
      });
    } else {
      if (this.props.completed?.completed) {
        this.updateIssueCompletion(this.completedIDsFromCompletionMap(this.props.completed?.completed));
      }
    }
  };

  completedIDsFromCompletionMap(completionMap: CompletionMap): string[] {
    let completedIssueIDs: string[] = [];
    Object.keys(completionMap).forEach((key) => {
      completedIssueIDs.push(key);
    });

    return completedIssueIDs;
  }

  // "what the fuck is jquery doing in react?"
  // well, we have a bunch of static html on the page that we'd likely to modify
  // without having to render again in react, plus rerender flashes are ugly
  // so instead we do some light modification with jquery
  updateIssueCompletion = (completedIssueIDs: string[]) => {
    $(".i-bar-list-section .i-bar-item-check>div").each((_, el) => {
      const itemIssueID = $(el).data("issue-id") as string;

      // itemIssueID is VERY insistant that it be a number even with `as string` above
      if (itemIssueID && completedIssueIDs.indexOf(`${itemIssueID}`) !== -1) {
        $(el).attr("class", "i-bar-check-initial");
        $(el).find("i").first().attr("class", "fa fa-check");
      }
    });
  };

  updateManualAddress = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ manualAddress: e.target.value });
  };

  changeLocation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    this.setState({ componentLocationState: ComponentLocationState.EnterManually });
  };

  setLocationManually = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState({ locationError: undefined });

    if (!this.state.manualAddress || this.state.manualAddress === "") {
      // TODO: re-try automatic location
      return;
    }

    // fetch reps from the api and see if this is valid before saving
    if (this.state.manualAddress) {
      getContacts(this.state.manualAddress)
        .then((contactList) => {
          // console.log("contacts are", contactList);
          this.props.setLocationAddress(this.state.manualAddress ?? "", contactList.location);
          this.setState({ componentLocationState: ComponentLocationState.HasLocation });
          document.dispatchEvent(new Event("updateReps"));
        })
        .catch((error) => {
          console.log("error:", error);
          // we don't specify different types of location errors, but might in the future
          this.setState({ locationError: "location error", componentLocationState: ComponentLocationState.NoLocation });
        });
    }
  };

  setLocationAutomatically = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.setState({ componentLocationState: ComponentLocationState.GettingAutomatically });

    getBrowserGeolocation()
      .then((loc) => {
        // TODO: give stateprovider this loc
        const pairedLoc = `${loc.latitude},${loc.longitude}`;
        getContacts(pairedLoc)
          .then((contactList) => {
            this.props.setLocationAddress(pairedLoc, contactList.location);
            this.setState({ componentLocationState: ComponentLocationState.HasLocation });
            document.dispatchEvent(new Event("updateReps"));
          })
          .catch((error) => {
            console.log("error getting location after geoloc:", error);
            // we don't specify different types of location errors, but might in the future
            this.setState({
              locationError: "geolocation error",
              componentLocationState: ComponentLocationState.NoLocation,
            });
          });

        // // this.props.setLocation(loc);
        // this.setState({ componentLocationState: ComponentLocationState.HasLocation });
      })
      .catch((err) => {
        // nbd, go to manual entry
        this.setState({ componentLocationState: ComponentLocationState.EnterManually });
      });
  };

  render() {
    switch (this.state.componentLocationState) {
      case ComponentLocationState.NoLocation: {
        return (
          <div className="is-visible">
            <span>Find your legislators</span>
            <form onSubmit={this.setLocationAutomatically}>
              <button className="button button-small button-red">Set your location</button>
            </form>
          </div>
        );
      }
      case ComponentLocationState.GettingAutomatically: {
        return (
          <div className="is-visible">
            <span className="i-bar-loading">
              <i className="fa fa-map-marker"></i> <b>Getting your location automatically&hellip;</b>
            </span>
            <form onSubmit={this.changeLocation}>
              <button className="button-link"> Or enter an address manually</button>
            </form>
          </div>
        );
      }
      case ComponentLocationState.HasLocation: {
        return (
          <div className="is-visible">
            <span>Your location is:</span>
            <strong>{this.props.locationState?.cachedCity || this.props.locationState?.address}</strong>
            <form onSubmit={this.changeLocation}>
              <button className="button-link">Change location</button>
            </form>
          </div>
        );
      }
      case ComponentLocationState.EnterManually: {
        return (
          <div className="is-visible">
            <span>Enter an address or ZIP code</span>
            <form onSubmit={this.setLocationManually}>
              <input
                name="address"
                type="text"
                placeholder="20500 or 1600 Pennsylvania Ave, Washington, DC"
                onChange={this.updateManualAddress}
              />
              <button className="button button-small button-red">Go</button>
            </form>
            {this.state.locationError && (
              <span className="location-error">Couldn't find that location, please try again</span>
            )}
          </div>
        );
      }
      case ComponentLocationState.BadLocation: {
        return (
          <div className="is-visible">
            <span>no reps for that location</span>
          </div>
        );
      }
    }
  }
}

export default withLocation(withCompleted(Location));

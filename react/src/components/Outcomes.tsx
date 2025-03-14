import React from "react";
import ReactDOM from "react-dom";

interface Props {}
interface State {
  outcomes: string[];
  showReps: boolean;
}

class Outcomes extends React.Component<Props, State> {
  _defaultOutcomes: string[] = [];
  state = {
    outcomes: this._defaultOutcomes,
    showReps: false,
  };

  componentDidMount() {
    const thisComponent = ReactDOM.findDOMNode(this);
    if (thisComponent && thisComponent.parentElement) {
      const outcomes = (thisComponent.parentElement.dataset.outcomes ?? "").split(",");
      this.setState({ outcomes });
    }

    document.addEventListener("loadedReps", (e) => {
      this.setState({ showReps: true });
    });
  }

  next(outcome: string) {
    const event = new CustomEvent("nextContact", { detail: outcome });
    document.dispatchEvent(event);
  }

  render() {
    if (!this.state.showReps) {
      // this has to be a real element, not a fragment, because ReactDOM.findDOMNode(this) in didMount will fail for non-rendering elements
      return <div></div>;
    }

    return (
      <div>
        <h3>After your call, share the result to show the next representative:</h3>
        <div className="outcomes-items">
          {this.state.outcomes.map((outcome) => {
            const eventClassName = `plausible-event-name=Outcome-${outcome}`
            return (
              <button className={eventClassName} key={outcome} onClick={() => this.next(outcome)}>
                {outcome}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Outcomes;

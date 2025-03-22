import { LocationState } from "../state/locationState";
import { CompletedIssueMap } from "../state/completedState";

export interface ApplicationState {
  locationState?: LocationState;
  completedIssueMap?: CompletedIssueMap;
}

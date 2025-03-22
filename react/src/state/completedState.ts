import React from "react";

// where the value is the timestamp of when the issue was completed
export type CompletedIssueMap = { [issueID: number]: number };

export const CompletedContext = React.createContext({
  completedIssueMap: {} as CompletedIssueMap,
  setCompletedIssueMap: () => {
  },
});

export type WithCompletedProps = {
  completedIssueMap?: CompletedIssueMap;
  setCompletedIssueMap(completedIssueMap: CompletedIssueMap): void;
};

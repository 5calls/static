import fetch from "node-fetch";
import fs from "fs";
import fsExtra from "fs-extra";

// yarn run ts-node -O '{"module": "commonjs"}' scripts/build-archives.ts

interface Issue {
  id: number;
  name: string;
  reason: string;
  script: string;
  slug: string;
  createdAt: string;
  contactAreas: string[];
  outcomeModels: Outcome[];
  active: boolean;
}

interface Outcome {
  label: string;
  status: string;
}

const buildArchives = async () => {
  const contentDirectory = `${__dirname}/../../content/archives/`;
  const files = fs.readdirSync(contentDirectory);
  files.forEach((file) => {
    // _index.md makes the list page show up
    if (file !== "_index.md") {
      fsExtra.removeSync(`${contentDirectory}${file}`);
    }
  });

  fsExtra.mkdir(`${contentDirectory}116th`)
  fetch(`https://api.5calls.org/v1/issues/archive?congress=116`)
    .then((res) => res.json())
    .then((data) => {
      const issues = data as Issue[];
      // console.log("response is", issues);
      issues.forEach((issue) => {
        fs.writeFileSync(`${contentDirectory}116th/${issue.slug}.md`, archiveContentFromIssue(issue, "116"));
      });
    });

  fsExtra.mkdir(`${contentDirectory}117th`)
  fetch(`https://api.5calls.org/v1/issues/archive?congress=117`)
    .then((res) => res.json())
    .then((data) => {
      const issues = data as Issue[];
      // console.log("response is", issues);
      issues.forEach((issue) => {
        fs.writeFileSync(`${contentDirectory}117th/${issue.slug}.md`, archiveContentFromIssue(issue, "117"));
      });
    });

    fsExtra.mkdir(`${contentDirectory}118th`)
    fetch(`https://api.5calls.org/v1/issues/archive?congress=118`)
      .then((res) => res.json())
      .then((data) => {
        const issues = data as Issue[];
        issues.forEach((issue) => {
          fs.writeFileSync(`${contentDirectory}118th/${issue.slug}.md`, archiveContentFromIssue(issue, "118"));
        });
      });

    
};

const archiveContentFromIssue = (issue: Issue, session: string): string => {
  return `---
title: "${escapeQuotes(issue.name)}"
date: ${issue.createdAt}
session: ${session}
---
${issue.reason}
`;
};

const escapeQuotes = (text: string): string => {
  return text.replace(/"/g, '\\"');
};

buildArchives();

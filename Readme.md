# 5 Calls

## how the site works

Pages on the site are static files built with hugo. This makes things speedy to load and cheap to host.
We make certain sections of the site dynamic by injecting small react components that handle ~1 task. Components are:
- Location selector
- Reps list on issue pages
- Local office list
- Script customizations
- Outcome buttons
- Total calls on home page

Our goal is to keep the pages fast, publish the info that people read first statically in html so it renders ~immediately and then load any dynamic content in small components on the page afterwards.

## building

- [Install hugo](https://gohugo.io/installation/) if not already installed
 
  - `yarn build-js` will build the react components and move the js files into the hugo directories 1x

**For development:**
- start hugo with `hugo server`
- move to react folder with `cd react`
  - make sure yarn is up-to-date with `yarn`
 
- Build the react components:
  - For development, run `yarn build-js:dev` to rebuild on every change.The hugo server should automatically reload changes after a few seconds. If you are still not seeing your changes try a hard reload (shift+cmd+r).
- Fetch the current 5 Calls content
  - `yarn build-content` will fetch the latest topics and build hugo content files in the right place
- Build and deploy hugo
  - `hugo` will build the site and content, placing the final built site in `public/`

This happens automatically for production via netlify but you will have to run manually for local installs.

## deployment

New versions are deployed to netlify automatically from `main`

## archived content

The content archives are not updated each build but with a separate `yarn build-archives` command. This content is then committed to the repo, unlike the active content.

Right now this only includes content from previous Congressional sessions, ideally we should update this with content from the current session as soon as it's no longer callable.

# Shuttle Tracker on CF Workers
A simple Shuttle Tracker system that runs on CloudFlare Workers. Made with &lt;3 &nbsp; for BLFC! *Still a work in progress!*

### Development Setup
#### Prerequisites
* [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/)
* ...that's about it for now! There'll be an Android companion app soon.
* A [CloudFlare Workers](https://www.cloudflare.com/workers/) account for deploying the app.

### Deployment

#### CloudFlare Workers
##### Environments
A production environment will be created automatically when you create a new CloudFlare Worker. We'd **strongly** recommend creating a development environment so you can test / debug your app without affecting the production environment.

##### Workers KV Setup
You'll need to create two KV namespaces: `ShuttleStops` and `Shuttles`. These will be used for storing information about the system.

Ensure these are bound to the service in CloudFlare Workers by clicking on the Settings tab, then Variables, then the Edit Variables button. Then add the following:
- Variable Name `SHUTTLES` and KV Namespace `Shuttles`
- Variable Name `STOPS` and KV Namespace `ShuttleStops`

##### Code Deployment
Take the output from the `npm run build` command (you can find that in `dist/index.js`) and upload it to your CloudFlare Worker.

### Suggestions / Feedback
If you've got an idea, found a mistake, or otherwise have some feedback you'd like to share, please create an issue to let us know. Or, if you're feeling up to it, you can always create a pull request with your changes! *(We don't bite!)*

### License
Licensed under the GPL-3.0 License (https://www.gnu.org/licenses/gpl-3.0.en.html). Feel free to use this code for whatever you want, but please give back to the community and credit us if you do.

&copy; 2022 Adam Walker ([@Crashdoom](https://github.com/Crashdoom))

[Cloudflare Workers with TypeScript and Webpack](https://github.com/udacity/cloudflare-typescript-workers) by Udacity. &copy; 2019 Udacity, Inc.

Content derived from Cloudflare Developer Documentation. &copy; 2022 Cloudflare, Inc.
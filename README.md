# TWEB-GITAPI
### Backend agent for the open source roulette

## About
This repository hosts the agent used as backend for the website available [here](https://farenjihn.github.io/ossroulette/)

This project uses a few dependencies through `nodejs` to fetch data from the github API (both REST and GraphQL) and then publish it for the frontend app. This agent is deployed on heroku and runs every hour.

This repository only contains the agent for the application. You can find the frontend [there](https://github.com/Farenjihn/ossroulette).

## Build
To build the project you need `npm`:

```
$ npm install
```

## Run locally
Beware, to run this locally you need to set your `GITHUB_API_KEY` environment variable to a github token able to push on the repository for the frontend. Needless to say we do not plan on providing a key publicly, nevertheless if you were to run it locally here are the steps to do so:

In order to run the project locally, a npm task is provided:

```
npm start
```
This will fetch the data and push it to the frontend repository.

## Why GraphQL
The REST API (v3) provided by github is awesome but unfortunately, we would have needed to do a **lot** of queries to get the same amount of informations that we currently fetch using GraphQL. As github limits us to 5000 queries per hour, this had a negative impact on our velocity when trying to fix bugs and change details in the implementation as we would get blocked quite quickly and would have to wait for the rate limit to grant us some space.

Unfortunately the GraphQL API does not perfectly match the REST API's functionalities and so we had to use the REST API to get a rendered README to display in the app.

## Contribute
If you wish to contribute, please fork and create a pull request to merge your changes.

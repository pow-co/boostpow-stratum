
# Stratum Server for Boost Jobs

[![.github/workflows/main.yml](https://github.com/ProofOfWorkCompany/boost-stratum/actions/workflows/main.yml/badge.svg)](https://github.com/ProofOfWorkCompany/boost-stratum/actions/workflows/main.yml)
[![<ProofOfWorkCompany>](https://circleci.com/gh/ProofOfWorkCompany/boost-stratum.svg?style=shield)](<https://circleci.com/gh/ProofOfWorkCompany/boost-stratum>)


## Installation

Typescript must be installed on your development machine 

```
npm install
```

## Step One

Run the tests and make sure if they are all passing.

```
npm test
```

If they aren't passing, write some code to make the pass

## Step Two

Run the server to see what happens in the logs

```
npm start
```

You should see some logs to the console and in your log database.

## Step Three

Connect a client to see what happens to the API

```
npm run connect
```

## Production

To tail the logs in production run

```
npm run logs
```


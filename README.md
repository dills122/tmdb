# TMDb

[![GitSpo Mentions](https://gitspo.com/badges/mentions/gajus/tmdb?style=flat-square)](https://gitspo.com/mentions/gajus/tmdb)
[![Travis build status](http://img.shields.io/travis/gajus/tmdb/master.svg?style=flat-square)](https://travis-ci.org/gajus/tmdb)
[![Coveralls](https://img.shields.io/coveralls/gajus/tmdb.svg?style=flat-square)](https://coveralls.io/github/gajus/tmdb)
[![NPM version](http://img.shields.io/npm/v/tmdb.svg?style=flat-square)](https://www.npmjs.org/package/tmdb)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

[The Movie Database](https://www.themoviedb.org/) (TMDb) SDK.

## Features

- Automatic rate-throttling
- Strict types

## Usage

```js
import { Tmdb } from "tmdb";

/**
 * @see https://developers.themoviedb.org/3/getting-started/authentication
 */
const apiKey: string = "";

const tmdb = new Tmdb(apiKey);
```

### API

Refer to the [source code](./src/Tmdb.js) and the [type definitions](./src/types.js).

> Note: Only a subset of the API is implemented. I will be adding new methods as needed.
> If you need a method added, raise a PR. Alternatively, you can use the low-level [`get`](#get)
> method to construct any API calls.

```js
async findId (resourceType: 'movie' | 'person', externalSource: 'imdb', externalId: string) => Promise<number>;
async get (resource: string, parameters: QueryType = {}) => Object;
async getMovie (movieId: number) => Promise<MovieType>
async getMovieBackdropImages (movieId: number, includeImageLanguage: $ReadOnlyArray<string>) => Promise<$ReadOnlyArray<MovieBackdropImageType>>;
async getMovieCastCredits (movieId: number) => Promise<$ReadOnlyArray<MovieCastCreditType>>;
async getMovieCrewCredits (movieId: number) => Promise<$ReadOnlyArray<MovieCrewCreditType>>;
async getMoviePosterImages (movieId: number, includeImageLanguage: $ReadOnlyArray<string>) => Promise<$ReadOnlyArray<MoviePosterImageType>>;
async getMovieVideos (movieId: number) => Promise<$ReadOnlyArray<MovieVideoType>>;
async getPerson (personId: number) => Promise<PersonType>;

```

#### `get`

`get` method is the most primitive TMDb API method and it can be used to construct any of the API queries.

Example: `GET /search/movie` API method is not implemented. However, you can still use it as:

```js
await tmdb.get("search/movie", {
  query: "The Terminator",
});
```

### Handling errors

Methods that are expected to return a specific resource will throw `NotFoundError` if the resource is not found.

```js
import {
  Tmdb,
  NotFoundError
} from 'tmdb';

const tmdb = new Tmdb([..]);

try {
  await tmdb.getMovie(1);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error('Movie TMDb ID #1 not found.');
  } else {
    throw error;
  }
}

```

## Logging

This package is using [`roarr`](https://www.npmjs.com/package/roarr) logger to log the program's state.

Export `ROARR_LOG=true` environment variable to enable log printing to stdout.

Use [`roarr-cli`](https://github.com/gajus/roarr-cli) program to pretty-print the logs.

## Additional Helpful Info

if you are on Windows and having trouble with running the tests, checkout this [thread](https://stackoverflow.com/questions/11928013/node-env-is-not-recognized-as-an-internal-or-external-command-operable-comman)

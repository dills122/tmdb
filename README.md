# TMDb

[![npm version](https://img.shields.io/npm/v/@dills1220/tmdb.svg?style=flat-square)](https://www.npmjs.com/package/@dills1220/tmdb)

A small, typed Node.js SDK for [The Movie Database](https://www.themoviedb.org/) (TMDb) v3 API.

## Requirements

- Node.js 22.13 or newer
- A TMDb v3 API key

## Install

```sh
npm install @dills1220/tmdb
```

## Usage

```ts
import {
  Tmdb,
} from '@dills1220/tmdb';

const tmdb = new Tmdb(process.env.TMDB_API_KEY ?? '');
const movie = await tmdb.getMovie(218);

console.log(movie.title);
```

The optional second constructor argument selects the response language and defaults to `en`:

```ts
const tmdb = new Tmdb(process.env.TMDB_API_KEY ?? '', 'fr');
```

The SDK continues to use TMDb v3's supported `api_key` query authentication. Keep API keys out of
source control and logs.

## API

```ts
findId(
  resourceType: 'movie' | 'person',
  externalSource: 'imdb',
  externalId: string,
): Promise<number>;

get<T = Record<string, unknown>>(
  resource: string,
  parameters?: Readonly<Record<string, string | number | null>>,
): Promise<T>;

getCompany(companyId: number): Promise<CompanyType>;
getMovie(movieId: number): Promise<MovieType>;
getMovieBackdropImages(
  movieId: number,
  includeImageLanguage?: readonly string[] | null,
): Promise<readonly MovieBackdropImageType[]>;
getMovieCastCredits(movieId: number): Promise<readonly MovieCastCreditType[]>;
getMovieCrewCredits(movieId: number): Promise<readonly MovieCrewCreditType[]>;
getMoviePosterImages(
  movieId: number,
  includeImageLanguage?: readonly string[] | null,
): Promise<readonly MoviePosterImageType[]>;
getMovieVideos(movieId: number): Promise<readonly MovieVideoType[]>;
getPerson(personId: number): Promise<PersonType>;
getPersonMovieCredits(personId: number): Promise<MovieCreditsType>;
```

The low-level `get()` method supports TMDb endpoints that do not yet have a dedicated SDK method.
Response keys are converted recursively from snake case to camel case:

```ts
const result = await tmdb.get<{
  readonly results: readonly {
    readonly id: number;
    readonly originalTitle: string;
  }[];
}>('search/movie', {
  query: 'The Terminator',
});
```

## Errors and rate limits

Resource lookups throw `NotFoundError` for HTTP 404 responses. Other TMDb failures throw
`RemoteError`, which exposes TMDb's numeric error code as `error.code`.

```ts
import {
  NotFoundError,
  Tmdb,
} from '@dills1220/tmdb';

const tmdb = new Tmdb(process.env.TMDB_API_KEY ?? '');

try {
  await tmdb.getMovie(0);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error('Movie not found.');
  } else {
    throw error;
  }
}
```

HTTP 429 responses are retried up to three times. The client honors `Retry-After` and TMDb's legacy
rate-limit reset header, with a maximum delay of 60 seconds per retry.

## Logging

The package uses [Roarr](https://github.com/gajus/roarr) for structured logs. Set `ROARR_LOG=true`
to enable logging and use `roarr-cli` when human-readable output is useful.

## Development

```sh
npm ci
npm run lint
npm test
npm run build
```

Tests use Node's built-in test runner and Nock; they never require a live TMDb API key.

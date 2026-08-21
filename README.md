# @dills1220/tmdb

[![CI](https://github.com/dills122/tmdb/actions/workflows/ci.yml/badge.svg)](https://github.com/dills122/tmdb/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@dills1220/tmdb?style=flat-square)](https://www.npmjs.com/package/@dills1220/tmdb)
[![npm downloads](https://img.shields.io/npm/dm/@dills1220/tmdb?style=flat-square)](https://www.npmjs.com/package/@dills1220/tmdb)
[![Node.js](https://img.shields.io/node/v/@dills1220/tmdb?style=flat-square)](https://www.npmjs.com/package/@dills1220/tmdb)
[![MIT license](https://img.shields.io/github/license/dills122/tmdb?style=flat-square)](./LICENSE)

A small, typed Node.js SDK for [The Movie Database](https://www.themoviedb.org/) (TMDb) v3 API.
It provides focused helpers for common movie, person, company, image, video, and credit lookups,
plus a typed low-level client for endpoints that do not yet have a dedicated method.

## Features

- Strict TypeScript types bundled with the package
- Deep conversion of TMDb response keys from `snake_case` to `camelCase`
- Explicit `NotFoundError` and `RemoteError` failure handling
- Bounded HTTP 429 retries that honor TMDb rate-limit headers
- Structured, opt-in logging through [Roarr](https://github.com/gajus/roarr)

## Requirements

- Node.js 22.13 or newer
- A TMDb v3 API key

## Install

```sh
pnpm add @dills1220/tmdb
```

The package is published on npm, so npm and Yarn users can install it with their usual package
manager as well.

## Quick start

```ts
import { Tmdb } from '@dills1220/tmdb';

const tmdb = new Tmdb(process.env.TMDB_API_KEY ?? '');
const movie = await tmdb.getMovie(218);

console.log(movie.title);
```

CommonJS is also supported:

```js
const { Tmdb } = require('@dills1220/tmdb');
```

The optional second constructor argument selects the response language and defaults to `en`:

```ts
const tmdb = new Tmdb(process.env.TMDB_API_KEY ?? '', 'fr');
```

The SDK uses TMDb v3's supported `api_key` query authentication. Keep API keys out of source
control and logs.

## API

| Method | Result |
| --- | --- |
| `findId(resourceType, externalSource, externalId)` | Finds a movie or person ID from an IMDb ID |
| `get(resource, parameters?)` | Calls any TMDb v3 resource and camel-cases its response |
| `getCompany(companyId)` | Fetches a production company |
| `getMovie(movieId)` | Fetches a movie |
| `getMovieBackdropImages(movieId, languages?)` | Fetches a movie's backdrop images |
| `getMovieCastCredits(movieId)` | Fetches a movie's cast credits |
| `getMovieCrewCredits(movieId)` | Fetches a movie's crew credits |
| `getMoviePosterImages(movieId, languages?)` | Fetches a movie's poster images |
| `getMovieVideos(movieId)` | Fetches a movie's videos |
| `getPerson(personId)` | Fetches a person |
| `getPersonMovieCredits(personId)` | Fetches a person's movie credits |

All dedicated methods return the corresponding types exported by the package. The low-level
`get()` method supports TMDb endpoints that do not yet have a dedicated SDK method:

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
import { NotFoundError, Tmdb } from '@dills1220/tmdb';

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

Set `ROARR_LOG=true` to enable structured logs. Pipe output through `roarr-cli` when human-readable
development output is useful.

## Development

The repository pins its pnpm version through the `packageManager` field in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm run lint
pnpm test
pnpm run build
```

Tests use Node's built-in test runner and Nock; they never require a live TMDb API key.

## License

[MIT](./LICENSE)

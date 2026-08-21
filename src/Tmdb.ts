import * as timers from 'node:timers/promises';
import camelCase from 'lodash/camelCase';
import Logger from './Logger';
import {
  NotFoundError,
  RemoteError,
  UnexpectedResponseError,
  Unimplemented,
} from './errors';
import type {
  CompanyType,
  MovieBackdropImageType,
  MovieCastCreditType,
  MovieCreditsType,
  MovieCrewCreditType,
  MoviePosterImageType,
  MovieType,
  MovieVideoType,
  PersonType,
} from './types';

type QueryType = Readonly<Record<string, string | number | null>>;

interface ErrorResponse {
  readonly status_code: number;
  readonly status_message: string;
}

interface MovieResponse extends Omit<MovieType, 'genres'> {
  readonly genres: readonly Readonly<{
    name: string;
  }>[];
}

interface FindResponse {
  readonly movieResults: readonly Readonly<{
    id: number;
  }>[];
  readonly personResults: readonly Readonly<{
    id: number;
  }>[];
}

const log = Logger.child({
  namespace: 'Tmdb',
});

const maximumRateLimitRetries = 3;

const maximumRateLimitDelayMilliseconds = 60_000;

const getRateLimitDelayMilliseconds = (headers: Headers): number => {
  const retryAfter = headers.get('retry-after');

  if (retryAfter !== null) {
    const retryAfterSeconds = Number(retryAfter);

    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
      return Math.min(retryAfterSeconds * 1_000, maximumRateLimitDelayMilliseconds);
    }

    const retryAfterDate = Date.parse(retryAfter);

    if (Number.isFinite(retryAfterDate)) {
      return Math.min(
        Math.max(retryAfterDate - Date.now(), 0),
        maximumRateLimitDelayMilliseconds,
      );
    }
  }

  const rateLimitReset = Number(headers.get('x-ratelimit-reset'));

  if (Number.isFinite(rateLimitReset) && rateLimitReset > 0) {
    return Math.min(
      Math.max(rateLimitReset * 1_000 - Date.now(), 0),
      maximumRateLimitDelayMilliseconds,
    );
  }

  return 30_000;
};

const deepCamelCaseKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => deepCamelCaseKeys(item));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => {
        return [
          camelCase(key),
          deepCamelCaseKeys(nestedValue),
        ];
      }),
    );
  }

  return value;
};

class Tmdb {
  public apiKey: string;

  public language: string;

  public constructor(apiKey: string, language = 'en') {
    this.apiKey = apiKey;
    this.language = language;
  }

  public async get<T = Record<string, unknown>>(
    resource: string,
    parameters: QueryType = {},
  ): Promise<T> {
    let rateLimitRetries = 0;

    while (true) {
      const url = new URL('https://api.themoviedb.org/3/' + resource);

      url.searchParams.set('api_key', this.apiKey);

      for (const [name, value] of Object.entries(parameters)) {
        url.searchParams.set(name, String(value));
      }

      const response = await fetch(url);
      const responseBody: unknown = await response.json();

      if (!response.ok) {
        if (response.status === 429 && rateLimitRetries < maximumRateLimitRetries) {
          const delayMilliseconds = getRateLimitDelayMilliseconds(response.headers);

          rateLimitRetries += 1;

          log.debug(
            'reached rate limit; waiting %d milliseconds before retry %d',
            delayMilliseconds,
            rateLimitRetries,
          );

          await timers.setTimeout(delayMilliseconds);

          continue;
        }

        if (response.status === 404) {
          throw new NotFoundError();
        }

        const errorResponse = responseBody as ErrorResponse;

        throw new RemoteError(errorResponse.status_message, errorResponse.status_code);
      }

      return deepCamelCaseKeys(responseBody) as T;
    }
  }

  public async getMovie(movieId: number): Promise<MovieType> {
    const movie = await this.get<MovieResponse>('movie/' + movieId, {
      language: this.language,
    });

    return {
      ...movie,
      genres: movie.genres.map((genre) => genre.name),
      revenue: movie.revenue === 0 ? null : movie.revenue,
      runtime: movie.runtime === 0 ? null : movie.runtime,
    };
  }

  public async getMovieBackdropImages(
    movieId: number,
    includeImageLanguage: readonly string[] | null = null,
  ): Promise<readonly MovieBackdropImageType[]> {
    const movie = await this.get<{
      readonly backdrops: readonly MovieBackdropImageType[];
    }>('movie/' + movieId + '/images', {
      include_image_language: includeImageLanguage === null ? null : includeImageLanguage.join(','),
      language: this.language,
    });

    return movie.backdrops;
  }

  public async getMovieCastCredits(movieId: number): Promise<readonly MovieCastCreditType[]> {
    const movieCredits = await this.get<{
      readonly cast: readonly MovieCastCreditType[];
    }>('movie/' + movieId + '/credits', {
      language: this.language,
    });

    return movieCredits.cast;
  }

  public async getMovieCrewCredits(movieId: number): Promise<readonly MovieCrewCreditType[]> {
    const movieCredits = await this.get<{
      readonly crew: readonly MovieCrewCreditType[];
    }>('movie/' + movieId + '/credits', {
      language: this.language,
    });

    return movieCredits.crew;
  }

  public async getMoviePosterImages(
    movieId: number,
    includeImageLanguage: readonly string[] | null = null,
  ): Promise<readonly MoviePosterImageType[]> {
    const movie = await this.get<{
      readonly posters: readonly MoviePosterImageType[];
    }>('movie/' + movieId + '/images', {
      include_image_language: includeImageLanguage === null ? null : includeImageLanguage.join(','),
      language: this.language,
    });

    return movie.posters;
  }

  public async getMovieVideos(movieId: number): Promise<readonly MovieVideoType[]> {
    const movie = await this.get<{
      readonly results: readonly MovieVideoType[];
    }>('movie/' + movieId + '/videos', {
      language: this.language,
    });

    return movie.results;
  }

  public async getPerson(personId: number): Promise<PersonType> {
    return this.get<PersonType>('person/' + personId, {
      language: this.language,
    });
  }

  public async getPersonMovieCredits(personId: number): Promise<MovieCreditsType> {
    return this.get<MovieCreditsType>('person/' + personId + '/movie_credits', {
      language: this.language,
    });
  }

  public async getCompany(companyId: number): Promise<CompanyType> {
    return this.get<CompanyType>('company/' + companyId, {
      language: this.language,
    });
  }

  public async findId(
    resourceType: 'movie' | 'person',
    externalSource: 'imdb',
    externalId: string,
  ): Promise<number> {
    if (resourceType !== 'movie' && resourceType !== 'person') {
      throw new Unimplemented();
    }

    if (externalSource !== 'imdb') {
      throw new Unimplemented();
    }

    const result = await this.get<FindResponse>('find/' + externalId, {
      external_source: externalSource + '_id',
    });
    const results = resourceType === 'movie' ? result.movieResults : result.personResults;

    if (results.length === 0) {
      throw new NotFoundError();
    }

    if (results.length > 1) {
      throw new UnexpectedResponseError();
    }

    return Number(results[0]?.id);
  }
}

export default Tmdb;

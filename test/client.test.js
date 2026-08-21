'use strict';

const assert = require('node:assert/strict');
const {
  afterEach,
  describe,
  it,
} = require('node:test');
const nock = require('nock');
const {
  NotFoundError,
  RemoteError,
  Tmdb,
  TmdbError,
} = require('../dist');
const {
  UnexpectedResponseError,
} = require('../dist/errors');

nock.disableNetConnect();

afterEach(() => {
  const pendingMocks = nock.pendingMocks();

  nock.cleanAll();

  assert.deepEqual(pendingMocks, []);
});

describe('package exports', () => {
  it('exports the client and public error classes', () => {
    const sdk = require('../dist');

    assert.deepEqual(Object.keys(sdk).sort(), [
      'NotFoundError',
      'RemoteError',
      'Tmdb',
      'TmdbError',
    ]);
  });

  it('supports the documented named import from an ES module', async () => {
    const sdk = await import('../dist/index.js');

    assert.equal(typeof sdk.Tmdb, 'function');
    assert.equal(sdk.Tmdb, Tmdb);
    assert.equal(sdk.NotFoundError, NotFoundError);
    assert.equal(sdk.RemoteError, RemoteError);
    assert.equal(sdk.TmdbError, TmdbError);
  });
});

describe('Tmdb.get', () => {
  it('authenticates with the API key and deeply camel-cases response keys', async () => {
    const scope = nock('https://api.themoviedb.org')
      .get('/3/search/movie')
      .query({
        api_key: 'api-key',
        query: 'The Terminator',
      })
      .reply(200, {
        nested_value: {
          original_title: 'The Terminator',
        },
        page_number: 1,
        results: [{
          genre_ids: [28, 53],
          movie_id: 218,
        }],
      });

    const tmdb = new Tmdb('api-key');
    const result = await tmdb.get('search/movie', {
      query: 'The Terminator',
    });

    assert.equal(scope.isDone(), true);
    assert.deepEqual(result, {
      nestedValue: {
        originalTitle: 'The Terminator',
      },
      pageNumber: 1,
      results: [{
        genreIds: [28, 53],
        movieId: 218,
      }],
    });
  });

  it('serializes null query values using the legacy Got behavior', async () => {
    const scope = nock('https://api.themoviedb.org')
      .get('/3/search/movie')
      .query({
        api_key: 'api-key',
        include_adult: 'null',
      })
      .reply(200, {
        results: [],
      });

    const tmdb = new Tmdb('api-key');
    const result = await tmdb.get('search/movie', {
      include_adult: null,
    });

    assert.equal(scope.isDone(), true);
    assert.deepEqual(result, {
      results: [],
    });
  });

  it('throws NotFoundError for a 404 response', async () => {
    nock('https://api.themoviedb.org')
      .get('/3/movie/0')
      .query({
        api_key: 'api-key',
      })
      .reply(404, {
        status_code: 34,
        status_message: 'The resource you requested could not be found.',
      });

    const tmdb = new Tmdb('api-key');

    await assert.rejects(
      tmdb.get('movie/0'),
      (error) => {
        assert.equal(error instanceof Error, true);
        assert.equal(error instanceof TmdbError, true);
        assert.equal(error instanceof NotFoundError, true);
        assert.equal(error.message, 'Resource not found.');

        return true;
      },
    );
  });

  it('throws RemoteError with the TMDb code and message for other failures', async () => {
    nock('https://api.themoviedb.org')
      .get('/3/authentication')
      .query({
        api_key: 'bad-key',
      })
      .reply(401, {
        status_code: 7,
        status_message: 'Invalid API key.',
        success: false,
      });

    const tmdb = new Tmdb('bad-key');

    await assert.rejects(
      tmdb.get('authentication'),
      (error) => {
        assert.equal(error instanceof TmdbError, true);
        assert.equal(error instanceof RemoteError, true);
        assert.equal(error.code, 7);
        assert.equal(error.message, 'Invalid API key.');

        return true;
      },
    );
  });

  it('retries a 429 response using Retry-After before succeeding', async () => {
    const rateLimitScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218')
      .query({
        api_key: 'api-key',
      })
      .reply(429, {
        status_code: 25,
        status_message: 'Too many requests.',
      }, {
        'retry-after': '0',
      });
    const successScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218')
      .query({
        api_key: 'api-key',
      })
      .reply(200, {
        id: 218,
      });

    const tmdb = new Tmdb('api-key');
    const movie = await tmdb.get('movie/218');

    assert.equal(rateLimitScope.isDone(), true);
    assert.equal(successScope.isDone(), true);
    assert.equal(movie.id, 218);
  });

  it('supports TMDb\'s legacy rate-limit reset header', async () => {
    const rateLimitScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218')
      .query({
        api_key: 'api-key',
      })
      .reply(429, {
        status_code: 25,
        status_message: 'Too many requests.',
      }, {
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1_000)),
      });
    const successScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218')
      .query({
        api_key: 'api-key',
      })
      .reply(200, {
        id: 218,
      });

    const tmdb = new Tmdb('api-key');
    const movie = await tmdb.get('movie/218');

    assert.equal(rateLimitScope.isDone(), true);
    assert.equal(successScope.isDone(), true);
    assert.equal(movie.id, 218);
  });

  it('stops retrying after three consecutive 429 responses', async () => {
    const scope = nock('https://api.themoviedb.org')
      .get('/3/movie/218')
      .query({
        api_key: 'api-key',
      })
      .times(4)
      .reply(429, {
        status_code: 25,
        status_message: 'Too many requests.',
      }, {
        'retry-after': '0',
      });

    const tmdb = new Tmdb('api-key');

    await assert.rejects(
      tmdb.get('movie/218'),
      (error) => {
        assert.equal(error instanceof RemoteError, true);
        assert.equal(error.code, 25);
        assert.equal(error.message, 'Too many requests.');

        return true;
      },
    );

    assert.equal(scope.isDone(), true);
  });
});

describe('Tmdb resource methods', () => {
  it('uses English by default and normalizes movie genres and zero values', async () => {
    const scope = nock('https://api.themoviedb.org')
      .get('/3/movie/218')
      .query({
        api_key: 'api-key',
        language: 'en',
      })
      .reply(200, {
        genres: [
          {
            id: 28,
            name: 'Action',
          },
          {
            id: 53,
            name: 'Thriller',
          },
        ],
        id: 218,
        imdb_id: 'tt0088247',
        revenue: 0,
        runtime: 0,
      });

    const tmdb = new Tmdb('api-key');
    const movie = await tmdb.getMovie(218);

    assert.equal(scope.isDone(), true);
    assert.deepEqual(movie.genres, ['Action', 'Thriller']);
    assert.equal(movie.id, 218);
    assert.equal(movie.imdbId, 'tt0088247');
    assert.equal(movie.revenue, null);
    assert.equal(movie.runtime, null);
  });

  it('passes the configured language to person and company requests', async () => {
    const personScope = nock('https://api.themoviedb.org')
      .get('/3/person/500')
      .query({
        api_key: 'api-key',
        language: 'fr',
      })
      .reply(200, {
        id: 500,
        name: 'Tom Cruise',
      });
    const companyScope = nock('https://api.themoviedb.org')
      .get('/3/company/4')
      .query({
        api_key: 'api-key',
        language: 'fr',
      })
      .reply(200, {
        id: 4,
        name: 'Paramount Pictures',
        origin_country: 'US',
      });

    const tmdb = new Tmdb('api-key', 'fr');
    const person = await tmdb.getPerson(500);
    const company = await tmdb.getCompany(4);

    assert.equal(personScope.isDone(), true);
    assert.equal(companyScope.isDone(), true);
    assert.equal(person.name, 'Tom Cruise');
    assert.equal(company.name, 'Paramount Pictures');
    assert.equal(company.originCountry, 'US');
  });

  it('retrieves movie images with the requested image languages', async () => {
    const backdropScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218/images')
      .query({
        api_key: 'api-key',
        include_image_language: 'en,null',
        language: 'en',
      })
      .reply(200, {
        backdrops: [{
          file_path: '/backdrop.jpg',
        }],
      });
    const posterScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218/images')
      .query({
        api_key: 'api-key',
        include_image_language: 'fr',
        language: 'en',
      })
      .reply(200, {
        posters: [{
          file_path: '/poster.jpg',
        }],
      });

    const tmdb = new Tmdb('api-key');
    const backdrops = await tmdb.getMovieBackdropImages(218, ['en', 'null']);
    const posters = await tmdb.getMoviePosterImages(218, ['fr']);

    assert.equal(backdropScope.isDone(), true);
    assert.equal(posterScope.isDone(), true);
    assert.equal(backdrops[0].filePath, '/backdrop.jpg');
    assert.equal(posters[0].filePath, '/poster.jpg');
  });

  it('preserves the legacy null image-language query when languages are omitted', async () => {
    const backdropScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218/images')
      .query({
        api_key: 'api-key',
        include_image_language: 'null',
        language: 'en',
      })
      .reply(200, {
        backdrops: [],
      });
    const posterScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218/images')
      .query({
        api_key: 'api-key',
        include_image_language: 'null',
        language: 'en',
      })
      .reply(200, {
        posters: [],
      });

    const tmdb = new Tmdb('api-key');
    const backdrops = await tmdb.getMovieBackdropImages(218);
    const posters = await tmdb.getMoviePosterImages(218);

    assert.equal(backdropScope.isDone(), true);
    assert.equal(posterScope.isDone(), true);
    assert.deepEqual(backdrops, []);
    assert.deepEqual(posters, []);
  });

  it('retrieves movie credits and videos', async () => {
    const castScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218/credits')
      .query({
        api_key: 'api-key',
        language: 'en',
      })
      .reply(200, {
        cast: [{
          credit_id: 'cast-credit',
          id: 500,
        }],
      });
    const crewScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218/credits')
      .query({
        api_key: 'api-key',
        language: 'en',
      })
      .reply(200, {
        crew: [{
          credit_id: 'crew-credit',
          id: 2710,
        }],
      });
    const videosScope = nock('https://api.themoviedb.org')
      .get('/3/movie/218/videos')
      .query({
        api_key: 'api-key',
        language: 'en',
      })
      .reply(200, {
        results: [{
          id: 'video-id',
          site: 'YouTube',
        }],
      });

    const tmdb = new Tmdb('api-key');
    const cast = await tmdb.getMovieCastCredits(218);
    const crew = await tmdb.getMovieCrewCredits(218);
    const videos = await tmdb.getMovieVideos(218);

    assert.equal(castScope.isDone(), true);
    assert.equal(crewScope.isDone(), true);
    assert.equal(videosScope.isDone(), true);
    assert.equal(cast[0].creditId, 'cast-credit');
    assert.equal(crew[0].creditId, 'crew-credit');
    assert.equal(videos[0].site, 'YouTube');
  });

  it('retrieves a person\'s movie credits', async () => {
    const scope = nock('https://api.themoviedb.org')
      .get('/3/person/500/movie_credits')
      .query({
        api_key: 'api-key',
        language: 'en',
      })
      .reply(200, {
        cast: [{
          credit_id: 'cast-credit',
          id: 218,
        }],
        crew: [],
      });

    const tmdb = new Tmdb('api-key');
    const credits = await tmdb.getPersonMovieCredits(500);

    assert.equal(scope.isDone(), true);
    assert.equal(credits.cast[0].creditId, 'cast-credit');
    assert.deepEqual(credits.crew, []);
  });
});

describe('Tmdb.findId', () => {
  it('finds movie and person IDs using IMDb IDs', async () => {
    const movieScope = nock('https://api.themoviedb.org')
      .get('/3/find/tt0088247')
      .query({
        api_key: 'api-key',
        external_source: 'imdb_id',
      })
      .reply(200, {
        movie_results: [{
          id: 218,
        }],
      });
    const personScope = nock('https://api.themoviedb.org')
      .get('/3/find/nm0000129')
      .query({
        api_key: 'api-key',
        external_source: 'imdb_id',
      })
      .reply(200, {
        person_results: [{
          id: 500,
        }],
      });

    const tmdb = new Tmdb('api-key');

    assert.equal(await tmdb.findId('movie', 'imdb', 'tt0088247'), 218);
    assert.equal(await tmdb.findId('person', 'imdb', 'nm0000129'), 500);
    assert.equal(movieScope.isDone(), true);
    assert.equal(personScope.isDone(), true);
  });

  it('throws NotFoundError when the matching resource does not exist', async () => {
    nock('https://api.themoviedb.org')
      .get('/3/find/tt0')
      .query({
        api_key: 'api-key',
        external_source: 'imdb_id',
      })
      .reply(200, {
        movie_results: [],
      });

    const tmdb = new Tmdb('api-key');

    await assert.rejects(
      tmdb.findId('movie', 'imdb', 'tt0'),
      NotFoundError,
    );
  });

  it('throws UnexpectedResponseError when multiple resources match', async () => {
    nock('https://api.themoviedb.org')
      .get('/3/find/tt0088247')
      .query({
        api_key: 'api-key',
        external_source: 'imdb_id',
      })
      .reply(200, {
        movie_results: [
          {
            id: 218,
          },
          {
            id: 219,
          },
        ],
      });

    const tmdb = new Tmdb('api-key');

    await assert.rejects(
      tmdb.findId('movie', 'imdb', 'tt0088247'),
      UnexpectedResponseError,
    );
  });
});

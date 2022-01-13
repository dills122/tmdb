// @flow

import test from 'ava';
import nock from 'nock';
import Tmdb from '../../src/Tmdb';

test('finds TMDb credits for individual by person ID', async (t) => {
  const apiKey = 'foo';
  const tmdb = new Tmdb(apiKey);

  const scope = nock('https://api.themoviedb.org')
    .get('/3/person/50/movie_credits?api_key=foo&language=en')
    .reply(
      200,
      {
        cast: [],
        crew: [],
      },
      {
        'x-ratelimit-remaining': 1,
      },
    );

  const credits = await tmdb.getPersonMovieCredits(50);

  t.true(scope.isDone());

  t.true(credits.cast.length === 0);
  t.true(credits.crew.length === 0);
});

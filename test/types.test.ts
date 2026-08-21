import {
  Tmdb,
  type CompanyType,
  type MovieCreditsType,
  type MovieType,
} from '../dist';

const tmdb = new Tmdb('api-key', 'fr');

const movie: Promise<MovieType> = tmdb.getMovie(218);
const company: Promise<CompanyType> = tmdb.getCompany(4);
const credits: Promise<MovieCreditsType> = tmdb.getPersonMovieCredits(500);
const backdrops = tmdb.getMovieBackdropImages(218);
const posters = tmdb.getMoviePosterImages(218, null);
const search = tmdb.get<{
  readonly results: readonly Readonly<{
    id: number;
    originalTitle: string;
  }>[];
}>('search/movie', {
  query: 'The Terminator',
});

void movie;
void company;
void credits;
void backdrops;
void posters;
void search;

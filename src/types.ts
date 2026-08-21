export interface ErrorResponseType {
  readonly statusCode: number;
  readonly statusMessage: string;
}

export type ImagePathType = string | null;

export interface MovieBackdropImageType {
  readonly aspectRatio: number;
  readonly filePath: string;
  readonly height: number;
  readonly iso6391: null | string;
  readonly voteAverage: number;
  readonly voteCount: number;
  readonly width: number;
}

export interface MovieCastCreditType {
  readonly castId: number;
  readonly character: string;
  readonly creditId: string;
  readonly gender: number | null;
  readonly id: number;
  readonly name: string;
  readonly order: number;
  readonly profilePath: ImagePathType;
}

export interface MovieCrewCreditType {
  readonly creditId: string;
  readonly department: string;
  readonly gender: number | null;
  readonly id: number;
  readonly job: string;
  readonly name: string;
  readonly profilePath: ImagePathType;
}

export interface MoviePosterImageType {
  readonly aspectRatio: number;
  readonly filePath: string;
  readonly height: number;
  readonly iso6391: string | null;
  readonly voteAverage: number;
  readonly voteCount: number;
  readonly width: number;
}

export interface MovieType {
  readonly adult: boolean;
  readonly backdropPath: ImagePathType;
  readonly belongsToCollection: null | Readonly<Record<string, unknown>>;
  readonly budget: number;
  readonly genres: readonly string[];
  readonly homepage: string | null;
  readonly id: number;
  readonly imdbId: string | null;
  readonly originalLanguage: string;
  readonly originalTitle: string;
  readonly overview: string | null;
  readonly popularity: number;
  readonly posterPath: ImagePathType;
  readonly productionCompanies: readonly Readonly<{
    id: number;
    name: string;
  }>[];
  readonly productionCountries: readonly Readonly<{
    iso31661: string;
    name: string;
  }>[];
  readonly releaseDate: string;
  readonly revenue: number | null;
  readonly runtime: number | null;
  readonly spokenLanguages: readonly Readonly<{
    iso6391: string;
    name: string;
  }>[];
  readonly status: string;
  readonly tagline: string | null;
  readonly title: string;
  readonly video: boolean;
  readonly voteAverage: number;
  readonly voteCount: number;
}

export interface MovieVideoType {
  readonly id: string;
  readonly iso31661: string;
  readonly iso6391: string;
  readonly key: string;
  readonly name: string;
  readonly site: string;
  readonly size: number;
  readonly type: string;
}

export interface PersonType {
  readonly adult: boolean;
  readonly alsoKnownAs: readonly Readonly<Record<string, unknown>>[];
  readonly biography: string;
  readonly birthday: string | null;
  readonly deathday: string | null;
  readonly gender: number;
  readonly homepage: string | null;
  readonly id: number;
  readonly imdbId: string;
  readonly name: string;
  readonly placeOfBirth: string | null;
  readonly popularity: number;
  readonly profilePath: ImagePathType;
}

export interface CompanyType {
  readonly description: string;
  readonly headquarters: string;
  readonly homepage: string;
  readonly id: number;
  readonly logoPath: string;
  readonly name: string;
  readonly originCountry: string;
  readonly parentCompany: null | CompanyType;
}

export interface CastType {
  readonly character: string;
  readonly creditId: string;
  readonly releaseDate: string;
  readonly id: number;
  readonly name: string;
  readonly title: string;
  readonly overview: string;
  readonly posterPath: string;
  readonly popularity: number;
  readonly voteAverage: number;
}

export interface CrewType {
  readonly department: string;
  readonly creditId: string;
  readonly releaseDate: string;
  readonly id: number;
  readonly name: string;
  readonly title: string;
  readonly overview: string;
  readonly posterPath: string;
  readonly popularity: number;
  readonly voteAverage: number;
}

export interface MovieCreditsType {
  readonly cast: readonly CastType[];
  readonly crew: readonly CrewType[];
}

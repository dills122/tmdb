export class TmdbError extends Error {
  public constructor(message = '') {
    super(message);

    this.name = new.target.name;
  }
}

export class Unimplemented extends TmdbError {
  public constructor() {
    super('Method/ behaviour is not implemented.');
  }
}

export class UnexpectedResponseError extends TmdbError {
  public constructor() {
    super('Remote service produced an unexpected response.');
  }
}

export class NotFoundError extends TmdbError {
  public constructor() {
    super('Resource not found.');
  }
}

export class RemoteError extends TmdbError {
  public code: number;

  public constructor(message: string, code: number) {
    super(message);

    this.code = code;
  }
}

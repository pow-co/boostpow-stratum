export interface StreamQuery {
  type: string;
  payload?: any;
  error?: boolean;
  namespace?: string;
  start?: Date;
}

import { Readable } from "stream";

export class LogStream extends Readable {
  query: StreamQuery;

  offset: 0;

  limit: 100;

  constructor(query: StreamQuery) {
    super();

    this.query = query;
  }
}

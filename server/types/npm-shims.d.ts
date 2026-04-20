declare module "bcrypt" {
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
  export function hash(data: string, saltOrRounds: string | number): Promise<string>;

  const bcrypt: {
    compare: typeof compare;
    genSalt: typeof genSalt;
    hash: typeof hash;
  };

  export default bcrypt;
}

declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    [key: string]: unknown;
  }

  export interface QueryResult<
    Row extends Record<string, unknown> = Record<string, unknown>,
  > {
    rows: Row[];
    rowCount: number | null;
    fields: unknown[];
  }

  export interface PoolClient {
    query<Row extends Record<string, unknown> = Record<string, unknown>>(
      ...args: unknown[]
    ): Promise<QueryResult<Row>>;
    release(err?: Error | boolean): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    on(event: string, listener: (...args: unknown[]) => void): this;
    query<Row extends Record<string, unknown> = Record<string, unknown>>(
      ...args: unknown[]
    ): Promise<QueryResult<Row>>;
  }

  const pg: {
    Pool: typeof Pool;
  };

  export default pg;
}

declare module "nodemailer" {
  export interface Transporter {
    sendMail(options: Record<string, unknown>): Promise<unknown>;
  }

  export function createTransport(
    options: Record<string, unknown>,
  ): Transporter;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}

declare module "npm:nodemailer" {
  export * from "nodemailer";
  export { default } from "nodemailer";
}

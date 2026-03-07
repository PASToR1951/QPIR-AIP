
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Cluster
 * 
 */
export type Cluster = $Result.DefaultSelection<Prisma.$ClusterPayload>
/**
 * Model School
 * 
 */
export type School = $Result.DefaultSelection<Prisma.$SchoolPayload>
/**
 * Model Program
 * 
 */
export type Program = $Result.DefaultSelection<Prisma.$ProgramPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model AIP
 * 
 */
export type AIP = $Result.DefaultSelection<Prisma.$AIPPayload>
/**
 * Model AIPActivity
 * 
 */
export type AIPActivity = $Result.DefaultSelection<Prisma.$AIPActivityPayload>
/**
 * Model PIR
 * 
 */
export type PIR = $Result.DefaultSelection<Prisma.$PIRPayload>
/**
 * Model PIRActivityReview
 * 
 */
export type PIRActivityReview = $Result.DefaultSelection<Prisma.$PIRActivityReviewPayload>
/**
 * Model PIRFactor
 * 
 */
export type PIRFactor = $Result.DefaultSelection<Prisma.$PIRFactorPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Clusters
 * const clusters = await prisma.cluster.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more Clusters
   * const clusters = await prisma.cluster.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.cluster`: Exposes CRUD operations for the **Cluster** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Clusters
    * const clusters = await prisma.cluster.findMany()
    * ```
    */
  get cluster(): Prisma.ClusterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.school`: Exposes CRUD operations for the **School** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Schools
    * const schools = await prisma.school.findMany()
    * ```
    */
  get school(): Prisma.SchoolDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.program`: Exposes CRUD operations for the **Program** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Programs
    * const programs = await prisma.program.findMany()
    * ```
    */
  get program(): Prisma.ProgramDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.aIP`: Exposes CRUD operations for the **AIP** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AIPS
    * const aIPS = await prisma.aIP.findMany()
    * ```
    */
  get aIP(): Prisma.AIPDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.aIPActivity`: Exposes CRUD operations for the **AIPActivity** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AIPActivities
    * const aIPActivities = await prisma.aIPActivity.findMany()
    * ```
    */
  get aIPActivity(): Prisma.AIPActivityDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pIR`: Exposes CRUD operations for the **PIR** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PIRS
    * const pIRS = await prisma.pIR.findMany()
    * ```
    */
  get pIR(): Prisma.PIRDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pIRActivityReview`: Exposes CRUD operations for the **PIRActivityReview** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PIRActivityReviews
    * const pIRActivityReviews = await prisma.pIRActivityReview.findMany()
    * ```
    */
  get pIRActivityReview(): Prisma.PIRActivityReviewDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pIRFactor`: Exposes CRUD operations for the **PIRFactor** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PIRFactors
    * const pIRFactors = await prisma.pIRFactor.findMany()
    * ```
    */
  get pIRFactor(): Prisma.PIRFactorDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.4.2
   * Query Engine version: 94a226be1cf2967af2541cca5529f0f7ba866919
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Cluster: 'Cluster',
    School: 'School',
    Program: 'Program',
    User: 'User',
    AIP: 'AIP',
    AIPActivity: 'AIPActivity',
    PIR: 'PIR',
    PIRActivityReview: 'PIRActivityReview',
    PIRFactor: 'PIRFactor'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "cluster" | "school" | "program" | "user" | "aIP" | "aIPActivity" | "pIR" | "pIRActivityReview" | "pIRFactor"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Cluster: {
        payload: Prisma.$ClusterPayload<ExtArgs>
        fields: Prisma.ClusterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ClusterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ClusterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>
          }
          findFirst: {
            args: Prisma.ClusterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ClusterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>
          }
          findMany: {
            args: Prisma.ClusterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>[]
          }
          create: {
            args: Prisma.ClusterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>
          }
          createMany: {
            args: Prisma.ClusterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ClusterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>[]
          }
          delete: {
            args: Prisma.ClusterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>
          }
          update: {
            args: Prisma.ClusterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>
          }
          deleteMany: {
            args: Prisma.ClusterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ClusterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ClusterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>[]
          }
          upsert: {
            args: Prisma.ClusterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ClusterPayload>
          }
          aggregate: {
            args: Prisma.ClusterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCluster>
          }
          groupBy: {
            args: Prisma.ClusterGroupByArgs<ExtArgs>
            result: $Utils.Optional<ClusterGroupByOutputType>[]
          }
          count: {
            args: Prisma.ClusterCountArgs<ExtArgs>
            result: $Utils.Optional<ClusterCountAggregateOutputType> | number
          }
        }
      }
      School: {
        payload: Prisma.$SchoolPayload<ExtArgs>
        fields: Prisma.SchoolFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SchoolFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SchoolFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>
          }
          findFirst: {
            args: Prisma.SchoolFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SchoolFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>
          }
          findMany: {
            args: Prisma.SchoolFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>[]
          }
          create: {
            args: Prisma.SchoolCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>
          }
          createMany: {
            args: Prisma.SchoolCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SchoolCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>[]
          }
          delete: {
            args: Prisma.SchoolDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>
          }
          update: {
            args: Prisma.SchoolUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>
          }
          deleteMany: {
            args: Prisma.SchoolDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SchoolUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SchoolUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>[]
          }
          upsert: {
            args: Prisma.SchoolUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SchoolPayload>
          }
          aggregate: {
            args: Prisma.SchoolAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSchool>
          }
          groupBy: {
            args: Prisma.SchoolGroupByArgs<ExtArgs>
            result: $Utils.Optional<SchoolGroupByOutputType>[]
          }
          count: {
            args: Prisma.SchoolCountArgs<ExtArgs>
            result: $Utils.Optional<SchoolCountAggregateOutputType> | number
          }
        }
      }
      Program: {
        payload: Prisma.$ProgramPayload<ExtArgs>
        fields: Prisma.ProgramFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProgramFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProgramFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>
          }
          findFirst: {
            args: Prisma.ProgramFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProgramFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>
          }
          findMany: {
            args: Prisma.ProgramFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>[]
          }
          create: {
            args: Prisma.ProgramCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>
          }
          createMany: {
            args: Prisma.ProgramCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProgramCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>[]
          }
          delete: {
            args: Prisma.ProgramDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>
          }
          update: {
            args: Prisma.ProgramUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>
          }
          deleteMany: {
            args: Prisma.ProgramDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProgramUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProgramUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>[]
          }
          upsert: {
            args: Prisma.ProgramUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProgramPayload>
          }
          aggregate: {
            args: Prisma.ProgramAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProgram>
          }
          groupBy: {
            args: Prisma.ProgramGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProgramGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProgramCountArgs<ExtArgs>
            result: $Utils.Optional<ProgramCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      AIP: {
        payload: Prisma.$AIPPayload<ExtArgs>
        fields: Prisma.AIPFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AIPFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AIPFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>
          }
          findFirst: {
            args: Prisma.AIPFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AIPFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>
          }
          findMany: {
            args: Prisma.AIPFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>[]
          }
          create: {
            args: Prisma.AIPCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>
          }
          createMany: {
            args: Prisma.AIPCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AIPCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>[]
          }
          delete: {
            args: Prisma.AIPDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>
          }
          update: {
            args: Prisma.AIPUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>
          }
          deleteMany: {
            args: Prisma.AIPDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AIPUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AIPUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>[]
          }
          upsert: {
            args: Prisma.AIPUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPPayload>
          }
          aggregate: {
            args: Prisma.AIPAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAIP>
          }
          groupBy: {
            args: Prisma.AIPGroupByArgs<ExtArgs>
            result: $Utils.Optional<AIPGroupByOutputType>[]
          }
          count: {
            args: Prisma.AIPCountArgs<ExtArgs>
            result: $Utils.Optional<AIPCountAggregateOutputType> | number
          }
        }
      }
      AIPActivity: {
        payload: Prisma.$AIPActivityPayload<ExtArgs>
        fields: Prisma.AIPActivityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AIPActivityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AIPActivityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>
          }
          findFirst: {
            args: Prisma.AIPActivityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AIPActivityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>
          }
          findMany: {
            args: Prisma.AIPActivityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>[]
          }
          create: {
            args: Prisma.AIPActivityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>
          }
          createMany: {
            args: Prisma.AIPActivityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AIPActivityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>[]
          }
          delete: {
            args: Prisma.AIPActivityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>
          }
          update: {
            args: Prisma.AIPActivityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>
          }
          deleteMany: {
            args: Prisma.AIPActivityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AIPActivityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AIPActivityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>[]
          }
          upsert: {
            args: Prisma.AIPActivityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AIPActivityPayload>
          }
          aggregate: {
            args: Prisma.AIPActivityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAIPActivity>
          }
          groupBy: {
            args: Prisma.AIPActivityGroupByArgs<ExtArgs>
            result: $Utils.Optional<AIPActivityGroupByOutputType>[]
          }
          count: {
            args: Prisma.AIPActivityCountArgs<ExtArgs>
            result: $Utils.Optional<AIPActivityCountAggregateOutputType> | number
          }
        }
      }
      PIR: {
        payload: Prisma.$PIRPayload<ExtArgs>
        fields: Prisma.PIRFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PIRFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PIRFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>
          }
          findFirst: {
            args: Prisma.PIRFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PIRFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>
          }
          findMany: {
            args: Prisma.PIRFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>[]
          }
          create: {
            args: Prisma.PIRCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>
          }
          createMany: {
            args: Prisma.PIRCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PIRCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>[]
          }
          delete: {
            args: Prisma.PIRDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>
          }
          update: {
            args: Prisma.PIRUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>
          }
          deleteMany: {
            args: Prisma.PIRDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PIRUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PIRUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>[]
          }
          upsert: {
            args: Prisma.PIRUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRPayload>
          }
          aggregate: {
            args: Prisma.PIRAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePIR>
          }
          groupBy: {
            args: Prisma.PIRGroupByArgs<ExtArgs>
            result: $Utils.Optional<PIRGroupByOutputType>[]
          }
          count: {
            args: Prisma.PIRCountArgs<ExtArgs>
            result: $Utils.Optional<PIRCountAggregateOutputType> | number
          }
        }
      }
      PIRActivityReview: {
        payload: Prisma.$PIRActivityReviewPayload<ExtArgs>
        fields: Prisma.PIRActivityReviewFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PIRActivityReviewFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PIRActivityReviewFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>
          }
          findFirst: {
            args: Prisma.PIRActivityReviewFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PIRActivityReviewFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>
          }
          findMany: {
            args: Prisma.PIRActivityReviewFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>[]
          }
          create: {
            args: Prisma.PIRActivityReviewCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>
          }
          createMany: {
            args: Prisma.PIRActivityReviewCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PIRActivityReviewCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>[]
          }
          delete: {
            args: Prisma.PIRActivityReviewDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>
          }
          update: {
            args: Prisma.PIRActivityReviewUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>
          }
          deleteMany: {
            args: Prisma.PIRActivityReviewDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PIRActivityReviewUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PIRActivityReviewUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>[]
          }
          upsert: {
            args: Prisma.PIRActivityReviewUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRActivityReviewPayload>
          }
          aggregate: {
            args: Prisma.PIRActivityReviewAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePIRActivityReview>
          }
          groupBy: {
            args: Prisma.PIRActivityReviewGroupByArgs<ExtArgs>
            result: $Utils.Optional<PIRActivityReviewGroupByOutputType>[]
          }
          count: {
            args: Prisma.PIRActivityReviewCountArgs<ExtArgs>
            result: $Utils.Optional<PIRActivityReviewCountAggregateOutputType> | number
          }
        }
      }
      PIRFactor: {
        payload: Prisma.$PIRFactorPayload<ExtArgs>
        fields: Prisma.PIRFactorFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PIRFactorFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PIRFactorFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>
          }
          findFirst: {
            args: Prisma.PIRFactorFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PIRFactorFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>
          }
          findMany: {
            args: Prisma.PIRFactorFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>[]
          }
          create: {
            args: Prisma.PIRFactorCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>
          }
          createMany: {
            args: Prisma.PIRFactorCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PIRFactorCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>[]
          }
          delete: {
            args: Prisma.PIRFactorDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>
          }
          update: {
            args: Prisma.PIRFactorUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>
          }
          deleteMany: {
            args: Prisma.PIRFactorDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PIRFactorUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PIRFactorUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>[]
          }
          upsert: {
            args: Prisma.PIRFactorUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PIRFactorPayload>
          }
          aggregate: {
            args: Prisma.PIRFactorAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePIRFactor>
          }
          groupBy: {
            args: Prisma.PIRFactorGroupByArgs<ExtArgs>
            result: $Utils.Optional<PIRFactorGroupByOutputType>[]
          }
          count: {
            args: Prisma.PIRFactorCountArgs<ExtArgs>
            result: $Utils.Optional<PIRFactorCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    cluster?: ClusterOmit
    school?: SchoolOmit
    program?: ProgramOmit
    user?: UserOmit
    aIP?: AIPOmit
    aIPActivity?: AIPActivityOmit
    pIR?: PIROmit
    pIRActivityReview?: PIRActivityReviewOmit
    pIRFactor?: PIRFactorOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ClusterCountOutputType
   */

  export type ClusterCountOutputType = {
    schools: number
  }

  export type ClusterCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    schools?: boolean | ClusterCountOutputTypeCountSchoolsArgs
  }

  // Custom InputTypes
  /**
   * ClusterCountOutputType without action
   */
  export type ClusterCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ClusterCountOutputType
     */
    select?: ClusterCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ClusterCountOutputType without action
   */
  export type ClusterCountOutputTypeCountSchoolsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SchoolWhereInput
  }


  /**
   * Count Type SchoolCountOutputType
   */

  export type SchoolCountOutputType = {
    aips: number
    restricted_programs: number
  }

  export type SchoolCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aips?: boolean | SchoolCountOutputTypeCountAipsArgs
    restricted_programs?: boolean | SchoolCountOutputTypeCountRestricted_programsArgs
  }

  // Custom InputTypes
  /**
   * SchoolCountOutputType without action
   */
  export type SchoolCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SchoolCountOutputType
     */
    select?: SchoolCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SchoolCountOutputType without action
   */
  export type SchoolCountOutputTypeCountAipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AIPWhereInput
  }

  /**
   * SchoolCountOutputType without action
   */
  export type SchoolCountOutputTypeCountRestricted_programsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProgramWhereInput
  }


  /**
   * Count Type ProgramCountOutputType
   */

  export type ProgramCountOutputType = {
    aips: number
    personnel: number
    restricted_schools: number
  }

  export type ProgramCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aips?: boolean | ProgramCountOutputTypeCountAipsArgs
    personnel?: boolean | ProgramCountOutputTypeCountPersonnelArgs
    restricted_schools?: boolean | ProgramCountOutputTypeCountRestricted_schoolsArgs
  }

  // Custom InputTypes
  /**
   * ProgramCountOutputType without action
   */
  export type ProgramCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProgramCountOutputType
     */
    select?: ProgramCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProgramCountOutputType without action
   */
  export type ProgramCountOutputTypeCountAipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AIPWhereInput
  }

  /**
   * ProgramCountOutputType without action
   */
  export type ProgramCountOutputTypeCountPersonnelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
  }

  /**
   * ProgramCountOutputType without action
   */
  export type ProgramCountOutputTypeCountRestricted_schoolsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SchoolWhereInput
  }


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    programs: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    programs?: boolean | UserCountOutputTypeCountProgramsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountProgramsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProgramWhereInput
  }


  /**
   * Count Type AIPCountOutputType
   */

  export type AIPCountOutputType = {
    activities: number
    pirs: number
  }

  export type AIPCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    activities?: boolean | AIPCountOutputTypeCountActivitiesArgs
    pirs?: boolean | AIPCountOutputTypeCountPirsArgs
  }

  // Custom InputTypes
  /**
   * AIPCountOutputType without action
   */
  export type AIPCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPCountOutputType
     */
    select?: AIPCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AIPCountOutputType without action
   */
  export type AIPCountOutputTypeCountActivitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AIPActivityWhereInput
  }

  /**
   * AIPCountOutputType without action
   */
  export type AIPCountOutputTypeCountPirsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PIRWhereInput
  }


  /**
   * Count Type AIPActivityCountOutputType
   */

  export type AIPActivityCountOutputType = {
    pir_reviews: number
  }

  export type AIPActivityCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pir_reviews?: boolean | AIPActivityCountOutputTypeCountPir_reviewsArgs
  }

  // Custom InputTypes
  /**
   * AIPActivityCountOutputType without action
   */
  export type AIPActivityCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivityCountOutputType
     */
    select?: AIPActivityCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * AIPActivityCountOutputType without action
   */
  export type AIPActivityCountOutputTypeCountPir_reviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PIRActivityReviewWhereInput
  }


  /**
   * Count Type PIRCountOutputType
   */

  export type PIRCountOutputType = {
    activity_reviews: number
    factors: number
  }

  export type PIRCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    activity_reviews?: boolean | PIRCountOutputTypeCountActivity_reviewsArgs
    factors?: boolean | PIRCountOutputTypeCountFactorsArgs
  }

  // Custom InputTypes
  /**
   * PIRCountOutputType without action
   */
  export type PIRCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRCountOutputType
     */
    select?: PIRCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * PIRCountOutputType without action
   */
  export type PIRCountOutputTypeCountActivity_reviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PIRActivityReviewWhereInput
  }

  /**
   * PIRCountOutputType without action
   */
  export type PIRCountOutputTypeCountFactorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PIRFactorWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Cluster
   */

  export type AggregateCluster = {
    _count: ClusterCountAggregateOutputType | null
    _avg: ClusterAvgAggregateOutputType | null
    _sum: ClusterSumAggregateOutputType | null
    _min: ClusterMinAggregateOutputType | null
    _max: ClusterMaxAggregateOutputType | null
  }

  export type ClusterAvgAggregateOutputType = {
    id: number | null
    cluster_number: number | null
  }

  export type ClusterSumAggregateOutputType = {
    id: number | null
    cluster_number: number | null
  }

  export type ClusterMinAggregateOutputType = {
    id: number | null
    cluster_number: number | null
    name: string | null
  }

  export type ClusterMaxAggregateOutputType = {
    id: number | null
    cluster_number: number | null
    name: string | null
  }

  export type ClusterCountAggregateOutputType = {
    id: number
    cluster_number: number
    name: number
    _all: number
  }


  export type ClusterAvgAggregateInputType = {
    id?: true
    cluster_number?: true
  }

  export type ClusterSumAggregateInputType = {
    id?: true
    cluster_number?: true
  }

  export type ClusterMinAggregateInputType = {
    id?: true
    cluster_number?: true
    name?: true
  }

  export type ClusterMaxAggregateInputType = {
    id?: true
    cluster_number?: true
    name?: true
  }

  export type ClusterCountAggregateInputType = {
    id?: true
    cluster_number?: true
    name?: true
    _all?: true
  }

  export type ClusterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Cluster to aggregate.
     */
    where?: ClusterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Clusters to fetch.
     */
    orderBy?: ClusterOrderByWithRelationInput | ClusterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ClusterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Clusters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Clusters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Clusters
    **/
    _count?: true | ClusterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ClusterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ClusterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ClusterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ClusterMaxAggregateInputType
  }

  export type GetClusterAggregateType<T extends ClusterAggregateArgs> = {
        [P in keyof T & keyof AggregateCluster]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCluster[P]>
      : GetScalarType<T[P], AggregateCluster[P]>
  }




  export type ClusterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ClusterWhereInput
    orderBy?: ClusterOrderByWithAggregationInput | ClusterOrderByWithAggregationInput[]
    by: ClusterScalarFieldEnum[] | ClusterScalarFieldEnum
    having?: ClusterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ClusterCountAggregateInputType | true
    _avg?: ClusterAvgAggregateInputType
    _sum?: ClusterSumAggregateInputType
    _min?: ClusterMinAggregateInputType
    _max?: ClusterMaxAggregateInputType
  }

  export type ClusterGroupByOutputType = {
    id: number
    cluster_number: number
    name: string
    _count: ClusterCountAggregateOutputType | null
    _avg: ClusterAvgAggregateOutputType | null
    _sum: ClusterSumAggregateOutputType | null
    _min: ClusterMinAggregateOutputType | null
    _max: ClusterMaxAggregateOutputType | null
  }

  type GetClusterGroupByPayload<T extends ClusterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ClusterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ClusterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ClusterGroupByOutputType[P]>
            : GetScalarType<T[P], ClusterGroupByOutputType[P]>
        }
      >
    >


  export type ClusterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cluster_number?: boolean
    name?: boolean
    schools?: boolean | Cluster$schoolsArgs<ExtArgs>
    _count?: boolean | ClusterCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["cluster"]>

  export type ClusterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cluster_number?: boolean
    name?: boolean
  }, ExtArgs["result"]["cluster"]>

  export type ClusterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    cluster_number?: boolean
    name?: boolean
  }, ExtArgs["result"]["cluster"]>

  export type ClusterSelectScalar = {
    id?: boolean
    cluster_number?: boolean
    name?: boolean
  }

  export type ClusterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "cluster_number" | "name", ExtArgs["result"]["cluster"]>
  export type ClusterInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    schools?: boolean | Cluster$schoolsArgs<ExtArgs>
    _count?: boolean | ClusterCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ClusterIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ClusterIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ClusterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Cluster"
    objects: {
      schools: Prisma.$SchoolPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      cluster_number: number
      name: string
    }, ExtArgs["result"]["cluster"]>
    composites: {}
  }

  type ClusterGetPayload<S extends boolean | null | undefined | ClusterDefaultArgs> = $Result.GetResult<Prisma.$ClusterPayload, S>

  type ClusterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ClusterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ClusterCountAggregateInputType | true
    }

  export interface ClusterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Cluster'], meta: { name: 'Cluster' } }
    /**
     * Find zero or one Cluster that matches the filter.
     * @param {ClusterFindUniqueArgs} args - Arguments to find a Cluster
     * @example
     * // Get one Cluster
     * const cluster = await prisma.cluster.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ClusterFindUniqueArgs>(args: SelectSubset<T, ClusterFindUniqueArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Cluster that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ClusterFindUniqueOrThrowArgs} args - Arguments to find a Cluster
     * @example
     * // Get one Cluster
     * const cluster = await prisma.cluster.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ClusterFindUniqueOrThrowArgs>(args: SelectSubset<T, ClusterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Cluster that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClusterFindFirstArgs} args - Arguments to find a Cluster
     * @example
     * // Get one Cluster
     * const cluster = await prisma.cluster.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ClusterFindFirstArgs>(args?: SelectSubset<T, ClusterFindFirstArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Cluster that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClusterFindFirstOrThrowArgs} args - Arguments to find a Cluster
     * @example
     * // Get one Cluster
     * const cluster = await prisma.cluster.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ClusterFindFirstOrThrowArgs>(args?: SelectSubset<T, ClusterFindFirstOrThrowArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Clusters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClusterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Clusters
     * const clusters = await prisma.cluster.findMany()
     * 
     * // Get first 10 Clusters
     * const clusters = await prisma.cluster.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const clusterWithIdOnly = await prisma.cluster.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ClusterFindManyArgs>(args?: SelectSubset<T, ClusterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Cluster.
     * @param {ClusterCreateArgs} args - Arguments to create a Cluster.
     * @example
     * // Create one Cluster
     * const Cluster = await prisma.cluster.create({
     *   data: {
     *     // ... data to create a Cluster
     *   }
     * })
     * 
     */
    create<T extends ClusterCreateArgs>(args: SelectSubset<T, ClusterCreateArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Clusters.
     * @param {ClusterCreateManyArgs} args - Arguments to create many Clusters.
     * @example
     * // Create many Clusters
     * const cluster = await prisma.cluster.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ClusterCreateManyArgs>(args?: SelectSubset<T, ClusterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Clusters and returns the data saved in the database.
     * @param {ClusterCreateManyAndReturnArgs} args - Arguments to create many Clusters.
     * @example
     * // Create many Clusters
     * const cluster = await prisma.cluster.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Clusters and only return the `id`
     * const clusterWithIdOnly = await prisma.cluster.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ClusterCreateManyAndReturnArgs>(args?: SelectSubset<T, ClusterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Cluster.
     * @param {ClusterDeleteArgs} args - Arguments to delete one Cluster.
     * @example
     * // Delete one Cluster
     * const Cluster = await prisma.cluster.delete({
     *   where: {
     *     // ... filter to delete one Cluster
     *   }
     * })
     * 
     */
    delete<T extends ClusterDeleteArgs>(args: SelectSubset<T, ClusterDeleteArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Cluster.
     * @param {ClusterUpdateArgs} args - Arguments to update one Cluster.
     * @example
     * // Update one Cluster
     * const cluster = await prisma.cluster.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ClusterUpdateArgs>(args: SelectSubset<T, ClusterUpdateArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Clusters.
     * @param {ClusterDeleteManyArgs} args - Arguments to filter Clusters to delete.
     * @example
     * // Delete a few Clusters
     * const { count } = await prisma.cluster.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ClusterDeleteManyArgs>(args?: SelectSubset<T, ClusterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Clusters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClusterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Clusters
     * const cluster = await prisma.cluster.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ClusterUpdateManyArgs>(args: SelectSubset<T, ClusterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Clusters and returns the data updated in the database.
     * @param {ClusterUpdateManyAndReturnArgs} args - Arguments to update many Clusters.
     * @example
     * // Update many Clusters
     * const cluster = await prisma.cluster.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Clusters and only return the `id`
     * const clusterWithIdOnly = await prisma.cluster.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ClusterUpdateManyAndReturnArgs>(args: SelectSubset<T, ClusterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Cluster.
     * @param {ClusterUpsertArgs} args - Arguments to update or create a Cluster.
     * @example
     * // Update or create a Cluster
     * const cluster = await prisma.cluster.upsert({
     *   create: {
     *     // ... data to create a Cluster
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Cluster we want to update
     *   }
     * })
     */
    upsert<T extends ClusterUpsertArgs>(args: SelectSubset<T, ClusterUpsertArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Clusters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClusterCountArgs} args - Arguments to filter Clusters to count.
     * @example
     * // Count the number of Clusters
     * const count = await prisma.cluster.count({
     *   where: {
     *     // ... the filter for the Clusters we want to count
     *   }
     * })
    **/
    count<T extends ClusterCountArgs>(
      args?: Subset<T, ClusterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ClusterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Cluster.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClusterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ClusterAggregateArgs>(args: Subset<T, ClusterAggregateArgs>): Prisma.PrismaPromise<GetClusterAggregateType<T>>

    /**
     * Group by Cluster.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ClusterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ClusterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ClusterGroupByArgs['orderBy'] }
        : { orderBy?: ClusterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ClusterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetClusterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Cluster model
   */
  readonly fields: ClusterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Cluster.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ClusterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    schools<T extends Cluster$schoolsArgs<ExtArgs> = {}>(args?: Subset<T, Cluster$schoolsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Cluster model
   */
  interface ClusterFieldRefs {
    readonly id: FieldRef<"Cluster", 'Int'>
    readonly cluster_number: FieldRef<"Cluster", 'Int'>
    readonly name: FieldRef<"Cluster", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Cluster findUnique
   */
  export type ClusterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * Filter, which Cluster to fetch.
     */
    where: ClusterWhereUniqueInput
  }

  /**
   * Cluster findUniqueOrThrow
   */
  export type ClusterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * Filter, which Cluster to fetch.
     */
    where: ClusterWhereUniqueInput
  }

  /**
   * Cluster findFirst
   */
  export type ClusterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * Filter, which Cluster to fetch.
     */
    where?: ClusterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Clusters to fetch.
     */
    orderBy?: ClusterOrderByWithRelationInput | ClusterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Clusters.
     */
    cursor?: ClusterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Clusters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Clusters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Clusters.
     */
    distinct?: ClusterScalarFieldEnum | ClusterScalarFieldEnum[]
  }

  /**
   * Cluster findFirstOrThrow
   */
  export type ClusterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * Filter, which Cluster to fetch.
     */
    where?: ClusterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Clusters to fetch.
     */
    orderBy?: ClusterOrderByWithRelationInput | ClusterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Clusters.
     */
    cursor?: ClusterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Clusters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Clusters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Clusters.
     */
    distinct?: ClusterScalarFieldEnum | ClusterScalarFieldEnum[]
  }

  /**
   * Cluster findMany
   */
  export type ClusterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * Filter, which Clusters to fetch.
     */
    where?: ClusterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Clusters to fetch.
     */
    orderBy?: ClusterOrderByWithRelationInput | ClusterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Clusters.
     */
    cursor?: ClusterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Clusters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Clusters.
     */
    skip?: number
    distinct?: ClusterScalarFieldEnum | ClusterScalarFieldEnum[]
  }

  /**
   * Cluster create
   */
  export type ClusterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * The data needed to create a Cluster.
     */
    data: XOR<ClusterCreateInput, ClusterUncheckedCreateInput>
  }

  /**
   * Cluster createMany
   */
  export type ClusterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Clusters.
     */
    data: ClusterCreateManyInput | ClusterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Cluster createManyAndReturn
   */
  export type ClusterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * The data used to create many Clusters.
     */
    data: ClusterCreateManyInput | ClusterCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Cluster update
   */
  export type ClusterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * The data needed to update a Cluster.
     */
    data: XOR<ClusterUpdateInput, ClusterUncheckedUpdateInput>
    /**
     * Choose, which Cluster to update.
     */
    where: ClusterWhereUniqueInput
  }

  /**
   * Cluster updateMany
   */
  export type ClusterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Clusters.
     */
    data: XOR<ClusterUpdateManyMutationInput, ClusterUncheckedUpdateManyInput>
    /**
     * Filter which Clusters to update
     */
    where?: ClusterWhereInput
    /**
     * Limit how many Clusters to update.
     */
    limit?: number
  }

  /**
   * Cluster updateManyAndReturn
   */
  export type ClusterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * The data used to update Clusters.
     */
    data: XOR<ClusterUpdateManyMutationInput, ClusterUncheckedUpdateManyInput>
    /**
     * Filter which Clusters to update
     */
    where?: ClusterWhereInput
    /**
     * Limit how many Clusters to update.
     */
    limit?: number
  }

  /**
   * Cluster upsert
   */
  export type ClusterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * The filter to search for the Cluster to update in case it exists.
     */
    where: ClusterWhereUniqueInput
    /**
     * In case the Cluster found by the `where` argument doesn't exist, create a new Cluster with this data.
     */
    create: XOR<ClusterCreateInput, ClusterUncheckedCreateInput>
    /**
     * In case the Cluster was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ClusterUpdateInput, ClusterUncheckedUpdateInput>
  }

  /**
   * Cluster delete
   */
  export type ClusterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
    /**
     * Filter which Cluster to delete.
     */
    where: ClusterWhereUniqueInput
  }

  /**
   * Cluster deleteMany
   */
  export type ClusterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Clusters to delete
     */
    where?: ClusterWhereInput
    /**
     * Limit how many Clusters to delete.
     */
    limit?: number
  }

  /**
   * Cluster.schools
   */
  export type Cluster$schoolsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    where?: SchoolWhereInput
    orderBy?: SchoolOrderByWithRelationInput | SchoolOrderByWithRelationInput[]
    cursor?: SchoolWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SchoolScalarFieldEnum | SchoolScalarFieldEnum[]
  }

  /**
   * Cluster without action
   */
  export type ClusterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Cluster
     */
    select?: ClusterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Cluster
     */
    omit?: ClusterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ClusterInclude<ExtArgs> | null
  }


  /**
   * Model School
   */

  export type AggregateSchool = {
    _count: SchoolCountAggregateOutputType | null
    _avg: SchoolAvgAggregateOutputType | null
    _sum: SchoolSumAggregateOutputType | null
    _min: SchoolMinAggregateOutputType | null
    _max: SchoolMaxAggregateOutputType | null
  }

  export type SchoolAvgAggregateOutputType = {
    id: number | null
    cluster_id: number | null
  }

  export type SchoolSumAggregateOutputType = {
    id: number | null
    cluster_id: number | null
  }

  export type SchoolMinAggregateOutputType = {
    id: number | null
    name: string | null
    level: string | null
    cluster_id: number | null
  }

  export type SchoolMaxAggregateOutputType = {
    id: number | null
    name: string | null
    level: string | null
    cluster_id: number | null
  }

  export type SchoolCountAggregateOutputType = {
    id: number
    name: number
    level: number
    cluster_id: number
    _all: number
  }


  export type SchoolAvgAggregateInputType = {
    id?: true
    cluster_id?: true
  }

  export type SchoolSumAggregateInputType = {
    id?: true
    cluster_id?: true
  }

  export type SchoolMinAggregateInputType = {
    id?: true
    name?: true
    level?: true
    cluster_id?: true
  }

  export type SchoolMaxAggregateInputType = {
    id?: true
    name?: true
    level?: true
    cluster_id?: true
  }

  export type SchoolCountAggregateInputType = {
    id?: true
    name?: true
    level?: true
    cluster_id?: true
    _all?: true
  }

  export type SchoolAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which School to aggregate.
     */
    where?: SchoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Schools to fetch.
     */
    orderBy?: SchoolOrderByWithRelationInput | SchoolOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SchoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Schools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Schools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Schools
    **/
    _count?: true | SchoolCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SchoolAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SchoolSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SchoolMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SchoolMaxAggregateInputType
  }

  export type GetSchoolAggregateType<T extends SchoolAggregateArgs> = {
        [P in keyof T & keyof AggregateSchool]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSchool[P]>
      : GetScalarType<T[P], AggregateSchool[P]>
  }




  export type SchoolGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SchoolWhereInput
    orderBy?: SchoolOrderByWithAggregationInput | SchoolOrderByWithAggregationInput[]
    by: SchoolScalarFieldEnum[] | SchoolScalarFieldEnum
    having?: SchoolScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SchoolCountAggregateInputType | true
    _avg?: SchoolAvgAggregateInputType
    _sum?: SchoolSumAggregateInputType
    _min?: SchoolMinAggregateInputType
    _max?: SchoolMaxAggregateInputType
  }

  export type SchoolGroupByOutputType = {
    id: number
    name: string
    level: string
    cluster_id: number
    _count: SchoolCountAggregateOutputType | null
    _avg: SchoolAvgAggregateOutputType | null
    _sum: SchoolSumAggregateOutputType | null
    _min: SchoolMinAggregateOutputType | null
    _max: SchoolMaxAggregateOutputType | null
  }

  type GetSchoolGroupByPayload<T extends SchoolGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SchoolGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SchoolGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SchoolGroupByOutputType[P]>
            : GetScalarType<T[P], SchoolGroupByOutputType[P]>
        }
      >
    >


  export type SchoolSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    level?: boolean
    cluster_id?: boolean
    cluster?: boolean | ClusterDefaultArgs<ExtArgs>
    aips?: boolean | School$aipsArgs<ExtArgs>
    user?: boolean | School$userArgs<ExtArgs>
    restricted_programs?: boolean | School$restricted_programsArgs<ExtArgs>
    _count?: boolean | SchoolCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["school"]>

  export type SchoolSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    level?: boolean
    cluster_id?: boolean
    cluster?: boolean | ClusterDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["school"]>

  export type SchoolSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    level?: boolean
    cluster_id?: boolean
    cluster?: boolean | ClusterDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["school"]>

  export type SchoolSelectScalar = {
    id?: boolean
    name?: boolean
    level?: boolean
    cluster_id?: boolean
  }

  export type SchoolOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "level" | "cluster_id", ExtArgs["result"]["school"]>
  export type SchoolInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    cluster?: boolean | ClusterDefaultArgs<ExtArgs>
    aips?: boolean | School$aipsArgs<ExtArgs>
    user?: boolean | School$userArgs<ExtArgs>
    restricted_programs?: boolean | School$restricted_programsArgs<ExtArgs>
    _count?: boolean | SchoolCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SchoolIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    cluster?: boolean | ClusterDefaultArgs<ExtArgs>
  }
  export type SchoolIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    cluster?: boolean | ClusterDefaultArgs<ExtArgs>
  }

  export type $SchoolPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "School"
    objects: {
      cluster: Prisma.$ClusterPayload<ExtArgs>
      aips: Prisma.$AIPPayload<ExtArgs>[]
      user: Prisma.$UserPayload<ExtArgs> | null
      restricted_programs: Prisma.$ProgramPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      name: string
      level: string
      cluster_id: number
    }, ExtArgs["result"]["school"]>
    composites: {}
  }

  type SchoolGetPayload<S extends boolean | null | undefined | SchoolDefaultArgs> = $Result.GetResult<Prisma.$SchoolPayload, S>

  type SchoolCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SchoolFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SchoolCountAggregateInputType | true
    }

  export interface SchoolDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['School'], meta: { name: 'School' } }
    /**
     * Find zero or one School that matches the filter.
     * @param {SchoolFindUniqueArgs} args - Arguments to find a School
     * @example
     * // Get one School
     * const school = await prisma.school.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SchoolFindUniqueArgs>(args: SelectSubset<T, SchoolFindUniqueArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one School that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SchoolFindUniqueOrThrowArgs} args - Arguments to find a School
     * @example
     * // Get one School
     * const school = await prisma.school.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SchoolFindUniqueOrThrowArgs>(args: SelectSubset<T, SchoolFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first School that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SchoolFindFirstArgs} args - Arguments to find a School
     * @example
     * // Get one School
     * const school = await prisma.school.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SchoolFindFirstArgs>(args?: SelectSubset<T, SchoolFindFirstArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first School that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SchoolFindFirstOrThrowArgs} args - Arguments to find a School
     * @example
     * // Get one School
     * const school = await prisma.school.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SchoolFindFirstOrThrowArgs>(args?: SelectSubset<T, SchoolFindFirstOrThrowArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Schools that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SchoolFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Schools
     * const schools = await prisma.school.findMany()
     * 
     * // Get first 10 Schools
     * const schools = await prisma.school.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const schoolWithIdOnly = await prisma.school.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SchoolFindManyArgs>(args?: SelectSubset<T, SchoolFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a School.
     * @param {SchoolCreateArgs} args - Arguments to create a School.
     * @example
     * // Create one School
     * const School = await prisma.school.create({
     *   data: {
     *     // ... data to create a School
     *   }
     * })
     * 
     */
    create<T extends SchoolCreateArgs>(args: SelectSubset<T, SchoolCreateArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Schools.
     * @param {SchoolCreateManyArgs} args - Arguments to create many Schools.
     * @example
     * // Create many Schools
     * const school = await prisma.school.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SchoolCreateManyArgs>(args?: SelectSubset<T, SchoolCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Schools and returns the data saved in the database.
     * @param {SchoolCreateManyAndReturnArgs} args - Arguments to create many Schools.
     * @example
     * // Create many Schools
     * const school = await prisma.school.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Schools and only return the `id`
     * const schoolWithIdOnly = await prisma.school.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SchoolCreateManyAndReturnArgs>(args?: SelectSubset<T, SchoolCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a School.
     * @param {SchoolDeleteArgs} args - Arguments to delete one School.
     * @example
     * // Delete one School
     * const School = await prisma.school.delete({
     *   where: {
     *     // ... filter to delete one School
     *   }
     * })
     * 
     */
    delete<T extends SchoolDeleteArgs>(args: SelectSubset<T, SchoolDeleteArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one School.
     * @param {SchoolUpdateArgs} args - Arguments to update one School.
     * @example
     * // Update one School
     * const school = await prisma.school.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SchoolUpdateArgs>(args: SelectSubset<T, SchoolUpdateArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Schools.
     * @param {SchoolDeleteManyArgs} args - Arguments to filter Schools to delete.
     * @example
     * // Delete a few Schools
     * const { count } = await prisma.school.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SchoolDeleteManyArgs>(args?: SelectSubset<T, SchoolDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Schools.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SchoolUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Schools
     * const school = await prisma.school.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SchoolUpdateManyArgs>(args: SelectSubset<T, SchoolUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Schools and returns the data updated in the database.
     * @param {SchoolUpdateManyAndReturnArgs} args - Arguments to update many Schools.
     * @example
     * // Update many Schools
     * const school = await prisma.school.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Schools and only return the `id`
     * const schoolWithIdOnly = await prisma.school.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SchoolUpdateManyAndReturnArgs>(args: SelectSubset<T, SchoolUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one School.
     * @param {SchoolUpsertArgs} args - Arguments to update or create a School.
     * @example
     * // Update or create a School
     * const school = await prisma.school.upsert({
     *   create: {
     *     // ... data to create a School
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the School we want to update
     *   }
     * })
     */
    upsert<T extends SchoolUpsertArgs>(args: SelectSubset<T, SchoolUpsertArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Schools.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SchoolCountArgs} args - Arguments to filter Schools to count.
     * @example
     * // Count the number of Schools
     * const count = await prisma.school.count({
     *   where: {
     *     // ... the filter for the Schools we want to count
     *   }
     * })
    **/
    count<T extends SchoolCountArgs>(
      args?: Subset<T, SchoolCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SchoolCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a School.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SchoolAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SchoolAggregateArgs>(args: Subset<T, SchoolAggregateArgs>): Prisma.PrismaPromise<GetSchoolAggregateType<T>>

    /**
     * Group by School.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SchoolGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SchoolGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SchoolGroupByArgs['orderBy'] }
        : { orderBy?: SchoolGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SchoolGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSchoolGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the School model
   */
  readonly fields: SchoolFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for School.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SchoolClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    cluster<T extends ClusterDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ClusterDefaultArgs<ExtArgs>>): Prisma__ClusterClient<$Result.GetResult<Prisma.$ClusterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    aips<T extends School$aipsArgs<ExtArgs> = {}>(args?: Subset<T, School$aipsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    user<T extends School$userArgs<ExtArgs> = {}>(args?: Subset<T, School$userArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    restricted_programs<T extends School$restricted_programsArgs<ExtArgs> = {}>(args?: Subset<T, School$restricted_programsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the School model
   */
  interface SchoolFieldRefs {
    readonly id: FieldRef<"School", 'Int'>
    readonly name: FieldRef<"School", 'String'>
    readonly level: FieldRef<"School", 'String'>
    readonly cluster_id: FieldRef<"School", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * School findUnique
   */
  export type SchoolFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * Filter, which School to fetch.
     */
    where: SchoolWhereUniqueInput
  }

  /**
   * School findUniqueOrThrow
   */
  export type SchoolFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * Filter, which School to fetch.
     */
    where: SchoolWhereUniqueInput
  }

  /**
   * School findFirst
   */
  export type SchoolFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * Filter, which School to fetch.
     */
    where?: SchoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Schools to fetch.
     */
    orderBy?: SchoolOrderByWithRelationInput | SchoolOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Schools.
     */
    cursor?: SchoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Schools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Schools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Schools.
     */
    distinct?: SchoolScalarFieldEnum | SchoolScalarFieldEnum[]
  }

  /**
   * School findFirstOrThrow
   */
  export type SchoolFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * Filter, which School to fetch.
     */
    where?: SchoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Schools to fetch.
     */
    orderBy?: SchoolOrderByWithRelationInput | SchoolOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Schools.
     */
    cursor?: SchoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Schools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Schools.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Schools.
     */
    distinct?: SchoolScalarFieldEnum | SchoolScalarFieldEnum[]
  }

  /**
   * School findMany
   */
  export type SchoolFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * Filter, which Schools to fetch.
     */
    where?: SchoolWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Schools to fetch.
     */
    orderBy?: SchoolOrderByWithRelationInput | SchoolOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Schools.
     */
    cursor?: SchoolWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Schools from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Schools.
     */
    skip?: number
    distinct?: SchoolScalarFieldEnum | SchoolScalarFieldEnum[]
  }

  /**
   * School create
   */
  export type SchoolCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * The data needed to create a School.
     */
    data: XOR<SchoolCreateInput, SchoolUncheckedCreateInput>
  }

  /**
   * School createMany
   */
  export type SchoolCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Schools.
     */
    data: SchoolCreateManyInput | SchoolCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * School createManyAndReturn
   */
  export type SchoolCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * The data used to create many Schools.
     */
    data: SchoolCreateManyInput | SchoolCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * School update
   */
  export type SchoolUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * The data needed to update a School.
     */
    data: XOR<SchoolUpdateInput, SchoolUncheckedUpdateInput>
    /**
     * Choose, which School to update.
     */
    where: SchoolWhereUniqueInput
  }

  /**
   * School updateMany
   */
  export type SchoolUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Schools.
     */
    data: XOR<SchoolUpdateManyMutationInput, SchoolUncheckedUpdateManyInput>
    /**
     * Filter which Schools to update
     */
    where?: SchoolWhereInput
    /**
     * Limit how many Schools to update.
     */
    limit?: number
  }

  /**
   * School updateManyAndReturn
   */
  export type SchoolUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * The data used to update Schools.
     */
    data: XOR<SchoolUpdateManyMutationInput, SchoolUncheckedUpdateManyInput>
    /**
     * Filter which Schools to update
     */
    where?: SchoolWhereInput
    /**
     * Limit how many Schools to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * School upsert
   */
  export type SchoolUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * The filter to search for the School to update in case it exists.
     */
    where: SchoolWhereUniqueInput
    /**
     * In case the School found by the `where` argument doesn't exist, create a new School with this data.
     */
    create: XOR<SchoolCreateInput, SchoolUncheckedCreateInput>
    /**
     * In case the School was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SchoolUpdateInput, SchoolUncheckedUpdateInput>
  }

  /**
   * School delete
   */
  export type SchoolDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    /**
     * Filter which School to delete.
     */
    where: SchoolWhereUniqueInput
  }

  /**
   * School deleteMany
   */
  export type SchoolDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Schools to delete
     */
    where?: SchoolWhereInput
    /**
     * Limit how many Schools to delete.
     */
    limit?: number
  }

  /**
   * School.aips
   */
  export type School$aipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    where?: AIPWhereInput
    orderBy?: AIPOrderByWithRelationInput | AIPOrderByWithRelationInput[]
    cursor?: AIPWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AIPScalarFieldEnum | AIPScalarFieldEnum[]
  }

  /**
   * School.user
   */
  export type School$userArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
  }

  /**
   * School.restricted_programs
   */
  export type School$restricted_programsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    where?: ProgramWhereInput
    orderBy?: ProgramOrderByWithRelationInput | ProgramOrderByWithRelationInput[]
    cursor?: ProgramWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProgramScalarFieldEnum | ProgramScalarFieldEnum[]
  }

  /**
   * School without action
   */
  export type SchoolDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
  }


  /**
   * Model Program
   */

  export type AggregateProgram = {
    _count: ProgramCountAggregateOutputType | null
    _avg: ProgramAvgAggregateOutputType | null
    _sum: ProgramSumAggregateOutputType | null
    _min: ProgramMinAggregateOutputType | null
    _max: ProgramMaxAggregateOutputType | null
  }

  export type ProgramAvgAggregateOutputType = {
    id: number | null
  }

  export type ProgramSumAggregateOutputType = {
    id: number | null
  }

  export type ProgramMinAggregateOutputType = {
    id: number | null
    title: string | null
    school_level_requirement: string | null
  }

  export type ProgramMaxAggregateOutputType = {
    id: number | null
    title: string | null
    school_level_requirement: string | null
  }

  export type ProgramCountAggregateOutputType = {
    id: number
    title: number
    school_level_requirement: number
    _all: number
  }


  export type ProgramAvgAggregateInputType = {
    id?: true
  }

  export type ProgramSumAggregateInputType = {
    id?: true
  }

  export type ProgramMinAggregateInputType = {
    id?: true
    title?: true
    school_level_requirement?: true
  }

  export type ProgramMaxAggregateInputType = {
    id?: true
    title?: true
    school_level_requirement?: true
  }

  export type ProgramCountAggregateInputType = {
    id?: true
    title?: true
    school_level_requirement?: true
    _all?: true
  }

  export type ProgramAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Program to aggregate.
     */
    where?: ProgramWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Programs to fetch.
     */
    orderBy?: ProgramOrderByWithRelationInput | ProgramOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProgramWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Programs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Programs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Programs
    **/
    _count?: true | ProgramCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProgramAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProgramSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProgramMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProgramMaxAggregateInputType
  }

  export type GetProgramAggregateType<T extends ProgramAggregateArgs> = {
        [P in keyof T & keyof AggregateProgram]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProgram[P]>
      : GetScalarType<T[P], AggregateProgram[P]>
  }




  export type ProgramGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProgramWhereInput
    orderBy?: ProgramOrderByWithAggregationInput | ProgramOrderByWithAggregationInput[]
    by: ProgramScalarFieldEnum[] | ProgramScalarFieldEnum
    having?: ProgramScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProgramCountAggregateInputType | true
    _avg?: ProgramAvgAggregateInputType
    _sum?: ProgramSumAggregateInputType
    _min?: ProgramMinAggregateInputType
    _max?: ProgramMaxAggregateInputType
  }

  export type ProgramGroupByOutputType = {
    id: number
    title: string
    school_level_requirement: string
    _count: ProgramCountAggregateOutputType | null
    _avg: ProgramAvgAggregateOutputType | null
    _sum: ProgramSumAggregateOutputType | null
    _min: ProgramMinAggregateOutputType | null
    _max: ProgramMaxAggregateOutputType | null
  }

  type GetProgramGroupByPayload<T extends ProgramGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProgramGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProgramGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProgramGroupByOutputType[P]>
            : GetScalarType<T[P], ProgramGroupByOutputType[P]>
        }
      >
    >


  export type ProgramSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    school_level_requirement?: boolean
    aips?: boolean | Program$aipsArgs<ExtArgs>
    personnel?: boolean | Program$personnelArgs<ExtArgs>
    restricted_schools?: boolean | Program$restricted_schoolsArgs<ExtArgs>
    _count?: boolean | ProgramCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["program"]>

  export type ProgramSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    school_level_requirement?: boolean
  }, ExtArgs["result"]["program"]>

  export type ProgramSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    school_level_requirement?: boolean
  }, ExtArgs["result"]["program"]>

  export type ProgramSelectScalar = {
    id?: boolean
    title?: boolean
    school_level_requirement?: boolean
  }

  export type ProgramOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "school_level_requirement", ExtArgs["result"]["program"]>
  export type ProgramInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aips?: boolean | Program$aipsArgs<ExtArgs>
    personnel?: boolean | Program$personnelArgs<ExtArgs>
    restricted_schools?: boolean | Program$restricted_schoolsArgs<ExtArgs>
    _count?: boolean | ProgramCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProgramIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ProgramIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ProgramPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Program"
    objects: {
      aips: Prisma.$AIPPayload<ExtArgs>[]
      personnel: Prisma.$UserPayload<ExtArgs>[]
      restricted_schools: Prisma.$SchoolPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      title: string
      school_level_requirement: string
    }, ExtArgs["result"]["program"]>
    composites: {}
  }

  type ProgramGetPayload<S extends boolean | null | undefined | ProgramDefaultArgs> = $Result.GetResult<Prisma.$ProgramPayload, S>

  type ProgramCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProgramFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ProgramCountAggregateInputType | true
    }

  export interface ProgramDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Program'], meta: { name: 'Program' } }
    /**
     * Find zero or one Program that matches the filter.
     * @param {ProgramFindUniqueArgs} args - Arguments to find a Program
     * @example
     * // Get one Program
     * const program = await prisma.program.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProgramFindUniqueArgs>(args: SelectSubset<T, ProgramFindUniqueArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Program that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProgramFindUniqueOrThrowArgs} args - Arguments to find a Program
     * @example
     * // Get one Program
     * const program = await prisma.program.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProgramFindUniqueOrThrowArgs>(args: SelectSubset<T, ProgramFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Program that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgramFindFirstArgs} args - Arguments to find a Program
     * @example
     * // Get one Program
     * const program = await prisma.program.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProgramFindFirstArgs>(args?: SelectSubset<T, ProgramFindFirstArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Program that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgramFindFirstOrThrowArgs} args - Arguments to find a Program
     * @example
     * // Get one Program
     * const program = await prisma.program.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProgramFindFirstOrThrowArgs>(args?: SelectSubset<T, ProgramFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Programs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgramFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Programs
     * const programs = await prisma.program.findMany()
     * 
     * // Get first 10 Programs
     * const programs = await prisma.program.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const programWithIdOnly = await prisma.program.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProgramFindManyArgs>(args?: SelectSubset<T, ProgramFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Program.
     * @param {ProgramCreateArgs} args - Arguments to create a Program.
     * @example
     * // Create one Program
     * const Program = await prisma.program.create({
     *   data: {
     *     // ... data to create a Program
     *   }
     * })
     * 
     */
    create<T extends ProgramCreateArgs>(args: SelectSubset<T, ProgramCreateArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Programs.
     * @param {ProgramCreateManyArgs} args - Arguments to create many Programs.
     * @example
     * // Create many Programs
     * const program = await prisma.program.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProgramCreateManyArgs>(args?: SelectSubset<T, ProgramCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Programs and returns the data saved in the database.
     * @param {ProgramCreateManyAndReturnArgs} args - Arguments to create many Programs.
     * @example
     * // Create many Programs
     * const program = await prisma.program.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Programs and only return the `id`
     * const programWithIdOnly = await prisma.program.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProgramCreateManyAndReturnArgs>(args?: SelectSubset<T, ProgramCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Program.
     * @param {ProgramDeleteArgs} args - Arguments to delete one Program.
     * @example
     * // Delete one Program
     * const Program = await prisma.program.delete({
     *   where: {
     *     // ... filter to delete one Program
     *   }
     * })
     * 
     */
    delete<T extends ProgramDeleteArgs>(args: SelectSubset<T, ProgramDeleteArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Program.
     * @param {ProgramUpdateArgs} args - Arguments to update one Program.
     * @example
     * // Update one Program
     * const program = await prisma.program.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProgramUpdateArgs>(args: SelectSubset<T, ProgramUpdateArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Programs.
     * @param {ProgramDeleteManyArgs} args - Arguments to filter Programs to delete.
     * @example
     * // Delete a few Programs
     * const { count } = await prisma.program.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProgramDeleteManyArgs>(args?: SelectSubset<T, ProgramDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Programs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgramUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Programs
     * const program = await prisma.program.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProgramUpdateManyArgs>(args: SelectSubset<T, ProgramUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Programs and returns the data updated in the database.
     * @param {ProgramUpdateManyAndReturnArgs} args - Arguments to update many Programs.
     * @example
     * // Update many Programs
     * const program = await prisma.program.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Programs and only return the `id`
     * const programWithIdOnly = await prisma.program.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProgramUpdateManyAndReturnArgs>(args: SelectSubset<T, ProgramUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Program.
     * @param {ProgramUpsertArgs} args - Arguments to update or create a Program.
     * @example
     * // Update or create a Program
     * const program = await prisma.program.upsert({
     *   create: {
     *     // ... data to create a Program
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Program we want to update
     *   }
     * })
     */
    upsert<T extends ProgramUpsertArgs>(args: SelectSubset<T, ProgramUpsertArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Programs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgramCountArgs} args - Arguments to filter Programs to count.
     * @example
     * // Count the number of Programs
     * const count = await prisma.program.count({
     *   where: {
     *     // ... the filter for the Programs we want to count
     *   }
     * })
    **/
    count<T extends ProgramCountArgs>(
      args?: Subset<T, ProgramCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProgramCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Program.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgramAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProgramAggregateArgs>(args: Subset<T, ProgramAggregateArgs>): Prisma.PrismaPromise<GetProgramAggregateType<T>>

    /**
     * Group by Program.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProgramGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProgramGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProgramGroupByArgs['orderBy'] }
        : { orderBy?: ProgramGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProgramGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProgramGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Program model
   */
  readonly fields: ProgramFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Program.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProgramClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    aips<T extends Program$aipsArgs<ExtArgs> = {}>(args?: Subset<T, Program$aipsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    personnel<T extends Program$personnelArgs<ExtArgs> = {}>(args?: Subset<T, Program$personnelArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    restricted_schools<T extends Program$restricted_schoolsArgs<ExtArgs> = {}>(args?: Subset<T, Program$restricted_schoolsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Program model
   */
  interface ProgramFieldRefs {
    readonly id: FieldRef<"Program", 'Int'>
    readonly title: FieldRef<"Program", 'String'>
    readonly school_level_requirement: FieldRef<"Program", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Program findUnique
   */
  export type ProgramFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * Filter, which Program to fetch.
     */
    where: ProgramWhereUniqueInput
  }

  /**
   * Program findUniqueOrThrow
   */
  export type ProgramFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * Filter, which Program to fetch.
     */
    where: ProgramWhereUniqueInput
  }

  /**
   * Program findFirst
   */
  export type ProgramFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * Filter, which Program to fetch.
     */
    where?: ProgramWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Programs to fetch.
     */
    orderBy?: ProgramOrderByWithRelationInput | ProgramOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Programs.
     */
    cursor?: ProgramWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Programs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Programs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Programs.
     */
    distinct?: ProgramScalarFieldEnum | ProgramScalarFieldEnum[]
  }

  /**
   * Program findFirstOrThrow
   */
  export type ProgramFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * Filter, which Program to fetch.
     */
    where?: ProgramWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Programs to fetch.
     */
    orderBy?: ProgramOrderByWithRelationInput | ProgramOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Programs.
     */
    cursor?: ProgramWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Programs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Programs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Programs.
     */
    distinct?: ProgramScalarFieldEnum | ProgramScalarFieldEnum[]
  }

  /**
   * Program findMany
   */
  export type ProgramFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * Filter, which Programs to fetch.
     */
    where?: ProgramWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Programs to fetch.
     */
    orderBy?: ProgramOrderByWithRelationInput | ProgramOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Programs.
     */
    cursor?: ProgramWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Programs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Programs.
     */
    skip?: number
    distinct?: ProgramScalarFieldEnum | ProgramScalarFieldEnum[]
  }

  /**
   * Program create
   */
  export type ProgramCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * The data needed to create a Program.
     */
    data: XOR<ProgramCreateInput, ProgramUncheckedCreateInput>
  }

  /**
   * Program createMany
   */
  export type ProgramCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Programs.
     */
    data: ProgramCreateManyInput | ProgramCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Program createManyAndReturn
   */
  export type ProgramCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * The data used to create many Programs.
     */
    data: ProgramCreateManyInput | ProgramCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Program update
   */
  export type ProgramUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * The data needed to update a Program.
     */
    data: XOR<ProgramUpdateInput, ProgramUncheckedUpdateInput>
    /**
     * Choose, which Program to update.
     */
    where: ProgramWhereUniqueInput
  }

  /**
   * Program updateMany
   */
  export type ProgramUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Programs.
     */
    data: XOR<ProgramUpdateManyMutationInput, ProgramUncheckedUpdateManyInput>
    /**
     * Filter which Programs to update
     */
    where?: ProgramWhereInput
    /**
     * Limit how many Programs to update.
     */
    limit?: number
  }

  /**
   * Program updateManyAndReturn
   */
  export type ProgramUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * The data used to update Programs.
     */
    data: XOR<ProgramUpdateManyMutationInput, ProgramUncheckedUpdateManyInput>
    /**
     * Filter which Programs to update
     */
    where?: ProgramWhereInput
    /**
     * Limit how many Programs to update.
     */
    limit?: number
  }

  /**
   * Program upsert
   */
  export type ProgramUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * The filter to search for the Program to update in case it exists.
     */
    where: ProgramWhereUniqueInput
    /**
     * In case the Program found by the `where` argument doesn't exist, create a new Program with this data.
     */
    create: XOR<ProgramCreateInput, ProgramUncheckedCreateInput>
    /**
     * In case the Program was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProgramUpdateInput, ProgramUncheckedUpdateInput>
  }

  /**
   * Program delete
   */
  export type ProgramDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    /**
     * Filter which Program to delete.
     */
    where: ProgramWhereUniqueInput
  }

  /**
   * Program deleteMany
   */
  export type ProgramDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Programs to delete
     */
    where?: ProgramWhereInput
    /**
     * Limit how many Programs to delete.
     */
    limit?: number
  }

  /**
   * Program.aips
   */
  export type Program$aipsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    where?: AIPWhereInput
    orderBy?: AIPOrderByWithRelationInput | AIPOrderByWithRelationInput[]
    cursor?: AIPWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AIPScalarFieldEnum | AIPScalarFieldEnum[]
  }

  /**
   * Program.personnel
   */
  export type Program$personnelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    where?: UserWhereInput
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    cursor?: UserWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * Program.restricted_schools
   */
  export type Program$restricted_schoolsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    where?: SchoolWhereInput
    orderBy?: SchoolOrderByWithRelationInput | SchoolOrderByWithRelationInput[]
    cursor?: SchoolWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SchoolScalarFieldEnum | SchoolScalarFieldEnum[]
  }

  /**
   * Program without action
   */
  export type ProgramDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
    school_id: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
    school_id: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    email: string | null
    password: string | null
    role: string | null
    name: string | null
    school_id: number | null
    created_at: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    email: string | null
    password: string | null
    role: string | null
    name: string | null
    school_id: number | null
    created_at: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    password: number
    role: number
    name: number
    school_id: number
    created_at: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
    school_id?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
    school_id?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    password?: true
    role?: true
    name?: true
    school_id?: true
    created_at?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    password?: true
    role?: true
    name?: true
    school_id?: true
    created_at?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    password?: true
    role?: true
    name?: true
    school_id?: true
    created_at?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    email: string
    password: string
    role: string
    name: string | null
    school_id: number | null
    created_at: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    role?: boolean
    name?: boolean
    school_id?: boolean
    created_at?: boolean
    school?: boolean | User$schoolArgs<ExtArgs>
    programs?: boolean | User$programsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    role?: boolean
    name?: boolean
    school_id?: boolean
    created_at?: boolean
    school?: boolean | User$schoolArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    role?: boolean
    name?: boolean
    school_id?: boolean
    created_at?: boolean
    school?: boolean | User$schoolArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    password?: boolean
    role?: boolean
    name?: boolean
    school_id?: boolean
    created_at?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "password" | "role" | "name" | "school_id" | "created_at", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    school?: boolean | User$schoolArgs<ExtArgs>
    programs?: boolean | User$programsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    school?: boolean | User$schoolArgs<ExtArgs>
  }
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    school?: boolean | User$schoolArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      school: Prisma.$SchoolPayload<ExtArgs> | null
      programs: Prisma.$ProgramPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      email: string
      password: string
      role: string
      name: string | null
      school_id: number | null
      created_at: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    school<T extends User$schoolArgs<ExtArgs> = {}>(args?: Subset<T, User$schoolArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    programs<T extends User$programsArgs<ExtArgs> = {}>(args?: Subset<T, User$programsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly school_id: FieldRef<"User", 'Int'>
    readonly created_at: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.school
   */
  export type User$schoolArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the School
     */
    select?: SchoolSelect<ExtArgs> | null
    /**
     * Omit specific fields from the School
     */
    omit?: SchoolOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SchoolInclude<ExtArgs> | null
    where?: SchoolWhereInput
  }

  /**
   * User.programs
   */
  export type User$programsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Program
     */
    select?: ProgramSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Program
     */
    omit?: ProgramOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProgramInclude<ExtArgs> | null
    where?: ProgramWhereInput
    orderBy?: ProgramOrderByWithRelationInput | ProgramOrderByWithRelationInput[]
    cursor?: ProgramWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ProgramScalarFieldEnum | ProgramScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model AIP
   */

  export type AggregateAIP = {
    _count: AIPCountAggregateOutputType | null
    _avg: AIPAvgAggregateOutputType | null
    _sum: AIPSumAggregateOutputType | null
    _min: AIPMinAggregateOutputType | null
    _max: AIPMaxAggregateOutputType | null
  }

  export type AIPAvgAggregateOutputType = {
    id: number | null
    school_id: number | null
    program_id: number | null
    year: number | null
  }

  export type AIPSumAggregateOutputType = {
    id: number | null
    school_id: number | null
    program_id: number | null
    year: number | null
  }

  export type AIPMinAggregateOutputType = {
    id: number | null
    school_id: number | null
    program_id: number | null
    year: number | null
    pillar: string | null
    sip_title: string | null
    project_coordinator: string | null
    objectives: string | null
    indicators: string | null
    annual_target: string | null
    created_at: Date | null
  }

  export type AIPMaxAggregateOutputType = {
    id: number | null
    school_id: number | null
    program_id: number | null
    year: number | null
    pillar: string | null
    sip_title: string | null
    project_coordinator: string | null
    objectives: string | null
    indicators: string | null
    annual_target: string | null
    created_at: Date | null
  }

  export type AIPCountAggregateOutputType = {
    id: number
    school_id: number
    program_id: number
    year: number
    pillar: number
    sip_title: number
    project_coordinator: number
    objectives: number
    indicators: number
    annual_target: number
    created_at: number
    _all: number
  }


  export type AIPAvgAggregateInputType = {
    id?: true
    school_id?: true
    program_id?: true
    year?: true
  }

  export type AIPSumAggregateInputType = {
    id?: true
    school_id?: true
    program_id?: true
    year?: true
  }

  export type AIPMinAggregateInputType = {
    id?: true
    school_id?: true
    program_id?: true
    year?: true
    pillar?: true
    sip_title?: true
    project_coordinator?: true
    objectives?: true
    indicators?: true
    annual_target?: true
    created_at?: true
  }

  export type AIPMaxAggregateInputType = {
    id?: true
    school_id?: true
    program_id?: true
    year?: true
    pillar?: true
    sip_title?: true
    project_coordinator?: true
    objectives?: true
    indicators?: true
    annual_target?: true
    created_at?: true
  }

  export type AIPCountAggregateInputType = {
    id?: true
    school_id?: true
    program_id?: true
    year?: true
    pillar?: true
    sip_title?: true
    project_coordinator?: true
    objectives?: true
    indicators?: true
    annual_target?: true
    created_at?: true
    _all?: true
  }

  export type AIPAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AIP to aggregate.
     */
    where?: AIPWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AIPS to fetch.
     */
    orderBy?: AIPOrderByWithRelationInput | AIPOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AIPWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AIPS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AIPS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AIPS
    **/
    _count?: true | AIPCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AIPAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AIPSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AIPMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AIPMaxAggregateInputType
  }

  export type GetAIPAggregateType<T extends AIPAggregateArgs> = {
        [P in keyof T & keyof AggregateAIP]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAIP[P]>
      : GetScalarType<T[P], AggregateAIP[P]>
  }




  export type AIPGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AIPWhereInput
    orderBy?: AIPOrderByWithAggregationInput | AIPOrderByWithAggregationInput[]
    by: AIPScalarFieldEnum[] | AIPScalarFieldEnum
    having?: AIPScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AIPCountAggregateInputType | true
    _avg?: AIPAvgAggregateInputType
    _sum?: AIPSumAggregateInputType
    _min?: AIPMinAggregateInputType
    _max?: AIPMaxAggregateInputType
  }

  export type AIPGroupByOutputType = {
    id: number
    school_id: number
    program_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at: Date
    _count: AIPCountAggregateOutputType | null
    _avg: AIPAvgAggregateOutputType | null
    _sum: AIPSumAggregateOutputType | null
    _min: AIPMinAggregateOutputType | null
    _max: AIPMaxAggregateOutputType | null
  }

  type GetAIPGroupByPayload<T extends AIPGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AIPGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AIPGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AIPGroupByOutputType[P]>
            : GetScalarType<T[P], AIPGroupByOutputType[P]>
        }
      >
    >


  export type AIPSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    school_id?: boolean
    program_id?: boolean
    year?: boolean
    pillar?: boolean
    sip_title?: boolean
    project_coordinator?: boolean
    objectives?: boolean
    indicators?: boolean
    annual_target?: boolean
    created_at?: boolean
    school?: boolean | SchoolDefaultArgs<ExtArgs>
    program?: boolean | ProgramDefaultArgs<ExtArgs>
    activities?: boolean | AIP$activitiesArgs<ExtArgs>
    pirs?: boolean | AIP$pirsArgs<ExtArgs>
    _count?: boolean | AIPCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aIP"]>

  export type AIPSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    school_id?: boolean
    program_id?: boolean
    year?: boolean
    pillar?: boolean
    sip_title?: boolean
    project_coordinator?: boolean
    objectives?: boolean
    indicators?: boolean
    annual_target?: boolean
    created_at?: boolean
    school?: boolean | SchoolDefaultArgs<ExtArgs>
    program?: boolean | ProgramDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aIP"]>

  export type AIPSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    school_id?: boolean
    program_id?: boolean
    year?: boolean
    pillar?: boolean
    sip_title?: boolean
    project_coordinator?: boolean
    objectives?: boolean
    indicators?: boolean
    annual_target?: boolean
    created_at?: boolean
    school?: boolean | SchoolDefaultArgs<ExtArgs>
    program?: boolean | ProgramDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aIP"]>

  export type AIPSelectScalar = {
    id?: boolean
    school_id?: boolean
    program_id?: boolean
    year?: boolean
    pillar?: boolean
    sip_title?: boolean
    project_coordinator?: boolean
    objectives?: boolean
    indicators?: boolean
    annual_target?: boolean
    created_at?: boolean
  }

  export type AIPOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "school_id" | "program_id" | "year" | "pillar" | "sip_title" | "project_coordinator" | "objectives" | "indicators" | "annual_target" | "created_at", ExtArgs["result"]["aIP"]>
  export type AIPInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    school?: boolean | SchoolDefaultArgs<ExtArgs>
    program?: boolean | ProgramDefaultArgs<ExtArgs>
    activities?: boolean | AIP$activitiesArgs<ExtArgs>
    pirs?: boolean | AIP$pirsArgs<ExtArgs>
    _count?: boolean | AIPCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AIPIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    school?: boolean | SchoolDefaultArgs<ExtArgs>
    program?: boolean | ProgramDefaultArgs<ExtArgs>
  }
  export type AIPIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    school?: boolean | SchoolDefaultArgs<ExtArgs>
    program?: boolean | ProgramDefaultArgs<ExtArgs>
  }

  export type $AIPPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AIP"
    objects: {
      school: Prisma.$SchoolPayload<ExtArgs>
      program: Prisma.$ProgramPayload<ExtArgs>
      activities: Prisma.$AIPActivityPayload<ExtArgs>[]
      pirs: Prisma.$PIRPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      school_id: number
      program_id: number
      year: number
      pillar: string
      sip_title: string
      project_coordinator: string
      objectives: string
      indicators: string
      annual_target: string
      created_at: Date
    }, ExtArgs["result"]["aIP"]>
    composites: {}
  }

  type AIPGetPayload<S extends boolean | null | undefined | AIPDefaultArgs> = $Result.GetResult<Prisma.$AIPPayload, S>

  type AIPCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AIPFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AIPCountAggregateInputType | true
    }

  export interface AIPDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AIP'], meta: { name: 'AIP' } }
    /**
     * Find zero or one AIP that matches the filter.
     * @param {AIPFindUniqueArgs} args - Arguments to find a AIP
     * @example
     * // Get one AIP
     * const aIP = await prisma.aIP.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AIPFindUniqueArgs>(args: SelectSubset<T, AIPFindUniqueArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AIP that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AIPFindUniqueOrThrowArgs} args - Arguments to find a AIP
     * @example
     * // Get one AIP
     * const aIP = await prisma.aIP.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AIPFindUniqueOrThrowArgs>(args: SelectSubset<T, AIPFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AIP that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPFindFirstArgs} args - Arguments to find a AIP
     * @example
     * // Get one AIP
     * const aIP = await prisma.aIP.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AIPFindFirstArgs>(args?: SelectSubset<T, AIPFindFirstArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AIP that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPFindFirstOrThrowArgs} args - Arguments to find a AIP
     * @example
     * // Get one AIP
     * const aIP = await prisma.aIP.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AIPFindFirstOrThrowArgs>(args?: SelectSubset<T, AIPFindFirstOrThrowArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AIPS that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AIPS
     * const aIPS = await prisma.aIP.findMany()
     * 
     * // Get first 10 AIPS
     * const aIPS = await prisma.aIP.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const aIPWithIdOnly = await prisma.aIP.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AIPFindManyArgs>(args?: SelectSubset<T, AIPFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AIP.
     * @param {AIPCreateArgs} args - Arguments to create a AIP.
     * @example
     * // Create one AIP
     * const AIP = await prisma.aIP.create({
     *   data: {
     *     // ... data to create a AIP
     *   }
     * })
     * 
     */
    create<T extends AIPCreateArgs>(args: SelectSubset<T, AIPCreateArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AIPS.
     * @param {AIPCreateManyArgs} args - Arguments to create many AIPS.
     * @example
     * // Create many AIPS
     * const aIP = await prisma.aIP.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AIPCreateManyArgs>(args?: SelectSubset<T, AIPCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AIPS and returns the data saved in the database.
     * @param {AIPCreateManyAndReturnArgs} args - Arguments to create many AIPS.
     * @example
     * // Create many AIPS
     * const aIP = await prisma.aIP.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AIPS and only return the `id`
     * const aIPWithIdOnly = await prisma.aIP.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AIPCreateManyAndReturnArgs>(args?: SelectSubset<T, AIPCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AIP.
     * @param {AIPDeleteArgs} args - Arguments to delete one AIP.
     * @example
     * // Delete one AIP
     * const AIP = await prisma.aIP.delete({
     *   where: {
     *     // ... filter to delete one AIP
     *   }
     * })
     * 
     */
    delete<T extends AIPDeleteArgs>(args: SelectSubset<T, AIPDeleteArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AIP.
     * @param {AIPUpdateArgs} args - Arguments to update one AIP.
     * @example
     * // Update one AIP
     * const aIP = await prisma.aIP.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AIPUpdateArgs>(args: SelectSubset<T, AIPUpdateArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AIPS.
     * @param {AIPDeleteManyArgs} args - Arguments to filter AIPS to delete.
     * @example
     * // Delete a few AIPS
     * const { count } = await prisma.aIP.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AIPDeleteManyArgs>(args?: SelectSubset<T, AIPDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AIPS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AIPS
     * const aIP = await prisma.aIP.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AIPUpdateManyArgs>(args: SelectSubset<T, AIPUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AIPS and returns the data updated in the database.
     * @param {AIPUpdateManyAndReturnArgs} args - Arguments to update many AIPS.
     * @example
     * // Update many AIPS
     * const aIP = await prisma.aIP.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AIPS and only return the `id`
     * const aIPWithIdOnly = await prisma.aIP.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AIPUpdateManyAndReturnArgs>(args: SelectSubset<T, AIPUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AIP.
     * @param {AIPUpsertArgs} args - Arguments to update or create a AIP.
     * @example
     * // Update or create a AIP
     * const aIP = await prisma.aIP.upsert({
     *   create: {
     *     // ... data to create a AIP
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AIP we want to update
     *   }
     * })
     */
    upsert<T extends AIPUpsertArgs>(args: SelectSubset<T, AIPUpsertArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AIPS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPCountArgs} args - Arguments to filter AIPS to count.
     * @example
     * // Count the number of AIPS
     * const count = await prisma.aIP.count({
     *   where: {
     *     // ... the filter for the AIPS we want to count
     *   }
     * })
    **/
    count<T extends AIPCountArgs>(
      args?: Subset<T, AIPCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AIPCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AIP.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AIPAggregateArgs>(args: Subset<T, AIPAggregateArgs>): Prisma.PrismaPromise<GetAIPAggregateType<T>>

    /**
     * Group by AIP.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AIPGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AIPGroupByArgs['orderBy'] }
        : { orderBy?: AIPGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AIPGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAIPGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AIP model
   */
  readonly fields: AIPFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AIP.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AIPClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    school<T extends SchoolDefaultArgs<ExtArgs> = {}>(args?: Subset<T, SchoolDefaultArgs<ExtArgs>>): Prisma__SchoolClient<$Result.GetResult<Prisma.$SchoolPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    program<T extends ProgramDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProgramDefaultArgs<ExtArgs>>): Prisma__ProgramClient<$Result.GetResult<Prisma.$ProgramPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    activities<T extends AIP$activitiesArgs<ExtArgs> = {}>(args?: Subset<T, AIP$activitiesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    pirs<T extends AIP$pirsArgs<ExtArgs> = {}>(args?: Subset<T, AIP$pirsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AIP model
   */
  interface AIPFieldRefs {
    readonly id: FieldRef<"AIP", 'Int'>
    readonly school_id: FieldRef<"AIP", 'Int'>
    readonly program_id: FieldRef<"AIP", 'Int'>
    readonly year: FieldRef<"AIP", 'Int'>
    readonly pillar: FieldRef<"AIP", 'String'>
    readonly sip_title: FieldRef<"AIP", 'String'>
    readonly project_coordinator: FieldRef<"AIP", 'String'>
    readonly objectives: FieldRef<"AIP", 'String'>
    readonly indicators: FieldRef<"AIP", 'String'>
    readonly annual_target: FieldRef<"AIP", 'String'>
    readonly created_at: FieldRef<"AIP", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AIP findUnique
   */
  export type AIPFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * Filter, which AIP to fetch.
     */
    where: AIPWhereUniqueInput
  }

  /**
   * AIP findUniqueOrThrow
   */
  export type AIPFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * Filter, which AIP to fetch.
     */
    where: AIPWhereUniqueInput
  }

  /**
   * AIP findFirst
   */
  export type AIPFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * Filter, which AIP to fetch.
     */
    where?: AIPWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AIPS to fetch.
     */
    orderBy?: AIPOrderByWithRelationInput | AIPOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AIPS.
     */
    cursor?: AIPWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AIPS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AIPS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AIPS.
     */
    distinct?: AIPScalarFieldEnum | AIPScalarFieldEnum[]
  }

  /**
   * AIP findFirstOrThrow
   */
  export type AIPFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * Filter, which AIP to fetch.
     */
    where?: AIPWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AIPS to fetch.
     */
    orderBy?: AIPOrderByWithRelationInput | AIPOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AIPS.
     */
    cursor?: AIPWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AIPS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AIPS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AIPS.
     */
    distinct?: AIPScalarFieldEnum | AIPScalarFieldEnum[]
  }

  /**
   * AIP findMany
   */
  export type AIPFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * Filter, which AIPS to fetch.
     */
    where?: AIPWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AIPS to fetch.
     */
    orderBy?: AIPOrderByWithRelationInput | AIPOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AIPS.
     */
    cursor?: AIPWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AIPS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AIPS.
     */
    skip?: number
    distinct?: AIPScalarFieldEnum | AIPScalarFieldEnum[]
  }

  /**
   * AIP create
   */
  export type AIPCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * The data needed to create a AIP.
     */
    data: XOR<AIPCreateInput, AIPUncheckedCreateInput>
  }

  /**
   * AIP createMany
   */
  export type AIPCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AIPS.
     */
    data: AIPCreateManyInput | AIPCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AIP createManyAndReturn
   */
  export type AIPCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * The data used to create many AIPS.
     */
    data: AIPCreateManyInput | AIPCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AIP update
   */
  export type AIPUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * The data needed to update a AIP.
     */
    data: XOR<AIPUpdateInput, AIPUncheckedUpdateInput>
    /**
     * Choose, which AIP to update.
     */
    where: AIPWhereUniqueInput
  }

  /**
   * AIP updateMany
   */
  export type AIPUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AIPS.
     */
    data: XOR<AIPUpdateManyMutationInput, AIPUncheckedUpdateManyInput>
    /**
     * Filter which AIPS to update
     */
    where?: AIPWhereInput
    /**
     * Limit how many AIPS to update.
     */
    limit?: number
  }

  /**
   * AIP updateManyAndReturn
   */
  export type AIPUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * The data used to update AIPS.
     */
    data: XOR<AIPUpdateManyMutationInput, AIPUncheckedUpdateManyInput>
    /**
     * Filter which AIPS to update
     */
    where?: AIPWhereInput
    /**
     * Limit how many AIPS to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * AIP upsert
   */
  export type AIPUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * The filter to search for the AIP to update in case it exists.
     */
    where: AIPWhereUniqueInput
    /**
     * In case the AIP found by the `where` argument doesn't exist, create a new AIP with this data.
     */
    create: XOR<AIPCreateInput, AIPUncheckedCreateInput>
    /**
     * In case the AIP was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AIPUpdateInput, AIPUncheckedUpdateInput>
  }

  /**
   * AIP delete
   */
  export type AIPDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
    /**
     * Filter which AIP to delete.
     */
    where: AIPWhereUniqueInput
  }

  /**
   * AIP deleteMany
   */
  export type AIPDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AIPS to delete
     */
    where?: AIPWhereInput
    /**
     * Limit how many AIPS to delete.
     */
    limit?: number
  }

  /**
   * AIP.activities
   */
  export type AIP$activitiesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    where?: AIPActivityWhereInput
    orderBy?: AIPActivityOrderByWithRelationInput | AIPActivityOrderByWithRelationInput[]
    cursor?: AIPActivityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AIPActivityScalarFieldEnum | AIPActivityScalarFieldEnum[]
  }

  /**
   * AIP.pirs
   */
  export type AIP$pirsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    where?: PIRWhereInput
    orderBy?: PIROrderByWithRelationInput | PIROrderByWithRelationInput[]
    cursor?: PIRWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PIRScalarFieldEnum | PIRScalarFieldEnum[]
  }

  /**
   * AIP without action
   */
  export type AIPDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIP
     */
    select?: AIPSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIP
     */
    omit?: AIPOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPInclude<ExtArgs> | null
  }


  /**
   * Model AIPActivity
   */

  export type AggregateAIPActivity = {
    _count: AIPActivityCountAggregateOutputType | null
    _avg: AIPActivityAvgAggregateOutputType | null
    _sum: AIPActivitySumAggregateOutputType | null
    _min: AIPActivityMinAggregateOutputType | null
    _max: AIPActivityMaxAggregateOutputType | null
  }

  export type AIPActivityAvgAggregateOutputType = {
    id: number | null
    aip_id: number | null
    budget_amount: Decimal | null
  }

  export type AIPActivitySumAggregateOutputType = {
    id: number | null
    aip_id: number | null
    budget_amount: Decimal | null
  }

  export type AIPActivityMinAggregateOutputType = {
    id: number | null
    aip_id: number | null
    phase: string | null
    activity_name: string | null
    implementation_period: string | null
    persons_involved: string | null
    outputs: string | null
    budget_amount: Decimal | null
    budget_source: string | null
  }

  export type AIPActivityMaxAggregateOutputType = {
    id: number | null
    aip_id: number | null
    phase: string | null
    activity_name: string | null
    implementation_period: string | null
    persons_involved: string | null
    outputs: string | null
    budget_amount: Decimal | null
    budget_source: string | null
  }

  export type AIPActivityCountAggregateOutputType = {
    id: number
    aip_id: number
    phase: number
    activity_name: number
    implementation_period: number
    persons_involved: number
    outputs: number
    budget_amount: number
    budget_source: number
    _all: number
  }


  export type AIPActivityAvgAggregateInputType = {
    id?: true
    aip_id?: true
    budget_amount?: true
  }

  export type AIPActivitySumAggregateInputType = {
    id?: true
    aip_id?: true
    budget_amount?: true
  }

  export type AIPActivityMinAggregateInputType = {
    id?: true
    aip_id?: true
    phase?: true
    activity_name?: true
    implementation_period?: true
    persons_involved?: true
    outputs?: true
    budget_amount?: true
    budget_source?: true
  }

  export type AIPActivityMaxAggregateInputType = {
    id?: true
    aip_id?: true
    phase?: true
    activity_name?: true
    implementation_period?: true
    persons_involved?: true
    outputs?: true
    budget_amount?: true
    budget_source?: true
  }

  export type AIPActivityCountAggregateInputType = {
    id?: true
    aip_id?: true
    phase?: true
    activity_name?: true
    implementation_period?: true
    persons_involved?: true
    outputs?: true
    budget_amount?: true
    budget_source?: true
    _all?: true
  }

  export type AIPActivityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AIPActivity to aggregate.
     */
    where?: AIPActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AIPActivities to fetch.
     */
    orderBy?: AIPActivityOrderByWithRelationInput | AIPActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AIPActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AIPActivities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AIPActivities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AIPActivities
    **/
    _count?: true | AIPActivityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AIPActivityAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AIPActivitySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AIPActivityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AIPActivityMaxAggregateInputType
  }

  export type GetAIPActivityAggregateType<T extends AIPActivityAggregateArgs> = {
        [P in keyof T & keyof AggregateAIPActivity]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAIPActivity[P]>
      : GetScalarType<T[P], AggregateAIPActivity[P]>
  }




  export type AIPActivityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AIPActivityWhereInput
    orderBy?: AIPActivityOrderByWithAggregationInput | AIPActivityOrderByWithAggregationInput[]
    by: AIPActivityScalarFieldEnum[] | AIPActivityScalarFieldEnum
    having?: AIPActivityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AIPActivityCountAggregateInputType | true
    _avg?: AIPActivityAvgAggregateInputType
    _sum?: AIPActivitySumAggregateInputType
    _min?: AIPActivityMinAggregateInputType
    _max?: AIPActivityMaxAggregateInputType
  }

  export type AIPActivityGroupByOutputType = {
    id: number
    aip_id: number
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount: Decimal
    budget_source: string
    _count: AIPActivityCountAggregateOutputType | null
    _avg: AIPActivityAvgAggregateOutputType | null
    _sum: AIPActivitySumAggregateOutputType | null
    _min: AIPActivityMinAggregateOutputType | null
    _max: AIPActivityMaxAggregateOutputType | null
  }

  type GetAIPActivityGroupByPayload<T extends AIPActivityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AIPActivityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AIPActivityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AIPActivityGroupByOutputType[P]>
            : GetScalarType<T[P], AIPActivityGroupByOutputType[P]>
        }
      >
    >


  export type AIPActivitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aip_id?: boolean
    phase?: boolean
    activity_name?: boolean
    implementation_period?: boolean
    persons_involved?: boolean
    outputs?: boolean
    budget_amount?: boolean
    budget_source?: boolean
    aip?: boolean | AIPDefaultArgs<ExtArgs>
    pir_reviews?: boolean | AIPActivity$pir_reviewsArgs<ExtArgs>
    _count?: boolean | AIPActivityCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aIPActivity"]>

  export type AIPActivitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aip_id?: boolean
    phase?: boolean
    activity_name?: boolean
    implementation_period?: boolean
    persons_involved?: boolean
    outputs?: boolean
    budget_amount?: boolean
    budget_source?: boolean
    aip?: boolean | AIPDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aIPActivity"]>

  export type AIPActivitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aip_id?: boolean
    phase?: boolean
    activity_name?: boolean
    implementation_period?: boolean
    persons_involved?: boolean
    outputs?: boolean
    budget_amount?: boolean
    budget_source?: boolean
    aip?: boolean | AIPDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["aIPActivity"]>

  export type AIPActivitySelectScalar = {
    id?: boolean
    aip_id?: boolean
    phase?: boolean
    activity_name?: boolean
    implementation_period?: boolean
    persons_involved?: boolean
    outputs?: boolean
    budget_amount?: boolean
    budget_source?: boolean
  }

  export type AIPActivityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "aip_id" | "phase" | "activity_name" | "implementation_period" | "persons_involved" | "outputs" | "budget_amount" | "budget_source", ExtArgs["result"]["aIPActivity"]>
  export type AIPActivityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aip?: boolean | AIPDefaultArgs<ExtArgs>
    pir_reviews?: boolean | AIPActivity$pir_reviewsArgs<ExtArgs>
    _count?: boolean | AIPActivityCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type AIPActivityIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aip?: boolean | AIPDefaultArgs<ExtArgs>
  }
  export type AIPActivityIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aip?: boolean | AIPDefaultArgs<ExtArgs>
  }

  export type $AIPActivityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AIPActivity"
    objects: {
      aip: Prisma.$AIPPayload<ExtArgs>
      pir_reviews: Prisma.$PIRActivityReviewPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      aip_id: number
      phase: string
      activity_name: string
      implementation_period: string
      persons_involved: string
      outputs: string
      budget_amount: Prisma.Decimal
      budget_source: string
    }, ExtArgs["result"]["aIPActivity"]>
    composites: {}
  }

  type AIPActivityGetPayload<S extends boolean | null | undefined | AIPActivityDefaultArgs> = $Result.GetResult<Prisma.$AIPActivityPayload, S>

  type AIPActivityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AIPActivityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AIPActivityCountAggregateInputType | true
    }

  export interface AIPActivityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AIPActivity'], meta: { name: 'AIPActivity' } }
    /**
     * Find zero or one AIPActivity that matches the filter.
     * @param {AIPActivityFindUniqueArgs} args - Arguments to find a AIPActivity
     * @example
     * // Get one AIPActivity
     * const aIPActivity = await prisma.aIPActivity.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AIPActivityFindUniqueArgs>(args: SelectSubset<T, AIPActivityFindUniqueArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AIPActivity that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AIPActivityFindUniqueOrThrowArgs} args - Arguments to find a AIPActivity
     * @example
     * // Get one AIPActivity
     * const aIPActivity = await prisma.aIPActivity.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AIPActivityFindUniqueOrThrowArgs>(args: SelectSubset<T, AIPActivityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AIPActivity that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPActivityFindFirstArgs} args - Arguments to find a AIPActivity
     * @example
     * // Get one AIPActivity
     * const aIPActivity = await prisma.aIPActivity.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AIPActivityFindFirstArgs>(args?: SelectSubset<T, AIPActivityFindFirstArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AIPActivity that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPActivityFindFirstOrThrowArgs} args - Arguments to find a AIPActivity
     * @example
     * // Get one AIPActivity
     * const aIPActivity = await prisma.aIPActivity.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AIPActivityFindFirstOrThrowArgs>(args?: SelectSubset<T, AIPActivityFindFirstOrThrowArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AIPActivities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPActivityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AIPActivities
     * const aIPActivities = await prisma.aIPActivity.findMany()
     * 
     * // Get first 10 AIPActivities
     * const aIPActivities = await prisma.aIPActivity.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const aIPActivityWithIdOnly = await prisma.aIPActivity.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AIPActivityFindManyArgs>(args?: SelectSubset<T, AIPActivityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AIPActivity.
     * @param {AIPActivityCreateArgs} args - Arguments to create a AIPActivity.
     * @example
     * // Create one AIPActivity
     * const AIPActivity = await prisma.aIPActivity.create({
     *   data: {
     *     // ... data to create a AIPActivity
     *   }
     * })
     * 
     */
    create<T extends AIPActivityCreateArgs>(args: SelectSubset<T, AIPActivityCreateArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AIPActivities.
     * @param {AIPActivityCreateManyArgs} args - Arguments to create many AIPActivities.
     * @example
     * // Create many AIPActivities
     * const aIPActivity = await prisma.aIPActivity.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AIPActivityCreateManyArgs>(args?: SelectSubset<T, AIPActivityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AIPActivities and returns the data saved in the database.
     * @param {AIPActivityCreateManyAndReturnArgs} args - Arguments to create many AIPActivities.
     * @example
     * // Create many AIPActivities
     * const aIPActivity = await prisma.aIPActivity.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AIPActivities and only return the `id`
     * const aIPActivityWithIdOnly = await prisma.aIPActivity.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AIPActivityCreateManyAndReturnArgs>(args?: SelectSubset<T, AIPActivityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AIPActivity.
     * @param {AIPActivityDeleteArgs} args - Arguments to delete one AIPActivity.
     * @example
     * // Delete one AIPActivity
     * const AIPActivity = await prisma.aIPActivity.delete({
     *   where: {
     *     // ... filter to delete one AIPActivity
     *   }
     * })
     * 
     */
    delete<T extends AIPActivityDeleteArgs>(args: SelectSubset<T, AIPActivityDeleteArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AIPActivity.
     * @param {AIPActivityUpdateArgs} args - Arguments to update one AIPActivity.
     * @example
     * // Update one AIPActivity
     * const aIPActivity = await prisma.aIPActivity.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AIPActivityUpdateArgs>(args: SelectSubset<T, AIPActivityUpdateArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AIPActivities.
     * @param {AIPActivityDeleteManyArgs} args - Arguments to filter AIPActivities to delete.
     * @example
     * // Delete a few AIPActivities
     * const { count } = await prisma.aIPActivity.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AIPActivityDeleteManyArgs>(args?: SelectSubset<T, AIPActivityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AIPActivities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPActivityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AIPActivities
     * const aIPActivity = await prisma.aIPActivity.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AIPActivityUpdateManyArgs>(args: SelectSubset<T, AIPActivityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AIPActivities and returns the data updated in the database.
     * @param {AIPActivityUpdateManyAndReturnArgs} args - Arguments to update many AIPActivities.
     * @example
     * // Update many AIPActivities
     * const aIPActivity = await prisma.aIPActivity.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AIPActivities and only return the `id`
     * const aIPActivityWithIdOnly = await prisma.aIPActivity.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AIPActivityUpdateManyAndReturnArgs>(args: SelectSubset<T, AIPActivityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AIPActivity.
     * @param {AIPActivityUpsertArgs} args - Arguments to update or create a AIPActivity.
     * @example
     * // Update or create a AIPActivity
     * const aIPActivity = await prisma.aIPActivity.upsert({
     *   create: {
     *     // ... data to create a AIPActivity
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AIPActivity we want to update
     *   }
     * })
     */
    upsert<T extends AIPActivityUpsertArgs>(args: SelectSubset<T, AIPActivityUpsertArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AIPActivities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPActivityCountArgs} args - Arguments to filter AIPActivities to count.
     * @example
     * // Count the number of AIPActivities
     * const count = await prisma.aIPActivity.count({
     *   where: {
     *     // ... the filter for the AIPActivities we want to count
     *   }
     * })
    **/
    count<T extends AIPActivityCountArgs>(
      args?: Subset<T, AIPActivityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AIPActivityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AIPActivity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPActivityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AIPActivityAggregateArgs>(args: Subset<T, AIPActivityAggregateArgs>): Prisma.PrismaPromise<GetAIPActivityAggregateType<T>>

    /**
     * Group by AIPActivity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AIPActivityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AIPActivityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AIPActivityGroupByArgs['orderBy'] }
        : { orderBy?: AIPActivityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AIPActivityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAIPActivityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AIPActivity model
   */
  readonly fields: AIPActivityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AIPActivity.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AIPActivityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    aip<T extends AIPDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AIPDefaultArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    pir_reviews<T extends AIPActivity$pir_reviewsArgs<ExtArgs> = {}>(args?: Subset<T, AIPActivity$pir_reviewsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AIPActivity model
   */
  interface AIPActivityFieldRefs {
    readonly id: FieldRef<"AIPActivity", 'Int'>
    readonly aip_id: FieldRef<"AIPActivity", 'Int'>
    readonly phase: FieldRef<"AIPActivity", 'String'>
    readonly activity_name: FieldRef<"AIPActivity", 'String'>
    readonly implementation_period: FieldRef<"AIPActivity", 'String'>
    readonly persons_involved: FieldRef<"AIPActivity", 'String'>
    readonly outputs: FieldRef<"AIPActivity", 'String'>
    readonly budget_amount: FieldRef<"AIPActivity", 'Decimal'>
    readonly budget_source: FieldRef<"AIPActivity", 'String'>
  }
    

  // Custom InputTypes
  /**
   * AIPActivity findUnique
   */
  export type AIPActivityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * Filter, which AIPActivity to fetch.
     */
    where: AIPActivityWhereUniqueInput
  }

  /**
   * AIPActivity findUniqueOrThrow
   */
  export type AIPActivityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * Filter, which AIPActivity to fetch.
     */
    where: AIPActivityWhereUniqueInput
  }

  /**
   * AIPActivity findFirst
   */
  export type AIPActivityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * Filter, which AIPActivity to fetch.
     */
    where?: AIPActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AIPActivities to fetch.
     */
    orderBy?: AIPActivityOrderByWithRelationInput | AIPActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AIPActivities.
     */
    cursor?: AIPActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AIPActivities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AIPActivities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AIPActivities.
     */
    distinct?: AIPActivityScalarFieldEnum | AIPActivityScalarFieldEnum[]
  }

  /**
   * AIPActivity findFirstOrThrow
   */
  export type AIPActivityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * Filter, which AIPActivity to fetch.
     */
    where?: AIPActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AIPActivities to fetch.
     */
    orderBy?: AIPActivityOrderByWithRelationInput | AIPActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AIPActivities.
     */
    cursor?: AIPActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AIPActivities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AIPActivities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AIPActivities.
     */
    distinct?: AIPActivityScalarFieldEnum | AIPActivityScalarFieldEnum[]
  }

  /**
   * AIPActivity findMany
   */
  export type AIPActivityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * Filter, which AIPActivities to fetch.
     */
    where?: AIPActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AIPActivities to fetch.
     */
    orderBy?: AIPActivityOrderByWithRelationInput | AIPActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AIPActivities.
     */
    cursor?: AIPActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AIPActivities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AIPActivities.
     */
    skip?: number
    distinct?: AIPActivityScalarFieldEnum | AIPActivityScalarFieldEnum[]
  }

  /**
   * AIPActivity create
   */
  export type AIPActivityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * The data needed to create a AIPActivity.
     */
    data: XOR<AIPActivityCreateInput, AIPActivityUncheckedCreateInput>
  }

  /**
   * AIPActivity createMany
   */
  export type AIPActivityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AIPActivities.
     */
    data: AIPActivityCreateManyInput | AIPActivityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AIPActivity createManyAndReturn
   */
  export type AIPActivityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * The data used to create many AIPActivities.
     */
    data: AIPActivityCreateManyInput | AIPActivityCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * AIPActivity update
   */
  export type AIPActivityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * The data needed to update a AIPActivity.
     */
    data: XOR<AIPActivityUpdateInput, AIPActivityUncheckedUpdateInput>
    /**
     * Choose, which AIPActivity to update.
     */
    where: AIPActivityWhereUniqueInput
  }

  /**
   * AIPActivity updateMany
   */
  export type AIPActivityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AIPActivities.
     */
    data: XOR<AIPActivityUpdateManyMutationInput, AIPActivityUncheckedUpdateManyInput>
    /**
     * Filter which AIPActivities to update
     */
    where?: AIPActivityWhereInput
    /**
     * Limit how many AIPActivities to update.
     */
    limit?: number
  }

  /**
   * AIPActivity updateManyAndReturn
   */
  export type AIPActivityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * The data used to update AIPActivities.
     */
    data: XOR<AIPActivityUpdateManyMutationInput, AIPActivityUncheckedUpdateManyInput>
    /**
     * Filter which AIPActivities to update
     */
    where?: AIPActivityWhereInput
    /**
     * Limit how many AIPActivities to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * AIPActivity upsert
   */
  export type AIPActivityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * The filter to search for the AIPActivity to update in case it exists.
     */
    where: AIPActivityWhereUniqueInput
    /**
     * In case the AIPActivity found by the `where` argument doesn't exist, create a new AIPActivity with this data.
     */
    create: XOR<AIPActivityCreateInput, AIPActivityUncheckedCreateInput>
    /**
     * In case the AIPActivity was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AIPActivityUpdateInput, AIPActivityUncheckedUpdateInput>
  }

  /**
   * AIPActivity delete
   */
  export type AIPActivityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
    /**
     * Filter which AIPActivity to delete.
     */
    where: AIPActivityWhereUniqueInput
  }

  /**
   * AIPActivity deleteMany
   */
  export type AIPActivityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AIPActivities to delete
     */
    where?: AIPActivityWhereInput
    /**
     * Limit how many AIPActivities to delete.
     */
    limit?: number
  }

  /**
   * AIPActivity.pir_reviews
   */
  export type AIPActivity$pir_reviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    where?: PIRActivityReviewWhereInput
    orderBy?: PIRActivityReviewOrderByWithRelationInput | PIRActivityReviewOrderByWithRelationInput[]
    cursor?: PIRActivityReviewWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PIRActivityReviewScalarFieldEnum | PIRActivityReviewScalarFieldEnum[]
  }

  /**
   * AIPActivity without action
   */
  export type AIPActivityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AIPActivity
     */
    select?: AIPActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the AIPActivity
     */
    omit?: AIPActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AIPActivityInclude<ExtArgs> | null
  }


  /**
   * Model PIR
   */

  export type AggregatePIR = {
    _count: PIRCountAggregateOutputType | null
    _avg: PIRAvgAggregateOutputType | null
    _sum: PIRSumAggregateOutputType | null
    _min: PIRMinAggregateOutputType | null
    _max: PIRMaxAggregateOutputType | null
  }

  export type PIRAvgAggregateOutputType = {
    id: number | null
    aip_id: number | null
    total_budget: Decimal | null
  }

  export type PIRSumAggregateOutputType = {
    id: number | null
    aip_id: number | null
    total_budget: Decimal | null
  }

  export type PIRMinAggregateOutputType = {
    id: number | null
    aip_id: number | null
    quarter: string | null
    program_owner: string | null
    total_budget: Decimal | null
    fund_source: string | null
    created_at: Date | null
  }

  export type PIRMaxAggregateOutputType = {
    id: number | null
    aip_id: number | null
    quarter: string | null
    program_owner: string | null
    total_budget: Decimal | null
    fund_source: string | null
    created_at: Date | null
  }

  export type PIRCountAggregateOutputType = {
    id: number
    aip_id: number
    quarter: number
    program_owner: number
    total_budget: number
    fund_source: number
    created_at: number
    _all: number
  }


  export type PIRAvgAggregateInputType = {
    id?: true
    aip_id?: true
    total_budget?: true
  }

  export type PIRSumAggregateInputType = {
    id?: true
    aip_id?: true
    total_budget?: true
  }

  export type PIRMinAggregateInputType = {
    id?: true
    aip_id?: true
    quarter?: true
    program_owner?: true
    total_budget?: true
    fund_source?: true
    created_at?: true
  }

  export type PIRMaxAggregateInputType = {
    id?: true
    aip_id?: true
    quarter?: true
    program_owner?: true
    total_budget?: true
    fund_source?: true
    created_at?: true
  }

  export type PIRCountAggregateInputType = {
    id?: true
    aip_id?: true
    quarter?: true
    program_owner?: true
    total_budget?: true
    fund_source?: true
    created_at?: true
    _all?: true
  }

  export type PIRAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PIR to aggregate.
     */
    where?: PIRWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRS to fetch.
     */
    orderBy?: PIROrderByWithRelationInput | PIROrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PIRWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PIRS
    **/
    _count?: true | PIRCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PIRAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PIRSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PIRMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PIRMaxAggregateInputType
  }

  export type GetPIRAggregateType<T extends PIRAggregateArgs> = {
        [P in keyof T & keyof AggregatePIR]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePIR[P]>
      : GetScalarType<T[P], AggregatePIR[P]>
  }




  export type PIRGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PIRWhereInput
    orderBy?: PIROrderByWithAggregationInput | PIROrderByWithAggregationInput[]
    by: PIRScalarFieldEnum[] | PIRScalarFieldEnum
    having?: PIRScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PIRCountAggregateInputType | true
    _avg?: PIRAvgAggregateInputType
    _sum?: PIRSumAggregateInputType
    _min?: PIRMinAggregateInputType
    _max?: PIRMaxAggregateInputType
  }

  export type PIRGroupByOutputType = {
    id: number
    aip_id: number
    quarter: string
    program_owner: string
    total_budget: Decimal
    fund_source: string
    created_at: Date
    _count: PIRCountAggregateOutputType | null
    _avg: PIRAvgAggregateOutputType | null
    _sum: PIRSumAggregateOutputType | null
    _min: PIRMinAggregateOutputType | null
    _max: PIRMaxAggregateOutputType | null
  }

  type GetPIRGroupByPayload<T extends PIRGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PIRGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PIRGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PIRGroupByOutputType[P]>
            : GetScalarType<T[P], PIRGroupByOutputType[P]>
        }
      >
    >


  export type PIRSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aip_id?: boolean
    quarter?: boolean
    program_owner?: boolean
    total_budget?: boolean
    fund_source?: boolean
    created_at?: boolean
    aip?: boolean | AIPDefaultArgs<ExtArgs>
    activity_reviews?: boolean | PIR$activity_reviewsArgs<ExtArgs>
    factors?: boolean | PIR$factorsArgs<ExtArgs>
    _count?: boolean | PIRCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIR"]>

  export type PIRSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aip_id?: boolean
    quarter?: boolean
    program_owner?: boolean
    total_budget?: boolean
    fund_source?: boolean
    created_at?: boolean
    aip?: boolean | AIPDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIR"]>

  export type PIRSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    aip_id?: boolean
    quarter?: boolean
    program_owner?: boolean
    total_budget?: boolean
    fund_source?: boolean
    created_at?: boolean
    aip?: boolean | AIPDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIR"]>

  export type PIRSelectScalar = {
    id?: boolean
    aip_id?: boolean
    quarter?: boolean
    program_owner?: boolean
    total_budget?: boolean
    fund_source?: boolean
    created_at?: boolean
  }

  export type PIROmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "aip_id" | "quarter" | "program_owner" | "total_budget" | "fund_source" | "created_at", ExtArgs["result"]["pIR"]>
  export type PIRInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aip?: boolean | AIPDefaultArgs<ExtArgs>
    activity_reviews?: boolean | PIR$activity_reviewsArgs<ExtArgs>
    factors?: boolean | PIR$factorsArgs<ExtArgs>
    _count?: boolean | PIRCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type PIRIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aip?: boolean | AIPDefaultArgs<ExtArgs>
  }
  export type PIRIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    aip?: boolean | AIPDefaultArgs<ExtArgs>
  }

  export type $PIRPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PIR"
    objects: {
      aip: Prisma.$AIPPayload<ExtArgs>
      activity_reviews: Prisma.$PIRActivityReviewPayload<ExtArgs>[]
      factors: Prisma.$PIRFactorPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      aip_id: number
      quarter: string
      program_owner: string
      total_budget: Prisma.Decimal
      fund_source: string
      created_at: Date
    }, ExtArgs["result"]["pIR"]>
    composites: {}
  }

  type PIRGetPayload<S extends boolean | null | undefined | PIRDefaultArgs> = $Result.GetResult<Prisma.$PIRPayload, S>

  type PIRCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PIRFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PIRCountAggregateInputType | true
    }

  export interface PIRDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PIR'], meta: { name: 'PIR' } }
    /**
     * Find zero or one PIR that matches the filter.
     * @param {PIRFindUniqueArgs} args - Arguments to find a PIR
     * @example
     * // Get one PIR
     * const pIR = await prisma.pIR.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PIRFindUniqueArgs>(args: SelectSubset<T, PIRFindUniqueArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PIR that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PIRFindUniqueOrThrowArgs} args - Arguments to find a PIR
     * @example
     * // Get one PIR
     * const pIR = await prisma.pIR.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PIRFindUniqueOrThrowArgs>(args: SelectSubset<T, PIRFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PIR that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFindFirstArgs} args - Arguments to find a PIR
     * @example
     * // Get one PIR
     * const pIR = await prisma.pIR.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PIRFindFirstArgs>(args?: SelectSubset<T, PIRFindFirstArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PIR that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFindFirstOrThrowArgs} args - Arguments to find a PIR
     * @example
     * // Get one PIR
     * const pIR = await prisma.pIR.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PIRFindFirstOrThrowArgs>(args?: SelectSubset<T, PIRFindFirstOrThrowArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PIRS that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PIRS
     * const pIRS = await prisma.pIR.findMany()
     * 
     * // Get first 10 PIRS
     * const pIRS = await prisma.pIR.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pIRWithIdOnly = await prisma.pIR.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PIRFindManyArgs>(args?: SelectSubset<T, PIRFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PIR.
     * @param {PIRCreateArgs} args - Arguments to create a PIR.
     * @example
     * // Create one PIR
     * const PIR = await prisma.pIR.create({
     *   data: {
     *     // ... data to create a PIR
     *   }
     * })
     * 
     */
    create<T extends PIRCreateArgs>(args: SelectSubset<T, PIRCreateArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PIRS.
     * @param {PIRCreateManyArgs} args - Arguments to create many PIRS.
     * @example
     * // Create many PIRS
     * const pIR = await prisma.pIR.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PIRCreateManyArgs>(args?: SelectSubset<T, PIRCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PIRS and returns the data saved in the database.
     * @param {PIRCreateManyAndReturnArgs} args - Arguments to create many PIRS.
     * @example
     * // Create many PIRS
     * const pIR = await prisma.pIR.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PIRS and only return the `id`
     * const pIRWithIdOnly = await prisma.pIR.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PIRCreateManyAndReturnArgs>(args?: SelectSubset<T, PIRCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PIR.
     * @param {PIRDeleteArgs} args - Arguments to delete one PIR.
     * @example
     * // Delete one PIR
     * const PIR = await prisma.pIR.delete({
     *   where: {
     *     // ... filter to delete one PIR
     *   }
     * })
     * 
     */
    delete<T extends PIRDeleteArgs>(args: SelectSubset<T, PIRDeleteArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PIR.
     * @param {PIRUpdateArgs} args - Arguments to update one PIR.
     * @example
     * // Update one PIR
     * const pIR = await prisma.pIR.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PIRUpdateArgs>(args: SelectSubset<T, PIRUpdateArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PIRS.
     * @param {PIRDeleteManyArgs} args - Arguments to filter PIRS to delete.
     * @example
     * // Delete a few PIRS
     * const { count } = await prisma.pIR.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PIRDeleteManyArgs>(args?: SelectSubset<T, PIRDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PIRS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PIRS
     * const pIR = await prisma.pIR.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PIRUpdateManyArgs>(args: SelectSubset<T, PIRUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PIRS and returns the data updated in the database.
     * @param {PIRUpdateManyAndReturnArgs} args - Arguments to update many PIRS.
     * @example
     * // Update many PIRS
     * const pIR = await prisma.pIR.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PIRS and only return the `id`
     * const pIRWithIdOnly = await prisma.pIR.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PIRUpdateManyAndReturnArgs>(args: SelectSubset<T, PIRUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PIR.
     * @param {PIRUpsertArgs} args - Arguments to update or create a PIR.
     * @example
     * // Update or create a PIR
     * const pIR = await prisma.pIR.upsert({
     *   create: {
     *     // ... data to create a PIR
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PIR we want to update
     *   }
     * })
     */
    upsert<T extends PIRUpsertArgs>(args: SelectSubset<T, PIRUpsertArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PIRS.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRCountArgs} args - Arguments to filter PIRS to count.
     * @example
     * // Count the number of PIRS
     * const count = await prisma.pIR.count({
     *   where: {
     *     // ... the filter for the PIRS we want to count
     *   }
     * })
    **/
    count<T extends PIRCountArgs>(
      args?: Subset<T, PIRCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PIRCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PIR.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PIRAggregateArgs>(args: Subset<T, PIRAggregateArgs>): Prisma.PrismaPromise<GetPIRAggregateType<T>>

    /**
     * Group by PIR.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PIRGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PIRGroupByArgs['orderBy'] }
        : { orderBy?: PIRGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PIRGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPIRGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PIR model
   */
  readonly fields: PIRFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PIR.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PIRClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    aip<T extends AIPDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AIPDefaultArgs<ExtArgs>>): Prisma__AIPClient<$Result.GetResult<Prisma.$AIPPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    activity_reviews<T extends PIR$activity_reviewsArgs<ExtArgs> = {}>(args?: Subset<T, PIR$activity_reviewsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    factors<T extends PIR$factorsArgs<ExtArgs> = {}>(args?: Subset<T, PIR$factorsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PIR model
   */
  interface PIRFieldRefs {
    readonly id: FieldRef<"PIR", 'Int'>
    readonly aip_id: FieldRef<"PIR", 'Int'>
    readonly quarter: FieldRef<"PIR", 'String'>
    readonly program_owner: FieldRef<"PIR", 'String'>
    readonly total_budget: FieldRef<"PIR", 'Decimal'>
    readonly fund_source: FieldRef<"PIR", 'String'>
    readonly created_at: FieldRef<"PIR", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PIR findUnique
   */
  export type PIRFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * Filter, which PIR to fetch.
     */
    where: PIRWhereUniqueInput
  }

  /**
   * PIR findUniqueOrThrow
   */
  export type PIRFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * Filter, which PIR to fetch.
     */
    where: PIRWhereUniqueInput
  }

  /**
   * PIR findFirst
   */
  export type PIRFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * Filter, which PIR to fetch.
     */
    where?: PIRWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRS to fetch.
     */
    orderBy?: PIROrderByWithRelationInput | PIROrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PIRS.
     */
    cursor?: PIRWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PIRS.
     */
    distinct?: PIRScalarFieldEnum | PIRScalarFieldEnum[]
  }

  /**
   * PIR findFirstOrThrow
   */
  export type PIRFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * Filter, which PIR to fetch.
     */
    where?: PIRWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRS to fetch.
     */
    orderBy?: PIROrderByWithRelationInput | PIROrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PIRS.
     */
    cursor?: PIRWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRS.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PIRS.
     */
    distinct?: PIRScalarFieldEnum | PIRScalarFieldEnum[]
  }

  /**
   * PIR findMany
   */
  export type PIRFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * Filter, which PIRS to fetch.
     */
    where?: PIRWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRS to fetch.
     */
    orderBy?: PIROrderByWithRelationInput | PIROrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PIRS.
     */
    cursor?: PIRWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRS from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRS.
     */
    skip?: number
    distinct?: PIRScalarFieldEnum | PIRScalarFieldEnum[]
  }

  /**
   * PIR create
   */
  export type PIRCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * The data needed to create a PIR.
     */
    data: XOR<PIRCreateInput, PIRUncheckedCreateInput>
  }

  /**
   * PIR createMany
   */
  export type PIRCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PIRS.
     */
    data: PIRCreateManyInput | PIRCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PIR createManyAndReturn
   */
  export type PIRCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * The data used to create many PIRS.
     */
    data: PIRCreateManyInput | PIRCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PIR update
   */
  export type PIRUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * The data needed to update a PIR.
     */
    data: XOR<PIRUpdateInput, PIRUncheckedUpdateInput>
    /**
     * Choose, which PIR to update.
     */
    where: PIRWhereUniqueInput
  }

  /**
   * PIR updateMany
   */
  export type PIRUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PIRS.
     */
    data: XOR<PIRUpdateManyMutationInput, PIRUncheckedUpdateManyInput>
    /**
     * Filter which PIRS to update
     */
    where?: PIRWhereInput
    /**
     * Limit how many PIRS to update.
     */
    limit?: number
  }

  /**
   * PIR updateManyAndReturn
   */
  export type PIRUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * The data used to update PIRS.
     */
    data: XOR<PIRUpdateManyMutationInput, PIRUncheckedUpdateManyInput>
    /**
     * Filter which PIRS to update
     */
    where?: PIRWhereInput
    /**
     * Limit how many PIRS to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PIR upsert
   */
  export type PIRUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * The filter to search for the PIR to update in case it exists.
     */
    where: PIRWhereUniqueInput
    /**
     * In case the PIR found by the `where` argument doesn't exist, create a new PIR with this data.
     */
    create: XOR<PIRCreateInput, PIRUncheckedCreateInput>
    /**
     * In case the PIR was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PIRUpdateInput, PIRUncheckedUpdateInput>
  }

  /**
   * PIR delete
   */
  export type PIRDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
    /**
     * Filter which PIR to delete.
     */
    where: PIRWhereUniqueInput
  }

  /**
   * PIR deleteMany
   */
  export type PIRDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PIRS to delete
     */
    where?: PIRWhereInput
    /**
     * Limit how many PIRS to delete.
     */
    limit?: number
  }

  /**
   * PIR.activity_reviews
   */
  export type PIR$activity_reviewsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    where?: PIRActivityReviewWhereInput
    orderBy?: PIRActivityReviewOrderByWithRelationInput | PIRActivityReviewOrderByWithRelationInput[]
    cursor?: PIRActivityReviewWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PIRActivityReviewScalarFieldEnum | PIRActivityReviewScalarFieldEnum[]
  }

  /**
   * PIR.factors
   */
  export type PIR$factorsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    where?: PIRFactorWhereInput
    orderBy?: PIRFactorOrderByWithRelationInput | PIRFactorOrderByWithRelationInput[]
    cursor?: PIRFactorWhereUniqueInput
    take?: number
    skip?: number
    distinct?: PIRFactorScalarFieldEnum | PIRFactorScalarFieldEnum[]
  }

  /**
   * PIR without action
   */
  export type PIRDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIR
     */
    select?: PIRSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIR
     */
    omit?: PIROmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRInclude<ExtArgs> | null
  }


  /**
   * Model PIRActivityReview
   */

  export type AggregatePIRActivityReview = {
    _count: PIRActivityReviewCountAggregateOutputType | null
    _avg: PIRActivityReviewAvgAggregateOutputType | null
    _sum: PIRActivityReviewSumAggregateOutputType | null
    _min: PIRActivityReviewMinAggregateOutputType | null
    _max: PIRActivityReviewMaxAggregateOutputType | null
  }

  export type PIRActivityReviewAvgAggregateOutputType = {
    id: number | null
    pir_id: number | null
    aip_activity_id: number | null
    physical_target: Decimal | null
    financial_target: Decimal | null
    physical_accomplished: Decimal | null
    financial_accomplished: Decimal | null
  }

  export type PIRActivityReviewSumAggregateOutputType = {
    id: number | null
    pir_id: number | null
    aip_activity_id: number | null
    physical_target: Decimal | null
    financial_target: Decimal | null
    physical_accomplished: Decimal | null
    financial_accomplished: Decimal | null
  }

  export type PIRActivityReviewMinAggregateOutputType = {
    id: number | null
    pir_id: number | null
    aip_activity_id: number | null
    physical_target: Decimal | null
    financial_target: Decimal | null
    physical_accomplished: Decimal | null
    financial_accomplished: Decimal | null
    actions_to_address_gap: string | null
  }

  export type PIRActivityReviewMaxAggregateOutputType = {
    id: number | null
    pir_id: number | null
    aip_activity_id: number | null
    physical_target: Decimal | null
    financial_target: Decimal | null
    physical_accomplished: Decimal | null
    financial_accomplished: Decimal | null
    actions_to_address_gap: string | null
  }

  export type PIRActivityReviewCountAggregateOutputType = {
    id: number
    pir_id: number
    aip_activity_id: number
    physical_target: number
    financial_target: number
    physical_accomplished: number
    financial_accomplished: number
    actions_to_address_gap: number
    _all: number
  }


  export type PIRActivityReviewAvgAggregateInputType = {
    id?: true
    pir_id?: true
    aip_activity_id?: true
    physical_target?: true
    financial_target?: true
    physical_accomplished?: true
    financial_accomplished?: true
  }

  export type PIRActivityReviewSumAggregateInputType = {
    id?: true
    pir_id?: true
    aip_activity_id?: true
    physical_target?: true
    financial_target?: true
    physical_accomplished?: true
    financial_accomplished?: true
  }

  export type PIRActivityReviewMinAggregateInputType = {
    id?: true
    pir_id?: true
    aip_activity_id?: true
    physical_target?: true
    financial_target?: true
    physical_accomplished?: true
    financial_accomplished?: true
    actions_to_address_gap?: true
  }

  export type PIRActivityReviewMaxAggregateInputType = {
    id?: true
    pir_id?: true
    aip_activity_id?: true
    physical_target?: true
    financial_target?: true
    physical_accomplished?: true
    financial_accomplished?: true
    actions_to_address_gap?: true
  }

  export type PIRActivityReviewCountAggregateInputType = {
    id?: true
    pir_id?: true
    aip_activity_id?: true
    physical_target?: true
    financial_target?: true
    physical_accomplished?: true
    financial_accomplished?: true
    actions_to_address_gap?: true
    _all?: true
  }

  export type PIRActivityReviewAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PIRActivityReview to aggregate.
     */
    where?: PIRActivityReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRActivityReviews to fetch.
     */
    orderBy?: PIRActivityReviewOrderByWithRelationInput | PIRActivityReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PIRActivityReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRActivityReviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRActivityReviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PIRActivityReviews
    **/
    _count?: true | PIRActivityReviewCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PIRActivityReviewAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PIRActivityReviewSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PIRActivityReviewMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PIRActivityReviewMaxAggregateInputType
  }

  export type GetPIRActivityReviewAggregateType<T extends PIRActivityReviewAggregateArgs> = {
        [P in keyof T & keyof AggregatePIRActivityReview]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePIRActivityReview[P]>
      : GetScalarType<T[P], AggregatePIRActivityReview[P]>
  }




  export type PIRActivityReviewGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PIRActivityReviewWhereInput
    orderBy?: PIRActivityReviewOrderByWithAggregationInput | PIRActivityReviewOrderByWithAggregationInput[]
    by: PIRActivityReviewScalarFieldEnum[] | PIRActivityReviewScalarFieldEnum
    having?: PIRActivityReviewScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PIRActivityReviewCountAggregateInputType | true
    _avg?: PIRActivityReviewAvgAggregateInputType
    _sum?: PIRActivityReviewSumAggregateInputType
    _min?: PIRActivityReviewMinAggregateInputType
    _max?: PIRActivityReviewMaxAggregateInputType
  }

  export type PIRActivityReviewGroupByOutputType = {
    id: number
    pir_id: number
    aip_activity_id: number
    physical_target: Decimal
    financial_target: Decimal
    physical_accomplished: Decimal
    financial_accomplished: Decimal
    actions_to_address_gap: string | null
    _count: PIRActivityReviewCountAggregateOutputType | null
    _avg: PIRActivityReviewAvgAggregateOutputType | null
    _sum: PIRActivityReviewSumAggregateOutputType | null
    _min: PIRActivityReviewMinAggregateOutputType | null
    _max: PIRActivityReviewMaxAggregateOutputType | null
  }

  type GetPIRActivityReviewGroupByPayload<T extends PIRActivityReviewGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PIRActivityReviewGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PIRActivityReviewGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PIRActivityReviewGroupByOutputType[P]>
            : GetScalarType<T[P], PIRActivityReviewGroupByOutputType[P]>
        }
      >
    >


  export type PIRActivityReviewSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pir_id?: boolean
    aip_activity_id?: boolean
    physical_target?: boolean
    financial_target?: boolean
    physical_accomplished?: boolean
    financial_accomplished?: boolean
    actions_to_address_gap?: boolean
    pir?: boolean | PIRDefaultArgs<ExtArgs>
    aip_activity?: boolean | AIPActivityDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIRActivityReview"]>

  export type PIRActivityReviewSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pir_id?: boolean
    aip_activity_id?: boolean
    physical_target?: boolean
    financial_target?: boolean
    physical_accomplished?: boolean
    financial_accomplished?: boolean
    actions_to_address_gap?: boolean
    pir?: boolean | PIRDefaultArgs<ExtArgs>
    aip_activity?: boolean | AIPActivityDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIRActivityReview"]>

  export type PIRActivityReviewSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pir_id?: boolean
    aip_activity_id?: boolean
    physical_target?: boolean
    financial_target?: boolean
    physical_accomplished?: boolean
    financial_accomplished?: boolean
    actions_to_address_gap?: boolean
    pir?: boolean | PIRDefaultArgs<ExtArgs>
    aip_activity?: boolean | AIPActivityDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIRActivityReview"]>

  export type PIRActivityReviewSelectScalar = {
    id?: boolean
    pir_id?: boolean
    aip_activity_id?: boolean
    physical_target?: boolean
    financial_target?: boolean
    physical_accomplished?: boolean
    financial_accomplished?: boolean
    actions_to_address_gap?: boolean
  }

  export type PIRActivityReviewOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "pir_id" | "aip_activity_id" | "physical_target" | "financial_target" | "physical_accomplished" | "financial_accomplished" | "actions_to_address_gap", ExtArgs["result"]["pIRActivityReview"]>
  export type PIRActivityReviewInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pir?: boolean | PIRDefaultArgs<ExtArgs>
    aip_activity?: boolean | AIPActivityDefaultArgs<ExtArgs>
  }
  export type PIRActivityReviewIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pir?: boolean | PIRDefaultArgs<ExtArgs>
    aip_activity?: boolean | AIPActivityDefaultArgs<ExtArgs>
  }
  export type PIRActivityReviewIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pir?: boolean | PIRDefaultArgs<ExtArgs>
    aip_activity?: boolean | AIPActivityDefaultArgs<ExtArgs>
  }

  export type $PIRActivityReviewPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PIRActivityReview"
    objects: {
      pir: Prisma.$PIRPayload<ExtArgs>
      aip_activity: Prisma.$AIPActivityPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      pir_id: number
      aip_activity_id: number
      physical_target: Prisma.Decimal
      financial_target: Prisma.Decimal
      physical_accomplished: Prisma.Decimal
      financial_accomplished: Prisma.Decimal
      actions_to_address_gap: string | null
    }, ExtArgs["result"]["pIRActivityReview"]>
    composites: {}
  }

  type PIRActivityReviewGetPayload<S extends boolean | null | undefined | PIRActivityReviewDefaultArgs> = $Result.GetResult<Prisma.$PIRActivityReviewPayload, S>

  type PIRActivityReviewCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PIRActivityReviewFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PIRActivityReviewCountAggregateInputType | true
    }

  export interface PIRActivityReviewDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PIRActivityReview'], meta: { name: 'PIRActivityReview' } }
    /**
     * Find zero or one PIRActivityReview that matches the filter.
     * @param {PIRActivityReviewFindUniqueArgs} args - Arguments to find a PIRActivityReview
     * @example
     * // Get one PIRActivityReview
     * const pIRActivityReview = await prisma.pIRActivityReview.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PIRActivityReviewFindUniqueArgs>(args: SelectSubset<T, PIRActivityReviewFindUniqueArgs<ExtArgs>>): Prisma__PIRActivityReviewClient<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PIRActivityReview that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PIRActivityReviewFindUniqueOrThrowArgs} args - Arguments to find a PIRActivityReview
     * @example
     * // Get one PIRActivityReview
     * const pIRActivityReview = await prisma.pIRActivityReview.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PIRActivityReviewFindUniqueOrThrowArgs>(args: SelectSubset<T, PIRActivityReviewFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PIRActivityReviewClient<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PIRActivityReview that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRActivityReviewFindFirstArgs} args - Arguments to find a PIRActivityReview
     * @example
     * // Get one PIRActivityReview
     * const pIRActivityReview = await prisma.pIRActivityReview.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PIRActivityReviewFindFirstArgs>(args?: SelectSubset<T, PIRActivityReviewFindFirstArgs<ExtArgs>>): Prisma__PIRActivityReviewClient<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PIRActivityReview that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRActivityReviewFindFirstOrThrowArgs} args - Arguments to find a PIRActivityReview
     * @example
     * // Get one PIRActivityReview
     * const pIRActivityReview = await prisma.pIRActivityReview.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PIRActivityReviewFindFirstOrThrowArgs>(args?: SelectSubset<T, PIRActivityReviewFindFirstOrThrowArgs<ExtArgs>>): Prisma__PIRActivityReviewClient<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PIRActivityReviews that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRActivityReviewFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PIRActivityReviews
     * const pIRActivityReviews = await prisma.pIRActivityReview.findMany()
     * 
     * // Get first 10 PIRActivityReviews
     * const pIRActivityReviews = await prisma.pIRActivityReview.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pIRActivityReviewWithIdOnly = await prisma.pIRActivityReview.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PIRActivityReviewFindManyArgs>(args?: SelectSubset<T, PIRActivityReviewFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PIRActivityReview.
     * @param {PIRActivityReviewCreateArgs} args - Arguments to create a PIRActivityReview.
     * @example
     * // Create one PIRActivityReview
     * const PIRActivityReview = await prisma.pIRActivityReview.create({
     *   data: {
     *     // ... data to create a PIRActivityReview
     *   }
     * })
     * 
     */
    create<T extends PIRActivityReviewCreateArgs>(args: SelectSubset<T, PIRActivityReviewCreateArgs<ExtArgs>>): Prisma__PIRActivityReviewClient<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PIRActivityReviews.
     * @param {PIRActivityReviewCreateManyArgs} args - Arguments to create many PIRActivityReviews.
     * @example
     * // Create many PIRActivityReviews
     * const pIRActivityReview = await prisma.pIRActivityReview.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PIRActivityReviewCreateManyArgs>(args?: SelectSubset<T, PIRActivityReviewCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PIRActivityReviews and returns the data saved in the database.
     * @param {PIRActivityReviewCreateManyAndReturnArgs} args - Arguments to create many PIRActivityReviews.
     * @example
     * // Create many PIRActivityReviews
     * const pIRActivityReview = await prisma.pIRActivityReview.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PIRActivityReviews and only return the `id`
     * const pIRActivityReviewWithIdOnly = await prisma.pIRActivityReview.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PIRActivityReviewCreateManyAndReturnArgs>(args?: SelectSubset<T, PIRActivityReviewCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PIRActivityReview.
     * @param {PIRActivityReviewDeleteArgs} args - Arguments to delete one PIRActivityReview.
     * @example
     * // Delete one PIRActivityReview
     * const PIRActivityReview = await prisma.pIRActivityReview.delete({
     *   where: {
     *     // ... filter to delete one PIRActivityReview
     *   }
     * })
     * 
     */
    delete<T extends PIRActivityReviewDeleteArgs>(args: SelectSubset<T, PIRActivityReviewDeleteArgs<ExtArgs>>): Prisma__PIRActivityReviewClient<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PIRActivityReview.
     * @param {PIRActivityReviewUpdateArgs} args - Arguments to update one PIRActivityReview.
     * @example
     * // Update one PIRActivityReview
     * const pIRActivityReview = await prisma.pIRActivityReview.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PIRActivityReviewUpdateArgs>(args: SelectSubset<T, PIRActivityReviewUpdateArgs<ExtArgs>>): Prisma__PIRActivityReviewClient<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PIRActivityReviews.
     * @param {PIRActivityReviewDeleteManyArgs} args - Arguments to filter PIRActivityReviews to delete.
     * @example
     * // Delete a few PIRActivityReviews
     * const { count } = await prisma.pIRActivityReview.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PIRActivityReviewDeleteManyArgs>(args?: SelectSubset<T, PIRActivityReviewDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PIRActivityReviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRActivityReviewUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PIRActivityReviews
     * const pIRActivityReview = await prisma.pIRActivityReview.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PIRActivityReviewUpdateManyArgs>(args: SelectSubset<T, PIRActivityReviewUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PIRActivityReviews and returns the data updated in the database.
     * @param {PIRActivityReviewUpdateManyAndReturnArgs} args - Arguments to update many PIRActivityReviews.
     * @example
     * // Update many PIRActivityReviews
     * const pIRActivityReview = await prisma.pIRActivityReview.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PIRActivityReviews and only return the `id`
     * const pIRActivityReviewWithIdOnly = await prisma.pIRActivityReview.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PIRActivityReviewUpdateManyAndReturnArgs>(args: SelectSubset<T, PIRActivityReviewUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PIRActivityReview.
     * @param {PIRActivityReviewUpsertArgs} args - Arguments to update or create a PIRActivityReview.
     * @example
     * // Update or create a PIRActivityReview
     * const pIRActivityReview = await prisma.pIRActivityReview.upsert({
     *   create: {
     *     // ... data to create a PIRActivityReview
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PIRActivityReview we want to update
     *   }
     * })
     */
    upsert<T extends PIRActivityReviewUpsertArgs>(args: SelectSubset<T, PIRActivityReviewUpsertArgs<ExtArgs>>): Prisma__PIRActivityReviewClient<$Result.GetResult<Prisma.$PIRActivityReviewPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PIRActivityReviews.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRActivityReviewCountArgs} args - Arguments to filter PIRActivityReviews to count.
     * @example
     * // Count the number of PIRActivityReviews
     * const count = await prisma.pIRActivityReview.count({
     *   where: {
     *     // ... the filter for the PIRActivityReviews we want to count
     *   }
     * })
    **/
    count<T extends PIRActivityReviewCountArgs>(
      args?: Subset<T, PIRActivityReviewCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PIRActivityReviewCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PIRActivityReview.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRActivityReviewAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PIRActivityReviewAggregateArgs>(args: Subset<T, PIRActivityReviewAggregateArgs>): Prisma.PrismaPromise<GetPIRActivityReviewAggregateType<T>>

    /**
     * Group by PIRActivityReview.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRActivityReviewGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PIRActivityReviewGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PIRActivityReviewGroupByArgs['orderBy'] }
        : { orderBy?: PIRActivityReviewGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PIRActivityReviewGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPIRActivityReviewGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PIRActivityReview model
   */
  readonly fields: PIRActivityReviewFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PIRActivityReview.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PIRActivityReviewClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    pir<T extends PIRDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PIRDefaultArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    aip_activity<T extends AIPActivityDefaultArgs<ExtArgs> = {}>(args?: Subset<T, AIPActivityDefaultArgs<ExtArgs>>): Prisma__AIPActivityClient<$Result.GetResult<Prisma.$AIPActivityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PIRActivityReview model
   */
  interface PIRActivityReviewFieldRefs {
    readonly id: FieldRef<"PIRActivityReview", 'Int'>
    readonly pir_id: FieldRef<"PIRActivityReview", 'Int'>
    readonly aip_activity_id: FieldRef<"PIRActivityReview", 'Int'>
    readonly physical_target: FieldRef<"PIRActivityReview", 'Decimal'>
    readonly financial_target: FieldRef<"PIRActivityReview", 'Decimal'>
    readonly physical_accomplished: FieldRef<"PIRActivityReview", 'Decimal'>
    readonly financial_accomplished: FieldRef<"PIRActivityReview", 'Decimal'>
    readonly actions_to_address_gap: FieldRef<"PIRActivityReview", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PIRActivityReview findUnique
   */
  export type PIRActivityReviewFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * Filter, which PIRActivityReview to fetch.
     */
    where: PIRActivityReviewWhereUniqueInput
  }

  /**
   * PIRActivityReview findUniqueOrThrow
   */
  export type PIRActivityReviewFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * Filter, which PIRActivityReview to fetch.
     */
    where: PIRActivityReviewWhereUniqueInput
  }

  /**
   * PIRActivityReview findFirst
   */
  export type PIRActivityReviewFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * Filter, which PIRActivityReview to fetch.
     */
    where?: PIRActivityReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRActivityReviews to fetch.
     */
    orderBy?: PIRActivityReviewOrderByWithRelationInput | PIRActivityReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PIRActivityReviews.
     */
    cursor?: PIRActivityReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRActivityReviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRActivityReviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PIRActivityReviews.
     */
    distinct?: PIRActivityReviewScalarFieldEnum | PIRActivityReviewScalarFieldEnum[]
  }

  /**
   * PIRActivityReview findFirstOrThrow
   */
  export type PIRActivityReviewFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * Filter, which PIRActivityReview to fetch.
     */
    where?: PIRActivityReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRActivityReviews to fetch.
     */
    orderBy?: PIRActivityReviewOrderByWithRelationInput | PIRActivityReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PIRActivityReviews.
     */
    cursor?: PIRActivityReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRActivityReviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRActivityReviews.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PIRActivityReviews.
     */
    distinct?: PIRActivityReviewScalarFieldEnum | PIRActivityReviewScalarFieldEnum[]
  }

  /**
   * PIRActivityReview findMany
   */
  export type PIRActivityReviewFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * Filter, which PIRActivityReviews to fetch.
     */
    where?: PIRActivityReviewWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRActivityReviews to fetch.
     */
    orderBy?: PIRActivityReviewOrderByWithRelationInput | PIRActivityReviewOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PIRActivityReviews.
     */
    cursor?: PIRActivityReviewWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRActivityReviews from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRActivityReviews.
     */
    skip?: number
    distinct?: PIRActivityReviewScalarFieldEnum | PIRActivityReviewScalarFieldEnum[]
  }

  /**
   * PIRActivityReview create
   */
  export type PIRActivityReviewCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * The data needed to create a PIRActivityReview.
     */
    data: XOR<PIRActivityReviewCreateInput, PIRActivityReviewUncheckedCreateInput>
  }

  /**
   * PIRActivityReview createMany
   */
  export type PIRActivityReviewCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PIRActivityReviews.
     */
    data: PIRActivityReviewCreateManyInput | PIRActivityReviewCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PIRActivityReview createManyAndReturn
   */
  export type PIRActivityReviewCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * The data used to create many PIRActivityReviews.
     */
    data: PIRActivityReviewCreateManyInput | PIRActivityReviewCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PIRActivityReview update
   */
  export type PIRActivityReviewUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * The data needed to update a PIRActivityReview.
     */
    data: XOR<PIRActivityReviewUpdateInput, PIRActivityReviewUncheckedUpdateInput>
    /**
     * Choose, which PIRActivityReview to update.
     */
    where: PIRActivityReviewWhereUniqueInput
  }

  /**
   * PIRActivityReview updateMany
   */
  export type PIRActivityReviewUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PIRActivityReviews.
     */
    data: XOR<PIRActivityReviewUpdateManyMutationInput, PIRActivityReviewUncheckedUpdateManyInput>
    /**
     * Filter which PIRActivityReviews to update
     */
    where?: PIRActivityReviewWhereInput
    /**
     * Limit how many PIRActivityReviews to update.
     */
    limit?: number
  }

  /**
   * PIRActivityReview updateManyAndReturn
   */
  export type PIRActivityReviewUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * The data used to update PIRActivityReviews.
     */
    data: XOR<PIRActivityReviewUpdateManyMutationInput, PIRActivityReviewUncheckedUpdateManyInput>
    /**
     * Filter which PIRActivityReviews to update
     */
    where?: PIRActivityReviewWhereInput
    /**
     * Limit how many PIRActivityReviews to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PIRActivityReview upsert
   */
  export type PIRActivityReviewUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * The filter to search for the PIRActivityReview to update in case it exists.
     */
    where: PIRActivityReviewWhereUniqueInput
    /**
     * In case the PIRActivityReview found by the `where` argument doesn't exist, create a new PIRActivityReview with this data.
     */
    create: XOR<PIRActivityReviewCreateInput, PIRActivityReviewUncheckedCreateInput>
    /**
     * In case the PIRActivityReview was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PIRActivityReviewUpdateInput, PIRActivityReviewUncheckedUpdateInput>
  }

  /**
   * PIRActivityReview delete
   */
  export type PIRActivityReviewDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
    /**
     * Filter which PIRActivityReview to delete.
     */
    where: PIRActivityReviewWhereUniqueInput
  }

  /**
   * PIRActivityReview deleteMany
   */
  export type PIRActivityReviewDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PIRActivityReviews to delete
     */
    where?: PIRActivityReviewWhereInput
    /**
     * Limit how many PIRActivityReviews to delete.
     */
    limit?: number
  }

  /**
   * PIRActivityReview without action
   */
  export type PIRActivityReviewDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRActivityReview
     */
    select?: PIRActivityReviewSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRActivityReview
     */
    omit?: PIRActivityReviewOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRActivityReviewInclude<ExtArgs> | null
  }


  /**
   * Model PIRFactor
   */

  export type AggregatePIRFactor = {
    _count: PIRFactorCountAggregateOutputType | null
    _avg: PIRFactorAvgAggregateOutputType | null
    _sum: PIRFactorSumAggregateOutputType | null
    _min: PIRFactorMinAggregateOutputType | null
    _max: PIRFactorMaxAggregateOutputType | null
  }

  export type PIRFactorAvgAggregateOutputType = {
    id: number | null
    pir_id: number | null
  }

  export type PIRFactorSumAggregateOutputType = {
    id: number | null
    pir_id: number | null
  }

  export type PIRFactorMinAggregateOutputType = {
    id: number | null
    pir_id: number | null
    factor_type: string | null
    facilitating_factors: string | null
    hindering_factors: string | null
  }

  export type PIRFactorMaxAggregateOutputType = {
    id: number | null
    pir_id: number | null
    factor_type: string | null
    facilitating_factors: string | null
    hindering_factors: string | null
  }

  export type PIRFactorCountAggregateOutputType = {
    id: number
    pir_id: number
    factor_type: number
    facilitating_factors: number
    hindering_factors: number
    _all: number
  }


  export type PIRFactorAvgAggregateInputType = {
    id?: true
    pir_id?: true
  }

  export type PIRFactorSumAggregateInputType = {
    id?: true
    pir_id?: true
  }

  export type PIRFactorMinAggregateInputType = {
    id?: true
    pir_id?: true
    factor_type?: true
    facilitating_factors?: true
    hindering_factors?: true
  }

  export type PIRFactorMaxAggregateInputType = {
    id?: true
    pir_id?: true
    factor_type?: true
    facilitating_factors?: true
    hindering_factors?: true
  }

  export type PIRFactorCountAggregateInputType = {
    id?: true
    pir_id?: true
    factor_type?: true
    facilitating_factors?: true
    hindering_factors?: true
    _all?: true
  }

  export type PIRFactorAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PIRFactor to aggregate.
     */
    where?: PIRFactorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRFactors to fetch.
     */
    orderBy?: PIRFactorOrderByWithRelationInput | PIRFactorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PIRFactorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRFactors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRFactors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PIRFactors
    **/
    _count?: true | PIRFactorCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PIRFactorAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PIRFactorSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PIRFactorMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PIRFactorMaxAggregateInputType
  }

  export type GetPIRFactorAggregateType<T extends PIRFactorAggregateArgs> = {
        [P in keyof T & keyof AggregatePIRFactor]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePIRFactor[P]>
      : GetScalarType<T[P], AggregatePIRFactor[P]>
  }




  export type PIRFactorGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PIRFactorWhereInput
    orderBy?: PIRFactorOrderByWithAggregationInput | PIRFactorOrderByWithAggregationInput[]
    by: PIRFactorScalarFieldEnum[] | PIRFactorScalarFieldEnum
    having?: PIRFactorScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PIRFactorCountAggregateInputType | true
    _avg?: PIRFactorAvgAggregateInputType
    _sum?: PIRFactorSumAggregateInputType
    _min?: PIRFactorMinAggregateInputType
    _max?: PIRFactorMaxAggregateInputType
  }

  export type PIRFactorGroupByOutputType = {
    id: number
    pir_id: number
    factor_type: string
    facilitating_factors: string
    hindering_factors: string
    _count: PIRFactorCountAggregateOutputType | null
    _avg: PIRFactorAvgAggregateOutputType | null
    _sum: PIRFactorSumAggregateOutputType | null
    _min: PIRFactorMinAggregateOutputType | null
    _max: PIRFactorMaxAggregateOutputType | null
  }

  type GetPIRFactorGroupByPayload<T extends PIRFactorGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PIRFactorGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PIRFactorGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PIRFactorGroupByOutputType[P]>
            : GetScalarType<T[P], PIRFactorGroupByOutputType[P]>
        }
      >
    >


  export type PIRFactorSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pir_id?: boolean
    factor_type?: boolean
    facilitating_factors?: boolean
    hindering_factors?: boolean
    pir?: boolean | PIRDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIRFactor"]>

  export type PIRFactorSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pir_id?: boolean
    factor_type?: boolean
    facilitating_factors?: boolean
    hindering_factors?: boolean
    pir?: boolean | PIRDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIRFactor"]>

  export type PIRFactorSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    pir_id?: boolean
    factor_type?: boolean
    facilitating_factors?: boolean
    hindering_factors?: boolean
    pir?: boolean | PIRDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["pIRFactor"]>

  export type PIRFactorSelectScalar = {
    id?: boolean
    pir_id?: boolean
    factor_type?: boolean
    facilitating_factors?: boolean
    hindering_factors?: boolean
  }

  export type PIRFactorOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "pir_id" | "factor_type" | "facilitating_factors" | "hindering_factors", ExtArgs["result"]["pIRFactor"]>
  export type PIRFactorInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pir?: boolean | PIRDefaultArgs<ExtArgs>
  }
  export type PIRFactorIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pir?: boolean | PIRDefaultArgs<ExtArgs>
  }
  export type PIRFactorIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    pir?: boolean | PIRDefaultArgs<ExtArgs>
  }

  export type $PIRFactorPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PIRFactor"
    objects: {
      pir: Prisma.$PIRPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      pir_id: number
      factor_type: string
      facilitating_factors: string
      hindering_factors: string
    }, ExtArgs["result"]["pIRFactor"]>
    composites: {}
  }

  type PIRFactorGetPayload<S extends boolean | null | undefined | PIRFactorDefaultArgs> = $Result.GetResult<Prisma.$PIRFactorPayload, S>

  type PIRFactorCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PIRFactorFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PIRFactorCountAggregateInputType | true
    }

  export interface PIRFactorDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PIRFactor'], meta: { name: 'PIRFactor' } }
    /**
     * Find zero or one PIRFactor that matches the filter.
     * @param {PIRFactorFindUniqueArgs} args - Arguments to find a PIRFactor
     * @example
     * // Get one PIRFactor
     * const pIRFactor = await prisma.pIRFactor.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PIRFactorFindUniqueArgs>(args: SelectSubset<T, PIRFactorFindUniqueArgs<ExtArgs>>): Prisma__PIRFactorClient<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PIRFactor that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PIRFactorFindUniqueOrThrowArgs} args - Arguments to find a PIRFactor
     * @example
     * // Get one PIRFactor
     * const pIRFactor = await prisma.pIRFactor.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PIRFactorFindUniqueOrThrowArgs>(args: SelectSubset<T, PIRFactorFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PIRFactorClient<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PIRFactor that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFactorFindFirstArgs} args - Arguments to find a PIRFactor
     * @example
     * // Get one PIRFactor
     * const pIRFactor = await prisma.pIRFactor.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PIRFactorFindFirstArgs>(args?: SelectSubset<T, PIRFactorFindFirstArgs<ExtArgs>>): Prisma__PIRFactorClient<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PIRFactor that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFactorFindFirstOrThrowArgs} args - Arguments to find a PIRFactor
     * @example
     * // Get one PIRFactor
     * const pIRFactor = await prisma.pIRFactor.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PIRFactorFindFirstOrThrowArgs>(args?: SelectSubset<T, PIRFactorFindFirstOrThrowArgs<ExtArgs>>): Prisma__PIRFactorClient<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PIRFactors that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFactorFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PIRFactors
     * const pIRFactors = await prisma.pIRFactor.findMany()
     * 
     * // Get first 10 PIRFactors
     * const pIRFactors = await prisma.pIRFactor.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pIRFactorWithIdOnly = await prisma.pIRFactor.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PIRFactorFindManyArgs>(args?: SelectSubset<T, PIRFactorFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PIRFactor.
     * @param {PIRFactorCreateArgs} args - Arguments to create a PIRFactor.
     * @example
     * // Create one PIRFactor
     * const PIRFactor = await prisma.pIRFactor.create({
     *   data: {
     *     // ... data to create a PIRFactor
     *   }
     * })
     * 
     */
    create<T extends PIRFactorCreateArgs>(args: SelectSubset<T, PIRFactorCreateArgs<ExtArgs>>): Prisma__PIRFactorClient<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PIRFactors.
     * @param {PIRFactorCreateManyArgs} args - Arguments to create many PIRFactors.
     * @example
     * // Create many PIRFactors
     * const pIRFactor = await prisma.pIRFactor.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PIRFactorCreateManyArgs>(args?: SelectSubset<T, PIRFactorCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PIRFactors and returns the data saved in the database.
     * @param {PIRFactorCreateManyAndReturnArgs} args - Arguments to create many PIRFactors.
     * @example
     * // Create many PIRFactors
     * const pIRFactor = await prisma.pIRFactor.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PIRFactors and only return the `id`
     * const pIRFactorWithIdOnly = await prisma.pIRFactor.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PIRFactorCreateManyAndReturnArgs>(args?: SelectSubset<T, PIRFactorCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PIRFactor.
     * @param {PIRFactorDeleteArgs} args - Arguments to delete one PIRFactor.
     * @example
     * // Delete one PIRFactor
     * const PIRFactor = await prisma.pIRFactor.delete({
     *   where: {
     *     // ... filter to delete one PIRFactor
     *   }
     * })
     * 
     */
    delete<T extends PIRFactorDeleteArgs>(args: SelectSubset<T, PIRFactorDeleteArgs<ExtArgs>>): Prisma__PIRFactorClient<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PIRFactor.
     * @param {PIRFactorUpdateArgs} args - Arguments to update one PIRFactor.
     * @example
     * // Update one PIRFactor
     * const pIRFactor = await prisma.pIRFactor.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PIRFactorUpdateArgs>(args: SelectSubset<T, PIRFactorUpdateArgs<ExtArgs>>): Prisma__PIRFactorClient<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PIRFactors.
     * @param {PIRFactorDeleteManyArgs} args - Arguments to filter PIRFactors to delete.
     * @example
     * // Delete a few PIRFactors
     * const { count } = await prisma.pIRFactor.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PIRFactorDeleteManyArgs>(args?: SelectSubset<T, PIRFactorDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PIRFactors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFactorUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PIRFactors
     * const pIRFactor = await prisma.pIRFactor.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PIRFactorUpdateManyArgs>(args: SelectSubset<T, PIRFactorUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PIRFactors and returns the data updated in the database.
     * @param {PIRFactorUpdateManyAndReturnArgs} args - Arguments to update many PIRFactors.
     * @example
     * // Update many PIRFactors
     * const pIRFactor = await prisma.pIRFactor.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PIRFactors and only return the `id`
     * const pIRFactorWithIdOnly = await prisma.pIRFactor.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PIRFactorUpdateManyAndReturnArgs>(args: SelectSubset<T, PIRFactorUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PIRFactor.
     * @param {PIRFactorUpsertArgs} args - Arguments to update or create a PIRFactor.
     * @example
     * // Update or create a PIRFactor
     * const pIRFactor = await prisma.pIRFactor.upsert({
     *   create: {
     *     // ... data to create a PIRFactor
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PIRFactor we want to update
     *   }
     * })
     */
    upsert<T extends PIRFactorUpsertArgs>(args: SelectSubset<T, PIRFactorUpsertArgs<ExtArgs>>): Prisma__PIRFactorClient<$Result.GetResult<Prisma.$PIRFactorPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PIRFactors.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFactorCountArgs} args - Arguments to filter PIRFactors to count.
     * @example
     * // Count the number of PIRFactors
     * const count = await prisma.pIRFactor.count({
     *   where: {
     *     // ... the filter for the PIRFactors we want to count
     *   }
     * })
    **/
    count<T extends PIRFactorCountArgs>(
      args?: Subset<T, PIRFactorCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PIRFactorCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PIRFactor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFactorAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PIRFactorAggregateArgs>(args: Subset<T, PIRFactorAggregateArgs>): Prisma.PrismaPromise<GetPIRFactorAggregateType<T>>

    /**
     * Group by PIRFactor.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PIRFactorGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PIRFactorGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PIRFactorGroupByArgs['orderBy'] }
        : { orderBy?: PIRFactorGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PIRFactorGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPIRFactorGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PIRFactor model
   */
  readonly fields: PIRFactorFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PIRFactor.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PIRFactorClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    pir<T extends PIRDefaultArgs<ExtArgs> = {}>(args?: Subset<T, PIRDefaultArgs<ExtArgs>>): Prisma__PIRClient<$Result.GetResult<Prisma.$PIRPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PIRFactor model
   */
  interface PIRFactorFieldRefs {
    readonly id: FieldRef<"PIRFactor", 'Int'>
    readonly pir_id: FieldRef<"PIRFactor", 'Int'>
    readonly factor_type: FieldRef<"PIRFactor", 'String'>
    readonly facilitating_factors: FieldRef<"PIRFactor", 'String'>
    readonly hindering_factors: FieldRef<"PIRFactor", 'String'>
  }
    

  // Custom InputTypes
  /**
   * PIRFactor findUnique
   */
  export type PIRFactorFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * Filter, which PIRFactor to fetch.
     */
    where: PIRFactorWhereUniqueInput
  }

  /**
   * PIRFactor findUniqueOrThrow
   */
  export type PIRFactorFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * Filter, which PIRFactor to fetch.
     */
    where: PIRFactorWhereUniqueInput
  }

  /**
   * PIRFactor findFirst
   */
  export type PIRFactorFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * Filter, which PIRFactor to fetch.
     */
    where?: PIRFactorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRFactors to fetch.
     */
    orderBy?: PIRFactorOrderByWithRelationInput | PIRFactorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PIRFactors.
     */
    cursor?: PIRFactorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRFactors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRFactors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PIRFactors.
     */
    distinct?: PIRFactorScalarFieldEnum | PIRFactorScalarFieldEnum[]
  }

  /**
   * PIRFactor findFirstOrThrow
   */
  export type PIRFactorFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * Filter, which PIRFactor to fetch.
     */
    where?: PIRFactorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRFactors to fetch.
     */
    orderBy?: PIRFactorOrderByWithRelationInput | PIRFactorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PIRFactors.
     */
    cursor?: PIRFactorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRFactors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRFactors.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PIRFactors.
     */
    distinct?: PIRFactorScalarFieldEnum | PIRFactorScalarFieldEnum[]
  }

  /**
   * PIRFactor findMany
   */
  export type PIRFactorFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * Filter, which PIRFactors to fetch.
     */
    where?: PIRFactorWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PIRFactors to fetch.
     */
    orderBy?: PIRFactorOrderByWithRelationInput | PIRFactorOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PIRFactors.
     */
    cursor?: PIRFactorWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PIRFactors from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PIRFactors.
     */
    skip?: number
    distinct?: PIRFactorScalarFieldEnum | PIRFactorScalarFieldEnum[]
  }

  /**
   * PIRFactor create
   */
  export type PIRFactorCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * The data needed to create a PIRFactor.
     */
    data: XOR<PIRFactorCreateInput, PIRFactorUncheckedCreateInput>
  }

  /**
   * PIRFactor createMany
   */
  export type PIRFactorCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PIRFactors.
     */
    data: PIRFactorCreateManyInput | PIRFactorCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PIRFactor createManyAndReturn
   */
  export type PIRFactorCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * The data used to create many PIRFactors.
     */
    data: PIRFactorCreateManyInput | PIRFactorCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * PIRFactor update
   */
  export type PIRFactorUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * The data needed to update a PIRFactor.
     */
    data: XOR<PIRFactorUpdateInput, PIRFactorUncheckedUpdateInput>
    /**
     * Choose, which PIRFactor to update.
     */
    where: PIRFactorWhereUniqueInput
  }

  /**
   * PIRFactor updateMany
   */
  export type PIRFactorUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PIRFactors.
     */
    data: XOR<PIRFactorUpdateManyMutationInput, PIRFactorUncheckedUpdateManyInput>
    /**
     * Filter which PIRFactors to update
     */
    where?: PIRFactorWhereInput
    /**
     * Limit how many PIRFactors to update.
     */
    limit?: number
  }

  /**
   * PIRFactor updateManyAndReturn
   */
  export type PIRFactorUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * The data used to update PIRFactors.
     */
    data: XOR<PIRFactorUpdateManyMutationInput, PIRFactorUncheckedUpdateManyInput>
    /**
     * Filter which PIRFactors to update
     */
    where?: PIRFactorWhereInput
    /**
     * Limit how many PIRFactors to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * PIRFactor upsert
   */
  export type PIRFactorUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * The filter to search for the PIRFactor to update in case it exists.
     */
    where: PIRFactorWhereUniqueInput
    /**
     * In case the PIRFactor found by the `where` argument doesn't exist, create a new PIRFactor with this data.
     */
    create: XOR<PIRFactorCreateInput, PIRFactorUncheckedCreateInput>
    /**
     * In case the PIRFactor was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PIRFactorUpdateInput, PIRFactorUncheckedUpdateInput>
  }

  /**
   * PIRFactor delete
   */
  export type PIRFactorDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
    /**
     * Filter which PIRFactor to delete.
     */
    where: PIRFactorWhereUniqueInput
  }

  /**
   * PIRFactor deleteMany
   */
  export type PIRFactorDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PIRFactors to delete
     */
    where?: PIRFactorWhereInput
    /**
     * Limit how many PIRFactors to delete.
     */
    limit?: number
  }

  /**
   * PIRFactor without action
   */
  export type PIRFactorDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PIRFactor
     */
    select?: PIRFactorSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PIRFactor
     */
    omit?: PIRFactorOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: PIRFactorInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ClusterScalarFieldEnum: {
    id: 'id',
    cluster_number: 'cluster_number',
    name: 'name'
  };

  export type ClusterScalarFieldEnum = (typeof ClusterScalarFieldEnum)[keyof typeof ClusterScalarFieldEnum]


  export const SchoolScalarFieldEnum: {
    id: 'id',
    name: 'name',
    level: 'level',
    cluster_id: 'cluster_id'
  };

  export type SchoolScalarFieldEnum = (typeof SchoolScalarFieldEnum)[keyof typeof SchoolScalarFieldEnum]


  export const ProgramScalarFieldEnum: {
    id: 'id',
    title: 'title',
    school_level_requirement: 'school_level_requirement'
  };

  export type ProgramScalarFieldEnum = (typeof ProgramScalarFieldEnum)[keyof typeof ProgramScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    password: 'password',
    role: 'role',
    name: 'name',
    school_id: 'school_id',
    created_at: 'created_at'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const AIPScalarFieldEnum: {
    id: 'id',
    school_id: 'school_id',
    program_id: 'program_id',
    year: 'year',
    pillar: 'pillar',
    sip_title: 'sip_title',
    project_coordinator: 'project_coordinator',
    objectives: 'objectives',
    indicators: 'indicators',
    annual_target: 'annual_target',
    created_at: 'created_at'
  };

  export type AIPScalarFieldEnum = (typeof AIPScalarFieldEnum)[keyof typeof AIPScalarFieldEnum]


  export const AIPActivityScalarFieldEnum: {
    id: 'id',
    aip_id: 'aip_id',
    phase: 'phase',
    activity_name: 'activity_name',
    implementation_period: 'implementation_period',
    persons_involved: 'persons_involved',
    outputs: 'outputs',
    budget_amount: 'budget_amount',
    budget_source: 'budget_source'
  };

  export type AIPActivityScalarFieldEnum = (typeof AIPActivityScalarFieldEnum)[keyof typeof AIPActivityScalarFieldEnum]


  export const PIRScalarFieldEnum: {
    id: 'id',
    aip_id: 'aip_id',
    quarter: 'quarter',
    program_owner: 'program_owner',
    total_budget: 'total_budget',
    fund_source: 'fund_source',
    created_at: 'created_at'
  };

  export type PIRScalarFieldEnum = (typeof PIRScalarFieldEnum)[keyof typeof PIRScalarFieldEnum]


  export const PIRActivityReviewScalarFieldEnum: {
    id: 'id',
    pir_id: 'pir_id',
    aip_activity_id: 'aip_activity_id',
    physical_target: 'physical_target',
    financial_target: 'financial_target',
    physical_accomplished: 'physical_accomplished',
    financial_accomplished: 'financial_accomplished',
    actions_to_address_gap: 'actions_to_address_gap'
  };

  export type PIRActivityReviewScalarFieldEnum = (typeof PIRActivityReviewScalarFieldEnum)[keyof typeof PIRActivityReviewScalarFieldEnum]


  export const PIRFactorScalarFieldEnum: {
    id: 'id',
    pir_id: 'pir_id',
    factor_type: 'factor_type',
    facilitating_factors: 'facilitating_factors',
    hindering_factors: 'hindering_factors'
  };

  export type PIRFactorScalarFieldEnum = (typeof PIRFactorScalarFieldEnum)[keyof typeof PIRFactorScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ClusterWhereInput = {
    AND?: ClusterWhereInput | ClusterWhereInput[]
    OR?: ClusterWhereInput[]
    NOT?: ClusterWhereInput | ClusterWhereInput[]
    id?: IntFilter<"Cluster"> | number
    cluster_number?: IntFilter<"Cluster"> | number
    name?: StringFilter<"Cluster"> | string
    schools?: SchoolListRelationFilter
  }

  export type ClusterOrderByWithRelationInput = {
    id?: SortOrder
    cluster_number?: SortOrder
    name?: SortOrder
    schools?: SchoolOrderByRelationAggregateInput
  }

  export type ClusterWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    cluster_number?: number
    AND?: ClusterWhereInput | ClusterWhereInput[]
    OR?: ClusterWhereInput[]
    NOT?: ClusterWhereInput | ClusterWhereInput[]
    name?: StringFilter<"Cluster"> | string
    schools?: SchoolListRelationFilter
  }, "id" | "cluster_number">

  export type ClusterOrderByWithAggregationInput = {
    id?: SortOrder
    cluster_number?: SortOrder
    name?: SortOrder
    _count?: ClusterCountOrderByAggregateInput
    _avg?: ClusterAvgOrderByAggregateInput
    _max?: ClusterMaxOrderByAggregateInput
    _min?: ClusterMinOrderByAggregateInput
    _sum?: ClusterSumOrderByAggregateInput
  }

  export type ClusterScalarWhereWithAggregatesInput = {
    AND?: ClusterScalarWhereWithAggregatesInput | ClusterScalarWhereWithAggregatesInput[]
    OR?: ClusterScalarWhereWithAggregatesInput[]
    NOT?: ClusterScalarWhereWithAggregatesInput | ClusterScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Cluster"> | number
    cluster_number?: IntWithAggregatesFilter<"Cluster"> | number
    name?: StringWithAggregatesFilter<"Cluster"> | string
  }

  export type SchoolWhereInput = {
    AND?: SchoolWhereInput | SchoolWhereInput[]
    OR?: SchoolWhereInput[]
    NOT?: SchoolWhereInput | SchoolWhereInput[]
    id?: IntFilter<"School"> | number
    name?: StringFilter<"School"> | string
    level?: StringFilter<"School"> | string
    cluster_id?: IntFilter<"School"> | number
    cluster?: XOR<ClusterScalarRelationFilter, ClusterWhereInput>
    aips?: AIPListRelationFilter
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    restricted_programs?: ProgramListRelationFilter
  }

  export type SchoolOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    level?: SortOrder
    cluster_id?: SortOrder
    cluster?: ClusterOrderByWithRelationInput
    aips?: AIPOrderByRelationAggregateInput
    user?: UserOrderByWithRelationInput
    restricted_programs?: ProgramOrderByRelationAggregateInput
  }

  export type SchoolWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: SchoolWhereInput | SchoolWhereInput[]
    OR?: SchoolWhereInput[]
    NOT?: SchoolWhereInput | SchoolWhereInput[]
    name?: StringFilter<"School"> | string
    level?: StringFilter<"School"> | string
    cluster_id?: IntFilter<"School"> | number
    cluster?: XOR<ClusterScalarRelationFilter, ClusterWhereInput>
    aips?: AIPListRelationFilter
    user?: XOR<UserNullableScalarRelationFilter, UserWhereInput> | null
    restricted_programs?: ProgramListRelationFilter
  }, "id">

  export type SchoolOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    level?: SortOrder
    cluster_id?: SortOrder
    _count?: SchoolCountOrderByAggregateInput
    _avg?: SchoolAvgOrderByAggregateInput
    _max?: SchoolMaxOrderByAggregateInput
    _min?: SchoolMinOrderByAggregateInput
    _sum?: SchoolSumOrderByAggregateInput
  }

  export type SchoolScalarWhereWithAggregatesInput = {
    AND?: SchoolScalarWhereWithAggregatesInput | SchoolScalarWhereWithAggregatesInput[]
    OR?: SchoolScalarWhereWithAggregatesInput[]
    NOT?: SchoolScalarWhereWithAggregatesInput | SchoolScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"School"> | number
    name?: StringWithAggregatesFilter<"School"> | string
    level?: StringWithAggregatesFilter<"School"> | string
    cluster_id?: IntWithAggregatesFilter<"School"> | number
  }

  export type ProgramWhereInput = {
    AND?: ProgramWhereInput | ProgramWhereInput[]
    OR?: ProgramWhereInput[]
    NOT?: ProgramWhereInput | ProgramWhereInput[]
    id?: IntFilter<"Program"> | number
    title?: StringFilter<"Program"> | string
    school_level_requirement?: StringFilter<"Program"> | string
    aips?: AIPListRelationFilter
    personnel?: UserListRelationFilter
    restricted_schools?: SchoolListRelationFilter
  }

  export type ProgramOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    school_level_requirement?: SortOrder
    aips?: AIPOrderByRelationAggregateInput
    personnel?: UserOrderByRelationAggregateInput
    restricted_schools?: SchoolOrderByRelationAggregateInput
  }

  export type ProgramWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    title?: string
    AND?: ProgramWhereInput | ProgramWhereInput[]
    OR?: ProgramWhereInput[]
    NOT?: ProgramWhereInput | ProgramWhereInput[]
    school_level_requirement?: StringFilter<"Program"> | string
    aips?: AIPListRelationFilter
    personnel?: UserListRelationFilter
    restricted_schools?: SchoolListRelationFilter
  }, "id" | "title">

  export type ProgramOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    school_level_requirement?: SortOrder
    _count?: ProgramCountOrderByAggregateInput
    _avg?: ProgramAvgOrderByAggregateInput
    _max?: ProgramMaxOrderByAggregateInput
    _min?: ProgramMinOrderByAggregateInput
    _sum?: ProgramSumOrderByAggregateInput
  }

  export type ProgramScalarWhereWithAggregatesInput = {
    AND?: ProgramScalarWhereWithAggregatesInput | ProgramScalarWhereWithAggregatesInput[]
    OR?: ProgramScalarWhereWithAggregatesInput[]
    NOT?: ProgramScalarWhereWithAggregatesInput | ProgramScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Program"> | number
    title?: StringWithAggregatesFilter<"Program"> | string
    school_level_requirement?: StringWithAggregatesFilter<"Program"> | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    school_id?: IntNullableFilter<"User"> | number | null
    created_at?: DateTimeFilter<"User"> | Date | string
    school?: XOR<SchoolNullableScalarRelationFilter, SchoolWhereInput> | null
    programs?: ProgramListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrderInput | SortOrder
    school_id?: SortOrderInput | SortOrder
    created_at?: SortOrder
    school?: SchoolOrderByWithRelationInput
    programs?: ProgramOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    email?: string
    school_id?: number
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    created_at?: DateTimeFilter<"User"> | Date | string
    school?: XOR<SchoolNullableScalarRelationFilter, SchoolWhereInput> | null
    programs?: ProgramListRelationFilter
  }, "id" | "email" | "school_id">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrderInput | SortOrder
    school_id?: SortOrderInput | SortOrder
    created_at?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringWithAggregatesFilter<"User"> | string
    role?: StringWithAggregatesFilter<"User"> | string
    name?: StringNullableWithAggregatesFilter<"User"> | string | null
    school_id?: IntNullableWithAggregatesFilter<"User"> | number | null
    created_at?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type AIPWhereInput = {
    AND?: AIPWhereInput | AIPWhereInput[]
    OR?: AIPWhereInput[]
    NOT?: AIPWhereInput | AIPWhereInput[]
    id?: IntFilter<"AIP"> | number
    school_id?: IntFilter<"AIP"> | number
    program_id?: IntFilter<"AIP"> | number
    year?: IntFilter<"AIP"> | number
    pillar?: StringFilter<"AIP"> | string
    sip_title?: StringFilter<"AIP"> | string
    project_coordinator?: StringFilter<"AIP"> | string
    objectives?: StringFilter<"AIP"> | string
    indicators?: StringFilter<"AIP"> | string
    annual_target?: StringFilter<"AIP"> | string
    created_at?: DateTimeFilter<"AIP"> | Date | string
    school?: XOR<SchoolScalarRelationFilter, SchoolWhereInput>
    program?: XOR<ProgramScalarRelationFilter, ProgramWhereInput>
    activities?: AIPActivityListRelationFilter
    pirs?: PIRListRelationFilter
  }

  export type AIPOrderByWithRelationInput = {
    id?: SortOrder
    school_id?: SortOrder
    program_id?: SortOrder
    year?: SortOrder
    pillar?: SortOrder
    sip_title?: SortOrder
    project_coordinator?: SortOrder
    objectives?: SortOrder
    indicators?: SortOrder
    annual_target?: SortOrder
    created_at?: SortOrder
    school?: SchoolOrderByWithRelationInput
    program?: ProgramOrderByWithRelationInput
    activities?: AIPActivityOrderByRelationAggregateInput
    pirs?: PIROrderByRelationAggregateInput
  }

  export type AIPWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    school_id_program_id_year?: AIPSchool_idProgram_idYearCompoundUniqueInput
    AND?: AIPWhereInput | AIPWhereInput[]
    OR?: AIPWhereInput[]
    NOT?: AIPWhereInput | AIPWhereInput[]
    school_id?: IntFilter<"AIP"> | number
    program_id?: IntFilter<"AIP"> | number
    year?: IntFilter<"AIP"> | number
    pillar?: StringFilter<"AIP"> | string
    sip_title?: StringFilter<"AIP"> | string
    project_coordinator?: StringFilter<"AIP"> | string
    objectives?: StringFilter<"AIP"> | string
    indicators?: StringFilter<"AIP"> | string
    annual_target?: StringFilter<"AIP"> | string
    created_at?: DateTimeFilter<"AIP"> | Date | string
    school?: XOR<SchoolScalarRelationFilter, SchoolWhereInput>
    program?: XOR<ProgramScalarRelationFilter, ProgramWhereInput>
    activities?: AIPActivityListRelationFilter
    pirs?: PIRListRelationFilter
  }, "id" | "school_id_program_id_year">

  export type AIPOrderByWithAggregationInput = {
    id?: SortOrder
    school_id?: SortOrder
    program_id?: SortOrder
    year?: SortOrder
    pillar?: SortOrder
    sip_title?: SortOrder
    project_coordinator?: SortOrder
    objectives?: SortOrder
    indicators?: SortOrder
    annual_target?: SortOrder
    created_at?: SortOrder
    _count?: AIPCountOrderByAggregateInput
    _avg?: AIPAvgOrderByAggregateInput
    _max?: AIPMaxOrderByAggregateInput
    _min?: AIPMinOrderByAggregateInput
    _sum?: AIPSumOrderByAggregateInput
  }

  export type AIPScalarWhereWithAggregatesInput = {
    AND?: AIPScalarWhereWithAggregatesInput | AIPScalarWhereWithAggregatesInput[]
    OR?: AIPScalarWhereWithAggregatesInput[]
    NOT?: AIPScalarWhereWithAggregatesInput | AIPScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"AIP"> | number
    school_id?: IntWithAggregatesFilter<"AIP"> | number
    program_id?: IntWithAggregatesFilter<"AIP"> | number
    year?: IntWithAggregatesFilter<"AIP"> | number
    pillar?: StringWithAggregatesFilter<"AIP"> | string
    sip_title?: StringWithAggregatesFilter<"AIP"> | string
    project_coordinator?: StringWithAggregatesFilter<"AIP"> | string
    objectives?: StringWithAggregatesFilter<"AIP"> | string
    indicators?: StringWithAggregatesFilter<"AIP"> | string
    annual_target?: StringWithAggregatesFilter<"AIP"> | string
    created_at?: DateTimeWithAggregatesFilter<"AIP"> | Date | string
  }

  export type AIPActivityWhereInput = {
    AND?: AIPActivityWhereInput | AIPActivityWhereInput[]
    OR?: AIPActivityWhereInput[]
    NOT?: AIPActivityWhereInput | AIPActivityWhereInput[]
    id?: IntFilter<"AIPActivity"> | number
    aip_id?: IntFilter<"AIPActivity"> | number
    phase?: StringFilter<"AIPActivity"> | string
    activity_name?: StringFilter<"AIPActivity"> | string
    implementation_period?: StringFilter<"AIPActivity"> | string
    persons_involved?: StringFilter<"AIPActivity"> | string
    outputs?: StringFilter<"AIPActivity"> | string
    budget_amount?: DecimalFilter<"AIPActivity"> | Decimal | DecimalJsLike | number | string
    budget_source?: StringFilter<"AIPActivity"> | string
    aip?: XOR<AIPScalarRelationFilter, AIPWhereInput>
    pir_reviews?: PIRActivityReviewListRelationFilter
  }

  export type AIPActivityOrderByWithRelationInput = {
    id?: SortOrder
    aip_id?: SortOrder
    phase?: SortOrder
    activity_name?: SortOrder
    implementation_period?: SortOrder
    persons_involved?: SortOrder
    outputs?: SortOrder
    budget_amount?: SortOrder
    budget_source?: SortOrder
    aip?: AIPOrderByWithRelationInput
    pir_reviews?: PIRActivityReviewOrderByRelationAggregateInput
  }

  export type AIPActivityWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: AIPActivityWhereInput | AIPActivityWhereInput[]
    OR?: AIPActivityWhereInput[]
    NOT?: AIPActivityWhereInput | AIPActivityWhereInput[]
    aip_id?: IntFilter<"AIPActivity"> | number
    phase?: StringFilter<"AIPActivity"> | string
    activity_name?: StringFilter<"AIPActivity"> | string
    implementation_period?: StringFilter<"AIPActivity"> | string
    persons_involved?: StringFilter<"AIPActivity"> | string
    outputs?: StringFilter<"AIPActivity"> | string
    budget_amount?: DecimalFilter<"AIPActivity"> | Decimal | DecimalJsLike | number | string
    budget_source?: StringFilter<"AIPActivity"> | string
    aip?: XOR<AIPScalarRelationFilter, AIPWhereInput>
    pir_reviews?: PIRActivityReviewListRelationFilter
  }, "id">

  export type AIPActivityOrderByWithAggregationInput = {
    id?: SortOrder
    aip_id?: SortOrder
    phase?: SortOrder
    activity_name?: SortOrder
    implementation_period?: SortOrder
    persons_involved?: SortOrder
    outputs?: SortOrder
    budget_amount?: SortOrder
    budget_source?: SortOrder
    _count?: AIPActivityCountOrderByAggregateInput
    _avg?: AIPActivityAvgOrderByAggregateInput
    _max?: AIPActivityMaxOrderByAggregateInput
    _min?: AIPActivityMinOrderByAggregateInput
    _sum?: AIPActivitySumOrderByAggregateInput
  }

  export type AIPActivityScalarWhereWithAggregatesInput = {
    AND?: AIPActivityScalarWhereWithAggregatesInput | AIPActivityScalarWhereWithAggregatesInput[]
    OR?: AIPActivityScalarWhereWithAggregatesInput[]
    NOT?: AIPActivityScalarWhereWithAggregatesInput | AIPActivityScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"AIPActivity"> | number
    aip_id?: IntWithAggregatesFilter<"AIPActivity"> | number
    phase?: StringWithAggregatesFilter<"AIPActivity"> | string
    activity_name?: StringWithAggregatesFilter<"AIPActivity"> | string
    implementation_period?: StringWithAggregatesFilter<"AIPActivity"> | string
    persons_involved?: StringWithAggregatesFilter<"AIPActivity"> | string
    outputs?: StringWithAggregatesFilter<"AIPActivity"> | string
    budget_amount?: DecimalWithAggregatesFilter<"AIPActivity"> | Decimal | DecimalJsLike | number | string
    budget_source?: StringWithAggregatesFilter<"AIPActivity"> | string
  }

  export type PIRWhereInput = {
    AND?: PIRWhereInput | PIRWhereInput[]
    OR?: PIRWhereInput[]
    NOT?: PIRWhereInput | PIRWhereInput[]
    id?: IntFilter<"PIR"> | number
    aip_id?: IntFilter<"PIR"> | number
    quarter?: StringFilter<"PIR"> | string
    program_owner?: StringFilter<"PIR"> | string
    total_budget?: DecimalFilter<"PIR"> | Decimal | DecimalJsLike | number | string
    fund_source?: StringFilter<"PIR"> | string
    created_at?: DateTimeFilter<"PIR"> | Date | string
    aip?: XOR<AIPScalarRelationFilter, AIPWhereInput>
    activity_reviews?: PIRActivityReviewListRelationFilter
    factors?: PIRFactorListRelationFilter
  }

  export type PIROrderByWithRelationInput = {
    id?: SortOrder
    aip_id?: SortOrder
    quarter?: SortOrder
    program_owner?: SortOrder
    total_budget?: SortOrder
    fund_source?: SortOrder
    created_at?: SortOrder
    aip?: AIPOrderByWithRelationInput
    activity_reviews?: PIRActivityReviewOrderByRelationAggregateInput
    factors?: PIRFactorOrderByRelationAggregateInput
  }

  export type PIRWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    aip_id_quarter?: PIRAip_idQuarterCompoundUniqueInput
    AND?: PIRWhereInput | PIRWhereInput[]
    OR?: PIRWhereInput[]
    NOT?: PIRWhereInput | PIRWhereInput[]
    aip_id?: IntFilter<"PIR"> | number
    quarter?: StringFilter<"PIR"> | string
    program_owner?: StringFilter<"PIR"> | string
    total_budget?: DecimalFilter<"PIR"> | Decimal | DecimalJsLike | number | string
    fund_source?: StringFilter<"PIR"> | string
    created_at?: DateTimeFilter<"PIR"> | Date | string
    aip?: XOR<AIPScalarRelationFilter, AIPWhereInput>
    activity_reviews?: PIRActivityReviewListRelationFilter
    factors?: PIRFactorListRelationFilter
  }, "id" | "aip_id_quarter">

  export type PIROrderByWithAggregationInput = {
    id?: SortOrder
    aip_id?: SortOrder
    quarter?: SortOrder
    program_owner?: SortOrder
    total_budget?: SortOrder
    fund_source?: SortOrder
    created_at?: SortOrder
    _count?: PIRCountOrderByAggregateInput
    _avg?: PIRAvgOrderByAggregateInput
    _max?: PIRMaxOrderByAggregateInput
    _min?: PIRMinOrderByAggregateInput
    _sum?: PIRSumOrderByAggregateInput
  }

  export type PIRScalarWhereWithAggregatesInput = {
    AND?: PIRScalarWhereWithAggregatesInput | PIRScalarWhereWithAggregatesInput[]
    OR?: PIRScalarWhereWithAggregatesInput[]
    NOT?: PIRScalarWhereWithAggregatesInput | PIRScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"PIR"> | number
    aip_id?: IntWithAggregatesFilter<"PIR"> | number
    quarter?: StringWithAggregatesFilter<"PIR"> | string
    program_owner?: StringWithAggregatesFilter<"PIR"> | string
    total_budget?: DecimalWithAggregatesFilter<"PIR"> | Decimal | DecimalJsLike | number | string
    fund_source?: StringWithAggregatesFilter<"PIR"> | string
    created_at?: DateTimeWithAggregatesFilter<"PIR"> | Date | string
  }

  export type PIRActivityReviewWhereInput = {
    AND?: PIRActivityReviewWhereInput | PIRActivityReviewWhereInput[]
    OR?: PIRActivityReviewWhereInput[]
    NOT?: PIRActivityReviewWhereInput | PIRActivityReviewWhereInput[]
    id?: IntFilter<"PIRActivityReview"> | number
    pir_id?: IntFilter<"PIRActivityReview"> | number
    aip_activity_id?: IntFilter<"PIRActivityReview"> | number
    physical_target?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: StringNullableFilter<"PIRActivityReview"> | string | null
    pir?: XOR<PIRScalarRelationFilter, PIRWhereInput>
    aip_activity?: XOR<AIPActivityScalarRelationFilter, AIPActivityWhereInput>
  }

  export type PIRActivityReviewOrderByWithRelationInput = {
    id?: SortOrder
    pir_id?: SortOrder
    aip_activity_id?: SortOrder
    physical_target?: SortOrder
    financial_target?: SortOrder
    physical_accomplished?: SortOrder
    financial_accomplished?: SortOrder
    actions_to_address_gap?: SortOrderInput | SortOrder
    pir?: PIROrderByWithRelationInput
    aip_activity?: AIPActivityOrderByWithRelationInput
  }

  export type PIRActivityReviewWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    pir_id_aip_activity_id?: PIRActivityReviewPir_idAip_activity_idCompoundUniqueInput
    AND?: PIRActivityReviewWhereInput | PIRActivityReviewWhereInput[]
    OR?: PIRActivityReviewWhereInput[]
    NOT?: PIRActivityReviewWhereInput | PIRActivityReviewWhereInput[]
    pir_id?: IntFilter<"PIRActivityReview"> | number
    aip_activity_id?: IntFilter<"PIRActivityReview"> | number
    physical_target?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: StringNullableFilter<"PIRActivityReview"> | string | null
    pir?: XOR<PIRScalarRelationFilter, PIRWhereInput>
    aip_activity?: XOR<AIPActivityScalarRelationFilter, AIPActivityWhereInput>
  }, "id" | "pir_id_aip_activity_id">

  export type PIRActivityReviewOrderByWithAggregationInput = {
    id?: SortOrder
    pir_id?: SortOrder
    aip_activity_id?: SortOrder
    physical_target?: SortOrder
    financial_target?: SortOrder
    physical_accomplished?: SortOrder
    financial_accomplished?: SortOrder
    actions_to_address_gap?: SortOrderInput | SortOrder
    _count?: PIRActivityReviewCountOrderByAggregateInput
    _avg?: PIRActivityReviewAvgOrderByAggregateInput
    _max?: PIRActivityReviewMaxOrderByAggregateInput
    _min?: PIRActivityReviewMinOrderByAggregateInput
    _sum?: PIRActivityReviewSumOrderByAggregateInput
  }

  export type PIRActivityReviewScalarWhereWithAggregatesInput = {
    AND?: PIRActivityReviewScalarWhereWithAggregatesInput | PIRActivityReviewScalarWhereWithAggregatesInput[]
    OR?: PIRActivityReviewScalarWhereWithAggregatesInput[]
    NOT?: PIRActivityReviewScalarWhereWithAggregatesInput | PIRActivityReviewScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"PIRActivityReview"> | number
    pir_id?: IntWithAggregatesFilter<"PIRActivityReview"> | number
    aip_activity_id?: IntWithAggregatesFilter<"PIRActivityReview"> | number
    physical_target?: DecimalWithAggregatesFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalWithAggregatesFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalWithAggregatesFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalWithAggregatesFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: StringNullableWithAggregatesFilter<"PIRActivityReview"> | string | null
  }

  export type PIRFactorWhereInput = {
    AND?: PIRFactorWhereInput | PIRFactorWhereInput[]
    OR?: PIRFactorWhereInput[]
    NOT?: PIRFactorWhereInput | PIRFactorWhereInput[]
    id?: IntFilter<"PIRFactor"> | number
    pir_id?: IntFilter<"PIRFactor"> | number
    factor_type?: StringFilter<"PIRFactor"> | string
    facilitating_factors?: StringFilter<"PIRFactor"> | string
    hindering_factors?: StringFilter<"PIRFactor"> | string
    pir?: XOR<PIRScalarRelationFilter, PIRWhereInput>
  }

  export type PIRFactorOrderByWithRelationInput = {
    id?: SortOrder
    pir_id?: SortOrder
    factor_type?: SortOrder
    facilitating_factors?: SortOrder
    hindering_factors?: SortOrder
    pir?: PIROrderByWithRelationInput
  }

  export type PIRFactorWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    pir_id_factor_type?: PIRFactorPir_idFactor_typeCompoundUniqueInput
    AND?: PIRFactorWhereInput | PIRFactorWhereInput[]
    OR?: PIRFactorWhereInput[]
    NOT?: PIRFactorWhereInput | PIRFactorWhereInput[]
    pir_id?: IntFilter<"PIRFactor"> | number
    factor_type?: StringFilter<"PIRFactor"> | string
    facilitating_factors?: StringFilter<"PIRFactor"> | string
    hindering_factors?: StringFilter<"PIRFactor"> | string
    pir?: XOR<PIRScalarRelationFilter, PIRWhereInput>
  }, "id" | "pir_id_factor_type">

  export type PIRFactorOrderByWithAggregationInput = {
    id?: SortOrder
    pir_id?: SortOrder
    factor_type?: SortOrder
    facilitating_factors?: SortOrder
    hindering_factors?: SortOrder
    _count?: PIRFactorCountOrderByAggregateInput
    _avg?: PIRFactorAvgOrderByAggregateInput
    _max?: PIRFactorMaxOrderByAggregateInput
    _min?: PIRFactorMinOrderByAggregateInput
    _sum?: PIRFactorSumOrderByAggregateInput
  }

  export type PIRFactorScalarWhereWithAggregatesInput = {
    AND?: PIRFactorScalarWhereWithAggregatesInput | PIRFactorScalarWhereWithAggregatesInput[]
    OR?: PIRFactorScalarWhereWithAggregatesInput[]
    NOT?: PIRFactorScalarWhereWithAggregatesInput | PIRFactorScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"PIRFactor"> | number
    pir_id?: IntWithAggregatesFilter<"PIRFactor"> | number
    factor_type?: StringWithAggregatesFilter<"PIRFactor"> | string
    facilitating_factors?: StringWithAggregatesFilter<"PIRFactor"> | string
    hindering_factors?: StringWithAggregatesFilter<"PIRFactor"> | string
  }

  export type ClusterCreateInput = {
    cluster_number: number
    name: string
    schools?: SchoolCreateNestedManyWithoutClusterInput
  }

  export type ClusterUncheckedCreateInput = {
    id?: number
    cluster_number: number
    name: string
    schools?: SchoolUncheckedCreateNestedManyWithoutClusterInput
  }

  export type ClusterUpdateInput = {
    cluster_number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    schools?: SchoolUpdateManyWithoutClusterNestedInput
  }

  export type ClusterUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    cluster_number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    schools?: SchoolUncheckedUpdateManyWithoutClusterNestedInput
  }

  export type ClusterCreateManyInput = {
    id?: number
    cluster_number: number
    name: string
  }

  export type ClusterUpdateManyMutationInput = {
    cluster_number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
  }

  export type ClusterUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    cluster_number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
  }

  export type SchoolCreateInput = {
    name: string
    level: string
    cluster: ClusterCreateNestedOneWithoutSchoolsInput
    aips?: AIPCreateNestedManyWithoutSchoolInput
    user?: UserCreateNestedOneWithoutSchoolInput
    restricted_programs?: ProgramCreateNestedManyWithoutRestricted_schoolsInput
  }

  export type SchoolUncheckedCreateInput = {
    id?: number
    name: string
    level: string
    cluster_id: number
    aips?: AIPUncheckedCreateNestedManyWithoutSchoolInput
    user?: UserUncheckedCreateNestedOneWithoutSchoolInput
    restricted_programs?: ProgramUncheckedCreateNestedManyWithoutRestricted_schoolsInput
  }

  export type SchoolUpdateInput = {
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster?: ClusterUpdateOneRequiredWithoutSchoolsNestedInput
    aips?: AIPUpdateManyWithoutSchoolNestedInput
    user?: UserUpdateOneWithoutSchoolNestedInput
    restricted_programs?: ProgramUpdateManyWithoutRestricted_schoolsNestedInput
  }

  export type SchoolUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster_id?: IntFieldUpdateOperationsInput | number
    aips?: AIPUncheckedUpdateManyWithoutSchoolNestedInput
    user?: UserUncheckedUpdateOneWithoutSchoolNestedInput
    restricted_programs?: ProgramUncheckedUpdateManyWithoutRestricted_schoolsNestedInput
  }

  export type SchoolCreateManyInput = {
    id?: number
    name: string
    level: string
    cluster_id: number
  }

  export type SchoolUpdateManyMutationInput = {
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
  }

  export type SchoolUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster_id?: IntFieldUpdateOperationsInput | number
  }

  export type ProgramCreateInput = {
    title: string
    school_level_requirement: string
    aips?: AIPCreateNestedManyWithoutProgramInput
    personnel?: UserCreateNestedManyWithoutProgramsInput
    restricted_schools?: SchoolCreateNestedManyWithoutRestricted_programsInput
  }

  export type ProgramUncheckedCreateInput = {
    id?: number
    title: string
    school_level_requirement: string
    aips?: AIPUncheckedCreateNestedManyWithoutProgramInput
    personnel?: UserUncheckedCreateNestedManyWithoutProgramsInput
    restricted_schools?: SchoolUncheckedCreateNestedManyWithoutRestricted_programsInput
  }

  export type ProgramUpdateInput = {
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
    aips?: AIPUpdateManyWithoutProgramNestedInput
    personnel?: UserUpdateManyWithoutProgramsNestedInput
    restricted_schools?: SchoolUpdateManyWithoutRestricted_programsNestedInput
  }

  export type ProgramUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
    aips?: AIPUncheckedUpdateManyWithoutProgramNestedInput
    personnel?: UserUncheckedUpdateManyWithoutProgramsNestedInput
    restricted_schools?: SchoolUncheckedUpdateManyWithoutRestricted_programsNestedInput
  }

  export type ProgramCreateManyInput = {
    id?: number
    title: string
    school_level_requirement: string
  }

  export type ProgramUpdateManyMutationInput = {
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
  }

  export type ProgramUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
  }

  export type UserCreateInput = {
    email: string
    password: string
    role: string
    name?: string | null
    created_at?: Date | string
    school?: SchoolCreateNestedOneWithoutUserInput
    programs?: ProgramCreateNestedManyWithoutPersonnelInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    email: string
    password: string
    role: string
    name?: string | null
    school_id?: number | null
    created_at?: Date | string
    programs?: ProgramUncheckedCreateNestedManyWithoutPersonnelInput
  }

  export type UserUpdateInput = {
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    school?: SchoolUpdateOneWithoutUserNestedInput
    programs?: ProgramUpdateManyWithoutPersonnelNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    school_id?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    programs?: ProgramUncheckedUpdateManyWithoutPersonnelNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    email: string
    password: string
    role: string
    name?: string | null
    school_id?: number | null
    created_at?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    school_id?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AIPCreateInput = {
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    school: SchoolCreateNestedOneWithoutAipsInput
    program: ProgramCreateNestedOneWithoutAipsInput
    activities?: AIPActivityCreateNestedManyWithoutAipInput
    pirs?: PIRCreateNestedManyWithoutAipInput
  }

  export type AIPUncheckedCreateInput = {
    id?: number
    school_id: number
    program_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    activities?: AIPActivityUncheckedCreateNestedManyWithoutAipInput
    pirs?: PIRUncheckedCreateNestedManyWithoutAipInput
  }

  export type AIPUpdateInput = {
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    school?: SchoolUpdateOneRequiredWithoutAipsNestedInput
    program?: ProgramUpdateOneRequiredWithoutAipsNestedInput
    activities?: AIPActivityUpdateManyWithoutAipNestedInput
    pirs?: PIRUpdateManyWithoutAipNestedInput
  }

  export type AIPUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    school_id?: IntFieldUpdateOperationsInput | number
    program_id?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    activities?: AIPActivityUncheckedUpdateManyWithoutAipNestedInput
    pirs?: PIRUncheckedUpdateManyWithoutAipNestedInput
  }

  export type AIPCreateManyInput = {
    id?: number
    school_id: number
    program_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
  }

  export type AIPUpdateManyMutationInput = {
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AIPUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    school_id?: IntFieldUpdateOperationsInput | number
    program_id?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AIPActivityCreateInput = {
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount?: Decimal | DecimalJsLike | number | string
    budget_source: string
    aip: AIPCreateNestedOneWithoutActivitiesInput
    pir_reviews?: PIRActivityReviewCreateNestedManyWithoutAip_activityInput
  }

  export type AIPActivityUncheckedCreateInput = {
    id?: number
    aip_id: number
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount?: Decimal | DecimalJsLike | number | string
    budget_source: string
    pir_reviews?: PIRActivityReviewUncheckedCreateNestedManyWithoutAip_activityInput
  }

  export type AIPActivityUpdateInput = {
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
    aip?: AIPUpdateOneRequiredWithoutActivitiesNestedInput
    pir_reviews?: PIRActivityReviewUpdateManyWithoutAip_activityNestedInput
  }

  export type AIPActivityUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_id?: IntFieldUpdateOperationsInput | number
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
    pir_reviews?: PIRActivityReviewUncheckedUpdateManyWithoutAip_activityNestedInput
  }

  export type AIPActivityCreateManyInput = {
    id?: number
    aip_id: number
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount?: Decimal | DecimalJsLike | number | string
    budget_source: string
  }

  export type AIPActivityUpdateManyMutationInput = {
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
  }

  export type AIPActivityUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_id?: IntFieldUpdateOperationsInput | number
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
  }

  export type PIRCreateInput = {
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
    aip: AIPCreateNestedOneWithoutPirsInput
    activity_reviews?: PIRActivityReviewCreateNestedManyWithoutPirInput
    factors?: PIRFactorCreateNestedManyWithoutPirInput
  }

  export type PIRUncheckedCreateInput = {
    id?: number
    aip_id: number
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
    activity_reviews?: PIRActivityReviewUncheckedCreateNestedManyWithoutPirInput
    factors?: PIRFactorUncheckedCreateNestedManyWithoutPirInput
  }

  export type PIRUpdateInput = {
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    aip?: AIPUpdateOneRequiredWithoutPirsNestedInput
    activity_reviews?: PIRActivityReviewUpdateManyWithoutPirNestedInput
    factors?: PIRFactorUpdateManyWithoutPirNestedInput
  }

  export type PIRUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_id?: IntFieldUpdateOperationsInput | number
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    activity_reviews?: PIRActivityReviewUncheckedUpdateManyWithoutPirNestedInput
    factors?: PIRFactorUncheckedUpdateManyWithoutPirNestedInput
  }

  export type PIRCreateManyInput = {
    id?: number
    aip_id: number
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
  }

  export type PIRUpdateManyMutationInput = {
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PIRUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_id?: IntFieldUpdateOperationsInput | number
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PIRActivityReviewCreateInput = {
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
    pir: PIRCreateNestedOneWithoutActivity_reviewsInput
    aip_activity: AIPActivityCreateNestedOneWithoutPir_reviewsInput
  }

  export type PIRActivityReviewUncheckedCreateInput = {
    id?: number
    pir_id: number
    aip_activity_id: number
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
  }

  export type PIRActivityReviewUpdateInput = {
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
    pir?: PIRUpdateOneRequiredWithoutActivity_reviewsNestedInput
    aip_activity?: AIPActivityUpdateOneRequiredWithoutPir_reviewsNestedInput
  }

  export type PIRActivityReviewUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    pir_id?: IntFieldUpdateOperationsInput | number
    aip_activity_id?: IntFieldUpdateOperationsInput | number
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PIRActivityReviewCreateManyInput = {
    id?: number
    pir_id: number
    aip_activity_id: number
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
  }

  export type PIRActivityReviewUpdateManyMutationInput = {
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PIRActivityReviewUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    pir_id?: IntFieldUpdateOperationsInput | number
    aip_activity_id?: IntFieldUpdateOperationsInput | number
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PIRFactorCreateInput = {
    factor_type: string
    facilitating_factors: string
    hindering_factors: string
    pir: PIRCreateNestedOneWithoutFactorsInput
  }

  export type PIRFactorUncheckedCreateInput = {
    id?: number
    pir_id: number
    factor_type: string
    facilitating_factors: string
    hindering_factors: string
  }

  export type PIRFactorUpdateInput = {
    factor_type?: StringFieldUpdateOperationsInput | string
    facilitating_factors?: StringFieldUpdateOperationsInput | string
    hindering_factors?: StringFieldUpdateOperationsInput | string
    pir?: PIRUpdateOneRequiredWithoutFactorsNestedInput
  }

  export type PIRFactorUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    pir_id?: IntFieldUpdateOperationsInput | number
    factor_type?: StringFieldUpdateOperationsInput | string
    facilitating_factors?: StringFieldUpdateOperationsInput | string
    hindering_factors?: StringFieldUpdateOperationsInput | string
  }

  export type PIRFactorCreateManyInput = {
    id?: number
    pir_id: number
    factor_type: string
    facilitating_factors: string
    hindering_factors: string
  }

  export type PIRFactorUpdateManyMutationInput = {
    factor_type?: StringFieldUpdateOperationsInput | string
    facilitating_factors?: StringFieldUpdateOperationsInput | string
    hindering_factors?: StringFieldUpdateOperationsInput | string
  }

  export type PIRFactorUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    pir_id?: IntFieldUpdateOperationsInput | number
    factor_type?: StringFieldUpdateOperationsInput | string
    facilitating_factors?: StringFieldUpdateOperationsInput | string
    hindering_factors?: StringFieldUpdateOperationsInput | string
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type SchoolListRelationFilter = {
    every?: SchoolWhereInput
    some?: SchoolWhereInput
    none?: SchoolWhereInput
  }

  export type SchoolOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ClusterCountOrderByAggregateInput = {
    id?: SortOrder
    cluster_number?: SortOrder
    name?: SortOrder
  }

  export type ClusterAvgOrderByAggregateInput = {
    id?: SortOrder
    cluster_number?: SortOrder
  }

  export type ClusterMaxOrderByAggregateInput = {
    id?: SortOrder
    cluster_number?: SortOrder
    name?: SortOrder
  }

  export type ClusterMinOrderByAggregateInput = {
    id?: SortOrder
    cluster_number?: SortOrder
    name?: SortOrder
  }

  export type ClusterSumOrderByAggregateInput = {
    id?: SortOrder
    cluster_number?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type ClusterScalarRelationFilter = {
    is?: ClusterWhereInput
    isNot?: ClusterWhereInput
  }

  export type AIPListRelationFilter = {
    every?: AIPWhereInput
    some?: AIPWhereInput
    none?: AIPWhereInput
  }

  export type UserNullableScalarRelationFilter = {
    is?: UserWhereInput | null
    isNot?: UserWhereInput | null
  }

  export type ProgramListRelationFilter = {
    every?: ProgramWhereInput
    some?: ProgramWhereInput
    none?: ProgramWhereInput
  }

  export type AIPOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProgramOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SchoolCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    level?: SortOrder
    cluster_id?: SortOrder
  }

  export type SchoolAvgOrderByAggregateInput = {
    id?: SortOrder
    cluster_id?: SortOrder
  }

  export type SchoolMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    level?: SortOrder
    cluster_id?: SortOrder
  }

  export type SchoolMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    level?: SortOrder
    cluster_id?: SortOrder
  }

  export type SchoolSumOrderByAggregateInput = {
    id?: SortOrder
    cluster_id?: SortOrder
  }

  export type UserListRelationFilter = {
    every?: UserWhereInput
    some?: UserWhereInput
    none?: UserWhereInput
  }

  export type UserOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProgramCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    school_level_requirement?: SortOrder
  }

  export type ProgramAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type ProgramMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    school_level_requirement?: SortOrder
  }

  export type ProgramMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    school_level_requirement?: SortOrder
  }

  export type ProgramSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SchoolNullableScalarRelationFilter = {
    is?: SchoolWhereInput | null
    isNot?: SchoolWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrder
    school_id?: SortOrder
    created_at?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
    school_id?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrder
    school_id?: SortOrder
    created_at?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    role?: SortOrder
    name?: SortOrder
    school_id?: SortOrder
    created_at?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
    school_id?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type SchoolScalarRelationFilter = {
    is?: SchoolWhereInput
    isNot?: SchoolWhereInput
  }

  export type ProgramScalarRelationFilter = {
    is?: ProgramWhereInput
    isNot?: ProgramWhereInput
  }

  export type AIPActivityListRelationFilter = {
    every?: AIPActivityWhereInput
    some?: AIPActivityWhereInput
    none?: AIPActivityWhereInput
  }

  export type PIRListRelationFilter = {
    every?: PIRWhereInput
    some?: PIRWhereInput
    none?: PIRWhereInput
  }

  export type AIPActivityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PIROrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AIPSchool_idProgram_idYearCompoundUniqueInput = {
    school_id: number
    program_id: number
    year: number
  }

  export type AIPCountOrderByAggregateInput = {
    id?: SortOrder
    school_id?: SortOrder
    program_id?: SortOrder
    year?: SortOrder
    pillar?: SortOrder
    sip_title?: SortOrder
    project_coordinator?: SortOrder
    objectives?: SortOrder
    indicators?: SortOrder
    annual_target?: SortOrder
    created_at?: SortOrder
  }

  export type AIPAvgOrderByAggregateInput = {
    id?: SortOrder
    school_id?: SortOrder
    program_id?: SortOrder
    year?: SortOrder
  }

  export type AIPMaxOrderByAggregateInput = {
    id?: SortOrder
    school_id?: SortOrder
    program_id?: SortOrder
    year?: SortOrder
    pillar?: SortOrder
    sip_title?: SortOrder
    project_coordinator?: SortOrder
    objectives?: SortOrder
    indicators?: SortOrder
    annual_target?: SortOrder
    created_at?: SortOrder
  }

  export type AIPMinOrderByAggregateInput = {
    id?: SortOrder
    school_id?: SortOrder
    program_id?: SortOrder
    year?: SortOrder
    pillar?: SortOrder
    sip_title?: SortOrder
    project_coordinator?: SortOrder
    objectives?: SortOrder
    indicators?: SortOrder
    annual_target?: SortOrder
    created_at?: SortOrder
  }

  export type AIPSumOrderByAggregateInput = {
    id?: SortOrder
    school_id?: SortOrder
    program_id?: SortOrder
    year?: SortOrder
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type AIPScalarRelationFilter = {
    is?: AIPWhereInput
    isNot?: AIPWhereInput
  }

  export type PIRActivityReviewListRelationFilter = {
    every?: PIRActivityReviewWhereInput
    some?: PIRActivityReviewWhereInput
    none?: PIRActivityReviewWhereInput
  }

  export type PIRActivityReviewOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type AIPActivityCountOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    phase?: SortOrder
    activity_name?: SortOrder
    implementation_period?: SortOrder
    persons_involved?: SortOrder
    outputs?: SortOrder
    budget_amount?: SortOrder
    budget_source?: SortOrder
  }

  export type AIPActivityAvgOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    budget_amount?: SortOrder
  }

  export type AIPActivityMaxOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    phase?: SortOrder
    activity_name?: SortOrder
    implementation_period?: SortOrder
    persons_involved?: SortOrder
    outputs?: SortOrder
    budget_amount?: SortOrder
    budget_source?: SortOrder
  }

  export type AIPActivityMinOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    phase?: SortOrder
    activity_name?: SortOrder
    implementation_period?: SortOrder
    persons_involved?: SortOrder
    outputs?: SortOrder
    budget_amount?: SortOrder
    budget_source?: SortOrder
  }

  export type AIPActivitySumOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    budget_amount?: SortOrder
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type PIRFactorListRelationFilter = {
    every?: PIRFactorWhereInput
    some?: PIRFactorWhereInput
    none?: PIRFactorWhereInput
  }

  export type PIRFactorOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type PIRAip_idQuarterCompoundUniqueInput = {
    aip_id: number
    quarter: string
  }

  export type PIRCountOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    quarter?: SortOrder
    program_owner?: SortOrder
    total_budget?: SortOrder
    fund_source?: SortOrder
    created_at?: SortOrder
  }

  export type PIRAvgOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    total_budget?: SortOrder
  }

  export type PIRMaxOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    quarter?: SortOrder
    program_owner?: SortOrder
    total_budget?: SortOrder
    fund_source?: SortOrder
    created_at?: SortOrder
  }

  export type PIRMinOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    quarter?: SortOrder
    program_owner?: SortOrder
    total_budget?: SortOrder
    fund_source?: SortOrder
    created_at?: SortOrder
  }

  export type PIRSumOrderByAggregateInput = {
    id?: SortOrder
    aip_id?: SortOrder
    total_budget?: SortOrder
  }

  export type PIRScalarRelationFilter = {
    is?: PIRWhereInput
    isNot?: PIRWhereInput
  }

  export type AIPActivityScalarRelationFilter = {
    is?: AIPActivityWhereInput
    isNot?: AIPActivityWhereInput
  }

  export type PIRActivityReviewPir_idAip_activity_idCompoundUniqueInput = {
    pir_id: number
    aip_activity_id: number
  }

  export type PIRActivityReviewCountOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
    aip_activity_id?: SortOrder
    physical_target?: SortOrder
    financial_target?: SortOrder
    physical_accomplished?: SortOrder
    financial_accomplished?: SortOrder
    actions_to_address_gap?: SortOrder
  }

  export type PIRActivityReviewAvgOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
    aip_activity_id?: SortOrder
    physical_target?: SortOrder
    financial_target?: SortOrder
    physical_accomplished?: SortOrder
    financial_accomplished?: SortOrder
  }

  export type PIRActivityReviewMaxOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
    aip_activity_id?: SortOrder
    physical_target?: SortOrder
    financial_target?: SortOrder
    physical_accomplished?: SortOrder
    financial_accomplished?: SortOrder
    actions_to_address_gap?: SortOrder
  }

  export type PIRActivityReviewMinOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
    aip_activity_id?: SortOrder
    physical_target?: SortOrder
    financial_target?: SortOrder
    physical_accomplished?: SortOrder
    financial_accomplished?: SortOrder
    actions_to_address_gap?: SortOrder
  }

  export type PIRActivityReviewSumOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
    aip_activity_id?: SortOrder
    physical_target?: SortOrder
    financial_target?: SortOrder
    physical_accomplished?: SortOrder
    financial_accomplished?: SortOrder
  }

  export type PIRFactorPir_idFactor_typeCompoundUniqueInput = {
    pir_id: number
    factor_type: string
  }

  export type PIRFactorCountOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
    factor_type?: SortOrder
    facilitating_factors?: SortOrder
    hindering_factors?: SortOrder
  }

  export type PIRFactorAvgOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
  }

  export type PIRFactorMaxOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
    factor_type?: SortOrder
    facilitating_factors?: SortOrder
    hindering_factors?: SortOrder
  }

  export type PIRFactorMinOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
    factor_type?: SortOrder
    facilitating_factors?: SortOrder
    hindering_factors?: SortOrder
  }

  export type PIRFactorSumOrderByAggregateInput = {
    id?: SortOrder
    pir_id?: SortOrder
  }

  export type SchoolCreateNestedManyWithoutClusterInput = {
    create?: XOR<SchoolCreateWithoutClusterInput, SchoolUncheckedCreateWithoutClusterInput> | SchoolCreateWithoutClusterInput[] | SchoolUncheckedCreateWithoutClusterInput[]
    connectOrCreate?: SchoolCreateOrConnectWithoutClusterInput | SchoolCreateOrConnectWithoutClusterInput[]
    createMany?: SchoolCreateManyClusterInputEnvelope
    connect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
  }

  export type SchoolUncheckedCreateNestedManyWithoutClusterInput = {
    create?: XOR<SchoolCreateWithoutClusterInput, SchoolUncheckedCreateWithoutClusterInput> | SchoolCreateWithoutClusterInput[] | SchoolUncheckedCreateWithoutClusterInput[]
    connectOrCreate?: SchoolCreateOrConnectWithoutClusterInput | SchoolCreateOrConnectWithoutClusterInput[]
    createMany?: SchoolCreateManyClusterInputEnvelope
    connect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type SchoolUpdateManyWithoutClusterNestedInput = {
    create?: XOR<SchoolCreateWithoutClusterInput, SchoolUncheckedCreateWithoutClusterInput> | SchoolCreateWithoutClusterInput[] | SchoolUncheckedCreateWithoutClusterInput[]
    connectOrCreate?: SchoolCreateOrConnectWithoutClusterInput | SchoolCreateOrConnectWithoutClusterInput[]
    upsert?: SchoolUpsertWithWhereUniqueWithoutClusterInput | SchoolUpsertWithWhereUniqueWithoutClusterInput[]
    createMany?: SchoolCreateManyClusterInputEnvelope
    set?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    disconnect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    delete?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    connect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    update?: SchoolUpdateWithWhereUniqueWithoutClusterInput | SchoolUpdateWithWhereUniqueWithoutClusterInput[]
    updateMany?: SchoolUpdateManyWithWhereWithoutClusterInput | SchoolUpdateManyWithWhereWithoutClusterInput[]
    deleteMany?: SchoolScalarWhereInput | SchoolScalarWhereInput[]
  }

  export type SchoolUncheckedUpdateManyWithoutClusterNestedInput = {
    create?: XOR<SchoolCreateWithoutClusterInput, SchoolUncheckedCreateWithoutClusterInput> | SchoolCreateWithoutClusterInput[] | SchoolUncheckedCreateWithoutClusterInput[]
    connectOrCreate?: SchoolCreateOrConnectWithoutClusterInput | SchoolCreateOrConnectWithoutClusterInput[]
    upsert?: SchoolUpsertWithWhereUniqueWithoutClusterInput | SchoolUpsertWithWhereUniqueWithoutClusterInput[]
    createMany?: SchoolCreateManyClusterInputEnvelope
    set?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    disconnect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    delete?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    connect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    update?: SchoolUpdateWithWhereUniqueWithoutClusterInput | SchoolUpdateWithWhereUniqueWithoutClusterInput[]
    updateMany?: SchoolUpdateManyWithWhereWithoutClusterInput | SchoolUpdateManyWithWhereWithoutClusterInput[]
    deleteMany?: SchoolScalarWhereInput | SchoolScalarWhereInput[]
  }

  export type ClusterCreateNestedOneWithoutSchoolsInput = {
    create?: XOR<ClusterCreateWithoutSchoolsInput, ClusterUncheckedCreateWithoutSchoolsInput>
    connectOrCreate?: ClusterCreateOrConnectWithoutSchoolsInput
    connect?: ClusterWhereUniqueInput
  }

  export type AIPCreateNestedManyWithoutSchoolInput = {
    create?: XOR<AIPCreateWithoutSchoolInput, AIPUncheckedCreateWithoutSchoolInput> | AIPCreateWithoutSchoolInput[] | AIPUncheckedCreateWithoutSchoolInput[]
    connectOrCreate?: AIPCreateOrConnectWithoutSchoolInput | AIPCreateOrConnectWithoutSchoolInput[]
    createMany?: AIPCreateManySchoolInputEnvelope
    connect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
  }

  export type UserCreateNestedOneWithoutSchoolInput = {
    create?: XOR<UserCreateWithoutSchoolInput, UserUncheckedCreateWithoutSchoolInput>
    connectOrCreate?: UserCreateOrConnectWithoutSchoolInput
    connect?: UserWhereUniqueInput
  }

  export type ProgramCreateNestedManyWithoutRestricted_schoolsInput = {
    create?: XOR<ProgramCreateWithoutRestricted_schoolsInput, ProgramUncheckedCreateWithoutRestricted_schoolsInput> | ProgramCreateWithoutRestricted_schoolsInput[] | ProgramUncheckedCreateWithoutRestricted_schoolsInput[]
    connectOrCreate?: ProgramCreateOrConnectWithoutRestricted_schoolsInput | ProgramCreateOrConnectWithoutRestricted_schoolsInput[]
    connect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
  }

  export type AIPUncheckedCreateNestedManyWithoutSchoolInput = {
    create?: XOR<AIPCreateWithoutSchoolInput, AIPUncheckedCreateWithoutSchoolInput> | AIPCreateWithoutSchoolInput[] | AIPUncheckedCreateWithoutSchoolInput[]
    connectOrCreate?: AIPCreateOrConnectWithoutSchoolInput | AIPCreateOrConnectWithoutSchoolInput[]
    createMany?: AIPCreateManySchoolInputEnvelope
    connect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedOneWithoutSchoolInput = {
    create?: XOR<UserCreateWithoutSchoolInput, UserUncheckedCreateWithoutSchoolInput>
    connectOrCreate?: UserCreateOrConnectWithoutSchoolInput
    connect?: UserWhereUniqueInput
  }

  export type ProgramUncheckedCreateNestedManyWithoutRestricted_schoolsInput = {
    create?: XOR<ProgramCreateWithoutRestricted_schoolsInput, ProgramUncheckedCreateWithoutRestricted_schoolsInput> | ProgramCreateWithoutRestricted_schoolsInput[] | ProgramUncheckedCreateWithoutRestricted_schoolsInput[]
    connectOrCreate?: ProgramCreateOrConnectWithoutRestricted_schoolsInput | ProgramCreateOrConnectWithoutRestricted_schoolsInput[]
    connect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
  }

  export type ClusterUpdateOneRequiredWithoutSchoolsNestedInput = {
    create?: XOR<ClusterCreateWithoutSchoolsInput, ClusterUncheckedCreateWithoutSchoolsInput>
    connectOrCreate?: ClusterCreateOrConnectWithoutSchoolsInput
    upsert?: ClusterUpsertWithoutSchoolsInput
    connect?: ClusterWhereUniqueInput
    update?: XOR<XOR<ClusterUpdateToOneWithWhereWithoutSchoolsInput, ClusterUpdateWithoutSchoolsInput>, ClusterUncheckedUpdateWithoutSchoolsInput>
  }

  export type AIPUpdateManyWithoutSchoolNestedInput = {
    create?: XOR<AIPCreateWithoutSchoolInput, AIPUncheckedCreateWithoutSchoolInput> | AIPCreateWithoutSchoolInput[] | AIPUncheckedCreateWithoutSchoolInput[]
    connectOrCreate?: AIPCreateOrConnectWithoutSchoolInput | AIPCreateOrConnectWithoutSchoolInput[]
    upsert?: AIPUpsertWithWhereUniqueWithoutSchoolInput | AIPUpsertWithWhereUniqueWithoutSchoolInput[]
    createMany?: AIPCreateManySchoolInputEnvelope
    set?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    disconnect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    delete?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    connect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    update?: AIPUpdateWithWhereUniqueWithoutSchoolInput | AIPUpdateWithWhereUniqueWithoutSchoolInput[]
    updateMany?: AIPUpdateManyWithWhereWithoutSchoolInput | AIPUpdateManyWithWhereWithoutSchoolInput[]
    deleteMany?: AIPScalarWhereInput | AIPScalarWhereInput[]
  }

  export type UserUpdateOneWithoutSchoolNestedInput = {
    create?: XOR<UserCreateWithoutSchoolInput, UserUncheckedCreateWithoutSchoolInput>
    connectOrCreate?: UserCreateOrConnectWithoutSchoolInput
    upsert?: UserUpsertWithoutSchoolInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSchoolInput, UserUpdateWithoutSchoolInput>, UserUncheckedUpdateWithoutSchoolInput>
  }

  export type ProgramUpdateManyWithoutRestricted_schoolsNestedInput = {
    create?: XOR<ProgramCreateWithoutRestricted_schoolsInput, ProgramUncheckedCreateWithoutRestricted_schoolsInput> | ProgramCreateWithoutRestricted_schoolsInput[] | ProgramUncheckedCreateWithoutRestricted_schoolsInput[]
    connectOrCreate?: ProgramCreateOrConnectWithoutRestricted_schoolsInput | ProgramCreateOrConnectWithoutRestricted_schoolsInput[]
    upsert?: ProgramUpsertWithWhereUniqueWithoutRestricted_schoolsInput | ProgramUpsertWithWhereUniqueWithoutRestricted_schoolsInput[]
    set?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    disconnect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    delete?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    connect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    update?: ProgramUpdateWithWhereUniqueWithoutRestricted_schoolsInput | ProgramUpdateWithWhereUniqueWithoutRestricted_schoolsInput[]
    updateMany?: ProgramUpdateManyWithWhereWithoutRestricted_schoolsInput | ProgramUpdateManyWithWhereWithoutRestricted_schoolsInput[]
    deleteMany?: ProgramScalarWhereInput | ProgramScalarWhereInput[]
  }

  export type AIPUncheckedUpdateManyWithoutSchoolNestedInput = {
    create?: XOR<AIPCreateWithoutSchoolInput, AIPUncheckedCreateWithoutSchoolInput> | AIPCreateWithoutSchoolInput[] | AIPUncheckedCreateWithoutSchoolInput[]
    connectOrCreate?: AIPCreateOrConnectWithoutSchoolInput | AIPCreateOrConnectWithoutSchoolInput[]
    upsert?: AIPUpsertWithWhereUniqueWithoutSchoolInput | AIPUpsertWithWhereUniqueWithoutSchoolInput[]
    createMany?: AIPCreateManySchoolInputEnvelope
    set?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    disconnect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    delete?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    connect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    update?: AIPUpdateWithWhereUniqueWithoutSchoolInput | AIPUpdateWithWhereUniqueWithoutSchoolInput[]
    updateMany?: AIPUpdateManyWithWhereWithoutSchoolInput | AIPUpdateManyWithWhereWithoutSchoolInput[]
    deleteMany?: AIPScalarWhereInput | AIPScalarWhereInput[]
  }

  export type UserUncheckedUpdateOneWithoutSchoolNestedInput = {
    create?: XOR<UserCreateWithoutSchoolInput, UserUncheckedCreateWithoutSchoolInput>
    connectOrCreate?: UserCreateOrConnectWithoutSchoolInput
    upsert?: UserUpsertWithoutSchoolInput
    disconnect?: UserWhereInput | boolean
    delete?: UserWhereInput | boolean
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSchoolInput, UserUpdateWithoutSchoolInput>, UserUncheckedUpdateWithoutSchoolInput>
  }

  export type ProgramUncheckedUpdateManyWithoutRestricted_schoolsNestedInput = {
    create?: XOR<ProgramCreateWithoutRestricted_schoolsInput, ProgramUncheckedCreateWithoutRestricted_schoolsInput> | ProgramCreateWithoutRestricted_schoolsInput[] | ProgramUncheckedCreateWithoutRestricted_schoolsInput[]
    connectOrCreate?: ProgramCreateOrConnectWithoutRestricted_schoolsInput | ProgramCreateOrConnectWithoutRestricted_schoolsInput[]
    upsert?: ProgramUpsertWithWhereUniqueWithoutRestricted_schoolsInput | ProgramUpsertWithWhereUniqueWithoutRestricted_schoolsInput[]
    set?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    disconnect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    delete?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    connect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    update?: ProgramUpdateWithWhereUniqueWithoutRestricted_schoolsInput | ProgramUpdateWithWhereUniqueWithoutRestricted_schoolsInput[]
    updateMany?: ProgramUpdateManyWithWhereWithoutRestricted_schoolsInput | ProgramUpdateManyWithWhereWithoutRestricted_schoolsInput[]
    deleteMany?: ProgramScalarWhereInput | ProgramScalarWhereInput[]
  }

  export type AIPCreateNestedManyWithoutProgramInput = {
    create?: XOR<AIPCreateWithoutProgramInput, AIPUncheckedCreateWithoutProgramInput> | AIPCreateWithoutProgramInput[] | AIPUncheckedCreateWithoutProgramInput[]
    connectOrCreate?: AIPCreateOrConnectWithoutProgramInput | AIPCreateOrConnectWithoutProgramInput[]
    createMany?: AIPCreateManyProgramInputEnvelope
    connect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
  }

  export type UserCreateNestedManyWithoutProgramsInput = {
    create?: XOR<UserCreateWithoutProgramsInput, UserUncheckedCreateWithoutProgramsInput> | UserCreateWithoutProgramsInput[] | UserUncheckedCreateWithoutProgramsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutProgramsInput | UserCreateOrConnectWithoutProgramsInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type SchoolCreateNestedManyWithoutRestricted_programsInput = {
    create?: XOR<SchoolCreateWithoutRestricted_programsInput, SchoolUncheckedCreateWithoutRestricted_programsInput> | SchoolCreateWithoutRestricted_programsInput[] | SchoolUncheckedCreateWithoutRestricted_programsInput[]
    connectOrCreate?: SchoolCreateOrConnectWithoutRestricted_programsInput | SchoolCreateOrConnectWithoutRestricted_programsInput[]
    connect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
  }

  export type AIPUncheckedCreateNestedManyWithoutProgramInput = {
    create?: XOR<AIPCreateWithoutProgramInput, AIPUncheckedCreateWithoutProgramInput> | AIPCreateWithoutProgramInput[] | AIPUncheckedCreateWithoutProgramInput[]
    connectOrCreate?: AIPCreateOrConnectWithoutProgramInput | AIPCreateOrConnectWithoutProgramInput[]
    createMany?: AIPCreateManyProgramInputEnvelope
    connect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
  }

  export type UserUncheckedCreateNestedManyWithoutProgramsInput = {
    create?: XOR<UserCreateWithoutProgramsInput, UserUncheckedCreateWithoutProgramsInput> | UserCreateWithoutProgramsInput[] | UserUncheckedCreateWithoutProgramsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutProgramsInput | UserCreateOrConnectWithoutProgramsInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
  }

  export type SchoolUncheckedCreateNestedManyWithoutRestricted_programsInput = {
    create?: XOR<SchoolCreateWithoutRestricted_programsInput, SchoolUncheckedCreateWithoutRestricted_programsInput> | SchoolCreateWithoutRestricted_programsInput[] | SchoolUncheckedCreateWithoutRestricted_programsInput[]
    connectOrCreate?: SchoolCreateOrConnectWithoutRestricted_programsInput | SchoolCreateOrConnectWithoutRestricted_programsInput[]
    connect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
  }

  export type AIPUpdateManyWithoutProgramNestedInput = {
    create?: XOR<AIPCreateWithoutProgramInput, AIPUncheckedCreateWithoutProgramInput> | AIPCreateWithoutProgramInput[] | AIPUncheckedCreateWithoutProgramInput[]
    connectOrCreate?: AIPCreateOrConnectWithoutProgramInput | AIPCreateOrConnectWithoutProgramInput[]
    upsert?: AIPUpsertWithWhereUniqueWithoutProgramInput | AIPUpsertWithWhereUniqueWithoutProgramInput[]
    createMany?: AIPCreateManyProgramInputEnvelope
    set?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    disconnect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    delete?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    connect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    update?: AIPUpdateWithWhereUniqueWithoutProgramInput | AIPUpdateWithWhereUniqueWithoutProgramInput[]
    updateMany?: AIPUpdateManyWithWhereWithoutProgramInput | AIPUpdateManyWithWhereWithoutProgramInput[]
    deleteMany?: AIPScalarWhereInput | AIPScalarWhereInput[]
  }

  export type UserUpdateManyWithoutProgramsNestedInput = {
    create?: XOR<UserCreateWithoutProgramsInput, UserUncheckedCreateWithoutProgramsInput> | UserCreateWithoutProgramsInput[] | UserUncheckedCreateWithoutProgramsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutProgramsInput | UserCreateOrConnectWithoutProgramsInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutProgramsInput | UserUpsertWithWhereUniqueWithoutProgramsInput[]
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutProgramsInput | UserUpdateWithWhereUniqueWithoutProgramsInput[]
    updateMany?: UserUpdateManyWithWhereWithoutProgramsInput | UserUpdateManyWithWhereWithoutProgramsInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type SchoolUpdateManyWithoutRestricted_programsNestedInput = {
    create?: XOR<SchoolCreateWithoutRestricted_programsInput, SchoolUncheckedCreateWithoutRestricted_programsInput> | SchoolCreateWithoutRestricted_programsInput[] | SchoolUncheckedCreateWithoutRestricted_programsInput[]
    connectOrCreate?: SchoolCreateOrConnectWithoutRestricted_programsInput | SchoolCreateOrConnectWithoutRestricted_programsInput[]
    upsert?: SchoolUpsertWithWhereUniqueWithoutRestricted_programsInput | SchoolUpsertWithWhereUniqueWithoutRestricted_programsInput[]
    set?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    disconnect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    delete?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    connect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    update?: SchoolUpdateWithWhereUniqueWithoutRestricted_programsInput | SchoolUpdateWithWhereUniqueWithoutRestricted_programsInput[]
    updateMany?: SchoolUpdateManyWithWhereWithoutRestricted_programsInput | SchoolUpdateManyWithWhereWithoutRestricted_programsInput[]
    deleteMany?: SchoolScalarWhereInput | SchoolScalarWhereInput[]
  }

  export type AIPUncheckedUpdateManyWithoutProgramNestedInput = {
    create?: XOR<AIPCreateWithoutProgramInput, AIPUncheckedCreateWithoutProgramInput> | AIPCreateWithoutProgramInput[] | AIPUncheckedCreateWithoutProgramInput[]
    connectOrCreate?: AIPCreateOrConnectWithoutProgramInput | AIPCreateOrConnectWithoutProgramInput[]
    upsert?: AIPUpsertWithWhereUniqueWithoutProgramInput | AIPUpsertWithWhereUniqueWithoutProgramInput[]
    createMany?: AIPCreateManyProgramInputEnvelope
    set?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    disconnect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    delete?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    connect?: AIPWhereUniqueInput | AIPWhereUniqueInput[]
    update?: AIPUpdateWithWhereUniqueWithoutProgramInput | AIPUpdateWithWhereUniqueWithoutProgramInput[]
    updateMany?: AIPUpdateManyWithWhereWithoutProgramInput | AIPUpdateManyWithWhereWithoutProgramInput[]
    deleteMany?: AIPScalarWhereInput | AIPScalarWhereInput[]
  }

  export type UserUncheckedUpdateManyWithoutProgramsNestedInput = {
    create?: XOR<UserCreateWithoutProgramsInput, UserUncheckedCreateWithoutProgramsInput> | UserCreateWithoutProgramsInput[] | UserUncheckedCreateWithoutProgramsInput[]
    connectOrCreate?: UserCreateOrConnectWithoutProgramsInput | UserCreateOrConnectWithoutProgramsInput[]
    upsert?: UserUpsertWithWhereUniqueWithoutProgramsInput | UserUpsertWithWhereUniqueWithoutProgramsInput[]
    set?: UserWhereUniqueInput | UserWhereUniqueInput[]
    disconnect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    delete?: UserWhereUniqueInput | UserWhereUniqueInput[]
    connect?: UserWhereUniqueInput | UserWhereUniqueInput[]
    update?: UserUpdateWithWhereUniqueWithoutProgramsInput | UserUpdateWithWhereUniqueWithoutProgramsInput[]
    updateMany?: UserUpdateManyWithWhereWithoutProgramsInput | UserUpdateManyWithWhereWithoutProgramsInput[]
    deleteMany?: UserScalarWhereInput | UserScalarWhereInput[]
  }

  export type SchoolUncheckedUpdateManyWithoutRestricted_programsNestedInput = {
    create?: XOR<SchoolCreateWithoutRestricted_programsInput, SchoolUncheckedCreateWithoutRestricted_programsInput> | SchoolCreateWithoutRestricted_programsInput[] | SchoolUncheckedCreateWithoutRestricted_programsInput[]
    connectOrCreate?: SchoolCreateOrConnectWithoutRestricted_programsInput | SchoolCreateOrConnectWithoutRestricted_programsInput[]
    upsert?: SchoolUpsertWithWhereUniqueWithoutRestricted_programsInput | SchoolUpsertWithWhereUniqueWithoutRestricted_programsInput[]
    set?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    disconnect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    delete?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    connect?: SchoolWhereUniqueInput | SchoolWhereUniqueInput[]
    update?: SchoolUpdateWithWhereUniqueWithoutRestricted_programsInput | SchoolUpdateWithWhereUniqueWithoutRestricted_programsInput[]
    updateMany?: SchoolUpdateManyWithWhereWithoutRestricted_programsInput | SchoolUpdateManyWithWhereWithoutRestricted_programsInput[]
    deleteMany?: SchoolScalarWhereInput | SchoolScalarWhereInput[]
  }

  export type SchoolCreateNestedOneWithoutUserInput = {
    create?: XOR<SchoolCreateWithoutUserInput, SchoolUncheckedCreateWithoutUserInput>
    connectOrCreate?: SchoolCreateOrConnectWithoutUserInput
    connect?: SchoolWhereUniqueInput
  }

  export type ProgramCreateNestedManyWithoutPersonnelInput = {
    create?: XOR<ProgramCreateWithoutPersonnelInput, ProgramUncheckedCreateWithoutPersonnelInput> | ProgramCreateWithoutPersonnelInput[] | ProgramUncheckedCreateWithoutPersonnelInput[]
    connectOrCreate?: ProgramCreateOrConnectWithoutPersonnelInput | ProgramCreateOrConnectWithoutPersonnelInput[]
    connect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
  }

  export type ProgramUncheckedCreateNestedManyWithoutPersonnelInput = {
    create?: XOR<ProgramCreateWithoutPersonnelInput, ProgramUncheckedCreateWithoutPersonnelInput> | ProgramCreateWithoutPersonnelInput[] | ProgramUncheckedCreateWithoutPersonnelInput[]
    connectOrCreate?: ProgramCreateOrConnectWithoutPersonnelInput | ProgramCreateOrConnectWithoutPersonnelInput[]
    connect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type SchoolUpdateOneWithoutUserNestedInput = {
    create?: XOR<SchoolCreateWithoutUserInput, SchoolUncheckedCreateWithoutUserInput>
    connectOrCreate?: SchoolCreateOrConnectWithoutUserInput
    upsert?: SchoolUpsertWithoutUserInput
    disconnect?: SchoolWhereInput | boolean
    delete?: SchoolWhereInput | boolean
    connect?: SchoolWhereUniqueInput
    update?: XOR<XOR<SchoolUpdateToOneWithWhereWithoutUserInput, SchoolUpdateWithoutUserInput>, SchoolUncheckedUpdateWithoutUserInput>
  }

  export type ProgramUpdateManyWithoutPersonnelNestedInput = {
    create?: XOR<ProgramCreateWithoutPersonnelInput, ProgramUncheckedCreateWithoutPersonnelInput> | ProgramCreateWithoutPersonnelInput[] | ProgramUncheckedCreateWithoutPersonnelInput[]
    connectOrCreate?: ProgramCreateOrConnectWithoutPersonnelInput | ProgramCreateOrConnectWithoutPersonnelInput[]
    upsert?: ProgramUpsertWithWhereUniqueWithoutPersonnelInput | ProgramUpsertWithWhereUniqueWithoutPersonnelInput[]
    set?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    disconnect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    delete?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    connect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    update?: ProgramUpdateWithWhereUniqueWithoutPersonnelInput | ProgramUpdateWithWhereUniqueWithoutPersonnelInput[]
    updateMany?: ProgramUpdateManyWithWhereWithoutPersonnelInput | ProgramUpdateManyWithWhereWithoutPersonnelInput[]
    deleteMany?: ProgramScalarWhereInput | ProgramScalarWhereInput[]
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type ProgramUncheckedUpdateManyWithoutPersonnelNestedInput = {
    create?: XOR<ProgramCreateWithoutPersonnelInput, ProgramUncheckedCreateWithoutPersonnelInput> | ProgramCreateWithoutPersonnelInput[] | ProgramUncheckedCreateWithoutPersonnelInput[]
    connectOrCreate?: ProgramCreateOrConnectWithoutPersonnelInput | ProgramCreateOrConnectWithoutPersonnelInput[]
    upsert?: ProgramUpsertWithWhereUniqueWithoutPersonnelInput | ProgramUpsertWithWhereUniqueWithoutPersonnelInput[]
    set?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    disconnect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    delete?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    connect?: ProgramWhereUniqueInput | ProgramWhereUniqueInput[]
    update?: ProgramUpdateWithWhereUniqueWithoutPersonnelInput | ProgramUpdateWithWhereUniqueWithoutPersonnelInput[]
    updateMany?: ProgramUpdateManyWithWhereWithoutPersonnelInput | ProgramUpdateManyWithWhereWithoutPersonnelInput[]
    deleteMany?: ProgramScalarWhereInput | ProgramScalarWhereInput[]
  }

  export type SchoolCreateNestedOneWithoutAipsInput = {
    create?: XOR<SchoolCreateWithoutAipsInput, SchoolUncheckedCreateWithoutAipsInput>
    connectOrCreate?: SchoolCreateOrConnectWithoutAipsInput
    connect?: SchoolWhereUniqueInput
  }

  export type ProgramCreateNestedOneWithoutAipsInput = {
    create?: XOR<ProgramCreateWithoutAipsInput, ProgramUncheckedCreateWithoutAipsInput>
    connectOrCreate?: ProgramCreateOrConnectWithoutAipsInput
    connect?: ProgramWhereUniqueInput
  }

  export type AIPActivityCreateNestedManyWithoutAipInput = {
    create?: XOR<AIPActivityCreateWithoutAipInput, AIPActivityUncheckedCreateWithoutAipInput> | AIPActivityCreateWithoutAipInput[] | AIPActivityUncheckedCreateWithoutAipInput[]
    connectOrCreate?: AIPActivityCreateOrConnectWithoutAipInput | AIPActivityCreateOrConnectWithoutAipInput[]
    createMany?: AIPActivityCreateManyAipInputEnvelope
    connect?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
  }

  export type PIRCreateNestedManyWithoutAipInput = {
    create?: XOR<PIRCreateWithoutAipInput, PIRUncheckedCreateWithoutAipInput> | PIRCreateWithoutAipInput[] | PIRUncheckedCreateWithoutAipInput[]
    connectOrCreate?: PIRCreateOrConnectWithoutAipInput | PIRCreateOrConnectWithoutAipInput[]
    createMany?: PIRCreateManyAipInputEnvelope
    connect?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
  }

  export type AIPActivityUncheckedCreateNestedManyWithoutAipInput = {
    create?: XOR<AIPActivityCreateWithoutAipInput, AIPActivityUncheckedCreateWithoutAipInput> | AIPActivityCreateWithoutAipInput[] | AIPActivityUncheckedCreateWithoutAipInput[]
    connectOrCreate?: AIPActivityCreateOrConnectWithoutAipInput | AIPActivityCreateOrConnectWithoutAipInput[]
    createMany?: AIPActivityCreateManyAipInputEnvelope
    connect?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
  }

  export type PIRUncheckedCreateNestedManyWithoutAipInput = {
    create?: XOR<PIRCreateWithoutAipInput, PIRUncheckedCreateWithoutAipInput> | PIRCreateWithoutAipInput[] | PIRUncheckedCreateWithoutAipInput[]
    connectOrCreate?: PIRCreateOrConnectWithoutAipInput | PIRCreateOrConnectWithoutAipInput[]
    createMany?: PIRCreateManyAipInputEnvelope
    connect?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
  }

  export type SchoolUpdateOneRequiredWithoutAipsNestedInput = {
    create?: XOR<SchoolCreateWithoutAipsInput, SchoolUncheckedCreateWithoutAipsInput>
    connectOrCreate?: SchoolCreateOrConnectWithoutAipsInput
    upsert?: SchoolUpsertWithoutAipsInput
    connect?: SchoolWhereUniqueInput
    update?: XOR<XOR<SchoolUpdateToOneWithWhereWithoutAipsInput, SchoolUpdateWithoutAipsInput>, SchoolUncheckedUpdateWithoutAipsInput>
  }

  export type ProgramUpdateOneRequiredWithoutAipsNestedInput = {
    create?: XOR<ProgramCreateWithoutAipsInput, ProgramUncheckedCreateWithoutAipsInput>
    connectOrCreate?: ProgramCreateOrConnectWithoutAipsInput
    upsert?: ProgramUpsertWithoutAipsInput
    connect?: ProgramWhereUniqueInput
    update?: XOR<XOR<ProgramUpdateToOneWithWhereWithoutAipsInput, ProgramUpdateWithoutAipsInput>, ProgramUncheckedUpdateWithoutAipsInput>
  }

  export type AIPActivityUpdateManyWithoutAipNestedInput = {
    create?: XOR<AIPActivityCreateWithoutAipInput, AIPActivityUncheckedCreateWithoutAipInput> | AIPActivityCreateWithoutAipInput[] | AIPActivityUncheckedCreateWithoutAipInput[]
    connectOrCreate?: AIPActivityCreateOrConnectWithoutAipInput | AIPActivityCreateOrConnectWithoutAipInput[]
    upsert?: AIPActivityUpsertWithWhereUniqueWithoutAipInput | AIPActivityUpsertWithWhereUniqueWithoutAipInput[]
    createMany?: AIPActivityCreateManyAipInputEnvelope
    set?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
    disconnect?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
    delete?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
    connect?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
    update?: AIPActivityUpdateWithWhereUniqueWithoutAipInput | AIPActivityUpdateWithWhereUniqueWithoutAipInput[]
    updateMany?: AIPActivityUpdateManyWithWhereWithoutAipInput | AIPActivityUpdateManyWithWhereWithoutAipInput[]
    deleteMany?: AIPActivityScalarWhereInput | AIPActivityScalarWhereInput[]
  }

  export type PIRUpdateManyWithoutAipNestedInput = {
    create?: XOR<PIRCreateWithoutAipInput, PIRUncheckedCreateWithoutAipInput> | PIRCreateWithoutAipInput[] | PIRUncheckedCreateWithoutAipInput[]
    connectOrCreate?: PIRCreateOrConnectWithoutAipInput | PIRCreateOrConnectWithoutAipInput[]
    upsert?: PIRUpsertWithWhereUniqueWithoutAipInput | PIRUpsertWithWhereUniqueWithoutAipInput[]
    createMany?: PIRCreateManyAipInputEnvelope
    set?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
    disconnect?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
    delete?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
    connect?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
    update?: PIRUpdateWithWhereUniqueWithoutAipInput | PIRUpdateWithWhereUniqueWithoutAipInput[]
    updateMany?: PIRUpdateManyWithWhereWithoutAipInput | PIRUpdateManyWithWhereWithoutAipInput[]
    deleteMany?: PIRScalarWhereInput | PIRScalarWhereInput[]
  }

  export type AIPActivityUncheckedUpdateManyWithoutAipNestedInput = {
    create?: XOR<AIPActivityCreateWithoutAipInput, AIPActivityUncheckedCreateWithoutAipInput> | AIPActivityCreateWithoutAipInput[] | AIPActivityUncheckedCreateWithoutAipInput[]
    connectOrCreate?: AIPActivityCreateOrConnectWithoutAipInput | AIPActivityCreateOrConnectWithoutAipInput[]
    upsert?: AIPActivityUpsertWithWhereUniqueWithoutAipInput | AIPActivityUpsertWithWhereUniqueWithoutAipInput[]
    createMany?: AIPActivityCreateManyAipInputEnvelope
    set?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
    disconnect?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
    delete?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
    connect?: AIPActivityWhereUniqueInput | AIPActivityWhereUniqueInput[]
    update?: AIPActivityUpdateWithWhereUniqueWithoutAipInput | AIPActivityUpdateWithWhereUniqueWithoutAipInput[]
    updateMany?: AIPActivityUpdateManyWithWhereWithoutAipInput | AIPActivityUpdateManyWithWhereWithoutAipInput[]
    deleteMany?: AIPActivityScalarWhereInput | AIPActivityScalarWhereInput[]
  }

  export type PIRUncheckedUpdateManyWithoutAipNestedInput = {
    create?: XOR<PIRCreateWithoutAipInput, PIRUncheckedCreateWithoutAipInput> | PIRCreateWithoutAipInput[] | PIRUncheckedCreateWithoutAipInput[]
    connectOrCreate?: PIRCreateOrConnectWithoutAipInput | PIRCreateOrConnectWithoutAipInput[]
    upsert?: PIRUpsertWithWhereUniqueWithoutAipInput | PIRUpsertWithWhereUniqueWithoutAipInput[]
    createMany?: PIRCreateManyAipInputEnvelope
    set?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
    disconnect?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
    delete?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
    connect?: PIRWhereUniqueInput | PIRWhereUniqueInput[]
    update?: PIRUpdateWithWhereUniqueWithoutAipInput | PIRUpdateWithWhereUniqueWithoutAipInput[]
    updateMany?: PIRUpdateManyWithWhereWithoutAipInput | PIRUpdateManyWithWhereWithoutAipInput[]
    deleteMany?: PIRScalarWhereInput | PIRScalarWhereInput[]
  }

  export type AIPCreateNestedOneWithoutActivitiesInput = {
    create?: XOR<AIPCreateWithoutActivitiesInput, AIPUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: AIPCreateOrConnectWithoutActivitiesInput
    connect?: AIPWhereUniqueInput
  }

  export type PIRActivityReviewCreateNestedManyWithoutAip_activityInput = {
    create?: XOR<PIRActivityReviewCreateWithoutAip_activityInput, PIRActivityReviewUncheckedCreateWithoutAip_activityInput> | PIRActivityReviewCreateWithoutAip_activityInput[] | PIRActivityReviewUncheckedCreateWithoutAip_activityInput[]
    connectOrCreate?: PIRActivityReviewCreateOrConnectWithoutAip_activityInput | PIRActivityReviewCreateOrConnectWithoutAip_activityInput[]
    createMany?: PIRActivityReviewCreateManyAip_activityInputEnvelope
    connect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
  }

  export type PIRActivityReviewUncheckedCreateNestedManyWithoutAip_activityInput = {
    create?: XOR<PIRActivityReviewCreateWithoutAip_activityInput, PIRActivityReviewUncheckedCreateWithoutAip_activityInput> | PIRActivityReviewCreateWithoutAip_activityInput[] | PIRActivityReviewUncheckedCreateWithoutAip_activityInput[]
    connectOrCreate?: PIRActivityReviewCreateOrConnectWithoutAip_activityInput | PIRActivityReviewCreateOrConnectWithoutAip_activityInput[]
    createMany?: PIRActivityReviewCreateManyAip_activityInputEnvelope
    connect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type AIPUpdateOneRequiredWithoutActivitiesNestedInput = {
    create?: XOR<AIPCreateWithoutActivitiesInput, AIPUncheckedCreateWithoutActivitiesInput>
    connectOrCreate?: AIPCreateOrConnectWithoutActivitiesInput
    upsert?: AIPUpsertWithoutActivitiesInput
    connect?: AIPWhereUniqueInput
    update?: XOR<XOR<AIPUpdateToOneWithWhereWithoutActivitiesInput, AIPUpdateWithoutActivitiesInput>, AIPUncheckedUpdateWithoutActivitiesInput>
  }

  export type PIRActivityReviewUpdateManyWithoutAip_activityNestedInput = {
    create?: XOR<PIRActivityReviewCreateWithoutAip_activityInput, PIRActivityReviewUncheckedCreateWithoutAip_activityInput> | PIRActivityReviewCreateWithoutAip_activityInput[] | PIRActivityReviewUncheckedCreateWithoutAip_activityInput[]
    connectOrCreate?: PIRActivityReviewCreateOrConnectWithoutAip_activityInput | PIRActivityReviewCreateOrConnectWithoutAip_activityInput[]
    upsert?: PIRActivityReviewUpsertWithWhereUniqueWithoutAip_activityInput | PIRActivityReviewUpsertWithWhereUniqueWithoutAip_activityInput[]
    createMany?: PIRActivityReviewCreateManyAip_activityInputEnvelope
    set?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    disconnect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    delete?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    connect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    update?: PIRActivityReviewUpdateWithWhereUniqueWithoutAip_activityInput | PIRActivityReviewUpdateWithWhereUniqueWithoutAip_activityInput[]
    updateMany?: PIRActivityReviewUpdateManyWithWhereWithoutAip_activityInput | PIRActivityReviewUpdateManyWithWhereWithoutAip_activityInput[]
    deleteMany?: PIRActivityReviewScalarWhereInput | PIRActivityReviewScalarWhereInput[]
  }

  export type PIRActivityReviewUncheckedUpdateManyWithoutAip_activityNestedInput = {
    create?: XOR<PIRActivityReviewCreateWithoutAip_activityInput, PIRActivityReviewUncheckedCreateWithoutAip_activityInput> | PIRActivityReviewCreateWithoutAip_activityInput[] | PIRActivityReviewUncheckedCreateWithoutAip_activityInput[]
    connectOrCreate?: PIRActivityReviewCreateOrConnectWithoutAip_activityInput | PIRActivityReviewCreateOrConnectWithoutAip_activityInput[]
    upsert?: PIRActivityReviewUpsertWithWhereUniqueWithoutAip_activityInput | PIRActivityReviewUpsertWithWhereUniqueWithoutAip_activityInput[]
    createMany?: PIRActivityReviewCreateManyAip_activityInputEnvelope
    set?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    disconnect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    delete?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    connect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    update?: PIRActivityReviewUpdateWithWhereUniqueWithoutAip_activityInput | PIRActivityReviewUpdateWithWhereUniqueWithoutAip_activityInput[]
    updateMany?: PIRActivityReviewUpdateManyWithWhereWithoutAip_activityInput | PIRActivityReviewUpdateManyWithWhereWithoutAip_activityInput[]
    deleteMany?: PIRActivityReviewScalarWhereInput | PIRActivityReviewScalarWhereInput[]
  }

  export type AIPCreateNestedOneWithoutPirsInput = {
    create?: XOR<AIPCreateWithoutPirsInput, AIPUncheckedCreateWithoutPirsInput>
    connectOrCreate?: AIPCreateOrConnectWithoutPirsInput
    connect?: AIPWhereUniqueInput
  }

  export type PIRActivityReviewCreateNestedManyWithoutPirInput = {
    create?: XOR<PIRActivityReviewCreateWithoutPirInput, PIRActivityReviewUncheckedCreateWithoutPirInput> | PIRActivityReviewCreateWithoutPirInput[] | PIRActivityReviewUncheckedCreateWithoutPirInput[]
    connectOrCreate?: PIRActivityReviewCreateOrConnectWithoutPirInput | PIRActivityReviewCreateOrConnectWithoutPirInput[]
    createMany?: PIRActivityReviewCreateManyPirInputEnvelope
    connect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
  }

  export type PIRFactorCreateNestedManyWithoutPirInput = {
    create?: XOR<PIRFactorCreateWithoutPirInput, PIRFactorUncheckedCreateWithoutPirInput> | PIRFactorCreateWithoutPirInput[] | PIRFactorUncheckedCreateWithoutPirInput[]
    connectOrCreate?: PIRFactorCreateOrConnectWithoutPirInput | PIRFactorCreateOrConnectWithoutPirInput[]
    createMany?: PIRFactorCreateManyPirInputEnvelope
    connect?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
  }

  export type PIRActivityReviewUncheckedCreateNestedManyWithoutPirInput = {
    create?: XOR<PIRActivityReviewCreateWithoutPirInput, PIRActivityReviewUncheckedCreateWithoutPirInput> | PIRActivityReviewCreateWithoutPirInput[] | PIRActivityReviewUncheckedCreateWithoutPirInput[]
    connectOrCreate?: PIRActivityReviewCreateOrConnectWithoutPirInput | PIRActivityReviewCreateOrConnectWithoutPirInput[]
    createMany?: PIRActivityReviewCreateManyPirInputEnvelope
    connect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
  }

  export type PIRFactorUncheckedCreateNestedManyWithoutPirInput = {
    create?: XOR<PIRFactorCreateWithoutPirInput, PIRFactorUncheckedCreateWithoutPirInput> | PIRFactorCreateWithoutPirInput[] | PIRFactorUncheckedCreateWithoutPirInput[]
    connectOrCreate?: PIRFactorCreateOrConnectWithoutPirInput | PIRFactorCreateOrConnectWithoutPirInput[]
    createMany?: PIRFactorCreateManyPirInputEnvelope
    connect?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
  }

  export type AIPUpdateOneRequiredWithoutPirsNestedInput = {
    create?: XOR<AIPCreateWithoutPirsInput, AIPUncheckedCreateWithoutPirsInput>
    connectOrCreate?: AIPCreateOrConnectWithoutPirsInput
    upsert?: AIPUpsertWithoutPirsInput
    connect?: AIPWhereUniqueInput
    update?: XOR<XOR<AIPUpdateToOneWithWhereWithoutPirsInput, AIPUpdateWithoutPirsInput>, AIPUncheckedUpdateWithoutPirsInput>
  }

  export type PIRActivityReviewUpdateManyWithoutPirNestedInput = {
    create?: XOR<PIRActivityReviewCreateWithoutPirInput, PIRActivityReviewUncheckedCreateWithoutPirInput> | PIRActivityReviewCreateWithoutPirInput[] | PIRActivityReviewUncheckedCreateWithoutPirInput[]
    connectOrCreate?: PIRActivityReviewCreateOrConnectWithoutPirInput | PIRActivityReviewCreateOrConnectWithoutPirInput[]
    upsert?: PIRActivityReviewUpsertWithWhereUniqueWithoutPirInput | PIRActivityReviewUpsertWithWhereUniqueWithoutPirInput[]
    createMany?: PIRActivityReviewCreateManyPirInputEnvelope
    set?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    disconnect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    delete?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    connect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    update?: PIRActivityReviewUpdateWithWhereUniqueWithoutPirInput | PIRActivityReviewUpdateWithWhereUniqueWithoutPirInput[]
    updateMany?: PIRActivityReviewUpdateManyWithWhereWithoutPirInput | PIRActivityReviewUpdateManyWithWhereWithoutPirInput[]
    deleteMany?: PIRActivityReviewScalarWhereInput | PIRActivityReviewScalarWhereInput[]
  }

  export type PIRFactorUpdateManyWithoutPirNestedInput = {
    create?: XOR<PIRFactorCreateWithoutPirInput, PIRFactorUncheckedCreateWithoutPirInput> | PIRFactorCreateWithoutPirInput[] | PIRFactorUncheckedCreateWithoutPirInput[]
    connectOrCreate?: PIRFactorCreateOrConnectWithoutPirInput | PIRFactorCreateOrConnectWithoutPirInput[]
    upsert?: PIRFactorUpsertWithWhereUniqueWithoutPirInput | PIRFactorUpsertWithWhereUniqueWithoutPirInput[]
    createMany?: PIRFactorCreateManyPirInputEnvelope
    set?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
    disconnect?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
    delete?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
    connect?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
    update?: PIRFactorUpdateWithWhereUniqueWithoutPirInput | PIRFactorUpdateWithWhereUniqueWithoutPirInput[]
    updateMany?: PIRFactorUpdateManyWithWhereWithoutPirInput | PIRFactorUpdateManyWithWhereWithoutPirInput[]
    deleteMany?: PIRFactorScalarWhereInput | PIRFactorScalarWhereInput[]
  }

  export type PIRActivityReviewUncheckedUpdateManyWithoutPirNestedInput = {
    create?: XOR<PIRActivityReviewCreateWithoutPirInput, PIRActivityReviewUncheckedCreateWithoutPirInput> | PIRActivityReviewCreateWithoutPirInput[] | PIRActivityReviewUncheckedCreateWithoutPirInput[]
    connectOrCreate?: PIRActivityReviewCreateOrConnectWithoutPirInput | PIRActivityReviewCreateOrConnectWithoutPirInput[]
    upsert?: PIRActivityReviewUpsertWithWhereUniqueWithoutPirInput | PIRActivityReviewUpsertWithWhereUniqueWithoutPirInput[]
    createMany?: PIRActivityReviewCreateManyPirInputEnvelope
    set?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    disconnect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    delete?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    connect?: PIRActivityReviewWhereUniqueInput | PIRActivityReviewWhereUniqueInput[]
    update?: PIRActivityReviewUpdateWithWhereUniqueWithoutPirInput | PIRActivityReviewUpdateWithWhereUniqueWithoutPirInput[]
    updateMany?: PIRActivityReviewUpdateManyWithWhereWithoutPirInput | PIRActivityReviewUpdateManyWithWhereWithoutPirInput[]
    deleteMany?: PIRActivityReviewScalarWhereInput | PIRActivityReviewScalarWhereInput[]
  }

  export type PIRFactorUncheckedUpdateManyWithoutPirNestedInput = {
    create?: XOR<PIRFactorCreateWithoutPirInput, PIRFactorUncheckedCreateWithoutPirInput> | PIRFactorCreateWithoutPirInput[] | PIRFactorUncheckedCreateWithoutPirInput[]
    connectOrCreate?: PIRFactorCreateOrConnectWithoutPirInput | PIRFactorCreateOrConnectWithoutPirInput[]
    upsert?: PIRFactorUpsertWithWhereUniqueWithoutPirInput | PIRFactorUpsertWithWhereUniqueWithoutPirInput[]
    createMany?: PIRFactorCreateManyPirInputEnvelope
    set?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
    disconnect?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
    delete?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
    connect?: PIRFactorWhereUniqueInput | PIRFactorWhereUniqueInput[]
    update?: PIRFactorUpdateWithWhereUniqueWithoutPirInput | PIRFactorUpdateWithWhereUniqueWithoutPirInput[]
    updateMany?: PIRFactorUpdateManyWithWhereWithoutPirInput | PIRFactorUpdateManyWithWhereWithoutPirInput[]
    deleteMany?: PIRFactorScalarWhereInput | PIRFactorScalarWhereInput[]
  }

  export type PIRCreateNestedOneWithoutActivity_reviewsInput = {
    create?: XOR<PIRCreateWithoutActivity_reviewsInput, PIRUncheckedCreateWithoutActivity_reviewsInput>
    connectOrCreate?: PIRCreateOrConnectWithoutActivity_reviewsInput
    connect?: PIRWhereUniqueInput
  }

  export type AIPActivityCreateNestedOneWithoutPir_reviewsInput = {
    create?: XOR<AIPActivityCreateWithoutPir_reviewsInput, AIPActivityUncheckedCreateWithoutPir_reviewsInput>
    connectOrCreate?: AIPActivityCreateOrConnectWithoutPir_reviewsInput
    connect?: AIPActivityWhereUniqueInput
  }

  export type PIRUpdateOneRequiredWithoutActivity_reviewsNestedInput = {
    create?: XOR<PIRCreateWithoutActivity_reviewsInput, PIRUncheckedCreateWithoutActivity_reviewsInput>
    connectOrCreate?: PIRCreateOrConnectWithoutActivity_reviewsInput
    upsert?: PIRUpsertWithoutActivity_reviewsInput
    connect?: PIRWhereUniqueInput
    update?: XOR<XOR<PIRUpdateToOneWithWhereWithoutActivity_reviewsInput, PIRUpdateWithoutActivity_reviewsInput>, PIRUncheckedUpdateWithoutActivity_reviewsInput>
  }

  export type AIPActivityUpdateOneRequiredWithoutPir_reviewsNestedInput = {
    create?: XOR<AIPActivityCreateWithoutPir_reviewsInput, AIPActivityUncheckedCreateWithoutPir_reviewsInput>
    connectOrCreate?: AIPActivityCreateOrConnectWithoutPir_reviewsInput
    upsert?: AIPActivityUpsertWithoutPir_reviewsInput
    connect?: AIPActivityWhereUniqueInput
    update?: XOR<XOR<AIPActivityUpdateToOneWithWhereWithoutPir_reviewsInput, AIPActivityUpdateWithoutPir_reviewsInput>, AIPActivityUncheckedUpdateWithoutPir_reviewsInput>
  }

  export type PIRCreateNestedOneWithoutFactorsInput = {
    create?: XOR<PIRCreateWithoutFactorsInput, PIRUncheckedCreateWithoutFactorsInput>
    connectOrCreate?: PIRCreateOrConnectWithoutFactorsInput
    connect?: PIRWhereUniqueInput
  }

  export type PIRUpdateOneRequiredWithoutFactorsNestedInput = {
    create?: XOR<PIRCreateWithoutFactorsInput, PIRUncheckedCreateWithoutFactorsInput>
    connectOrCreate?: PIRCreateOrConnectWithoutFactorsInput
    upsert?: PIRUpsertWithoutFactorsInput
    connect?: PIRWhereUniqueInput
    update?: XOR<XOR<PIRUpdateToOneWithWhereWithoutFactorsInput, PIRUpdateWithoutFactorsInput>, PIRUncheckedUpdateWithoutFactorsInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type SchoolCreateWithoutClusterInput = {
    name: string
    level: string
    aips?: AIPCreateNestedManyWithoutSchoolInput
    user?: UserCreateNestedOneWithoutSchoolInput
    restricted_programs?: ProgramCreateNestedManyWithoutRestricted_schoolsInput
  }

  export type SchoolUncheckedCreateWithoutClusterInput = {
    id?: number
    name: string
    level: string
    aips?: AIPUncheckedCreateNestedManyWithoutSchoolInput
    user?: UserUncheckedCreateNestedOneWithoutSchoolInput
    restricted_programs?: ProgramUncheckedCreateNestedManyWithoutRestricted_schoolsInput
  }

  export type SchoolCreateOrConnectWithoutClusterInput = {
    where: SchoolWhereUniqueInput
    create: XOR<SchoolCreateWithoutClusterInput, SchoolUncheckedCreateWithoutClusterInput>
  }

  export type SchoolCreateManyClusterInputEnvelope = {
    data: SchoolCreateManyClusterInput | SchoolCreateManyClusterInput[]
    skipDuplicates?: boolean
  }

  export type SchoolUpsertWithWhereUniqueWithoutClusterInput = {
    where: SchoolWhereUniqueInput
    update: XOR<SchoolUpdateWithoutClusterInput, SchoolUncheckedUpdateWithoutClusterInput>
    create: XOR<SchoolCreateWithoutClusterInput, SchoolUncheckedCreateWithoutClusterInput>
  }

  export type SchoolUpdateWithWhereUniqueWithoutClusterInput = {
    where: SchoolWhereUniqueInput
    data: XOR<SchoolUpdateWithoutClusterInput, SchoolUncheckedUpdateWithoutClusterInput>
  }

  export type SchoolUpdateManyWithWhereWithoutClusterInput = {
    where: SchoolScalarWhereInput
    data: XOR<SchoolUpdateManyMutationInput, SchoolUncheckedUpdateManyWithoutClusterInput>
  }

  export type SchoolScalarWhereInput = {
    AND?: SchoolScalarWhereInput | SchoolScalarWhereInput[]
    OR?: SchoolScalarWhereInput[]
    NOT?: SchoolScalarWhereInput | SchoolScalarWhereInput[]
    id?: IntFilter<"School"> | number
    name?: StringFilter<"School"> | string
    level?: StringFilter<"School"> | string
    cluster_id?: IntFilter<"School"> | number
  }

  export type ClusterCreateWithoutSchoolsInput = {
    cluster_number: number
    name: string
  }

  export type ClusterUncheckedCreateWithoutSchoolsInput = {
    id?: number
    cluster_number: number
    name: string
  }

  export type ClusterCreateOrConnectWithoutSchoolsInput = {
    where: ClusterWhereUniqueInput
    create: XOR<ClusterCreateWithoutSchoolsInput, ClusterUncheckedCreateWithoutSchoolsInput>
  }

  export type AIPCreateWithoutSchoolInput = {
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    program: ProgramCreateNestedOneWithoutAipsInput
    activities?: AIPActivityCreateNestedManyWithoutAipInput
    pirs?: PIRCreateNestedManyWithoutAipInput
  }

  export type AIPUncheckedCreateWithoutSchoolInput = {
    id?: number
    program_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    activities?: AIPActivityUncheckedCreateNestedManyWithoutAipInput
    pirs?: PIRUncheckedCreateNestedManyWithoutAipInput
  }

  export type AIPCreateOrConnectWithoutSchoolInput = {
    where: AIPWhereUniqueInput
    create: XOR<AIPCreateWithoutSchoolInput, AIPUncheckedCreateWithoutSchoolInput>
  }

  export type AIPCreateManySchoolInputEnvelope = {
    data: AIPCreateManySchoolInput | AIPCreateManySchoolInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutSchoolInput = {
    email: string
    password: string
    role: string
    name?: string | null
    created_at?: Date | string
    programs?: ProgramCreateNestedManyWithoutPersonnelInput
  }

  export type UserUncheckedCreateWithoutSchoolInput = {
    id?: number
    email: string
    password: string
    role: string
    name?: string | null
    created_at?: Date | string
    programs?: ProgramUncheckedCreateNestedManyWithoutPersonnelInput
  }

  export type UserCreateOrConnectWithoutSchoolInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSchoolInput, UserUncheckedCreateWithoutSchoolInput>
  }

  export type ProgramCreateWithoutRestricted_schoolsInput = {
    title: string
    school_level_requirement: string
    aips?: AIPCreateNestedManyWithoutProgramInput
    personnel?: UserCreateNestedManyWithoutProgramsInput
  }

  export type ProgramUncheckedCreateWithoutRestricted_schoolsInput = {
    id?: number
    title: string
    school_level_requirement: string
    aips?: AIPUncheckedCreateNestedManyWithoutProgramInput
    personnel?: UserUncheckedCreateNestedManyWithoutProgramsInput
  }

  export type ProgramCreateOrConnectWithoutRestricted_schoolsInput = {
    where: ProgramWhereUniqueInput
    create: XOR<ProgramCreateWithoutRestricted_schoolsInput, ProgramUncheckedCreateWithoutRestricted_schoolsInput>
  }

  export type ClusterUpsertWithoutSchoolsInput = {
    update: XOR<ClusterUpdateWithoutSchoolsInput, ClusterUncheckedUpdateWithoutSchoolsInput>
    create: XOR<ClusterCreateWithoutSchoolsInput, ClusterUncheckedCreateWithoutSchoolsInput>
    where?: ClusterWhereInput
  }

  export type ClusterUpdateToOneWithWhereWithoutSchoolsInput = {
    where?: ClusterWhereInput
    data: XOR<ClusterUpdateWithoutSchoolsInput, ClusterUncheckedUpdateWithoutSchoolsInput>
  }

  export type ClusterUpdateWithoutSchoolsInput = {
    cluster_number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
  }

  export type ClusterUncheckedUpdateWithoutSchoolsInput = {
    id?: IntFieldUpdateOperationsInput | number
    cluster_number?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
  }

  export type AIPUpsertWithWhereUniqueWithoutSchoolInput = {
    where: AIPWhereUniqueInput
    update: XOR<AIPUpdateWithoutSchoolInput, AIPUncheckedUpdateWithoutSchoolInput>
    create: XOR<AIPCreateWithoutSchoolInput, AIPUncheckedCreateWithoutSchoolInput>
  }

  export type AIPUpdateWithWhereUniqueWithoutSchoolInput = {
    where: AIPWhereUniqueInput
    data: XOR<AIPUpdateWithoutSchoolInput, AIPUncheckedUpdateWithoutSchoolInput>
  }

  export type AIPUpdateManyWithWhereWithoutSchoolInput = {
    where: AIPScalarWhereInput
    data: XOR<AIPUpdateManyMutationInput, AIPUncheckedUpdateManyWithoutSchoolInput>
  }

  export type AIPScalarWhereInput = {
    AND?: AIPScalarWhereInput | AIPScalarWhereInput[]
    OR?: AIPScalarWhereInput[]
    NOT?: AIPScalarWhereInput | AIPScalarWhereInput[]
    id?: IntFilter<"AIP"> | number
    school_id?: IntFilter<"AIP"> | number
    program_id?: IntFilter<"AIP"> | number
    year?: IntFilter<"AIP"> | number
    pillar?: StringFilter<"AIP"> | string
    sip_title?: StringFilter<"AIP"> | string
    project_coordinator?: StringFilter<"AIP"> | string
    objectives?: StringFilter<"AIP"> | string
    indicators?: StringFilter<"AIP"> | string
    annual_target?: StringFilter<"AIP"> | string
    created_at?: DateTimeFilter<"AIP"> | Date | string
  }

  export type UserUpsertWithoutSchoolInput = {
    update: XOR<UserUpdateWithoutSchoolInput, UserUncheckedUpdateWithoutSchoolInput>
    create: XOR<UserCreateWithoutSchoolInput, UserUncheckedCreateWithoutSchoolInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSchoolInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSchoolInput, UserUncheckedUpdateWithoutSchoolInput>
  }

  export type UserUpdateWithoutSchoolInput = {
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    programs?: ProgramUpdateManyWithoutPersonnelNestedInput
  }

  export type UserUncheckedUpdateWithoutSchoolInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    programs?: ProgramUncheckedUpdateManyWithoutPersonnelNestedInput
  }

  export type ProgramUpsertWithWhereUniqueWithoutRestricted_schoolsInput = {
    where: ProgramWhereUniqueInput
    update: XOR<ProgramUpdateWithoutRestricted_schoolsInput, ProgramUncheckedUpdateWithoutRestricted_schoolsInput>
    create: XOR<ProgramCreateWithoutRestricted_schoolsInput, ProgramUncheckedCreateWithoutRestricted_schoolsInput>
  }

  export type ProgramUpdateWithWhereUniqueWithoutRestricted_schoolsInput = {
    where: ProgramWhereUniqueInput
    data: XOR<ProgramUpdateWithoutRestricted_schoolsInput, ProgramUncheckedUpdateWithoutRestricted_schoolsInput>
  }

  export type ProgramUpdateManyWithWhereWithoutRestricted_schoolsInput = {
    where: ProgramScalarWhereInput
    data: XOR<ProgramUpdateManyMutationInput, ProgramUncheckedUpdateManyWithoutRestricted_schoolsInput>
  }

  export type ProgramScalarWhereInput = {
    AND?: ProgramScalarWhereInput | ProgramScalarWhereInput[]
    OR?: ProgramScalarWhereInput[]
    NOT?: ProgramScalarWhereInput | ProgramScalarWhereInput[]
    id?: IntFilter<"Program"> | number
    title?: StringFilter<"Program"> | string
    school_level_requirement?: StringFilter<"Program"> | string
  }

  export type AIPCreateWithoutProgramInput = {
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    school: SchoolCreateNestedOneWithoutAipsInput
    activities?: AIPActivityCreateNestedManyWithoutAipInput
    pirs?: PIRCreateNestedManyWithoutAipInput
  }

  export type AIPUncheckedCreateWithoutProgramInput = {
    id?: number
    school_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    activities?: AIPActivityUncheckedCreateNestedManyWithoutAipInput
    pirs?: PIRUncheckedCreateNestedManyWithoutAipInput
  }

  export type AIPCreateOrConnectWithoutProgramInput = {
    where: AIPWhereUniqueInput
    create: XOR<AIPCreateWithoutProgramInput, AIPUncheckedCreateWithoutProgramInput>
  }

  export type AIPCreateManyProgramInputEnvelope = {
    data: AIPCreateManyProgramInput | AIPCreateManyProgramInput[]
    skipDuplicates?: boolean
  }

  export type UserCreateWithoutProgramsInput = {
    email: string
    password: string
    role: string
    name?: string | null
    created_at?: Date | string
    school?: SchoolCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutProgramsInput = {
    id?: number
    email: string
    password: string
    role: string
    name?: string | null
    school_id?: number | null
    created_at?: Date | string
  }

  export type UserCreateOrConnectWithoutProgramsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutProgramsInput, UserUncheckedCreateWithoutProgramsInput>
  }

  export type SchoolCreateWithoutRestricted_programsInput = {
    name: string
    level: string
    cluster: ClusterCreateNestedOneWithoutSchoolsInput
    aips?: AIPCreateNestedManyWithoutSchoolInput
    user?: UserCreateNestedOneWithoutSchoolInput
  }

  export type SchoolUncheckedCreateWithoutRestricted_programsInput = {
    id?: number
    name: string
    level: string
    cluster_id: number
    aips?: AIPUncheckedCreateNestedManyWithoutSchoolInput
    user?: UserUncheckedCreateNestedOneWithoutSchoolInput
  }

  export type SchoolCreateOrConnectWithoutRestricted_programsInput = {
    where: SchoolWhereUniqueInput
    create: XOR<SchoolCreateWithoutRestricted_programsInput, SchoolUncheckedCreateWithoutRestricted_programsInput>
  }

  export type AIPUpsertWithWhereUniqueWithoutProgramInput = {
    where: AIPWhereUniqueInput
    update: XOR<AIPUpdateWithoutProgramInput, AIPUncheckedUpdateWithoutProgramInput>
    create: XOR<AIPCreateWithoutProgramInput, AIPUncheckedCreateWithoutProgramInput>
  }

  export type AIPUpdateWithWhereUniqueWithoutProgramInput = {
    where: AIPWhereUniqueInput
    data: XOR<AIPUpdateWithoutProgramInput, AIPUncheckedUpdateWithoutProgramInput>
  }

  export type AIPUpdateManyWithWhereWithoutProgramInput = {
    where: AIPScalarWhereInput
    data: XOR<AIPUpdateManyMutationInput, AIPUncheckedUpdateManyWithoutProgramInput>
  }

  export type UserUpsertWithWhereUniqueWithoutProgramsInput = {
    where: UserWhereUniqueInput
    update: XOR<UserUpdateWithoutProgramsInput, UserUncheckedUpdateWithoutProgramsInput>
    create: XOR<UserCreateWithoutProgramsInput, UserUncheckedCreateWithoutProgramsInput>
  }

  export type UserUpdateWithWhereUniqueWithoutProgramsInput = {
    where: UserWhereUniqueInput
    data: XOR<UserUpdateWithoutProgramsInput, UserUncheckedUpdateWithoutProgramsInput>
  }

  export type UserUpdateManyWithWhereWithoutProgramsInput = {
    where: UserScalarWhereInput
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyWithoutProgramsInput>
  }

  export type UserScalarWhereInput = {
    AND?: UserScalarWhereInput | UserScalarWhereInput[]
    OR?: UserScalarWhereInput[]
    NOT?: UserScalarWhereInput | UserScalarWhereInput[]
    id?: IntFilter<"User"> | number
    email?: StringFilter<"User"> | string
    password?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    name?: StringNullableFilter<"User"> | string | null
    school_id?: IntNullableFilter<"User"> | number | null
    created_at?: DateTimeFilter<"User"> | Date | string
  }

  export type SchoolUpsertWithWhereUniqueWithoutRestricted_programsInput = {
    where: SchoolWhereUniqueInput
    update: XOR<SchoolUpdateWithoutRestricted_programsInput, SchoolUncheckedUpdateWithoutRestricted_programsInput>
    create: XOR<SchoolCreateWithoutRestricted_programsInput, SchoolUncheckedCreateWithoutRestricted_programsInput>
  }

  export type SchoolUpdateWithWhereUniqueWithoutRestricted_programsInput = {
    where: SchoolWhereUniqueInput
    data: XOR<SchoolUpdateWithoutRestricted_programsInput, SchoolUncheckedUpdateWithoutRestricted_programsInput>
  }

  export type SchoolUpdateManyWithWhereWithoutRestricted_programsInput = {
    where: SchoolScalarWhereInput
    data: XOR<SchoolUpdateManyMutationInput, SchoolUncheckedUpdateManyWithoutRestricted_programsInput>
  }

  export type SchoolCreateWithoutUserInput = {
    name: string
    level: string
    cluster: ClusterCreateNestedOneWithoutSchoolsInput
    aips?: AIPCreateNestedManyWithoutSchoolInput
    restricted_programs?: ProgramCreateNestedManyWithoutRestricted_schoolsInput
  }

  export type SchoolUncheckedCreateWithoutUserInput = {
    id?: number
    name: string
    level: string
    cluster_id: number
    aips?: AIPUncheckedCreateNestedManyWithoutSchoolInput
    restricted_programs?: ProgramUncheckedCreateNestedManyWithoutRestricted_schoolsInput
  }

  export type SchoolCreateOrConnectWithoutUserInput = {
    where: SchoolWhereUniqueInput
    create: XOR<SchoolCreateWithoutUserInput, SchoolUncheckedCreateWithoutUserInput>
  }

  export type ProgramCreateWithoutPersonnelInput = {
    title: string
    school_level_requirement: string
    aips?: AIPCreateNestedManyWithoutProgramInput
    restricted_schools?: SchoolCreateNestedManyWithoutRestricted_programsInput
  }

  export type ProgramUncheckedCreateWithoutPersonnelInput = {
    id?: number
    title: string
    school_level_requirement: string
    aips?: AIPUncheckedCreateNestedManyWithoutProgramInput
    restricted_schools?: SchoolUncheckedCreateNestedManyWithoutRestricted_programsInput
  }

  export type ProgramCreateOrConnectWithoutPersonnelInput = {
    where: ProgramWhereUniqueInput
    create: XOR<ProgramCreateWithoutPersonnelInput, ProgramUncheckedCreateWithoutPersonnelInput>
  }

  export type SchoolUpsertWithoutUserInput = {
    update: XOR<SchoolUpdateWithoutUserInput, SchoolUncheckedUpdateWithoutUserInput>
    create: XOR<SchoolCreateWithoutUserInput, SchoolUncheckedCreateWithoutUserInput>
    where?: SchoolWhereInput
  }

  export type SchoolUpdateToOneWithWhereWithoutUserInput = {
    where?: SchoolWhereInput
    data: XOR<SchoolUpdateWithoutUserInput, SchoolUncheckedUpdateWithoutUserInput>
  }

  export type SchoolUpdateWithoutUserInput = {
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster?: ClusterUpdateOneRequiredWithoutSchoolsNestedInput
    aips?: AIPUpdateManyWithoutSchoolNestedInput
    restricted_programs?: ProgramUpdateManyWithoutRestricted_schoolsNestedInput
  }

  export type SchoolUncheckedUpdateWithoutUserInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster_id?: IntFieldUpdateOperationsInput | number
    aips?: AIPUncheckedUpdateManyWithoutSchoolNestedInput
    restricted_programs?: ProgramUncheckedUpdateManyWithoutRestricted_schoolsNestedInput
  }

  export type ProgramUpsertWithWhereUniqueWithoutPersonnelInput = {
    where: ProgramWhereUniqueInput
    update: XOR<ProgramUpdateWithoutPersonnelInput, ProgramUncheckedUpdateWithoutPersonnelInput>
    create: XOR<ProgramCreateWithoutPersonnelInput, ProgramUncheckedCreateWithoutPersonnelInput>
  }

  export type ProgramUpdateWithWhereUniqueWithoutPersonnelInput = {
    where: ProgramWhereUniqueInput
    data: XOR<ProgramUpdateWithoutPersonnelInput, ProgramUncheckedUpdateWithoutPersonnelInput>
  }

  export type ProgramUpdateManyWithWhereWithoutPersonnelInput = {
    where: ProgramScalarWhereInput
    data: XOR<ProgramUpdateManyMutationInput, ProgramUncheckedUpdateManyWithoutPersonnelInput>
  }

  export type SchoolCreateWithoutAipsInput = {
    name: string
    level: string
    cluster: ClusterCreateNestedOneWithoutSchoolsInput
    user?: UserCreateNestedOneWithoutSchoolInput
    restricted_programs?: ProgramCreateNestedManyWithoutRestricted_schoolsInput
  }

  export type SchoolUncheckedCreateWithoutAipsInput = {
    id?: number
    name: string
    level: string
    cluster_id: number
    user?: UserUncheckedCreateNestedOneWithoutSchoolInput
    restricted_programs?: ProgramUncheckedCreateNestedManyWithoutRestricted_schoolsInput
  }

  export type SchoolCreateOrConnectWithoutAipsInput = {
    where: SchoolWhereUniqueInput
    create: XOR<SchoolCreateWithoutAipsInput, SchoolUncheckedCreateWithoutAipsInput>
  }

  export type ProgramCreateWithoutAipsInput = {
    title: string
    school_level_requirement: string
    personnel?: UserCreateNestedManyWithoutProgramsInput
    restricted_schools?: SchoolCreateNestedManyWithoutRestricted_programsInput
  }

  export type ProgramUncheckedCreateWithoutAipsInput = {
    id?: number
    title: string
    school_level_requirement: string
    personnel?: UserUncheckedCreateNestedManyWithoutProgramsInput
    restricted_schools?: SchoolUncheckedCreateNestedManyWithoutRestricted_programsInput
  }

  export type ProgramCreateOrConnectWithoutAipsInput = {
    where: ProgramWhereUniqueInput
    create: XOR<ProgramCreateWithoutAipsInput, ProgramUncheckedCreateWithoutAipsInput>
  }

  export type AIPActivityCreateWithoutAipInput = {
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount?: Decimal | DecimalJsLike | number | string
    budget_source: string
    pir_reviews?: PIRActivityReviewCreateNestedManyWithoutAip_activityInput
  }

  export type AIPActivityUncheckedCreateWithoutAipInput = {
    id?: number
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount?: Decimal | DecimalJsLike | number | string
    budget_source: string
    pir_reviews?: PIRActivityReviewUncheckedCreateNestedManyWithoutAip_activityInput
  }

  export type AIPActivityCreateOrConnectWithoutAipInput = {
    where: AIPActivityWhereUniqueInput
    create: XOR<AIPActivityCreateWithoutAipInput, AIPActivityUncheckedCreateWithoutAipInput>
  }

  export type AIPActivityCreateManyAipInputEnvelope = {
    data: AIPActivityCreateManyAipInput | AIPActivityCreateManyAipInput[]
    skipDuplicates?: boolean
  }

  export type PIRCreateWithoutAipInput = {
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
    activity_reviews?: PIRActivityReviewCreateNestedManyWithoutPirInput
    factors?: PIRFactorCreateNestedManyWithoutPirInput
  }

  export type PIRUncheckedCreateWithoutAipInput = {
    id?: number
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
    activity_reviews?: PIRActivityReviewUncheckedCreateNestedManyWithoutPirInput
    factors?: PIRFactorUncheckedCreateNestedManyWithoutPirInput
  }

  export type PIRCreateOrConnectWithoutAipInput = {
    where: PIRWhereUniqueInput
    create: XOR<PIRCreateWithoutAipInput, PIRUncheckedCreateWithoutAipInput>
  }

  export type PIRCreateManyAipInputEnvelope = {
    data: PIRCreateManyAipInput | PIRCreateManyAipInput[]
    skipDuplicates?: boolean
  }

  export type SchoolUpsertWithoutAipsInput = {
    update: XOR<SchoolUpdateWithoutAipsInput, SchoolUncheckedUpdateWithoutAipsInput>
    create: XOR<SchoolCreateWithoutAipsInput, SchoolUncheckedCreateWithoutAipsInput>
    where?: SchoolWhereInput
  }

  export type SchoolUpdateToOneWithWhereWithoutAipsInput = {
    where?: SchoolWhereInput
    data: XOR<SchoolUpdateWithoutAipsInput, SchoolUncheckedUpdateWithoutAipsInput>
  }

  export type SchoolUpdateWithoutAipsInput = {
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster?: ClusterUpdateOneRequiredWithoutSchoolsNestedInput
    user?: UserUpdateOneWithoutSchoolNestedInput
    restricted_programs?: ProgramUpdateManyWithoutRestricted_schoolsNestedInput
  }

  export type SchoolUncheckedUpdateWithoutAipsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster_id?: IntFieldUpdateOperationsInput | number
    user?: UserUncheckedUpdateOneWithoutSchoolNestedInput
    restricted_programs?: ProgramUncheckedUpdateManyWithoutRestricted_schoolsNestedInput
  }

  export type ProgramUpsertWithoutAipsInput = {
    update: XOR<ProgramUpdateWithoutAipsInput, ProgramUncheckedUpdateWithoutAipsInput>
    create: XOR<ProgramCreateWithoutAipsInput, ProgramUncheckedCreateWithoutAipsInput>
    where?: ProgramWhereInput
  }

  export type ProgramUpdateToOneWithWhereWithoutAipsInput = {
    where?: ProgramWhereInput
    data: XOR<ProgramUpdateWithoutAipsInput, ProgramUncheckedUpdateWithoutAipsInput>
  }

  export type ProgramUpdateWithoutAipsInput = {
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
    personnel?: UserUpdateManyWithoutProgramsNestedInput
    restricted_schools?: SchoolUpdateManyWithoutRestricted_programsNestedInput
  }

  export type ProgramUncheckedUpdateWithoutAipsInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
    personnel?: UserUncheckedUpdateManyWithoutProgramsNestedInput
    restricted_schools?: SchoolUncheckedUpdateManyWithoutRestricted_programsNestedInput
  }

  export type AIPActivityUpsertWithWhereUniqueWithoutAipInput = {
    where: AIPActivityWhereUniqueInput
    update: XOR<AIPActivityUpdateWithoutAipInput, AIPActivityUncheckedUpdateWithoutAipInput>
    create: XOR<AIPActivityCreateWithoutAipInput, AIPActivityUncheckedCreateWithoutAipInput>
  }

  export type AIPActivityUpdateWithWhereUniqueWithoutAipInput = {
    where: AIPActivityWhereUniqueInput
    data: XOR<AIPActivityUpdateWithoutAipInput, AIPActivityUncheckedUpdateWithoutAipInput>
  }

  export type AIPActivityUpdateManyWithWhereWithoutAipInput = {
    where: AIPActivityScalarWhereInput
    data: XOR<AIPActivityUpdateManyMutationInput, AIPActivityUncheckedUpdateManyWithoutAipInput>
  }

  export type AIPActivityScalarWhereInput = {
    AND?: AIPActivityScalarWhereInput | AIPActivityScalarWhereInput[]
    OR?: AIPActivityScalarWhereInput[]
    NOT?: AIPActivityScalarWhereInput | AIPActivityScalarWhereInput[]
    id?: IntFilter<"AIPActivity"> | number
    aip_id?: IntFilter<"AIPActivity"> | number
    phase?: StringFilter<"AIPActivity"> | string
    activity_name?: StringFilter<"AIPActivity"> | string
    implementation_period?: StringFilter<"AIPActivity"> | string
    persons_involved?: StringFilter<"AIPActivity"> | string
    outputs?: StringFilter<"AIPActivity"> | string
    budget_amount?: DecimalFilter<"AIPActivity"> | Decimal | DecimalJsLike | number | string
    budget_source?: StringFilter<"AIPActivity"> | string
  }

  export type PIRUpsertWithWhereUniqueWithoutAipInput = {
    where: PIRWhereUniqueInput
    update: XOR<PIRUpdateWithoutAipInput, PIRUncheckedUpdateWithoutAipInput>
    create: XOR<PIRCreateWithoutAipInput, PIRUncheckedCreateWithoutAipInput>
  }

  export type PIRUpdateWithWhereUniqueWithoutAipInput = {
    where: PIRWhereUniqueInput
    data: XOR<PIRUpdateWithoutAipInput, PIRUncheckedUpdateWithoutAipInput>
  }

  export type PIRUpdateManyWithWhereWithoutAipInput = {
    where: PIRScalarWhereInput
    data: XOR<PIRUpdateManyMutationInput, PIRUncheckedUpdateManyWithoutAipInput>
  }

  export type PIRScalarWhereInput = {
    AND?: PIRScalarWhereInput | PIRScalarWhereInput[]
    OR?: PIRScalarWhereInput[]
    NOT?: PIRScalarWhereInput | PIRScalarWhereInput[]
    id?: IntFilter<"PIR"> | number
    aip_id?: IntFilter<"PIR"> | number
    quarter?: StringFilter<"PIR"> | string
    program_owner?: StringFilter<"PIR"> | string
    total_budget?: DecimalFilter<"PIR"> | Decimal | DecimalJsLike | number | string
    fund_source?: StringFilter<"PIR"> | string
    created_at?: DateTimeFilter<"PIR"> | Date | string
  }

  export type AIPCreateWithoutActivitiesInput = {
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    school: SchoolCreateNestedOneWithoutAipsInput
    program: ProgramCreateNestedOneWithoutAipsInput
    pirs?: PIRCreateNestedManyWithoutAipInput
  }

  export type AIPUncheckedCreateWithoutActivitiesInput = {
    id?: number
    school_id: number
    program_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    pirs?: PIRUncheckedCreateNestedManyWithoutAipInput
  }

  export type AIPCreateOrConnectWithoutActivitiesInput = {
    where: AIPWhereUniqueInput
    create: XOR<AIPCreateWithoutActivitiesInput, AIPUncheckedCreateWithoutActivitiesInput>
  }

  export type PIRActivityReviewCreateWithoutAip_activityInput = {
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
    pir: PIRCreateNestedOneWithoutActivity_reviewsInput
  }

  export type PIRActivityReviewUncheckedCreateWithoutAip_activityInput = {
    id?: number
    pir_id: number
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
  }

  export type PIRActivityReviewCreateOrConnectWithoutAip_activityInput = {
    where: PIRActivityReviewWhereUniqueInput
    create: XOR<PIRActivityReviewCreateWithoutAip_activityInput, PIRActivityReviewUncheckedCreateWithoutAip_activityInput>
  }

  export type PIRActivityReviewCreateManyAip_activityInputEnvelope = {
    data: PIRActivityReviewCreateManyAip_activityInput | PIRActivityReviewCreateManyAip_activityInput[]
    skipDuplicates?: boolean
  }

  export type AIPUpsertWithoutActivitiesInput = {
    update: XOR<AIPUpdateWithoutActivitiesInput, AIPUncheckedUpdateWithoutActivitiesInput>
    create: XOR<AIPCreateWithoutActivitiesInput, AIPUncheckedCreateWithoutActivitiesInput>
    where?: AIPWhereInput
  }

  export type AIPUpdateToOneWithWhereWithoutActivitiesInput = {
    where?: AIPWhereInput
    data: XOR<AIPUpdateWithoutActivitiesInput, AIPUncheckedUpdateWithoutActivitiesInput>
  }

  export type AIPUpdateWithoutActivitiesInput = {
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    school?: SchoolUpdateOneRequiredWithoutAipsNestedInput
    program?: ProgramUpdateOneRequiredWithoutAipsNestedInput
    pirs?: PIRUpdateManyWithoutAipNestedInput
  }

  export type AIPUncheckedUpdateWithoutActivitiesInput = {
    id?: IntFieldUpdateOperationsInput | number
    school_id?: IntFieldUpdateOperationsInput | number
    program_id?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    pirs?: PIRUncheckedUpdateManyWithoutAipNestedInput
  }

  export type PIRActivityReviewUpsertWithWhereUniqueWithoutAip_activityInput = {
    where: PIRActivityReviewWhereUniqueInput
    update: XOR<PIRActivityReviewUpdateWithoutAip_activityInput, PIRActivityReviewUncheckedUpdateWithoutAip_activityInput>
    create: XOR<PIRActivityReviewCreateWithoutAip_activityInput, PIRActivityReviewUncheckedCreateWithoutAip_activityInput>
  }

  export type PIRActivityReviewUpdateWithWhereUniqueWithoutAip_activityInput = {
    where: PIRActivityReviewWhereUniqueInput
    data: XOR<PIRActivityReviewUpdateWithoutAip_activityInput, PIRActivityReviewUncheckedUpdateWithoutAip_activityInput>
  }

  export type PIRActivityReviewUpdateManyWithWhereWithoutAip_activityInput = {
    where: PIRActivityReviewScalarWhereInput
    data: XOR<PIRActivityReviewUpdateManyMutationInput, PIRActivityReviewUncheckedUpdateManyWithoutAip_activityInput>
  }

  export type PIRActivityReviewScalarWhereInput = {
    AND?: PIRActivityReviewScalarWhereInput | PIRActivityReviewScalarWhereInput[]
    OR?: PIRActivityReviewScalarWhereInput[]
    NOT?: PIRActivityReviewScalarWhereInput | PIRActivityReviewScalarWhereInput[]
    id?: IntFilter<"PIRActivityReview"> | number
    pir_id?: IntFilter<"PIRActivityReview"> | number
    aip_activity_id?: IntFilter<"PIRActivityReview"> | number
    physical_target?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFilter<"PIRActivityReview"> | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: StringNullableFilter<"PIRActivityReview"> | string | null
  }

  export type AIPCreateWithoutPirsInput = {
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    school: SchoolCreateNestedOneWithoutAipsInput
    program: ProgramCreateNestedOneWithoutAipsInput
    activities?: AIPActivityCreateNestedManyWithoutAipInput
  }

  export type AIPUncheckedCreateWithoutPirsInput = {
    id?: number
    school_id: number
    program_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
    activities?: AIPActivityUncheckedCreateNestedManyWithoutAipInput
  }

  export type AIPCreateOrConnectWithoutPirsInput = {
    where: AIPWhereUniqueInput
    create: XOR<AIPCreateWithoutPirsInput, AIPUncheckedCreateWithoutPirsInput>
  }

  export type PIRActivityReviewCreateWithoutPirInput = {
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
    aip_activity: AIPActivityCreateNestedOneWithoutPir_reviewsInput
  }

  export type PIRActivityReviewUncheckedCreateWithoutPirInput = {
    id?: number
    aip_activity_id: number
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
  }

  export type PIRActivityReviewCreateOrConnectWithoutPirInput = {
    where: PIRActivityReviewWhereUniqueInput
    create: XOR<PIRActivityReviewCreateWithoutPirInput, PIRActivityReviewUncheckedCreateWithoutPirInput>
  }

  export type PIRActivityReviewCreateManyPirInputEnvelope = {
    data: PIRActivityReviewCreateManyPirInput | PIRActivityReviewCreateManyPirInput[]
    skipDuplicates?: boolean
  }

  export type PIRFactorCreateWithoutPirInput = {
    factor_type: string
    facilitating_factors: string
    hindering_factors: string
  }

  export type PIRFactorUncheckedCreateWithoutPirInput = {
    id?: number
    factor_type: string
    facilitating_factors: string
    hindering_factors: string
  }

  export type PIRFactorCreateOrConnectWithoutPirInput = {
    where: PIRFactorWhereUniqueInput
    create: XOR<PIRFactorCreateWithoutPirInput, PIRFactorUncheckedCreateWithoutPirInput>
  }

  export type PIRFactorCreateManyPirInputEnvelope = {
    data: PIRFactorCreateManyPirInput | PIRFactorCreateManyPirInput[]
    skipDuplicates?: boolean
  }

  export type AIPUpsertWithoutPirsInput = {
    update: XOR<AIPUpdateWithoutPirsInput, AIPUncheckedUpdateWithoutPirsInput>
    create: XOR<AIPCreateWithoutPirsInput, AIPUncheckedCreateWithoutPirsInput>
    where?: AIPWhereInput
  }

  export type AIPUpdateToOneWithWhereWithoutPirsInput = {
    where?: AIPWhereInput
    data: XOR<AIPUpdateWithoutPirsInput, AIPUncheckedUpdateWithoutPirsInput>
  }

  export type AIPUpdateWithoutPirsInput = {
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    school?: SchoolUpdateOneRequiredWithoutAipsNestedInput
    program?: ProgramUpdateOneRequiredWithoutAipsNestedInput
    activities?: AIPActivityUpdateManyWithoutAipNestedInput
  }

  export type AIPUncheckedUpdateWithoutPirsInput = {
    id?: IntFieldUpdateOperationsInput | number
    school_id?: IntFieldUpdateOperationsInput | number
    program_id?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    activities?: AIPActivityUncheckedUpdateManyWithoutAipNestedInput
  }

  export type PIRActivityReviewUpsertWithWhereUniqueWithoutPirInput = {
    where: PIRActivityReviewWhereUniqueInput
    update: XOR<PIRActivityReviewUpdateWithoutPirInput, PIRActivityReviewUncheckedUpdateWithoutPirInput>
    create: XOR<PIRActivityReviewCreateWithoutPirInput, PIRActivityReviewUncheckedCreateWithoutPirInput>
  }

  export type PIRActivityReviewUpdateWithWhereUniqueWithoutPirInput = {
    where: PIRActivityReviewWhereUniqueInput
    data: XOR<PIRActivityReviewUpdateWithoutPirInput, PIRActivityReviewUncheckedUpdateWithoutPirInput>
  }

  export type PIRActivityReviewUpdateManyWithWhereWithoutPirInput = {
    where: PIRActivityReviewScalarWhereInput
    data: XOR<PIRActivityReviewUpdateManyMutationInput, PIRActivityReviewUncheckedUpdateManyWithoutPirInput>
  }

  export type PIRFactorUpsertWithWhereUniqueWithoutPirInput = {
    where: PIRFactorWhereUniqueInput
    update: XOR<PIRFactorUpdateWithoutPirInput, PIRFactorUncheckedUpdateWithoutPirInput>
    create: XOR<PIRFactorCreateWithoutPirInput, PIRFactorUncheckedCreateWithoutPirInput>
  }

  export type PIRFactorUpdateWithWhereUniqueWithoutPirInput = {
    where: PIRFactorWhereUniqueInput
    data: XOR<PIRFactorUpdateWithoutPirInput, PIRFactorUncheckedUpdateWithoutPirInput>
  }

  export type PIRFactorUpdateManyWithWhereWithoutPirInput = {
    where: PIRFactorScalarWhereInput
    data: XOR<PIRFactorUpdateManyMutationInput, PIRFactorUncheckedUpdateManyWithoutPirInput>
  }

  export type PIRFactorScalarWhereInput = {
    AND?: PIRFactorScalarWhereInput | PIRFactorScalarWhereInput[]
    OR?: PIRFactorScalarWhereInput[]
    NOT?: PIRFactorScalarWhereInput | PIRFactorScalarWhereInput[]
    id?: IntFilter<"PIRFactor"> | number
    pir_id?: IntFilter<"PIRFactor"> | number
    factor_type?: StringFilter<"PIRFactor"> | string
    facilitating_factors?: StringFilter<"PIRFactor"> | string
    hindering_factors?: StringFilter<"PIRFactor"> | string
  }

  export type PIRCreateWithoutActivity_reviewsInput = {
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
    aip: AIPCreateNestedOneWithoutPirsInput
    factors?: PIRFactorCreateNestedManyWithoutPirInput
  }

  export type PIRUncheckedCreateWithoutActivity_reviewsInput = {
    id?: number
    aip_id: number
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
    factors?: PIRFactorUncheckedCreateNestedManyWithoutPirInput
  }

  export type PIRCreateOrConnectWithoutActivity_reviewsInput = {
    where: PIRWhereUniqueInput
    create: XOR<PIRCreateWithoutActivity_reviewsInput, PIRUncheckedCreateWithoutActivity_reviewsInput>
  }

  export type AIPActivityCreateWithoutPir_reviewsInput = {
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount?: Decimal | DecimalJsLike | number | string
    budget_source: string
    aip: AIPCreateNestedOneWithoutActivitiesInput
  }

  export type AIPActivityUncheckedCreateWithoutPir_reviewsInput = {
    id?: number
    aip_id: number
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount?: Decimal | DecimalJsLike | number | string
    budget_source: string
  }

  export type AIPActivityCreateOrConnectWithoutPir_reviewsInput = {
    where: AIPActivityWhereUniqueInput
    create: XOR<AIPActivityCreateWithoutPir_reviewsInput, AIPActivityUncheckedCreateWithoutPir_reviewsInput>
  }

  export type PIRUpsertWithoutActivity_reviewsInput = {
    update: XOR<PIRUpdateWithoutActivity_reviewsInput, PIRUncheckedUpdateWithoutActivity_reviewsInput>
    create: XOR<PIRCreateWithoutActivity_reviewsInput, PIRUncheckedCreateWithoutActivity_reviewsInput>
    where?: PIRWhereInput
  }

  export type PIRUpdateToOneWithWhereWithoutActivity_reviewsInput = {
    where?: PIRWhereInput
    data: XOR<PIRUpdateWithoutActivity_reviewsInput, PIRUncheckedUpdateWithoutActivity_reviewsInput>
  }

  export type PIRUpdateWithoutActivity_reviewsInput = {
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    aip?: AIPUpdateOneRequiredWithoutPirsNestedInput
    factors?: PIRFactorUpdateManyWithoutPirNestedInput
  }

  export type PIRUncheckedUpdateWithoutActivity_reviewsInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_id?: IntFieldUpdateOperationsInput | number
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    factors?: PIRFactorUncheckedUpdateManyWithoutPirNestedInput
  }

  export type AIPActivityUpsertWithoutPir_reviewsInput = {
    update: XOR<AIPActivityUpdateWithoutPir_reviewsInput, AIPActivityUncheckedUpdateWithoutPir_reviewsInput>
    create: XOR<AIPActivityCreateWithoutPir_reviewsInput, AIPActivityUncheckedCreateWithoutPir_reviewsInput>
    where?: AIPActivityWhereInput
  }

  export type AIPActivityUpdateToOneWithWhereWithoutPir_reviewsInput = {
    where?: AIPActivityWhereInput
    data: XOR<AIPActivityUpdateWithoutPir_reviewsInput, AIPActivityUncheckedUpdateWithoutPir_reviewsInput>
  }

  export type AIPActivityUpdateWithoutPir_reviewsInput = {
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
    aip?: AIPUpdateOneRequiredWithoutActivitiesNestedInput
  }

  export type AIPActivityUncheckedUpdateWithoutPir_reviewsInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_id?: IntFieldUpdateOperationsInput | number
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
  }

  export type PIRCreateWithoutFactorsInput = {
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
    aip: AIPCreateNestedOneWithoutPirsInput
    activity_reviews?: PIRActivityReviewCreateNestedManyWithoutPirInput
  }

  export type PIRUncheckedCreateWithoutFactorsInput = {
    id?: number
    aip_id: number
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
    activity_reviews?: PIRActivityReviewUncheckedCreateNestedManyWithoutPirInput
  }

  export type PIRCreateOrConnectWithoutFactorsInput = {
    where: PIRWhereUniqueInput
    create: XOR<PIRCreateWithoutFactorsInput, PIRUncheckedCreateWithoutFactorsInput>
  }

  export type PIRUpsertWithoutFactorsInput = {
    update: XOR<PIRUpdateWithoutFactorsInput, PIRUncheckedUpdateWithoutFactorsInput>
    create: XOR<PIRCreateWithoutFactorsInput, PIRUncheckedCreateWithoutFactorsInput>
    where?: PIRWhereInput
  }

  export type PIRUpdateToOneWithWhereWithoutFactorsInput = {
    where?: PIRWhereInput
    data: XOR<PIRUpdateWithoutFactorsInput, PIRUncheckedUpdateWithoutFactorsInput>
  }

  export type PIRUpdateWithoutFactorsInput = {
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    aip?: AIPUpdateOneRequiredWithoutPirsNestedInput
    activity_reviews?: PIRActivityReviewUpdateManyWithoutPirNestedInput
  }

  export type PIRUncheckedUpdateWithoutFactorsInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_id?: IntFieldUpdateOperationsInput | number
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    activity_reviews?: PIRActivityReviewUncheckedUpdateManyWithoutPirNestedInput
  }

  export type SchoolCreateManyClusterInput = {
    id?: number
    name: string
    level: string
  }

  export type SchoolUpdateWithoutClusterInput = {
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    aips?: AIPUpdateManyWithoutSchoolNestedInput
    user?: UserUpdateOneWithoutSchoolNestedInput
    restricted_programs?: ProgramUpdateManyWithoutRestricted_schoolsNestedInput
  }

  export type SchoolUncheckedUpdateWithoutClusterInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    aips?: AIPUncheckedUpdateManyWithoutSchoolNestedInput
    user?: UserUncheckedUpdateOneWithoutSchoolNestedInput
    restricted_programs?: ProgramUncheckedUpdateManyWithoutRestricted_schoolsNestedInput
  }

  export type SchoolUncheckedUpdateManyWithoutClusterInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
  }

  export type AIPCreateManySchoolInput = {
    id?: number
    program_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
  }

  export type AIPUpdateWithoutSchoolInput = {
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    program?: ProgramUpdateOneRequiredWithoutAipsNestedInput
    activities?: AIPActivityUpdateManyWithoutAipNestedInput
    pirs?: PIRUpdateManyWithoutAipNestedInput
  }

  export type AIPUncheckedUpdateWithoutSchoolInput = {
    id?: IntFieldUpdateOperationsInput | number
    program_id?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    activities?: AIPActivityUncheckedUpdateManyWithoutAipNestedInput
    pirs?: PIRUncheckedUpdateManyWithoutAipNestedInput
  }

  export type AIPUncheckedUpdateManyWithoutSchoolInput = {
    id?: IntFieldUpdateOperationsInput | number
    program_id?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ProgramUpdateWithoutRestricted_schoolsInput = {
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
    aips?: AIPUpdateManyWithoutProgramNestedInput
    personnel?: UserUpdateManyWithoutProgramsNestedInput
  }

  export type ProgramUncheckedUpdateWithoutRestricted_schoolsInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
    aips?: AIPUncheckedUpdateManyWithoutProgramNestedInput
    personnel?: UserUncheckedUpdateManyWithoutProgramsNestedInput
  }

  export type ProgramUncheckedUpdateManyWithoutRestricted_schoolsInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
  }

  export type AIPCreateManyProgramInput = {
    id?: number
    school_id: number
    year: number
    pillar: string
    sip_title: string
    project_coordinator: string
    objectives: string
    indicators: string
    annual_target: string
    created_at?: Date | string
  }

  export type AIPUpdateWithoutProgramInput = {
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    school?: SchoolUpdateOneRequiredWithoutAipsNestedInput
    activities?: AIPActivityUpdateManyWithoutAipNestedInput
    pirs?: PIRUpdateManyWithoutAipNestedInput
  }

  export type AIPUncheckedUpdateWithoutProgramInput = {
    id?: IntFieldUpdateOperationsInput | number
    school_id?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    activities?: AIPActivityUncheckedUpdateManyWithoutAipNestedInput
    pirs?: PIRUncheckedUpdateManyWithoutAipNestedInput
  }

  export type AIPUncheckedUpdateManyWithoutProgramInput = {
    id?: IntFieldUpdateOperationsInput | number
    school_id?: IntFieldUpdateOperationsInput | number
    year?: IntFieldUpdateOperationsInput | number
    pillar?: StringFieldUpdateOperationsInput | string
    sip_title?: StringFieldUpdateOperationsInput | string
    project_coordinator?: StringFieldUpdateOperationsInput | string
    objectives?: StringFieldUpdateOperationsInput | string
    indicators?: StringFieldUpdateOperationsInput | string
    annual_target?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUpdateWithoutProgramsInput = {
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    school?: SchoolUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutProgramsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    school_id?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyWithoutProgramsInput = {
    id?: IntFieldUpdateOperationsInput | number
    email?: StringFieldUpdateOperationsInput | string
    password?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    school_id?: NullableIntFieldUpdateOperationsInput | number | null
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SchoolUpdateWithoutRestricted_programsInput = {
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster?: ClusterUpdateOneRequiredWithoutSchoolsNestedInput
    aips?: AIPUpdateManyWithoutSchoolNestedInput
    user?: UserUpdateOneWithoutSchoolNestedInput
  }

  export type SchoolUncheckedUpdateWithoutRestricted_programsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster_id?: IntFieldUpdateOperationsInput | number
    aips?: AIPUncheckedUpdateManyWithoutSchoolNestedInput
    user?: UserUncheckedUpdateOneWithoutSchoolNestedInput
  }

  export type SchoolUncheckedUpdateManyWithoutRestricted_programsInput = {
    id?: IntFieldUpdateOperationsInput | number
    name?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    cluster_id?: IntFieldUpdateOperationsInput | number
  }

  export type ProgramUpdateWithoutPersonnelInput = {
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
    aips?: AIPUpdateManyWithoutProgramNestedInput
    restricted_schools?: SchoolUpdateManyWithoutRestricted_programsNestedInput
  }

  export type ProgramUncheckedUpdateWithoutPersonnelInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
    aips?: AIPUncheckedUpdateManyWithoutProgramNestedInput
    restricted_schools?: SchoolUncheckedUpdateManyWithoutRestricted_programsNestedInput
  }

  export type ProgramUncheckedUpdateManyWithoutPersonnelInput = {
    id?: IntFieldUpdateOperationsInput | number
    title?: StringFieldUpdateOperationsInput | string
    school_level_requirement?: StringFieldUpdateOperationsInput | string
  }

  export type AIPActivityCreateManyAipInput = {
    id?: number
    phase: string
    activity_name: string
    implementation_period: string
    persons_involved: string
    outputs: string
    budget_amount?: Decimal | DecimalJsLike | number | string
    budget_source: string
  }

  export type PIRCreateManyAipInput = {
    id?: number
    quarter: string
    program_owner: string
    total_budget?: Decimal | DecimalJsLike | number | string
    fund_source: string
    created_at?: Date | string
  }

  export type AIPActivityUpdateWithoutAipInput = {
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
    pir_reviews?: PIRActivityReviewUpdateManyWithoutAip_activityNestedInput
  }

  export type AIPActivityUncheckedUpdateWithoutAipInput = {
    id?: IntFieldUpdateOperationsInput | number
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
    pir_reviews?: PIRActivityReviewUncheckedUpdateManyWithoutAip_activityNestedInput
  }

  export type AIPActivityUncheckedUpdateManyWithoutAipInput = {
    id?: IntFieldUpdateOperationsInput | number
    phase?: StringFieldUpdateOperationsInput | string
    activity_name?: StringFieldUpdateOperationsInput | string
    implementation_period?: StringFieldUpdateOperationsInput | string
    persons_involved?: StringFieldUpdateOperationsInput | string
    outputs?: StringFieldUpdateOperationsInput | string
    budget_amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    budget_source?: StringFieldUpdateOperationsInput | string
  }

  export type PIRUpdateWithoutAipInput = {
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    activity_reviews?: PIRActivityReviewUpdateManyWithoutPirNestedInput
    factors?: PIRFactorUpdateManyWithoutPirNestedInput
  }

  export type PIRUncheckedUpdateWithoutAipInput = {
    id?: IntFieldUpdateOperationsInput | number
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
    activity_reviews?: PIRActivityReviewUncheckedUpdateManyWithoutPirNestedInput
    factors?: PIRFactorUncheckedUpdateManyWithoutPirNestedInput
  }

  export type PIRUncheckedUpdateManyWithoutAipInput = {
    id?: IntFieldUpdateOperationsInput | number
    quarter?: StringFieldUpdateOperationsInput | string
    program_owner?: StringFieldUpdateOperationsInput | string
    total_budget?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    fund_source?: StringFieldUpdateOperationsInput | string
    created_at?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PIRActivityReviewCreateManyAip_activityInput = {
    id?: number
    pir_id: number
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
  }

  export type PIRActivityReviewUpdateWithoutAip_activityInput = {
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
    pir?: PIRUpdateOneRequiredWithoutActivity_reviewsNestedInput
  }

  export type PIRActivityReviewUncheckedUpdateWithoutAip_activityInput = {
    id?: IntFieldUpdateOperationsInput | number
    pir_id?: IntFieldUpdateOperationsInput | number
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PIRActivityReviewUncheckedUpdateManyWithoutAip_activityInput = {
    id?: IntFieldUpdateOperationsInput | number
    pir_id?: IntFieldUpdateOperationsInput | number
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PIRActivityReviewCreateManyPirInput = {
    id?: number
    aip_activity_id: number
    physical_target?: Decimal | DecimalJsLike | number | string
    financial_target?: Decimal | DecimalJsLike | number | string
    physical_accomplished?: Decimal | DecimalJsLike | number | string
    financial_accomplished?: Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: string | null
  }

  export type PIRFactorCreateManyPirInput = {
    id?: number
    factor_type: string
    facilitating_factors: string
    hindering_factors: string
  }

  export type PIRActivityReviewUpdateWithoutPirInput = {
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
    aip_activity?: AIPActivityUpdateOneRequiredWithoutPir_reviewsNestedInput
  }

  export type PIRActivityReviewUncheckedUpdateWithoutPirInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_activity_id?: IntFieldUpdateOperationsInput | number
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PIRActivityReviewUncheckedUpdateManyWithoutPirInput = {
    id?: IntFieldUpdateOperationsInput | number
    aip_activity_id?: IntFieldUpdateOperationsInput | number
    physical_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_target?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    physical_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    financial_accomplished?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    actions_to_address_gap?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type PIRFactorUpdateWithoutPirInput = {
    factor_type?: StringFieldUpdateOperationsInput | string
    facilitating_factors?: StringFieldUpdateOperationsInput | string
    hindering_factors?: StringFieldUpdateOperationsInput | string
  }

  export type PIRFactorUncheckedUpdateWithoutPirInput = {
    id?: IntFieldUpdateOperationsInput | number
    factor_type?: StringFieldUpdateOperationsInput | string
    facilitating_factors?: StringFieldUpdateOperationsInput | string
    hindering_factors?: StringFieldUpdateOperationsInput | string
  }

  export type PIRFactorUncheckedUpdateManyWithoutPirInput = {
    id?: IntFieldUpdateOperationsInput | number
    factor_type?: StringFieldUpdateOperationsInput | string
    facilitating_factors?: StringFieldUpdateOperationsInput | string
    hindering_factors?: StringFieldUpdateOperationsInput | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { loadFacts, type Network } from './facts.js';
import { fromRoot } from './paths.js';

// Field names follow proto/service.proto. 64-bit numbers arrive as strings.
export interface LightdInfo {
  version: string;
  vendor: string;
  chainName: string;
  consensusBranchId: string;
  blockHeight: string;
  estimatedHeight: string;
  upgradeName: string;
  upgradeHeight: string;
  lightwalletProtocolVersion: string;
}

export interface RawTransaction {
  data: Buffer;
  height: string;
}

export interface BlockId {
  height: string;
  hash: Buffer;
}

export class OfflineError extends Error {
  constructor() {
    super('Network calls are off (ZCASH_NOW_OFFLINE=1).');
    this.name = 'OfflineError';
  }
}

type Callback<T> = (error: grpc.ServiceError | null, value?: T) => void;

interface StreamerClient extends grpc.Client {
  GetLightdInfo(request: object, options: grpc.CallOptions, callback: Callback<LightdInfo>): void;
  GetLatestBlock(request: object, options: grpc.CallOptions, callback: Callback<BlockId>): void;
  GetTransaction(request: { hash: Buffer }, options: grpc.CallOptions, callback: Callback<RawTransaction>): void;
}

type StreamerConstructor = new (address: string, credentials: grpc.ChannelCredentials) => StreamerClient;

let streamer: StreamerConstructor | undefined;

function streamerConstructor(): StreamerConstructor {
  if (!streamer) {
    const definition = protoLoader.loadSync('service.proto', {
      includeDirs: [fromRoot('proto')],
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const loaded = grpc.loadPackageDefinition(definition) as unknown as {
      cash: { z: { wallet: { sdk: { rpc: { CompactTxStreamer: StreamerConstructor } } } } };
    };
    streamer = loaded.cash.z.wallet.sdk.rpc.CompactTxStreamer;
  }
  return streamer;
}

export function isOffline(): boolean {
  return process.env.ZCASH_NOW_OFFLINE === '1';
}

export function endpointFor(network: Network): string {
  const override = network === 'test' ? process.env.ZCASH_NOW_LIGHTWALLETD_TEST : process.env.ZCASH_NOW_LIGHTWALLETD_MAIN;
  if (override) return override;
  const { host, port } = loadFacts().lightwalletd[network];
  return `${host}:${port}`;
}

export function isNotFound(error: unknown): boolean {
  const serviceError = error as Partial<grpc.ServiceError> | undefined;
  return serviceError?.code === grpc.status.NOT_FOUND || /not found|no such/i.test(String(serviceError?.message));
}

// A read-only client: zcash-now never broadcasts, so only these three calls exist.
export class Lightwalletd {
  readonly endpoint: string;
  private readonly client: StreamerClient;

  private readonly timeoutMs: number;

  constructor(network: Network, options: { timeoutMs?: number; endpoint?: string } = {}) {
    if (isOffline()) throw new OfflineError();
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.endpoint = options.endpoint ?? endpointFor(network);
    const Streamer = streamerConstructor();
    this.client = new Streamer(this.endpoint, grpc.credentials.createSsl());
  }

  getLightdInfo(): Promise<LightdInfo> {
    return this.call((options, callback) => this.client.GetLightdInfo({}, options, callback));
  }

  getLatestBlock(): Promise<BlockId> {
    return this.call((options, callback) => this.client.GetLatestBlock({}, options, callback));
  }

  getTransaction(hash: Buffer): Promise<RawTransaction> {
    return this.call((options, callback) => this.client.GetTransaction({ hash }, options, callback));
  }

  close(): void {
    this.client.close();
  }

  private call<T>(invoke: (options: grpc.CallOptions, callback: Callback<T>) => void): Promise<T> {
    return new Promise((resolve, reject) => {
      invoke({ deadline: Date.now() + this.timeoutMs }, (error, value) => (error ? reject(error) : resolve(value as T)));
    });
  }
}

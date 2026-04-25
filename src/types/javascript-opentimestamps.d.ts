/**
 * Minimal type declarations for `javascript-opentimestamps`.
 * The lib has no official @types — we type only what KOSHA uses.
 * If a method signature changes upstream, update this file.
 */
declare module 'javascript-opentimestamps' {
  export class OpSHA256 {}

  export const Ops: {
    OpSHA256: typeof OpSHA256
  }

  export class StreamSerializationContext {
    getOutput(): Uint8Array | number[]
  }

  export class StreamDeserializationContext {
    constructor(buffer: number[] | Uint8Array)
  }

  export const Context: {
    StreamSerialization: typeof StreamSerializationContext
    StreamDeserialization: typeof StreamDeserializationContext
  }

  export interface Attestation {
    height?: number
    timestamp?: number
  }

  export interface Timestamp {
    allAttestations(): Map<unknown, Attestation[]>
  }

  export class DetachedTimestampFile {
    timestamp?: Timestamp
    static fromHash(op: OpSHA256, hash: Uint8Array | Buffer): DetachedTimestampFile
    static deserialize(ctx: StreamDeserializationContext): DetachedTimestampFile
    serialize(ctx: StreamSerializationContext): void
    fileDigest(): Uint8Array
  }

  export function stamp(detached: DetachedTimestampFile): Promise<void>
  export function upgrade(detached: DetachedTimestampFile): Promise<boolean>
  export function verify(detached: DetachedTimestampFile): Promise<Record<string, { height: number; timestamp: number }>>
}

/**
 * KOSHA — OpenTimestamps Bitcoin proofs ("argent à mémoire").
 *
 * Chaque contribution validée à une cagnotte est hashée (SHA256 d'un payload
 * canonique JSON) puis horodatée via la calendar OpenTimestamps publique.
 * La preuve OTS initiale est instantanée mais non encore ancrée Bitcoin ;
 * un cron ultérieur peut l'upgrader pour récupérer le block height d'ancrage
 * (~ 1 à 6 heures plus tard).
 *
 * Lib : `javascript-opentimestamps` (déjà installée).
 *
 * Mode dégradé : si la calendar publique est injoignable, on retourne quand même
 * le hash et un proof null — le cron retentera plus tard. Ne JAMAIS bloquer
 * le webhook Stripe pour une indispo OTS.
 */
import { createHash } from 'node:crypto'

// Type-only import (la lib n'a pas de types officiels, on la load dynamiquement)
type OtsLib = typeof import('javascript-opentimestamps')

let _ots: OtsLib | null = null
async function getOts(): Promise<OtsLib> {
  if (!_ots) {
    _ots = await import('javascript-opentimestamps')
  }
  return _ots
}

// -----------------------------------------------------------------------------
// PAYLOAD CANONIQUE
// -----------------------------------------------------------------------------
export interface ArgentMemoirePayload {
  contribution_id: string
  from_user_id: string
  to_cagnotte_id: string
  amount_cents: number
  action_label: string
  timestamp_iso: string
}

/**
 * Sérialise le payload de manière déterministe (clés triées) puis SHA256.
 * Tout changement de format casse le hash → on FREEZE ce format.
 */
export function hashPayload(payload: ArgentMemoirePayload): string {
  const canonical = JSON.stringify({
    action_label: payload.action_label,
    amount_cents: payload.amount_cents,
    contribution_id: payload.contribution_id,
    from_user_id: payload.from_user_id,
    timestamp_iso: payload.timestamp_iso,
    to_cagnotte_id: payload.to_cagnotte_id,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

// -----------------------------------------------------------------------------
// STAMP — appelle calendar.opentimestamps.org pour proof initial
// -----------------------------------------------------------------------------
export interface StampResult {
  hash_sha256: string
  ots_proof_base64: string | null
  stamped_at: string
  calendar_unavailable: boolean
}

export async function stampHash(hashHex: string, opts: { timeoutMs?: number } = {}): Promise<StampResult> {
  const timeout = opts.timeoutMs ?? 5000
  const stampedAt = new Date().toISOString()

  try {
    const ots = await getOts()
    const hashBuffer = Buffer.from(hashHex, 'hex')

    // Build a DetachedTimestampFile from the SHA256 of our payload
    const detached = ots.DetachedTimestampFile.fromHash(new ots.Ops.OpSHA256(), hashBuffer)

    // Call calendar with timeout
    await Promise.race([
      ots.stamp(detached),
      new Promise((_, reject) => setTimeout(() => reject(new Error('OTS stamp timeout')), timeout)),
    ])

    // Serialize the proof to bytes then base64
    const ctx = new ots.Context.StreamSerialization()
    detached.serialize(ctx)
    const proofBase64 = Buffer.from(ctx.getOutput()).toString('base64')

    return { hash_sha256: hashHex, ots_proof_base64: proofBase64, stamped_at: stampedAt, calendar_unavailable: false }
  } catch (e) {
    // Mode dégradé : on garde le hash, on retente plus tard
    return {
      hash_sha256: hashHex,
      ots_proof_base64: null,
      stamped_at: stampedAt,
      calendar_unavailable: true,
    }
  }
}

// -----------------------------------------------------------------------------
// UPGRADE — récupère le block height Bitcoin une fois la preuve ancrée
// -----------------------------------------------------------------------------
export interface UpgradeResult {
  upgraded_proof_base64: string | null
  bitcoin_block_height: number | null
  upgraded: boolean
  reason?: string
}

export async function upgradeProof(proofBase64: string): Promise<UpgradeResult> {
  try {
    const ots = await getOts()
    const buf = Buffer.from(proofBase64, 'base64')
    const ctx = new ots.Context.StreamDeserialization(Array.from(buf))
    const detached = ots.DetachedTimestampFile.deserialize(ctx)

    const wasUpgraded = await ots.upgrade(detached)
    if (!wasUpgraded) {
      return { upgraded_proof_base64: null, bitcoin_block_height: null, upgraded: false, reason: 'not_yet_anchored' }
    }

    // Extract block height from attestation (best-effort — depends on lib internals)
    let blockHeight: number | null = null
    try {
      const attestations = detached.timestamp?.allAttestations?.()
      if (attestations) {
        for (const [, atts] of attestations) {
          for (const att of atts) {
            if (typeof att.height === 'number') {
              blockHeight = att.height
              break
            }
          }
          if (blockHeight) break
        }
      }
    } catch {
      // Ignore — pas critique
    }

    const out = new ots.Context.StreamSerialization()
    detached.serialize(out)
    const upgraded_proof_base64 = Buffer.from(out.getOutput()).toString('base64')

    return { upgraded_proof_base64, bitcoin_block_height: blockHeight, upgraded: true }
  } catch (e) {
    return {
      upgraded_proof_base64: null,
      bitcoin_block_height: null,
      upgraded: false,
      reason: e instanceof Error ? e.message : 'unknown',
    }
  }
}

// -----------------------------------------------------------------------------
// VERIFY — vérifie la chaîne de proof depuis hash → calendar → Bitcoin
// -----------------------------------------------------------------------------
export interface VerifyResult {
  valid: boolean
  bitcoin_block_height: number | null
  bitcoin_block_time: Date | null
  reason?: string
}

export async function verifyProof(proofBase64: string, expectedHashHex: string): Promise<VerifyResult> {
  try {
    const ots = await getOts()
    const buf = Buffer.from(proofBase64, 'base64')
    const ctx = new ots.Context.StreamDeserialization(Array.from(buf))
    const detached = ots.DetachedTimestampFile.deserialize(ctx)

    // Verify hash matches
    const got = Buffer.from(detached.fileDigest()).toString('hex')
    if (got.toLowerCase() !== expectedHashHex.toLowerCase()) {
      return { valid: false, bitcoin_block_height: null, bitcoin_block_time: null, reason: 'hash_mismatch' }
    }

    const verifications = await ots.verify(detached)
    if (!verifications || Object.keys(verifications).length === 0) {
      return { valid: false, bitcoin_block_height: null, bitcoin_block_time: null, reason: 'no_attestation_yet' }
    }

    // Pick first Bitcoin attestation
    const btc = (verifications as Record<string, { height: number; timestamp: number }>)['bitcoin']
    if (!btc) {
      return { valid: false, bitcoin_block_height: null, bitcoin_block_time: null, reason: 'no_bitcoin_attestation' }
    }

    return {
      valid: true,
      bitcoin_block_height: btc.height,
      bitcoin_block_time: new Date(btc.timestamp * 1000),
    }
  } catch (e) {
    return {
      valid: false,
      bitcoin_block_height: null,
      bitcoin_block_time: null,
      reason: e instanceof Error ? e.message : 'unknown',
    }
  }
}

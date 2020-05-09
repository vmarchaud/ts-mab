import { BanditMetadataIO, BanditArm } from '../types'
import IORedis from 'ioredis'
import { BanditStore, StoreLoadOptions, FetchResultOptions } from './types'
import { ThompsonSamplingBandit } from '../impls/thompson'
import { of } from 'await-of'
import { decodeIO } from '../../lib/io-types'
import { BaseBandit } from '../impls/base'
import { PickArmsBanditResult } from '../manager'

export type RedisBanditStoreOptions = IORedis.RedisOptions

/**
 * To store each bandit in redis, we use hashes: https://redis.io/commands#hash
 *
 * The hash name is the bandit id, each arm being a field inside that hash.
 */

export class RedisBanditStore implements BanditStore {

  private _redis: IORedis.Redis

  constructor (_redisOptions: IORedis.RedisOptions) {
    this._redis = new IORedis(Object.assign({
      lazyConnect: true,
      enableOfflineQueue: false
    }, _redisOptions))
  }

  async connect (): Promise<void> {
    await this._redis.connect()
  }

  async disconnect (): Promise<void> {
    this._redis.disconnect()
  }

  async find (options: StoreLoadOptions): Promise<BaseBandit | undefined> {
    // fetch metadata
    const rawMetadata = await this._redis.get(`${options.identifier}:metadata`)
    if (rawMetadata === null) {
      return undefined
    }
    const [ metadata, err ] = await of(decodeIO(BanditMetadataIO, JSON.parse(rawMetadata)))
    if (err || metadata === undefined) {
      throw err ?? new Error(`Got no scope while trying to load bandit ${options.identifier}`)
    }
    // fetch arms
    let armsToFetch: string[] = []
    if (options.useArmSubset === undefined) {
      armsToFetch = await this._redis.smembers(`${options.identifier}:arms`)
    } else {
      armsToFetch = options.useArmSubset
    }
    const aggResponse = (agg: Record<string, number>, armValue: string | null, idx: number) => {
      if (armValue === null) return agg
      agg[armsToFetch[idx]] = parseInt(armValue, 10)
      return agg
    }
    const rawSuccess = await this._redis.hmget(`${options.identifier}:successes`, ...armsToFetch)
    const armSuccesses = rawSuccess.reduce(aggResponse, {})
    const rawTrials = await this._redis.hmget(`${options.identifier}:trials`, ...armsToFetch)
    const armTrials = rawTrials.reduce(aggResponse, {})

    // convert arms records into a single object for each arm
    const arms: BanditArm[] = armsToFetch.map(arm => {
      return {
        identifier: arm,
        trials: armTrials[arm] ?? 0,
        successes: armSuccesses[arm] ?? 0
      }
    })
    return new ThompsonSamplingBandit(options.identifier, arms, metadata)
  }

  async listArms (bandit: string) {
    return this._redis.smembers(`${bandit}:arms`)
  }

  async removeArm (bandit: string, arm: string) {
    await this._redis.srem(`${bandit}:arms`, arm)
  }

  async addArm (bandit: string, arm: string) {
    await this._redis.sadd(`${bandit}:arms`, arm)
  }

  async create (bandit: BaseBandit): Promise<void> {
    const arms = bandit.arms.map(arm => arm.identifier)
    await this._redis.sadd(`${bandit.identifier}:arms`, ...arms)
    await this._redis.set(`${bandit.identifier}:metadata`, JSON.stringify(bandit.metadata))
  }

  async fetchResult (options: FetchResultOptions) {
    const result = await this._redis.get(`${options.bandit}:result:${options.pickId}`)
    return result === null ? undefined : JSON.parse(result) as unknown as PickArmsBanditResult
  }

  async saveResult (result: PickArmsBanditResult) {
    const hasBeenSaved = await this._redis.setnx(`${result.bandit}:result:${result.pickId}`, JSON.stringify(result))
    if (hasBeenSaved) return result
    // if the key hasnt been saved, that means another server has computed values, he will use them
    const oldResult = await this.fetchResult({ pickId: result.pickId, bandit: result.bandit })
    // oldResult could be undefined in case of network failure
    return oldResult ?? result
  }

  async markArmSuccess (bandit: string, arm: string) {
    await this._redis.hincrby(`${bandit}:successes`, arm, 1)
  }

  async markArmTrial (bandit: string, arm: string) {
    await this._redis.hincrby(`${bandit}:trials`, arm, 1)
  }
}

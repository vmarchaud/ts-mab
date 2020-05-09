import { BanditMetadataIO } from '../types'
import IORedis from 'ioredis'
import { BanditStore, BanditArm, StoreLoadOptions } from './types'
import { ThompsonSamplingBandit } from '../impls/thompson'
import { of } from 'await-of'
import { decodeIO } from '../../lib/io-types'
import { BaseBandit } from '../impls/base'

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

  async load (options: StoreLoadOptions): Promise<BaseBandit> {
    let arms: BanditArm[] = []
    let rawMetadata: string | null = null
    if (options.useArmSubset !== undefined) {
      const rawArms = await this._redis.hmget(options.identifier, ...options.useArmSubset)
      arms = rawArms
        .filter(arm => arm !== null)
        .map(arm => JSON.parse(arm as string) as BanditArm)
      rawMetadata = await this._redis.hget(options.identifier, '__metadata')
    } else {
      const rawArms = await this._redis.hgetall(options.identifier)
      arms = Object.values(rawArms)
        .filter(([key, value]) => {
          if (key === '__metadata') {
            rawMetadata = value
            return false
          }
          return true
        })
        .map(([key, arm]) => arm)
        .map(arm => JSON.parse(arm) as BanditArm)
    }
    const [ metadata, err ] = await of(decodeIO(BanditMetadataIO, rawMetadata))
    if (err || metadata === undefined) {
      throw err ?? new Error(`Got no scope while trying to load bandit ${options.identifier}`)
    }
    return new ThompsonSamplingBandit(options.identifier, arms, metadata)
  }

  async save (bandit: BaseBandit): Promise<void> {
    for (let arm of bandit.arms) {
      await this._redis.hset(bandit.identifier, arm.identifier, JSON.stringify(arm))
    }
    await this._redis.hset(bandit.identifier, '__metadata', JSON.stringify(bandit.metadata))
  }
}

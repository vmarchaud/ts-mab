import { BanditType, Bandit, BanditArm, BanditMetadata } from './types'
import { BanditStoreType, BanditStore } from './store/types'
import { getBanditStore, getBanditImpl } from './utils'
import { RedisBanditStoreOptions } from './store/redis'
import { of } from 'await-of'
import httpErrors from 'http-errors'

export class BanditManager {
  private _store: BanditStore

  constructor (private _options: BanditManagerOptions) {
    this._store = new (getBanditStore(_options.store.type))(_options.store.options)
  }

  async init () {
    await this._store.connect()
  }

  async destroy () {
    await this._store.disconnect()
  }

  async pick (options: PickArmsBanditOptions): Promise<PickArmsBanditResult> {
    let [ bandit, err ] = await of(this._store.find({
      identifier: options.identifier,
      useArmSubset: options.useArmSubset
    }))
    if (bandit === undefined || err instanceof Error) {
      throw err ?? new httpErrors.NotFound(`Bandit not found: ${options.identifier}`)
    }
    const pickedArms: BanditArm[] = []
    for (let i = 0; i < options.armsCount; i++) {
      const arm = await bandit.pick({
        // if we have multiple pick to make, we ignore previous pick to pick them twice
        excludeArms: pickedArms.map(arm => arm.identifier),
        includeArms: options.useArmSubset ?? []
      })
      if (arm === undefined) break
      pickedArms.push(arm)
    }
    // this result is temporary since we don't know if someone else has
    // already computed a result
    const tmpResult: PickArmsBanditResult = {
      arms: pickedArms.map(arm => arm.identifier),
      bandit: options.identifier,
      pickId: options.pickId
    }
    const result = await this._store.saveResult(tmpResult)
    for (let arm of result.arms) {
      void this._store.markArmTrial(bandit.identifier, arm)
    }
    return result
  }

  async reward (options: RewardBanditOptions) {
    await this._store.markArmSuccess(options.identifier, options.arm)
  }

  async update (options: UpdateBanditOptions): Promise<void> {
    const [ armsAlreadyExisting, err ] = await of(this._store.listArms(options.identifier))
    if (armsAlreadyExisting === undefined) {
      throw err ?? new Error(`Bandit not found, ${options.identifier}`)
    }
    // remove arm that are no longer here
    await Promise.all(armsAlreadyExisting
      .filter(armId => options.arms.includes(armId) === false)
      .map(armId => {
        return this._store.removeArm(options.identifier, armId)
      })
    )
    // add new arms
    await Promise.all(options.arms
      .filter(armId => armsAlreadyExisting.includes(armId) === false)
      .map(armId => {
        return this._store.addArm(options.identifier, armId)
      })
    )
  }

  async create (options: CreateBanditOptions): Promise<Bandit> {
    const arms: BanditArm[] = options.arms.map(id => {
      return {
        identifier: id,
        disabled: false,
        successes: 0,
        trials: 0
      }
    })
    const metadata: BanditMetadata = {
      scope: options.scope
    }
    const bandit = new (getBanditImpl(this._options.banditType))(options.identifier, arms, metadata)
    await this._store.create(bandit)
    return bandit
  }

  async get (identifier: string) {
    return this._store.find({ identifier })
  }
}

export type BanditManagerOptions = {
  banditType: BanditType
  store: {
    type: BanditStoreType
    options: RedisBanditStoreOptions
  }
}

export type CreateBanditOptions = {
  identifier: string
  arms: string[]
  scope: string
}

export type UpdateBanditOptions = {
  identifier: string
  arms: string[]
}

export type PickArmsBanditOptions = {
  identifier: string
  armsCount: number
  pickId: string
  useArmSubset?: string[]
}

export type PickArmsBanditResult = {
  arms: string[]
  bandit: string
  pickId: string
}

export type RewardBanditOptions = {
  arm: string
  identifier: string
  pickId?: string
}

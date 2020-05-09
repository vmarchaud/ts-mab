import { BanditType, Bandit, BanditArm, BanditMetadata } from './types'
import { BanditStoreType, BanditStore } from './store/types'
import { getBanditStore, getBanditImpl } from './utils'
import { RedisBanditStoreOptions } from './store/redis'
import { of } from 'await-of'

export type BanditManagerOptions = {
  banditType: BanditType
  store: {
    type: BanditStoreType
    options: RedisBanditStoreOptions
  }
}

export type CreateBanditOptions = {
  identifier: string
  arms: string[],
  scope: string
}

export type UpdateBanditOptions = {
  identifier: string,
  arms: string[],
  scope: string
}

export type PickArmsBanditOptions = {
  identifier: string,
  armsCount: number,
  pickId?: string,
  useArmSubset?: string[]
}

export class BanditManager {
  private _store: BanditStore

  constructor (private _options: BanditManagerOptions) {
    this._store = new (getBanditStore(_options.store.type))(_options.store.options)
  }

  async pick (options: PickArmsBanditOptions): Promise<BanditArm[]> {
    let [ bandit, err ] = await of(this._store.load({
      identifier: options.identifier,
      useArmSubset: options.useArmSubset
    }))
    if (bandit === undefined || err instanceof Error) {
      throw err ?? new Error(`Bandit not found, ${options.identifier}`)
    }
    const pickedArms: BanditArm[] = []
    for (let i = 0; i < options.armsCount; i++) {
      const arm = await bandit.pick({
        excludeArms: pickedArms.map(arm => arm.identifier),
        includeArms: options.useArmSubset ?? []
      })
      pickedArms.push(arm)
    }
    return pickedArms
  }

  async update (options: UpdateBanditOptions): Promise<Bandit> {
    let [ bandit, err ] = await of(this._store.load({
      identifier: options.identifier,
      fetchDisabledArms: true
    }))
    if (bandit === undefined) {
      throw err ?? new Error(`Bandit not found, ${options.identifier}`)
    }
    // re-enable arms that were disabled
    bandit.arms
      .filter(arm => arm.disabled === true)
      .filter(arm => options.arms.includes(arm.identifier))
      .forEach(arm => {
        arm.disabled = true
      })
    // disable arm that are no longer here
    bandit.arms
      .filter(arm => options.arms.includes(arm.identifier) === false)
      .forEach(arm => {
        arm.disabled = true
      })
    // add new arms
    const armsAlreadyExisting = bandit.arms.map(arm => arm.identifier)
    options.arms
      .filter(armId => armsAlreadyExisting.includes(armId) === false)
      .forEach(armId => {
        const arm: BanditArm = {
          identifier: armId,
          disabled: false,
          successes: 0,
          trials: 0
        }
        bandit!.arms.push(arm)
      })
    await this._store.save(bandit)
    return bandit
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
    await this._store.save(bandit)
    return bandit
  }
}

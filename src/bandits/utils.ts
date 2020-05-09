import { BanditStoreType, BanditStore } from './store/types'
import { RedisBanditStore } from './store/redis'
import { BanditType } from './types'
import { BaseBandit } from './impls/base'
import { ThompsonSamplingBandit } from './impls/thompson'

export const getBanditStore = (type: BanditStoreType): new (...args: unknown[]) => BanditStore => {
  switch (type) {
    case BanditStoreType.REDIS :
      return RedisBanditStore as unknown as new () => BanditStore
    default:
      throw new Error(`Invalid bandit store: ${type}`)
  }
}

export const getBanditImpl = (type: BanditType): new (...args: unknown[]) => BaseBandit => {
  switch (type) {
    case BanditType.THOMPSON :
      return ThompsonSamplingBandit as unknown as new () => BaseBandit
    default:
      throw new Error(`Invalid bandit type: ${type}`)
  }
}

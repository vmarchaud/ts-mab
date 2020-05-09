import { Bandit } from '../types'
import * as t from 'io-ts'
import { PickArmsBanditResult } from '../manager'
import { BaseBandit } from '../impls/base'

export enum BanditStoreType {
  REDIS = 'redis'
}

export type StoreLoadOptions = {
  identifier: string
  fetchDisabledArms?: boolean
  useArmSubset?: string[]
}

export type FetchResultOptions = {
  pickId: string
  bandit: string
}

export interface BanditStore {
  find (options: StoreLoadOptions): Promise<BaseBandit>
  create (bandit: Bandit): Promise<void>

  fetchResult (options: FetchResultOptions): Promise<PickArmsBanditResult | undefined>
  saveResult (result: PickArmsBanditResult): Promise<PickArmsBanditResult>

  markArmTrial (bandit: string, arm: string): Promise<void>
  markArmSuccess (bandit: string, arm: string): Promise<void>

  listArms (bandit: string): Promise<string[]>
  removeArm (bandit: string, armId: string): Promise<void>
  addArm (bandit: string, armId: string): Promise<void>

  connect (): Promise<void>
  disconnect (): Promise<void>
}

export const BanditArmIO = t.type({
  identifier: t.string,
  trials: t.number,
  successes: t.number
})

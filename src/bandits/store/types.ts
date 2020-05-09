import { Bandit } from '../types'
import * as t from 'io-ts'

export enum BanditStoreType {
  REDIS = 'redis'
}

export type StoreLoadOptions = {
  identifier: string
  fetchDisabledArms?: boolean
  useArmSubset?: string[]
}

export interface BanditStore {
  load (options: StoreLoadOptions): Promise<Bandit>
  save (bandit: Bandit): Promise<void>
  connect (): Promise<void>
  disconnect (): Promise<void>
}

export const BanditArmIO = t.type({
  identifier: t.string,
  disabled: t.boolean,
  trials: t.number,
  successes: t.number
})

export type BanditArm = t.TypeOf<typeof BanditArmIO>

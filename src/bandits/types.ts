import * as t from 'io-ts'

export type BanditArm = {
  identifier: string
  trials: number
  successes: number
}

export enum BanditType {
  THOMPSON = 'thompson'
}

export const BanditMetadataIO = t.type({
  scope: t.string
})

export type BanditMetadata = {
  scope: string
}

export type BanditPickOptions = {
  excludeArms: string[]
  includeArms: string[]
}

export type SerializedBandit = {
  arms: BanditArm[]
  metadata: BanditMetadata
  identifier: string
}

export interface Bandit {
  readonly arms: BanditArm[]
  readonly metadata: BanditMetadata

  pick (options: BanditPickOptions): Promise<BanditArm | undefined>

  toString (): SerializedBandit
}

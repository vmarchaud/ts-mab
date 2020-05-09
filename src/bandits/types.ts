import * as t from 'io-ts'

export type BanditArm = {
  identifier: string
  disabled: boolean
  trials: number
  successes: number
}

export enum BanditType {
  THOMPSON = 'thompson'
}

export const BanditMetadataIO = t.type({
  scope: t.string
})

export type BanditMetadata = t.TypeOf<typeof BanditMetadataIO>

export type BanditPickOptions = {
  excludeArms: string[]
  includeArms: string[]
}

export type BandidPickResult = {
  identifier: string
}

export interface Bandit {
  readonly arms: BanditArm[]
  readonly metadata: BanditMetadata

  pick (options: BanditPickOptions): Promise<BanditArm>
}

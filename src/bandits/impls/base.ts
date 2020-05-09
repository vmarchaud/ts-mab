import { Bandit, BanditArm, BanditPickOptions, BanditMetadata } from '../types'

export abstract class BaseBandit implements Bandit {

  constructor (
    readonly identifier: string,
    readonly arms: BanditArm[],
    readonly metadata: BanditMetadata) {
  }

  pick (options: BanditPickOptions): Promise<BanditArm> {
    throw new Error('Method not implemented.')
  }
}

import { Bandit, BanditArm, BanditPickOptions, BanditMetadata } from '../types'

export abstract class BaseBandit implements Bandit {

  constructor (
    readonly identifier: string,
    readonly arms: BanditArm[],
    readonly metadata: BanditMetadata) {
  }

  pick (options: BanditPickOptions): Promise<BanditArm | undefined> {
    throw new Error('Method not implemented.')
  }

  toString () {
    return {
      identifier: this.identifier,
      arms: this.arms,
      metadata: this.metadata
    }
  }
}

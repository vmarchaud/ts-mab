import { BanditPickOptions, BanditArm } from '../types'
import { rbeta, maxIndex } from '../math'
import { BaseBandit } from './base'

export class ThompsonSamplingBandit extends BaseBandit {

  async pick (options: BanditPickOptions): Promise<BanditArm | undefined> {
    // compute arms that we want to actually use
    const armSubset = this.arms
      .filter(arm => options.excludeArms.includes(arm.identifier) === false)
      .filter(arm => options.includeArms.length === 0 || options.includeArms.includes(arm.identifier))
    return this._chooseArm(armSubset)
  }

  private _chooseArm (subset: BanditArm[]): BanditArm | undefined {
    // get the highest element index on the beta distribution
    const idx = maxIndex(subset.map(arm => {
      // Draw random sample from beta distribution
      return rbeta(1 + arm.successes, 1 + arm.trials - arm.successes)
    }))
    return subset[idx]
  }
}

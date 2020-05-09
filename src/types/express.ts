import { BanditManager } from '../bandits/manager'

declare global {
  namespace Express {
    export interface Request {
      manager: BanditManager
    }
  }
}

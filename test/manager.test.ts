import test, { after, before } from 'ava'
import { BanditManager } from '../src/bandits/manager'
import { BanditStoreType } from '../src/bandits/store/types'
import { BanditType } from '../src/bandits/types'
import IORedis from 'ioredis'

const randomString = () => Math.random().toString(36).substring(7)

let redis: IORedis.Redis
before(async () => {
  redis = new IORedis()
  await redis.flushall()
})

after(async () => {
  redis.disconnect()
})

test('should create bandit manager', t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })
  t.deepEqual(typeof manager.init, 'function')
})

test('should create bandit store', async t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })

  await t.notThrowsAsync(() => {
    return manager.init()
  })
})

test('should create bandit', async t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })

  await manager.init()
  const options = {
    identifier: randomString(),
    arms: ['1', '2', '3'],
    scope: 'myscope'
  }
  const bandit = await manager.create(options)
  t.deepEqual(bandit.arms.map(arm => arm.identifier), options.arms)
  t.deepEqual(bandit.metadata.scope, options.scope)
  const armsInRedis = await redis.smembers(`${options.identifier}:arms`)
  t.deepEqual(armsInRedis, options.arms)
})

test('should pick one arm', async t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })

  await manager.init()
  const options = {
    identifier: randomString(),
    arms: ['1', '2', '3'],
    scope: 'myscope'
  }
  const bandit = await manager.create(options)
  const result = await manager.pick({
    armsCount: 1,
    identifier: options.identifier,
    pickId: 'random'
  })
  t.assert(result.pickId === 'random')
  t.assert(result.arms.length === 1)
  const pickedArm = result.arms[0]
  const trialCount = await redis.hget(`${options.identifier}:trials`, pickedArm)
  t.assert(trialCount === '1')
})

test('should pick and reward one arm', async t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })

  await manager.init()
  const options = {
    identifier: randomString(),
    arms: ['1', '2', '3'],
    scope: 'myscope'
  }
  const bandit = await manager.create(options)
  const result = await manager.pick({
    armsCount: 1,
    identifier: options.identifier,
    pickId: 'random'
  })
  t.assert(result.pickId === 'random')
  t.assert(result.arms.length === 1)
  const pickedArm = result.arms[0]
  const trialCount = await redis.hget(`${options.identifier}:trials`, pickedArm)
  t.assert(trialCount === '1')
  await manager.reward({ arm: pickedArm, identifier: options.identifier })
  const successCount = await redis.hget(`${options.identifier}:successes`, pickedArm)
  t.assert(successCount === '1')
})

test('should not always take the same arm', async t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })

  await manager.init()
  const options = {
    identifier: randomString(),
    arms: ['1', '2', '3'],
    scope: 'myscope'
  }
  await manager.create(options)
  for (let i = 0; i < 100; i++) {
    await manager.pick({
      armsCount: 1,
      identifier: options.identifier,
      pickId: `random-${i}`
    })
  }
  const bandit = await manager.get(options.identifier)
  t.assert(bandit.arms.every(arm => arm.trials > 20))
})

test('should pick multiple arms', async t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })

  await manager.init()
  const options = {
    identifier: randomString(),
    arms: ['1', '2', '3', '4', '5'],
    scope: 'myscope'
  }
  await manager.create(options)
  const result = await manager.pick({
    armsCount: 3,
    identifier: options.identifier,
    pickId: 'random'
  })
  t.assert(result.pickId === 'random')
  t.assert(result.arms.length === 3)
  for (let arm of result.arms) {
    const trialCount = await redis.hget(`${options.identifier}:trials`, arm)
    t.assert(trialCount === '1')
  }
})

test('should pick maximum arm if request above available', async t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })

  await manager.init()
  const options = {
    identifier: randomString(),
    arms: ['1', '2', '3', '4', '5'],
    scope: 'myscope'
  }
  await manager.create(options)
  const result = await manager.pick({
    armsCount: 10,
    identifier: options.identifier,
    pickId: 'random'
  })
  t.assert(result.pickId === 'random')
  t.assert(result.arms.length === 5)
  for (let arm of result.arms) {
    const trialCount = await redis.hget(`${options.identifier}:trials`, arm)
    t.assert(trialCount === '1')
  }
})

test('should get the same pick for same pickId', async t => {
  const manager = new BanditManager({
    store: {
      type: BanditStoreType.REDIS,
      options: {}
    },
    banditType: BanditType.THOMPSON
  })

  await manager.init()
  const options = {
    identifier: randomString(),
    arms: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    scope: 'myscope'
  }
  await manager.create(options)
  const result = await manager.pick({
    armsCount: 2,
    identifier: options.identifier,
    pickId: 'random'
  })
  t.assert(result.pickId === 'random')
  t.assert(result.arms.length === 2)
  const resultTwo = await manager.pick({
    armsCount: 2,
    identifier: options.identifier,
    pickId: 'random'
  })
  t.deepEqual(resultTwo, result)
})

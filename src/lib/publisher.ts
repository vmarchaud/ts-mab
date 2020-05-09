
import { PubSub, Topic } from '@google-cloud/pubsub'
import settings from '../../config'

export type PublisherOptions = {
  projectId: string
  topic: string
}

const sleep = (time: number) => {
  return new Promise((resolve) => {
    return setTimeout(resolve, time)
  })
}

export class Publisher {

  private pubsub: PubSub | undefined
  private topic: Topic | undefined
  /**
   * Keep a state about if we are publishing, will be used when we receive a
   * SIGTERM to wait for completion before stoping the app.
   */
  private isPublishing: boolean = false

  async init (options: PublisherOptions) {
    this.pubsub = new PubSub(options)
    this.topic = this.pubsub.topic(options.topic)
    this.topic.setPublishOptions({
      batching: {
        maxMessages: parseInt(settings.get('PUBSUB_BUFFER_SIZE') ?? 500, 10)
      }
    })
  }

  async publish (payload: unknown): Promise<void> {
    if (this.topic === undefined) {
      throw new Error(`Publisher hasn't been init`)
    }
    this.isPublishing = true
    await this.topic.publishMessage({
      json: payload
    })
    this.isPublishing = false
  }

  async destroy (): Promise<void> {
    if (this.topic === undefined) return Promise.resolve()
    // wait that we finished publishing event before destroying
    while (this.isPublishing === true) {
      await sleep(50)
    }
    this.topic = undefined
    this.pubsub = undefined
  }
}

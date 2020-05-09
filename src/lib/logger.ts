import settings from '../../config'
import logging from '@rlvt/logging'

export default logging({
  name: settings.SERVICE_NAME,
  level: settings.LOG_LEVEL as any
})

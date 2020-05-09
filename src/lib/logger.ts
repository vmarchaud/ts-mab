import settings from '../../config'
import logging from '@rlvt/logging'

export default logging({
  name: process.env.SERVICE_NAME ?? 'mab-next',
  level: settings.get('LOG_LEVEL')
})

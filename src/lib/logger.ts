import settings from '../../config'
import logging from '@rlvt/logging'

export default logging({
  name: 'tracking-ingester',
  level: settings.get('LOG_LEVEL')
})

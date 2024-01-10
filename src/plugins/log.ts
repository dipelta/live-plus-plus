import logger from 'electron-log'

import {app} from 'electron'

logger.transports.file.level = 'debug'
logger.transports.file.maxSize = 1002430 // 10M
logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'
let date = new Date()
let dateTime = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
logger.transports.file.file = app.getPath('userData') + '/electron_log_' + dateTime + '.log'

export default {
  info(param) {
    logger.info(param)
  },
  warn(param) {
    logger.warn(param)
  },
  error(param) {
    logger.error(param)
  },
  debug(param) {
    logger.debug(param)
  },
  verbose(param) {
    logger.verbose(param)
  },
  silly(param) {
    logger.silly(param)
  }
}

import Datastore from 'lowdb'
// @ts-ignore
import LodashId from 'lodash-id'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import fs from 'fs-extra'
import AppConfig from '../../main/config/appConf'
import { remote, app } from 'electron'

const APP = process.type === 'renderer' ? remote.app : app
const STORE_PATH = APP.getPath('userData')

if (process.type !== 'renderer') {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
}

class DB {
  private db: Datastore.LowdbSync<Datastore.AdapterSync>

  constructor () {
    const adapter = new FileSync(path.join(STORE_PATH, '/data.json'))
    const self = this
    this.db = Datastore(adapter)
    this.db._.mixin(LodashId)
    // 程序默认配置数据
    if (!this.db.has('system-config').value()) {
      const config = AppConfig.getAppDefaultConfig()
      this.db.set('system-config', config).write()
    } else {
      // 检查每一项配置是否符合
      this.setDefaultAppConfig()
    }
    // 直播平台默认订阅数据
    const platformArr = ['douyu', 'huya', 'bilibili']
    platformArr.forEach(function (item) {
      if (!self.db.has(item).value()) {
        self.db.set(item, []).write()
      }
    })
  }

  /**
   * @todo 设置默认的程序配置数据
   */
  private setDefaultAppConfig () {
    // 默认配置列表
    const appConfList = AppConfig.getAppDefaultConfigList()
    // 默认配置参数
    const defaultConfig = AppConfig.getAppDefaultConfig()
    // 数据库中存在的配置
    const dbConfig = this.get('system-config')
    // console.log(dbConfig)
    // 检查应该具有的配置
    for (const appConfigKey in appConfList) {
      const k = appConfigKey
      // @ts-ignore
      const appConfigValue = appConfList[appConfigKey]
      if (dbConfig[appConfigKey]) {
        // @ts-ignore
        const dbConfigValue = dbConfig[appConfigKey] // 读取数据库中的配置
        // 判断db中的配置是否符合配置文件列表中允许的值
        let status = false
        for (const index in appConfigValue) {
          const itemValue = appConfigValue[index]
          const value = itemValue.value
          if (parseInt(value) === parseInt(dbConfigValue)) {
            // console.log('ok')
            status = true
          }
        }
        if (!status) {
          // console.log('发现配置文件有错误')
          // @ts-ignore
          dbConfig[k] = defaultConfig[appConfigKey]
          this.db.set('system-config', dbConfig).write()
        }
      } else {
        // console.log('发现配置不存在')
        // @ts-ignore
        dbConfig[k] = defaultConfig[appConfigKey]
        this.db.set('system-config', dbConfig).write()
      }
    }
  }

  read () {
    return this.db.read()
  }

  get (key = '') {
    return this.read().get(key).value()
  }

  set (key: string, value: any) {
    return this.read().set(key, value).write()
  }

  has (key: string) {
    return this.read().has(key).value()
  }

  insert (key: string, value: any): void {
    // @ts-ignore
    return this.read().get(key).insert(value).write()
  }

  unset (key: string, value: any): boolean {
    return this.read().get(key).unset(value).value()
  }

  getById (key: string, id: string) {
    // @ts-ignore
    return this.read().get(key).getById(id).value()
  }

  removeById (key: string, id: string) {
    // @ts-ignore
    return this.read().get(key).removeById(id).write()
  }
}

export default new DB()

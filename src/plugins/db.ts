import Datastore from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import fs from 'fs-extra'
import {app} from 'electron'
import {join} from "node:path"
import {api} from "./api";
import appConfig from '../../electron/conf/app';

const APP = process.type === 'renderer' ? require('@electron/remote').app : app
const STORE_PATH = APP.getPath('userData')

if (process.type !== 'renderer') {
  if (!fs.pathExistsSync(STORE_PATH)) {
    fs.mkdirpSync(STORE_PATH)
  }
}
process.env.DBPATH = join(STORE_PATH, '/data.json')

class DB {

  private static _instance: DB;

  private static lowdb: Datastore.LowdbSync<Datastore.AdapterSync>

  private constructor() {
  }

  public static getInstance() {
    if (!this._instance) {
      const adapter = new FileSync(process.env.DBPATH)
      this.lowdb = Datastore(adapter)
      this._instance = new DB()
    }
    return this._instance
  }

  /**
   * 注册client_code
   *
   * 如果本地已经存在了以前的client_code，则不进行覆盖
   *
   * @param clientCode
   */
  public registerClient(clientCode) {
    const oldClientCode = this.getLocalClientCode()
    const config = appConfig.getDefaultAppConfig()
    if (oldClientCode) {
      return oldClientCode
    } else {
      DB.lowdb.defaults({
        follows: {
          douyu: [],
          bilibili: [],
          huya: [],
        },
        app_config: config
      }).write()
      DB.lowdb.set('client_code', clientCode).write()
    }
    return clientCode
  }

  public getLocalClientCode() {
    return DB.lowdb.read().get('client_code').value()
  }

  public isFollow(platformTab, roomId) {
    const platformType = api.getPlatformType(platformTab)
    const follows = DB.lowdb.get('follows.' + platformType).value()
    return follows.indexOf(roomId) === -1 ? false : true
  }

  public addFollow(platformTab, roomId) {
    const platformType = api.getPlatformType(platformTab)
    const follows = DB.lowdb.get('follows.' + platformType).value()
    follows.push(roomId)
    DB.lowdb.set('follows.' + platformType, follows).write()
  }

  public delFollow(platformTab, roomId) {
    const platformType = api.getPlatformType(platformTab)
    const follows = DB.lowdb.get('follows.' + platformType).value()
    follows.splice(follows.indexOf(roomId), 1)
    DB.lowdb.set('follows.' + platformType, follows).write()
  }

  public syncFollow(clientCode) {
    api.followData(clientCode).then((allFollowsResponse) => {
      let data = {douyu: [], bilibili: [], huya: []}
      if (allFollowsResponse.code === 200) {
        const allFollows = allFollowsResponse.data
        for (let i = 0; i < allFollows.length; i++) {
          if (allFollows[i].platform_type === 'douyu') {
            data.douyu.push(allFollows[i].room_id)
          } else if (allFollows[i].platform_type === 'bilibili') {
            data.bilibili.push(allFollows[i].room_id)
          } else if (allFollows[i].platform_type === 'huya') {
            data.huya.push(allFollows[i].room_id)
          }
        }
        DB.lowdb.set('follows.douyu', data.douyu).write()
        DB.lowdb.set('follows.bilibili', data.bilibili).write()
        DB.lowdb.set('follows.huya', data.huya).write()
      }
    })
  }

  public syncAppConfig(clientCode) {
    api.bindInfo(clientCode).then((response) => {
      if (response.code === 200) {
        const configs = response.data
        this.setAppConfig(configs.app_config)
      }
    })
  }

  public getPlatformFollows(platformTab) {
    const platformType = api.getPlatformType(platformTab)
    return DB.lowdb.get('follows.' + platformType).value()
  }

  public getAllPlatformFollows() {
    return DB.lowdb.get('follows').value()
  }

  public setAppConfig(config) {
    if (config) {
      DB.lowdb.set('app_config', config).write()
    }
  }

  public getAppConfig(key = null) {
    if (key === null) {
      return DB.lowdb.get('app_config').value()
    }
    return DB.lowdb.get('app_config.' + key).value()
  }

}

export default DB.getInstance()

import Commontool from '../plugins/commontool'
import Douyu from '../plugins/livetool/douyu'
import Huya from '../plugins/livetool/huya'
import Bilibili from '../plugins/livetool/bilibili'
import DB from '../plugins/db'

class Livetool {
  getDouyuInfo (roomId: any) {
    const infoPromise = Douyu.getDouyuMainInfo(roomId)
    const hotPromise = Douyu.getDouyuHot(roomId)
    // @ts-ignore
    return Promise.all([infoPromise, hotPromise]).then(function (data:[object, any]) {
      if (data[0] && data[1]) {
        const info:object = data[0]
        // @ts-ignore
        info.hot = data[1]
        return Commontool.makeResult(0, 'success', info)
      } else {
        return Commontool.makeResult(100, 'fail', null)
      }
    }).catch(function (error: any) {
      console.log('catch:' + error.message)
      return Commontool.makeResult(101, error.message, null)
    })
  }

  /**
   * @todo 获取虎牙直播间的主播信息
   * @param roomId
   */
  getHuyaInfo (roomId: any) {
    const infoPromise = Huya.getHuyaInfo(roomId)
    // @ts-ignore
    return Promise.all([infoPromise]).then(function (data:any[]) {
      if (data && data[0]) {
        data = data[0]
        return Commontool.makeResult(0, 'success', data)
      } else {
        return Commontool.makeResult(100, 'fail', null)
      }
    }).catch(function (error: any) {
      console.log('catch:' + error.message)
      return Commontool.makeResult(101, error.message, null)
    })
  }

  /**
   * @todo 获取B站直播间的主播信息
   * @param roomId
   */
  getBilibiliInfo (roomId: any) {
    const promise = Bilibili.getBilibiliInfo(roomId)
    // @ts-ignore
    return Promise.all([promise]).then(function (data:any[]) {
      if (data && data[0]) {
        data = data[0]
        return Commontool.makeResult(0, 'success', data)
      } else {
        return Commontool.makeResult(100, 'fail', null)
      }
    }).catch(function (error: any) {
      console.log('catch:' + error.message)
      return Commontool.makeResult(101, error.message, null)
    })
  }

  /**
   * @todo 获取直播平台的数据库键值
   * @param platform
   */
  getPlatformById (platform: number | undefined) {
    if (platform === 0) {
      return 'douyu'
    } else if (platform === 1) {
      return 'huya'
    } else if (platform === 2) {
      return 'bilibili'
    } else {
      return false
    }
  }

  /**
   * @todo 主播数据保存数据到数据库中
   * @param platformId
   * @param data
   */
  saveToDB (platformId: number | undefined, data: any) {
    let list: any[]
    const platform = this.getPlatformById(platformId)
    if (platform) {
      list = DB.get(platform)
      const dbConfig = DB.get('system-config')
      const sortType = dbConfig.listSortType
      if (sortType === 2) {
        // 根据直播状态进行添加 - is_live
        const online: any[] = []
        const replay: any[] = []
        const offline: any[] = []
        list.forEach(function (item: any, index: any) {
          if (item.is_live === 1) {
            online.push(item)
          } else if (item.is_live === 2) {
            offline.push(item)
          } else {
            replay.push(item)
          }
        })
        if (data.is_live === 1) {
          online.push(data)
        } else if (data.is_live === 2) {
          offline.push(data)
        } else {
          replay.push(data)
        }
        replay.forEach(function (item: any, index: any) {
          online.push(item)
        })
        offline.forEach(function (item: any, index: any) {
          online.push(item)
        })
        DB.set(platform, online)
      } else {
        list.push(data)
        DB.set(platform, list)
      }
      return true
    } else {
      return false
    }
  }
}

export default new Livetool()

import db from '../plugins/db'

class Commontool {
  /**
   * @todo 格式化返回值对象
   * @param errorCode
   * @param errorMsg
   * @param data
   */
  makeResult (errorCode: number, errorMsg: string, data: any) {
    return {
      errorCode: errorCode,
      errorMsg: errorMsg,
      data: data
    }
  }

  /**
   * @todo 计算直播时长
   * @param liveTime
   */
  encodeLiveTime (liveTime: number) {
    const nowTime = parseInt(String(new Date().getTime() / 1000))
    const time = nowTime - liveTime
    const hour = parseInt(String(time / 3600))
    const min = parseInt(String((time - hour * 3600) / 60))
    if (min < 10) {
      return hour + 'h:0' + min
    } else {
      return hour + 'h:' + min
    }
  }

  /**
   * @todo 获取日期
   * @param formate
   */
  dateFormate (formate: string) {
    const date = new Date()
    let month: string | number = date.getMonth() + 1
    let strDate: string | number = date.getDate()
    if (month <= 9) {
      month = '0' + month
    }
    if (strDate <= 9) {
      strDate = '0' + strDate
    }
    if (formate === 'ymd') {
      return String(date.getFullYear()) + month + strDate
    } else {
      return ''
    }
  }

  sortList (dbName: string) {
    // 进行排序逻辑判断
    // console.log(dbName)
    const dbConfig = db.get('system-config')
    const sortType = dbConfig.listSortType
    if (sortType === 2) {
      // console.log('按照直播状态排序')
      // 按照直播状态排序，开播-录像-下播
      const list = db.get(dbName)
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
      replay.forEach(function (item: any, index: any) {
        online.push(item)
      })
      offline.forEach(function (item: any, index: any) {
        online.push(item)
      })
      db.set(dbName, online)
    }
  }

  /**
   * @todo 获取配置文件中-列表刷新频率的时间（毫秒）
   */
  getlistRefreshRateTime () {
    const dbConfig = db.get('system-config')
    let time = 60 * 1000
    if (dbConfig.listRefreshRate === 2) {
      time = time * 5
    } else if (dbConfig.listRefreshRate === 3) {
      time = time * 15
    }
    return time
  }

  /**
   * @todo 获取配置中的-暂停后再播放事件
   */
  getVideoReplayEvent () {
    const dbConfig = db.get('system-config')
    return dbConfig.videoReplayEvent
  }

  /**
   * @todo 获取配置中的-主播列表排序方式
   */
  getListSortType () {
    const dbConfig = db.get('system-config')
    return dbConfig.listSortType
  }

  /**
   * @todo 获取配置中的-点击主播事件
   */
  getListClickEvent () {
    const dbConfig = db.get('system-config')
    return dbConfig.listClickEvent
  }

  /**
   * @todo 获取配置中的-播放器自动开启弹幕
   */
  getShowDanmakuConf () {
    const dbConfig = db.get('system-config')
    return dbConfig.showDanmaku
  }

  // message (str: string) {
  //   const len = str.length
  //   const buf = Buffer.alloc(len + 12)
  //   buf.writeUInt16LE(len + 8, 0)
  //   buf.writeUInt16LE(len + 8, 4)
  //   buf.writeUInt16BE(45314, 8)
  //   buf.write(str, 12)
  //   return buf
  // }
}

export default new Commontool()

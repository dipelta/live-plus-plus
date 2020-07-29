import https from 'https'
import db from '../db'
import commontool from '../commontool'

class Bilibili {
  /**
   * @todo 获取B站主播信息
   * @param roomId
   */
  getBilibiliInfo (roomId: any) {
    const url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getInfoByRoom?room_id=' + roomId
    return new Promise(function (resolve, reject) {
      https.get(url, function (response) {
        const statusCode = response.statusCode
        const contentType = response.headers['content-type']
        if (statusCode !== 200 || contentType !== 'application/json; charset=utf-8') {
          console.log(statusCode + '--' + contentType)
          response.resume()
          reject(new Error('无法获取B站主播信息'))
          return null
        }
        let rawData = ''
        response.on('data', function (chunk) {
          rawData += chunk
        })
        response.on('end', function () {
          let data = null
          const parsedData = JSON.parse(rawData)
          if (parsedData.code === 0) {
            const liveStatus = parsedData.data.room_info.live_status === 1 ? 1 : 2
            data = {
              up_name: parsedData.data.anchor_info.base_info.uname,
              room_name: parsedData.data.room_info.title,
              room_id: parsedData.data.room_info.room_id,
              up_avatar: parsedData.data.anchor_info.base_info.face,
              is_live: liveStatus,
              live_time: parsedData.data.room_info.live_start_time,
              hot: String(parsedData.data.room_info.online)
            }
          }
          resolve(data)
        })
      })
    })
  }

  /**
   * @todo 取消订阅
   */
  deleteLiver (item:any, index:number) {
    const list:Array<any> = db.get('bilibili')
    list.splice(index, 1)
    db.set('bilibili', list)
  }

  /**
   * @todo 刷新数据库中所有的B站主播信息
   */
  refreshList () {
    const listData = db.get('bilibili')
    const self = this
    listData.forEach(function (item:any, index:number) {
      const roomId = item.room_id
      const infoPromise = self.getBilibiliInfo(roomId)
      // @ts-ignore
      Promise.all([infoPromise]).then(function (data:any[]) {
        if (data && data[0]) {
          data = data[0]
          listData[index] = data
          db.set('bilibili', listData)
          commontool.sortList('bilibili')
        }
      }).catch(function (error: any) {
        console.log('catch:' + error.message)
      })
    })
  }

  /**
   * @todo 获取直播源
   * @param item
   */
  getLiveUrl (item:any) {
    return Bilibili.getLiveUrlByApi(item.room_id).catch(function (error: any) {
      console.log('catch:' + error.message)
      return false
    })
  }

  private static getLiveUrlByApi (roomId: string) {
    const apiUrl = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomPlayInfo?room_id=' + roomId + '&play_url=1&qn=10000&platform=web'
    return new Promise(function (resolve, reject) {
      https.get(apiUrl, function (response) {
        const statusCode = response.statusCode
        const contentType = response.headers['content-type']
        if (statusCode !== 200 || contentType !== 'application/json; charset=utf-8') {
          response.resume()
          console.log('无法获取B站直播地址，请求失败')
          resolve(false)
          return null
        }
        let rawData = ''
        response.on('data', function (chunk) {
          rawData += chunk
        })
        response.on('end', function () {
          const parsedData = JSON.parse(rawData)
          if (parsedData.code === 0) {
            const url = parsedData.data.play_url.durl[0].url
            resolve(url)
          } else {
            resolve(false)
          }
        })
      })
    })
  }

  /**
   * @todo 获取B站弹幕的websocket地址
   */
  getDanmuWssUrl (roomId: string) {
    const url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=' + roomId + '&type=0'
    return new Promise(function (resolve, reject) {
      https.get(url, function (response) {
        const statusCode = response.statusCode
        const contentType = response.headers['content-type']
        if (statusCode !== 200 || contentType !== 'application/json; charset=utf-8') {
          response.resume()
          console.log('无法获取B站[弹幕]地址，请求失败')
          resolve(false)
          return null
        }
        let rawData = ''
        response.on('data', function (chunk) {
          rawData += chunk
        })
        response.on('end', function () {
          const parsedData = JSON.parse(rawData)
          if (parsedData.code === 0) {
            // wss://tx-sh-live-comet-01.chat.bilibili.com/sub
            const url = 'wss://' + parsedData.data.host_list[0].host + '/sub'
            const token = parsedData.data.token
            resolve([url, token])
          } else {
            resolve(false)
          }
        })
      })
    })
  }

  /**
   * @todo B站弹幕-数据打包
   * @param roomId
   * @param bilibiliToken
   * @param type 1-进入房间数据包，2-心跳包
   */
  packMsg (roomId: string, bilibiliToken: string, type: any) {
    if (type === 1) {
      const data = {
        uid: 0,
        roomid: roomId,
        protover: 2,
        platform: 'web',
        clientver: '1.14.3',
        type: 2,
        key: bilibiliToken
      }
      const jsonData = JSON.stringify(data)
      const len = jsonData.length
      const buff = Buffer.alloc(len + 16)
      buff.writeUInt16BE(len + 16, 2)
      buff.writeUInt16BE(16, 4)
      buff.writeUInt16BE(1, 6)
      buff.writeUInt16BE(7, 10)
      buff.writeUInt16BE(1, 14)
      buff.write(jsonData, 16)
      return buff
    } else if (type === 2) {
      const jsonData = JSON.stringify({ heart: 1, roomid: roomId, key: bilibiliToken })
      const len = jsonData.length
      const buff = Buffer.alloc(len + 16)
      buff.writeUInt16BE(len + 16, 2)
      buff.writeUInt16BE(16, 4)
      buff.writeUInt16BE(1, 6)
      buff.writeUInt16BE(2, 10)
      buff.writeUInt16BE(1, 14)
      buff.write(jsonData, 16)
      return buff
    } else {
      return false
    }
  }

  /**
   * @todo 解包
   * @param data
   */
  unPackMsg (data: any) {
    const resultArr: any[] = []
    const dataArr = data.split('{"cmd":')
    dataArr.forEach(function (value: string) {
      const firstChar = value.substr(0, 1)
      if (firstChar === '"') {
        let tempStr = ''
        for (let i = 1; i < 32; i++) {
          const lastChar = value.substr(value.length - i, 1)
          if (lastChar === '}') {
            tempStr = value.substr(0, value.length - i + 1)
            break
          }
        }
        try {
          tempStr = '{"cmd":' + tempStr
          const jsonData = JSON.parse(tempStr)
          resultArr.push(jsonData)
        } catch (e) {
        }
      }
    })
    return resultArr
  }
}

export default new Bilibili()

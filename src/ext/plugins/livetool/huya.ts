import https from 'https'
import cheerio from 'cheerio'
import db from '../db'
import commontool from '../commontool'

class Huya {
  /**
   * @todo 获取虎牙主播的主要信息
   * @param roomId
   */
  getHuyaInfo (roomId: any) {
    const url = 'https://www.huya.com/' + roomId
    return new Promise(function (resolve, reject) {
      https.get(url, function (response) {
        const statusCode = response.statusCode
        if (statusCode !== 200) {
          console.log(statusCode + '-----' + response.headers['content-type'])
          response.resume()
          reject(new Error('无法获取虎牙主播信息'))
          return null
        }
        let rawData = ''
        response.on('data', function (chunk) {
          rawData += chunk
        })
        response.on('end', function () {
          let data = null
          const $ = cheerio.load(rawData)
          const upName = $('.host-info .host-name').text() ? $('.host-info .host-name').text() : ''
          const roomName = $('#J_roomTitle').text() ? $('#J_roomTitle').text() : ''
          let upAvatar = $('#avatar-img').attr('src') ? $('#avatar-img').attr('src') : ''
          if (upAvatar.substr(0, 2) === '//') {
            upAvatar = 'https:' + upAvatar
          }
          let hot = '0'
          let isLive = 2
          if (!$('.notice-live').text() && $('#live-count').text()) {
            hot = $('#live-count').text()
            hot = hot.replace(/,/g, '')
            isLive = 1
          }
          if (upName && roomName && upAvatar) {
            data = {
              up_name: upName,
              room_name: roomName,
              room_id: roomId,
              up_avatar: upAvatar,
              hot: hot,
              is_live: isLive,
              live_time: false
            }
          }
          resolve(data)
        })
      }).on('error', function (e) {
      })
    })
  }

  /**
   * @todo 取消订阅
   * @param item
   * @param index
   */
  deleteLiver (item:any, index:number) {
    const list:Array<any> = db.get('huya')
    list.splice(index, 1)
    db.set('huya', list)
  }

  /**
   * @todo 刷新数据库中所有的虎牙平台主播信息
   */
  refreshList () {
    const listData = db.get('huya')
    const self = this
    listData.forEach(function (item:any, index:number) {
      const roomId = item.room_id
      const infoPromise = self.getHuyaInfo(roomId)
      // @ts-ignore
      Promise.all([infoPromise]).then(function (data:any[]) {
        if (data && data[0]) {
          data = data[0]
          listData[index] = data
          db.set('huya', listData)
          commontool.sortList('huya')
        }
      }).catch(function (error: any) {
        console.log('catch:' + error.message)
      })
    })
  }

  /**
   * @todo 获取虎牙网页的关键信息
   * SUBSID，TOPSID，ayyuid
   */
  getChatInfo (roomId: string) {
    const url = 'https://m.huya.com/' + roomId
    const option = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Mobile Safari/537.36'
      }
    }
    return new Promise(function (resolve, reject) {
      https.get(url, option, function (response) {
        if (response.statusCode !== 200) {
          response.resume()
          resolve(false)
        } else {
          let rawData = ''
          response.on('data', function (chunk) {
            rawData += chunk
          })
          response.on('end', function () {
            const subsid = rawData.match(/var SUBSID = '(.*)';/)
            console.log(subsid)
            const topsid = rawData.match(/var TOPSID = '(.*)';/)
            const yyuid = rawData.match(/ayyuid: '(.*)',/)
            if (!subsid || !topsid || !yyuid) {
              resolve(false)
            } else {
              const subsidTemp = subsid[1] === '' ? 0 : parseInt(subsid[1])
              const topsidTemp = topsid[1] === '' ? 0 : parseInt(topsid[1])
              const yyuidTemp = parseInt(yyuid[1])
              const data = {
                subsid: subsidTemp,
                topsid: topsidTemp,
                yyuid: yyuidTemp
              }
              resolve(data)
            }
          })
        }
      }).on('error', function (e) {
      })
    })
  }

  /**
   * @todo 获取直播源
   * @param item
   */
  getLiveUrl (item:any) {
    return Huya.getLiveUrlFromJs(item.room_id).catch(function (error: any) {
      console.log('catch:' + error.message)
      return false
    })
  }

  private static getLiveUrlFromJs (roomId: string) {
    const url = 'https://m.huya.com/' + roomId
    const option = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Mobile Safari/537.36'
      }
    }
    return new Promise(function (resolve, reject) {
      https.get(url, option, function (response) {
        if (response.statusCode !== 200) {
          response.resume()
          resolve(false)
          return false
        }
        let rawData = ''
        response.on('data', function (chunk) {
          rawData += chunk
        })
        response.on('end', function () {
          const regx = /liveLineUrl = "([\s\S]*?)";/
          const realUrl = regx.exec(rawData)
          if (realUrl && realUrl[0] && realUrl[1]) {
            const liveLineUrl = realUrl[1]
            const url = liveLineUrl.replace(new RegExp(/_\d{4}.m3u8/, 'g'), '.m3u8')
            const resUrl = 'https:' + url
            resolve(resUrl)
          } else {
            resolve(false)
          }
        })
      }).on('error', function (e) {
      })
    })
  }
}

export default new Huya()

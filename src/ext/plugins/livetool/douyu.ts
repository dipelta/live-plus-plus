import https from 'https'
import querystring from 'querystring'
import crypto from 'crypto'
import db from '../db'
import commontool from '../commontool'

class Douyu {
  /**
   * @todo 获取斗鱼主播的主要信息
   * @param roomId
   */
  getDouyuMainInfo (roomId: any) {
    const url = 'https://www.douyu.com/betard/' + roomId
    return new Promise(function (resolve, reject) {
      https.get(url, function (response) {
        const statusCode = response.statusCode
        if (statusCode !== 200) {
        // if (statusCode !== 200 || response.headers['content-type'] !== 'application/json;charset=UTF-8') {
          console.log(statusCode + '-----' + response.headers['content-type'])
          response.resume()
          reject(new Error('无法获取主播信息，网络错误'))
          return null
        }
        let rawData = ''
        response.on('data', function (chunk) {
          rawData += chunk
        })
        response.on('end', function () {
          try {
            const parsedData = JSON.parse(rawData)
            let liveStatus = parseInt(parsedData.room.show_status)
            if (liveStatus === 1) {
              if (parsedData.room.rst === 3) {
                liveStatus = 3
              }
            }
            const data = {
              up_name: parsedData.room.nickname,
              room_name: parsedData.room.room_name,
              room_id: roomId,
              up_avatar: parsedData.room.avatar.big,
              is_live: liveStatus,
              live_time: parsedData.room.show_time
            }
            resolve(data)
          } catch (e) {
            reject(new Error('无法获取主播信息，请检查房间号是否正确'))
            return null
          }
        })
      })
    })
  }

  /**
   * @todo 获取斗鱼主播当前热度
   * @param roomId
   */
  getDouyuHot (roomId: any) {
    const url = 'https://m.douyu.com/' + roomId
    return new Promise(function (resolve, reject) {
      https.get(url, function (response) {
        try {
          if (response.statusCode !== 200) {
            response.resume()
            reject(new Error('无法获取斗鱼主播热度'))
            return
          }
          let rawData = ''
          response.on('data', function (chunk) {
            rawData += chunk
          })
          response.on('end', function () {
            const regx = /"hn":"(\d+[.]?\d+万|\d+)"/
            const hotArr = regx.exec(rawData)
            if (hotArr && hotArr[1]) {
              resolve(hotArr[1])
            } else {
              resolve('')
            }
          })
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  /**
   * @todo 刷新数据库中所有的斗鱼平台主播信息
   */
  refreshList () {
    const listData = db.get('douyu')
    const self = this
    listData.forEach(function (item:any, index:number) {
      const roomId = item.room_id
      const infoPromise = self.getDouyuMainInfo(roomId)
      const hotPromise = self.getDouyuHot(roomId)
      // @ts-ignore
      Promise.all([infoPromise, hotPromise]).then(function (data:[object, any]) {
        if (data[0] && data[1]) {
          const info:object = data[0]
          // @ts-ignore
          info.hot = data[1]
          listData[index] = info
          db.set('douyu', listData)
          commontool.sortList('douyu')
        }
      }).catch(function (error: any) {
        console.log('catch:' + error.message + '，房间号：' + roomId)
      })
    })
  }

  /**
   * @todo 取消订阅
   */
  deleteLiver (item:any, index:number) {
    const list:Array<any> = db.get('douyu')
    list.splice(index, 1)
    db.set('douyu', list)
  }

  /**
   * @todo 获取直播源
   * @param item
   */
  getLiveUrl (item:any) {
    const timeMicSec = new Date().getTime()
    const time = parseInt(String(timeMicSec / 1000))
    const today = commontool.dateFormate('ymd')
    const did = '10000000000000000000000000001501'
    return Douyu.getLiveUrlFromWebJS(item.room_id).then(function (data) {
      if (data === false) {
        // 无法从js中获取地址，则获取加密js源码
        return Douyu.getHomeJS(item.room_id)
      } else {
        return [1, data]
      }
    }).then(function (data: any) {
      // @ts-ignore
      if (data[0] && data[0] === 1) {
        return data
      } else {
        return Douyu.getSign(data, item.room_id, did, String(time), today)
      }
    }).then(function (data: any) {
      // @ts-ignore
      if (data[0] && data[0] === 1) {
        // @ts-ignore
        return data[1]
      } else {
        return Douyu.getRealUrlBySign(data, item.room_id, did, String(time), today)
      }
    }).catch(function (error: any) {
      console.log('catch:' + error.message)
      return false
    })
  }

  /**
   * @todo getHomeJS
   * @param roomId
   */
  private static getHomeJS (roomId: string) {
    let homejs: any = null
    return new Promise(function (resolve, reject) {
      try {
        https.get('https://m.douyu.com/' + roomId, function (response) {
          if (response.statusCode !== 200) {
            console.log('get homejs fail')
            response.resume()
            resolve(homejs)
          } else {
            let rawData = ''
            response.on('data', function (chunk) {
              rawData += chunk
            })
            response.on('end', function () {
              const regx = /(function ub9.*)[\s\S](var.*)/
              const result = regx.exec(rawData)
              if (result && result[0]) {
                const res = result[0]
                homejs = res.replace(new RegExp(/eval.*;}/, 'g'), 'strc;}')
                resolve(homejs)
              }
            })
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * @todo 获取sign
   * @param homejs
   * @param roomId
   * @param did
   * @param time
   * @param today
   */
  private static getSign (homejs: string, roomId: string, did: string, time: string, today: string) {
    return new Promise(function (resolve, reject) {
      // eslint-disable-next-line no-eval
      const res2 = eval(homejs + 'ub98484234()')
      const str3 = res2.replace(new RegExp(/\(function[\s\S]*toString\(\)/, 'g'), '\'')
      const md5Content = roomId + did + time + '2501' + today
      const md5rb = crypto.createHash('md5').update(md5Content).digest('hex')
      const str4 = 'function get_sign(){var rb=\'' + md5rb + str3
      const str5 = str4.replace(new RegExp(/return rt;}[\s\S]*/, 'g'), 'return re;};')
      const str6 = str5.replace(new RegExp(/"v=.*&sign="\+/, 'g'), '')
      // eslint-disable-next-line no-eval
      const result = eval(str6 + 'get_sign(' + roomId + ', ' + did + ', ' + time + ')')
      resolve(result)
    })
  }

  /**
   * @todo 使用sign获取直播地址
   * @param sign
   * @param roomId
   * @param did
   * @param time
   * @param today
   */
  private static getRealUrlBySign (sign: string, roomId: string, did: string, time: string, today: string) {
    console.log('使用sign获取斗鱼直播地址')
    return new Promise(function (resolve, reject) {
      const option = {
        host: 'm.douyu.com',
        path: '/api/room/ratestream',
        port: 443,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Mobile Safari/537.36'
        }
      }
      const postData = querystring.stringify({
        v: '2501' + today,
        did: did,
        tt: time,
        sign: sign,
        ver: '219032101',
        rid: roomId,
        rate: -1
      })
      let rawData = ''
      let res = ''
      try {
        const req = https.request(option, function (response) {
          response.on('data', function (chunk) {
            rawData += chunk
          })
          response.on('end', function () {
            const result = JSON.parse(rawData)
            if (result.code === 0) {
              console.log(result.data)
              const url = result.data.url
              const regx = /live\/(\d{1,8}[0-9a-zA-Z]+)_?[\d]{0,4}\/playlist/
              const realUrl = regx.exec(url)
              // console.log(result.data)
              if (realUrl && realUrl[0] && realUrl[1]) {
                // console.log('http end')
                res = 'http://tx2play1.douyucdn.cn/live/' + realUrl[1] + '_4000.flv?uuid='
                resolve(res)
              } else {
                console.log('没有匹配到直播地址')
                console.log('尝试使用第二种方式进行匹配')
                // 尝试使用第二种方式进行匹配
                const regx2 = /dyliveflv\w{1,10}\/(\d{1,8}[0-9a-zA-Z]+)_?[\d]{0,4}.m3u8/
                const realUrl2 = regx2.exec(url)
                if (realUrl2 && realUrl2[0] && realUrl2[1]) {
                  console.log(realUrl2)
                  res = 'http://tx2play1.douyucdn.cn/live/' + realUrl2[1] + '_4000.flv?uuid='
                  resolve(res)
                } else {
                  resolve(false)
                }
              }
            } else {
              resolve(false)
            }
          })
        })
        req.write(postData)
        req.end()
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * @todo 根据斗鱼网页抓取地址的方式获取直播源地址
   * 10000 蓝光10M  _1024
   * 4000  蓝光4M   _4000
   * 2000  超清     _2000
   * 1200  高清     _1200
   * 550   流畅     _550
   * @param roomId
   */
  private static getLiveUrlFromWebJS (roomId: string) {
    console.log('根据斗鱼网页抓取地址的方式获取直播源地址')
    const url = 'https://www.douyu.com/' + roomId
    return new Promise(function (resolve, reject) {
      https.get(url, function (response) {
        if (response.statusCode !== 200) {
          response.resume()
          // reject(new Error('getLiveUrlFromWebJS-无法获取斗鱼直播源地址'))
          resolve(false)
          return false
        }
        let rawData = ''
        response.on('data', function (chunk) {
          rawData += chunk
        })
        response.on('end', function () {
          const regx = /live\/\w{10,90}.flv/
          const realUrl = regx.exec(rawData)
          if (realUrl && realUrl[0]) {
            let resUrl = realUrl[0]
            let res = resUrl.split('/')
            res = res[1].split('.')
            res = res[0].split('_')
            const flag = res[0]
            resUrl = 'http://tx2play1.douyucdn.cn/live/' + flag + '.flv?uuid='
            // if (parseInt(roomId) === 156277) {
            //   resUrl = 'http://tx2play1.douyucdn.cn/live/' + 'flag' + '.flv?uuid='
            // }
            resolve(resUrl)
            // resolve(false)
          } else {
            resolve(false)
          }
        })
      })
    })
  }

  /**
   * @todo 斗鱼弹幕-打包
   * @param msg
   * @param params
   */
  packMsg (msg: string, params: string = '') {
    msg = msg.replace(new RegExp(/:msg/, 'g'), params)
    const len = msg.length
    const buff = Buffer.alloc(len + 12)
    buff.writeUInt16LE(len + 8, 0)
    buff.writeUInt16LE(len + 8, 4)
    buff.writeUInt16BE(45314, 8)
    buff.write(msg, 12)
    return buff
  }

  /**
   * @todo 斗鱼弹幕-解包
   */
  unpackMsg (data: any) {
    // 1.解析出type
    const typeRegx = /type@=(.*?)\//
    const type = typeRegx.exec(data)
    if (type && type[1] && type[1] === 'chatmsg') {
      // 2.解析出内容
      const msgRegx = /\/nn@=([^/]*?)\/txt@=([^/]*?)\//
      const msg = msgRegx.exec(data)
      if (msg && msg[2]) {
        const danmuMsg = msg[2]
        const danmuColor = this.getMsgColor(data)
        return [danmuMsg, danmuColor]
      }
    }
    return false
  }

  /**
   * @todo 获取弹幕的颜色
   * @param data
   */
  getMsgColor (data: any) {
    const colorRegx = /\/col@=([^/]*?)\//
    const color = colorRegx.exec(data)
    let textColor = '#fff'
    if (color && color[1]) {
      switch (color[1]) {
        case '2':
          textColor = '#1e87f0'
          break
        case '3':
          textColor = '#7ac84b'
          break
        case '4':
          textColor = '#ff7f00'
          break
        case '5':
          textColor = '#9b39f4'
          break
        case '6':
          textColor = '#c63434'
          break
      }
    }
    return textColor
  }
}

export default new Douyu()

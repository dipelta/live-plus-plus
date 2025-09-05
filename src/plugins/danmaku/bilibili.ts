import {api} from "../api";
import zlib from 'zlib'
import {ipcRenderer} from "electron";
import axios from "axios";
import md5 from "md5";

class Bilibili {

  // static ws_url = "wss://danmuproxy.douyu.com:8503";

  async connectWs(roomId, callback) {
    let ws = null
    let bilibiliToken = null
    const data = await this.getDanmuWssUrl(roomId)
    // console.log(data)
    ws = new WebSocket(data[0])
    bilibiliToken = data[1]
    ws.onopen = () => {
      console.log('Bilibili：弹幕服务器-' + roomId + '-已连接')
      const inToRoomMsg = this.packMsg(roomId, bilibiliToken, 1)
      if (inToRoomMsg) {
        ws.send(inToRoomMsg)
      }
    }
    ws.onmessage = (msg: any) => {
      const self = this
      const reader = new FileReader()
      reader.readAsArrayBuffer(msg.data)
      reader.onload = () => {
        const buffStr = Buffer.from(reader.result).toString('hex').substr(32)
        const buff = Buffer.from(buffStr, 'hex')
        zlib.inflate(buff, (errors, decoded) => {
          if (decoded) {
            const resultArr = this.unPackMsg(decoded.toString())
            // console.log(resultArr)
            resultArr.forEach(function (data) {
              if (data.cmd === 'DANMU_MSG' && data.info[1]) {
                // console.log(data.info[1], data.info)
                let extra = JSON.parse(data.info[0][15].extra);
                // console.log(extra)
                let color = extra.color.toString(16);
                // console.log(color)
                callback(data.info[1], "#" + color, bilibiliToken)
              }
            })
          }
        })
      }
    }
    ws.onclose = function () {
      console.log('bilibili：弹幕服务器-' + roomId + '-已关闭')
    }
    ws.onerror = function (error) {
      console.log('bilibili：弹幕服务器-' + roomId + '-发生错误')
      // console.log(error)
      // 发送错误到video页面
      ipcRenderer.send('ws-danmaku-connect-error', [])
    }
    return ws
  }

  // 对 imgKey 和 subKey 进行字符顺序打乱编码
  getMixinKey = (orig) => {
    const mixinKeyEncTab = [
      46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
      33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
      61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
      36, 20, 34, 44, 52
    ]
    return mixinKeyEncTab.map(n => orig[n]).join('').slice(0, 32)
  }

  // 为请求参数进行 wbi 签名
  encWbi(params, img_key, sub_key) {
    const mixin_key = this.getMixinKey(img_key + sub_key),
        curr_time = Math.round(Date.now() / 1000),
        chr_filter = /[!'()*]/g

    Object.assign(params, { wts: curr_time }) // 添加 wts 字段
    // 按照 key 重排参数
    const query = Object
        .keys(params)
        .sort()
        .map(key => {
          // 过滤 value 中的 "!'()*" 字符
          const value = params[key].toString().replace(chr_filter, '')
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        })
        .join('&')

    const wbi_sign = md5(query + mixin_key) // 计算 w_rid

    return query + '&w_rid=' + wbi_sign
  }

  // 获取最新的 img_key 和 sub_key
  async getWbiKeys() {
    const res = await fetch('https://api.bilibili.com/x/web-interface/nav', {
      headers: {
        // SESSDATA 字段
        Cookie: 'SESSDATA=xxxxxx',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        Referer: 'https://www.bilibili.com/'//对于直接浏览器调用可能不适用
      }
    })
    const { data: { wbi_img: { img_url, sub_url } } } = await res.json()

    return {
      img_key: img_url.slice(
          img_url.lastIndexOf('/') + 1,
          img_url.lastIndexOf('.')
      ),
      sub_key: sub_url.slice(
          sub_url.lastIndexOf('/') + 1,
          sub_url.lastIndexOf('.')
      )
    }
  }

  async getDanmuWssUrl(roomId: string) {
    const web_keys = await this.getWbiKeys()
    const params = { id: roomId },
        img_key = web_keys.img_key,
        sub_key = web_keys.sub_key
    const query = this.encWbi(params, img_key, sub_key)
    const url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?' + query
    let response = await axios.get(url)
    // console.log(response)
    response = response.data
    if (response.code !== 0) {
      return false
    }

    const wsurl = 'wss://' + response.data.host_list[0].host + '/sub'
    const token = response.data.token
    return [wsurl, token]
  }


  packMsg(roomId: string, bilibiliToken: string, type: any) {
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
      const jsonData = JSON.stringify({heart: 1, roomid: roomId, key: bilibiliToken})
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

  unPackMsg(data: any) {
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

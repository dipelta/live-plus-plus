import {api} from "../api";
import zlib from 'zlib'
import {ipcRenderer} from "electron";
import axios from "axios";

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
              // console.log(data)
              if (data.cmd === 'DANMU_MSG' && data.info[1]) {
                callback(data.info[1], "#"+data.info[0][7].substring(0,6), bilibiliToken)
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

  async getDanmuWssUrl(roomId: string) {
    const url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?id=' + roomId + '&type=0'
    // const response = await api.sendGet(url)
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

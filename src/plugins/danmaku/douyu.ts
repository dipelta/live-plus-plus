import crypto from "crypto";

class Douyu {

  static ws_url = "wss://danmuproxy.douyu.com:8503";

  connectWs(roomId, callback) {
    let ws = new WebSocket(Douyu.ws_url)
    ws.onopen = () => {
      console.log('斗鱼：弹幕服务器-' + roomId + '-已连接')
      ws.send(this.packMsg('type@=loginreq/roomid@=:msg/\0', roomId))
      ws.send(this.packMsg('type@=joingroup/rid@=:msg/gid@=-1/\0', roomId))
      ws.send(this.packMsg('type@=mrkl/\0'))
    }
    ws.onmessage = (msg) => {
      const reader = new FileReader()
      reader.readAsText(msg.data, 'utf-8')
      reader.onload = () => {
        const data = reader.result.toString()
        const unpackData = this.unpackMsg(data)
        if (unpackData !== false) {
          const danmuMsg = unpackData[0]
          const danmuColor = unpackData[1]
          callback(danmuMsg, danmuColor)
        }
      }
    }
    ws.onclose = function () {
      console.log('斗鱼：弹幕服务器-' + roomId + '-已关闭')
    }
    ws.onerror = function () {
      console.log('斗鱼：弹幕服务器-' + roomId + '-发生错误')
    }
    return ws
  }

  packMsg(msg: string, params: string = '') {
    msg = msg.replace(new RegExp(/:msg/, 'g'), params)
    const len = msg.length
    const buff = Buffer.alloc(len + 12)
    buff.writeUInt16LE(len + 8, 0)
    buff.writeUInt16LE(len + 8, 4)
    buff.writeUInt16BE(45314, 8)
    buff.write(msg, 12)
    return buff
  }

  unpackMsg(data) {
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

  getMsgColor(data: any) {
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

import {api} from "../api";
import {HUYA, Taf, TafMx} from "huya-danmu/lib";
import to_arraybuffer from "to-arraybuffer"
import md5 from "md5"
import events from "events";

class Huya {

  async getChatInfo(roomId) {
    const data = await api.huyaChatInfo(roomId)
    return data.data
  }

  async connectWs(chat, roomId, callback) {


    let main_user_id = new HUYA.UserId()
    main_user_id.lUid = chat.yyuid
    main_user_id.sHuYaUA = "webh5&1.0.0&websocket"

    let info = {}
    info.subsid = chat.lSubChannelId
    info.topsid = chat.lChannelId
    info.yyuid = parseInt(chat.lYyid)

    let _emitter = new events.EventEmitter()

    let client = new WebSocket("ws://ws.api.huya.com")

    client.onopen = () => {
      console.log('虎牙：弹幕服务器-' + roomId + '-已连接')

      //_bind_ws_info
      let ws_user_info = new HUYA.WSUserInfo;
      ws_user_info.lUid = info.yyuid
      ws_user_info.bAnonymous = 0 === info.yyuid
      ws_user_info.sGuid = main_user_id.sGuid
      ws_user_info.sToken = ""
      ws_user_info.lTid = info.topsid
      ws_user_info.lSid = info.subsid
      ws_user_info.lGroupId = info.yyuid
      ws_user_info.lGroupType = 3
      let jce_stream = new Taf.JceOutputStream()
      ws_user_info.writeTo(jce_stream)
      let ws_command = new HUYA.WebSocketCommand()
      ws_command.iCmdType = HUYA.EWebSocketCommandType.EWSCmd_RegisterReq
      ws_command.vData = jce_stream.getBinBuffer()
      jce_stream = new Taf.JceOutputStream()
      ws_command.writeTo(jce_stream)
      client.send(jce_stream.getBuffer())
      // _heartbeat
      this.heartbeat(info, main_user_id, client)

      _emitter.emit('connect')
    }

    client.onmessage = (message) => {
      const reader = new FileReader()
      reader.readAsArrayBuffer(message.data)
      reader.onload = () => {
        const buffStr = Buffer.from(reader.result).toString('hex')
        const buff = Buffer.from(buffStr, 'hex')
        let data = to_arraybuffer(buff)
        let stream = new Taf.JceInputStream(data)
        let command = new HUYA.WebSocketCommand()
        command.readFrom(stream)
        switch (command.iCmdType) {
          case HUYA.EWebSocketCommandType.EWSCmd_WupRsp:
            let wup = new Taf.Wup()
            wup.decode(command.vData.buffer)
            let map = new (TafMx.WupMapping[wup.sFuncName])()
            wup.readStruct('tRsp', map, TafMx.WupMapping[wup.sFuncName])
            _emitter.emit(wup.sFuncName, map)
            break
          case HUYA.EWebSocketCommandType.EWSCmdS2C_MsgPushReq:
            stream = new Taf.JceInputStream(command.vData.buffer)
            let msg = new HUYA.WSPushMessage()
            msg.readFrom(stream)
            stream = new Taf.JceInputStream(msg.sMsg.buffer)
            if (TafMx.UriMapping[msg.iUri]) {
              let map = new (TafMx.UriMapping[msg.iUri])()
              map.readFrom(stream)
              _emitter.emit(msg.iUri, map)
            }
            break
          default:
            break
        }
      }
    }

    client.onclose = function () {
      console.log("虎牙 close")
    }
    client.onerror = function (error) {
      console.log("虎牙 error")
    }

    _emitter.on('8006', (msg) => {
      const msg_obj = {
        type: 'online',
        time: new Date().getTime(),
        count: msg.iAttendeeCount
      }
      _emitter.emit('message', msg_obj)
    })

    _emitter.on("1400", msg => {
      const msg_obj = {
        type: 'chat',
        time: new Date().getTime(),
        from: {
          name: msg.tUserInfo.sNickName,
          rid: msg.tUserInfo.lUid + '',
        },
        id: md5(JSON.stringify(msg)),
        content: msg.sContent
      }
      // console.log(msg_obj.content)
      callback(msg.sContent)
      _emitter.emit('message', msg_obj)
    })


    return [info, main_user_id, client]
  }


  heartbeat(info, main_user_id, client) {
    let ws_user_info = new HUYA.WSUserInfo;
    ws_user_info.lUid = info.yyuid
    ws_user_info.bAnonymous = 0 === info.yyuid
    ws_user_info.sGuid = main_user_id.sGuid
    ws_user_info.sToken = ""
    ws_user_info.lTid = info.topsid
    ws_user_info.lSid = info.subsid
    ws_user_info.lGroupId = info.yyuid
    ws_user_info.lGroupType = 3
    let jce_stream = new Taf.JceOutputStream()
    ws_user_info.writeTo(jce_stream)
    let ws_command = new HUYA.WebSocketCommand()
    ws_command.iCmdType = HUYA.EWebSocketCommandType.EWSCmd_RegisterReq
    ws_command.vData = jce_stream.getBinBuffer()
    jce_stream = new Taf.JceOutputStream()
    ws_command.writeTo(jce_stream)
    client.send(jce_stream.getBuffer())
  }


}

export default new Huya()

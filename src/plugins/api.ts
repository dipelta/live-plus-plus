import axios from "axios";

export class ApiResponse {
  code: number
  msg: string
  data: any
}

class Api {

  private baseURL = 'http://api.live.dipelta.cn/'

  // private baseURL = 'http://api.live.me/'

  private http() {
    let http = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
    })
    http.interceptors.response.use(function (response) {
      // 对响应数据做点什么
      return response;
    }, function (error) {
      // 对响应错误做点什么
      if (error.message.includes('timeout')) {   // 判断请求异常信息中是否含有超时timeout字符串
        // console.log("错误回调", error);
        // alert("网络超时");
        error.code = 5001
        error.msg = "网络超时"
      }
      return Promise.reject(error);
    });
    return http
  }

  public getPlatformType(platformTab: number) {
    switch (platformTab) {
      case 0:
        return 'douyu';
      case 1:
        return 'bilibili';
      case 2:
        return 'huya';
    }
  }

  public getPlatformTab(platformType: string) {
    switch (platformType) {
      case 'douyu':
        return 0;
      case 'bilibili':
        return 1;
      case 'huya':
        return 2;
    }
  }

  public async sendGet(url: string) {
    let result: ApiResponse;
    await this.http().get(url).then(function (response) {
      result = response.data
    }).catch(function (error) {
      console.log(error)
      console.log(error.code)
      console.log(error.msg)
      console.log(error.message)
      result = new ApiResponse()
      result.code = error.code
      result.msg = error.msg ? error.msg : error.message
      result.data = []
    })
    return result
  }

  public async sendPost(url: string, data) {
    let result: ApiResponse;
    await this.http().post(url, data).then(function (response) {
      result = response.data
    }).catch(function (error) {
      result.code = 502
      console.log('请求出错')
      console.log(error)
    })
    return result
  }

  /**
   * 注册
   * @param clientCode
   */
  public async register(clientCode) {
    const url = "client/register"
    return await this.sendPost(url, {client_code: clientCode});
  }

  /**
   * 登录
   * @param clientCode
   */
  public async login(clientCode) {
    const url = "client/login"
    return await this.sendPost(url, {client_code: clientCode});
  }

  /**
   * 绑定邮箱
   * @param clientCode
   * @param email
   * @param verification_code
   */
  public async bindEmail(clientCode: string, email: string, verification_code: string) {
    const url = "client/bind-email"
    return await this.sendPost(url, {client_code: clientCode, email: email, verification_code: verification_code});
  }

  /**
   * 解绑邮箱
   * @param clientCode
   */
  public async unbindEmail(clientCode: string) {
    const url = "client/unbind-email"
    return await this.sendPost(url, {client_code: clientCode});
  }

  /**
   * 查询客户端是否绑定了邮箱
   * @param clientCode
   */
  public async isBindEmail(clientCode: string) {
    const url = "client/is-bind"
    const data = await this.sendPost(url, {client_code: clientCode}) as ApiResponse;
    if (data.code !== 200) {
      return false
    }
    return data.data.bind_status
  }

  public async bindInfo(clientCode: string) {
    const url = "client/bind-info"
    return await this.sendPost(url, {client_code: clientCode}) as ApiResponse;
  }

  public async getBindEmail(clientCode: string) {
    const url = "client/is-bind"
    return await this.sendPost(url, {client_code: clientCode}) as ApiResponse;
  }

  /**
   * 根据关键字查询直播信息
   * @param platformTab
   * @param keyWord
   */
  public async search(platformTab, keyWord) {
    const platformType = this.getPlatformType(platformTab)
    const url = "anchor/search?" + "key_word=" + keyWord + "&platform_type=" + platformType
    return await this.sendGet(url);
  }

  /**
   * 根据房间号获取到直播房间的信息
   * @param platformTab
   * @param roomId
   */
  public async roomInfo(platformTab, roomId) {
    const platformType = this.getPlatformType(platformTab)
    let request = []
    for (let i = 0; i < roomId.length; i++) {
      const url = this.baseURL + "anchor/data?" + "room_id=" + roomId[i] + "&platform_type=" + platformType
      request.push(axios({
        url: url
      }))
    }
    let datas = []
    await axios.all(request).then(axios.spread((...res) => {
      for (let i = 0; i < res.length; i++) {
        if (res[i].data.code === 200) {
          datas.push(res[i].data.data)
        }
      }
    }))
    // 对结果进行排序
    datas.sort(function (a, b) {
      if (a.is_live === b.is_live) {
        if (a.is_live === 0) {
          return 0
        }
        if (a.is_loop === b.is_loop) {
          return a.watch_num > b.watch_num ? -1 : 1
        } else {
          return a.is_loop > b.is_loop ? 1 : -1
        }
      } else {
        return a.is_live > b.is_live ? -1 : 1
      }
    })
    return datas
  }

  public async multiRoomInfo(platformTab, roomIdArr) {
    const platformType = this.getPlatformType(platformTab)
    const roomIds = roomIdArr.join(";")
    const url = this.baseURL + "anchor/multi-data?room_id=" + roomIds + "&platform_type=" + platformType
    let response = await this.sendGet(url);
    // 对结果进行排序
    if (response.code === 200 ) {
      let datas = response.data
      datas.sort(function (a, b) {
        if (a.is_live === b.is_live) {
          if (a.is_live === 0) {
            return 0
          }
          if (a.is_loop === b.is_loop) {
            return a.watch_num > b.watch_num ? -1 : 1
          } else {
            return a.is_loop > b.is_loop ? 1 : -1
          }
        } else {
          return a.is_live > b.is_live ? -1 : 1
        }
      })
      return datas
    }
    return [];
  }

  /**
   * 根据房间号获取到直播源地址
   * @param platformTab
   * @param roomId
   */
  public async liveUrl(platformTab, roomId) {
    const platformType = this.getPlatformType(parseInt(platformTab))
    const url = "/stream-source/data?" + "room_id=" + roomId + "&platform_type=" + platformType
    return await this.sendGet(url);
  }

  /**
   * 添加关注
   * @param clientCode
   * @param platformTab
   * @param roomId
   */
  public async addFollow(clientCode, platformTab, roomId) {
    const url = "user-follow/add"
    const platformType = this.getPlatformType(platformTab)
    return await this.sendPost(url, {client_code: clientCode, platform_type: platformType, room_id: roomId});
  }

  /**
   * 删除关注
   * @param clientCode
   * @param platformTab
   * @param roomId
   */
  public async delFollow(clientCode, platformTab, roomId) {
    const url = "user-follow/del"
    const platformType = this.getPlatformType(platformTab)
    return await this.sendPost(url, {client_code: clientCode, platform_type: platformType, room_id: roomId});
  }


  /**
   * 同步本地关注信息到服务器
   * @param clientCode
   * @param follows
   */
  public syncFollowsUpload(clientCode, follows) {
    const url = "user-follow/sync-upload"
    return this.sendPost(url, {client_code: clientCode, follows: follows});
  }

  /**
   * 同步本地配置到服务器
   * @param clientCode
   * @param configs
   */
  public syncAppConfigUpload(clientCode, configs) {
    const url = "client/sync-app-config-upload"
    return this.sendPost(url, {client_code: clientCode, configs: configs});
  }

  /**
   * 获取平台关注数据
   * @param clientCode
   * @param platformTab
   */
  public async followData(clientCode, platformTab = null) {
    let url = "/user-follow/data?" + "client_code=" + clientCode
    if (platformTab) {
      const platformType = this.getPlatformType(platformTab)
      url = url + "&platform_type=" + platformType
    }
    return await this.sendGet(url);
  }

  /**
   * 获取虎牙弹幕的房间数据
   * @param roomId
   */
  public async huyaChatInfo(roomId) {
    let url = "/huya/chat-info?room_id=" + roomId
    return await this.sendGet(url);
  }

  /**
   * 发送邮件验证码
   * @param email
   */
  public async sendVerificationCodeMail(email) {
    let url = "/vcode/send-mail"
    return await this.sendPost(url, {email: email});
  }

}

const api = new Api()

export {api, ApiResponse as apiResponse}

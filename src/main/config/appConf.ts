class AppConf {
  private aboutPaneConfig = {
  }

  private appDefaultConfigList = {
    // 主播列表刷新频率
    listRefreshRate: [
      { text: '每分钟/次', value: 1 },
      { text: '每5分钟/次', value: 2 },
      { text: '每15分钟/次', value: 3 }
    ],
    // 主播列表排序方式
    listSortType: [
      { text: '手动设置', value: 1 },
      { text: '直播状态', value: 2 }
    ],
    // 点击主播事件
    listClickEvent: [
      { text: '左键：播放 ｜ 右键：菜单', value: 1 },
      { text: '左键：地址 ｜ 右键：菜单', value: 2 },
      { text: '左键：菜单 ｜ 右键：无', value: 3 }
    ],
    // 关闭主窗口事件
    windowCloseEvent: [
      { text: '主窗口关闭，程序不退出', value: 1 },
      { text: '全部窗口关闭，程序不退出', value: 2 },
      { text: '退出程序', value: 3 }
    ],
    // 暂停后再播放事件
    videoReplayEvent: [
      { text: '继续播放', value: 1 },
      { text: '跳到最新画面', value: 2 }
    ],
    // 播放器自动开启弹幕
    showDanmaku: [
      { text: '开启', value: 1 },
      { text: '关闭', value: 2 }
    ]
  }

  private appDefaultConfig = {
    listRefreshRate: 1,
    listSortType: 1,
    listClickEvent: 1,
    videoReplayEvent: 2,
    windowCloseEvent: 3,
    showDanmaku: 1
  }

  /**
   * @todo 获取系统运行平台
   * win32 - windows
   * darwin - mac
   */
  getSysPlatform () {
    return process.platform
  }

  getAppDefaultConfig () {
    if (this.getSysPlatform() === 'darwin') {
      this.appDefaultConfig.windowCloseEvent = 1
    }
    return this.appDefaultConfig
  }

  getAppDefaultConfigList (type?: string) {
    if (type) {
      let config
      switch (type) {
        case 'listRefreshRate':
          config = this.appDefaultConfigList.listRefreshRate
          break
        case 'listSortType':
          config = this.appDefaultConfigList.listSortType
          break
        case 'listClickEvent':
          config = this.appDefaultConfigList.listClickEvent
          break
        case 'windowCloseEvent':
          config = this.appDefaultConfigList.windowCloseEvent
          break
        case 'videoReplayEvent':
          config = this.appDefaultConfigList.videoReplayEvent
          break
        case 'showDanmaku':
          config = this.appDefaultConfigList.showDanmaku
          break
      }
      return config
    } else {
      return this.appDefaultConfigList
    }
  }
}

export default new AppConf()

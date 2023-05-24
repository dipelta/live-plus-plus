class App {

  getDefaultAppConfig() {
    return {
      auto_show_danmaku: 1, // 0-关闭弹幕，1-开启弹幕
      video_replay_event: 0, // 0-继续播放，1-更新到最近进度
      main_window_close_event: 1 // 0-最小化程序，1-直接退出程序
    }
  }

  getConfigEnum() {
    return {
      auto_show_danmaku: [
        {title: '关闭弹幕', value: 0}, {title: '自动开启', value: 1}
      ],
      video_replay_event: [
        {title: '继续播放', value: 0}, {title: '更新到最近进度', value: 1}
      ],
      main_window_close_event: [
        {title: '最小化程序', value: 0}, {title: '直接退出程序', value: 1}
      ],
    }
  }


}

export default new App()

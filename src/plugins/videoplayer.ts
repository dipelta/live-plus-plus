// import DPlayer, {DPlayerDanmaku} from "dplayer";
//
// class VideoPlayer {
//
//   private dp
//
//   create(domId, videoUrl, livePlatform, streamType) {
//     const self = this
//     this.dp = new DPlayer({
//       container: document.getElementById(domId),
//       autoplay: true,
//       lang: 'zh-cn',
//       live: true,
//       // danmaku: {
//       //   // id: '9E2E3368B56CDBB4',
//       //   // // api: '',
//       //   // token: 'tokendemo',
//       //   // maximum: 1000,
//       //   // // addition: ['https://api.prprpr.me/dplayer/v3/bilibili?aid=4157142'],
//       //   // user: 'DIYgod',
//       //   // bottom: '15%',
//       //   // unlimited: true,
//       //   // speedRate: 0.5,
//       // },
//       // read: function (options) {
//       //   console.log(options)
//       //   console.log('Pretend to connect WebSocket');
//       //   options.success([]);
//       // },
//       // send: function (options) {
//       //   console.log('Pretend to send danmaku via WebSocket', options.data);
//       //   options.success();
//       // },
//       apiBackend: {
//         read: function (endpoint, callback) {
//           console.log(endpoint)
//           endpoint.success()
//           console.log(callback)
//           // console.log('Pretend to connect WebSocket');
//           // options.success([]);
//           return true
//         },
//         send: function (endpoint, danmakuData, callback) {
//           // console.log('Pretend to send danmaku via WebSocket', options.data);
//           // options.success();
//         }
//       },
//       video: {
//         // url: videoUrl,
//         // type: streamType
//         url: "http://openhls-tct.douyucdn2.cn/dyliveflv1/9999rMfVyoBTjV0x.m3u8?txSecret=465542015425909d4d579b3ee7248848&txTime=6465f2db&token=h5-douyu-0-9999-06bc2aa3d0db90b86b9077c3c51d7989&did=10000000000000000000000000001501&origin=tct&vhost=play1&sid=349531833",
//         type: "hls"
//       },
//       contextmenu: [
//         {
//           text: '测试按钮',
//           click: function () {
//             self.sss()
//             console.log('测试按钮')
//           }
//         }
//       ]
//     })
//     this.dp.play()
//     this.dp.danmaku.opacity(1)
//     return this.dp
//   }
//
//   sss() {
//     console.log(this.dp)
//     //     self.dplayer.danmaku.draw({
//     //       text: 'Get a danmaku via WebSocket',
//     //       color: '#fff',
//     //       type: 'right',
//     //     });
//   }
//
// }
//
// export default new VideoPlayer()

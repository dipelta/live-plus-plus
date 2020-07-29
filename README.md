<div align="center"><img src="https://image.dipelta.cn//doc/icon_256x256.png" alt="icon_256x256" style="zoom:80%;" /></center>
<center><h1>Live++</h1><p>轻轻松松看直播</p>
    </div>

---

## 项目背景

受到一些抓取直播流的开源代码的启发，一时兴起，写了一个基于electron的pc直播客户端。

因为这些直播平台的网页版，对我来说多余的内容太多了，而我仅仅只是想看直播和弹幕，对于礼物、任务、竞猜等等其他的东西都不感兴趣，并且每次打开网页都加载很慢。于是乎我就写了这个客户端。

可以直接抓取斗鱼、虎牙、哔哩哔哩的直播流进行观看，也支持弹幕的显示。点击就能看，不需要加载过多的内容，加载速度也比网页版本快（虎牙的串流地址加载比较慢）

可以在设置中选择使用内置播放器还是仅仅获取直播流地址。

---

## 项目说明

node不是我的专业语言，很多功能都是一边查文档一边看别人的代码写的，总体的代码很难看，大佬们见谅。

使用了很多第三方的包，可以在package.json中查看，其中：

1. 播放器使用了[DPlayer](https://github.com/MoePlayer/DPlayer)
2. 直播流抓取参考了python版本的代码[https://github.com/wbt5/real-url](https://github.com/wbt5/real-url)，也包含一些弹幕的抓取和解析
3. 虎牙的弹幕模块使用了[https://github.com/BacooTang/huya-danmu](https://github.com/BacooTang/huya-danmu)
4. 数据存储使用的 [https://github.com/typicode/lowdb](https://github.com/typicode/lowdb)

---

## 开发和运行环境

可以在`Node12+`下编译通过，其他的没测试过，只能确定无法在Node14下运行。

目前仅调试了windows、macOS系统下的程序运行问题。Linux平台请自行测试。

---

## 程序截图

<img src="https://image.dipelta.cn//doc/image-20200729213222712.png" alt="image-20200729213222712" style="zoom:50%;" />




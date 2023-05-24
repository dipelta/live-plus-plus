<p align="center">
<img src="https://image.dipelta.cn/doc/202305241648817.png" alt="logo" style="zoom:25%;" />
</p>

<h2 align="center">Live++</h2>

<p align="center">轻轻松松看直播</p>


---

## 项目背景

受到一些抓取直播流的开源代码的启发，一时兴起，写了一个基于electron的pc直播客户端。

因为这些直播平台的网页版，对我来说多余的内容太多了，而我仅仅只是想看直播和弹幕，对于礼物、任务、竞猜等等其他的东西都不感兴趣，并且每次打开网页都加载很慢。于是乎我就写了这个客户端。

可以直接抓取斗鱼、虎牙、哔哩哔哩的直播流进行观看，也支持弹幕的显示。点击就能看，不需要加载过多的内容，加载速度也比网页版本快

可以在设置中选择使用内置播放器还是仅仅获取直播流地址。

---

## 项目说明

node不是我的专业语言，很多功能都是一边查文档一边看别人的代码写的，总体的代码很难看，大佬们见谅。

时隔3年没有更新了，上个月收到了一个Issues之后才感觉到原来还有人在关注，于是抽时间重写一遍，顺便修改了一些以前不足的地方，依旧使用了很多第三方的包，可以在package.json中查看

在**2.0**版本中做了一些改动：

1. 播放器不再使用DPlayer，而是更换成了VideoJs
2. 弹幕功能使用了vue3-danmaku
3. 关于各个平台的主播信息、直播源信息不再通过node进行解析了，而是专门开发了一个app的服务器，所有的信息（除了弹幕）都会从服务器中获取
4. 关于弹幕的处理，基本没区别，只是虎牙的弹幕不再完全依赖扩展，而是根据[https://github.com/BacooTang/huya-danmu](https://gitee.com/link?target=https%3A%2F%2Fgithub.com%2FBacooTang%2Fhuya-danmu)中的lib文件自行编写了
5. 数据存储使用的 [https://github.com/typicode/lowdb](https://github.com/typicode/lowdb)，另外如果绑定了邮箱则会同步数据到服务器的数据库中
6. 删除了一部分没太大用的设置功能
7. 新增了主播的搜索功能，会根据关键字查询最多50个主播信息，方便用户订阅

---

## 开发和运行环境

```shell
$ node -v
v16.20.0
$ npm -v
8.19.4
```

目前仅调试了windows、macOS系统下的程序运行问题。Linux平台请自行测试。

---

## 程序截图

<img src="https://image.dipelta.cn/doc/202305241712726.png" alt="image-20230524171239695" style="zoom:50%;" />

<img src="https://image.dipelta.cn/doc/202305241714340.png" alt="image-20230524171417276" style="zoom:50%;" />


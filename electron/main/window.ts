import {BrowserWindow, screen, shell, ipcMain} from 'electron'
import mainConfig from '../conf/main';
import videoConfig from '../conf/video';


class Window {

  private windowMap: Map<string, BrowserWindow> = new Map()

  public MAIN_WINDOW_NAME = 'MAIN_WINDOW'
  public VIDEO_WINDOW_NAME = 'VIDEO_WINDOW'

  private mouseInWinX = 0

  private mouseInWinY = 0

  private mouseX = 0

  private mouseY = 0

  private videoWidth = 0

  private videoHeight = 0

  private canMove = false

  private inSystemBar = false

  createMainWindow() {
    const mainWindow = new BrowserWindow(mainConfig.getMainWindowConf())

    this.windowMap.set(this.MAIN_WINDOW_NAME, mainWindow)

    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
      mainWindow.loadFile('./dist/index.html');
    }

    // Test actively push message to the Electron-Renderer
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow?.webContents.send('main-process-message', new Date().toLocaleString())
    })

    // Make all links open with the browser, not with the application
    mainWindow.webContents.setWindowOpenHandler(({url}) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return {action: 'deny'}
    })
    require('@electron/remote/main').initialize()
    require('@electron/remote/main').enable(mainWindow.webContents)

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
      // mainWindow.webContents.openDevTools()
    })

    mainWindow.on('close', (event: Event) => {
      if (this.isHasWindow(this.MAIN_WINDOW_NAME)) {
        this.windowMap.delete(this.MAIN_WINDOW_NAME)
        mainWindow.destroy()
      }
    })

    return mainWindow
  }

  createVideoWindow(platformTab, roomId) {
    console.log('创建video窗口')
    const videoConf = videoConfig.getWindowConf()
    const videoWindow = new BrowserWindow(videoConf)
    this.videoWidth = videoConf.width
    this.videoHeight = videoConf.height
    this.windowMap.set(this.VIDEO_WINDOW_NAME, videoWindow)
    if (process.env.VITE_DEV_SERVER_URL) {
      videoWindow.loadURL(process.env.VITE_DEV_SERVER_URL + '#/video?platform=' + platformTab + "&room_id=" + roomId)
    } else {
      videoWindow.loadFile('./dist/index.html', {
        hash: '#/video?platform=' + platformTab + "&room_id=" + roomId
      });
    }
    let lastMousePosition = [];
    const mouseInterval = setInterval(() => {
      if (this.inSystemBar === false) {
        if (lastMousePosition.length >= 3) {
          lastMousePosition.shift()
        }
        lastMousePosition.push(this.mouseX + '-' + this.mouseY)
        // 如果最近3次的鼠标位置都相同，则发送隐藏事件
        if (lastMousePosition[0] === lastMousePosition[1] && lastMousePosition[1] === lastMousePosition[2]) {
          videoWindow.webContents.send('mouse-nomove-video-window', [])
        }
      }
    }, 1000)
    videoWindow.on('ready-to-show', () => {
      videoWindow.show()
      // videoWindow.webContents.openDevTools()
    })
    videoWindow.on('close', (event: Event) => {
      if (this.isHasWindow(this.VIDEO_WINDOW_NAME)) {
        clearInterval(mouseInterval)
        this.windowMap.delete(this.VIDEO_WINDOW_NAME)
        videoWindow.destroy()
      }
    })
    // videoWindow.webContents.on("before-input-event", (event, input) => {
    //   console.log("使用了键盘" + input.key + "键");
    // })

    videoWindow.on("focus", (event: Event) => {
      videoWindow.webContents.send('mouse-on-video-window', [])
    })
    videoWindow.on("blur", (event: Event) => {
      videoWindow.webContents.send('mouse-leave-video-window', [])
    })
    videoWindow.on("will-resize", (event: Event) => {
      // console.log("will-resize:" + videoWindow.getSize())
      // console.log("this.canMove:" + this.canMove)
      if (this.canMove) {
        event.preventDefault()
      }
    })
    videoWindow.on("resize", (event: Event) => {
      // console.log("resize:" + videoWindow.getSize())
      if (this.canMove) {
      } else {
        this.videoWidth = videoWindow.getSize()[0]
        this.videoHeight = videoWindow.getSize()[1]
      }
      videoWindow.webContents.send('video-window-resize', [])
    })
    videoWindow.webContents.on("input-event", (event, input) => {
      if (videoWindow.isFocused()) {
        const {x, y} = screen.getCursorScreenPoint()
        this.mouseX = x
        this.mouseY = y
        const bounds = videoWindow.getBounds()
        // console.log(input, x, y, bounds);
        // console.log(x, y, bounds);
        // console.log(videoWindow.getPosition());
        if (input.type === 'mouseLeave') {
          videoWindow.webContents.send('mouse-leave-video-window', [])
        } else if (input.type === 'mouseDown') {
          if (input.modifiers[0] === 'leftbuttondown') {
            if (y >= bounds.y && y <= bounds.y + 24) {
              this.canMove = true
              this.mouseInWinX = x - bounds.x
              this.mouseInWinY = y - bounds.y
              if (this.mouseInWinX < 0) {
                this.mouseInWinX = this.mouseInWinX * -1
              }
              if (this.mouseInWinY < 0) {
                this.mouseInWinY = this.mouseInWinY * -1
              }
            }
          }
        } else if (input.type === 'mouseUp') {
          this.canMove = false
          // videoWindow.setResizable(true)
        } else if (input.type === 'mouseMove') {
          videoWindow.webContents.send('mouse-on-video-window', [])
          if (y >= bounds.y && y <= bounds.y + 24) {
            // 移动到了系统栏
            this.inSystemBar = true
          } else {
            this.inSystemBar = false
          }
          if (input.modifiers[0] === 'leftbuttondown') {
            if (this.canMove) {
              // videoWindow.setResizable(false)
              const newX = x - this.mouseInWinX
              const newY = y - this.mouseInWinY
              videoWindow.setPosition(newX, newY)
              videoWindow.setSize(this.videoWidth, this.videoHeight)
              // videoWindow.setBounds({ x:newX, y: newY, width: this.videoWidth, height: this.videoHeight })
            }
          }
        }
      }
    })
    return videoWindow
  }

  showMain() {
    let mainWindow
    if (this.isHasWindow(this.MAIN_WINDOW_NAME)) {
      mainWindow = this.getWindowByName(this.MAIN_WINDOW_NAME)
    } else {
      mainWindow = this.createMainWindow()
    }
    mainWindow.show()
  }

  showVideo(platformTab, roomId) {
    let videoWindow
    if (this.isHasWindow(this.VIDEO_WINDOW_NAME)) {
      videoWindow = this.getWindowByName(this.VIDEO_WINDOW_NAME)
    } else {
      videoWindow = this.createVideoWindow(platformTab, roomId)
    }
    videoWindow.show()
  }


  isHasWindow(name: string) {
    return this.windowMap.has(name)
  }

  getWindowByName(name: string) {
    if (this.isHasWindow(name)) {
      return this.windowMap.get(name)
    } else {
      return null
    }
  }

}

export default new Window()

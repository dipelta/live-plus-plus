import { Menu, Tray, nativeImage, KeyboardEvent, Rectangle, Point } from 'electron'
import MenuConf from '../config/menuConf'
import AppConf from '../config/appConf'
import path from 'path'
import window from './window'
class Menus {
  register () {
    const conf = MenuConf.getConf()
    Menu.setApplicationMenu(conf)
  }

  /**
   * @todo 设置系统托盘
   * 程序设置
   * 检查更新
   * 错误报告
   * 调试工具
   * 关于live++
   * 退出
   */
  setTray (tray: any) {
    let icon = path.join(__dirname, '../build/icon.iconset/icon_32x32@2x.png')
    let image = nativeImage.createFromPath(icon)
    if (AppConf.getSysPlatform() === 'darwin') {
      image = image.resize({
        width: 22,
        height: 22
      })
    } else {
      icon = path.join(__dirname, '../build/win/logo.ico')
      image = nativeImage.createFromPath(icon)
    }
    image.setTemplateImage(true)
    tray = new Tray(image)
    tray.addListener('click', function (event: KeyboardEvent, bounds: Rectangle, position: Point) {
      console.log('托盘-左键点击')
      if (!window.isHasWindow('MAIN_WINDOW')) {
        window.createMain()
      } else {
        window.showMain()
      }
      if (window.isHasWindow('VIDEO_WINDOW')) {
        const video = window.getWindowByName('VIDEO_WINDOW')
        if (video) {
          video.show()
        }
      }
    })
    tray.addListener('right-click', function (event: KeyboardEvent, bounds: Point) {
      tray.popUpContextMenu(MenuConf.getTrayMenuConf())
    })
    return tray
  }
}

export default new Menus()

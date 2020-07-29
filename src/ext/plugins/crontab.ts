import Douyu from './livetool/douyu'
import Huya from './livetool/huya'
import Bilibili from './livetool/bilibili'
import { ipcRenderer } from 'electron'
import window from '../../main/app/window'

class Crontab {
  start () {
    // setInterval(() => {
    //   Crontab.refreshLiverData()
    // // }, 30000)
    // }, 5000)
  }

  // /**
  //  * @todo 定时刷新主播数据
  //  */
  // private static refreshLiverData () {
  //   console.log('定时刷新主播数据')
  //   Douyu.refreshList()
  //   Huya.refreshList()
  //   Bilibili.refreshList()
  // }
}
export default new Crontab()

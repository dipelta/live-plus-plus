<template>
  <v-container class="live-info" style="padding: 0;margin: 0;width: 100%;height: 100%">
    <v-list class="live-list" ref="live_list_ref" three-line
            style="padding-top: 0;padding-bottom: 0;background: #fff0;">
      <div v-for="(item, index) in liveList" :key="index">
        <v-divider v-if="index !== 0"></v-divider>
          <v-list-item class="liver-info"  :disabled="disable"
                       style="max-height: 60px !important;min-height: 0;"
                       @contextmenu.prevent="rightMouseClick(item, index, $event)"
                       @click="leftMouseClick(item, index, $event)">
            <v-list-item-avatar size="40" style="margin-top: 10px;margin-bottom: 10px;margin-right: 12px" >
              <v-img :src="item.up_avatar"></v-img>
            </v-list-item-avatar>
            <v-list-item-content style="margin-top: 0">
              <v-list-item-title style="font-size: 16px;line-height: 16px;display: block;width: 100%;">
                <div class="liver_up_name" style="padding-top: 1px;max-width: 145px;height: 20px;overflow: hidden">
                  <v-icon v-if="item.is_live === 1" size="18" style="margin-top: -4px" color="green">live_tv</v-icon>
                  <v-icon v-else-if="item.is_live === 2" size="16" style="margin-top: -2px" color="red">tv_off</v-icon>
                  <v-icon v-else size="20" style="margin-top: -4px" color="#eaa400">videocam</v-icon>
                  {{ item.up_name }}
                </div>
                <div v-if="item.is_live !== 2" :class="extClass" style="text-align: right;float: right">
            <span style="font-size: 12px">
              <v-icon color="red" size="14" style="margin-top: -3px;margin-right: -3px">mdi-fire</v-icon>
              {{ hotFormate(item.hot) }}
            </span>
                </div>
              </v-list-item-title>
              <v-list-item-subtitle style="width: 100%;display: block;height: 20px">
                <div :class="'liver_room_name ' + roomNameClass">{{ item.room_name }}</div>
                <div :class="'live_time ' + extClass" v-if="item.is_live !== 2 && item.live_time"
                     style="font-size: 12px;margin-top: 1px;text-align: right">
                  <v-icon color="blue" size="12" style="margin-top: -2px;margin-right: -1px">access_time</v-icon>
                  {{liveTimeFormate(item.live_time)}}
                </div>
              </v-list-item-subtitle>
            </v-list-item-content>
            <v-btn icon fab small dark color="red" :class="delBtnClass" @click="deleteLiver(item, index)">
              <v-icon>delete</v-icon>
            </v-btn>
          </v-list-item>
      </div>
    </v-list>
    <v-menu v-model="rightMenu" :position-x="rightMenuX" :position-y="rightMenuY"
            transition="scale-transition"
            absolute disable-keys close-on-click close-on-content-click>
      <v-list dense>
        <v-list-item :class="hideClass" @click="clickMenu('source')">
          <v-list-item-title style="color: #36a2f4">直播源</v-list-item-title>
        </v-list-item>
<!--        <v-divider :class="hideUpMenu"></v-divider>-->
        <v-list-item :class="hideUpMenu" @click="clickMenu('up')">
          <v-list-item-title>向上移</v-list-item-title>
        </v-list-item>
<!--        <v-divider :class="hideDownMenu"></v-divider>-->
        <v-list-item :class="hideDownMenu" @click="clickMenu('down')">
          <v-list-item-title>向下移</v-list-item-title>
        </v-list-item>
<!--        <v-divider :class="hideClass"></v-divider>-->
        <v-list-item @click="clickMenu('delete')">
          <v-list-item-title style="color: #f44336">删除</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Emit } from 'vue-property-decorator'
import Commontool from '../../../ext/plugins/commontool'
import { ipcRenderer } from 'electron'
@Component({
  name: 'LiverInfo'
})
export default class extends Vue {
  disable = false
  liveListCount = 0
  rightMenu = false
  rightMenuX = 0
  rightMenuY = 0
  focusMenuItem: any = null
  focusMenuItemIndex: any = null
  hideUpMenu = ''
  hideDownMenu = ''
  hideClass = ''
  roomNameClass = ''
  extClass = ''
  delBtnClass = 'hide'
  @Prop() liveList: any[] | undefined
  @Prop() editSheet: boolean | undefined
  @Prop() platform: string | undefined
  // 鼠标左键点击事件
  leftMouseClick (item: any, index:number, e: any) {
    const clickType = Commontool.getListClickEvent()
    if (clickType === 1) {
      // 左键：播放 ｜ 右键：菜单
      this.playLiveToVideo(item)
    } else if (clickType === 2) {
      // 左键：地址 ｜ 右键：菜单
      if (this.rightMenu === false) {
        this.showLiveUrl(item)
      }
    } else if (clickType === 3) {
      // 左键：菜单 ｜ 右键：无
      this.showRightMenu(item, index, e)
    }
  }

  // 鼠标右键点击事件
  rightMouseClick (item: any, index:number, e: any) {
    const clickType = Commontool.getListClickEvent()
    if (clickType === 1) {
      // 左键：播放 ｜ 右键：菜单
      this.showRightMenu(item, index, e)
    } else if (clickType === 2) {
      // 左键：地址 ｜ 右键：菜单
      this.showRightMenu(item, index, e)
    } else if (clickType === 3) {
      // 左键：菜单 ｜ 右键：无
    }
  }

  // 使用播放器进行直播的播放
  playLiveToVideo (item:object) {
    if (this.rightMenu === false) {
      if (this.extClass === '' && this.delBtnClass === 'hide') {
        // console.log('点击主播列表详情')
        ipcRenderer.send('get-live-url', [this.platform, item])
      }
    } else {
      // console.log('右键菜单未关闭，不触发列表点击功能')
    }
  }

  clickMenu (command: string) {
    if (this.focusMenuItem && this.focusMenuItemIndex !== null && this.focusMenuItemIndex !== undefined) {
      // console.log(this.platform + ': ' + this.focusMenuItemIndex + '-' + this.focusMenuItem.up_name)
      switch (command) {
        case 'source':
          // console.log('获取直播源地址')
          this.showLiveUrl(this.focusMenuItem)
          break
        case 'up':
          // console.log('向上移')
          // this.$msgbox.show('功能未开发', 'warning')
          this.liverMoveIndex(this.focusMenuItem, this.focusMenuItemIndex, 'up')
          break
        case 'down':
          // console.log('向下移')
          // this.$msgbox.show('功能未开发', 'warning')
          this.liverMoveIndex(this.focusMenuItem, this.focusMenuItemIndex, 'down')
          break
        case 'delete':
          // console.log('取消订阅')
          this.deleteLiver(this.focusMenuItem, this.focusMenuItemIndex)
          break
      }
    }
  }

  // 向上移-1，向下移-2
  liverMoveIndex (item: any, index: number, type: string) {
    ipcRenderer.send('move-liver-index', [this.platform, item, index, type])
  }

  // 显示主播的直播源地址
  showLiveUrl (item: any) {
    // 将地址粘贴到剪切板
    ipcRenderer.send('live-url-to-clipboard', [this.platform, item])
  }

  showRightMenu (item: any, index:number, e: any) {
    const sortType = Commontool.getListSortType()
    if (index === 0 || sortType === 2) {
      this.hideUpMenu = 'hide_menu_item'
    } else {
      this.hideUpMenu = ''
    }
    if (index === this.liveListCount - 1 || sortType === 2) {
      this.hideDownMenu = 'hide_menu_item'
    } else {
      this.hideDownMenu = ''
    }
    // 读取点击事件的设置
    const clickType = Commontool.getListClickEvent()
    if (clickType === 2) {
      this.hideClass = 'hide_menu_item'
    } else if (clickType === 1 || clickType === 3) {
      this.hideClass = ''
    }
    this.focusMenuItem = item
    this.focusMenuItemIndex = index
    this.rightMenuX = e.clientX
    this.rightMenuY = e.clientY
    this.rightMenu = false
    this.$nextTick(() => {
      this.rightMenu = true
    })
  }

  // @ts-ignore
  @Emit('listHeightListen')
  returnListHeight (height: number) {
    return height
  }

  @Watch('liveList')
  changeListCount (newliveList:any, old:any) {
    this.liveListCount = newliveList.length
    // @ts-ignore
    const listHeight = this.$refs.live_list_ref.$el.offsetHeight
    // console.log('changeListCount--listHeight:' + listHeight)
    // this.returnListHeight(listHeight)
    const newCount = newliveList.length
    const oldCount = old.length
    let diffHeight = 61
    if (newCount === 0) {
      diffHeight = 60
    }
    if (newCount > oldCount) {
      // console.log('添加了新的主播')
      this.returnListHeight(listHeight + diffHeight)
    } else if (newCount < oldCount) {
      // console.log('删除了主播')
      this.returnListHeight(listHeight - diffHeight)
    } else {
      // console.log('主播个数无变化')
    }
    setTimeout(function () {
      if (newCount > oldCount) {
        // console.log('添加了新的主播')
        ipcRenderer.send('scroll-to-bottom')
      } else if (newCount < oldCount) {
        // console.log('删除了主播')
      } else {
        // console.log('主播个数无变化')
      }
    }, 100)
  }

  @Watch('editSheet')
  changeListStatus (newStatus:any, oldStatus:any) {
    // @ts-ignore
    // const listHeight = this.$refs.live_list_ref.$el.offsetHeight
    // this.returnListHeight(listHeight)
    // @ts-ignore
    // const listHeight = this.$refs.live_list_ref.$el.offsetHeight
    // console.log(this.$refs)
    // console.log(newStatus)
    // @ts-ignore
    // const h = this.$refs.live_list_ref.$el.offsetHeight
    // console.log(h)
  // this.disable = !!newStatus
  // if (newStatus) {
  //   // 隐藏扩展数据显示，显示删除按钮
  //   this.extClass = 'hide_ext_info'
  //   this.delBtnClass = 'show'
  // } else {
  //   // 隐藏删除按钮
  //   this.delBtnClass = 'hide'
  //   this.extClass = ''
  // }
  }

  liveTimeFormate (liveTime: number) {
    return Commontool.encodeLiveTime(liveTime)
  }

  // 热度格式化，超过10000的热度使用【万】为单位的数字代替
  hotFormate (hot: string) {
    // 去掉虎牙直播中热度的逗号
    hot = hot.replace(/,/g, '')
    const hotNum = parseInt(hot)
    const lastChar = hot.slice(-1)
    if (lastChar !== '万' && hotNum >= 10000) {
      const num10k = (hotNum / 10000).toFixed(2)
      return num10k + '万'
    }
    return hot
  }

  mounted () {
    // @ts-ignore
    const listHeight = this.$refs.live_list_ref.$el.offsetHeight
    this.returnListHeight(listHeight)
  }

  created () {
    if (this.platform !== undefined) {
      if (parseInt(this.platform) === 0 || parseInt(this.platform) === 2) {
        this.roomNameClass = 'short_room_name'
      }
    }
    const self = this
    ipcRenderer.on('get-live-url-error', function (event, args) {
      self.$msgbox.show(args[0], args[1])
    })
    this.liveListCount = this.liveList.length
  }

  /**
   * @todo 取消订阅
   * @param item
   * @param index
   */
  deleteLiver (item:any, index:number) {
    ipcRenderer.send('del-liver', [this.platform, item, index])
  }
}
</script>

<style scoped>
.liver_up_name {
  text-overflow: ellipsis;
  white-space: nowrap !important;
  flex: initial;
  overflow-x: hidden !important;
  display: block !important;
  float: left;
}

.liver_room_name {
  margin-top: 1px;
  text-overflow: ellipsis;
  white-space: nowrap !important;
  font-size: 13px;
  flex: initial;
  overflow-x: hidden !important;
  display: block !important;
  float: left;
  width: 100%;
}

.live_time {
  float: right;
}

.hide_menu_item {
  display: none;
}

.hide_ext_info {
  display: none;
}

.hide {
  display: none !important;
}

.show {
  display: block !important;
  pointer-events: auto;
}

.short_room_name {
  width: 155px !important;
}
</style>

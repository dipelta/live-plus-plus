<template>
  <v-tabs-items id="up-list-tabs" ref="tab_item_list" :class="listHeightClass" v-model="livePlatformTab">
    <v-tab-item style="padding: 0;height: 100%">
      <LiverInfo :liveList="douyuList" :editSheet="editSheet" :platform="0" @listHeightListen="changeListHeightDouyu"></LiverInfo>
    </v-tab-item>
    <v-tab-item style="padding: 0;height: 100%">
      <LiverInfo :liveList="huyaList" :editSheet="editSheet" :platform="1" @listHeightListen="changeListHeightHuya"></LiverInfo>
    </v-tab-item>
    <v-tab-item style="padding: 0;height: 100%">
      <LiverInfo :liveList="bilibiliList" :editSheet="editSheet" :platform="2" @listHeightListen="changeListHeightBilibili"></LiverInfo>
    </v-tab-item>
  </v-tabs-items>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { ipcRenderer } from 'electron'
import LiverInfo from '../../renderer/components/LiveList/LiverInfo.vue'
import Commontool from '../../../src/ext/plugins/commontool'
@Component({
  name: 'LiverList',
  components: {
    LiverInfo
  }
})
export default class extends Vue {
  listHeightDouyu = 0
  listHeightHuya = 0
  listHeightBilibili = 0
  listHeightClass = 'list-height-default'
  douyuList = this.$db.get('douyu')
  huyaList = this.$db.get('huya')
  bilibiliList = this.$db.get('bilibili')
  refreshInterval: any
  @Prop() livePlatformTab: number | undefined
  @Prop() editSheet: boolean | undefined

  @Watch('editSheet')
  changeHeight (newVal: any, oldVal: any) {
    const self = this
    if (newVal) {
      // 底部输入框弹起，list高度为359
      this.listHeightClass = 'list-height-open-edit'
      // @ts-ignore
      let scrollHeight = this.$refs.tab_item_list.$el.scrollTop
      // @ts-ignore
      const tabItemHeight = this.$refs.tab_item_list.$el.offsetHeight
      let listHeight = 0
      if (this.livePlatformTab === 0) {
        listHeight = this.listHeightDouyu
      } else if (this.livePlatformTab === 1) {
        listHeight = this.listHeightHuya
      } else {
        listHeight = this.listHeightBilibili
      }
      // console.log('列表总长：' + listHeight)
      // console.log('tab总长：' + tabItemHeight)
      // console.log('滚动条高度：' + scrollHeight)
      if (scrollHeight >= listHeight - tabItemHeight - 60 || scrollHeight >= listHeight - tabItemHeight - 59.5) {
        // console.log('most bottom')
        const finalTop = listHeight - 359
        const scrollInterval = setInterval(function () {
          // console.log('finalTop:' + finalTop)
          if (scrollHeight <= finalTop + 60) {
            console.log('move')
            scrollHeight = scrollHeight + 2
            // @ts-ignore
            self.$refs.tab_item_list.$el.scrollTop = scrollHeight
          } else {
            // console.log(scrollHeight)
            console.log('stop')
            clearInterval(scrollInterval)
          }
        }, 5)
      }
    } else {
      // 底部输入框隐藏，list高度为404
      this.listHeightClass = 'list-height-default'
      // @ts-ignore
      // const scrollHeight = this.$refs.tab_item_list.$el.scrollTop
      // console.log(scrollHeight)
    }
  }

  changeListHeightDouyu (val: any) {
    console.log('changeListHeightDouyu:' + val)
    this.listHeightDouyu = val
  }

  changeListHeightHuya (val: any) {
    console.log('changeListHeightHuya:' + val)
    this.listHeightHuya = val
  }

  changeListHeightBilibili (val: any) {
    console.log('changeListHeightBilibili:' + val)
    this.listHeightBilibili = val
  }

  refreshList () {
    this.douyuList = this.$db.get('douyu')
    this.huyaList = this.$db.get('huya')
    this.bilibiliList = this.$db.get('bilibili')
  }

  mounted () {
    const self = this
    ipcRenderer.on('scroll-to-bottom', function () {
      const sortType = Commontool.getListSortType()
      // 滚动到底部-142488-156277
      // @ts-ignore
      if (self.$refs.tab_item_list.$el && sortType === 1) {
        // @ts-ignore
        let scrollHeight = self.$refs.tab_item_list.$el.scrollTop
        let listHeight = 0
        if (self.livePlatformTab === 0) {
          listHeight = self.listHeightDouyu
        } else if (self.livePlatformTab === 1) {
          listHeight = self.listHeightHuya
        } else {
          listHeight = self.listHeightBilibili
        }
        const finalTop = listHeight - 359
        console.log('scrollHeight:' + scrollHeight)
        console.log('finalTop:' + finalTop)
        const mid = (finalTop - scrollHeight) / 4
        // const movePx = 1
        const scrollInterval = setInterval(function () {
          if (scrollHeight < finalTop || scrollHeight < (finalTop - 0.5)) {
            console.log('move')
            if (scrollHeight < mid * 3) {
              scrollHeight = scrollHeight + 5
            } else {
              scrollHeight = scrollHeight + 1
            }
            // @ts-ignore
            self.$refs.tab_item_list.$el.scrollTop = scrollHeight
          } else {
            console.log('stop')
            clearInterval(scrollInterval)
          }
        }, 1)
      }
    })
  }

  created () {
    const self = this
    const time = Commontool.getlistRefreshRateTime()
    // 定时刷新列表数据
    this.refreshInterval = setInterval(() => {
      ipcRenderer.send('refresh-live-db-list')
    }, time)
    ipcRenderer.on('live-list-refresh', function () {
      // console.log('刷新列表')
      self.refreshList()
    })
    // 监听刷新配置是否更改
    ipcRenderer.on('config-changed-listRefreshRate', function () {
      clearInterval(self.refreshInterval)
      const time = Commontool.getlistRefreshRateTime()
      self.refreshInterval = setInterval(() => {
        ipcRenderer.send('refresh-live-db-list')
      }, time)
    })
  }
}
</script>

<style scoped>
#up-list-tabs {
  overflow-y: overlay;
  position: fixed;
  top: 96px;
  width: 100%;
  box-shadow: inset 0px 0px 0px 1px #0000001f;
  /*overflow-x: hidden;*/
  /*border-radius: 0 0 5px 5px;*/
}

.list-height-default {
  height: 404px;
  border-radius: 0 0 5px 5px;
}

.list-height-open-edit {
  height: 359px;
  border-radius: 0 0 0 0;
}

/*滚动条整体样式*/
#up-list-tabs::-webkit-scrollbar {
  width: 3px;
}

/*滚动条的小方块*/
#up-list-tabs::-webkit-scrollbar-thumb {
  border-radius: 20px;
  box-shadow   : none;
  background   : #ff8a65;
}

/*滚动条里面轨道*/
#up-list-tabs::-webkit-scrollbar-track {
  box-shadow   : none;
  border-radius: 0;
  background   : none;
}
</style>

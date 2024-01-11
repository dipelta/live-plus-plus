<template>
  <v-bottom-navigation style="border-radius: 0 0 5px 5px;box-shadow:none" :active="openAddLiveStatus" height="404px" :multiple="true" selected-class="followLiveBtn">
    <div id="add-live" class="app-scrollbar">
      <v-window :model-value="platformTab">
        <v-window-item v-for="(item, tabIndex) in livePlatformItems" :key="tabIndex" :value="tabIndex">
          <v-sheet max-height="364px" class="app-scrollbar" style="padding:0;margin:0;width:300px;overflow-y: scroll;">
            <v-list style="padding-top: 0;padding-bottom: 0;background: #fff0;">
              <div v-for="(anchor, index) in searchDataMap[tabIndex]" :key="index" style="">
                <v-divider v-if="index !== 0"></v-divider>
                <v-list-item
                    height="60px"
                    :key="anchor.room_id"
                    :title="anchor.anchor_name"
                    :subtitle="anchor.room_id"
                    :prepend-avatar="anchor.anchor_avatar"
                >
                  <template v-if="anchor.follow === 0" v-slot:append>
                    <v-btn @click="addLiveUser(anchor.room_id)" size="small" class="followLiveBtn" variant="outlined"
                           height="25px" width="80px">
                      关 注
                    </v-btn>
                  </template>
                  <template v-else v-slot:append>
                    <v-btn size="small" disabled
                           class="followedLiveBtn" variant="outlined"
                           height="25px" width="80px">
                      已关注
                    </v-btn>
                  </template>
                </v-list-item>
              </div>
            </v-list>
          </v-sheet>
        </v-window-item>
      </v-window>
    </div>
    <v-sheet color="grey-darken-3" style="position: fixed; bottom: 0; width: 100%;  border-radius: 0 0 5px 5px;">
      <v-text-field
          v-model="searchKeyWord"
          :loading="searchLoading"
          density="compact"
          flat
          variant="solo"
          hide-details
          label="请输入主播关键字或者房间号"
          append-inner-icon="mdi-magnify"
          single-line
          dark
          color="deep-orange-accent-2"
          bg-color="grey-darken-3"
          @click:append-inner="search"
          @keydown.enter="search"
      ></v-text-field>
    </v-sheet>
  </v-bottom-navigation>

</template>
<script>
import {defineComponent} from "vue";
import {api} from '../../plugins/api';
import mainConfig from "../../../electron/conf/main";
import {ipcRenderer} from "electron";

export default defineComponent({
  name: "AddLive",
  props: ['openAddLiveStatus', 'platformTab'],
  data() {
    return {
      searchKeyWord: "",
      searchLoading: false,
      searchData: [],
      searchDataMap: [[], [], []],
      livePlatformItems: mainConfig.getLivePlatformItems()
    }
  },
  methods: {
    async search() {
      if (this.searchKeyWord) {
        this.searchLoading = true
        // const data = await api.search(this.platformTab, this.searchKeyWord)
        const data = await ipcRenderer.invoke('search-anchor-by-keyword', [this.platformTab, this.searchKeyWord])
        this.searchLoading = false
        if (data.code !== 200) {
          ipcRenderer.send('alert-msg', ['error', data.msg])

        } else {
          const searchResult = data.data
          const follows = await ipcRenderer.invoke('get-follow-by-platform', [this.platformTab])
          // console.log(follows)
          for (let i = 0; i < searchResult.length; i++) {
            searchResult[i].follow = 0
            if (follows.indexOf(searchResult[i].room_id) !== -1) {
              searchResult[i].follow = 1
            }
          }
          console.log(searchResult)
          this.searchDataMap[this.platformTab] = searchResult
        }
      }
    },
    addLiveUser(roomId) {
      // console.log('添加关注：' + this.platformTab + "-" + roomId)
      // const data = await
      ipcRenderer.invoke('add-follow', [this.platformTab, roomId]).then((data) => {
        // console.log(data)
        if (data.code === 200) {
          // 更新searchDataMap中的主播关注按钮状态
          for (let i = 0; i < this.searchDataMap[this.platformTab].length; i++) {
            if (this.searchDataMap[this.platformTab][i].room_id === roomId) {
              this.searchDataMap[this.platformTab][i].follow = 1
              break
            }
          }
          // 添加主播信息到订阅列表中
          ipcRenderer.send('reflush-live-list', [])
        }
      })

    }
  },
  watch: {
    openAddLiveStatus: function (newVal, oldVal) {
      if (newVal === false) {
        setTimeout(() => {
          this.searchDataMap = [[], [], []]
        }, 500)
      }
    }
  },
  mounted() {
    // console.log(this.openAddLiveStatus)
  },
  created() {
    // ipcRenderer.on('add-follow', function (event, args) {
    //   console.log(args)
    // })
  }
})

</script>
<style scoped>
#add-live {
  width: 300px;
  height: 404px;
  border-left: 1px #0000001f solid;
  border-right: 1px #0000001f solid;
  border-radius: 0 0 5px 5px;
}

.followLiveBtn {
  opacity: 1 !important;
  color: #2E7D32;
}

.followedLiveBtn {
  opacity: 1 !important;
  color: #8f8f8f;
}
</style>

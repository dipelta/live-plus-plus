<template>
  <v-bottom-navigation style="border-radius: 0 0 5px 5px;box-shadow:none" :active="openSettingStatus" height="440px" :multiple="true">
    <div id="app-setting" class="app-scrollbar">
      <v-row align="center" style="padding: 20px" id="emailGroup">
        <h2 style=";margin-left: 12px">绑定设置
          <span style="font-size: 12px;font-weight:400;margin-left: 5px">({{ bindEmail }})</span>
        </h2>
        <v-col cols="12" style="margin-top: 10px">
          <template v-if="!bindStatus">
            <v-btn variant="outlined" height="35" style="width: 100%;opacity:1;color:#d3765a"
                   @click="bindEmailDialog = !bindEmailDialog">
              点我绑定邮箱账号
            </v-btn>
          </template>
          <template v-else>
            <v-btn variant="outlined" height="35" style="width: 100%;opacity:1;color:#e00000"
                   @click="unBindDialog = !unBindDialog">
              解除绑定邮箱账号
            </v-btn>
          </template>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-dialog v-model="bindEmailDialog">
          <v-card>
            <v-container>
              <form>
                <v-row>
                  <v-col cols="12">
                    <v-text-field label="邮箱" v-model="inputEmail"
                                  required
                                  :error-messages="inputEmailError"
                                  variant="underlined"
                                  @input="checkInputEmail()">
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" style="margin-top: -10px">
                    <v-text-field label="验证码" v-model="inputVerificationCode" variant="underlined"
                                  required
                                  :error-messages="inputVerificationCodeError"
                                  @input="checkInputVerificationCode()"
                    >
                      <template v-slot:append>
                        <v-btn variant="outlined" size="x-small" height="32"
                               :loading="sendVerificationCodeBtnLoading"
                               :style="sendVerificationCodeBtnDisableStyle"
                               :disabled="sendVerificationCodeBtnDisable"
                               @click="sendVerificationCode()">
                          {{ verificationCodeBtnMsg }}
                        </v-btn>
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12" style="margin-top: -10px">
                    <v-btn variant="outlined" height="35" style="width: 100%;opacity:1;color:#5a8ed3"
                           @click="doBindEmail()">
                      提交
                    </v-btn>
                  </v-col>
                </v-row>
              </form>
            </v-container>
          </v-card>
        </v-dialog>
      </v-row>

      <v-row justify="center">
        <v-dialog v-model="unBindDialog">
          <v-card>
            <v-container>
              <div>确定解绑邮箱吗？</div>
              <br>
              <div style="font-size: 14px">解绑后将不再同步关注和配置数据</div>
              <br>

              <v-row>
                <v-col cols="6">
                  <v-btn variant="outlined" height="35" style="width: 100%;opacity:1;color:#5a8ed3"
                         @click="doUnbindEmail()">
                    确定
                  </v-btn>
                </v-col>
                <v-col cols="6">
                  <v-btn variant="outlined" height="35" style="width: 100%;opacity:1;color:#d35a5a"
                         @click="unBindDialog = false">
                    取消
                  </v-btn>
                </v-col>
              </v-row>


            </v-container>
          </v-card>
        </v-dialog>
      </v-row>

      <v-row align="center" style="padding: 20px;margin-top: -20px" id="settingGroup">
        <h2 style=";margin-left: 12px">应用设置</h2>
        <span style="margin-left: 10px">(当前版本: {{appVersion}})</span>
        <v-col cols="12" style="margin-top: 10px">
          <v-select
              label="播放器弹幕设置"
              :model-value="appConfig.auto_show_danmaku"
              :items="appConfigEnum.auto_show_danmaku"
              item-title="title"
              item-value="value"
              variant="underlined"
              @update:modelValue="changeAppConfig('auto_show_danmaku', $event)"
          ></v-select>
        </v-col>

        <v-col cols="12">
          <v-select
              label="暂停后再播放事件"
              :model-value="appConfig.video_replay_event"
              :items="appConfigEnum.video_replay_event"
              item-title="title"
              item-value="value"
              variant="underlined"
              @update:modelValue="changeAppConfig('video_replay_event', $event)"
          ></v-select>
        </v-col>

        <v-col cols="12">
          <v-select
              label="关闭主窗口事件"
              :model-value="appConfig.main_window_close_event"
              :items="appConfigEnum.main_window_close_event"
              item-title="title"
              item-value="value"
              variant="underlined"
              @update:modelValue="changeAppConfig('main_window_close_event', $event)"
          ></v-select>
        </v-col>
      </v-row>

    </div>
  </v-bottom-navigation>
</template>
<script>
import {defineComponent} from "vue";
import tool from "../../plugins/tool";
import {api} from "../../plugins/api";
import {ipcRenderer} from "electron";
import appConfig from '../../../electron/conf/app';

export default defineComponent({
  name: "AddSetting",
  props: ['openSettingStatus'],
  data() {
    return {
      appConfig: {
        auto_show_danmaku: {title: '自动开启', value: 1},
        video_replay_event: {title: '继续播放', value: 0},
        main_window_close_event: {title: '直接退出程序', value: 1},
      },
      appConfigEnum: appConfig.getConfigEnum(),
      unBindDialog: false,
      bindEmail: "未绑定邮箱",
      bindStatus: false,
      bindEmailDialog: false,
      verificationCodeBtnMsg: "发送验证码",
      sendVerificationCodeBtnLoading: false,
      sendVerificationCodeBtnDisable: false,
      sendVerificationCodeBtnDisableStyle: "opacity:1;color:#1d9f37",
      inputEmail: "", // 邮箱值
      inputVerificationCode: "", // 验证码值
      inputEmailError: "", // 邮箱输入错误提示
      inputVerificationCodeError: "", // 验证码输入错误的提示
      appVersion: process.env.APP_VERSION
    }
  },
  methods: {
    changeAppConfig(key, event) {
      let tmpConfig = []
      if (key === 'auto_show_danmaku') {
        tmpConfig = this.appConfigEnum.auto_show_danmaku
        this.appConfig.auto_show_danmaku = tmpConfig[event]
      } else if (key === 'video_replay_event') {
        tmpConfig = this.appConfigEnum.video_replay_event
        this.appConfig.video_replay_event = tmpConfig[event]
      } else {
        tmpConfig = this.appConfigEnum.main_window_close_event
        this.appConfig.main_window_close_event = tmpConfig[event]
      }
      // console.log(this.appConfig)
      const config = {
        auto_show_danmaku: this.appConfig.auto_show_danmaku.value,
        video_replay_event: this.appConfig.video_replay_event.value,
        main_window_close_event: this.appConfig.main_window_close_event.value
      }
      console.log(config)
      ipcRenderer.send('sync-app-config', [config])
    },
    // 发送验证码
    sendVerificationCode() {
      console.log(this.inputEmail, this.inputVerificationCode)
      if (this.checkInputEmail()) {
        if (this.inputEmail === "") {
          this.inputEmailError = "请填写邮箱"
        } else {
          this.sendVerificationCodeBtnLoading = true
          api.sendVerificationCodeMail(this.inputEmail).then((data) => {
            if (data.code !== 200) {
              ipcRenderer.send('alert-msg', ['error', data.msg])
              this.sendVerificationCodeBtnLoading = false
            } else {
              let i = 60
              let countdown = setInterval(() => {
                if (i <= 0) {
                  this.sendVerificationCodeBtnDisableStyle = 'opacity:1;color:#1d9f37'
                  this.sendVerificationCodeBtnDisable = false
                  this.verificationCodeBtnMsg = "发送验证码"
                  clearInterval(countdown)
                } else {
                  this.sendVerificationCodeBtnDisableStyle = 'opacity:1;color:#858585'
                  this.verificationCodeBtnMsg = i + "秒后重试"
                  this.sendVerificationCodeBtnDisable = true
                  i = i - 1
                }
                if (this.sendVerificationCodeBtnLoading) {
                  this.sendVerificationCodeBtnLoading = false
                }
              }, 1000)
            }
          })
        }
      }
    },
    async checkInputEmail() {
      if (this.inputEmail !== "" && !tool.isEmail(this.inputEmail)) {
        this.inputEmailError = "邮箱格式错误"
        return false
      }
      this.inputEmailError = ""
      return true
    },
    checkInputVerificationCode() {
      this.inputVerificationCodeError = ""
      return true
    },
    async doBindEmail() {
      if (this.inputEmail && this.inputVerificationCode) {
        const response = await ipcRenderer.invoke('bind-email', [this.inputEmail, this.inputVerificationCode])
        if (response.code !== 200) {
          ipcRenderer.send('alert-msg', ['error', response.msg])
        } else {
          this.bindEmailDialog = false
          ipcRenderer.send('alert-msg', ['success', '绑定成功'])
          ipcRenderer.send('reflush-live-list', [])
          await this.flushBindInfo()
        }
      } else {
        if (!this.inputEmail) {
          this.inputEmailError = "请填写邮箱"
        }
        if (!this.inputVerificationCode) {
          this.inputVerificationCodeError = "请填写验证码"
        }
      }
    },
    // 解除绑定
    async doUnbindEmail() {
      const response = await ipcRenderer.invoke('unbind-email', [])
      console.log(response)
      if (response.code !== 200) {
        ipcRenderer.send('alert-msg', ['error', response.msg])
      } else {
        this.bindEmail = '未绑定邮箱'
        this.bindStatus = false
        this.unBindDialog = false
        ipcRenderer.send('alert-msg', ['success', '解绑成功'])
        await this.flushBindInfo()
      }
    },
    async flushBindInfo() {
      const response = await ipcRenderer.invoke('get-bind-email', [])
      if (response.code !== 200) {
        ipcRenderer.send('alert-msg', ['error', response.msg])
      } else {
        this.bindStatus = response.data.bind_status
        if (this.bindStatus) {
          this.bindEmail = response.data.bind_email
        } else {
          this.bindEmail = '未绑定邮箱'
        }
      }
    }
  },
  mounted() {
    const self = this;

    setTimeout(() => {
      self.flushBindInfo()

      ipcRenderer.invoke('get-app-config', []).then((appConfig) => {
        self.appConfig.auto_show_danmaku = self.appConfigEnum.auto_show_danmaku[appConfig.auto_show_danmaku]
        self.appConfig.main_window_close_event = self.appConfigEnum.main_window_close_event[appConfig.main_window_close_event]
        self.appConfig.video_replay_event = self.appConfigEnum.video_replay_event[appConfig.video_replay_event]
      })

      ipcRenderer.invoke('get-app-version').then((ver) => {
        self.appVersion = ver
      })
    }, 3000);


  },
  watch: {
    bindEmailDialog: function (newVal, oldVal) {
      if (newVal === false) {
        setTimeout(() => {
          this.inputEmail = ""
          this.inputVerificationCode = ""
          this.inputEmailError = ""
          this.inputVerificationCodeError = ""
        }, 500)
      }
    }
  },
})
</script>
<style scoped>
#app-setting {
  width: 300px;
  height: 440px;
  border-left: 1px #0000001f solid;
  border-right: 1px #0000001f solid;
  border-bottom: 1px #0000001f solid;
  border-radius: 0 0 5px 5px;
}
</style>

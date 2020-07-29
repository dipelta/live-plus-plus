<template>
  <div id="box-bg">
    <div id="err-box" :class="msgBoxType">
      <div class="msg-content" style="text-align: center;word-break: break-all">{{ msgContent }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
@Component({
  name: 'MessageBox'
})
export default class extends Vue {
  private msgContent: string = '程序发生异常'
  private msgBoxType: string = 'error'

  created () {
    if (this.msgBoxType === 'error') {
      this.msgBoxType = 'error'
    } else if (this.msgBoxType === 'warning') {
      this.msgBoxType = 'warning'
    } else {
      this.msgBoxType = 'success'
    }
  }
}
</script>

<style>
#err-box {
  padding: 10px;
  min-width: 150px;
  min-height: 40px;
  max-width: 250px;
  background: #4bb04f;
  font-size: 15px;
  color: white;
  border-radius: 4px;
  margin: 220px auto;
  width: max-content;
  pointer-events: all;
  box-shadow: 0 2px 1px -1px rgba(0,0,0,.2),0 1px 1px 0 rgba(0,0,0,.14),0 1px 3px 0 rgba(0,0,0,.12)!important;
  /*box-shadow: 0 2px 20px 2px rgba(0,0,0,.2), 0 2px 2px 0 rgba(0,0,0,.14), 0 2px 2px 0 rgba(0,0,0,.12);*/
  /*box-shadow: 0 2px 10px 2px rgba(0, 0, 0, 0.15);*/
}

#box-bg {
  position: fixed;
  width: 100%;
  height: 100%;
  z-index: 8;
  pointer-events: none;
}

#err-box .success {
  background: #4bb04f;
}

#err-box .error {
  background: #f44336;
}
</style>

import Vue from 'vue'
import MessageBox from '../../renderer/components/MessageBox.vue'
const MsgBox = Vue.extend(MessageBox)

const Message = {
  show: (content: string, type?: string) => {
    const instance = new MsgBox({
      data: {
        msgBoxStatus: true,
        msgContent: content,
        msgBoxType: type
      }
    }).$mount()
    // @ts-ignore
    document.getElementsByClassName('v-application--wrap')[0].appendChild(instance.$el)
    Vue.nextTick(function () {
      instance.msgBoxStatus = true
    })
    const timer = setTimeout(() => {
      clearTimeout(timer)
      instance.msgBoxStatus = false
      // 从body中移除
      // @ts-ignore
      document.getElementsByClassName('v-application--wrap')[0].removeChild(instance.$el)
      instance.$destroy() // 销毁
    }, 2000)
  }
}
export default Message

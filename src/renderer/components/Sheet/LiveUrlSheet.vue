<template>
  <v-bottom-sheet id="liveUrlSheet" v-model="liveUrlSheet" hide-overlay dark persistent no-click-animation>
    <v-sheet class="text-center" id="liver-url-sheet" height="90px" style="border-radius: 0" color="grey darken-3" >
      <div class="py-3">https://d1--cn-gotcha04.bilivideo.com/live-bvc/475552/live_3117396_4657598.flv?cdn=cn-gotcha04&expires=1594892261&len=0&oi=2871765403&pt=web&qn=10000&trid=8220be5a7545498a970bae5294f48212&sigparams=cdn,expires,len,oi,pt,qn,trid&sign=ecb1aef6594b2285a65237397609cb41&ptype=0&src=9&level=4</div>
    </v-sheet>
  </v-bottom-sheet>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
@Component({
  name: 'LiveUrlSheet'
})
export default class extends Vue {
  @Prop() liveUrlSheet: boolean | undefined
}
</script>

<style scoped>

</style>

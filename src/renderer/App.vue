<template>
  <v-app id="vapp">
    <router-view id="route-view"></router-view>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
@Component({
  name: 'liveplus'
})
export default class extends Vue {
}
</script>
<style>
#vapp {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  border-radius: 5px;
  background: #fff0;
}

.v-application--wrap {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

#route-view {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  border-radius: 5px;
}
</style>

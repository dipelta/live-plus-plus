<template>
  <v-container>
    <h1>About</h1>
    <h2>{{ msg }}</h2>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
@Component({
  name: 'About'
})
export default class extends Vue {
  msg = 'qwert'
}
</script>

<style scoped>

</style>

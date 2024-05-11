<!-- Please remove this file from your project -->
<template>
  <trading-vue
    :data="graphData"
    :width="width"
    :height="height"
  />
</template>

<script>
import TradingVue from 'trading-vue-js'

export default {
  name: 'TradeGraph',
  components: { TradingVue },
  props: {
    width: {
      type: Number,
      default: window.innerWidth
    },
    height: {
      type: Number,
      default: window.innerHeight
    },
    graphData: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      colors: {
        colorBack: '#fff',
        colorGrid: '#eee',
        colorText: '#333'
      }
    }
  }
}
</script>

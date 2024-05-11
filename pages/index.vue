<template>
  <section id="components-layout-demo-basic">
    <div>
      <a-layout>
        <a-layout>
          <a-layout-content ref="container">
            <div v-if="loading" class="loading-content">
              <a-spin tip="Loading..." />
            </div>
            <TradeGraph
              v-else
              :graph-data="chartData"
              :width="width"
              :height="height"
            />
          </a-layout-content>
          <a-layout-sider>
            <div v-if="symbols.length == 0" class="loading-sider">
              <a-spin tip="Loading..." />
            </div>
            <a-menu v-else style="width: 100%" mode="inline" @click="handleClick">
              <a-menu-item
                v-for="name, index in symbols"
                :key="index"
                :class="{ 'ant-menu-item-selected': currentSymbolIndex == index}"
                :href="`/${name}`"
              >
                {{ name }}
              </a-menu-item>
            </a-menu>
          </a-layout-sider>
        </a-layout>
      </a-layout>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { Offchart } from '~/models/Offcahrt'
import { Onchart } from '~/models/Onchart'

export default defineComponent({
  name: 'IndexPage',
  data () {
    return {
      chartData: {
        ohlcv: [],
        onchart: [] as Array<Onchart>,
        offchart: [] as Array<Offchart>
      },
      symbols: [] as Array<string>,
      loading: true,
      errorSymbols: '',
      errorChart: '',
      currentSymbolIndex: 0,
      width: 0,
      height: 0
    }
  },
  async mounted () {
    this.setContainerSize()
    window.addEventListener('resize', this.setContainerSize)
    window.addEventListener('keydown', this.handleKeyDown)
    await this.fetchSymbols()
    this.currentSymbolIndex =
      typeof this.$route.query.symbol === 'string'
        ? this.symbols.indexOf(this.$route.query.symbol)
        : 0
    await this.fetchChartData()
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.setContainerSize)
    window.removeEventListener('keydown', this.handleKeyDown)
  },
  methods: {
    handleClick (e: any) {
      this.currentSymbolIndex = e.key
      this.$router.push({ query: { symbol: this.symbols[e.key] } })
    },
    async handleKeyDown (event: { key: any }) {
      switch (event.key) {
        case ' ':
          await this.fetchChartData()
          break
        case 'ArrowUp':
          this.currentSymbolIndex = (this.currentSymbolIndex - 1 + this.symbols.length) % this.symbols.length
          this.$router.push({ query: { symbol: this.symbols[this.currentSymbolIndex] } })
          await this.fetchChartData()
          break
        case 'ArrowDown':
          this.currentSymbolIndex = (this.currentSymbolIndex + 1) % this.symbols.length
          this.$router.push({ query: { symbol: this.symbols[this.currentSymbolIndex] } })
          await this.fetchChartData()
          break
        default:
          break
      }
    },
    async fetchChartData (): Promise<void> {
      try {
        this.chartData = {
          ohlcv: [],
          onchart: [] as Array<Onchart>,
          offchart: [] as Array<Offchart>
        }
        this.loading = true
        const data = await this.$axios.$get(`price/${this.symbols[this.currentSymbolIndex]}`)
        const dataLogs = await this.$axios.$get(`log/${this.symbols[this.currentSymbolIndex]}`)

        this.chartData.ohlcv = data.map(
          (obj: {
            timestamp: string;
            open: string;
            high: string;
            low: string;
            close: string;
          }) => [
            parseInt(obj.timestamp),
            parseFloat(obj.open),
            parseFloat(obj.high),
            parseFloat(obj.low),
            parseFloat(obj.close),
            0
          ]
        )

        const positionSizeLong = dataLogs.map(
          (obj: { timestamp: string; position_size_long: string }) => [
            parseInt(obj.timestamp),
            parseFloat(obj.position_size_long)
          ]
        )

        const leverageLong = dataLogs.map((obj: { leverage_long: string; timestamp: string; }, index: number) => {
          let leverageLongValue = parseFloat(obj.leverage_long)
          if (leverageLongValue === null || isNaN(leverageLongValue)) {
            leverageLongValue =
              index > 0 ? parseFloat(dataLogs[index - 1].leverage_long) : 0
          }
          return [parseInt(obj.timestamp), leverageLongValue]
        })

        const equity = dataLogs.map((obj: { equity: string; timestamp: string; }, index: number) => {
          let equityValue = parseFloat(obj.equity)
          if (equityValue === null || isNaN(equityValue)) {
            equityValue =
              index > 0 ? parseFloat(dataLogs[index - 1].equity) : 0
          }
          return [parseInt(obj.timestamp), equityValue]
        })

        const ma4 = data.map((obj: { timestamp: string; ma_4: string }) => [
          parseInt(obj.timestamp),
          parseFloat(obj.ma_4)
        ])

        const maBig = data.map((obj: { timestamp: string; ma_big: string }) => [
          parseInt(obj.timestamp),
          parseFloat(obj.ma_big)
        ])

        const dev = data.map((obj: { timestamp: string; dev: string }) => [
          parseInt(obj.timestamp),
          parseFloat(obj.dev)
        ])

        this.chartData.onchart.push({
          name: 'ma_4',
          type: 'EMA',
          data: ma4,
          settings: {
            lineWidth: 2
          }
        })

        this.chartData.onchart.push({
          name: 'ma_big',
          type: 'EMA',
          data: maBig,
          settings: {
            lineWidth: 2
          }
        })

        this.chartData.onchart.push({
          name: 'dev',
          type: 'EMA',
          data: dev,
          settings: {
            lineWidth: 2
          }
        })

        this.chartData.onchart.push({
          name: 'position_size_long',
          data: positionSizeLong,
          type: 'EMA',
          settings: {
            lineWidth: 2,
            upper: 70,
            lower: 30,
            backColor: '#9b9ba316',
            bandColor: '#666'
          }
        })

        this.chartData.offchart.push({
          name: 'leverage_long',
          type: 'RSI',
          data: leverageLong,
          settings: {
            lineWidth: 2,
            upper: 70,
            lower: 30,
            backColor: '#9b9ba316',
            bandColor: '#666'
          }
        })

        this.chartData.offchart.push({
          name: 'equity',
          type: 'RSI',
          data: equity,
          settings: {
            lineWidth: 2,
            upper: 70,
            lower: 30,
            backColor: '#9b9ba316',
            bandColor: '#666'
          }
        })
      } catch (error) {
        this.errorChart = 'Error fetching candles'
      } finally {
        this.loading = false
      }
    },
    async fetchSymbols () {
      try {
        const data = await this.$axios.$get('symbols')
        data.forEach((obj: { symbol: string }) =>
          this.symbols.push(obj.symbol)
        )
      } catch (error) {
        this.errorSymbols = 'Error fetching symbols'
      }
    },
    setContainerSize () {
      const container = this.$refs.container
      this.width = container?.$el.offsetWidth - 60 ?? 0
      this.height = window.innerHeight
    }
  }
})
</script>

<style>
  body{
    background: rgb(18, 24, 38);
  }
  .menuitem.active{
    background: #23a776;
    color: #fff;
  }
  .loading-content, .loading-sider{
    width: 100%;
    height: 100vh;
    justify-content: center;
    align-items: center;
    display: flex;
  }
  #components-layout-demo-basic {
    text-align: center;
  }
  #components-layout-demo-basic .ant-layout-sider {
    background: rgb(18, 24, 38);
    color: #fff;
    line-height: 120px;
    border-right: 1px solid #fff;
  }
  #components-layout-demo-basic .ant-layout-content {
    background: rgb(18, 24, 38);
    color: #fff;
    min-height: 120px;
    line-height: 120px;
    overflow: hidden;
  }
  #components-layout-demo-basic > .ant-layout {
    margin-bottom: 48px;
  }
  #components-layout-demo-basic > .ant-layout:last-child {
    margin: 0;
  }
</style>

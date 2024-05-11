import { ChartSettings } from './ChartSettings'

export interface Offchart {
  name: string
  type: string
  data: number[][]
  settings: ChartSettings
}

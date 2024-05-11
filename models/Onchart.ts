import { ChartSettings } from './ChartSettings'

export interface Onchart {
    name: string
    type: string
    data: number[][]
    settings: ChartSettings
  }

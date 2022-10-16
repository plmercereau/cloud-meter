<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { sub } from 'date-fns'

import { computed, watch, watchEffect } from 'vue'
import { Line } from 'vue-chartjs'
import 'chartjs-adapter-date-fns'

import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  TimeSeriesScale,
  ChartData
} from 'chart.js'
import { TChartOptions } from 'vue-chartjs/dist/types'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  TimeSeriesScale,
  LinearScale,
  PointElement
)

type AvgRecord = { time: string; avg: number }
type AvgRecords = Array<AvgRecord>
type Record = { createdAt: string, value: number }

const tick = sub(new Date(), { minutes: 10 }).toISOString()
const QUERY = gql`
  query previousValues($tick: timestamptz!) {
    temperatureRecap(where: { time: { _lte: $tick } }) {
      time
      avg
    }
  }
`

const NEW_VALUES = gql`
  subscription newValues($tick: timestamptz!) {
    temperatureRecap(where: { time: { _gt: $tick } }) {
      time
      avg
    }
  }
`

const LAST_TEMPERATURE = gql`
subscription lastValue {
  temperature(limit: 1, order_by: {createdAt: desc}) {
    createdAt
    value
  }
}`

const { result, subscribeToMore } = useQuery<{ temperatureRecap: AvgRecords }>(
  QUERY,
  { tick }
)

subscribeToMore({
  document: NEW_VALUES,
  variables: { tick },
  updateQuery: (previousResult, { subscriptionData }) => {
    const previous: AvgRecords = previousResult?.temperatureRecap || []
    const next: AvgRecords = subscriptionData.data.temperatureRecap || []
    return { temperatureRecap: [...previous.filter((r) => !next.find((n) => n.time === r.time)), ...next] }
  }
})

const chartData = computed<ChartData<'line', Array<any>>>(() => ({
  datasets: [
    {
      label: 'Temperature',
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
      fill: false,

      data: result.value?.temperatureRecap || []
    }
  ]
}))

const chartOptions: TChartOptions<'line'> = {
  maintainAspectRatio: false,
  parsing: {
    xAxisKey: 'time',
    yAxisKey: 'avg'
  },
  scales: {
    x: {
      type: 'time'
    }
  }
}

const { result: lastValueResult } = useSubscription<{ temperature: Array<Record> }>(LAST_TEMPERATURE, null, { fetchPolicy: 'no-cache' })
const lastValue = computed<Record | undefined>(() => lastValueResult.value?.temperature[0])
</script>

<template>
  <h2 v-if="lastValue">Last value: {{lastValue.value}} at {{lastValue.createdAt}}</h2>
  <Line :chart-data="chartData" :chart-options="chartOptions"></Line>
</template>

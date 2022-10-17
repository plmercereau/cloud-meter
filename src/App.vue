<script setup lang="ts">
import { useQuery, useSubscription } from '@vue/apollo-composable'
import gql from 'graphql-tag'
import { sub } from 'date-fns'

import { computed } from 'vue'
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

type AvgRecord = { time: string; value: number }
type AvgRecords = Array<AvgRecord>
type Record = { created_at: string, value: number }

const tick = sub(new Date(), { minutes: 10 }).toISOString()
const QUERY = gql`
  query previousValues($tick: timestamptz!) {
    measurement(where: { time: { _lte: $tick } }) {
      time
      value
    }
  }
`

const NEW_VALUES = gql`
  subscription newValues($tick: timestamptz!) {
    measurement(where: { time: { _gt: $tick } }) {
      time
      value
    }
  }
`

const LAST_TEMPERATURE = gql`
subscription lastValue {
  measurement(limit: 1, order_by: {created_at: desc}) {
    created_at
    value
  }
}`

const { result, subscribeToMore } = useQuery<{ measurement: AvgRecords }>(
  QUERY,
  { tick }
)

subscribeToMore({
  document: NEW_VALUES,
  variables: { tick },
  updateQuery: (previousResult, { subscriptionData }) => {
    const previous: AvgRecords = previousResult?.measurement || []
    const next: AvgRecords = subscriptionData.data.measurement || []
    return { measurement: [...previous.filter((r) => !next.find((n) => n.time === r.time)), ...next] }
  }
})

const chartData = computed<ChartData<'line', Array<any>>>(() => ({
  datasets: [
    {
      label: 'Value',
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
      fill: false,

      data: result.value?.measurement || []
    }
  ]
}))

const chartOptions: TChartOptions<'line'> = {
  maintainAspectRatio: false,
  parsing: {
    xAxisKey: 'time',
    yAxisKey: 'value'
  },
  scales: {
    x: {
      type: 'time'
    }
  }
}

const { result: lastValueResult } = useSubscription<{ measurement: Array<Record> }>(LAST_TEMPERATURE, null, { fetchPolicy: 'no-cache' })
const lastValue = computed<Record | undefined>(() => lastValueResult.value?.measurement[0])
</script>

<template>
  <h2 v-if="lastValue">Last value: {{lastValue.value}} at {{lastValue.created_at}}</h2>
  <Line :chart-data="chartData" :chart-options="chartOptions"></Line>
</template>

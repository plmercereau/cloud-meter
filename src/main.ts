import { createApp } from 'vue'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { DefaultApolloClient } from '@vue/apollo-composable'

import App from './App.vue'

const BACKEND_URL = 'https://sqvwhuifcpyhrnllsxdf.nhost.run/v1/graphql'

import { HttpLink, split } from '@apollo/client/core'
import { WebSocketLink } from '@apollo/client/link/ws'
import { getMainDefinition } from '@apollo/client/utilities'

// TODO sqvwhuifcpyhrnllsxdf / eu-central-1
// Create an http link:
const httpLink = new HttpLink({
  uri: BACKEND_URL
})

// Create a WebSocket link:
const wsLink = new WebSocketLink({
  uri: BACKEND_URL.replace(/^http/, 'ws'),
  options: {
    reconnect: true
  }
})

// using the ability to split links, you can send data to each link
// depending on what kind of operation is being sent
const link = split(
  // split based on operation type
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

// Create the apollo client
const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache()
})

createApp(App).provide(DefaultApolloClient, apolloClient).mount('#app')

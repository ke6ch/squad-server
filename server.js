const dotenv = require('dotenv')
const { ApolloServer } = require('apollo-server-express')
const app = require('./app')

dotenv.config()

const { typeDefs, resolvers } = require('./schema')

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.applyMiddleware({ app })

app.listen({ port: process.env.PORT }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
)

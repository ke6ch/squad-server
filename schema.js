const { gql, ApolloError } = require('apollo-server-express')
const path = require('path')
const { createWriteStream } = require('fs')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const elasticsearch = require('./datasources/elasticsearch')

const typeDefs = gql`
  type User {
    id: ID!
    name: String
    email: String
    imageUrl: String
    subImage: [String]
    rank: String
    occupation: String
    address: String
    message: String
    jobHistory: String
    favorite: [String]
    timestamp: String
  }

  type Rank {
    rank: String
  }

  type Occupation {
    name: String
  }

  type Address {
    address: String
  }

  type Auth {
    id: ID!
    token: String!
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type Query {
    user(id: ID!): User!
    users(occupation: [String], rank: [String], address: [String]): [User!]
    ranks: [String]
    occupations: [String]
    addresses: [String]
    uploads: [File]
  }

  input updateUser {
    id: ID!
    name: String
    email: String
    rank: String
    occupation: String
    address: String
    jobHistory: String
    message: String
  }

  input updateFavorite {
    id: ID!
    favorite: String
    flag: Boolean
  }

  type Mutation {
    login(email: String!, password: String!): Auth!
    putUser(input: updateUser): User
    singleUpload(file: Upload!, id: ID!): User!
    putFavorite(input: updateFavorite): Boolean
  }
`

const resolvers = {
  Query: {
    users: async () => {
      try {
        const result = await elasticsearch.getAllDocuments()
        return result
      } catch (e) {
        console.log(e)
        throw new ApolloError(e)
      }
    },
    user: async (_, { id }) => {
      try {
        const result = await elasticsearch.getFilterDocuments(id)
        return result
      } catch (e) {
        console.log(e)
        throw new ApolloError(e)
      }
    },
    occupations: async () => {
      try {
        const result = await elasticsearch.getOccupations()
        return result
      } catch (e) {
        console.log(e)
        throw new ApolloError(e)
      }
    },
    ranks: async () => {
      try {
        const result = await elasticsearch.getRanks()
        return result
      } catch (e) {
        console.log(e)
        throw new ApolloError(e)
      }
    },
    addresses: async () => {
      try {
        const result = await elasticsearch.getAddresses()
        return result
      } catch (e) {
        console.log(e)
        throw new ApolloError(e)
      }
    },
    uploads: async () => {
      console.log('uploads')
    },
  },
  Mutation: {
    login: async (_, { email, password }) => {
      const result = await elasticsearch.getUser(email)

      if (result.length === 0) {
        throw new Error('User does not exitst!')
      }

      const match = await bcrypt.compare(password, result.password)

      if (!match) {
        throw new Error('Password is incorrect!')
      }

      const token = jwt.sign({ email, id: result.id }, process.env.SECRET_KEY, {
        expiresIn: '10000',
      })

      return {
        id: result.id,
        token,
      }
    },
    putUser: async (_, { input }) => {
      try {
        await elasticsearch.putUser(input)
        return true
      } catch (e) {
        console.log(e)
        throw new ApolloError(e)
      }
    },
    singleUpload: async (_, { file }) => {
      const { createReadStream, filename } = await file
      await new Promise((res) => {
        createReadStream()
          .pipe(createWriteStream(path.join(__dirname, 'public', filename)))
          .on('close', res)
      })
      console.log('uploadFile')

      return {
        filename,
        mimetype: file.mimetype,
        encoding: file.encoding,
      }
    },
    putFavorite: async (_, { input }) => {
      const { flag } = input
      try {
        if (flag) {
          await elasticsearch.addFavorite(input)
        } else {
          await elasticsearch.deleteFavorite(input)
        }
      } catch (e) {
        console.log(JSON.stringify(e))
        throw new ApolloError(e)
      }
      return true
    },
  },
}

module.exports = {
  typeDefs,
  resolvers,
}

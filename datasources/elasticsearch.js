require('dotenv').config()
const { Client } = require('@elastic/elasticsearch')

const ALIAS_NAME = 'users'

const client = new Client({ node: process.env.DATASTORE_URL })

async function getAllDocuments() {
  const params = {
    index: ALIAS_NAME,
  }

  const response = await client.search(params)
  return response.body.hits.hits.map((row) => {
    return row._source
  })
}

async function getFilterDocuments(id) {
  const params = {
    index: ALIAS_NAME,
    body: {
      query: {
        term: {
          id,
        },
      },
    },
  }

  const { body } = await client.search(params)
  const response = body.hits.hits.map((row) => {
    return row._source
  })
  return response[0]
}

async function getOccupations() {
  const params = {
    index: ALIAS_NAME,
    size: 0,
    body: {
      aggs: {
        occupations: {
          terms: {
            field: 'occupation',
          },
        },
      },
    },
  }

  const { body } = await client.search(params)
  return body.aggregations.occupations.buckets.map((row) => {
    return { name: row.key }
  })
}

async function getRanks() {
  const params = {
    index: ALIAS_NAME,
    size: 0,
    body: {
      aggs: {
        ranks: {
          terms: {
            field: 'rank',
          },
        },
      },
    },
  }

  const { body } = await client.search(params)
  return body.aggregations.ranks.buckets.map((row) => {
    return { rank: row.key }
  })
}

async function getAddresses() {
  const params = {
    index: ALIAS_NAME,
    size: 0,
    body: {
      aggs: {
        addresses: {
          terms: {
            field: 'address',
          },
        },
      },
    },
  }

  const { body } = await client.search(params)
  return body.aggregations.addresses.buckets.map((row) => {
    return { address: row.key }
  })
}

async function getUser(email) {
  const params = {
    index: ALIAS_NAME,
    body: {
      query: {
        term: {
          email,
        },
      },
    },
  }

  const response = await client.search(params)
  const result = response.body.hits.hits.map((row) => {
    return row._source
  })
  return result[0]
}

async function putUser(input) {
  const {
    id,
    name,
    email,
    rank,
    occupation,
    address,
    jobHistory,
    message,
  } = input
  const params = {
    index: ALIAS_NAME,
    refresh: true,
    body: {
      script: {
        lang: 'painless',
        source: `
          ctx._source["name"] = params.name;
          ctx._source["email"] = params.email;
          ctx._source["rank"] = params.rank;
          ctx._source["occupation"] = params.occupation;
          ctx._source["address"] = params.address;
          ctx._source["jobHistory"] = params.jobHistory;
          ctx._source["message"] = params.message`,
        params: {
          name,
          email,
          rank,
          occupation,
          address,
          jobHistory,
          message,
        },
      },
      query: {
        term: {
          id,
        },
      },
    },
  }

  const { statusCode } = await client.updateByQuery(params)
  return statusCode === 200
}

async function addFavorite(input) {
  const { id, favorite } = input
  const params = {
    index: ALIAS_NAME,
    refresh: true,
    body: {
      script: {
        lang: 'painless',
        source: `
          ctx._source["favorite"].add(params.favorite)`,
        params: {
          favorite,
        },
      },
      query: {
        term: {
          id,
        },
      },
    },
  }

  const result = await client.updateByQuery(params)
  return result.statusCode
}
async function deleteFavorite(input) {
  const { id, favorite } = input
  const params = {
    index: ALIAS_NAME,
    refresh: true,
    body: {
      script: {
        lang: 'painless',
        source: `
          ctx._source["favorite"].remove(ctx._source["favorite"].indexOf(params.favorite))`,
        params: {
          favorite,
        },
      },
      query: {
        term: {
          id,
        },
      },
    },
  }

  const result = await client.updateByQuery(params)
  return result.statusCode
}

module.exports = {
  getAllDocuments,
  getFilterDocuments,
  getOccupations,
  getRanks,
  getAddresses,
  getUser,
  putUser,
  addFavorite,
  deleteFavorite,
}

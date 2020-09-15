/* eslint-disable comma-dangle */
/* eslint-disable no-await-in-loop */
const { ApolloServer, gql } = require("apollo-server");
const { GraphQLClient } = require("graphql-request");
const { Headers } = require("node-fetch");
const { getAverageTime } = require("./utils");

require("dotenv").config();

global.Headers = global.Headers || Headers;

const graphQLClient = new GraphQLClient(process.env.GITHUB_API, {
  headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}` },
});

const typeDefs = gql`
  type Resposta1 {
    quest: String
    metric: String
    response: String
    totalRepos: Int
    avgDates: String
  }
  type Query {
    resposta1: Resposta1
  }
`;
const resolvers = {
  Query: {
    resposta1: async () => {
      const response = {
        quest: "Sistemas populares são maduros/antigos?",
        metric: "Idade do repositorio",
        response: "",
        totalRepos: 0,
        avgDates: "",
      };
      let repos = [];
      let hasPageToContinue = true;

      const variables = {
        nextPage: null,
      };
      while (hasPageToContinue && repos.length < 4) {
        const data = await graphQLClient.request(
          gql`
            query getRepos($nextPage: String) {
              search(
                type: REPOSITORY
                query: "stars:>10000"
                first: 2
                after: $nextPage
              ) {
                pageInfo {
                  startCursor
                  hasNextPage
                }
                edges {
                  node {
                    ... on Repository {
                      name
                      createdAt
                      stargazers {
                        totalCount
                      }
                    }
                  }
                }
              }
            }
          `,
          variables
        );

        const {
          search: {
            pageInfo: { startCursor, hasNextPage },
            edges,
          },
        } = data;

        variables.nextPage = startCursor;
        if (!hasNextPage) {
          hasPageToContinue = false;
        }

        repos = [...repos, ...edges];
      }
      response.totalRepos = repos.length;
      response.avgDates = getAverageTime(repos);
      response.response = `A média de datas de sistemas populares é do ano de ${response.avgDates.getFullYear()}`;
      return response;
    },
  },
};
const server = new ApolloServer({ typeDefs, resolvers });
server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

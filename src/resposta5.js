/* eslint-disable comma-dangle */
/* eslint-disable no-await-in-loop */
const { GraphQLClient, gql } = require("graphql-request");
const { Headers } = require("node-fetch");
const converter = require("json-2-csv");
const fs = require("fs");

require("dotenv").config();

global.Headers = global.Headers || Headers;

const graphQLClient = new GraphQLClient("https://api.github.com/graphql", {
  headers: { authorization: `bearer ${process.env.GITHUB_TOKEN}` },
});

async function resposta5() {
  let repos = [];
  let hasPageToContinue = true;

  const variables = {
    nextPage: null,
  };
  while (hasPageToContinue && repos.length < 1000) {
    const data = await graphQLClient.request(
      gql`
        query getRepos($nextPage: String) {
          search(
            type: REPOSITORY
            query: "stars:>10000"
            first: 100
            after: $nextPage
          ) {
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              node {
                ... on Repository {
                  name
                  stargazers {
                    totalCount
                  }
                  languages(
                    orderBy: { field: SIZE, direction: DESC }
                    first: 1
                  ) {
                    totalSize
                    totalCount
                    edges {
                      size
                      node {
                        name
                      }
                    }
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
        pageInfo: { endCursor, hasNextPage },
        edges,
      },
    } = data;

    variables.nextPage = endCursor;
    if (!hasNextPage) {
      hasPageToContinue = false;
    }

    repos = [...repos, ...edges];
  }

  converter.json2csv(repos, (err, csv) => {
    if (err) {
      throw err;
    }

    fs.writeFileSync("resposta5.csv", csv);
  });
  return "resposta5.csv gerado na raíz do projeto";
}

resposta5().then((response) => console.log(response));

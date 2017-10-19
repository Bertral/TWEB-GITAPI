const gql = require('graphql-request');
const request = require('superagent');
const GitHubPublisher = require('github-publish');

const API_KEY = process.env.GITHUB_API_KEY;
const publisher = new GitHubPublisher(API_KEY, 'Farenjihn', 'ossroulette');

const client = new gql.GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `bearer ${API_KEY}`,
  },
});

const variables = {
  type: 'REPOSITORY',
  query: `stars:100..5000 pushed:>${(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);

    // Get the date as YYYY-MM-DD
    return date.toISOString().split('T')[0];
  })()}`,
  number: 100,
};

// GraphQL query
const query = `query getRepositories($type: SearchType!, $query: String!, $number: Int!) {
  search(type: $type, query: $query, first: $number) {
    repositoryCount
    nodes {
      ... on Repository {
        url
        nameWithOwner
        license
        stargazers {
          totalCount
        }
        languages(first: 3) {
          edges {
            node {
              name
            }
            size
          }
        }
        repositoryTopics(first: 5) {
          nodes {
            topic {
              name
            }
          }
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 20) {
                nodes {
                  committedDate
                }
              }
            }
          }
        }
      }
    }
  }
}`;

function fetchREADME(fullname) {
  return request
    .get(`https://api.github.com/repos/${fullname}/readme`)
    .auth('Farenjihn', API_KEY)
    .accept('application/vnd.github.v3.html')
    .buffer(true)
    .parse((res, fn) => {
      res.text = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        res.text += chunk;
      });

      res.on('end', () => {
        let body = null;

        try {
          body = res.text;
        } finally {
          fn(null, body);
        }
      });
    })
    .catch(() => null);
}

function processJSON(json) {
  const data = {};
  data.count = json.repositoryCount;
  data.repositories = [];

  const promises = [];

  // Reformat JSON a bit
  for (let i = 0; i < json.nodes.length; i += 1) {
    const node = json.nodes[i];
    const repo = {};

    repo.url = node.url;
    repo.fullname = node.nameWithOwner;
    repo.license = node.license;
    repo.stars = node.stargazers.totalCount;
    repo.topics = node.repositoryTopics.nodes;
    repo.commits = node.defaultBranchRef.target.history.nodes;

    repo.languages = [];

    for (let j = 0; j < node.languages.edges.length; j += 1) {
      const language = node.languages.edges[j];
      repo.languages.push({
        name: language.node.name,
        value: language.size,
      });
    }

    data.repositories.push(repo);
    promises.push(fetchREADME(repo.fullname));
  }

  // Wait for all REST queries to give a result back
  // and then proceed
  Promise.all(promises).then((array) => {
    for (let j = 0; j < array.length; j += 1) {
      const element = array[j];

      if (element !== null) {
        data.repositories[j].readme = element.body;
      } else {
        data.repositories[j].readme = null;
      }
    }

    // forced to do this because our file is heavy and the standard GET on
    // /repo/.../contents failed, our json data file is > 1MB so we get the
    // tree instead
    request
      .get('https://api.github.com/repos/Farenjihn/ossroulette/git/trees/master:docs')
      .auth('Farenjihn', API_KEY)
      .then((res) => {
        const { tree } = res.body;
        let sha = null;

        for (let i = 0; i < tree.length; i += 1) {
          const child = tree[i];

          if (child.path === 'data.json') {
            sha = child.sha;
            break;
          }
        }

        const options = {
          force: true,
          message: 'New data for roulette',
          sha,
        };

        publisher.publish('docs/data.json', JSON.stringify(data), options);
      });
  });
}

// Entrypoint
client.request(query, variables).then((data) => {
  processJSON(data.search);
});

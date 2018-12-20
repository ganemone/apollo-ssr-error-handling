const Koa = require('koa');
const React = require('react');
const {ApolloServer, gql} = require('apollo-server-koa');
const {SchemaLink} = require('apollo-link-schema');
const {ApolloClient} = require('apollo-client');
const {renderToStringWithData, ApolloProvider, Query} = require('react-apollo');
const {makeExecutableSchema} = require('graphql-tools');
const {InMemoryCache} = require('apollo-cache-inmemory');

const typeDefs = gql`
  type Query {
    hello: String
  }
`;

const resolvers = {
  Query: {
    hello: () => {
      throw new Error('FAIL')
    },
  },
};

const schema = makeExecutableSchema({typeDefs, resolvers})

const server = new ApolloServer({ typeDefs, resolvers });

const app = new Koa();
app.use(async (ctx, next) => {
  const client = new ApolloClient({
    // ssrMode must be set to true in order to use SSR hydrated cache.
    ssrMode: true,
    cache: new InMemoryCache(),
    link: new SchemaLink({ schema }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
      mutation: {
        errorPolicy: 'all',
      },
    },
  });
  const root = React.createElement('div', {}, [
    React.createElement(ApolloProvider, {client}, [
      React.createElement(Query, {
        query: gql`
        query Hello {
          hello
        }`
      }, (result) => {
        const {error, data, loading} = result;
        console.log('ERROR SHOULD NOT BE UNDEFINED', error);
        return `ERROR SHOULD NOT BE UNDEFINED ${error}`;
      })
    ])
  ]);
  const result = await renderToStringWithData(root);  
  ctx.body = `<html><head></head><body>${result}</body></html>`;
  return next();
});
server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`),
);
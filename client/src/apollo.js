import { ApolloClient, ApolloLink } from 'apollo-boost';
import { createUploadLink } from 'apollo-upload-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';

import api from './api';

const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
        onError(({ graphQLErrors }) => {
            const a = graphQLErrors;

            if(a) a.map(({ message }) => console.warn(message));
        }),
        createUploadLink({
            uri: api.api,
            credentials: 'include'
        })
    ]),
    defaultOptions: {
        watchQuery: {
          fetchPolicy: 'network-only',
          errorPolicy: 'ignore',
        },
        query: {
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        }
    }
});

export default client;
import { MethodEnum } from '@algolia/requester-common';
import { RequestOptions, serializeQueryParameters } from '@algolia/transporter';

import {
  MultipleQueriesOptions,
  MultipleQueriesQuery,
  MultipleQueriesResponse,
  SearchClient,
} from '../..';

export const multipleQueries = (base: SearchClient) => {
  return <TObject>(
    queries: readonly MultipleQueriesQuery[],
    requestOptions?: RequestOptions & MultipleQueriesOptions
  ): Readonly<Promise<MultipleQueriesResponse<TObject>>> => {
    const requests = queries.map(query => {
      return {
        ...query,
        params: serializeQueryParameters(query.params || {}),
      };
    });

    return base.transporter.read(
      {
        method: MethodEnum.Post,
        path: '1/indexes/*/queries',
        data: {
          requests,
        },
        cacheable: (requestOptions && requestOptions.cacheable) || true,
      },
      requestOptions
    );
  };
};

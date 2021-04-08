import { createWaitablePromise, encode, WaitablePromise } from '@algolia/client-common';
import { MethodEnum } from '@algolia/requester-common';
import { RequestOptions } from '@algolia/transporter';

import {
  DictionaryEntry,
  DictionaryName,
  SaveDictionaryEntriesOptions,
  SaveDictionaryEntriesResponse,
  SearchClient,
} from '../..';
import { waitAppTask } from '.';

export const saveDictionaryEntries = (base: SearchClient) => {
  return (
    dictionary: DictionaryName,
    entries: readonly DictionaryEntry[],
    requestOptions?: RequestOptions & SaveDictionaryEntriesOptions
  ): Readonly<WaitablePromise<SaveDictionaryEntriesResponse>> => {
    const requests = entries.map(entry => ({
      actionType: 'addEntry',
      body: entry,
    }));

    return createWaitablePromise<SaveDictionaryEntriesResponse>(
      base.transporter.write(
        {
          method: MethodEnum.Post,
          path: encode('/1/dictionaries/%s/batch', dictionary),
          data: { clearExistingDictionaryEntries: false, requests },
        },
        requestOptions
      ),
      (response, waitRequestOptions) => waitAppTask(base)(response.taskID, waitRequestOptions)
    );
  };
};

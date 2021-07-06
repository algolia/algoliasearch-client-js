import {
  CallEnum,
  createMappedRequestOptions,
  createStatelessHost,
  Request,
  RequestOptions,
  Transporter,
  TransporterOptions,
} from '.';
import { retryableRequest } from './concerns/retryableRequest';

// setTimeout is using uint32, so this is the maximum in ms and 5x is the max timeout multiplier
const MAX_TIMEOUT_VALUE = 0x7fffffff / 5000;

export function createTransporter(options: TransporterOptions): Transporter {
  const {
    hostsCache,
    logger,
    requester,
    requestsCache,
    responsesCache,
    timeouts,
    userAgent,
    hosts,
    queryParameters,
    headers,
  } = options;

  if (
    timeouts.connect > MAX_TIMEOUT_VALUE ||
    timeouts.read > MAX_TIMEOUT_VALUE ||
    timeouts.write > MAX_TIMEOUT_VALUE
  ) {
    throw new Error(
      `Timeout values can be no higher than setTimeout accepts (in seconds), ${MAX_TIMEOUT_VALUE}`
    );
  }

  const transporter: Transporter = {
    hostsCache,
    logger,
    requester,
    requestsCache,
    responsesCache,
    timeouts,
    userAgent,
    headers,
    queryParameters,
    hosts: hosts.map(host => createStatelessHost(host)),
    read<TResponse>(
      request: Request,
      requestOptions?: RequestOptions
    ): Readonly<Promise<TResponse>> {
      /**
       * First, we compute the user request options. Now, keep in mind,
       * that using request options the user is able to modified the intire
       * payload of the request. Such as headers, query parameters, and others.
       */
      const mappedRequestOptions = createMappedRequestOptions(
        requestOptions,
        transporter.timeouts.read
      );

      const createRetryableRequest = (): Readonly<Promise<TResponse>> => {
        /**
         * Then, we prepare a function factory that contains the construction of
         * the retryable request. At this point, we may *not* perform the actual
         * request. But we want to have the function factory ready.
         */
        return retryableRequest<TResponse>(
          transporter,
          transporter.hosts.filter(host => (host.accept & CallEnum.Read) !== 0),
          request,
          mappedRequestOptions
        );
      };

      /**
       * Once we have the function factory ready, we need to determine of the
       * request is "cacheable" - should be cached. Note that, once again,
       * the user can force this option.
       */
      const cacheable =
        mappedRequestOptions.cacheable !== undefined
          ? mappedRequestOptions.cacheable
          : request.cacheable;

      /**
       * If is not "cacheable", we immediatly trigger the retryable request, no
       * need to check cache implementations.
       */
      if (cacheable !== true) {
        return createRetryableRequest();
      }

      /**
       * If the request is "cacheable", we need to first compute the key to ask
       * the cache implementations if this request is on progress or if the
       * response already exists on the cache.
       */
      const key = {
        request,
        mappedRequestOptions,
        transporter: {
          queryParameters: transporter.queryParameters,
          headers: transporter.headers,
        },
      };

      /**
       * With the computed key, we first ask the responses cache
       * implemention if this request was been resolved before.
       */
      return transporter.responsesCache.get(
        key,
        () => {
          /**
           * If the request has never resolved before, we actually ask if there
           * is a current request with the same key on progress.
           */
          return transporter.requestsCache.get(key, () => {
            return (
              transporter.requestsCache
                /**
                 * Finally, if there is no request in progress with the same key,
                 * this `createRetryableRequest()` will actually trigger the
                 * retryable request.
                 */
                .set(key, createRetryableRequest())
                .then(
                  response => Promise.all([transporter.requestsCache.delete(key), response]),
                  err => Promise.all([transporter.requestsCache.delete(key), Promise.reject(err)])
                )
                .then(([_, response]) => response as TResponse)
            );
          });
        },
        {
          /**
           * Of course, once we get this response back from the server, we
           * tell response cache to actually store the received response
           * to be used later.
           */
          miss: response => transporter.responsesCache.set(key, response),
        }
      );
    },
    write<TResponse>(
      request: Request,
      requestOptions?: RequestOptions
    ): Readonly<Promise<TResponse>> {
      /**
       * On write requests, no cache mechanisms are applied, and we
       * proxy the request immediately to the requester.
       */
      return retryableRequest<TResponse>(
        transporter,
        transporter.hosts.filter(host => (host.accept & CallEnum.Write) !== 0),
        request,
        createMappedRequestOptions(requestOptions, transporter.timeouts.write)
      );
    },
  };

  return transporter;
}

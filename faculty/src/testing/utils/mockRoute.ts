import { ErrorResponse } from '@polito/student-api-client';

import { HttpHandler, HttpResponse, http } from 'msw';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface MockRouteOptions<T = unknown> {
  body?: ({ data: T } & Record<string, unknown>) | ErrorResponse;
  headers?: Record<string, string>;
  status?: number;
  method?: HttpMethod;
  params?: Record<string, string | number>;
}

const BASE = 'https://app.didattica.polito.it/api';

/**
 * Creates an MSW handler for an API route. `path` is written like in the
 * OpenAPI spec, e.g. '/courses/{courseId}'.
 *
 * The spec has no examples for the routes faculty calls (places, people), so
 * pass `body` whenever the response needs content.
 *
 * Response body when `body` is not passed:
 * - 400 and up: `{ code, message }`, like the real API
 * - anything else: no body
 *
 * @example
 * mockRoute('/v2/sites', { body: { data: [] } });
 * mockRoute<Site[]>('/v2/sites', { body: { data: MY_SITES } });
 * mockRoute('/v2/sites', { status: 500 }); // error
 * mockRoute('/v2/sites', { status: 500, body: { message: 'Oops' } });
 */
export function mockRoute<T = unknown>(
  path: string,
  options: MockRouteOptions<T> = {},
): HttpHandler {
  const method = options.method ?? 'get';
  const status = options.status ?? 200;

  // '/courses/{courseId}' becomes '/courses/1' if params has courseId,
  // otherwise '/courses/:courseId', which matches any id
  let url = BASE + path;
  for (const [key, value] of Object.entries(options.params ?? {})) {
    url = url.replace(`{${key}}`, String(value));
  }
  url = url.replace(/\{(\w+)\}/g, ':$1');

  let body: unknown = options.body;
  if (body === undefined && status >= 400) {
    body = { code: status, message: `Mocked ${status} error` };
  }

  return http[method](url, () => {
    if (body === undefined) {
      return new HttpResponse(null, { status, headers: options.headers });
    }
    return HttpResponse.json(body, { status, headers: options.headers });
  });
}

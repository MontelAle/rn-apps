import { HttpHandler, HttpResponse, http } from 'msw';

import { specExample } from './getSpec';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface MockRouteOptions<T = unknown> {
  body?: { data: T };
  headers?: Record<string, string>;
  status?: number;
  method?: HttpMethod;
  params?: Record<string, string | number>;
}

const BASE = 'https://app.didattica.polito.it/api';

/**
 * Returns an MSW handler for the given OpenAPI spec path.
 *
 * - Pass `options.body` as the full response envelope (e.g. `{ data: ... }`).
 *   Omit it to use the spec's 200 example.
 * - Pass `options.headers` to include custom response headers.
 * - {param} placeholders with a matching entry in `options.params` are
 *   substituted with the concrete value; unresolved ones become :param
 *   wildcards so the handler matches any value.
 * - Pass `options.status` to return a non-200 status; no body is sent
 *   unless `options.body` is also provided.
 */
export function mockRoute<T = unknown>(
  specPath: string,
  options?: MockRouteOptions<T>,
): HttpHandler {
  const method = options?.method ?? 'get';
  const status = options?.status ?? 200;

  const url =
    BASE +
    specPath.replace(/\{(\w+)\}/g, (_, key) =>
      options?.params?.[key] != null ? String(options.params[key]) : `:${key}`,
    );

  const responseBody =
    options?.body !== undefined
      ? options.body
      : status >= 400 || status === 204
        ? undefined
        : specExample(specPath, method);

  return http[method](url, () =>
    responseBody !== undefined
      ? HttpResponse.json(responseBody, { status, headers: options?.headers })
      : new HttpResponse(null, { status, headers: options?.headers }),
  );
}

import { HttpHandler, HttpResponse, http } from 'msw';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface MockRouteOptions<T = unknown> {
  body?: { data: T } & Record<string, unknown>;
  headers?: Record<string, string>;
  status?: number;
  method?: HttpMethod;
  params?: Record<string, string | number>;
}

const BASE = 'https://app.didattica.polito.it/api';

/**
 * Returns an MSW handler for the given API path.
 *
 * Unlike the students app, `@polito/api-client` ships no OpenAPI spec, so
 * there is no example to fall back to: for any 2xx response you must pass
 * `options.body` explicitly.
 *
 * - Pass the `T` type parameter for the type of `data` in the response
 *   (e.g. `mockRoute<Site[]>(...)`). `options.body` takes the full response
 *   envelope (e.g. `{ data: ..., ... }`); extra envelope properties beyond
 *   `data` are untyped.
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

  const responseBody = options?.body;

  return http[method](url, () =>
    responseBody !== undefined
      ? HttpResponse.json(responseBody, { status, headers: options?.headers })
      : new HttpResponse(null, { status, headers: options?.headers }),
  );
}

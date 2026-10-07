import { HttpHandler } from 'msw';

import { mockRoute } from '../utils/mockRoute';

export const commonRoutes = (): HttpHandler[] => [
  mockRoute('/v2/sites', { body: { data: [] } }),
  mockRoute('/v2/courses', { body: { data: [] } }),
];

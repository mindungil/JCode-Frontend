import { routes } from './routes';

jest.mock('./pages/auth/LoginPage', () => () => null);
jest.mock('./pages/watcher/WatcherPage', () => () => null);
jest.mock('./pages/admin/AdminPage', () => () => null);
jest.mock('./features/webide', () => ({ WebIDECourses: () => null }));
jest.mock('./features/auth', () => ({ ProfileSetup: () => null }));
jest.mock('./features/profile', () => ({ ProfileSettings: () => null }));
jest.mock('./features/about', () => ({ AboutPage: () => null }));
jest.mock('./features/courses', () => ({ CourseCreatePage: () => null }));

test('keeps course creation available to instructors without a dedicated navigation item', () => {
  const courseCreateRoute = routes.find((route) => route.path === '/courses/new');

  expect(courseCreateRoute).toMatchObject({
    roles: ['PROFESSOR', 'ADMIN'],
    showInNav: false,
  });
});

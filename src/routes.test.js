import { routes } from './routes';

jest.mock('./pages/auth/LoginPage', () => () => null);
jest.mock('./pages/watcher/WatcherPage', () => () => null);
jest.mock('./pages/admin/AdminPage', () => () => null);
jest.mock('./features/webide', () => ({ WebIDECourses: () => null }));
jest.mock('./features/auth', () => ({ ProfileSetup: () => null }));
jest.mock('./features/profile', () => ({ ProfileSettings: () => null }));
jest.mock('./features/about', () => ({ AboutPage: () => null }));
jest.mock('./features/courses', () => ({ CourseCreatePage: () => null }));

test('exposes course creation as a professor-only navigation route', () => {
  const courseCreateRoute = routes.find((route) => route.path === '/courses/new');

  expect(courseCreateRoute).toMatchObject({
    roles: ['PROFESSOR'],
    showInNav: true,
    label: '수업 개설',
  });
});

import {
  canCreateCourseForRole,
  getCourseActionGridOrder,
  getCourseGridOrder,
} from './courseGridLayout';

describe('course grid layout', () => {
  test.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 2],
    [8, 2],
  ])('places the action column after at most two courses for %i courses', (courseCount, expectedOrder) => {
    expect(getCourseActionGridOrder(courseCount)).toBe(expectedOrder);
  });

  test('moves the third and later courses behind the action column', () => {
    expect([0, 1, 2, 3].map(getCourseGridOrder)).toEqual([0, 1, 3, 4]);
  });

  test('shows course creation only to professors and administrators', () => {
    expect(canCreateCourseForRole('PROFESSOR')).toBe(true);
    expect(canCreateCourseForRole('ADMIN')).toBe(true);
    expect(canCreateCourseForRole('STUDENT')).toBe(false);
    expect(canCreateCourseForRole(undefined)).toBe(false);
  });
});

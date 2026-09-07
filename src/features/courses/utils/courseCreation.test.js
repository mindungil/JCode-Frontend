import { findAcceptedCourse } from './courseCreation';

describe('findAcceptedCourse', () => {
  const requested = { name: '자료구조', year: 2026, term: 2, clss: '3' };

  test('matches the administrator course response shape', () => {
    const courses = [{ courseId: 12, name: '자료구조', year: 2026, term: 2, clss: 3, status: 'PROVISIONING' }];

    expect(findAcceptedCourse(courses, new Set(), requested)?.courseId).toBe(12);
  });

  test('matches the professor my-courses response shape', () => {
    const courses = [{
      courseId: 13,
      courseName: '자료구조',
      courseYear: 2026,
      courseTerm: 2,
      courseClss: 3,
      status: 'PROVISIONING',
    }];

    expect(findAcceptedCourse(courses, new Set(), requested)?.courseId).toBe(13);
  });

  test('does not recover an existing or archived course', () => {
    const existing = { courseId: 14, courseName: '자료구조', courseYear: 2026, courseTerm: 2, courseClss: 3 };
    const archived = { ...existing, courseId: 15, status: 'ARCHIVED' };

    expect(findAcceptedCourse([existing, archived], new Set([14]), requested)).toBeUndefined();
  });
});

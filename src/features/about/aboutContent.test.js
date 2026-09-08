import { announcements, partnerUrls, teamGroups } from './aboutContent';

test('uses the current JEduTools service domains', () => {
  expect(partnerUrls).toEqual({
    jcloud: 'https://jcloud.jedutools.io',
    litmus: 'https://litmus.jedutools.io',
    jflow: 'https://jflow.jedutools.io',
  });
});

test('keeps the v2 announcement as the latest notice', () => {
  expect(announcements[0]).toMatchObject({
    title: 'v2.0.0 업데이트 안내',
    date: '2026-09-07',
    isNew: true,
    content: '대규모 시스템 개편 및 신규 기능 추가',
  });
  expect(announcements.slice(1).every((announcement) => !announcement.isNew)).toBe(true);
});

test('separates the 2026 students from the previous team', () => {
  expect(teamGroups[0]).toEqual({
    year: '2026',
    members: [
      { name: '길민준', role: 'Student' },
      { name: '송정규', role: 'Student' },
    ],
    contributors: [],
  });
  expect(teamGroups[1].year).toBe('~2025');
  expect(teamGroups[1].members).toHaveLength(5);
  expect(teamGroups[1].contributors).toHaveLength(4);
});

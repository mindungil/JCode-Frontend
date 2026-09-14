import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';
import { getCurrentToken } from '../utils/tokenUtils';

const inFlight = new Map();
const memoryReceipts = new Map();

// Keep the request identity after an ambiguous response or page reload.
// A successful response finishes the intent, allowing a genuinely new course.
export const submitCourseCreation = (courseData) => {
  const subject = jwtDecode(getCurrentToken()).sub;
  const storageKey = `jcode:course-creation:${subject}`;
  const payload = JSON.stringify(Object.keys(courseData).sort().map(key => [key, courseData[key]]));
  const pendingKey = `${subject}:${payload}`;
  if (inFlight.has(pendingKey)) return inFlight.get(pendingKey);

  let receipt = memoryReceipts.get(storageKey);
  try {
    receipt = JSON.parse(sessionStorage.getItem(storageKey)) || receipt;
  } catch { /* In-memory receipts still cover retries when storage is unavailable. */ }
  if (receipt?.payload !== payload) receipt = { payload, id: crypto.randomUUID() };
  memoryReceipts.set(storageKey, receipt);
  try { sessionStorage.setItem(storageKey, JSON.stringify(receipt)); } catch { /* See above. */ }

  const clearReceipt = () => {
    if (memoryReceipts.get(storageKey)?.id === receipt.id) memoryReceipts.delete(storageKey);
    try {
      if (JSON.parse(sessionStorage.getItem(storageKey))?.id === receipt.id) sessionStorage.removeItem(storageKey);
    } catch { /* The completed response remains usable without storage. */ }
  };
  const request = api.post('/api/courses', courseData, {
    headers: { 'Idempotency-Key': receipt.id },
  }).then(response => {
    clearReceipt();
    return response;
  }).catch(error => {
    if (['CREATION_REQUEST_CHANGED', 'CREATION_REQUEST_FINISHED'].includes(error.response?.data?.code)) {
      clearReceipt();
    }
    // Never silently resubmit a terminal conflict as a new creation request.
    throw error;
  }).finally(() => inFlight.delete(pendingKey));
  inFlight.set(pendingKey, request);
  return request;
};

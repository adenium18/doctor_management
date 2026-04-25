import router from "./router.js";

export const fetchWithAuth = async (url = '/', options = {}) => {
  const origin = window.location.origin;

  // ✅ Bug 1 fix — default auth to true safely without it being wiped by options spread
  const requireAuth = options.auth !== false;

  // Parse the stored user to get the authentication token
  const user = JSON.parse(localStorage.getItem('user'));
  const authToken = user?.['token'];

  // If authentication is required and no token is found, redirect to login
  if (requireAuth && !authToken) {
    console.error('Authentication token is missing.');
    router.push('/user-login');
    return;
  }

  // ✅ Bug 2 fix — do NOT spread ...options at the end as it overwrites headers/body
  const fetchOptions = {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { 'Authentication-Token': authToken } : {}),
      ...(options.headers ?? {}),   // merge extra headers safely
    },
    mode: 'cors',
  };

  // Only attach body for non-GET requests
  if (options.body && fetchOptions.method !== 'GET') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${origin}${url}`, fetchOptions);

    // ✅ Bug 3 fix — only redirect on 401/403 (auth failures), not 405
    if (res.status === 401 || res.status === 403) {
      console.error(`Auth error ${res.status} on ${url} — redirecting to login`);
      router.push('/user-login');
      return;
    }

    // ✅ Log 405 clearly so it's easy to debug backend routing issues
    if (res.status === 405) {
      console.error(`405 Method Not Allowed: ${fetchOptions.method} ${url} — check backend route methods`);
    }

    return res;

  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

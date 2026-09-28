export const apiFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  options.credentials = 'include';
  
  if (options.headers) {
    const headersObj: Record<string, string> = {};
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        if (!key.toLowerCase().startsWith('x-user-')) {
          headersObj[key] = value;
        }
      });
      options.headers = headersObj;
    } else if (Array.isArray(options.headers)) {
      options.headers = options.headers.filter(h => !h[0].toLowerCase().startsWith('x-user-'));
    } else {
      const hdrs = options.headers as Record<string, string>;
      for (const key in hdrs) {
        if (!key.toLowerCase().startsWith('x-user-')) {
          headersObj[key] = hdrs[key];
        }
      }
      options.headers = headersObj;
    }
  }
  
  return fetch(url, options);
};

const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');
if (!content.includes('const apiFetch = ')) {
  content = content.replace(/fetch\(/g, 'apiFetch(');
  const injection = `const apiFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  options.credentials = 'include';
  
  // Strip custom x-user-role headers if frontend set them, since backend now uses JWT
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
      const newHeaders: any = { ...options.headers };
      Object.keys(newHeaders).forEach(k => {
        if (k.toLowerCase().startsWith('x-user-')) delete newHeaders[k];
      });
      options.headers = newHeaders;
    }
  }

  return fetch(url, options);
};

`;
  content = content.replace('function AppContent() {', injection + 'function AppContent() {');
  fs.writeFileSync('src/App.tsx', content);
  console.log('App.tsx updated successfully.');
} else {
  console.log('Already updated.');
}

# Screenshot Technique for Survey123 Designer

## Problem
Taking screenshots from the live site is tricky because:
- Playwright headless can't access the auto-saved form in IndexedDB
- Chrome extension `save_to_disk` screenshots aren't accessible from the sandbox filesystem
- Regular `html2canvas` fails because Tailwind CSS v4 uses `oklch()` color functions

## Solution
Use `html2canvas-pro` (a fork that supports modern CSS color functions) to capture the page directly in the browser, then push the base64 image data to GitHub via the Contents API — all from JavaScript running on the page itself.

### Step 1: Load html2canvas-pro
```javascript
// In Chrome JavaScript tool:
new Promise((resolve) => {
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js';
  script.onload = () => resolve('loaded');
  document.head.appendChild(script);
});
```

### Step 2: Capture and push to GitHub
```javascript
// Capture the page
html2canvas(document.body, {scale: 1, useCORS: true}).then(async canvas => {
  const base64 = canvas.toDataURL('image/png').split(',')[1];
  
  // Push to GitHub via Contents API
  const response = await fetch(
    'https://api.github.com/repos/OWNER/REPO/contents/docs/screenshots/FILENAME.png',
    {
      method: 'PUT',
      headers: {
        'Authorization': 'token GITHUB_PAT',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'docs: add screenshot',
        content: base64,
        // If updating, include sha of existing file
        // sha: 'existing-file-sha'
      })
    }
  );
  const result = await response.json();
  window.__screenshot_result = result;
});
```

### Step 3: For updating existing files
Get the SHA first:
```javascript
const meta = await fetch(
  'https://api.github.com/repos/OWNER/REPO/contents/docs/screenshots/FILENAME.png',
  { headers: { 'Authorization': 'token GITHUB_PAT' } }
).then(r => r.json());
// Use meta.sha in the PUT request body
```

## Key Details
- **html2canvas-pro** not html2canvas — the `-pro` fork handles `oklch()` colors from Tailwind v4
- The GitHub Contents API accepts base64-encoded file content directly
- This bypasses all filesystem access issues since everything happens in-browser
- Works from any Chrome tab with the live site loaded

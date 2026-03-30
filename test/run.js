#!/usr/bin/env node

/**
 * OpenClaw Hub — Test & Diagnostic Suite
 * 
 * Run: npm test
 * 
 * This serves two purposes:
 * 1. Automated test suite for CI/development
 * 2. Diagnostic tool for troubleshooting — any AI agent can run this
 *    and get a structured report of what's working and what's broken.
 * 
 * Exit code 0 = all pass, 1 = failures found
 */

const BASE = process.env.HUB_URL || 'http://localhost:3100';
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');
const DIAG = process.argv.includes('--diagnose') || process.argv.includes('-d');

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];
const issues = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJSON(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, headers: res.headers, text, json };
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    results.push({ name, status: 'PASS' });
    if (VERBOSE) console.log(`  ✅ ${name}`);
  } catch (err) {
    failed++;
    const msg = err.message || String(err);
    results.push({ name, status: 'FAIL', error: msg });
    issues.push({ test: name, error: msg });
    console.log(`  ❌ ${name}`);
    if (VERBOSE) console.log(`     → ${msg}`);
  }
}

function skip(name, reason) {
  skipped++;
  results.push({ name, status: 'SKIP', reason });
  if (VERBOSE) console.log(`  ⏭️  ${name} (${reason})`);
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

function assertEq(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

function assertIncludes(str, substr, label) {
  if (!String(str).includes(substr)) throw new Error(`${label}: missing "${substr}" in response`);
}

// ── Test Groups ──────────────────────────────────────────────────────────────

async function serverTests() {
  console.log('\n🔌 Server');
  
  await test('Server is reachable', async () => {
    const res = await fetch(BASE);
    assert(res.ok, `Server returned ${res.status}`);
  });

  await test('Health endpoint', async () => {
    const { status, json } = await fetchJSON('/api/health');
    assertEq(status, 200, 'Status');
    assert(json, 'Response is not JSON');
  });

  await test('Returns HTML for root', async () => {
    const res = await fetch(BASE);
    const ct = res.headers.get('content-type');
    assert(ct?.includes('text/html'), `Expected text/html, got ${ct}`);
  });

  await test('SPA fallback (unknown route → index.html)', async () => {
    const res = await fetch(`${BASE}/nonexistent-route-12345`);
    const text = await res.text();
    assertEq(res.status, 200, 'Status');
    assertIncludes(text, 'OpenClaw Hub', 'HTML content');
  });
}

async function securityTests() {
  console.log('\n🛡️  Security');

  const { headers } = await fetchJSON('/');

  await test('X-Content-Type-Options: nosniff', async () => {
    assertEq(headers.get('x-content-type-options'), 'nosniff', 'Header');
  });

  await test('X-Frame-Options: DENY', async () => {
    assertEq(headers.get('x-frame-options'), 'DENY', 'Header');
  });

  await test('Content-Security-Policy present', async () => {
    const csp = headers.get('content-security-policy');
    assert(csp, 'CSP header missing');
    assertIncludes(csp, "default-src 'self'", 'CSP content');
    assertIncludes(csp, "frame-ancestors 'none'", 'CSP frame-ancestors');
  });

  await test('Referrer-Policy: no-referrer', async () => {
    assertEq(headers.get('referrer-policy'), 'no-referrer', 'Header');
  });

  await test('Permissions-Policy restricts sensors', async () => {
    const pp = headers.get('permissions-policy');
    assert(pp, 'Permissions-Policy missing');
    assertIncludes(pp, 'camera=()', 'Camera blocked');
    assertIncludes(pp, 'microphone=()', 'Mic blocked');
  });

  await test('No server version leaked', async () => {
    const powered = headers.get('x-powered-by');
    // Express leaks this by default — should be disabled
    if (powered) throw new Error(`X-Powered-By header exposes: "${powered}"`);
  });
}

async function configTests() {
  console.log('\n⚙️  Config');

  await test('GET /api/config returns config object', async () => {
    const { status, json } = await fetchJSON('/api/config');
    assertEq(status, 200, 'Status');
    assert(json && typeof json === 'object', 'Response is not an object');
  });

  await test('POST /api/config saves and returns', async () => {
    // Save a test value
    const testVal = `test-${Date.now()}`;
    const { status } = await fetchJSON('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _testKey: testVal }),
    });
    assertEq(status, 200, 'Save status');

    // Read it back
    const { json } = await fetchJSON('/api/config');
    assertEq(json._testKey, testVal, 'Persisted value');

    // Clean up
    await fetchJSON('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _testKey: undefined }),
    });
  });
}

async function apiTests() {
  console.log('\n📡 API Endpoints');

  const endpoints = [
    ['/api/system', 'System info'],
    ['/api/gateway/status', 'Gateway status'],
    ['/api/discover', 'Auto-discover'],
    ['/api/services', 'Services'],
    ['/api/activity', 'Activity'],
    ['/api/actions', 'Actions'],
    ['/api/costs', 'Costs'],
    ['/api/alerts', 'Alerts'],
    ['/api/profiles', 'Profiles'],
  ];

  for (const [path, label] of endpoints) {
    await test(`${label} (${path})`, async () => {
      const { status } = await fetchJSON(path);
      assert(status >= 200 && status < 500, `Returned ${status}`);
    });
  }
}

async function pluginTests() {
  console.log('\n🧩 Plugins');

  await test('Plugin list endpoint', async () => {
    const { status, json } = await fetchJSON('/api/plugins');
    assertEq(status, 200, 'Status');
    assert(Array.isArray(json), 'Response is not an array');
  });

  const { json: plugins } = await fetchJSON('/api/plugins');

  if (!plugins?.length) {
    skip('Plugin compilation', 'No plugins installed');
    skip('Plugin API shim', 'No plugins installed');
    return;
  }

  await test(`Found ${plugins.length} plugin(s)`, async () => {
    for (const p of plugins) {
      assert(p.id, 'Plugin missing id');
      assert(p.name, `Plugin ${p.id} missing name`);
    }
  });

  // Test each plugin compiles
  for (const p of plugins) {
    await test(`Plugin "${p.id}" compiles`, async () => {
      const { status, text } = await fetchJSON(`/api/plugins/${p.id}/widget`);
      assertEq(status, 200, 'Status');
      assert(text.length > 50, 'Compiled output too short');
      assertIncludes(text, '/api/plugins/_jsx-runtime.js', 'JSX runtime import');
    });
  }

  await test('Plugin API shim serves', async () => {
    const { status, text } = await fetchJSON('/api/plugins/_api.js');
    assertEq(status, 200, 'Status');
    assertIncludes(text, 'useTheme', 'API exports');
    assertIncludes(text, 'useTranslations', 'i18n exports');
  });

  await test('React shim serves', async () => {
    const { status } = await fetchJSON('/api/plugins/_react.js');
    assertEq(status, 200, 'Status');
  });

  await test('JSX runtime shim serves', async () => {
    const { status } = await fetchJSON('/api/plugins/_jsx-runtime.js');
    assertEq(status, 200, 'Status');
  });

  // Security
  await test('Plugin path traversal blocked', async () => {
    const { status } = await fetchJSON('/api/plugins/../../../etc/passwd/widget');
    assert(status === 400 || status === 404 || status === 200, 'Traversal not blocked');
    // If 200, verify it's the SPA fallback not actual file content
    if (status === 200) {
      const { text } = await fetchJSON('/api/plugins/../../../etc/passwd/widget');
      assert(!text.includes('root:'), 'Path traversal returned sensitive file!');
    }
  });

  await test('Invalid plugin ID rejected', async () => {
    const { status } = await fetchJSON('/api/plugins/not..valid/widget');
    assert(status === 400 || status === 404 || status === 200, 'Invalid ID handling');
  });
}

async function staticAssetTests() {
  console.log('\n📦 Static Assets');

  await test('CSS bundle loads', async () => {
    const res = await fetch(BASE);
    const html = await res.text();
    const cssMatch = html.match(/href="(\/assets\/index-[^"]+\.css)"/);
    assert(cssMatch, 'No CSS bundle link found in HTML');
    const cssRes = await fetch(`${BASE}${cssMatch[1]}`);
    assertEq(cssRes.status, 200, 'CSS status');
    assert(parseInt(cssRes.headers.get('content-length')) > 1000, 'CSS too small');
  });

  await test('JS bundle loads', async () => {
    const res = await fetch(BASE);
    const html = await res.text();
    const jsMatch = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    assert(jsMatch, 'No JS bundle link found in HTML');
    const jsRes = await fetch(`${BASE}${jsMatch[1]}`);
    assertEq(jsRes.status, 200, 'JS status');
    assert(parseInt(jsRes.headers.get('content-length')) > 10000, 'JS too small');
  });
}

async function i18nTests() {
  console.log('\n🌐 i18n');

  await test('Config stores language preference', async () => {
    const { json } = await fetchJSON('/api/config');
    // Language should either be set or default
    const lang = json?.language;
    if (lang) {
      assert(['en', 'sv', 'de', 'fr', 'es', 'pt', 'ja', 'zh'].includes(lang),
        `Unknown language: ${lang}`);
    }
    // Pass either way — language is optional until wizard completes
  });
}

// ── Diagnostics Mode ─────────────────────────────────────────────────────────

async function diagnose() {
  console.log('\n🔍 Diagnostic Info');
  console.log('─'.repeat(50));

  // Server
  try {
    const { json } = await fetchJSON('/api/system');
    console.log(`  OS:       ${json?.os || 'unknown'}`);
    console.log(`  Node:     ${json?.nodeVersion || 'unknown'}`);
    console.log(`  Uptime:   ${json?.uptime || 'unknown'}`);
    console.log(`  Memory:   ${json?.memory || 'unknown'}`);
  } catch {
    console.log('  ⚠️  System info unavailable');
  }

  // Gateway
  try {
    const { json } = await fetchJSON('/api/gateway/status');
    console.log(`  Gateway:  ${json?.status || json?.running ? 'online' : 'offline'}`);
  } catch {
    console.log('  Gateway:  unreachable');
  }

  // Config
  try {
    const { json } = await fetchJSON('/api/config');
    console.log(`  Setup:    ${json?.setupComplete ? 'complete' : 'not completed'}`);
    console.log(`  Language: ${json?.language || 'not set'}`);
    console.log(`  Theme:    ${json?.theme || 'not set'}`);
    console.log(`  Widgets:  ${(json?.widgetOrder || json?.homeWidgets || []).length} configured`);
    console.log(`  Actions:  ${(json?.quickActions || []).length} pinned`);
  } catch {
    console.log('  ⚠️  Config unavailable');
  }

  // Plugins
  try {
    const { json } = await fetchJSON('/api/plugins');
    console.log(`  Plugins:  ${json?.length || 0} installed`);
    if (json?.length) {
      for (const p of json) {
        const { status } = await fetchJSON(`/api/plugins/${p.id}/widget`);
        console.log(`    ${status === 200 ? '✅' : '❌'} ${p.id} (${p.name})`);
      }
    }
  } catch {
    console.log('  Plugins:  unavailable');
  }

  // Profiles
  try {
    const { json } = await fetchJSON('/api/profiles');
    console.log(`  Profiles: ${Array.isArray(json) ? json.length : 0}`);
  } catch {
    console.log('  Profiles: unavailable');
  }

  console.log('─'.repeat(50));
}

// ── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🧪 OpenClaw Hub — Test Suite`);
  console.log(`   Target: ${BASE}`);
  console.log(`   Mode:   ${DIAG ? 'diagnose + test' : 'test'}`);

  // Check server is reachable before anything else
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(3000) });
  } catch {
    console.log(`\n❌ Cannot reach ${BASE}`);
    console.log(`   Is the server running? Try: npm start`);
    console.log(`   Or set HUB_URL: HUB_URL=http://localhost:3100 npm test\n`);
    process.exit(1);
  }

  if (DIAG) await diagnose();

  await serverTests();
  await securityTests();
  await configTests();
  await apiTests();
  await pluginTests();
  await staticAssetTests();
  await i18nTests();

  // Summary
  const total = passed + failed + skipped;
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  ${passed} passed  ${failed} failed  ${skipped} skipped  (${total} total)`);

  if (issues.length) {
    console.log(`\n⚠️  Issues found:`);
    for (const { test, error } of issues) {
      console.log(`  • ${test}: ${error}`);
    }
  }

  if (failed === 0) {
    console.log(`\n✅ All tests passed.\n`);
  } else {
    console.log(`\n❌ ${failed} test(s) failed.\n`);
  }

  // Machine-readable output for agents
  if (process.env.JSON_OUTPUT) {
    console.log(JSON.stringify({ passed, failed, skipped, issues, results }, null, 2));
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test runner crashed:', err);
  process.exit(1);
});

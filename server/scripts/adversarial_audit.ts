import jwt from "npm:jsonwebtoken";

const BASE_URL = "http://localhost:3001";
const TOKEN_FILE = new URL(".audit_tokens.json", import.meta.url).pathname;
const FETCH_TIMEOUT_MS = 10_000;

// -----------------------------------------------------------------------------
// BOOTSTRAP — load tokens written by audit_setup.ts
// -----------------------------------------------------------------------------

let tokenData: Record<string, { id: number; token: string }>;
try {
  tokenData = JSON.parse(await Deno.readTextFile(TOKEN_FILE));
} catch {
  console.error(`❌ Could not read ${TOKEN_FILE}. Run audit_setup.ts first.`);
  Deno.exit(1);
}

const TOKENS = {
  admin: tokenData["audit-admin@local"]?.token,
  schoolA: tokenData["audit-school-a@local"]?.token,
  schoolB: tokenData["audit-school-b@local"]?.token,
};

if (!TOKENS.admin || !TOKENS.schoolA || !TOKENS.schoolB) {
  console.error("❌ One or more audit tokens are missing in the token file. Re-run audit_setup.ts.");
  Deno.exit(1);
}

// Warn if any token is expired
for (const [name, token] of Object.entries(TOKENS)) {
  const payload = jwt.decode(token) as any;
  if (payload?.exp && Date.now() / 1000 > payload.exp) {
    console.warn(`⚠️  Token for '${name}' is expired. Re-run audit_setup.ts.`);
  }
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

let passCount = 0;
let failCount = 0;

async function logResult(name: string, success: boolean, message: string, details?: any) {
  if (success) {
    passCount++;
    console.log(`[✅ PASS] ${name}: ${message}`);
  } else {
    failCount++;
    console.log(`[❌ FAIL] ${name}: ${message}`);
    if (details) console.dir(details, { depth: null });
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// -----------------------------------------------------------------------------
// STEP 1: ADVERSARIAL IDENTITY & JWT DECONSTRUCTION
// -----------------------------------------------------------------------------

async function auditStep1_1_SignaturelessToken() {
  const name = "1.1 Signature-less Token Probe (alg: 'none')";
  const payload = jwt.decode(TOKENS.schoolA) as any;
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" })).replace(/=/g, "");
  const body = btoa(JSON.stringify(payload)).replace(/=/g, "");
  const attackToken = `${header}.${body}.`;

  const resp = await fetchWithTimeout(`${BASE_URL}/api/config`, {
    headers: { "Authorization": `Bearer ${attackToken}` },
  });

  if (resp.status === 401) {
    await logResult(name, true, "Server rejected signature-less token with 401.");
  } else {
    await logResult(name, false, `VULNERABILITY: Server accepted signature-less token with status ${resp.status}`);
  }
}

async function auditStep1_2_RateLimitBruteForce() {
  const name = "1.2 Brute-Force Rate Limit (IP-rotation bypass)";
  let successfulBypasses = 0;

  console.log("   --- Testing 10 failed logins with IP spoofing ---");
  for (let i = 0; i < 10; i++) {
    const spoofedIP = `1.2.3.${i}`;
    const resp = await fetchWithTimeout(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": spoofedIP,
        "X-Real-IP": spoofedIP,
      },
      body: JSON.stringify({ email: "audit-school-a@local", password: "WrongPassword" }),
    });

    if (i >= 5 && resp.status !== 429) {
      successfulBypasses++;
    }
  }

  if (successfulBypasses > 0) {
    await logResult(name, false, `VULNERABILITY: Bypassed rate-limiter ${successfulBypasses} times via X-Forwarded-For spoofing.`);
  } else {
    await logResult(name, true, "Rate-limiter resisted IP-spoofing in headers.");
  }
}

async function auditStep1_3_ClaimTampering() {
  const name = "1.3 JWT Claim Tampering (Role elevation)";
  const payload = jwt.decode(TOKENS.schoolA) as any;
  // Strip timestamps so expiry doesn't interfere with the signature check
  const { iat: _iat, exp: _exp, ...stripped } = payload;
  stripped.role = "Admin";

  const tamperedToken = jwt.sign(stripped, "wrong-secret-123");

  const resp = await fetchWithTimeout(`${BASE_URL}/api/admin/overview`, {
    headers: { "Authorization": `Bearer ${tamperedToken}` },
  });

  if (resp.status === 401 || resp.status === 403) {
    await logResult(name, true, "Server rejected tampered payload / invalid signature.");
  } else {
    await logResult(name, false, `VULNERABILITY: Server accepted tampered token with status ${resp.status}`);
  }
}

// -----------------------------------------------------------------------------
// STEP 2: DEEP LOGIC & STATE-CHAIN EXPLOITATION
// -----------------------------------------------------------------------------

async function auditStep2_1_StatusTransitionBypass() {
  const name = "2.1 Status Transition Bypass (Field Injection)";

  const payload = {
    program_title: "ADMINGUIDELINES",
    quarter: "1st Quarter CY 2026",
    status: "Approved",
  };

  const resp = await fetchWithTimeout(`${BASE_URL}/api/pirs/draft`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${TOKENS.schoolA}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json();
  if (data?.pir?.status === "Approved") {
    await logResult(name, false, "VULNERABILITY: Mass-assignment allows unauthorized status 'Approved'.");
  } else {
    await logResult(name, true, "Server ignored/overwrote unauthorized status field.");
  }
}

async function auditStep2_2_RaceCondition() {
  const name = "2.2 Atomic Race Condition (Concurrent Double-Submission)";
  const program_title = "ADMINGUIDELINES";
  const quarter = "2nd Quarter CY 2026";

  console.log("   --- Launching 25 concurrent PIR submissions ---");
  const requests = Array.from({ length: 25 }, () =>
    fetchWithTimeout(`${BASE_URL}/api/pirs/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKENS.schoolA}`,
      },
      body: JSON.stringify({ program_title, quarter }),
    })
  );

  const responses = await Promise.all(requests);
  const successCodes = responses.filter((r) => r.status === 201 || r.status === 200).length;

  if (successCodes > 1) {
    await logResult(name, false, `VULNERABILITY: Race condition created ${successCodes} records for the same constraint.`);
  } else {
    await logResult(name, true, "Race-condition resisted. Database unique constraint enforced.");
  }
}

async function auditStep2_3_OrphanedRelation() {
  const name = "2.3 Orphaned Relation Injection (Cross-School Activity)";

  // Dynamically fetch a real AIP activity that belongs to School B
  let schoolBActivityId: number | null = null;
  try {
    const aipResp = await fetchWithTimeout(`${BASE_URL}/api/aips?program_title=ADMINGUIDELINES`, {
      headers: { "Authorization": `Bearer ${TOKENS.schoolB}` },
    });
    if (aipResp.ok) {
      const aipData = await aipResp.json();
      const activities = aipData?.aips?.[0]?.activities ?? aipData?.activities ?? [];
      if (activities.length > 0) {
        schoolBActivityId = activities[0].id;
      }
    }
  } catch {
    // If we can't fetch, skip with a warning
  }

  if (!schoolBActivityId) {
    console.log(`   ⚠️  ${name}: Skipped — could not resolve a School-B activity ID dynamically.`);
    return;
  }

  const resp = await fetchWithTimeout(`${BASE_URL}/api/pirs/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKENS.schoolA}` },
    body: JSON.stringify({
      program_title: "ADMINGUIDELINES",
      quarter: "1st Quarter CY 2026",
      activity_reviews: [{ aip_activity_id: schoolBActivityId, complied: true }],
    }),
  });

  if (resp.status === 200 || resp.status === 201) {
    await logResult(name, false, `POTENTIAL VULNERABILITY: School-A accepted PIR review for School-B activity id=${schoolBActivityId}.`);
  } else {
    await logResult(name, true, `Server rejected cross-school activity association (activity id=${schoolBActivityId}).`);
  }
}

// -----------------------------------------------------------------------------
// STEP 3: MUTATIONAL FUZZING & SCHEMA BREAKING
// -----------------------------------------------------------------------------

async function auditStep3_1_NestingBomb() {
  const name = "3.1 JSON Nesting Bomb (Memory/Stack Stress)";

  const createDeep = (levels: number) => {
    let obj: any = { leaf: true };
    for (let i = 0; i < levels; i++) obj = { next: obj };
    return obj;
  };

  const payload = {
    program_title: "ADMINGUIDELINES",
    quarter: "1st Quarter CY 2026",
    objectives: [JSON.stringify(createDeep(500))],
  };

  let status: number;
  try {
    const resp = await fetchWithTimeout(`${BASE_URL}/api/pirs/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKENS.schoolA}` },
      body: JSON.stringify(payload),
    });
    status = resp.status;
  } catch (err: any) {
    await logResult(name, false, `CRITICAL: Request timed out or connection refused — server likely crashed. (${err.message})`);
    return;
  }

  if (status === 500) {
    await logResult(name, false, `VULNERABILITY: Server crashed with 500 on 500-level nested JSON (Potential DoS).`);
  } else if (status === 200 || status === 201) {
    await logResult(name, true, "Server processed 500-level nested JSON without crashing.");
  } else {
    // 400, 404, etc. — graceful rejection, not a DoS
    await logResult(name, true, `Server rejected payload gracefully (status ${status}) — not a crash.`);
  }
}

async function auditStep3_2_NullBytePolyglot() {
  const name = "3.2 Null-Byte & UTF-16 Polyglot (Truncation Bypass)";

  const payload = {
    program_title: "ADMINGUIDELINES\0_TRUNCATED",
    quarter: "1st Quarter CY 2026",
    prepared_by_name: "Audit User <script>alert(1)</script>",
  };

  const resp = await fetchWithTimeout(`${BASE_URL}/api/pirs/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKENS.schoolA}` },
    body: JSON.stringify(payload),
  });

  if (resp.status === 404 || resp.status === 400) {
    await logResult(name, true, "Server rejected null-byte in program title.");
  } else if (resp.status === 200 || resp.status === 201) {
    const data = await resp.json();
    if (data?.pir?.program_title?.includes("_TRUNCATED")) {
      await logResult(name, true, "Server saved full string including null-byte safely.");
    } else {
      await logResult(name, false, "VULNERABILITY: Null-byte caused string truncation in backend.");
    }
  } else if (resp.status === 500) {
    await logResult(name, false, `VULNERABILITY: Null-byte caused server crash (500).`);
  } else {
    await logResult(name, false, `Unexpected status ${resp.status}`);
  }
}

async function auditStep3_3_MassAssignment() {
  const name = "3.3 Mass-Assignment Integrity (ID/Date injection)";
  const past = new Date(2010, 0, 1);

  const payload = {
    program_title: "ADMINGUIDELINES",
    quarter: "1st Quarter CY 2026",
    id: 99999,
    created_at: past.toISOString(),
  };

  const resp = await fetchWithTimeout(`${BASE_URL}/api/pirs/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${TOKENS.schoolA}` },
    body: JSON.stringify(payload),
  });

  const data = await resp.json();
  const pir = data?.pir;
  if (pir && (pir.id === 99999 || new Date(pir.created_at).getTime() === past.getTime())) {
    await logResult(name, false, "VULNERABILITY: Mass-assignment allows overriding internal ID/Dates.");
  } else {
    await logResult(name, true, "Protected internal fields (ID/Dates) remained immutable.");
  }
}

// -----------------------------------------------------------------------------
// STEP 4: ADAPTIVE DoS & INFRASTRUCTURE RESILIENCE
// -----------------------------------------------------------------------------

async function auditStep4_1_ConnectionStarvation() {
  const name = "4.1 Connection Pool Starvation (100 Concurrent Holds)";
  console.log("   --- Initiating 100 concurrent heavy query requests ---");

  const requests = Array.from({ length: 100 }, () =>
    fetchWithTimeout(`${BASE_URL}/api/admin/overview?year=2026`, {
      headers: { "Authorization": `Bearer ${TOKENS.admin}` },
    })
  );

  try {
    const results = await Promise.all(requests);
    const failures = results.filter((r) => r.status >= 500).length;
    if (failures > 0) {
      await logResult(name, false, `VULNERABILITY: ${failures}/100 requests failed with 5XX during pool stress.`);
    } else {
      await logResult(name, true, "Connection pool maintained 100 concurrent heavy sessions.");
    }
  } catch (err: any) {
    await logResult(name, false, "CRITICAL VULNERABILITY: Request failed entirely (Server likely crashed or timed out).", err.message);
  }
}

async function auditStep4_2_InfiniteResultSet() {
  const name = "4.2 'Infinite' Result Set Exhaustion (limit=INT_MAX)";

  const resp = await fetchWithTimeout(`${BASE_URL}/api/admin/submissions?limit=2147483647&type=aip`, {
    headers: { "Authorization": `Bearer ${TOKENS.admin}` },
  });

  if (resp.status === 200) {
    await logResult(name, false, "VULNERABILITY: Server attempted to fulfill INT_MAX limit (Potential Heap Exhaustion).");
  } else if (resp.status === 400 || resp.status === 413) {
    await logResult(name, true, "Server capped/rejected extreme limit parameter.");
  } else {
    await logResult(name, false, `Unexpected status ${resp.status} on unbounded limit.`);
  }
}

async function auditStep4_3_MemoryLeakInduction() {
  const name = "4.3 Memory Leak Induction (Looping Heavy Joins)";
  console.log("   --- Stressing with 200 sequential heavy queries ---");

  let failures = 0;
  for (let i = 0; i < 200; i++) {
    try {
      const resp = await fetchWithTimeout(`${BASE_URL}/api/admin/overview?year=2026`, {
        headers: { "Authorization": `Bearer ${TOKENS.admin}` },
      });
      if (resp.status >= 500) failures++;
    } catch {
      failures++;
    }
  }

  if (failures > 0) {
    await logResult(name, false, `VULNERABILITY: ${failures}/200 sequential queries failed (Possible memory leak/pool exhaustion).`);
  } else {
    await logResult(name, true, "Sequential heavy queries completed without failure.");
  }
}

// -----------------------------------------------------------------------------
// STEP 5: METADATA & SUPPLY CHAIN DISCLOSURE
// -----------------------------------------------------------------------------

async function auditStep5_1_ForbiddenPaths() {
  const name = "5.1 Forbidden Path Discovery (.env, .git, config)";
  const paths = [
    "/.env",
    "/.git/config",
    "/package-lock.json",
    "/.vscode/settings.json",
    "/scripts/audit_setup.ts",
  ];

  const vulnerabilities: string[] = [];
  for (const p of paths) {
    try {
      const resp = await fetchWithTimeout(`${BASE_URL}${p}`);
      if (resp.status === 200) vulnerabilities.push(p);
    } catch {
      // Connection error on this path — not a vulnerability
    }
  }

  if (vulnerabilities.length > 0) {
    await logResult(name, false, `VULNERABILITY: Exposed sensitive paths: ${vulnerabilities.join(", ")}`);
  } else {
    await logResult(name, true, "Sensitive infrastructure paths are correctly hidden/rejected.");
  }
}

async function auditStep5_2_MethodTunneling() {
  const name = "5.2 Method Tunneling (X-HTTP-Method-Override)";

  const resp = await fetchWithTimeout(`${BASE_URL}/api/config`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKENS.schoolA}`,
      "X-HTTP-Method-Override": "GET",
    },
  });

  if (resp.status === 200) {
    await logResult(name, false, "VULNERABILITY: Server respects X-HTTP-Method-Override (Potential bypass).");
  } else {
    await logResult(name, true, "Server ignored method-tunneling header.");
  }
}

// -----------------------------------------------------------------------------
// MAIN EXECUTION
// -----------------------------------------------------------------------------

async function runAudit() {
  console.log("\n🚀 --- STARTING HMCSRA ADVERSARIAL AUDIT ---\n");

  console.log("🔹 MODULE 1: ADVERSARIAL IDENTITY");
  await auditStep1_1_SignaturelessToken();
  await auditStep1_2_RateLimitBruteForce();
  await auditStep1_3_ClaimTampering();

  console.log("\n🔹 MODULE 2: STATE-MACHINE & LOGIC");
  await auditStep2_1_StatusTransitionBypass();
  await auditStep2_2_RaceCondition();
  await auditStep2_3_OrphanedRelation();

  console.log("\n🔹 MODULE 3: MUTATIONAL FUZZING");
  await auditStep3_1_NestingBomb();
  await auditStep3_2_NullBytePolyglot();
  await auditStep3_3_MassAssignment();

  console.log("\n🔹 MODULE 4: ADAPTIVE DoS");
  await auditStep4_1_ConnectionStarvation();
  await auditStep4_2_InfiniteResultSet();
  await auditStep4_3_MemoryLeakInduction();

  console.log("\n🔹 MODULE 5: INFRASTRUCTURE & METADATA");
  await auditStep5_1_ForbiddenPaths();
  await auditStep5_2_MethodTunneling();

  const total = passCount + failCount;
  console.log("\n🏁 --- AUDIT COMPLETE ---");
  console.log(`   ✅ PASS: ${passCount}/${total}`);
  console.log(`   ❌ FAIL: ${failCount}/${total}\n`);
}

runAudit().catch(console.error);

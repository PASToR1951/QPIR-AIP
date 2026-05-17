import {
  buildDeadlineReminderExtras,
  escapeHtml,
  extractTokens,
  findUnknownTokens,
  formatVarForHtml,
  formatVarForText,
  listAllowedTokens,
  renderTemplate,
  TEMPLATE_DEFINITIONS,
  validateAccentColor,
  wrapInShell,
} from "./emailTemplateRenderer.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}\nexpected: ${e}\nactual:   ${a}`);
}

Deno.test("extractTokens finds {{vars}} with whitespace tolerance", () => {
  const tokens = extractTokens(
    "Hello {{userName}} and {{ role }} but not {{1bad}} or {{good_one}}",
  ).sort();
  assertEquals(tokens, ["good_one", "role", "userName"], "found tokens");
});

Deno.test("findUnknownTokens reports tokens not in the allowlist", () => {
  const allowed = new Set(["userName", "role"]);
  const bad = findUnknownTokens("Hi {{userName}}, you are a {{secret}}", allowed);
  assertEquals(bad, ["secret"], "unknown token surfaced");
});

Deno.test("validateAccentColor only allows 6-digit hex", () => {
  assert(validateAccentColor("#1d4ed8"), "lowercase hex OK");
  assert(validateAccentColor("#FFFFFF"), "uppercase hex OK");
  assert(!validateAccentColor("red"), "named color rejected");
  assert(!validateAccentColor("#fff"), "3-digit hex rejected");
  assert(!validateAccentColor("#1234567"), "7-digit rejected");
  assert(
    !validateAccentColor("red;background:url(javascript:alert(1))"),
    "CSS injection rejected",
  );
  assert(!validateAccentColor(42 as unknown as string), "non-string rejected");
});

Deno.test("formatVarForHtml escapes special chars", () => {
  assertEquals(
    formatVarForHtml("<script>alert('x')</script>", "string"),
    "&lt;script&gt;alert(&#x27;x&#x27;)&lt;/script&gt;",
    "html-dangerous chars escaped",
  );
  assertEquals(
    formatVarForHtml("Maria & Co.", "string"),
    "Maria &amp; Co.",
    "ampersand escaped",
  );
});

Deno.test("formatVarForHtml renders Date in en-PH long form", () => {
  const date = new Date("2026-05-20T15:59:59.000Z");
  const out = formatVarForHtml(date, "date");
  assert(
    out.includes("2026") && (out.includes("May") || out.includes("May")),
    `expected long date including year/month, got ${out}`,
  );
});

Deno.test("formatVarForText returns raw string without escaping", () => {
  assertEquals(
    formatVarForText("Maria & Co.", "string"),
    "Maria & Co.",
    "no HTML escape in text mode",
  );
});

Deno.test("renderTemplate substitutes variables in subject/title/intro/body", () => {
  const rendered = renderTemplate(
    {
      key: "welcome",
      subject: "Hello {{userName}}",
      title: "Welcome {{userName}}",
      intro: "Account ready for {{userName}}.",
      body_html: "<p>Hi {{userName}} ({{role}})</p>",
      accent_color: "#1d4ed8",
    },
    {
      userName: "Maria",
      role: "School",
      affiliation: "Sample",
      loginUrl: "https://x/login",
      magicLinkUrl: "https://x/magic",
    },
  );
  assertEquals(rendered.subject, "Hello Maria", "subject substituted");
  assertEquals(rendered.title, "Welcome Maria", "title substituted");
  assertEquals(rendered.intro, "Account ready for Maria.", "intro substituted");
  assert(
    rendered.body_html.includes("<p>Hi Maria (School)</p>"),
    "body substituted",
  );
});

Deno.test("renderTemplate HTML-escapes variable values but preserves trusted body HTML", () => {
  const rendered = renderTemplate(
    {
      key: "welcome",
      subject: "{{userName}}",
      title: "Welcome",
      intro: "A {{userName}}",
      body_html: "<strong>Hello {{userName}}</strong>",
      accent_color: "#1d4ed8",
    },
    {
      userName: "<script>alert(1)</script>",
      role: "x",
      affiliation: "y",
      loginUrl: "z",
      magicLinkUrl: "w",
    },
  );
  // body_html: <strong> preserved, var escaped inside
  assert(
    rendered.body_html.includes("<strong>") &&
      rendered.body_html.includes("&lt;script&gt;"),
    `body should preserve trusted HTML and escape var: ${rendered.body_html}`,
  );
  // intro: admin template escaped first then var escaped → no live <script>
  assert(!rendered.intro.includes("<script>"), "intro must not contain raw <script>");
  // subject: text destination, not escaped
  assertEquals(
    rendered.subject,
    "<script>alert(1)</script>",
    "subject is text — no escaping (recipient sees as literal text)",
  );
});

Deno.test("renderTemplate escapes title template HTML so admin cannot inject markup", () => {
  const rendered = renderTemplate(
    {
      key: "welcome",
      subject: "x",
      title: "<script>danger</script>",
      intro: "x",
      body_html: "x",
      accent_color: "#1d4ed8",
    },
    {
      userName: "a",
      role: "b",
      affiliation: "c",
      loginUrl: "d",
      magicLinkUrl: "e",
    },
  );
  assert(
    !rendered.title.includes("<script>"),
    `title must escape admin-pasted HTML: ${rendered.title}`,
  );
});

Deno.test("substitution does not re-expand a value containing {{x}}", () => {
  const rendered = renderTemplate(
    {
      key: "welcome",
      subject: "Hello {{userName}}",
      title: "x",
      intro: "x",
      body_html: "x",
      accent_color: "#1d4ed8",
    },
    {
      userName: "{{role}}",
      role: "EXPANDED",
      affiliation: "x",
      loginUrl: "x",
      magicLinkUrl: "x",
    },
  );
  // Subject is text mode — value inserted as-is, but second pass MUST NOT
  // expand the embedded {{role}}.
  assertEquals(
    rendered.subject,
    "Hello {{role}}",
    "double expansion must not occur",
  );
});

Deno.test("renderTemplate strips CRLF from subject (header injection guard)", () => {
  const rendered = renderTemplate(
    {
      key: "welcome",
      subject: "Hello\r\nBcc: attacker@example.com",
      title: "x",
      intro: "x",
      body_html: "x",
      accent_color: "#1d4ed8",
    },
    {
      userName: "a",
      role: "b",
      affiliation: "c",
      loginUrl: "d",
      magicLinkUrl: "e",
    },
  );
  assert(
    !rendered.subject.includes("\n") && !rendered.subject.includes("\r"),
    `subject must strip CR/LF, got: ${JSON.stringify(rendered.subject)}`,
  );
});

Deno.test("renderTemplate falls back to default accent on invalid color", () => {
  const rendered = renderTemplate(
    {
      key: "welcome",
      subject: "x",
      title: "x",
      intro: "x",
      body_html: "x",
      accent_color: "red;background:url(javascript:alert(1))",
    },
    {
      userName: "a",
      role: "b",
      affiliation: "c",
      loginUrl: "d",
      magicLinkUrl: "e",
    },
  );
  assertEquals(rendered.accent_color, "#1d4ed8", "invalid accent → default");
});

Deno.test("unknown {{token}} renders literally", () => {
  const rendered = renderTemplate(
    {
      key: "welcome",
      subject: "Hi {{unknownVar}}",
      title: "x",
      intro: "x",
      body_html: "x",
      accent_color: "#1d4ed8",
    },
    {
      userName: "Maria",
      role: "School",
      affiliation: "x",
      loginUrl: "x",
      magicLinkUrl: "x",
    },
  );
  assertEquals(
    rendered.subject,
    "Hi {{unknownVar}}",
    "unknown token kept literal so admin spots typo",
  );
});

Deno.test("buildDeadlineReminderExtras matches original wording", () => {
  assertEquals(
    buildDeadlineReminderExtras(0),
    {
      deadlinePhrase: "is today",
      deadlineSentence: "The deadline is today.",
      urgencyColor: "#dc2626",
    },
    "0 days",
  );
  assertEquals(
    buildDeadlineReminderExtras(1),
    {
      deadlinePhrase: "is tomorrow",
      deadlineSentence: "The deadline is tomorrow.",
      urgencyColor: "#dc2626",
    },
    "1 day",
  );
  assertEquals(
    buildDeadlineReminderExtras(3),
    {
      deadlinePhrase: "in 3 days",
      deadlineSentence: "3 days remain before the deadline.",
      urgencyColor: "#dc2626",
    },
    "3 days (still red)",
  );
  assertEquals(
    buildDeadlineReminderExtras(7),
    {
      deadlinePhrase: "in 7 days",
      deadlineSentence: "7 days remain before the deadline.",
      urgencyColor: "#d97706",
    },
    "7 days (amber)",
  );
});

Deno.test("listAllowedTokens returns the per-key variable allowlist", () => {
  const allowed = listAllowedTokens("welcome");
  assert(allowed.has("userName"), "welcome allows userName");
  assert(allowed.has("magicLinkUrl"), "welcome allows magicLinkUrl");
  assert(!allowed.has("daysLeft"), "welcome does not allow deadline vars");
});

Deno.test("TEMPLATE_DEFINITIONS has all 4 templates with sample values", () => {
  for (const key of ["welcome", "portal_open_aip", "portal_open_pir", "deadline_reminder"]) {
    const def = TEMPLATE_DEFINITIONS[key];
    assert(!!def, `definition for ${key}`);
    assert(def.variables.length > 0, `${key} has variables`);
    assert(
      Object.keys(def.sampleValues).length === def.variables.length,
      `${key} sampleValues cover all variables`,
    );
  }
});

Deno.test("wrapInShell wraps rendered fields in the branded scaffold", () => {
  const html = wrapInShell({
    subject: "ignored",
    title: "T",
    intro: "I",
    body_html: "<p>B</p>",
    accent_color: "#1d4ed8",
  });
  assert(html.includes("AIP-PIR System"), "shell eyebrow present");
  assert(html.includes("Do not reply"), "shell footer present");
  assert(html.includes(">T<"), "title injected");
  assert(html.includes(">I<"), "intro injected");
  assert(html.includes("<p>B</p>"), "body injected");
});

Deno.test("escapeHtml encodes all five entities", () => {
  assertEquals(
    escapeHtml(`<a href="x" data-x='y'>&</a>`),
    "&lt;a href=&quot;x&quot; data-x=&#x27;y&#x27;&gt;&amp;&lt;/a&gt;",
    "five-entity escape",
  );
});

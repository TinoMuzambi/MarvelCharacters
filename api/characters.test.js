const assert = require("node:assert/strict");
const { afterEach, test } = require("node:test");

const handler = require("./characters");

const originalFetch = global.fetch;
const originalPublicKey = process.env.MARVEL_PUBLIC_KEY;
const originalPrivateKey = process.env.MARVEL_PRIVATE_KEY;

function response() {
	return {
		body: undefined,
		headers: {},
		statusCode: 200,
		setHeader(name, value) {
			this.headers[name] = value;
		},
		status(code) {
			this.statusCode = code;
			return this;
		},
		json(body) {
			this.body = body;
			return this;
		},
	};
}

afterEach(() => {
	global.fetch = originalFetch;
	if (originalPublicKey === undefined) delete process.env.MARVEL_PUBLIC_KEY;
	else process.env.MARVEL_PUBLIC_KEY = originalPublicKey;
	if (originalPrivateKey === undefined) delete process.env.MARVEL_PRIVATE_KEY;
	else process.env.MARVEL_PRIVATE_KEY = originalPrivateKey;
});

test("rejects methods other than GET", async () => {
	const res = response();
	await handler({ method: "POST", query: {} }, res);

	assert.equal(res.statusCode, 405);
	assert.equal(res.headers.Allow, "GET");
	assert.equal(res.headers["Cache-Control"], "no-store");
});

test("rejects malformed query parameters before contacting Marvel", async () => {
	process.env.MARVEL_PUBLIC_KEY = "public-key";
	process.env.MARVEL_PRIVATE_KEY = "private-key";
	global.fetch = () => assert.fail("fetch should not be called");

	for (const query of [
		{ offset: "-1" },
		{ offset: "10001" },
		{ orderBy: "modified" },
		{ nameStartsWith: ["Storm", "Thor"] },
		{ nameStartsWith: "x".repeat(65) },
	]) {
		const res = response();
		await handler({ method: "GET", query }, res);
		assert.equal(res.statusCode, 400);
	}
});

test("requires server-side Marvel credentials", async () => {
	delete process.env.MARVEL_PUBLIC_KEY;
	delete process.env.MARVEL_PRIVATE_KEY;
	const res = response();

	await handler({ method: "GET", query: {} }, res);

	assert.equal(res.statusCode, 503);
	assert.equal(res.headers["Cache-Control"], "no-store");
	assert.deepEqual(res.body, { error: "The character archive is not configured." });
});

test("allows only expected HTTPS destinations in browser-facing data", () => {
	const { safeExternalUrl } = handler._private;

	assert.equal(
		safeExternalUrl("http://www.marvel.com/characters/storm", ["marvel.com", "www.marvel.com"]),
		"https://www.marvel.com/characters/storm"
	);
	assert.equal(safeExternalUrl("javascript:alert(1)", ["www.marvel.com"]), null);
	assert.equal(safeExternalUrl("https://example.com/not-marvel", ["www.marvel.com"]), null);
});

test("signs upstream requests and returns a minimal browser-safe payload", async () => {
	process.env.MARVEL_PUBLIC_KEY = "public-key";
	process.env.MARVEL_PRIVATE_KEY = "private-key";
	let requestedUrl;

	global.fetch = async (url) => {
		requestedUrl = new URL(url);
		return {
			ok: true,
			status: 200,
			json: async () => ({
				attributionText: "Data provided by Marvel. © MARVEL",
				data: {
					total: 40,
					results: [{
						id: 100,
						name: "Storm",
						description: "  Weather-controlling hero.  ",
						thumbnail: { path: "http://i.annihil.us/storm", extension: "jpg" },
						urls: [{ type: "detail", url: "http://www.marvel.com/storm" }],
						comics: { items: ["not forwarded"] },
					}],
				},
			}),
		};
	};

	const res = response();
	await handler({ method: "GET", query: { offset: "24", orderBy: "-name", nameStartsWith: " Storm " } }, res);

	assert.equal(res.statusCode, 200);
	assert.equal(requestedUrl.origin + requestedUrl.pathname, "https://gateway.marvel.com/v1/public/characters");
	assert.equal(requestedUrl.searchParams.get("apikey"), "public-key");
	assert.equal(requestedUrl.searchParams.get("limit"), "24");
	assert.equal(requestedUrl.searchParams.get("offset"), "24");
	assert.equal(requestedUrl.searchParams.get("orderBy"), "-name");
	assert.equal(requestedUrl.searchParams.get("nameStartsWith"), "Storm");
	assert.ok(requestedUrl.searchParams.get("hash"));
	assert.ok(!requestedUrl.toString().includes("private-key"));
	assert.deepEqual(res.body.characters, [{
		id: 100,
		name: "Storm",
		description: "Weather-controlling hero.",
		thumbnail: "https://i.annihil.us/storm.jpg",
		url: "https://www.marvel.com/storm",
	}]);
	assert.equal(res.body.pagination.hasNext, true);
	assert.match(res.headers["Cache-Control"], /s-maxage=300/);
	assert.equal("comics" in res.body.characters[0], false);
});

test("does not cache upstream failures", async () => {
	process.env.MARVEL_PUBLIC_KEY = "public-key";
	process.env.MARVEL_PRIVATE_KEY = "private-key";
	global.fetch = async () => ({
		ok: false,
		status: 429,
		json: async () => ({ status: "rate limited" }),
	});
	const res = response();

	await handler({ method: "GET", query: {} }, res);

	assert.equal(res.statusCode, 502);
	assert.equal(res.headers["Cache-Control"], "no-store");
	assert.deepEqual(res.body, { error: "Marvel’s character service rejected the request." });
});

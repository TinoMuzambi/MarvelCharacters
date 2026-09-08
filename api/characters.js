const crypto = require("node:crypto");

const ENDPOINT = "https://gateway.marvel.com/v1/public/characters";
const PAGE_SIZE = 24;
const MAX_OFFSET = 10000;
const REQUEST_TIMEOUT_MS = 8000;

function readQuery(value) {
	if (value === undefined) return "";
	if (Array.isArray(value) || typeof value !== "string") return null;
	return value;
}

function validateQuery(query = {}) {
	const rawOffset = readQuery(query.offset);
	const rawOrder = readQuery(query.orderBy);
	const rawName = readQuery(query.nameStartsWith);

	if (rawOffset === null || rawOrder === null || rawName === null) return null;
	if (rawOffset && !/^\d{1,5}$/.test(rawOffset)) return null;

	const offset = rawOffset ? Number(rawOffset) : 0;
	const orderBy = rawOrder || "name";
	const nameStartsWith = rawName.trim();

	if (offset > MAX_OFFSET || !["name", "-name"].includes(orderBy)) return null;
	const hasControlCharacter = [...nameStartsWith].some((character) => {
		const codePoint = character.codePointAt(0);
		return codePoint <= 31 || codePoint === 127;
	});
	if (nameStartsWith.length > 64 || hasControlCharacter) return null;

	return { offset, orderBy, nameStartsWith };
}

function safeExternalUrl(value, allowedHostnames) {
	if (!value) return null;
	try {
		const url = new URL(value);
		if (url.protocol === "http:") url.protocol = "https:";
		if (url.protocol !== "https:" || !allowedHostnames.includes(url.hostname)) return null;
		return url.toString();
	} catch {
		return null;
	}
}

function characterThumbnail(thumbnail) {
	if (!thumbnail?.path || thumbnail.path.includes("image_not_available")) return null;
	const extension = /^[a-z0-9]+$/i.test(thumbnail.extension || "")
		? thumbnail.extension
		: "jpg";
	return safeExternalUrl(`${thumbnail.path}.${extension}`, ["i.annihil.us"]);
}

function normalisePayload(payload, offset) {
	if (!Array.isArray(payload?.data?.results)) {
		throw new Error("Unexpected Marvel API response");
	}

	const characters = payload.data.results.map((character) => ({
		id: character.id,
		name: String(character.name || "Unknown character"),
		description: String(character.description || "").trim(),
		thumbnail: characterThumbnail(character.thumbnail),
		url: safeExternalUrl(
			character.urls?.find((item) => item.type === "detail")?.url ||
				character.urls?.[0]?.url,
			["marvel.com", "www.marvel.com"]
		),
	}));
	const total = Number.isFinite(payload.data.total) ? payload.data.total : characters.length;

	return {
		characters,
		pagination: {
			offset,
			pageSize: PAGE_SIZE,
			count: characters.length,
			total,
			hasPrevious: offset > 0,
			hasNext: offset + characters.length < total,
		},
		attributionText: String(payload.attributionText || "Data provided by Marvel."),
	};
}

async function handler(req, res) {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		res.setHeader("Cache-Control", "no-store");
		return res.status(405).json({ error: "Method not allowed." });
	}

	const validatedQuery = validateQuery(req.query);
	if (!validatedQuery) {
		res.setHeader("Cache-Control", "no-store");
		return res.status(400).json({ error: "Invalid character query." });
	}

	const publicKey = process.env.MARVEL_PUBLIC_KEY;
	const privateKey = process.env.MARVEL_PRIVATE_KEY;
	if (!publicKey || !privateKey) {
		res.setHeader("Cache-Control", "no-store");
		return res.status(503).json({ error: "The character archive is not configured." });
	}

	const timestamp = Date.now().toString();
	const hash = crypto
		.createHash("md5")
		.update(`${timestamp}${privateKey}${publicKey}`)
		.digest("hex");
	const params = new URLSearchParams({
		apikey: publicKey,
		hash,
		limit: PAGE_SIZE.toString(),
		offset: validatedQuery.offset.toString(),
		orderBy: validatedQuery.orderBy,
		ts: timestamp,
	});
	if (validatedQuery.nameStartsWith) {
		params.set("nameStartsWith", validatedQuery.nameStartsWith);
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(`${ENDPOINT}?${params}`, {
			headers: { Accept: "application/json" },
			signal: controller.signal,
		});
		const payload = await response.json();

		if (!response.ok) {
			console.error("Marvel API request failed", { status: response.status });
			res.setHeader("Cache-Control", "no-store");
			return res.status(502).json({ error: "Marvel’s character service rejected the request." });
		}

		const body = normalisePayload(payload, validatedQuery.offset);
		res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=86400");
		return res.status(200).json(body);
	} catch (error) {
		console.error("Marvel API request failed", {
			message: error instanceof Error ? error.message : "Unknown error",
		});
		res.setHeader("Cache-Control", "no-store");
		return res.status(502).json({ error: "The character archive is temporarily unavailable." });
	} finally {
		clearTimeout(timeout);
	}
}

module.exports = handler;
module.exports._private = {
	characterThumbnail,
	normalisePayload,
	safeExternalUrl,
	validateQuery,
};

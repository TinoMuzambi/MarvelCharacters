const crypto = require("crypto");

module.exports = async function characters(req, res) {
	if (req.method !== "GET") {
		res.setHeader("Allow", "GET");
		return res.status(405).json({ error: "Method not allowed" });
	}

	const publicKey = process.env.MARVEL_PUBLIC_KEY;
	const privateKey = process.env.MARVEL_PRIVATE_KEY;
	if (!publicKey || !privateKey) {
		return res.status(503).json({ error: "Marvel API is not configured" });
	}

	const parsedOffset = Number.parseInt(req.query.offset || "0", 10);
	const offset = Number.isFinite(parsedOffset)
		? Math.max(0, Math.min(parsedOffset, 100000))
		: 0;
	const orderBy = req.query.orderBy === "-name" ? "-name" : "name";
	const nameStartsWith = String(req.query.nameStartsWith || "")
		.trim()
		.slice(0, 100);
	const timestamp = Date.now().toString();
	const hash = crypto
		.createHash("md5")
		.update(`${timestamp}${privateKey}${publicKey}`)
		.digest("hex");

	const params = new URLSearchParams({
		apikey: publicKey,
		hash,
		limit: "100",
		offset: offset.toString(),
		orderBy,
		ts: timestamp,
	});
	if (nameStartsWith) params.set("nameStartsWith", nameStartsWith);

	try {
		const response = await fetch(
			`https://gateway.marvel.com/v1/public/characters?${params.toString()}`
		);
		const payload = await response.json();
		if (!response.ok) {
			console.error("Marvel API request failed", response.status);
			return res.status(502).json({ error: "Marvel API request failed" });
		}

		res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
		return res.status(200).json(payload);
	} catch (error) {
		console.error("Marvel API request failed", error);
		return res.status(502).json({ error: "Marvel API request failed" });
	}
};

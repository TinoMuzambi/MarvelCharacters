import { useEffect, useMemo, useState } from "react";

import CharacterCard from "./components/CharacterCard";
import "./styles.css";

const PAGE_SIZE = 24;

function App() {
	const [characters, setCharacters] = useState([]);
	const [draftQuery, setDraftQuery] = useState("");
	const [query, setQuery] = useState("");
	const [orderBy, setOrderBy] = useState("name");
	const [offset, setOffset] = useState(0);
	const [total, setTotal] = useState(0);
	const [attribution, setAttribution] = useState("Data provided by Marvel.");
	const [status, setStatus] = useState("loading");
	const [error, setError] = useState("");
	const [requestId, setRequestId] = useState(0);

	useEffect(() => {
		const controller = new AbortController();

		async function loadCharacters() {
			setStatus("loading");
			setError("");

			const params = new URLSearchParams({
				offset: offset.toString(),
				orderBy,
			});
			if (query) params.set("nameStartsWith", query);

			try {
				const response = await fetch(`/api/characters?${params}`, {
					signal: controller.signal,
				});
				const payload = await response.json().catch(() => ({}));

				if (!response.ok) {
					throw new Error(payload.error || "The character archive is unavailable.");
				}
				if (!Array.isArray(payload.characters) || !Number.isFinite(payload.pagination?.total)) {
					throw new Error("The character archive returned an unexpected response.");
				}

				setCharacters(payload.characters);
				setTotal(payload.pagination.total);
				setAttribution(payload.attributionText);
				setStatus("ready");
			} catch (requestError) {
				if (requestError.name === "AbortError") return;
				setCharacters([]);
				setTotal(0);
				setError(requestError.message);
				setStatus("error");
			}
		}

		loadCharacters();
		return () => controller.abort();
	}, [offset, orderBy, query, requestId]);

	const pageNumber = Math.floor(offset / PAGE_SIZE) + 1;
	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const hasPrevious = offset > 0;
	const hasNext = offset + characters.length < total;
	const resultSummary = useMemo(() => {
		if (status === "loading" && characters.length === 0) return "Opening archive…";
		if (status === "error") return "Archive unavailable";
		if (total === 0) return query ? `No matches for “${query}”` : "No characters found";
		const start = offset + 1;
		const end = offset + characters.length;
		return `${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} characters`;
	}, [characters.length, offset, query, status, total]);

	function submitSearch(event) {
		event.preventDefault();
		const nextQuery = draftQuery.trim();
		setOffset(0);
		if (nextQuery === query && offset === 0) setRequestId((value) => value + 1);
		else setQuery(nextQuery);
	}

	function clearSearch() {
		setDraftQuery("");
		setOffset(0);
		if (query) setQuery("");
		else setRequestId((value) => value + 1);
	}

	function changeOrder(event) {
		setOrderBy(event.target.value);
		setOffset(0);
	}

	return (
		<div className="site-shell">
			<header className="masthead">
				<a className="wordmark" href="#archive" aria-label="Marvel character archive home">
					<span aria-hidden="true">M</span>
					Character archive
				</a>
				<a className="source-link" href="https://developer.marvel.com/" target="_blank" rel="noreferrer">
					Powered by the Marvel API
				</a>
			</header>

			<main id="archive">
				<section className="hero" aria-labelledby="page-title">
					<div className="hero-copy">
						<p className="edition">An interactive index of heroes, villains and everyone between</p>
						<h1 id="page-title">Find your character.</h1>
						<p className="intro">
							Search Marvel’s public roster, compare biographies and follow each character back to the official source.
						</p>
					</div>
					<div className="hero-mark" aria-hidden="true">
						<span>616</span>
						<small>archive</small>
					</div>
				</section>

				<section className="search-panel" aria-label="Character search controls">
					<form onSubmit={submitSearch} role="search">
						<div className="field search-field">
							<label htmlFor="character-search">Character name</label>
							<input
								id="character-search"
								type="search"
								placeholder="Try Storm or Spider-Man"
								value={draftQuery}
								onChange={(event) => setDraftQuery(event.target.value)}
								maxLength={64}
								autoComplete="off"
							/>
						</div>
						<div className="field sort-field">
							<label htmlFor="sort-direction">Sort</label>
							<select id="sort-direction" value={orderBy} onChange={changeOrder}>
								<option value="name">Name A–Z</option>
								<option value="-name">Name Z–A</option>
							</select>
						</div>
						<button className="search-button" type="submit">Search archive</button>
						{query && (
							<button className="clear-button" type="button" onClick={clearSearch}>Clear search</button>
						)}
					</form>
				</section>

				<section className="results" aria-labelledby="results-heading" aria-busy={status === "loading"}>
					<div className="results-header">
						<div>
							<h2 id="results-heading">Roster</h2>
							<p aria-live="polite">{resultSummary}</p>
						</div>
						{total > 0 && <p className="page-count">Page {pageNumber} / {pageCount}</p>}
					</div>

					{status === "error" && (
						<div className="message" role="alert">
							<h3>We couldn’t open the archive.</h3>
							<p>{error}</p>
							<button type="button" onClick={() => setRequestId((value) => value + 1)}>Try again</button>
						</div>
					)}

					{status !== "error" && characters.length === 0 && status !== "loading" && (
						<div className="message">
							<h3>No names matched that search.</h3>
							<p>Try the beginning of a character’s name, such as “Captain” or “Black”.</p>
							<button type="button" onClick={clearSearch}>Browse every character</button>
						</div>
					)}

					{status === "loading" && characters.length === 0 ? (
						<div className="loading-grid" aria-label="Loading characters">
							{Array.from({ length: 8 }, (_, index) => <span key={index} />)}
						</div>
					) : (
						<ol className={`character-grid${status === "loading" ? " is-refreshing" : ""}`} start={offset + 1}>
							{characters.map((character, index) => (
								<li key={character.id}>
									<CharacterCard character={character} index={offset + index + 1} />
								</li>
							))}
						</ol>
					)}

					{characters.length > 0 && (
						<nav className="pagination" aria-label="Character result pages">
							<button type="button" disabled={!hasPrevious || status === "loading"} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
								Previous page
							</button>
							<span aria-current="page">{pageNumber} of {pageCount}</span>
							<button type="button" disabled={!hasNext || status === "loading"} onClick={() => setOffset(offset + PAGE_SIZE)}>
								Next page
							</button>
						</nav>
					)}
				</section>
			</main>

			<footer>
				<p>{attribution}</p>
				<p>Character names and images remain the property of their respective owners.</p>
			</footer>
		</div>
	);
}

export default App;

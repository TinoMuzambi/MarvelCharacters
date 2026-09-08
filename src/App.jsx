import { useEffect, useState } from "react";

import "./css/App.min.css";
import Card from "./components/Card";

const App = () => {
	const [characters, setCharacters] = useState([]);
	const [fetching, setFetching] = useState(true);
	const [offset, setOffset] = useState(0);
	const [nextDisabled, setNextDisabled] = useState(false);
	const [query, setQuery] = useState("");
	const [sortDir, setSortDir] = useState("asc");

	useEffect(() => {
		getData();
		// eslint-disable-next-line
	}, [offset]);

	const getData = async () => {
		setFetching(true);
		setNextDisabled(false);
		try {
			const orderBy = sortDir === "asc" ? "name" : "-name";
			const params = new URLSearchParams({
				limit: "100",
				offset: offset.toString(),
				orderBy,
			});
			if (query.trim()) params.set("nameStartsWith", query.trim());

			const response = await fetch(`/api/characters?${params.toString()}`);
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error || "Marvel request failed");

			const results = payload.data?.results || [];
			setCharacters(results);
			if (!results.length) {
				if (offset > 0) setOffset(Math.max(0, offset - 100));
				setNextDisabled(true);
			}
		} catch (error) {
			console.error(error);
			setCharacters([]);
		} finally {
			setFetching(false);
		}
	};

	const prevPage = () => {
		if (offset === 0) return;
		setOffset(offset - 100);
		setNextDisabled(false);
	};
	const nextPage = () => {
		setOffset(offset + 100);
	};

	const submitHandler = (e) => {
		e.preventDefault();
		if (offset === 0) getData();
		else setOffset(0);
	};

	if (fetching)
		return (
			<div className="spinner flex">
				<div></div>
			</div>
		);

	return (
		<>
			<main>
				<h1 className="title">Marvel Characters</h1>
				<form onSubmit={submitHandler}>
					<label htmlFor="character-search">Search characters</label>
					<input
						type="text"
						id="character-search"
						placeholder="Search a character"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<label htmlFor="sort-direction">Sort direction</label>
					<select
						id="sort-direction"
						value={sortDir}
						onChange={(e) => setSortDir(e.target.value)}
					>
						<option value="asc">asc</option>
						<option value="desc">desc</option>
					</select>
					<button type="submit">Search</button>
				</form>
				<section className="cards">
					{characters.map((character) => (
						<Card
							key={character.id}
							name={character.name}
							thumbnail={character.thumbnail.path + ".jpg"}
							description={character.description}
							url={character.urls?.[1]?.url || character.urls?.[0]?.url}
						/>
					))}
				</section>
				<div className="buttons">
					<button onClick={prevPage}>Prev Page</button>
					<button
						className={nextDisabled ? "disabled" : ""}
						onClick={nextPage}
						disabled={nextDisabled}
					>
						Next Page
					</button>
				</div>
			</main>
			<footer>Data provided by Marvel. © 2014 Marvel</footer>
		</>
	);
};

export default App;

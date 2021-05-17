import { useEffect, useState } from "react";
import md5 from "md5";

import "./css/App.min.css";

const App = () => {
	const [characters, setCharacters] = useState([]);
	const [fetching, setFetching] = useState(true);
	const [offset, setOffset] = useState(0);
	const [nextDisabled, setNextDisabled] = useState(false);
	const [query, setQuery] = useState("");

	useEffect(() => {
		const getData = async () => {
			setFetching(true);
			try {
				const ts = 1;
				const key = process.env.REACT_APP_MARVEL_PUBLIC_KEY;
				const hash = md5(
					ts +
						process.env.REACT_APP_MARVEL_KEY +
						process.env.REACT_APP_MARVEL_PUBLIC_KEY
				);

				const data = await fetch(
					`https://gateway.marvel.com/v1/public/characters?limit=100&offset=${offset}&ts=${ts}&apikey=${key}&hash=${hash}`
				);
				const res = await data.json();
				setCharacters(res.data.results);
				if (!res.data.results.length) {
					setOffset(offset - 100);
					setNextDisabled(true);
				}

				setFetching(false);
			} catch (error) {
				console.error(error);
			}
		};
		// getData();
	}, [offset]);

	const prevPage = () => {
		if (offset === 0) return;
		setOffset(offset - 100);
		setNextDisabled(false);
	};
	const nextPage = () => {
		setOffset(offset + 100);
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
				<form>
					<input
						type="text"
						id=""
						placeholder="Search a character"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
					<button type="submit">Search</button>
				</form>
				<section className="cards">
					{characters.map((character) => (
						<div className="card" key={character.id}>
							<h2 className="name">{character.name}</h2>
							<img
								src={
									character.thumbnail.path + ".jpg" ||
									"https://media.istockphoto.com/vectors/no-image-available-sign-vector-id922962354?k=6&m=922962354&s=612x612&w=0&h=_KKNzEwxMkutv-DtQ4f54yA5nc39Ojb_KPvoV__aHyU="
								}
								alt={character.name}
							/>
							<p className="desc">
								{character.description || "No description provided"}
							</p>
							<span className="wrap">
								<a
									href={character?.urls[1]?.url}
									className="link"
									target="__blank"
								>
									Read More
								</a>
							</span>
						</div>
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

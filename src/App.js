import { useEffect, useState } from "react";
import md5 from "md5";

import "./css/App.min.css";
import Card from "./components/Card";

const App = () => {
	const [characters, setCharacters] = useState([]);
	const [fetching, setFetching] = useState(true);
	const [offset, setOffset] = useState(0);
	const [nextDisabled, setNextDisabled] = useState(false);
	const [query, setQuery] = useState("");

	useEffect(() => {
		getData();
		// eslint-disable-next-line
	}, [offset]);

	const getData = async () => {
		setFetching(true);
		setNextDisabled(false);
		try {
			const ts = 1;
			const key = process.env.REACT_APP_MARVEL_PUBLIC_KEY;
			const hash = md5(
				ts +
					process.env.REACT_APP_MARVEL_KEY +
					process.env.REACT_APP_MARVEL_PUBLIC_KEY
			);

			const data = query
				? await fetch(
						`https://gateway.marvel.com/v1/public/characters?nameStartsWith=${query}&limit=100&offset=${offset}&ts=${ts}&apikey=${key}&hash=${hash}`
				  )
				: await fetch(
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
		getData();
		setQuery("");
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
						<Card
							key={character.id}
							name={character.name}
							thumbnail={character.thumbnail.path + ".jpg"}
							description={character.description}
							url={character.urls[1].url}
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

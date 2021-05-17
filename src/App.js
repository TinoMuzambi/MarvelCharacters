import { useEffect, useState } from "react";
import md5 from "md5";

const App = () => {
	const [characters, setCharacters] = useState([]);
	useEffect(() => {
		const getData = async () => {
			try {
				const ts = 1;
				const key = process.env.REACT_APP_MARVEL_PUBLIC_KEY;
				const hash = md5(
					ts +
						process.env.REACT_APP_MARVEL_KEY +
						process.env.REACT_APP_MARVEL_PUBLIC_KEY
				);

				const data = await fetch(
					`http://gateway.marvel.com/v1/public/characters?ts=${ts}&apikey=${key}&hash=${hash}`
				);
				const res = await data.json();
				setCharacters(res.data.results);
			} catch (error) {
				console.error(error);
			}
		};
		// getData();
	}, []);

	if (!characters) return;

	return (
		<>
			<main></main>
			<footer>Data provided by Marvel. © 2014 Marvel</footer>
		</>
	);
};

export default App;

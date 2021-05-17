import { useEffect } from "react";
import md5 from "md5";

const App = () => {
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
				console.log(res);
			} catch (error) {
				console.error(error);
			}
		};
		// getData();
	}, []);

	return "Clean React Boilerplate";
};

export default App;

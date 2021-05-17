import { useEffect } from "react";

const App = () => {
	useEffect(() => {
		const getData = async () => {
			try {
				const data = await fetch(
					`https://gateway.marvel.com/v1/characters?apikey=${process.env.REACT_APP_MARVEL_KEY}`
				);
				console.log(data);
			} catch (error) {
				console.error(error);
			}
		};
		getData();
	}, []);

	return "Clean React Boilerplate";
};

export default App;

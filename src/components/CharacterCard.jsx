import { useState } from "react";

function CharacterCard({ character, index }) {
	const [imageFailed, setImageFailed] = useState(false);
	const initials = character.name
		.split(/\s+/)
		.slice(0, 2)
		.map((word) => word[0])
		.join("");

	return (
		<article className="character-card">
			<div className="portrait">
				{character.thumbnail && !imageFailed ? (
					<img
						src={character.thumbnail}
						alt=""
						loading="lazy"
						decoding="async"
						onError={() => setImageFailed(true)}
					/>
				) : (
					<span className="portrait-fallback" aria-hidden="true">{initials}</span>
				)}
				<span className="index" aria-hidden="true">{String(index).padStart(3, "0")}</span>
			</div>
			<div className="character-copy">
				<h3>{character.name}</h3>
				<p>{character.description || "Marvel has not published a biography for this character yet."}</p>
				{character.url && (
					<a href={character.url} target="_blank" rel="noreferrer">View official profile</a>
				)}
			</div>
		</article>
	);
}

export default CharacterCard;

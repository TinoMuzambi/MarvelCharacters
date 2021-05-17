const Card = ({ name, thumbnail, description, url }) => {
	return (
		<div className="card">
			<h2 className="name">{name}</h2>
			<img
				src={
					thumbnail ||
					"https://media.istockphoto.com/vectors/no-image-available-sign-vector-id922962354?k=6&m=922962354&s=612x612&w=0&h=_KKNzEwxMkutv-DtQ4f54yA5nc39Ojb_KPvoV__aHyU="
				}
				alt={name}
			/>
			<p className="desc">{description || "No description provided"}</p>
			<span className="wrap">
				<a href={url} className="link" target="__blank">
					Read More
				</a>
			</span>
		</div>
	);
};

export default Card;

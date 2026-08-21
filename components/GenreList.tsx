const genres = [
  "Action",
  "Drama",
  "Comedy",
  "Thriller",
  "Horror",
  "Romance",
  "Documentary",
  "Animation",
  "Crime",
  "Adventure",
  "Sci-Fi",
];

export default function GenreList() {
  return (
    <section className="px-4 sm:px-8 py-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4">Genres</h2>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {genres.map((genre) => (
          <span
            key={genre}
            className="px-3 sm:px-4 py-2 bg-surface rounded-full text-xs sm:text-sm text-gray-200 cursor-pointer hover:bg-white/20 transition"
          >
            {genre}
          </span>
        ))}
      </div>
    </section>
  );
}
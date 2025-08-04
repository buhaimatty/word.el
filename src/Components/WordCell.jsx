export default function WordCell({ word, isFound = false }) {
  return (
    <p
      className="
        px-10 py-1.5 bg-main/30 rounded-sm
        hover:cursor-pointer
        active:scale-85
        transition ease-out
      "
    >
      {isFound ? word : "?"}
    </p>
  );
}

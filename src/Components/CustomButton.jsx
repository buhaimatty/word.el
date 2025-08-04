export default function CustomButton({ letter, isActive, isFound, getLetter }) {
  return (
    <button
      className={`
        size-9.5
        text-md
        rounded-sm
        hover:bg-main/15 transition ease-in-out
        active:scale-75
        ${isActive ? "border border-2 border-main" : "bg-none"}
        ${isFound ? "border border-2 border-myGreen" : "bg-none"}
      `}
      onClick={getLetter}
    >
      {letter}
    </button>
  );
}

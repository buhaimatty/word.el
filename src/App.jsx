import { useState, useEffect } from "react";
import OpenAI from "openai";
import generateMatrix from "./utils/generateMatrix";
import CustomButton from "./Components/CustomButton";
import WordCell from "./Components/wordCell";
import Timer from "./Components/Timer";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Wand } from "lucide-react";

// Base array of words to start with / later to be replaced by API
const baseArr = [
  "Mountain",
  "Library",
  "Whisper",
  "Lantern",
  "Ocean",
  "Meadow",
  "Puzzle",
  "Horizon",
];

// OpenAI API setup: text generation
const api = import.meta.env.VITE_API_KEY;
const client = new OpenAI({
  apiKey: api,
  dangerouslyAllowBrowser: true, // yet
});

// Function to generate a new list of words using OpenAI API
const generateNewList = async (promptText) => {
  let response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: promptText,
  });

  return response.output_text;
};

function App() {
  let promptText =
    "Generate list of 8 nouns, with no text besides them and no numbering.";

  const [isLoading, setIsLoading] = useState(true);
  const [matrix, setMatrix] = useState([]);
  const [currentWords, setCurrentWords] = useState([]);
  const [currentWordsAmount, setCurrentWordsAmount] = useState(0);
  const [currentIsShown, setCurrentIsShown] = useState([]);
  const [activeWords, setActiveWords] = useState([]);
  const [foundWordsCounter, setFoundWordsCounter] = useState(0);
  const [foundButtonIds, setFoundButtonIds] = useState([]);
  const [activeButtons, setActiveButtons] = useState([]);
  const [lastClicked, setLastClicked] = useState(null); // to support shift+click

  // Loading states with API call
  useEffect(() => {
    const initializeWords = async () => {
      try {
        const newListRaw = await generateNewList(promptText);
        const newWords = newListRaw
          .replaceAll("  \n", " ")
          .split(" ")
          .map((word) => word.toLowerCase());

        setCurrentWords(newWords);
        setActiveWords(newWords);
        setCurrentWordsAmount(newWords.length);
        setCurrentIsShown(Array.from({ length: newWords.length }, () => false));
        setMatrix(generateMatrix(newWords));
        setIsLoading(false); // Set preloader animation to false after fetching words
      } catch (error) {
        console.error("Failed to fetch words. Falling back to baseArr.", err);
        const fallbackWords = baseArr.map((w) => w.toLowerCase());

        setCurrentWords(fallbackWords);
        setActiveWords(fallbackWords);
        setCurrentWordsAmount(fallbackWords.length);
        setCurrentIsShown(
          Array.from({ length: fallbackWords.length }, () => false)
        );
        setMatrix(generateMatrix(fallbackWords));
        setIsLoading(false); // Set preloader animation to false after fetching words
      }
    };

    initializeWords();
  }, []);

  // Loading NEW words
  const handleNewLevel = async () => {
    setIsLoading(true);

    let promptDetails = `Please, avoid such words: ${currentWords.join(", ")}.`;
    const newPromptText = `${promptText} ${promptDetails}`;
    console.log("New prompt text:", newPromptText);

    const newListRaw = await generateNewList(promptText);
    const newWords = newListRaw
      .replaceAll("  \n", " ")
      .split(" ")
      .map((word) => word.toLowerCase());

    // regenerate everything based on newWords
    setCurrentWords(newWords);
    setCurrentWordsAmount(newWords.length);
    setMatrix(generateMatrix(newWords));
    setCurrentIsShown(Array(newWords.length).fill(false));
    setActiveWords(newWords);
    setFoundWordsCounter(0);
    setFoundButtonIds([]);
    setActiveButtons([]);
    setLastClicked(null);
    setIsLoading(false); // Set preloader animation to false after fetching words
  };

  const handleClickOnLetter = (row, col, letter, isShiftKey) => {
    const id = `${row}-${col}`;
    const clicked = { id, row, col, letter };

    setActiveButtons((prev) => {
      const exists = prev.find((btn) => btn.id === id);

      // Normal deactivation
      if (exists) return prev.filter((btn) => btn.id !== id);

      // Shift+Click logic
      if (isShiftKey && lastClicked) {
        const sameRow = lastClicked.row === row;
        const sameCol = lastClicked.col === col;

        if (sameRow || sameCol) {
          let range = [];

          if (sameRow) {
            const start = Math.min(lastClicked.col, col);
            const end = Math.max(lastClicked.col, col);
            for (let c = start; c <= end; c++) {
              range.push({
                id: `${row}-${c}`,
                row,
                col: c,
                letter: matrix[row][c],
              });
            }
          } else if (sameCol) {
            const start = Math.min(lastClicked.row, row);
            const end = Math.max(lastClicked.row, row);
            for (let r = start; r <= end; r++) {
              range.push({
                id: `${r}-${col}`,
                row: r,
                col,
                letter: matrix[r][col],
              });
            }
          }

          setLastClicked(clicked);
          return range;
        }
      }

      // No shift or invalid shift-click
      const next = [...prev, clicked];

      const allSameRow = next.every((btn) => btn.row === row);
      const allSameCol = next.every((btn) => btn.col === col);

      if (allSameRow) {
        const cols = next.map((btn) => btn.col).sort((a, b) => a - b);
        const contiguous = cols.every(
          (c, i) => i === 0 || c === cols[i - 1] + 1
        );

        if (contiguous) {
          const sorted = [...next].sort((a, b) => a.col - b.col);
          setLastClicked(clicked);
          return sorted;
        }
      }

      if (allSameCol) {
        const rows = next.map((btn) => btn.row).sort((a, b) => a - b);
        const contiguous = rows.every(
          (r, i) => i === 0 || r === rows[i - 1] + 1
        );

        if (contiguous) {
          const sorted = [...next].sort((a, b) => a.row - b.row);
          setLastClicked(clicked);
          return sorted;
        }
      }

      // Not valid — just start new
      setLastClicked(clicked);
      return [clicked];
    });
    // console.log(clicked);
  };

  const handleClearList = () => setActiveButtons([]);

  // Finding words:
  // useEffect to check if activeButtons form a valid word
  // and update the state accordingly
  useEffect(() => {
    // setTimeout(() => {}, 500);
    let word = "";
    activeButtons.forEach((obj) => {
      word += obj.letter;
    });

    if (activeWords.includes(word)) {
      // clean up words(letters) to find
      setActiveWords(() => activeWords.filter((w) => w != word));

      // show found word
      let index = currentWords.indexOf(word);
      setCurrentIsShown((prev) => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });

      // iterate words
      setFoundWordsCounter(foundWordsCounter + 1);

      // set isFound to letters
      setFoundButtonIds((prev) => [
        ...prev,
        ...activeButtons.map((btn) => btn.id),
      ]);
      // clear active word
      setTimeout(() => {
        setActiveButtons([]);
      }, 400);
    }
  }, [activeButtons]);

  // Animation with GSAP
  useGSAP(() => {
    gsap.to("#loaderWord", {
      ease: "ease.Power1.in",
      x: -20,
      repeat: -1,
      yoyo: true,
      duration: 0.4,
    });

    gsap.to("#loaderLe", {
      ease: "ease.Power1.in",
      x: 20,
      repeat: -1,
      yoyo: true,
      duration: 0.4,
    });

    gsap.from("#navigation", {
      ease: "back.out(1.7)",
      opacity: 0,
      y: -100,
      duration: 1,
    });

    gsap.from("#selected", {
      ease: "back.out(1.7)",
      opacity: 0,
      y: 40,
    });

    gsap.from("#found", {
      ease: "back.out(1.7)",
      opacity: 0,
      y: 30,
      delay: 0.1,
    });

    gsap.from("#matrix", {
      ease: "back.out(1.7)",
      opacity: 0,
      y: 100,
    });
  });

  return (
    <div className="relative">
      <nav
        id="navigation"
        className="fixed top-0 right-0 left-0
        px-21 md:px-10 flex justify-center z-10"
      >
        <div className="px-25 pt-7 pb-5.5 border-b w-full bg-white/75">
          <h1 className="font-bold text-4xl text-myDark text-center">
            Word.le
          </h1>
        </div>
      </nav>

      <section
        className="
          px-28 mt-24
          flex flex-col items-center py-7
          md:justify-center
        "
      >
        {isLoading ? (
          // preloader
          <div className="mt-[13.4%] flex">
            <p id="loaderWord" className="text-xl italic">
              word
            </p>
            <p id="loaderLe" className="text-xl italic">
              .le
            </p>
          </div>
        ) : (
          <div
            className="
            flex
            lg:flex-row lg:items-start lg:justify-center w-full
            md:flex-col md:gap-5
            md:justify-center md:items-center
          "
          >
            {/* MATRIX */}
            <div
              id="matrix"
              className="
             flex lg:justify-center lg:items-center
             lg:me-[7%]
             md:me-0
          "
            >
              <div
                className="
                border rounded-md p-1.5 mb-5
              "
              >
                {matrix.map((rowArr, rowIndex) => (
                  <div
                    className="
                  flex justify-between gap-1
                "
                    key={rowIndex}
                  >
                    {rowArr.map((letter, colIndex) => {
                      const id = `${rowIndex}-${colIndex}`;
                      const isActive = activeButtons.some(
                        (btn) => btn.id === id
                      );
                      const isFound = foundButtonIds.includes(id);

                      return (
                        <span key={colIndex}>
                          <CustomButton
                            letter={letter}
                            isActive={isActive}
                            isFound={isFound}
                            getLetter={(e) =>
                              handleClickOnLetter(
                                rowIndex,
                                colIndex,
                                letter,
                                e.shiftKey
                              )
                            }
                          />
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* SIDE MENU */}
            <div
              className="
              w-[32em]
            "
            >
              {/* Selected */}
              <div
                id="selected"
                className="
                flex flex-col mb-7
                lg:justify-start lg:items-start
                md:justify-center md:items-center
              "
              >
                <h1
                  className="
                  text-3xl text-main font-bold mb-1.5
                  lg:text-start
                  md:text-center
                "
                >
                  Selected
                </h1>
                <h1
                  className="
                  text-md mb-4 text-myDark
                  lg:text-start
                  md:text-center
                "
                >
                  Time to find all words in that box.
                </h1>
                <div
                  className="
                flex gap-4 mb-4
                md:justify-center md:items-center
                "
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span
                      key={i}
                      className="
                    size-9 border-2 border-gray-200 rounded-sm 
                    flex items-center justify-center font-semibold
                  "
                    >
                      {activeButtons[i]?.letter || " "}
                    </span>
                  ))}
                </div>
                <button
                  onClick={handleClearList}
                  className="
                  rounded-sm px-7 py-1.5 bg-gray-100
                  hover:cursor-pointer hover:bg-gray-200
                  active:scale-85
                  transition ease-out
                "
                >
                  clear
                </button>
              </div>

              {/* Found */}
              <div id="found">
                <div className="mb-7 flex flex-col lg:justify-start md:justify-center">
                  <h1 className="text-3xl text-main font-bold mb-3">Found</h1>
                  <div className="flex flex-wrap gap-3 lg:justify-start md:justify-center">
                    {currentWords.map((word, i) => (
                      <div key={i}>
                        <WordCell word={word} isFound={currentIsShown[i]} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Words found & Timer */}
                <div>
                  <hr className="border-t border-gray-300" />
                  <div className="mt-3 flex justify-between text-myDark/50">
                    <p>
                      {foundWordsCounter}/{currentWordsAmount}
                    </p>
                    <Timer />
                  </div>
                  {/* <p>{activeWords}</p>
              <p>{currentIsShown.join("")}</p> */}
                </div>
              </div>
              {/* button regen level */}
              <div className="flex justify-center mt-3">
                <button
                  // disabled
                  className="
                  text-xl text-white
                  hover:cursor-pointer
                  active:bg-main/30 transition ease
                  hover:bg-main hover:ease-in-out duration-150
                  rounded-sm bg-main/88 px-6 py-1.5
                "
                  onClick={handleNewLevel}
                >
                  New level
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;

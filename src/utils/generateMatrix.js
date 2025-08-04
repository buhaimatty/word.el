const MATRIX_SIZE = 10;

const createEmptyMatrix = () => {
  return Array.from({ length: MATRIX_SIZE }, () =>
    Array(MATRIX_SIZE).fill("-")
  );
};

const generateCrossings = (arr, amount) => {
  let pairs = [];
  let activeList = [...arr];
  let reservedWords = [];

  let attempts = 0;

  while (pairs.length < amount && attempts < 100) {
    attempts++;

    // Get random active word
    const rndWordIndex = Math.floor(Math.random() * activeList.length);
    const wordA = activeList[rndWordIndex];

    // Try to find a crossing partner
    const possibleLetters = wordA.split("").sort(() => 0.5 - Math.random());

    let foundPair = false;

    for (const letter of possibleLetters) {
      const candidates = activeList.filter(
        (w) => w !== wordA && w.includes(letter)
      );

      if (candidates.length > 0) {
        const wordB = candidates[Math.floor(Math.random() * candidates.length)];

        pairs.push([wordA, wordB, letter]);
        reservedWords.push(wordA, wordB);
        activeList = activeList.filter((w) => w !== wordA && w !== wordB);
        foundPair = true;
        break;
      }
    }

    if (!foundPair) {
      // If no crossing partner found, still remove word to avoid infinite loop
      activeList = activeList.filter((w) => w !== wordA);
    }
  }

  return [reservedWords, activeList, pairs];
};

const canPlaceWord = (matrix, word, row, col, isHorizontal) => {
  if (isHorizontal) {
    if (col + word.length > MATRIX_SIZE) return false;
    for (let i = 0; i < word.length; i++) {
      const cell = matrix[row][col + i];
      if (cell !== "-" && cell !== word[i]) return false;
    }
  } else {
    if (row + word.length > MATRIX_SIZE) return false;
    for (let i = 0; i < word.length; i++) {
      const cell = matrix[row + i][col];
      if (cell !== "-" && cell !== word[i]) return false;
    }
  }
  return true;
};

const placeWord = (matrix, word, row, col, isHorizontal) => {
  for (let i = 0; i < word.length; i++) {
    if (isHorizontal) {
      matrix[row][col + i] = word[i];
    } else {
      matrix[row + i][col] = word[i];
    }
  }
};

const placeCrossingPair = (matrix, horiz, vert, letter) => {
  const hIndex = horiz.indexOf(letter);
  const vIndex = vert.indexOf(letter);

  // Try placing at a few random locations
  for (let tries = 0; tries < 100; tries++) {
    let row = Math.floor(Math.random() * (MATRIX_SIZE - vert.length));
    let col = Math.floor(Math.random() * (MATRIX_SIZE - horiz.length));

    if (
      canPlaceWord(matrix, horiz, row + vIndex, col, true) &&
      canPlaceWord(matrix, vert, row, col + hIndex, false)
    ) {
      placeWord(matrix, horiz, row + vIndex, col, true);
      placeWord(matrix, vert, row, col + hIndex, false);
      return true;
    }
  }
  return false;
};

const fillRemainingWords = (matrix, words) => {
  const notPlaced = [];

  for (const word of words) {
    let placed = false;

    for (let tries = 0; tries < 500 && !placed; tries++) {
      const row = Math.floor(Math.random() * MATRIX_SIZE);
      const col = Math.floor(Math.random() * MATRIX_SIZE);
      const isHorizontal = Math.random() < 0.5;

      if (canPlaceWord(matrix, word, row, col, isHorizontal)) {
        placeWord(matrix, word, row, col, isHorizontal);
        placed = true;
      }
    }

    if (!placed) {
      notPlaced.push(word);
    }
  }

  return notPlaced;
};

const confuseMatrix = (matrix) => {
  for (let i = 0; i < MATRIX_SIZE; i++) {
    for (let j = 0; j < MATRIX_SIZE; j++) {
      if (matrix[i][j] === "-") {
        const randomChar = String.fromCharCode(
          97 + Math.floor(Math.random() * 26)
        );
        matrix[i][j] = randomChar;
        // matrix[i][j] = getBiasedRandomChar();
      }
    }
  }
};

export default function generateMatrix(arr) {
  const arrCopy = [...arr];
  const [reservedWords, activeWords, pairs] = generateCrossings(arrCopy, 3);

  const matrix = createEmptyMatrix();
  const fallbackWords = [];

  for (const [horiz, vert, letter] of pairs) {
    const success = placeCrossingPair(matrix, horiz, vert, letter);
    if (!success) {
      // console.warn(
      //   `❌ Failed to place crossing: ${horiz} + ${vert} on '${letter}'`
      // );
      fallbackWords.push(horiz, vert); // Add them back as regular words
    }
  }

  const notPlaced = fillRemainingWords(matrix, [
    ...activeWords,
    ...fallbackWords,
  ]);

  // if (notPlaced.length > 0) {
  //   console.warn("⚠️ Some words could not be placed at all:", notPlaced);
  // }

  // confuseMatrix(matrix);
  return matrix;
}

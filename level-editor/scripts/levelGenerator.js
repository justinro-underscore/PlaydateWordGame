const GENERATING_PUZZLE_BOARD_SIZE = 100;

class PuzzleData
{
    constructor(rawWordList)
    {
        this.wordList = [];
        this.boardHeight = 0;
        this.boardWidth = 0;
        this.board = [];
        this.score = 0;
        this.puzzleHash = 0;
        this.puzzleShapeHash = 0;

        this.initPuzzle(rawWordList);
    }

    initPuzzle(rawWordList)
    {
        let minY, minX, maxY, maxX;
        for (let i = 0; i < rawWordList.length; i++)
        {
            let wordData = rawWordList[i];
            let wordLength = wordData.word.length;
            let ySpan = wordData.horizontal ? 1 : wordLength;
            let xSpan = wordData.horizontal ? wordLength : 1;

            if (minY === undefined || wordData.y < minY)
            {
                minY = wordData.y;
            }
            if (minX === undefined || wordData.x < minX)
            {
                minX = wordData.x;
            }
            if (maxY === undefined || wordData.y + ySpan > maxY)
            {
                maxY = wordData.y + ySpan;
            }
            if (maxX === undefined || wordData.x + xSpan > maxX)
            {
                maxX = wordData.x + xSpan;
            }
        }

        this.wordList = [];
        for (let i = 0; i < rawWordList.length; i++)
        {
            let wordData = rawWordList[i];
            this.wordList.push(new PuzzleWordData(wordData.word, wordData.y - minY, wordData.x - minX, wordData.horizontal));
        }
        this.boardHeight = maxY - minY;
        this.boardWidth = maxX - minX;

        this.board = this.constructBoard();
        this.score = this.calculateScore();
        this.puzzleHash = this.calculatePuzzleHash();
        this.puzzleShapeHash = this.calculatePuzzleShapeHash();
    }

    constructBoard()
    {
        let board = Array(this.boardHeight * this.boardWidth);

        for (let wordIdx = 0; wordIdx < this.wordList.length; wordIdx++)
        {
            let wordData = this.wordList[wordIdx];
            for (let i = 0; i < wordData.word.length; i++)
            {
                if (wordData.horizontal)
                {
                    setCell(board, this.boardWidth, wordData.y, wordData.x + i, wordData.word[i]);
                }
                else
                {
                    setCell(board, this.boardWidth, wordData.y + i, wordData.x, wordData.word[i]);
                }
            }
        }

        return board;
    }

    calculateScore()
    {
        const sizeFactorTuning = 1;
        const fullnessFactorTuning = 1.1;
        const squarenessFactorTuning = 1.1;
        const widenessFactorTuning = 1.2;

        let boardArea = this.boardHeight * this.boardWidth;
        let sizeFactor = 1 / boardArea;

        let fullCells = 0;
        for (let y = 0; y < this.boardHeight; y++)
        {
            for (let x = 0; x < this.boardWidth; x++)
            {
                if (getCell(this.board, this.boardWidth, y, x) !== undefined)
                {
                    fullCells++;
                }
            }
        }
        let fullnessFactor = fullCells / boardArea;

        let squarenessFactor = Math.min(this.boardHeight, this.boardWidth) / Math.max(this.boardHeight, this.boardWidth);
        let widenessFactor = Math.min(this.boardWidth / this.boardHeight, 1.5);

        return (Math.pow(sizeFactor, sizeFactorTuning) * Math.pow(fullnessFactor, fullnessFactorTuning) *
                Math.pow(squarenessFactor, squarenessFactorTuning) * Math.pow(widenessFactor, widenessFactorTuning) * 1000).toFixed(3);
    }

    calculatePuzzleHash()
    {
        return this.calculateHash(false);
    }

    calculatePuzzleShapeHash()
    {
        return this.calculateHash(true);
    }

    calculateHash(focusOnShape)
    {
        let puzzleStr = this.wordList
            .map(({ word, y, x, horizontal }) => `${focusOnShape ? word.length : word},${y},${x},${horizontal ? 1 : 0}`)
            .sort()
            .join("|");

        let hash = 5381;
        for (let i = 0; i < puzzleStr.length; i++) {
            hash = (hash * 33) ^ puzzleStr.charCodeAt(i);
            hash |= 0; // Force 32-bit integer
        }
        return hash >>> 0; // Convert to unsigned 32-bit integer
    }

    exportPuzzle()
    {
        return this.wordList
            .map(({ word, y, x, horizontal }) => `${word},${y},${x},${horizontal}`)
            .sort()
            .join("|");
    }
}

class PuzzleWordData
{
    constructor(word, y, x, horizontal)
    {
        this.word = word;
        this.y = y;
        this.x = x;
        this.horizontal = horizontal;
    }
}

function getCell(board, boardWidth, y, x)
{
    return board[y * boardWidth + x];
}

function setCell(board, boardWidth, y, x, val)
{
    board[y * boardWidth + x] = val;
}

let currBoardHeight = 0;
let currBoardWidth = 0;
let seenPuzzleHashes = new Set();

function startGeneratingPuzzles(wordList, allowDuplicateShapes)
{
    if (wordList.length === 0)
    {
        return [];
    }

    currBoardHeight = GENERATING_PUZZLE_BOARD_SIZE;
    currBoardWidth = GENERATING_PUZZLE_BOARD_SIZE;
    seenPuzzleHashes.clear();

    let board = Array(currBoardHeight * currBoardWidth);

    let generatedPuzzles = generatePuzzlesInternal(board, wordList);
    generatedPuzzles.sort((a, b) => b.score - a.score);

    if (!allowDuplicateShapes)
    {
        const seenHashes = new Set();
        return generatedPuzzles.filter(puzzle => {
            if (!allowDuplicateShapes)
            {
                if (seenHashes.has(puzzle.puzzleShapeHash))
                    return false;
                seenHashes.add(puzzle.puzzleShapeHash);
            }

            return true;
        });
    }

    return generatedPuzzles;
}

function generatePuzzlesInternal(board, wordList)
{
    let generatedPuzzles = [];

    let boardMidpointY = Math.floor(currBoardHeight / 2);
    let boardMidpointX = Math.floor(currBoardWidth / 2);

    for (let i = 0; i < wordList.length; i++)
    {
        let recurseWordList = wordList.slice(0);
        let word = recurseWordList.splice(i, 1)[0];
        for (let horizontalInt = 0; horizontalInt <= 1; horizontalInt++)
        {
            let horizontal = Boolean(horizontalInt);
            placeWordOnBoard(board, currBoardWidth, word, boardMidpointY, boardMidpointX, horizontal);
            let wordData = new PuzzleWordData(word, boardMidpointY, boardMidpointX, horizontal);
            let puzzleData = [wordData];
            generatePuzzlesWithWord(board, puzzleData, wordData, recurseWordList, generatedPuzzles);
            removeWordFromBoard(board, currBoardWidth, word, boardMidpointY, boardMidpointX, horizontal);
        }
    }

    return generatedPuzzles;
}

function generatePuzzlesWithWord(board, puzzleData, lastWordData, wordList, generatedPuzzles)
{
    if (wordList.length === 0)
    {
        let generatedPuzzle = new PuzzleData(puzzleData);
        if (!seenPuzzleHashes.has(generatedPuzzle.puzzleHash))
        {
            seenPuzzleHashes.add(generatedPuzzle.puzzleHash);
            generatedPuzzles.push(generatedPuzzle);
        }
        return;
    }

    let lastWord = lastWordData.word;
    let newWordHorizontal = !lastWordData.horizontal;
    for (let wordIdx = 0; wordIdx < wordList.length; wordIdx++)
    {
        let word = wordList[wordIdx];
        for (let wordCharIdx = 0; wordCharIdx < word.length; wordCharIdx++)
        {
            let char = word[wordCharIdx];
            for (let lastWordCharIdx = 0; lastWordCharIdx < lastWord.length; lastWordCharIdx++)
            {
                if (lastWord[lastWordCharIdx] === char)
                {
                    let wordOverlapY = lastWordData.y + (lastWordData.horizontal ? 0 : lastWordCharIdx);
                    let wordOverlapX = lastWordData.x + (lastWordData.horizontal ? lastWordCharIdx : 0);
                    let wordStartY = wordOverlapY - (newWordHorizontal ? 0 : wordCharIdx);
                    let wordStartX = wordOverlapX - (newWordHorizontal ? wordCharIdx : 0);

                    let success = tryPlaceWord(board, word, wordStartY, wordStartX, newWordHorizontal, wordOverlapY, wordOverlapX);
                    if (success)
                    {
                        placeWordOnBoard(board, currBoardWidth, word, wordStartY, wordStartX, newWordHorizontal);

                        let newWordData = new PuzzleWordData(word, wordStartY, wordStartX, newWordHorizontal);
                        puzzleData.push(newWordData)

                        // Try adding words to this new word
                        let newWordList = wordList.slice(0);
                        newWordList.splice(wordIdx, 1);
                        generatePuzzlesWithWord(board, puzzleData, newWordData, newWordList, generatedPuzzles);

                        // Now try to continue adding words to the last word
                        generatePuzzlesWithWord(board, puzzleData, lastWordData, newWordList, generatedPuzzles);

                        // Now remove the word to continue iteration
                        puzzleData.pop()
                        removeWordFromBoard(board, currBoardWidth, word, wordStartY, wordStartX, newWordHorizontal, wordOverlapY, wordOverlapX);
                    }
                }
            }
        }
    }
}

function tryPlaceWord(board, word, wordStartY, wordStartX, horizontal, wordOverlapY, wordOverlapX, debug = false)
{
    if ((!horizontal &&
         ((wordOverlapY > 0 && getCell(board, currBoardWidth, wordOverlapY - 1, wordOverlapX) !== undefined) ||
          (wordOverlapY < currBoardHeight - 1 && getCell(board, currBoardWidth, wordOverlapY + 1, wordOverlapX) !== undefined))) ||
        (horizontal &&
         ((wordOverlapX > 0 && getCell(board, currBoardWidth, wordOverlapY, wordOverlapX - 1) !== undefined) ||
          (wordOverlapX < currBoardWidth - 1 && getCell(board, currBoardWidth, wordOverlapY, wordOverlapX + 1) !== undefined))))
    {
        if (debug) console.log('Word could not be placed at y=' + wordStartY + ' x=' + wordStartX + ', word already exists at this overlap point, invalid');
        return false;
    }

    for (let i = 0; i < word.length; i++)
    {
        let y = wordStartY + (horizontal ? 0 : i);
        let x = wordStartX + (horizontal ? i : 0);
        if (y < 0 || y >= currBoardHeight || x < 0 || x >= currBoardWidth)
        {
            if (debug) console.log('Letter could not be placed on y=' + y + ' x=' + x + ', out of bounds, invalid');
            return false;
        }

        // Reject if:
        //  a. We are NOT at the top of the board AND
        //  b. The spot above us is filled UNLESS
        //    i. The spot above us is the overlap (we'd expect this to have a value)

        // Check self (if overlap we expect this to have letters around it)
        if (y === wordOverlapY && x === wordOverlapX)
        {
            continue;
        }
        // If it's not the overlap, ignore it
        else if (getCell(board, currBoardWidth, y, x) !== undefined)
        {
            if (debug) console.log('Letter found on y=' + y + ' x=' + x + ', invalid');
            return false;
        }

        // Check top (ensure top is not the overlap)
        if (y > 0 && getCell(board, currBoardWidth, y - 1, x) !== undefined && !(y - 1 === wordOverlapY && x === wordOverlapX))
        {
            if (debug) console.log('Letter found above y=' + y + ' x=' + x + ', invalid');
            return false;
        }
        // Check bottom (ensure bottom is not the overlap)
        if (y < (currBoardHeight - 1) && getCell(board, currBoardWidth, y + 1, x) !== undefined && !(y + 1 === wordOverlapY && x === wordOverlapX))
        {
            if (debug) console.log('Letter found below y=' + y + ' x=' + x + ', invalid');
            return false;
        }
        // Check left (ensure left is not the overlap)
        if (x > 0 && getCell(board, currBoardWidth, y, x - 1) !== undefined && !(y === wordOverlapY && x - 1 === wordOverlapX))
        {
            if (debug) console.log('Letter found to the left of y=' + y + ' x=' + x + ', invalid');
            return false;
        }
        // Check right (ensure right is not the overlap)
        if (x < (currBoardWidth - 1) && getCell(board, currBoardWidth, y, x + 1) !== undefined && !(y === wordOverlapY && x + 1 === wordOverlapX))
        {
            if (debug) console.log('Letter found to the right of y=' + y + ' x=' + x + ', invalid');
            return false;
        }
    }

    return true;
}

function placeWordOnBoard(board, boardWidth, word, y, x, horizontal)
{
    for (let i = 0; i < word.length; i++)
    {
        if (horizontal)
        {
            setCell(board, boardWidth, y, x + i, word[i]);
        }
        else
        {
            setCell(board, boardWidth, y + i, x, word[i]);
        }
    }
}

function removeWordFromBoard(board, boardWidth, word, startY, startX, horizontal, crossY = undefined, crossX = undefined)
{
    for (let i = 0; i < word.length; i++)
    {
        let y = startY;
        let x = startX;
        if (horizontal)
        {
            x += i;
        }
        else
        {
            y += i;
        }

        if (!(y === crossY && x === crossX))
        {
            setCell(board, boardWidth, y, x, undefined);
        }
    }
}

function debugPrintBoard(board, height, width)
{
    console.log('~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-');
    for (let y = 0; y < height; y++)
    {
        let line = '[';
        for (let x = 0; x < width; x++)
        {
            let val = getCell(board, width, y, x)
            let char = val !== undefined ? val : ' ';
            line += (x > 0 ? ',' : '') + char;
        }
        line += ']';
        console.log(line);
    }
}

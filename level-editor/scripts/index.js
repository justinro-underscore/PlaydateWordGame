let mainWord = '';
let currGeneratedPuzzles = [];
let numShownOptions = 0;
let chosenPuzzleIdx = -1;

function getWords()
{
    let word = document.getElementById('word-to-level').value.toLowerCase();
    if (word.toUpperCase() === mainWord)
    {
        return;
    }

    if (!allWords.includes(word))
    {
        alert('Could not find ' + word);
        return;
    }

    possibleWords = []
    for (let i = 0; i < allWords.length; i++)
    {
        let possibleWord = allWords[i];
        if (word.length < possibleWord.length)
        {
            continue;
        }

        const wordSplitted = word.split("");
        const possibleWordSplitted = possibleWord.split("");
        if (possibleWordSplitted.every(attemptedLetter => {
            const letterIndex = wordSplitted.indexOf(attemptedLetter);
            if(letterIndex > -1){
                wordSplitted.splice(letterIndex, 1);
                return true;
            } else {
                return false
            }
        }))
        {
            possibleWords.push(possibleWord);
        }
    }

    if (possibleWords.length <= 1)
    {
        alert('Could not find any other words');
        return;
    }

    resetAllUI();

    let possibleWordsContainer = document.getElementById('possible-words-container');
    possibleWordsContainer.innerHTML = '';

    possibleWords.sort((a, b) => {
        if (a === word)
            return -1;
        else if (b === word)
            return 1;

        let val = b.length - a.length;
        if (val != 0)
            return val;
        return a.localeCompare(b);
    });

    for (let i = 0; i < possibleWords.length; i++)
    {
        let possibleWord = possibleWords[i];
        let elem = document.createElement('div');
        elem.id = 'word-' + possibleWord;
        elem.classList.add('possible-word')
        if (word.localeCompare(possibleWord) === 0)
        {
            elem.classList.add('word-chosen');
        }
        elem.onclick = function() { chooseWord(possibleWord); };
        elem.innerText = possibleWord.toUpperCase();
        possibleWordsContainer.appendChild(elem);
    }

    mainWord = word.toUpperCase();
    document.getElementById('chosen-words').innerText = 'Chosen words: ' + word.toUpperCase();
}

function chooseWord(word)
{
    let wordElem = document.getElementById('word-' + word);
    if (wordElem.classList.contains('word-chosen'))
    {
        wordElem.classList.remove('word-chosen');
    }
    else
    {
        wordElem.classList.add('word-chosen');
    }

    chosenWords = [];
    wordElems = document.getElementsByClassName('word-chosen');
    for (let i = 0; i < wordElems.length; i++)
    {
        chosenWords.push(wordElems[i].innerHTML);
    }
    document.getElementById('chosen-words').innerText = 'Chosen words: ' + chosenWords.join(', ');
}

function generatePuzzles()
{
    currGeneratedPuzzles = [];
    chosenPuzzleIdx = -1;

    let chosenWords = [];

    let wordElems = document.getElementsByClassName('word-chosen');
    for (let i = 0; i < wordElems.length; i++)
    {
        chosenWords.push(wordElems[i].innerHTML);
    }

    if (chosenWords.length === 0)
    {
        alert('Could not generate puzzles - no words chosen');
        return;
    }

    resetGeneratedPuzzles();

    let allowDuplicateShapes = document.getElementById('allowDuplicateShapes').checked;
    console.log(`Generating puzzles with a word list of size ${chosenWords.length}, allow duplicate shapes: ${allowDuplicateShapes}...`);
    currGeneratedPuzzles = startGeneratingPuzzles(chosenWords, allowDuplicateShapes);
    console.log(`Finished generating puzzles, found ${currGeneratedPuzzles.length} valid configurations`);

    if (currGeneratedPuzzles.length === 0)
    {
        alert('Could not generate any puzzles with those words!');
        return;
    }

    const initOptionsToShow = 50;

    if (currGeneratedPuzzles.length > initOptionsToShow)
    {
        let loadMoreButton = document.createElement('button');
        loadMoreButton.id = 'load-more-button';
        loadMoreButton.onclick = function() { addPuzzleOptions(100); };
        loadMoreButton.innerText = 'SHOW MORE';
        document.getElementById('generated-puzzles').appendChild(loadMoreButton);
    }

    addPuzzleOptions(initOptionsToShow);
}

function addPuzzleOptions(numOptionsToAdd)
{
    numOptionsToAdd = Math.min(currGeneratedPuzzles.length - numShownOptions, numOptionsToAdd);
    if (numOptionsToAdd <= 0)
    {
        return;
    }

    let generatedPuzzlesElem = document.getElementById('generated-puzzles');
    let loadMoreButton = document.getElementById('load-more-button');

    for (let i = numShownOptions; i < numShownOptions + numOptionsToAdd; i++)
    {
        let puzzleOptionElem = document.createElement('div');
        puzzleOptionElem.innerHTML = `Puzzle Option ${i + 1}<br>Score: ${currGeneratedPuzzles[i].score}`;
        puzzleOptionElem.onclick = function() { setChosenPuzzle(i); };
        puzzleOptionElem.classList.add('puzzle-opt');
        puzzleOptionElem.id = `puzzle-opt-${i}`;
        generatedPuzzlesElem.insertBefore(puzzleOptionElem, loadMoreButton);
    }

    numShownOptions += numOptionsToAdd;

    if (loadMoreButton !== null && numShownOptions === currGeneratedPuzzles.length)
    {
        generatedPuzzlesElem.removeChild(loadMoreButton);
    }
}

function setChosenPuzzle(puzzleIdx)
{
    if (chosenPuzzleIdx === puzzleIdx)
    {
        return;
    }

    let puzzleElem;
    if (chosenPuzzleIdx >= 0)
    {
        puzzleElem = document.getElementById(`puzzle-opt-${chosenPuzzleIdx}`);
        puzzleElem.classList.remove('puzzle-opt-chosen');
    }

    puzzleElem = document.getElementById(`puzzle-opt-${puzzleIdx}`);
    puzzleElem.classList.add('puzzle-opt-chosen');

    chosenPuzzleIdx = puzzleIdx;
    presentPuzzle();
}

function presentPuzzle()
{
    if (chosenPuzzleIdx < 0 || currGeneratedPuzzles.length === 0 || chosenPuzzleIdx >= currGeneratedPuzzles.length)
    {
        console.log(`Could not show chosen puzzle ${chosenPuzzleIdx}`);
        return;
    }

    let puzzleDisplayContainerElem = document.getElementById('puzzle-display-container');
    let puzzleDisplayElem = document.getElementById('puzzle-display');
    let puzzleDisplayInfoElem = document.getElementById('puzzle-display-info');
    let exportButtonElem = document.getElementById('puzzle-export');
    let chosenPuzzle = currGeneratedPuzzles[chosenPuzzleIdx];

    // Always add 2 to have a buffer top and bottom
    let necessaryNumColumns = chosenPuzzle.boardWidth + 2;
    let necessaryNumRows = chosenPuzzle.boardHeight + 2;

    let displayWindow = puzzleDisplayContainerElem.getBoundingClientRect();
    let desiredColumnWidth = displayWindow.width / necessaryNumColumns;
    let desiredRowHeight = displayWindow.height / necessaryNumRows;
    let gridSize = Math.min(desiredColumnWidth, desiredRowHeight);

    let numRows = Math.ceil(displayWindow.height / gridSize);
    let numColumns = Math.ceil(displayWindow.width / gridSize);
    // Want to center the puzzle, so if it isn't already centered do that
    if (necessaryNumRows % 2 !== numRows % 2)
    {
        numRows++;
    }
    if (necessaryNumColumns % 2 !== numColumns % 2)
    {
        numColumns++;
    }

    let offsetTop = ((numRows * gridSize) - displayWindow.height) * 0.5;
    let offsetLeft = ((numColumns * gridSize) - displayWindow.width) * 0.5;

    let numOffsetRows = (numRows - chosenPuzzle.boardHeight) * 0.5;
    let numOffsetColumns = (numColumns - chosenPuzzle.boardWidth) * 0.5;

    puzzleDisplayElem.style = `grid-template: repeat(${numRows}, ${gridSize}px) / repeat(${numColumns}, ${gridSize}px); top: -${offsetTop}px; left: -${offsetLeft}px; font-size: ${gridSize * 0.75}px;`;

    puzzleDisplayElem.innerHTML = '';
    for (let y = 0; y < numRows; y++)
    {
        for (let x = 0; x < numColumns; x++)
        {
            let gridCellElem = document.createElement('div');
            gridCellElem.id = `puzzle-display-${y}-${x}`;
            gridCellElem.classList.add('puzzle-grid-item');

            let cellValue = '&nbsp';
            // On the board
            if (y >= numOffsetRows && y < numRows - numOffsetRows && x >= numOffsetColumns && x < numColumns - numOffsetColumns)
            {
                let boardY = y - numOffsetRows;
                let boardX = x - numOffsetColumns;
                let val = getCell(chosenPuzzle.board, chosenPuzzle.boardWidth, boardY, boardX);
                if (val !== undefined)
                {
                    gridCellElem.classList.add('puzzle-grid-item-filled');
                    cellValue = `<p>${val}</p>`;
                }
            }
            gridCellElem.innerHTML = cellValue;

            puzzleDisplayElem.appendChild(gridCellElem);
        }
    }

    puzzleDisplayInfoElem.innerText = `Width: ${chosenPuzzle.boardWidth} | Height: ${chosenPuzzle.boardHeight} | Shape Hash: ${chosenPuzzle.puzzleShapeHash}`;
    puzzleDisplayInfoElem.style = 'display: block';

    exportButtonElem.style = 'display: block';
}

function exportCurrPuzzle()
{
    openPopup();
    console.log(currGeneratedPuzzles[chosenPuzzleIdx]);
}

function resetAllUI()
{
    mainWord = '';

    document.getElementById('possible-words-container').innerHTML = '<div style="padding: 4px">Waiting for words...</div>';
    document.getElementById('chosen-words').innerText = 'Chosen words: ';

    resetGeneratedPuzzles();
}

function resetGeneratedPuzzles()
{
    currGeneratedPuzzles = [];
    numShownOptions = 0;
    chosenPuzzleIdx = -1;

    document.getElementById('generated-puzzles').innerHTML = '';
    let puzzleDisplay = document.getElementById('puzzle-display');
    puzzleDisplay.style = '';
    puzzleDisplay.innerHTML = '';
    let displayInfo = document.getElementById('puzzle-display-info');
    displayInfo.style = '';
    displayInfo.innerHTML = '';
    document.getElementById('puzzle-export').style = '';
}

function openPopup()
{
    if (chosenPuzzleIdx < 0 || chosenPuzzleIdx >= currGeneratedPuzzles.length)
    {
        return;
    }

    let puzzleStrElem = document.getElementById('puzzle-export-str');
    puzzleStrElem.innerText = currGeneratedPuzzles[chosenPuzzleIdx].exportPuzzle();

    document.getElementById(`copy-exported-puzzle`).innerText = 'COPY TO CLIPBOARD';

    document.getElementById("popup-background").classList.remove("popup-background-hidden");
    document.getElementById(`export-popup`).style.display = '';
}

function copyExportedPuzzle()
{
    if (chosenPuzzleIdx < 0 || chosenPuzzleIdx >= currGeneratedPuzzles.length)
    {
        return;
    }

    navigator.clipboard.writeText(currGeneratedPuzzles[chosenPuzzleIdx].exportPuzzle());

    document.getElementById(`copy-exported-puzzle`).innerText = 'COPIED TO CLIPBOARD';
}

function closePopup()
{
    document.getElementById(`export-popup`).style.display = 'none';
    document.getElementById("popup-background").classList.add("popup-background-hidden");
}

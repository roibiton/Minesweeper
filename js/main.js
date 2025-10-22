'use strict'
const MINE = '💣'
const FLAG = '🏳️'

var gLife = 3
var gBoard
var gTimerInterval
var gTimeOut
var gCurrTimerResult
var gIsFirstClick = true

var gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0
}
var gLevel = {
    SIZE: 4,
    MINES: 2
}
var gHighestScores = {
    easyHigh: Infinity,
    mediumHigh: Infinity,
    difficultHigh: Infinity
}

function onInit() {
    gGame.isOn = true
    gGame.markedCount = 0
    gGame.revealedCount = 0
    gGame.secsPassed = 0
    gBoard = createBoard(gLevel.SIZE)
    gLife = 3
    gIsFirstClick = true
    renderBoard()
    // renderHighest()
    renderLives()
}

function createBoard(size) {
    const board = []
    for (var i = 0; i < size; i++) {
        const row = []
        for (var j = 0; j < size; j++) {
            row.push({
                minesAroundCount: 0,
                isRevealed: false,
                isMine: false,
                isMarked: false
            })
        }
        board.push(row)
    }
    return board
}

function renderBoard() {
    var strHTML = ''
    for (var i = 0; i < gBoard.length; i++) {
        strHTML += `<tr class="game-row" >\n`
        for (var j = 0; j < gBoard[0].length; j++) {
            const cell = gBoard[i][j]
            var className = (cell.isRevealed) ? 'revealed' : ''
            var value = (cell.isRevealed) ? cell.minesAroundCount : ''
            if (cell.isMine && cell.isRevealed) value = MINE
            if (!cell.isRevealed && cell.isMarked) value = FLAG
            strHTML += `\t<td data-i="${i}" data-j="${j}"
                            class="cell ${className}" 
                            oncontextmenu="onCellMarked(this,${i},${j},event)"
                            onclick="onCellClicked(this, ${i}, ${j})" >${value}</td>\n`
        }
        strHTML += `</tr>\n`
    }

    const elTable = document.querySelector('.table')
    elTable.innerHTML = strHTML
}

function onCellClicked(elCell, i, j) {
    const cell = gBoard[i][j]
    if (cell.isRevealed || cell.isMarked || gLife <= 0) return

    if (gIsFirstClick) {
        placeMinesExcluding(gBoard, i, j)
        setMinesNegsCount(gBoard)
        gIsFirstClick = false
        // startTimer() 
        renderBoard()
        elCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
    }

    if (cell.isMine) {
        cell.isRevealed = true
        gLife--
        elCell.innerText = MINE
        elCell.classList.add('incorrect-cell')
        gTimeOut = setTimeout(() => {
            elCell.classList.remove('incorrect-cell')
        }, 300)
        renderLives()
        if (gLife === 0) {
            openLoserModal()
        }
    }
    else {
        cell.isRevealed = true
        elCell.innerText = cell.minesAroundCount
        elCell.classList.add('revealed')
        gGame.revealedCount++
    }
    checkGameOver()
}

function onCellMarked(elCell, i, j, ev) {
    ev.preventDefault()
    if (gIsFirstClick) return
    const cell = gBoard[i][j]
    if (cell.isRevealed && !cell.isMine) return

    if (cell.isMarked) {
        cell.isMarked = false
        elCell.innerText = ''
        if (cell.isMine) {
            gGame.markedCount--
            if (cell.isRevealed) {
                elCell.innerText = MINE
            }
        }
    }
    else {
        if (cell.isMine) {
            cell.isMarked = true
            elCell.innerText = FLAG
            gGame.markedCount++
        }
        else {
            cell.isMarked = true
            elCell.innerText = FLAG
        }
    }
    checkGameOver()
}

function placeMinesExcluding(board, excludeI, excludeJ) {
    var mineCount = 0
    var size = board.length
    while (mineCount < gLevel.MINES) {
        var randI = getRandomInt(0, size)
        var randJ = getRandomInt(0, size)
        if (randI === excludeI && randJ === excludeJ) continue
        if (board[randI][randJ].isMine) continue
        board[randI][randJ].isMine = true
        mineCount++
    }
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            const cell = board[i][j]
            cell.minesAroundCount = countMinesAround(board, i, j)
        }
    }
}

function renderLives() {
    const elLives = document.querySelector('.lives-container')
    const elState = document.querySelector('.game-state span')
    let strHtml = ''
    for (var i = 0; i < gLife; i++) {
        strHtml += '❤️'
    }
    for (var i = gLife; i < 3; i++) {
        strHtml += '💔';
    }
    elLives.innerHTML = strHtml
    if (gLife === 2) elState.innerText = 'Careful, mate..'
    if (gLife === 1) elState.innerText = 'last chance!😱'
    if (gLife === 0) elState.innerText = 'U can always try again..'
}

// function startTimer() {
//     var elModal = document.querySelector('.modal h2')
//     var startTime = new Date()
//     gTimerInterval = setInterval(() => {
//         var currTime = new Date()
//         var time = currTime - startTime
//         gCurrTimerResult = (time / 1000)
//         elModal.innerText = `Nice! Took you ${gCurrTimerResult.toFixed(2)} seconds`
//     }, 10)
// }

function checkGameOver() {
    if (gGame.revealedCount === (gLevel.SIZE ** 2 - gLevel.MINES) && gGame.markedCount === gLevel.MINES) {
        openModal()
    }
}

function openModal() {
    // renderHighest()
    const elModal = document.querySelector('.modal')
    elModal.style.opacity = 1
    elModal.style.zIndex = 100
}

function onCloseModal() {
    const elModal = document.querySelector('.modal')
    elModal.style.opacity = 0
    elModal.style.zIndex = -100
    if (gTimerInterval) clearInterval(gTimerInterval)
    onInit()
}

function openLoserModal() {
    const elModal = document.querySelector('.loser-modal')
    elModal.style.opacity = 1
    elModal.style.zIndex = 100
}

function onCloseLoserModal() {
    const elModal = document.querySelector('.loser-modal')
    elModal.style.opacity = 0
    elModal.style.zIndex = -100
    if (gTimerInterval) clearInterval(gTimerInterval)
    onInit()
}



function updateDifficult(elBtn) {
    gLevel.SIZE = +elBtn.dataset.len
    gLevel.MINES = gLevel.SIZE / 2
    gBoard = createBoard(gLevel.SIZE)
    gLife = 3
    onCloseModal()
    renderLives()
}

function countMinesAround(board, rowIdx, colIdx) {
    var count = 0
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (i === rowIdx && j === colIdx) continue
            if (j < 0 || j >= board[0].length) continue
            var currCell = board[i][j]
            if (currCell.isMine) {
                count++
            }
        }
    }
    return count
}

// function highlightAvailableSeatsAround(rowIdx, colIdx) {
//     var board = gCinema
//     for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
//         if (i < 0 || i >= board.length) continue
//         for (var j = colIdx - 1; j <= colIdx + 1; j++) {
//             if (i === rowIdx && j === colIdx) continue
//             if (j < 0 || j >= board[0].length) continue
//             var currCell = board[i][j]
//             if (currCell.isSeat && !currCell.isBooked) {
//                 var elSeat = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
//                 elSeat.classList.add('highlight')
//             }
//         }
//     }
//     setTimeout(() => {
//         for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
//             if (i < 0 || i >= board.length) continue
//             for (var j = colIdx - 1; j <= colIdx + 1; j++) {
//                 if (i === rowIdx && j === colIdx) continue
//                 if (j < 0 || j >= board[0].length) continue
//                 var currCell = board[i][j]
//                 if (currCell.isSeat && !currCell.isBooked) {
//                     var elSeat = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
//                     elSeat.classList.remove('highlight')
//                 }
//             }
//         }
//     }, 2500)
// }

// function renderHighest() {
//     gHighestScores.easyHigh = (gHighestScores.easyHigh === '❓❓❓') ? Infinity : gHighestScores.easyHigh
//     gHighestScores.mediumHigh = (gHighestScores.mediumHigh === '❓❓❓') ? Infinity : gHighestScores.mediumHigh
//     gHighestScores.difficultHigh = (gHighestScores.difficultHigh === '❓❓❓') ? Infinity : gHighestScores.difficultHigh
//     var elScore = document.querySelector('.score-container')
//     if (gLength === gSize.easySize && gCurrTimerResult < gHighestScores.easyHigh) {
//         gHighestScores.easyHigh = gCurrTimerResult
//         gCurrTimerResult = Infinity
//     }
//     if (gLength === gSize.mediumSize && gCurrTimerResult < gHighestScores.mediumHigh) {
//         gHighestScores.mediumHigh = gCurrTimerResult
//         gCurrTimerResult = Infinity
//     }
//     if (gLength === gSize.difficultSize && gCurrTimerResult < gHighestScores.difficultHigh) {
//         gHighestScores.difficultHigh = gCurrTimerResult
//         gCurrTimerResult = Infinity
//     }
//     if (gHighestScores.easyHigh === Infinity) {
//         gHighestScores.easyHigh = '❓❓❓'
//     }
//     if (gHighestScores.mediumHigh === Infinity) {
//         gHighestScores.mediumHigh = '❓❓❓'
//     }
//     if (gHighestScores.difficultHigh === Infinity) {
//         gHighestScores.difficultHigh = '❓❓❓'
//     }
//     elScore.innerHTML = `
//     <div class="score"> 😊: ${gHighestScores.easyHigh}</div>
//     <div class="score"> 😐: ${gHighestScores.mediumHigh}</div>
//     <div class="score"> 😨: ${gHighestScores.difficultHigh}</div>`
// }
'use strict'
const MINE = '💣'
const FLAG = '🏳️'
const HINT_ICON = '💡'
const USED_HINT_ICON = '🌟'

var gBoard
var gTimerInterval
var gTimeOut
var gCurrTimerResult
var gIsFirstClick = true
var gLife = 3
var gHints = 3

var gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0
}
var gLevel = {
    SIZE: 4,
    MINES: 3
}

var gSize = {
    easySize: 4,
    mediumSize: 6,
    difficultSize: 8
}

var gHighestScores = {
    easyHigh: Infinity,
    mediumHigh: Infinity,
    difficultHigh: Infinity
}

function onInit() {
    if (gTimerInterval) clearInterval(gTimerInterval)
    gGame.isOn = true
    gGame.markedCount = 0
    gGame.revealedCount = 0
    gGame.secsPassed = 0
    gBoard = createBoard(gLevel.SIZE)
    gLife = 3
    gIsFirstClick = true
    gHints = 3
    gCurrTimerResult = Infinity
    renderBoard()
    renderHighest()
    renderLives()
    renderHints()
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
                isMarked: false,
                isHinted: false
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
            var value = ''
            if (cell.isMarked && !cell.isRevealed) {
                value = FLAG
            } else {
                var isVisible = cell.isRevealed || cell.isHinted
                if (isVisible) {
                    value = cell.minesAroundCount
                    if (cell.isMine) {
                        value = MINE
                    } else if (!cell.isHinted && value === 0) {
                        value = ''
                    }
                }
            }
            var className = (cell.isRevealed) ? 'revealed' : ''
            if (cell.isHinted && !cell.isRevealed) className += ' hinted'
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
    const elHint = document.querySelector('.hint.clicked')
    if (elHint) {
        elHint.classList.remove('clicked')
        revealNeighborsTemporarily(gBoard, i, j, elCell)
        return
    }
    if (gIsFirstClick) {
        placeRandomMines(gBoard, i, j)
        setMinesNegsCount(gBoard)
        gIsFirstClick = false
        startTimer()
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
        checkGameOver()
    } else {
        cell.isRevealed = true
        gGame.revealedCount++
        if (cell.minesAroundCount === 0) {
            expandShown(gBoard, i, j)
        }
        renderBoard()
        checkGameOver()
    }
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

function expandShown(board, rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            if (i === rowIdx && j === colIdx) continue
            const neighborCell = board[i][j]
            if (neighborCell.isRevealed || neighborCell.isMine || neighborCell.isMarked) continue
            neighborCell.isRevealed = true
            gGame.revealedCount++
            if (neighborCell.minesAroundCount === 0) {
                expandShown(board, i, j)
            }
        }
    }
}

function placeRandomMines(board, excludeI, excludeJ) {
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
    var strHtml = ''
    for (var i = 0; i < gLife; i++) {
        strHtml += '❤️'
    }
    for (var i = gLife; i < 3; i++) {
        strHtml += '💔'
    }
    elLives.innerHTML = strHtml
    if (gLife === 3) elState.innerText = ''
    if (gLife === 2) elState.innerText = 'Careful, mate..'
    if (gLife === 1) elState.innerText = 'last chance!😱'
    if (gLife === 0) elState.innerText = 'U can always try again..'
}

function renderHints() {
    const elHints = document.querySelector('.hints-container')
    var strHtml = ''
    for (var i = 0; i < 3; i++) {
        const isAvailable = i < gHints
        const isClickable = i === (gHints - 1)
        var hintClass = 'hint'
        var onClickAttr = ''
        var icon = HINT_ICON
        if (!isAvailable) {
            hintClass += ' used-hint'
        } else if (isClickable) {
            onClickAttr = `onclick="onHintClicked(this)"`
        }

        strHtml += `<span class="${hintClass}" data-hint-id="${i}" ${onClickAttr}>${icon}</span>`
    }
    elHints.innerHTML = strHtml
}

function onHintClicked(elHint) {
    if (gHints <= 0 || !gGame.isOn) return
    document.querySelectorAll('.hint').forEach(el => {
        if (el !== elHint) {
            el.classList.remove('clicked')
        }
    })
    elHint.classList.toggle('clicked')
}

function revealNeighborsTemporarily(board, rowIdx, colIdx, elCell) {
    const cellsToReveal = []
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= board[0].length) continue
            const cell = board[i][j]
            if (!cell.isRevealed && !cell.isMarked) {
                cell.isHinted = true
                elCell.classList.add('hint')
                cellsToReveal.push(cell)
            }
        }
    }
    gHints--
    renderHints()
    renderBoard()
    setTimeout(() => {
        cellsToReveal.forEach(cell => {
            cell.isHinted = false
            elCell.classList.remove('hint')
        })
        renderBoard()
    }, 1500)
}

function startTimer() {
    var elTimer = document.querySelector('.timer-container')
    var startTime = new Date()
    gTimerInterval = setInterval(() => {
        var currTime = new Date()
        var time = currTime - startTime
        gCurrTimerResult = (time / 1000)
        if (elTimer) {
            elTimer.innerText = gCurrTimerResult.toFixed(2)
        }
    }, 31)
}

function checkGameOver() {
    const nonMineCells = (gLevel.SIZE ** 2) - gLevel.MINES
    if (gGame.revealedCount === nonMineCells && gGame.markedCount === gLevel.MINES) {
        clearInterval(gTimerInterval)
        openModal()
    }
}

function openModal() {
    const finalScore = gCurrTimerResult
    renderHighest()
    const elModal = document.querySelector('.modal')
    const elModalContent = document.querySelector('.modal h2')
    elModalContent.innerText = `You won! Took you ${finalScore.toFixed(2)} seconds 🏆`
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
    clearInterval(gTimerInterval)
    const elModal = document.querySelector('.loser-modal')
    elModal.style.opacity = 1
    elModal.style.zIndex = 100
}

function onCloseLoserModal() {
    const elModal = document.querySelector('.loser-modal')
    elModal.style.opacity = 0
    elModal.style.zIndex = -100
    onInit()
}

function updateDifficult(elBtn) {
    gLevel.SIZE = +elBtn.dataset.len
    gLevel.MINES = gLevel.SIZE/2
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

function getCurrentLevelKey() {
    if (gLevel.SIZE === gSize.easySize) return 'easyHigh'
    if (gLevel.SIZE === gSize.mediumSize) return 'mediumHigh'
    if (gLevel.SIZE === gSize.difficultSize) return 'difficultHigh'
    return null
}

function loadScore(key, gKey) {
    var savedScoreStr = localStorage.getItem(key)
    if (savedScoreStr) {
        gHighestScores[gKey] = parseFloat(savedScoreStr)
    } else {
        gHighestScores[gKey] = Infinity
    }
}

function getDisplayScore(score) {
    return (score === Infinity) ? '❓❓❓' : score.toFixed(2)
}


function renderHighest() {
    loadScore('minesweeper_easy_score', 'easyHigh')
    loadScore('minesweeper_medium_score', 'mediumHigh')
    loadScore('minesweeper_difficult_score', 'difficultHigh')
    var levelKey = getCurrentLevelKey()
    if (gCurrTimerResult && gCurrTimerResult !== Infinity && levelKey) {
        var localStorageKey = 'minesweeper_' + levelKey.replace('High', '_score')
        if (gCurrTimerResult < gHighestScores[levelKey]) {
            gHighestScores[levelKey] = gCurrTimerResult
            localStorage.setItem(localStorageKey, gCurrTimerResult.toFixed(2))
        }
        gCurrTimerResult = Infinity
    }
    var easyDisplay = getDisplayScore(gHighestScores.easyHigh)
    var mediumDisplay = getDisplayScore(gHighestScores.mediumHigh)
    var difficultDisplay = getDisplayScore(gHighestScores.difficultHigh)

    var elScore = document.querySelector('.score-container')
    elScore.innerHTML = `
     <div class="score"> 😇: ${easyDisplay}</div>
     <div class="score"> 😐: ${mediumDisplay}</div>
     <div class="score"> 😈: ${difficultDisplay}</div>`
}

'use strict'
const MINE = '💣'
const FLAG = '🏳️'
const HINT_ICON = '💡'
const LIGHT = '🔆'
const DARK = '🌙'
const HEART_GIF='<img style="width: 25px;" src="gif/red-heart-bumping.gif" alt="">'
const BROKEN_HEART_GIF='<img style="width: 22px;" src="gif/broken-heart.gif" alt="">'

var gBoard
var gTimerInterval
var gTimeOut
var gCurrTimerResult
var gCellClass = 'big-cell'
var gIsFirstClick = true
var gIsDarkMode = true
var gLife = 3
var gHints = 3
var gSafeClicks = 3
var gMega = 1
var gMegaHintState = 0
var gMegaHintCoords = {
    first: null,
    second: null
}
var gIsManualMode = false
var gIsPreConfigured = false
var gGame = {
    isOn: false,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0
}
var gLevel = {
    SIZE: 4,
    MINES: 3,
}

var gSize = {
    easySize: 4,
    mediumSize: 8,
    difficultSize: 12
}

var gHighestScores = {
    easyHigh: Infinity,
    mediumHigh: Infinity,
    difficultHigh: Infinity
}

var gState = {
    previousBoard: [],
    previousLife: [],
    previousIsFirstClick: [],
    previousGame: []
}

function onInit(isManual = false) {
    if (gTimerInterval) clearInterval(gTimerInterval)
    gGame.isOn = true
    gGame.markedCount = 0
    gGame.revealedCount = 0
    gGame.secsPassed = 0
    gBoard = createBoard(gLevel.SIZE)
    gIsFirstClick = true
    gIsPreConfigured = false
    gIsManualMode = isManual
    gLife = 3
    gHints = 3
    gSafeClicks = 3
    gMega = 1
    gMegaHintState = 0
    gMegaHintCoords.first = null
    gMegaHintCoords.second = null
    gCurrTimerResult = Infinity
    document.querySelector('.mega-btn').classList.remove('mega-clicked')
    document.querySelector('.edit-mines-btn').classList.remove('clicked')
    document.querySelector('.mine-count-display').innerText = ``
    if (!gIsManualMode) {
        if (gLevel.SIZE === gSize.easySize) gLevel.MINES = gLevel.SIZE / 2 * 1.5 + 1
        else if (gLevel.SIZE === gSize.mediumSize) gLevel.MINES = gLevel.SIZE / 2 * 1.5 + 1
        else if (gLevel.SIZE === gSize.difficultSize) gLevel.MINES = gLevel.SIZE / 2 * 1.5 + 1
    }
    else {
        gLevel.MINES = 0
        gGame.isOn = false
    }
    renderBoard()
    renderHighest()
    renderLives()
    renderHints()
    renderSafeClicks()
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
            if (gIsManualMode && cell.isMine) {
                value = MINE
            }
            else if (cell.isMarked && !cell.isRevealed) {
                value = FLAG
            }
            else {
                var isVisible = cell.isRevealed || cell.isHinted
                if (isVisible) {
                    value = cell.minesAroundCount
                    if (cell.isMine) {
                        value = MINE
                        if (cell.isMarked) value = FLAG
                    }
                    else if (!cell.isHinted && value === 0) {
                        value = ''
                    }
                }
            }
            var className = (cell.isRevealed) ? 'revealed' : ''
            if (!gIsDarkMode && cell.isRevealed) className += ' light-cell'
            if (cell.isHinted && !cell.isRevealed) className += ' hinted'
            var onClickHandler = gIsManualMode ? `onManualPlaceMine(${i}, ${j})` : `onCellClicked(this, ${i}, ${j})`
            strHTML += `\t<td data-i="${i}" data-j="${j}"
            class="cell ${className} ${gCellClass}" 
            oncontextmenu="onCellMarked(this,${i},${j},event)"
            onclick="${onClickHandler}" >${value}</td>\n`
        }
        strHTML += `</tr>\n`
    }
    const elTable = document.querySelector('.table')
    elTable.innerHTML = strHTML
}

function onCellClicked(elCell, i, j) {
    const cell = gBoard[i][j]
    if (gMegaHintState === 1) {
        gMegaHintCoords.first = { i: i, j: j }
        gMegaHintState = 2
        elCell.classList.add('mega-hint-selected')
        return
    }
    if (gMegaHintState === 2) {
        gMegaHintCoords.second = { i: i, j: j }
        gMegaHintState = 0
        gMega--
        document.querySelector('.mega-btn').classList.remove('mega-clicked')
        revealMegaAreaTemporarily()
        const elFirst = document.querySelector(`[data-i="${gMegaHintCoords.first.i}"][data-j="${gMegaHintCoords.first.j}"]`)
        if (elFirst) elFirst.classList.remove('mega-hint-selected')
        gMegaHintCoords.first = null
        gMegaHintCoords.second = null
        return
    }
    if (cell.isRevealed || cell.isMarked || gLife <= 0 || gIsManualMode) return
    const elHint = document.querySelector('.hint.clicked')
    if (elHint) {
        elHint.classList.remove('clicked')
        revealNeighborsTemporarily(gBoard, i, j, elCell)
        return
    }
    if (gIsFirstClick) {
        saveToState()
        if (gIsPreConfigured) {
            setMinesNegsCount(gBoard)
        } else {
            if (gLevel.MINES > 0) {
                placeRandomMines(gBoard, i, j)
            }
            setMinesNegsCount(gBoard)
        }
        startTimer()
    }
    if (cell.isMine) {
        saveToState()
        cell.isRevealed = true
        gLife--
        elCell.innerText = MINE
        elCell.classList.add('incorrect-cell')
        renderBoard()
        gTimeOut = setTimeout(() => {
            const newElCell = document.querySelector(`[data-i="${i}"][data-j="${j}"]`)
            if (newElCell) {
                newElCell.classList.remove('incorrect-cell')
            }
        }, 300)
        renderLives()
        if (gLife === 0) {
            openLoserModal()
        }
        checkGameOver()
    }
    else {
        if (!gIsFirstClick) {
            saveToState()
        }
        cell.isRevealed = true
        gGame.revealedCount++
        if (cell.minesAroundCount === 0) {
            expandShown(gBoard, i, j)
        }
        renderBoard()
        checkGameOver()
    }
    gIsFirstClick = false
}

function onCellMarked(elCell, i, j, ev) {
    ev.preventDefault()
    if (gIsFirstClick) return
    const cell = gBoard[i][j]
    if (cell.isRevealed && !cell.isMine) return
    if (cell.isMarked) {
        saveToState()
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
            saveToState()
            cell.isMarked = true
            elCell.innerText = FLAG
            gGame.markedCount++
        }
        else {
            saveToState()
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

function onSafeClick(elSafe) {
    if (gSafeClicks <= 0 || !gGame.isOn || gIsFirstClick) return
    const safeCells = []
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            const cell = gBoard[i][j]
            if (!cell.isMine && !cell.isRevealed && !cell.isMarked) {
                safeCells.push({ i: i, j: j })
            }
        }
    }
    if (safeCells.length === 0) return
    const randIdx = getRandomInt(0, safeCells.length)
    const safeCellCoords = safeCells[randIdx]
    const rowIdx = safeCellCoords.i
    const colIdx = safeCellCoords.j
    const elCell = document.querySelector(`[data-i="${rowIdx}"][data-j="${colIdx}"]`)
    if (elCell) {
        elCell.classList.add('safe-cell-highlight')
    }
    gSafeClicks--
    elSafe.innerText = `SAFE: ${gSafeClicks}`
    console.log(`Safe Clicks remaining: ${gSafeClicks}`)
    setTimeout(() => {
        if (elCell) {
            elCell.classList.remove('safe-cell-highlight')
        }
    }, 2000)
}

function renderSafeClicks() {
    const elSafeClickBtn = document.querySelector('.safe-click-btn')
    if (elSafeClickBtn) {
        elSafeClickBtn.innerText = `Safe (${gSafeClicks})`
    }
}

function onUndo() {
    if (gState.previousBoard.length === 0||gIsManualMode||(gGame.revealedCount===0&&gLife===3)) return
    gBoard = gState.previousBoard.pop()
    gLife = gState.previousLife.pop()
    gIsFirstClick = gState.previousIsFirstClick.pop()
    gGame = gState.previousGame.pop()
    if (gIsFirstClick && gTimerInterval) {
        clearInterval(gTimerInterval)
        gHints = 3
        gSafeClicks = 3
        gMega = 1
    }
    renderBoard()
    renderLives()
    renderSafeClicks()
    renderHints()
}

function onMegaHint(elBtn) {
    if ((gMega <= 0 || !gGame.isOn || gIsFirstClick) && !gIsPreConfigured) return
    if (gMegaHintState !== 0) {
        gMegaHintState = 0
        elBtn.classList.remove('mega-clicked')
        gMegaHintCoords.first = null
        gMegaHintCoords.second = null
        return
    }
    gMegaHintState = 1
    elBtn.classList.toggle('mega-clicked')
}

function revealMegaAreaTemporarily() {
    const { first, second } = gMegaHintCoords
    const startRow = Math.min(first.i, second.i)
    const endRow = Math.max(first.i, second.i)
    const startCol = Math.min(first.j, second.j)
    const endCol = Math.max(first.j, second.j)
    const cellsToReveal = []
    for (let i = startRow; i <= endRow; i++) {
        for (let j = startCol; j <= endCol; j++) {
            const cell = gBoard[i][j]
            if (!cell.isRevealed && !cell.isMarked) {
                cell.isHinted = true
                cellsToReveal.push(cell)
            }
        }
    }
    renderBoard()
    setTimeout(() => {
        cellsToReveal.forEach(cell => {
            cell.isHinted = false
        })
        renderBoard()
    }, 2000)
}

function onToggleMode() {
    gIsDarkMode = !gIsDarkMode
    var elBody = document.querySelector('body')
    elBody.classList.toggle('light-body')
    var elBtns = document.querySelectorAll('button', '.score')
    for (var i = 0; i < elBtns.length; i++) {
        var elBtn = elBtns[i]
        if (elBtn.classList.contains('light-body')) {
            elBtn.classList.remove('light-body')
        }
        else elBtn.classList.add('light-body')
    }
    if (gIsDarkMode) {
        var elToggleBtnTxt = document.querySelector('.toggle-mode-btn span')
        elToggleBtnTxt.innerText = LIGHT
        elToggleBtnTxt.classList.remove('toggle-mode-btn-txt')
    }
    else {
        var elToggleBtnTxt = document.querySelector('.toggle-mode-btn span')
        elToggleBtnTxt.innerText = DARK
        elToggleBtnTxt.classList.add('toggle-mode-btn-txt')
    }
    renderBoard()
}

function onManualPlaceMine( i, j) {
    if (!gIsManualMode) return

    const cell = gBoard[i][j]
    const elMineCount = document.querySelector('.mine-count-display')

    if (cell.isMine) {
        cell.isMine = false
        gLevel.MINES--
    }
    else {
        cell.isMine = true
        gLevel.MINES++
    }
    elMineCount.innerText = `Mines: ${gLevel.MINES}`
    renderBoard()
}

function onEditMines(elBtn) {
    const elMineCount = document.querySelector('.mine-count-display')
    if (gIsManualMode) {
        gIsManualMode = false
        elBtn.classList.remove('clicked')
        elMineCount.innerText = `Mines: ${gLevel.MINES}`
        if (gLevel.MINES > 0) {
            gGame.isOn = true
            gIsPreConfigured = true
            renderBoard()
        }
        else {
            onInit()
        }
    }
    else {
        gLevel.MINES = 0
        onInit(true)
        elBtn.classList.add('clicked')
        elMineCount.innerText = ``
        gIsPreConfigured = false
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
        strHtml += `${HEART_GIF}`
    }
    for (var i = gLife; i < 3; i++) {
        strHtml += `${BROKEN_HEART_GIF}`
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
        }
        else if (isClickable) {
            onClickAttr = `onclick="onHintClicked(this)"`
        }
        strHtml += `<span class="${hintClass}" data-hint-id="${i}" ${onClickAttr}>${icon}</span>`
    }
    elHints.innerHTML = strHtml
}

function onHintClicked(elHint) {
    if (gHints <= 0 || !gGame.isOn || gIsFirstClick) return
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

function saveToState() {
    gState.previousBoard.push(JSON.parse(JSON.stringify(gBoard)))
    gState.previousGame.push(JSON.parse(JSON.stringify(gGame)))
    gState.previousLife.push(gLife)
    gState.previousIsFirstClick.push(gIsFirstClick)
}

function openModal() {
    gState.previousBoard = []
    gState.previousLife = []
    gState.previousGame = []
    gState.previousIsFirstClick = []
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
    gState.previousBoard = []
    gState.previousLife = []
    gState.previousGame = []
    gState.previousIsFirstClick = []
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
    gLevel.MINES = gLevel.SIZE / 2 * 1.5 + 1
    if (gLevel.SIZE === gSize.easySize) gCellClass = 'big-cell'
    if (gLevel.SIZE === gSize.mediumSize) gCellClass = 'medium-cell'
    if (gLevel.SIZE === gSize.difficultSize) gCellClass = 'small-cell'
    gBoard = createBoard(gLevel.SIZE)
    gLife = 3
    onCloseModal()
    onCloseLoserModal()
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
    }
    else {
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

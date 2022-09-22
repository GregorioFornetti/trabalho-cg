
// Todas funções que modificam o HTML em si

function setScore(newScore) {
	let scoreElement = document.getElementById('score')
	scoreElement.innerText = `Pontuação: ${newScore}`
	score = newScore
}

function setLevel(newLevel) {
	let levelElement = document.getElementById('level')
	levelElement.innerText = `Nível: ${newLevel}`
	level = newLevel
}

function hideGameOver() {
	const gameover = document.querySelector('.gameover');
	gameover.style.cssText = 'visibility: hidden;'
}

function showGameOver() {
	const gameover = document.querySelector('.gameover');
	gameover.style.cssText = 'visibility: visible;'
}
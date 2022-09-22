

function moveFunction(movementType) {
	currentMovement = movementType
}

document.addEventListener ('keypress', (event) => {
    // Binds das teclas do teclado com o movimento da cobra

	const keyName = event.key;

	if (keyName === 'w') {
		if(movementList[0] != BACK){
			moveFunction(FOWARD)
		}
	} else if (keyName === 'a') {
		if(movementList[0] != RIGHT){
			moveFunction(LEFT)
		}
	} else if (keyName === 's') {
		if(movementList[0] != FOWARD){
			moveFunction(BACK)
		}
	} else if (keyName === 'd') {
		if(movementList[0] != LEFT){
			moveFunction(RIGHT)
		}
	}
})

document.addEventListener('DOMContentLoaded', () => {
    // Binds dos botões HTML com o movimento da cobra
    
    let fowardBtn = document.getElementById('move_foward')
	let backBtn = document.getElementById('move_back')
	let leftBtn = document.getElementById('move_left')
	let rightBtn = document.getElementById('move_right')

	fowardBtn.addEventListener('click', () => {
		if(movementList[0] != BACK)
			moveFunction(FOWARD)
	})
	backBtn.addEventListener('click', () => {
		if(movementList[0] != FOWARD)
			moveFunction(BACK)
	})
	leftBtn.addEventListener('click', () => {
		if(movementList[0] != RIGHT)
			moveFunction(LEFT)
	})
	rightBtn.addEventListener('click', () => {
		if(movementList[0] != LEFT)
			moveFunction(RIGHT)
	})
})
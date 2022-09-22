
function restartGame() {
	scene.objs = [vec3(0, 0, 0)]
	movementList = [currentMovement]
	setNewApplePosition()
	gameStoped = false
	animationSpeed = INITIAL_SPEED
	setScore(0)
	setLevel(1)
	ctnLevel = 5
	hideGameOver()
	requestAnimationFrame(gameTick)
}

function addSnakeBody() {
	var lastBody = scene.objs[scene.objs.length - 1]
	var lastBodyMovement = movementList[scene.objs.length - 1] // captura o ultimo movimento da cauda

	if(lastBodyMovement == FOWARD){
		scene.objs.push(vec3(lastBody[0], lastBody[1], lastBody[2] + 1))
	}
	if(lastBodyMovement == RIGHT){
		scene.objs.push(vec3(lastBody[0] - 1, lastBody[1], lastBody[2]))
	}
	if(lastBodyMovement == LEFT){
		scene.objs.push(vec3(lastBody[0] + 1, lastBody[1], lastBody[2]))
	}
	if(lastBodyMovement == BACK){
		scene.objs.push(vec3(lastBody[0], lastBody[1], lastBody[2] - 1))
	}
	movementList.push(lastBodyMovement)
}


function gameTick(time) {
	if (gameStoped) {
		return
	}

	time = time * 0.001;  // convert to seconds

	if (!animationStartTime) {
		animationStartTime = time
	}

	let currentAngle = Math.min(90, (time - animationStartTime) * animationSpeed)

	if (currentAngle === 90) {
		startNextMovement()
	} else {
		render(currentAngle)
	}
	requestAnimationFrame(gameTick);
}

function updateLevel() {
	var sc = score % ctnLevel
	if (sc === 0){
		animationSpeed  = animationSpeed * 1.2
		setLevel(level + 1)
		ctnLevel += 5
	}
}

function startNextMovement() {
	animationStartTime = null

	updateObjsPosition()
	if (isGameover()) {
		showGameOver()
		gameStoped = true
		return
	}
	updateMovementList()
	updateTeleportObjs()

	if (isAppleEaten()) {
		addSnakeBody()
		setNewApplePosition()
		setScore(score + 1)
		updateLevel()
		
	}
}

function updateObjsPosition() {
	// Atualiza as posições de cada parte da cobra dependendo do movimento que essa parte realizou
	// Essa atualização é depois do movimento ser realizado (animação de rotação do cubo), para que os
	// objetos fiquem nas suas novas reais posições
	// Lembrando que se objeto sair da grid, ele "teleportará" para o lado inverso

	for (let i = 0; i < scene.objs.length; i++) {
		let obj = scene.objs[i]
		let objMovement = movementList[i]

		if (objMovement == FOWARD) {
			if (obj[2] <= -GRID_SIZE) {
				obj[2] = GRID_SIZE
			}
			else {
				obj[2] -= 1
			}
		} else if (objMovement == BACK) {
			if (obj[2] >= GRID_SIZE) {  
				obj[2] = -GRID_SIZE
			}
			else {
				obj[2] += 1
			}
		} else if (objMovement == LEFT) {
			if (obj[0] <= -GRID_SIZE) {
				obj[0] = GRID_SIZE
			}
			else {
				obj[0] -= 1
			}
		} else {
			if (obj[0] >= GRID_SIZE) {
				obj[0] = -GRID_SIZE
			}
			else {
				obj[0] += 1
			}
		}
	}
}

function updateMovementList() {
	movementList.pop()
	movementList.unshift(currentMovement)
}

function updateTeleportObjs() {
	// Adiciona objetos no lado inverso da grid para dar um efeito de teleporte (caso o objeto atual irá sair da grid)
	// OBS: essa função deve ser chamada após atualizar as posições dos objetos e suas listas de movimentos já estiverem atualizadas,
	// pois essa função "irá prever o futuro" para colocar os objetos de teleporte nas posições corretas

	// Limpa as informações antigas dos objetos de teleporte
	scene.teleportObjs = []
	teleportAnimationMovementList = []

	// Adiciona os novos objetos de teleporte, para o novo movimento
	for (let i = 0; i < scene.objs.length; i++) {
		let obj = scene.objs[i]
		let objMovement = movementList[i]

		if (objMovement == FOWARD && obj[2] <= -GRID_SIZE) {  // deve ter um teleporte para a parte de trás
			scene.teleportObjs.push({bodyNumber: i, position: vec3(obj[0], obj[1], GRID_SIZE + 1)})
			teleportAnimationMovementList.push(FOWARD)
		}
		else if (objMovement == BACK && obj[2] >= GRID_SIZE) {  // Deve ter um teleporte para a parte da frente
			scene.teleportObjs.push({bodyNumber: i, position: vec3(obj[0], obj[1], -GRID_SIZE - 1)})
			teleportAnimationMovementList.push(BACK)
		}
		else if (objMovement == LEFT && obj[0] <= -GRID_SIZE) {  // Deve ter um teleporte para a parte da direita
			scene.teleportObjs.push({bodyNumber: i, position: vec3(GRID_SIZE + 1, obj[1], obj[2])})
			teleportAnimationMovementList.push(LEFT)
		}
		else if (objMovement == RIGHT && obj[0] >= GRID_SIZE) {  // Deve ter um telepor para a parte da esquerda
			scene.teleportObjs.push({bodyNumber: i, position: vec3(-GRID_SIZE - 1, obj[1], obj[2])})
			teleportAnimationMovementList.push(RIGHT)
		}
	}
}

function setNewApplePosition() {
	// Retorna uma posição aleatória e disponível(sem nenhuma parte da cobra)

	// Coletando todas as posições disponíveis
	let possible_positions = []
	for (let i = -CUBE_SIZE; i <= CUBE_SIZE; i++) {
		for (let j = -CUBE_SIZE; j <= CUBE_SIZE; j++) {
			if (!scene.objs.some((obj) => (obj[0] == i && obj[2] == j))) {
				possible_positions.push(vec3(i, 0, j))
			}
		}
	}

	scene.apple = possible_positions[Math.floor(Math.random() * possible_positions.length)]
}

function isAppleEaten() {
	// A maçã é considerada comida, se a cabeça da cobra estiver na mesma posição que a maçã
	let apple = scene.apple
	let snake_head = scene.objs[0]

	return isSamePosition(apple, snake_head)
}

function isGameover() {
	// O jogo acaba quando a cabeça da cobra colide com outra parte do corpo da cobra
	let snake_head = scene.objs[0]

	for (let i = 1; i < scene.objs.length; i++) {
		if (isSamePosition(snake_head, scene.objs[i])) {
			return true
		}
	}
	return false
}
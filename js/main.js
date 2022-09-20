"use strict";

const GRID_SIZE = 5  // Largura e altura da grid será GRID_SIZE * 2 + 1, para sempre ficar centralizado a primeira parte da cobra
const CUBE_SIZE = 2
const INITIAL_SPEED = 100

const BACK = 0
const FOWARD = 1
const LEFT = 2
const RIGHT = 3

const HEAD_COLOR = [0, 1, 0, 1]
const BODY_COLOR = [0, 0.9, 0, 1]
const APPLE_COLOR = [1, 0, 0, 1]


var gl;
var program;
var model;
var scene;

var score = 0
var currentMovement = RIGHT
var gameStoped = true

var movement_functions = []
var animation_start_time
var animation_speed = INITIAL_SPEED  // Graus por segundo
var movement_list = []
var move_cubes_buttons
var level = 1 // nivel de dificuldade
var ctn_level = 5 // aumento de nivel 

var teleport_animation_movement_list = []  // Lista de movimentos dos cubos que sairam da grid

document.addEventListener ('keypress', (event) => {
	const keyName = event.key;

	if (keyName === 'w') {
		if(movement_list[0] != BACK){
			move_function(FOWARD)
		}
	} else if (keyName === 'a') {
		if(movement_list[0] != RIGHT){
			move_function(LEFT)
		}
	} else if (keyName === 's') {
		if(movement_list[0] != FOWARD){
			move_function(BACK)
		}
	} else if (keyName === 'd') {
		if(movement_list[0] != LEFT){
			move_function(RIGHT)
		}
	}
})

document.addEventListener('DOMContentLoaded', () => {
	let foward_btn = document.getElementById('move_foward')
	let back_btn = document.getElementById('move_back')
	let left_btn = document.getElementById('move_left')
	let right_btn = document.getElementById('move_right')

	move_cubes_buttons = [foward_btn, back_btn, left_btn, right_btn]

	foward_btn.addEventListener('click', () => move_function(FOWARD))
	back_btn.addEventListener('click', () => move_function(BACK))
	left_btn.addEventListener('click', () => move_function(LEFT))
	right_btn.addEventListener('click', () => move_function(RIGHT))

	let start_game_btn = document.getElementById('start_game')
	start_game_btn.addEventListener('click', () => restartGame())
})

function setScore(newScore) {
	let score_element = document.getElementById('score')
	score_element.innerText = `Pontuação: ${newScore}`
	score = newScore
}

function setLevel(newLevel) {
	let level_element = document.getElementById('level')
	level_element.innerText = `Nível: ${newLevel}`
	level = newLevel
	
}

function move_function(movement_type) {
	currentMovement = movement_type
}


window.onload = function init() {

	movement_functions[FOWARD] = moveFoward
	movement_functions[BACK] = moveBack
	movement_functions[LEFT] = moveLeft
	movement_functions[RIGHT] = moveRight

	// Get A WebGL context
	var canvas = document.getElementById("gl-canvas");
	gl = canvas.getContext("webgl2");
	if (!gl) {
		alert("WebGL 2.0 isn't available");
		return;
	}

	program = initShaders(gl, 'shaders/vertex.glsl', 'shaders/fragment.glsl');

	model = loadModel(); 

	scene = loadScene(model);
}

function restartGame() {
	scene.objs = [vec3(0, 0, 0)]
	movement_list = [currentMovement]
	set_new_apple_position()
	gameStoped = false
	animation_speed = INITIAL_SPEED
	setScore(0)
	setLevel(1)
	ctn_level = 5
	hideGameOver()
	requestAnimationFrame(render_movement)
}

function loadScene(model) { // list of objects

	// for all models
	const extents = getExtents(model.geometry.position);
	const range = m4.subtractVectors(extents.max, extents.min);
	// amount to move the object so its center is at the origin
	const objOffset = m4.scaleVector(m4.addVectors(extents.min,
		m4.scaleVector(range, 0.5)), -1);
	var u_obj = m4.translation(...objOffset);
	

	const cameraTarget = [0, 0, 0];
	const radius = 20;
	const cameraPosition = m4.addVectors(cameraTarget, [
		0,
		20,
		3,
	]);

	const zNear = radius / 100;
	const zFar = radius * 3;

	const fieldOfViewRadians = degToRad(60);
	const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
	const projection = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

	const up = [0, 1, 0];
	// Compute the camera's matrix using look at.
	const camera = m4.lookAt(cameraPosition, cameraTarget, up);

	// Make a view matrix from the camera matrix.
	const view = m4.inverse(camera);
	const light = m4.normalize([-1, 3, 5]);

	var projectionLocation = gl.getUniformLocation(program, "u_projection");
	var viewLocation = gl.getUniformLocation(program, "u_view");
	var worldObjLocation = gl.getUniformLocation(program, "u_world");
	var lightLocation = gl.getUniformLocation(program, "u_lightDirection");
	var diffuse = gl.getUniformLocation(program, "u_diffuse")
	
	return {

		// Objects
		obj_offset: u_obj, 
		objs: [vec3(0,0,0)],  // objs é uma lista de posições de cada parte da cobra
		teleportObjs: [],  // é uma lista de dicionarios, sendo: {head: (0 ou 1 dependendo se é a cabeça ou não), position: posição da parte da cobra para teleporte}
		apple: null,
		worldObjLocation,

		u_diffuse: diffuse,

		// Light
		u_lightDirection: light, lightLocation,

		// Camera
		u_view: view,
		u_projection: projection,
		projectionLocation, viewLocation,
	};
}

function loadModel() {
	var geometry = parseOBJ(loadFileAJAX('models/cube.obj'));

	var vao = gl.createVertexArray();
	gl.bindVertexArray(vao);

	var positionLocation = gl.getAttribLocation(program, "a_position");
	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(geometry.position), gl.STATIC_DRAW);
	gl.enableVertexAttribArray(positionLocation);
	gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

	var colorLocation = gl.getAttribLocation(program, "a_color");
	var colorBuffer = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(geometry.texcoord), gl.STATIC_DRAW);
	gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(colorLocation);

	var normalLocation = gl.getAttribLocation(program, "a_normal");
	var normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(geometry.normal), gl.STATIC_DRAW);
	gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(normalLocation);

	return {
		geometry,
		positionLocation, colorLocation, normalLocation, vao,
	};
}

function render(angle) {

	resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	gl.useProgram(program);

	gl.uniform3fv(scene.lightLocation, scene.u_lightDirection);
	gl.uniformMatrix4fv(scene.viewLocation, false, scene.u_view);
	gl.uniformMatrix4fv(scene.projectionLocation, false, scene.u_projection);
	gl.bindVertexArray(model.vao);

	// Renderiza maçã
	let u_world = m4.translation(CUBE_SIZE * scene.apple[0], CUBE_SIZE * scene.apple[1], CUBE_SIZE * scene.apple[2])
	gl.uniformMatrix4fv(scene.worldObjLocation, false, u_world)
	gl.uniform4fv(scene.u_diffuse, APPLE_COLOR)
	gl.drawArrays(gl.TRIANGLES, 0, model.geometry.position.length / 3)

	// Renderiza as partes da cobra
	for (let i = 0; i < scene.objs.length; i++) {
		let obj = scene.objs[i]
		let objMovement = movement_list[i]
		let u_world = movement_functions[objMovement](angle, scene.obj_offset) // Rotação do objeto
		u_world = m4.multiply(m4.translation(CUBE_SIZE * obj[0], CUBE_SIZE * obj[1], CUBE_SIZE * obj[2]), u_world)  // Translação do objeto

		if (i == 0) {
			gl.uniform4fv(scene.u_diffuse, HEAD_COLOR) // Cor da cabeca da cobra
		} else {
			gl.uniform4fv(scene.u_diffuse, BODY_COLOR) // Cor do corpo da cobra
		}
		gl.uniformMatrix4fv(scene.worldObjLocation, false, u_world);
		gl.drawArrays(gl.TRIANGLES, 0, model.geometry.position.length / 3)
	}

	// Renderiza os objetos de teleporte
	for (let i = 0; i < scene.teleportObjs.length; i++) {
		let obj = scene.teleportObjs[i]
		let objMovement = teleport_animation_movement_list[i]
		let u_world = movement_functions[objMovement](angle, scene.obj_offset)  // Rotação do objeto
		u_world = m4.multiply(m4.translation(CUBE_SIZE * obj.position[0], CUBE_SIZE * obj.position[1], CUBE_SIZE * obj.position[2]), u_world)  // Translação do objeto

		if (obj.head) {
			gl.uniform4fv(scene.u_diffuse, HEAD_COLOR) // Cor da cabeca da cobra
		} else {
			gl.uniform4fv(scene.u_diffuse, BODY_COLOR) // Cor do corpo da cobra
		}
		gl.uniformMatrix4fv(scene.worldObjLocation, false, u_world);
		gl.drawArrays(gl.TRIANGLES, 0, model.geometry.position.length / 3)
	}
}

function moveFoward(angle, obj) {
	let objTransladado = m4.translation(1, 1, 1, obj)
	
	let objRotacionado = m4.multiply(m4.xRotation(degToRad(-angle)), objTransladado)
	
	return m4.multiply(m4.translation(-1, -1, -1), objRotacionado)
}

function moveBack(angle, obj) {
	let objTransladado = m4.translation(-1, 1, -1, obj)  // Posiciona o objeto na posicao correta de ancora
	
	let objRotacionado = m4.multiply(m4.xRotation(degToRad(angle)), objTransladado)  // Rotaciona o objeto
	
	return m4.multiply(m4.translation(1, -1, 1), objRotacionado)  // Volta o objeto para a posic original
}

function moveRight(angle, obj) {
	let objTransladado = m4.translation(-1, 1, -1, obj)

	let objRotacionado = m4.multiply(m4.zRotation(degToRad(-angle)), objTransladado)

	return m4.multiply(m4.translation(1, -1, 1), objRotacionado)
}

function moveLeft(angle, obj) {
	let objTransladado = m4.translation(1, 1, 1, obj)

	let objRotacionado = m4.multiply(m4.zRotation(degToRad(angle)), objTransladado)

	return m4.multiply(m4.translation(-1, -1, -1), objRotacionado)
}

function addSnakeBody() {
	var lastBody = scene.objs[scene.objs.length - 1]
	var lastBodyMovement = movement_list[scene.objs.length - 1] // captura o ultimo movimento da cauda

	if(lastBodyMovement == FOWARD){
		scene.objs.push(vec3(lastBody[0], lastBody[1], lastBody[2] - 1))
		
	}
	if(lastBodyMovement == RIGHT){
		scene.objs.push(vec3(lastBody[0] - 1, lastBody[1], lastBody[2]))
	}
	if(lastBodyMovement == LEFT){
		scene.objs.push(vec3(lastBody[0] + 1, lastBody[1], lastBody[2]))
	}
	if(lastBodyMovement == BACK){
		scene.objs.push(vec3(lastBody[0], lastBody[1], lastBody[2] + 1))
	}
	movement_list.push(lastBodyMovement)
}


function render_movement(time) {
	if (gameStoped) {
		return
	}

	time = time * 0.001;  // convert to seconds

	if (!animation_start_time) {
		animation_start_time = time
	}

	let current_angle = Math.min(90, (time - animation_start_time) * animation_speed)

	if (current_angle === 90) {
		start_next_movement()
	} else {
		render(current_angle)
	}
	requestAnimationFrame(render_movement);
}
function update_level(){
	var sc = score % ctn_level
	if (sc === 0){
		animation_speed  = animation_speed * 1.2
		setLevel(level + 1)
		ctn_level += 5
	}
}

function start_next_movement() {
	animation_start_time = null

	updateObjsPosition()
	if (isGameover()) {
		showGameOver()
		gameStoped = true
		return
	}
	update_movement_list()
	update_teleport_objs()

	if (is_apple_eaten()) {
		addSnakeBody()
		set_new_apple_position()
		setScore(score + 1)
		update_level()
		
	}
}

function updateObjsPosition() {
	// Atualiza as posições de cada parte da cobra dependendo do movimento que essa parte realizou
	// Essa atualização é depois do movimento ser realizado (animação de rotação do cubo), para que os
	// objetos fiquem nas suas novas reais posições
	// Lembrando que se objeto sair da grid, ele "teleportará" para o lado inverso

	for (let i = 0; i < scene.objs.length; i++) {
		let obj = scene.objs[i]
		let objMovement = movement_list[i]

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

function update_movement_list() {
	movement_list.pop()
	movement_list.unshift(currentMovement)
}

function update_teleport_objs() {
	// Adiciona objetos no lado inverso da grid para dar um efeito de teleporte (caso o objeto atual irá sair da grid)
	// OBS: essa função deve ser chamada após atualizar as posições dos objetos e suas listas de movimentos já estiverem atualizadas,
	// pois essa função "irá prever o futuro" para colocar os objetos de teleporte nas posições corretas

	// Limpa as informações antigas dos objetos de teleporte
	scene.teleportObjs = []
	teleport_animation_movement_list = []

	// Adiciona os novos objetos de teleporte, para o novo movimento
	for (let i = 0; i < scene.objs.length; i++) {
		let obj = scene.objs[i]
		let objMovement = movement_list[i]

		if (objMovement == FOWARD && obj[2] >= GRID_SIZE) {  // deve ter um teleporte para a parte de trás
			scene.teleportObjs.push({head: i == 0, position: vec3(obj[0], obj[1], GRID_SIZE + 1)})
			teleport_animation_movement_list.push(FOWARD)
		}
		else if (objMovement == BACK && obj[2] <= -GRID_SIZE) {  // Deve ter um teleporte para a parte da frente
			scene.teleportObjs.push({head: i == 0, position: vec3(obj[0], obj[1], -GRID_SIZE - 1)})
			teleport_animation_movement_list.push(BACK)
		}
		else if (objMovement == LEFT && obj[0] <= -GRID_SIZE) {  // Deve ter um teleporte para a parte da direita
			scene.teleportObjs.push({head: i == 0, position: vec3(GRID_SIZE + 1, obj[1], obj[2])})
			teleport_animation_movement_list.push(LEFT)
		}
		else if (objMovement == RIGHT && obj[0] >= GRID_SIZE) {  // Deve ter um telepor para a parte da esquerda
			scene.teleportObjs.push({head: i == 0, position: vec3(-GRID_SIZE - 1, obj[1], obj[2])})
			teleport_animation_movement_list.push(RIGHT)
		}
	}
}

function set_new_apple_position() {
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

function is_same_position(pos1, pos2) {
	return pos1[0] === pos2[0] && pos1[1] === pos2[1] && pos1[2] === pos2[2]
}

function is_apple_eaten() {
	// A maçã é considerada comida, se a cabeça da cobra estiver na mesma posição que a maçã
	let apple = scene.apple
	let snake_head = scene.objs[0]

	return is_same_position(apple, snake_head)
}

function isGameover() {
	// O jogo acaba quando a cabeça da cobra colide com outra parte do corpo da cobra
	let snake_head = scene.objs[0]

	for (let i = 1; i < scene.objs.length; i++) {
		if (is_same_position(snake_head, scene.objs[i])) {
			return true
		}
	}
	return false
}


function getExtents(positions) {
	const min = positions.slice(0, 3);
	const max = positions.slice(0, 3);
	for (let i = 3; i < positions.length; i += 3) {
		for (let j = 0; j < 3; ++j) {
			const v = positions[i + j];
			min[j] = Math.min(v, min[j]);
			max[j] = Math.max(v, max[j]);
		}
	}
	return { min, max };
}

function resizeCanvasToDisplaySize(canvas) {
	// Lookup the size the browser is displaying the canvas in CSS pixels.
	const displayWidth = canvas.clientWidth;
	const displayHeight = canvas.clientHeight;

	// Check if the canvas is not the same size.
	const needResize = canvas.width !== displayWidth ||
		canvas.height !== displayHeight;

	if (needResize) {
		// Make the canvas the same size
		canvas.width = displayWidth;
		canvas.height = displayHeight;
	}

	return needResize;
}

function degToRad(deg) {
	return deg * Math.PI / 180;
}

function hideGameOver() {
	const gameover = document.querySelector('.gameover');
	gameover.style.cssText = 'visibility: hidden;'
}

function showGameOver() {
	const gameover = document.querySelector('.gameover');
	gameover.style.cssText = 'visibility: visible;'
}
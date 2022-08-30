"use strict";

const GRID_SIZE = 5  // Largura e altura da grid será GRID_SIZE * 2 + 1, para sempre ficar centralizado a primeira parte da cobra
const CUBE_SIZE = 2
const FOWARD = 0
const BACK = 1
const LEFT = 2
const RIGHT = 3

var gl;
var program;
var model;
var scene;

var current_movement

var movement_functions = []
var animation_start_time
var animation_speed = 90  // Graus por segundo
var movement_list = []
var move_cubes_buttons

var teleport_animation_movement_list = []  // Lista de movimentos dos cubos que sairam da grid

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
})

function move_function(movement_type) {
	movement_list.unshift(movement_type)
	disable_cube_movement_btns()
	update_teleport_objs()
	requestAnimationFrame(render_movement)
}

function enable_cube_movement_btns() {
	move_cubes_buttons.forEach((btn) => btn.disabled = false)
}

function disable_cube_movement_btns() {
	move_cubes_buttons.forEach((btn) => btn.disabled = true)
}


window.onload = function init() {

	movement_functions[FOWARD] = move_foward
	movement_functions[BACK] = move_back
	movement_functions[LEFT] = move_left
	movement_functions[RIGHT] = move_right

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

	movement_list.push(0)  // para mostrar algo na tela inicialmente, precisa ter algo no vetor
	render(0)
	movement_list.pop()
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
		5,
		radius,
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

	// Renderiza as partes da cobra
	for (let i = 0; i < scene.objs.length; i++) {
		let obj = scene.objs[i]
		let obj_movement = movement_list[i]
		let u_world = movement_functions[obj_movement](angle, scene.obj_offset) // Rotação do objeto
		u_world = m4.multiply(m4.translation(CUBE_SIZE * obj[0], CUBE_SIZE * obj[1], CUBE_SIZE * obj[2]), u_world)  // Translação do objeto

		if (i == 0) {
			gl.uniform4fv(scene.u_diffuse, [0, 1, 0, 1]) // Cor da cabeca da cobra
		} else {
			gl.uniform4fv(scene.u_diffuse, [0, 0.9, 0, 1]) // Cor do corpo da cobra
		}
		gl.uniformMatrix4fv(scene.worldObjLocation, false, u_world);
		gl.drawArrays(gl.TRIANGLES, 0, model.geometry.position.length / 3)
	}

	// Renderiza os objetos de teleporte
	for (let i = 0; i < scene.teleportObjs.length; i++) {
		let obj = scene.teleportObjs[i]
		let obj_movement = teleport_animation_movement_list[i]
		let u_world = movement_functions[obj_movement](angle, scene.obj_offset)  // Rotação do objeto
		u_world = m4.multiply(m4.translation(CUBE_SIZE * obj.position[0], CUBE_SIZE * obj.position[1], CUBE_SIZE * obj.position[2]), u_world)  // Translação do objeto

		if (obj.head) {
			gl.uniform4fv(scene.u_diffuse, [0, 1, 0, 1]) // Cor da cabeca da cobra
		} else {
			gl.uniform4fv(scene.u_diffuse, [0, 0.9, 0, 1]) // Cor do corpo da cobra
		}
		gl.uniformMatrix4fv(scene.worldObjLocation, false, u_world);
		gl.drawArrays(gl.TRIANGLES, 0, model.geometry.position.length / 3)
	}
}

function render_movement(time) {
	time = time * 0.001;  // convert to seconds

	if (!animation_start_time) {
		animation_start_time = time
	}

	let current_angle = Math.min(90, (time - animation_start_time) * animation_speed)

	if (current_angle === 90) {
		start_next_movement()
	} else {
		render(current_angle)
		requestAnimationFrame(render_movement);
	}
	// requestAnimationFrame(render_movement);
}

function start_next_movement() {
	update_objs_positions()

	render(0)
	enable_cube_movement_btns()
	movement_list.pop()
	animation_start_time = null
}

function update_objs_positions() {
	// Atualiza as posições de cada parte da cobra dependendo do movimento que essa parte realizou
	// Essa atualização é depois do movimento ser realizado (animação de rotação do cubo), para que os
	// objetos fiquem nas suas novas reais posições
	// Lembrando que se objeto sair da grid, ele "teleportará" para o lado inverso

	for (let i = 0; i < scene.objs.length; i++) {
		let obj = scene.objs[i]
		let obj_movement = movement_list[i]

		if (obj_movement == FOWARD) {
			if (obj[2] >= GRID_SIZE) {  
				obj[2] = -GRID_SIZE
			}
			else {
				obj[2] += 1
			}
		} else if (obj_movement == BACK) {
			if (obj[2] <= -GRID_SIZE) {
				obj[2] = GRID_SIZE
			}
			else {
				obj[2] -= 1
			}
		} else if (obj_movement == LEFT) {
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
		let obj_movement = movement_list[i]

		if (obj_movement == FOWARD && obj[2] >= GRID_SIZE) {  // deve ter um teleporte para a parte de traz
			scene.teleportObjs.push({head: i == 0, position: vec3(obj[0], obj[1], -GRID_SIZE - 1)})
			teleport_animation_movement_list.push(FOWARD)
		}
		else if (obj_movement == BACK && obj[2] <= -GRID_SIZE) {  // Deve ter um teleporte para a parte da frente
			scene.teleportObjs.push({head: i == 0, position: vec3(obj[0], obj[1], GRID_SIZE + 1)})
			teleport_animation_movement_list.push(BACK)
		}
		else if (obj_movement == LEFT && obj[0] <= -GRID_SIZE) {  // Deve ter um teleporte para a parte da direita
			scene.teleportObjs.push({head: i == 0, position: vec3(GRID_SIZE + 1, obj[1], obj[2])})
			teleport_animation_movement_list.push(LEFT)
		}
		else if (obj_movement == RIGHT && obj[0] >= GRID_SIZE) {  // Deve ter um telepor para a parte da esquerda
			scene.teleportObjs.push({head: i == 0, position: vec3(-GRID_SIZE - 1, obj[1], obj[2])})
			teleport_animation_movement_list.push(RIGHT)
		}
	}
}


function move_foward(angle, obj) {
	let obj_tranlandado = m4.translation(-1, 1, -1, obj)  // Posiciona o objeto na posicao correta de ancora

	let obj_rotacionado = m4.multiply(m4.xRotation(degToRad(angle)), obj_tranlandado)  // Rotaciona o objeto

	return m4.multiply(m4.translation(1, -1, 1), obj_rotacionado)  // Volta o objeto para a posic original
}

function move_back(angle, obj) {
	let obj_tranlandado = m4.translation(1, 1, 1, obj)

	let obj_rotacionado = m4.multiply(m4.xRotation(degToRad(-angle)), obj_tranlandado)

	return m4.multiply(m4.translation(-1, -1, -1), obj_rotacionado)
}

function move_right(angle, obj) {
	let obj_tranlandado = m4.translation(-1, 1, -1, obj)

	let obj_rotacionado = m4.multiply(m4.zRotation(degToRad(-angle)), obj_tranlandado)

	return m4.multiply(m4.translation(1, -1, 1), obj_rotacionado)
}

function move_left(angle, obj) {
	let obj_tranlandado = m4.translation(1, 1, 1, obj)

	let obj_rotacionado = m4.multiply(m4.zRotation(degToRad(angle)), obj_tranlandado)

	return m4.multiply(m4.translation(-1, -1, -1), obj_rotacionado)
}

function add_snake_body() {
	var last_body = scene.objs[scene.objs.length - 1]
	scene.objs.push(vec3(last_body[0] - 1, last_body[1], last_body[2]))
	movement_list.push(RIGHT)
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

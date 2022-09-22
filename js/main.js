"use strict";

window.onload = function init() {

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

document.addEventListener('DOMContentLoaded', () => {
	movementFunctions[FOWARD] = moveFoward
	movementFunctions[BACK] = moveBack
	movementFunctions[LEFT] = moveLeft
	movementFunctions[RIGHT] = moveRight

	let startGameBtn = document.getElementById('start_game')
	startGameBtn.addEventListener('click', () => restartGame())
})


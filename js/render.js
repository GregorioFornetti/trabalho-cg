function getSnakeColorAndScale(bodyNumber) {
	return [
		SNAKE_COLOR_MAP[bodyNumber % SNAKE_COLOR_MAP.length],
		1 + (0.0001 * (bodyNumber % SNAKE_COLOR_MAP.length))  // pequena escala para não ter problema para escolher qual cor mostrar na rasterização (com uma pequena escala, o z-index de uma cor sempre irá ser maior, evitando conflitos de z-index iguais)
	]
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
	let u_world = m4.translation(CUBE_SIZE * scene.apple[0], CUBE_SIZE * scene.apple[1], CUBE_SIZE * scene.apple[2])  // Translação da maçã
	u_world = m4.multiply(m4.scaling(1.001, 1.001, 1.001), u_world)  // Mini escala da maçã
	gl.uniformMatrix4fv(scene.worldObjLocation, false, u_world)
	gl.uniform4fv(scene.u_diffuse, APPLE_COLOR)
	gl.drawArrays(gl.TRIANGLES, 0, model.geometry.position.length / 3)

	// Renderiza as partes da cobra
	for (let i = 0; i < scene.objs.length; i++) {
		let obj = scene.objs[i]
		let objMovement = movementList[i]
		let [color, scale] = getSnakeColorAndScale(i)

		let u_world = movementFunctions[objMovement](angle, scene.obj_offset) // Rotação do objeto
		u_world = m4.multiply(m4.translation(CUBE_SIZE * obj[0], CUBE_SIZE * obj[1], CUBE_SIZE * obj[2]), u_world)  // Translação do objeto
		u_world = m4.multiply(m4.scaling(scale, scale, scale), u_world)  // Mini escala

		gl.uniform4fv(scene.u_diffuse, color)  // Pintando o objeto
	
		gl.uniformMatrix4fv(scene.worldObjLocation, false, u_world);
		gl.drawArrays(gl.TRIANGLES, 0, model.geometry.position.length / 3)
	}

	// Renderiza os objetos de teleporte
	for (let i = 0; i < scene.teleportObjs.length; i++) {
		let obj = scene.teleportObjs[i]
		let objMovement = teleportAnimationMovementList[i]
		let [color, scale] = getSnakeColorAndScale(obj.bodyNumber)

		let u_world = movementFunctions[objMovement](angle, scene.obj_offset)  // Rotação do objeto
		u_world = m4.multiply(m4.translation(CUBE_SIZE * obj.position[0], CUBE_SIZE * obj.position[1], CUBE_SIZE * obj.position[2]), u_world)  // Translação do objeto
		u_world = m4.multiply(m4.scaling(scale, scale, scale), u_world)  // Mini escala

		gl.uniform4fv(scene.u_diffuse, color)  // Pintando o objeto
		
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
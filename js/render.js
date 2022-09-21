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
		let objMovement = movementList[i]
		let u_world = movementFunctions[objMovement](angle, scene.obj_offset) // Rotação do objeto
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
		let objMovement = teleportAnimationMovementList[i]
		let u_world = movementFunctions[objMovement](angle, scene.obj_offset)  // Rotação do objeto
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
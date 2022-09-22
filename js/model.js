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
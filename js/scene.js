function loadScene(model) {

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
	const light = m4.normalize([0, 100, 0]);

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
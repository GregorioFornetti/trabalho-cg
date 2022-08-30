#version 300 es
  precision highp float;

  const float grid_limit = 11.0;
 
  in vec3 v_normal;
  in vec4 v_position;
 
  uniform vec4 u_diffuse;
  uniform vec3 u_lightDirection;
 
  out vec4 outColor;
 
  void main () {
    if (v_position.x >= grid_limit || v_position.x <= -grid_limit || v_position.z > grid_limit || v_position.z <= -grid_limit) {
      outColor = vec4(0, 0, 0, 0);
    }
    else {
      vec3 normal = normalize(v_normal);
      float fakeLight = dot(u_lightDirection, normal) * .5 + .5;
      outColor = vec4(u_diffuse.rgb * fakeLight, u_diffuse.a);
    }
  }
#version 300 es

in vec3 pos;
uniform vec3 world;

void main(void) {
  gl_Position = vec4(pos + world, 1.0);
}

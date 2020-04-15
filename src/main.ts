// @ts-ignore: parcel shader import
import fragmentGlsl from './fragment.glsl';
// @ts-ignore: parcel shader import
import vertexGlsl from './vertex.glsl';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const gl = canvas.getContext('webgl2');
if (!gl) {
  throw new Error('Could not initialize WebGL 2.0.');
}

canvas.width = 600;
canvas.height = 600;
gl.viewport(0, 0, canvas.width, canvas.height);

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  shaders: WebGLShader[],
): WebGLProgram {
  const program = gl.createProgram();

  for (const i in shaders) {
    gl.attachShader(program, shaders[i]);
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }

  return program;
}

const program = linkProgram(
  gl,
  [
    compileShader(gl, gl.VERTEX_SHADER, vertexGlsl),
    compileShader(gl, gl.FRAGMENT_SHADER, fragmentGlsl),
  ]
);

gl.useProgram(program);

// v1   v2


// v3   v4

// [v1, v2, v3]
// [v2, v4, v3]

const size = 0.05;
const vertices = [
  -size,  size,  0,
   size,  size,  0,
  -size, -size,  0,
   size, -size, 0,
];

const indices = [
  0, 1, 2,
  1, 3, 2,
];

var vbuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vbuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

var coord = gl.getAttribLocation(program, 'pos');
gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(coord);

var ibuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

let x = 0;
let y = 0;
let vx = 0.04;
let vy = 0.01;

const keyDown = new Set();
document.addEventListener('focusout', () => {
  keyDown.clear();
});
document.addEventListener('keydown', (event) => {
  keyDown.add(event.which);
});
document.addEventListener('keyup', (event) => {
  keyDown.delete(event.which);
});

const keyMap = {
  up: 38, // UP
  down: 40, // DOWN
  left: 37, // LEFT
  right: 39, // RIGHT
};

function clamp(v: number, min: number, max: number): number {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function gameLoop() {
  requestAnimationFrame(gameLoop);

  const speed = 0.02;
  if (keyDown.has(keyMap.right)) {
    x = x + speed;
  } else if (keyDown.has(keyMap.left)) {
    x = x - speed;
  }

  if (keyDown.has(keyMap.up)) {
    y = y + speed;
  } else if (keyDown.has(keyMap.down)) {
    y = y - speed;
  }

  x = clamp(x, -1 + size, 1 - size);
  y = clamp(y, -1 + size, 1 - size);

  const worldUniform = gl.getUniformLocation(
    program,
    'world',
  ); 
  gl.uniform3f(worldUniform, x, y, 0);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT/* | gl.DEPTH_BUFFER_BIT */);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
}

gameLoop();


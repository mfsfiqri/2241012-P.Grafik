const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl");

if (!gl) {
  throw new Error("Tidak Support WebGL");
}

alert("Silahkan Klik OK");

// atur ukuran canvas yang digunakan
canvas.width = 800; // ini ukuran lebar dalam pixel
canvas.height = 800; // ini ukuran tinggi dalam pixel

// bersihkan layer
gl.clearColor(0, 0, 1, 1); // Updated alpha value to 1
gl.clear(gl.COLOR_BUFFER_BIT);
gl.viewport(0, 0, canvas.width, canvas.height);

// membuat data titik untuk garis
const points = [-0.5, 0.5, 0.5, -0.5, 0.5, 0.5];

// Membuat buffer untuk data posisi garis
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);

// Membuat vertex shader
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
      gl_Position = vec4(a_position, 0.0, 1.0); // Posisi garis
  }
`;

// membuat prog shader dan menghubungkan shader
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

// Membuat fragment shader
const fragmentShaderSource = `
  precision mediump float;

  void main() {
      gl_FragColor = vec4(0, 0, 0, 1); // Warna garis
  }
`;

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

// Membuat program shader
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

// Mendapatkan lokasi atribut posisi dari shader
const positionAttributeLocation = gl.getAttribLocation(
  shaderProgram,
  "a_position"
);
gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// Menggambar garis
gl.drawArrays(gl.LINE_STRIP, 0, 3);

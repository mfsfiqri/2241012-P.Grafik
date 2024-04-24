const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

if (!gl) {
  throw new Error("Tidak Support WebGL");
}

const canvasWidth = 600;
const canvasHeight = 600;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

gl.clearColor(0.96, 0.96, 0.96, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.viewport(0, 0, canvas.width, canvas.height);

// Variabel untuk menyimpan kecepatan peningkatan horizontal
const kecepatanPeningkatanHorizontal = 0.000015; // Kecepatan peningkatan kecepatan horizontal per detik

const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texcoord;
  varying vec2 v_texcoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texcoord = a_texcoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);
gl.useProgram(shaderProgram);

let kotakPosisi = { x: 0, y: 0 };
let kotakKeduaPosisi = { x: 4, y: 0 }; // Posisi awal kotak kedua
let kecepatanVertikal = 0;
let kecepatanHorizontal = -0.05; // Kecepatan kotak kedua bergerak dari kanan ke kiri
const kecepatanLompat = 0.045;
const gravitasi = 0.002;
let isJumping = false; // variabel untuk menandakan apakah kotak sudah melompat atau belum
let animationId; // ID untuk menghentikan animasi

function GambarKotak(warnaLoncat, warnaBergerak) {
  const kotakVertices = [
    // Vertices kotak pertama
    -0.1 + kotakPosisi.x,
    0.1 + kotakPosisi.y,
    0.0,
    1.0, // posisi dan koordinat tekstur kotak pertama
    -0.1 + kotakPosisi.x,
    -0.1 + kotakPosisi.y,
    0.0,
    0.0,
    0.1 + kotakPosisi.x,
    0.1 + kotakPosisi.y,
    1.0,
    1.0,
    -0.1 + kotakPosisi.x,
    -0.1 + kotakPosisi.y,
    0.0,
    0.0,
    0.1 + kotakPosisi.x,
    -0.1 + kotakPosisi.y,
    1.0,
    0.0,
    0.1 + kotakPosisi.x,
    0.1 + kotakPosisi.y,
    1.0,
    1.0,

    // Vertices kotak kedua
    -0.08 + kotakKeduaPosisi.x,
    0.08 + kotakKeduaPosisi.y,
    0.0,
    1.0, // posisi dan koordinat tekstur kotak kedua
    -0.08 + kotakKeduaPosisi.x,
    -0.08 + kotakKeduaPosisi.y,
    0.0,
    0.0,
    0.08 + kotakKeduaPosisi.x,
    0.08 + kotakKeduaPosisi.y,
    1.0,
    1.0,
    -0.08 + kotakKeduaPosisi.x,
    -0.08 + kotakKeduaPosisi.y,
    0.0,
    0.0,
    0.08 + kotakKeduaPosisi.x,
    -0.08 + kotakKeduaPosisi.y,
    1.0,
    0.0,
    0.08 + kotakKeduaPosisi.x,
    0.08 + kotakKeduaPosisi.y,
    1.0,
    1.0,
  ];

  // Buat dan ikat buffer posisi
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(kotakVertices),
    gl.STATIC_DRAW
  );

  // Atur atribut posisi
  const positionAttributeLocation = gl.getAttribLocation(
    shaderProgram,
    "a_position"
  );
  gl.enableVertexAttribArray(positionAttributeLocation);
  gl.vertexAttribPointer(
    positionAttributeLocation,
    2,
    gl.FLOAT,
    false,
    4 * Float32Array.BYTES_PER_ELEMENT,
    0
  );

  // Atur atribut koordinat tekstur
  const texcoordAttributeLocation = gl.getAttribLocation(
    shaderProgram,
    "a_texcoord"
  );
  gl.enableVertexAttribArray(texcoordAttributeLocation);
  gl.vertexAttribPointer(
    texcoordAttributeLocation,
    2,
    gl.FLOAT,
    false,
    4 * Float32Array.BYTES_PER_ELEMENT,
    2 * Float32Array.BYTES_PER_ELEMENT
  );

  // Atur warna kotak loncat
  const colorUniformLocation = gl.getUniformLocation(shaderProgram, "u_color");
  gl.uniform4fv(colorUniformLocation, warnaLoncat);
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Atur warna kotak bergerak
  gl.uniform4fv(colorUniformLocation, warnaBergerak);
  gl.drawArrays(gl.TRIANGLES, 6, 6);
}

function createAndBindBuffer(data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  return buffer;
}

function handleKeyPress(event) {
  if (event.code === "Space" && !isJumping) {
    // Cek apakah belum melompat
    kecepatanVertikal = kecepatanLompat;
    isJumping = true;
    // Setelah melompat, atur isJumping menjadi true
  }
}

document.addEventListener("keydown", handleKeyPress);

function Animasi() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Deteksi tabrakan antara kedua kotak
  if (
    kotakKeduaPosisi.x - 0.05 <= kotakPosisi.x + 0.1 &&
    kotakKeduaPosisi.x + 0.05 >= kotakPosisi.x - 0.1 &&
    kotakKeduaPosisi.y - 0.05 <= kotakPosisi.y + 0.1 &&
    kotakKeduaPosisi.y + 0.05 >= kotakPosisi.y - 0.1
  ) {
    // Menampilkan pop-up game over
    const popup = document.getElementById("gameOverPopup");
    popup.style.display = "block";
    return; // Menghentikan animasi setelah game over
  }

  // Terapkan gravitasi pada kotak pertama
  kecepatanVertikal -= gravitasi;
  // Perbarui posisi vertikal kotak pertama
  kotakPosisi.y += kecepatanVertikal;

  // Batasi pergerakan kotak pertama agar tidak keluar dari layar
  if (kotakPosisi.y > 0.9) {
    kotakPosisi.y = 0.9;
    kecepatanVertikal = 0;
  } else if (kotakPosisi.y < 0.0) {
    kotakPosisi.y = 0.0;
    kecepatanVertikal = 0;
    isJumping = false; // Reset isJumping ketika kotak mencapai batas bawah
  }

  // Perbarui posisi horizontal kotak kedua
  kotakKeduaPosisi.x += kecepatanHorizontal;

  // Peningkatan kecepatan horizontal untuk kotak kedua setiap detiknya
  kecepatanHorizontal -= kecepatanPeningkatanHorizontal;

  // Jika kotak kedua keluar dari layar, reset posisinya ke kanan
  if (kotakKeduaPosisi.x < -1.1) {
    kotakKeduaPosisi.x = 1;
  }

  gl.clear(gl.COLOR_BUFFER_BIT);
  // Menggambar kotak pertama dengan warna merah solid dan kotak kedua dengan warna biru solid
  GambarKotak([0.0, 0.0, 0.0, 1.0], [1.0, 0.0, 0.0, 1.0]);

  animationId = requestAnimationFrame(Animasi); // Mendapatkan ID animasi untuk kemungkinan penghentian
}

// Fungsi untuk menampilkan pop-up "Mulai Permainan"
function showStartGamePopup() {
  const startGamePopup = document.getElementById("startGamePopup");
  startGamePopup.style.display = "block";
}

// Fungsi untuk menutup pop-up "Mulai Permainan"
function closeStartGamePopup() {
  const startGamePopup = document.getElementById("startGamePopup");
  startGamePopup.style.display = "none";
}

// Panggil fungsi untuk menampilkan pop-up "Mulai Permainan" saat halaman dimuat
window.onload = showStartGamePopup;

// Event listener untuk tombol "Mulai Permainan"
const startGameButton = document.getElementById("startGameButton");
startGameButton.addEventListener("click", function () {
  closeStartGamePopup(); // Menutup pop-up "Mulai Permainan"
  Animasi(); // Mulai permainan
});

// Fungsi untuk memulai ulang permainan
function restartGame() {
  cancelAnimationFrame(animationId); // Menghentikan animasi jika sedang berjalan

  // Sembunyikan pop-up game over
  const popup = document.getElementById("gameOverPopup");
  popup.style.display = "none";

  // Reset posisi kotak, dan variabel lainnya
  kotakPosisi = { x: 0, y: 0 };
  kotakKeduaPosisi = { x: 1, y: 0 };
  kecepatanVertikal = 0;
  kecepatanHorizontal = -0.01;
  isJumping = false;
  Animasi();
}

// Event listener untuk tombol "Mulai Ulang" di dalam pop-up
const restartButtonInPopup = document.getElementById("restartButtonInPopup");
restartButtonInPopup.addEventListener("click", function () {
  restartGame(); // Panggil fungsi restartGame untuk memulai ulang permainan
});

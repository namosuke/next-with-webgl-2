export const getCanvas = (canvas: HTMLCanvasElement | null) => {
  if (canvas === null) {
    throw new Error("There is no canvas on this page.");
  }
  const expandFullScreen = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  expandFullScreen();
  window.addEventListener("resize", expandFullScreen);
  return canvas;
};

export const getContext = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2");
  if (gl === null) {
    throw new Error("WebGL2 is not available in your browser.");
  }
  return gl;
};

export const getShader = (
  gl: WebGL2RenderingContext,
  type: "vert" | "frag",
  source: string
) => {
  const shader = gl.createShader(
    type === "vert" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
  );
  if (shader === null) {
    throw new Error("Failed to create shader.");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error(
      `Failed to compile ${type} shader: ${gl.getShaderInfoLog(shader)}`
    );
  }
  return shader;
};

// Returns computed normals for provided vertices.
// Note: Indices have to be completely defined--NO TRIANGLE_STRIP only TRIANGLES.
export const calculateNormals = (vertices: number[], indices: number[]) => {
  const x = 0;
  const y = 1;
  const z = 2;
  const normals = new Array<number>(vertices.length).fill(0);

  // We work on triads of vertices to calculate
  for (let i = 0; i < indices.length; i += 3) {
    // Normals so i = i+3 (i = indices index)program.
    const v1 = [];
    const v2 = [];
    const normal = [];

    // p2 - p1
    v1[x] = vertices[3 * indices[i + 2] + x] - vertices[3 * indices[i + 1] + x];
    v1[y] = vertices[3 * indices[i + 2] + y] - vertices[3 * indices[i + 1] + y];
    v1[z] = vertices[3 * indices[i + 2] + z] - vertices[3 * indices[i + 1] + z];

    // p0 - p1
    v2[x] = vertices[3 * indices[i] + x] - vertices[3 * indices[i + 1] + x];
    v2[y] = vertices[3 * indices[i] + y] - vertices[3 * indices[i + 1] + y];
    v2[z] = vertices[3 * indices[i] + z] - vertices[3 * indices[i + 1] + z];

    // Cross product by Sarrus Rule
    normal[x] = v1[y] * v2[z] - v1[z] * v2[y];
    normal[y] = v1[z] * v2[x] - v1[x] * v2[z];
    normal[z] = v1[x] * v2[y] - v1[y] * v2[x];

    // Update the normals of that triangle: sum of vectors
    for (let j = 0; j < 3; j++) {
      normals[3 * indices[i + j] + x] =
        normals[3 * indices[i + j] + x] + normal[x];
      normals[3 * indices[i + j] + y] =
        normals[3 * indices[i + j] + y] + normal[y];
      normals[3 * indices[i + j] + z] =
        normals[3 * indices[i + j] + z] + normal[z];
    }
  }
  // Normalize the result.
  // The increment here is because each vertex occurs.
  for (let i = 0; i < vertices.length; i += 3) {
    // With an offset of 3 in the array (due to x, y, z contiguous values)
    const nn = [];
    nn[x] = normals[i + x];
    nn[y] = normals[i + y];
    nn[z] = normals[i + z];

    let len = Math.sqrt(nn[x] * nn[x] + nn[y] * nn[y] + nn[z] * nn[z]);
    if (len === 0) len = 1.0;

    nn[x] = nn[x] / len;
    nn[y] = nn[y] / len;
    nn[z] = nn[z] / len;

    normals[i + x] = nn[x];
    normals[i + y] = nn[y];
    normals[i + z] = nn[z];
  }

  return normals;
};

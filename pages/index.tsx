import Head from "next/head";
import Layout from "../components/layout";
import { useEffect, useRef } from "react";
import vertString from "../glsl/shader.vert";
import fragString from "../glsl/shader.frag";
import * as utils from "../webgl/utils";
import { mat4 } from "gl-matrix";

const Home = () => {
  const webglCanvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = utils.getCanvas(webglCanvas.current);
    const gl = utils.getContext(canvas);

    // Configure `gl`
    gl.clearColor(0.9, 0.9, 0.9, 1);
    gl.clearDepth(100);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    // Shader source
    const vertShader = utils.getShader(gl, "vert", vertString);
    const fragShader = utils.getShader(gl, "frag", fragString);

    // Configure `program`
    const program = gl.createProgram();
    if (program === null) {
      throw new Error("Failed to create program.");
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error("Could not initialize shaders");
    }
    gl.useProgram(program);

    // Set locations
    const aVertexPosition = gl.getAttribLocation(program, "aVertexPosition");
    const aVertexNormal = gl.getAttribLocation(program, "aVertexNormal");
    const uProjectionMatrix = gl.getUniformLocation(
      program,
      "uProjectionMatrix"
    );
    const uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    const uNormalMatrix = gl.getUniformLocation(program, "uNormalMatrix");
    const uLightDirection = gl.getUniformLocation(program, "uLightDirection");
    const uLightAmbient = gl.getUniformLocation(program, "uLightAmbient");
    const uLightDiffuse = gl.getUniformLocation(program, "uLightDiffuse");
    const uMaterialDiffuse = gl.getUniformLocation(program, "uMaterialDiffuse");
    if (uProjectionMatrix === null) throw new Error("uProjectionMatrix");
    if (uModelViewMatrix === null) throw new Error("uModelViewMatrix");
    if (uNormalMatrix === null) throw new Error("uNormalMatrix");
    if (uLightDirection === null) throw new Error("uLightDirection");
    if (uLightAmbient === null) throw new Error("uLightAmbient");
    if (uLightDiffuse === null) throw new Error("uLightDiffuse");
    if (uMaterialDiffuse === null) throw new Error("uMaterialDiffuse");

    // Orientation values for later reference
    let azimuth = 0;
    let elevation = 0;

    // Procee key events by updating global orientation values
    const processKey = (ev: KeyboardEvent) => {
      const lightDirection = gl.getUniform(program, uLightDirection);
      const incrementValue = 10;

      if (ev.key === "ArrowLeft") {
        azimuth -= incrementValue;
      } else if (ev.key === "ArrowUp") {
        elevation += incrementValue;
      } else if (ev.key === "ArrowRight") {
        azimuth += incrementValue;
      } else if (ev.key === "ArrowDown") {
        elevation -= incrementValue;
      }

      azimuth %= 360;
      elevation %= 360;

      const theta = (elevation * Math.PI) / 180;
      const phi = (azimuth * Math.PI) / 180;

      // Spherical to cartesian coordinate transformation
      lightDirection[0] = Math.cos(theta) * Math.sin(phi);
      lightDirection[1] = Math.sin(theta);
      lightDirection[2] = Math.cos(theta) * -Math.cos(phi);

      gl.uniform3fv(uLightDirection, lightDirection);
    };

    // initBuffers
    const vertices = [
      -20, -8, 20, -10, -8, 0, 10, -8, 0, 20, -8, 20, -20, 8, 20, -10, 8, 0, 10,
      8, 0, 20, 8, 20,
    ];
    const indices = [0, 5, 4, 1, 5, 0, 1, 6, 5, 2, 6, 1, 2, 7, 6, 3, 7, 2];
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const normals = utils.calculateNormals(vertices, indices);

    const verticesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aVertexPosition);
    gl.vertexAttribPointer(aVertexPosition, 3, gl.FLOAT, false, 0, 0);

    const normalsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(aVertexNormal);
    gl.vertexAttribPointer(aVertexNormal, 3, gl.FLOAT, false, 0, 0);

    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );

    // Clean
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    const draw = () => {
      const { width, height } = gl.canvas;
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const modelViewMatrix = mat4.create();
      const projectionMatrix = mat4.create();
      const normalMatrix = mat4.create();

      mat4.perspective(projectionMatrix, 45, width / height, 0.1, 10000);
      mat4.identity(modelViewMatrix);
      mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -40]);

      mat4.copy(normalMatrix, modelViewMatrix);
      mat4.invert(normalMatrix, normalMatrix);
      mat4.transpose(normalMatrix, normalMatrix);

      gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
      gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
      gl.uniformMatrix4fv(uNormalMatrix, false, normalMatrix);

      try {
        // Bind
        gl.bindVertexArray(vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);

        // Draw
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        // Clean
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      } catch (error) {
        console.error(error);
      }
    };

    // Configure lights
    gl.uniform3fv(uLightDirection, [0, 0, -1]);
    gl.uniform4fv(uLightAmbient, [0.01, 0.01, 0.01, 1]);
    gl.uniform4fv(uLightDiffuse, [0.5, 0.5, 0.5, 1]);
    gl.uniform4f(uMaterialDiffuse, 0.1, 0.5, 0.8, 1);

    const render = () => {
      draw();
      requestAnimationFrame(render);
    };
    render();

    document.addEventListener("keydown", processKey);
  }, []);
  return (
    <Layout>
      <Head>
        <title>Real-Time 3D Graphics with WebGL2</title>
      </Head>
      <canvas ref={webglCanvas}>
        Your browser does not support the HTML5 canvas element.
      </canvas>
    </Layout>
  );
};

export default Home;

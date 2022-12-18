import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Layout from "../components/layout";
import { useEffect, useRef } from "react";
import vertString from "../glsl/shader.vert";
import fragString from "../glsl/shader.frag";

const Home = () => {
  const webglCanvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // init
    const canvas = webglCanvas.current;
    if (canvas === null) {
      console.error(`There is no canvas on this page.`);
      return;
    }
    const expandFullScreen = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    expandFullScreen();
    window.addEventListener("resize", expandFullScreen);
    const gl = canvas.getContext("webgl2");
    if (gl === null) {
      console.error("WebGL2 is not available in your browser.");
      return;
    }
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // initProgram
    const getShader = (type: "vert" | "frag", source: string) => {
      const shader = gl.createShader(
        type === "vert" ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER
      );
      if (shader === null) {
        console.error("Failed to create shader.");
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
          `Failed to compile ${type} shader: ${gl.getShaderInfoLog(shader)}`
        );
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };
    const vertShader = getShader("vert", vertString);
    const fragShader = getShader("frag", fragString);
    if (vertShader === null || fragShader === null) return;
    const program = gl.createProgram();
    if (program === null) {
      console.error("Failed to create program.");
      return;
    }
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Could not initialize shaders");
      return;
    }
    gl.useProgram(program);
    const vertexPositionAttribute = gl.getAttribLocation(
      program,
      "aVertexPosition"
    );

    // initBuffers
    const vertices = [-0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0];
    const indices = [0, 1, 2, 0, 2, 3];
    const squareVAO = gl.createVertexArray();
    if (squareVAO === null) {
      console.error("Failed to create VAO.");
      return;
    }
    gl.bindVertexArray(squareVAO);
    const squareVertexBuffer = gl.createBuffer();
    if (squareVertexBuffer === null) {
      console.error("Failed to create vertex buffer.");
      return;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    const squareIndexBuffer = gl.createBuffer();
    if (squareIndexBuffer === null) {
      console.error("Failed to create index buffer.");
      return;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices),
      gl.STATIC_DRAW
    );
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    // draw
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.bindVertexArray(squareVAO);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
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

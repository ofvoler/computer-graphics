"use strict";

class Model {
    transform;
    mesh;
    material;

    constructor(transform, meshData, material) {
        this.transform = transform;
        this.mesh = meshData;
        this.material = material || {
            tint: [1, 1, 1, 1]
        };
    }

    //.....................................................
    //Methods
    //.....................................................
    update() {
        this.transform.updateMatrix();
        return this;
    }

    render(gl, shader, camera, lightingData) {

        gl.useProgram(shader.program);

        // set model, view and projection matrices in the vertex shader
        gl.uniformMatrix4fv(shader.uniformLoc.modelMatrix, true, this.transform.modelMatrix.toFloat32());
        gl.uniformMatrix4fv(shader.uniformLoc.viewMatrix, true, camera.viewMatrix.toFloat32());
        gl.uniformMatrix4fv(shader.uniformLoc.projectionMatrix, true, camera.projectionMatrix.toFloat32());

        if (shader.useLighting) {
            gl.uniformMatrix3fv(shader.uniformLoc.inverseTransposeMatrix, true, Matrix4x4.inverseTranspose3x3(this.transform.modelMatrix).toFloat32());
            gl.uniform3fv(shader.uniformLoc.lightDirection, lightingData.lightDirection.toFloat32());
            gl.uniform3fv(shader.uniformLoc.lightColor, lightingData.lightColor.toFloat32());
            gl.uniform3fv(shader.uniformLoc.ambientColor, lightingData.ambientColor.toFloat32());
        }

        // terrain texturing
        let topTextureLoc = gl.getUniformLocation(shader.program, "u_topTexture");
        let sideTextureLoc = gl.getUniformLocation(shader.program, "u_sideTexture");
        let snowTextureLoc = gl.getUniformLocation(shader.program, "u_snowTexture");
        let biomeTextureLoc = gl.getUniformLocation(shader.program, "u_biomeTexture");
        let sandTopTextureLoc = gl.getUniformLocation(shader.program, "u_sandTopTexture");
        let sandSideTextureLoc = gl.getUniformLocation(shader.program, "u_sandSideTexture");

        // bind textures
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, TextureCache["grass"]);
        gl.uniform1i(topTextureLoc, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, TextureCache["rock"]);
        gl.uniform1i(sideTextureLoc, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, TextureCache["snow"]);
        gl.uniform1i(snowTextureLoc, 2);

        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, TextureCache["biome"]);
        gl.uniform1i(biomeTextureLoc, 3);

        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, TextureCache["sand"]);
        gl.uniform1i(sandTopTextureLoc, 4);

        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, TextureCache["sandstone"]);
        gl.uniform1i(sandSideTextureLoc, 5);

        // set tint color, if a corresponding uniform exists in the shader.
        if (shader.uniformLoc.tint) {
            gl.uniform4fv(shader.uniformLoc.tint, new Float32Array(this.material.tint));
        }

        gl.bindVertexArray(this.mesh.vao); //Enable VAO, this will set all the predefined attributes for the shader

        // if the mesh has an index buffer, use index(element) based drawing. otherwise use regular drawing.
        if (this.mesh.indexCount) {
            gl.drawElements(this.mesh.drawMode, this.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawArrays(this.mesh.drawMode, 0, this.mesh.vertexCount);
        }

        gl.bindVertexArray(null); // unbing VAO so the next drawcall does not accidentally use data from this one.

        return this;
    }
}
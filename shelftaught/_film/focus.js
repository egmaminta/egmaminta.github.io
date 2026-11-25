// Rack focus onto the hand and the handset as the camera moves in.
import * as T from '../three-r180/three.module.min.js';

export function focusLens(renderer) {
  const size = renderer.getDrawingBufferSize(new T.Vector2());
  const target = new T.WebGLRenderTarget(size.x, size.y, {
    type: T.HalfFloatType,
    samples: Math.min(4, renderer.capabilities.maxSamples),
    depthTexture: new T.DepthTexture(size.x, size.y, T.UnsignedIntType),
  });
  const pass = new T.Scene(),
    view = new T.Camera();
  const material = new T.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      frame: { value: target.texture },
      depth: { value: target.depthTexture },
      texel: { value: new T.Vector2(1 / size.x, 1 / size.y) },
      clip: { value: new T.Vector2() },
      focus: { value: 1 },
      aperture: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }
    `,
    fragmentShader: `
      uniform sampler2D frame, depth;
      uniform vec2 texel, clip;
      uniform float focus, aperture;
      varying vec2 vUv;
      float distanceAt(vec2 uv) {
        float z=texture2D(depth,uv).r;
        return clip.x*clip.y/(clip.y-z*(clip.y-clip.x));
      }
      void main(){
        float z=distanceAt(vUv);
        float radius=aperture*clamp(abs(z-focus)/z,0.,1.);
        vec3 sum=texture2D(frame,vUv).rgb;
        float weight=1.;
        if(radius>.45){
          for(int i=0;i<16;i++){
            float k=float(i)+.5;
            vec2 disk=vec2(cos(k*2.39996),sin(k*2.39996))*sqrt(k/16.);
            vec2 uv=vUv+disk*radius*texel;
            // An in-focus edge in front of the background must stay sharp.
            float w=smoothstep(.78,1.,distanceAt(uv)/z);
            sum+=texture2D(frame,uv).rgb*w;weight+=w;
          }
        }
        gl_FragColor=vec4(sum/weight,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const quad = new T.Mesh(new T.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  pass.add(quad);
  return (scene, camera, distance, radius) => {
    material.uniforms.clip.value.set(camera.near, camera.far);
    material.uniforms.focus.value = distance;
    material.uniforms.aperture.value = radius;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(pass, view);
  };
}

import * as THREE from "three";
import React, { useRef, useState, useMemo, forwardRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  Box,
  OrbitControls,
  Environment,
  PerspectiveCamera,
  Tetrahedron,
  useFBO,
  SpotLight,
  useGLTF,
  MeshRefractionMaterial,
  // MeshTransmissionMaterial,
  // Caustics,
  Text,
  AccumulativeShadows,
  RandomizedLight,
} from "@react-three/drei";
// import { MathUtils } from "three";
import { RGBELoader, FullScreenQuad } from "three-stdlib";
// import { lerp } from "maath";
// import { dampE } from "maath/easing";
import { easing } from "maath";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Physics, RigidBody, BallCollider } from "@react-three/rapier";

import CausticsPlaneMaterial from "./CausticsPlaneMaterial.jsx";
import CausticsComputeMaterial from "./CausticsComputeMaterial.jsx";
import NormalMaterial from "./NormalMaterial.jsx";
import { MeshTransmissionMaterial } from "./MeshTransmissionMaterial.jsx";

const config = {
  backsideThickness: 0.9,
  thickness: 1.9,
  samples: 8,
  transmission: 1,
  clearcoat: 0,
  clearcoatRoughness: 0,
  chromaticAberration: 1.25,
  anisotropy: 0.3,
  roughness: 0,
  distortion: 1,
  distortionScale: 1,
  temporalDistortion: 0.02,
  ior: 1.25,
  color: "#ffffff",
};

const TetrahedronGeo = forwardRef((props, ref) => {
  return (
    <Tetrahedron
      ref={ref}
      args={[5, 0]}
      rotation={[(Math.PI / 180) * 125, (Math.PI / 180) * 45, 0]}
      position={[0, 3, 0]}
      castShadow
      receiveShadow
    >
      <MeshTransmissionMaterial backside {...config} />
    </Tetrahedron>
  );
});

const TorusGeometry = forwardRef((props, ref) => {
  // const [hovered, setHovered] = useState(false);
  // let targetRotation = Math.PI; // Half a turn in radians
  // let currentRotation = 0;

  // useFrame((state, delta) => {
  //   // Calculate the new rotation using linear interpolation (lerp)
  //   currentRotation = lerp(currentRotation, targetRotation, 0.1);

  //   // Apply the rotation to your object
  //   ref.current.rotation.y = currentRotation;
  // });

  // useFrame((state, delta) => {
  //   // dampE(ref.current.rotation.y, Math.PI / 2 , 0.25, delta)
  //   // ref.current.rotation.y += 0.005;
  //   ref.current.rotation.x = hovered
  //   ? MathUtils.lerp(ref.current.rotation.x, -Math.PI * 2, 0.025)
  //   : MathUtils.lerp(ref.current.rotation.x, 0, 0.025);
  // });

  // useFrame((state, delta) => {
  //   const xRotation = state.pointer.x; // Mouse movement along the X-axis
  //   const yRotation = state.pointer.y; // Mouse movement along the Y-axis

  //   const targetRotation = [-Math.PI / 0.1 - yRotation / 2, -Math.PI / 0.1 - xRotation / 2, 0];
  //   easing.dampE(ref.current.rotation, targetRotation, 0.9, delta);

  // });

  return (
    <mesh
      ref={ref}
      scale={0.5}
      position={[0, 0, 0]}
      // onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}
    >
      <torusGeometry args={[5, 1, 4, 4]} />
      <MeshTransmissionMaterial backside {...config} />
    </mesh>
  );
});
const TorusknotGeometry = forwardRef((props, ref) => {
  return (
    <mesh ref={ref} scale={0.4} position={[0, 6.5, 0]}>
      <torusKnotGeometry args={[10, 3, 600, 160]} />
      <MeshTransmissionMaterial backside {...config} />
    </mesh>
  );
});

const App = () => {
  const isMobile = window.innerWidth < 768;

  return (
    <Canvas
      shadows
      orthographic
      dpr={[1, 2]}
      camera={{
        // position: [-0.8, 1.25, 2.45]
        zoom: 70,
      }}
    >
      <color attach='background' args={["#000000"]} />
      {/* <OrbitControls /> */}

      <Text
        scale={isMobile ? 0.4 : 1}
        children='THE ENIGMA'
        font={"./Inter-Regular.woff"}
        letterSpacing={0.1}
        position={[0, -4, 2]}
        color={"white"}
        fontSize={2}
      />
      {/* <Caustics /> */}
      <Interact  />
      {/* <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={65} /> */}
      <Environment files='./studio.hdr' ground={{ height: 45, radius: 100, scale: 1001 }} resolution={1} blur={1} />
      {/* <EffectComposer disableNormalPass>
        <Bloom mipmapBlur luminanceThreshold={0.9} radius={0.05} />
      </EffectComposer> */}
    </Canvas>
  );
};

export default App;

const Interact = () => {
  const ref = useRef();
  const push = () => {
    if (ref.current) {
      const random = 9 * Math.random();
      ref.current.applyImpulseAtPoint({ x: 0, y: 0, z: 1 }, { x: random, y: random, z: random }, true);
    }
  };
  return (
    <Physics gravity={[0, 0, 0]}>
      <RigidBody
        restitution={0}
        colliders='cuboid'
        linearDamping={5}
        angularDamping={1}
        friction={0.1}
        ref={ref}
        // position={pos}
        // ref={api}
        // {...props}
      >
        <TorusGeometry onClick={push} />
      </RigidBody>
    </Physics>
  );
};

const Caustics = () => {
  const mesh = useRef();
  const causticsPlane = useRef();
  const spotlightRef = useRef();

  const {
    light = new THREE.Vector3(-10, 13, -10),
    intensity = 1.5,
    chromaticAberration = 0.3,
    displace = true,
    amplitude = 0.05,
    frequency = 5.0,
  } = {};

  const normalRenderTarget = useFBO(2000, 2000, {});
  const [normalCamera] = useState(() => new THREE.PerspectiveCamera(65, 1, 0.1, 1000));
  const [normalMaterial] = useState(() => new NormalMaterial());

  const causticsComputeRenderTarget = useFBO(2000, 2000, {});
  const [causticsQuad] = useState(() => new FullScreenQuad());
  const [causticsComputeMaterial] = useState(() => new CausticsComputeMaterial());

  const [causticsPlaneMaterial] = useState(() => new CausticsPlaneMaterial());
  causticsPlaneMaterial.transparent = true;
  causticsPlaneMaterial.blending = THREE.CustomBlending;
  causticsPlaneMaterial.blendSrc = THREE.OneFactor;
  causticsPlaneMaterial.blendDst = THREE.SrcAlphaFactor;

  useFrame(state => {
    const { gl, clock, camera } = state;

    camera.lookAt(0, 0, 0);

    const bounds = new THREE.Box3().setFromObject(mesh.current, true);

    let boundsVertices = [];
    boundsVertices.push(new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z));
    boundsVertices.push(new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z));
    boundsVertices.push(new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.min.z));
    boundsVertices.push(new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z));
    boundsVertices.push(new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.min.z));
    boundsVertices.push(new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z));
    boundsVertices.push(new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.min.z));
    boundsVertices.push(new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z));

    const lightDir = new THREE.Vector3(light.x, light.y, light.z).normalize();

    // Calculates the projected coordinates of the vertices onto the plane
    // perpendicular to the light direction
    const projectedCoordinates = boundsVertices.map(v => {
      const newX = v.x + lightDir.x * (-v.y / lightDir.y);
      const newY = v.y + lightDir.y * (-v.y / lightDir.y);
      const newZ = v.z + lightDir.z * (-v.y / lightDir.y);

      return new THREE.Vector3(newX, newY, newZ);
    });

    // Calculates the combined spatial coordinates of the projected vertices
    // and divides by the number of vertices to get the center position
    const centerPos = projectedCoordinates.reduce((a, b) => a.add(b), new THREE.Vector3(0, 0, 0)).divideScalar(projectedCoordinates.length);

    // Calculates the scale of the caustic plane based on the distance of the
    // furthest vertex from the center (using euclidean distance)
    const scale = projectedCoordinates
      .map(p => Math.sqrt(Math.pow(p.x - centerPos.x, 2), Math.pow(p.z - centerPos.z, 2)))
      .reduce((a, b) => Math.max(a, b), 0);

    // The scale of the plane is multiplied by this correction factor to
    // avoid the caustics pattern to be cut / overflow the bounds of the plane
    // my normal projection or my math must be a bit off, so I'm trying to be very conservative here
    const scaleCorrection = 1.75;

    causticsPlane.current.scale.set(scale * scaleCorrection, scale * scaleCorrection, scale * scaleCorrection);
    causticsPlane.current.position.set(centerPos.x, centerPos.y, centerPos.z);

    normalCamera.position.set(light.x, light.y, light.z);
    normalCamera.lookAt(
      bounds.getCenter(new THREE.Vector3(0, 0, 0)).x,
      bounds.getCenter(new THREE.Vector3(0, 0, 0)).y,
      bounds.getCenter(new THREE.Vector3(0, 0, 0)).z
    );
    normalCamera.up = new THREE.Vector3(0, 1, 0);

    const originalMaterial = mesh.current.material;

    mesh.current.material = normalMaterial;
    mesh.current.material.side = THREE.BackSide;

    mesh.current.material.uniforms.time.value = clock.elapsedTime;
    mesh.current.material.uniforms.uDisplace.value = displace;
    mesh.current.material.uniforms.uAmplitude.value = amplitude;
    mesh.current.material.uniforms.uFrequency.value = frequency;

    gl.setRenderTarget(normalRenderTarget);
    gl.render(mesh.current, normalCamera);

    mesh.current.material = originalMaterial;
    mesh.current.material.uniforms.time.value = clock.elapsedTime;
    mesh.current.material.uniforms.uDisplace.value = displace;
    mesh.current.material.uniforms.uAmplitude.value = amplitude;
    mesh.current.material.uniforms.uFrequency.value = frequency;

    causticsQuad.material = causticsComputeMaterial;
    causticsQuad.material.uniforms.uTexture.value = normalRenderTarget.texture;
    causticsQuad.material.uniforms.uLight.value = light;
    causticsQuad.material.uniforms.uIntensity.value = intensity;

    gl.setRenderTarget(causticsComputeRenderTarget);
    causticsQuad.render(gl);

    causticsPlane.current.material = causticsPlaneMaterial;

    causticsPlane.current.material.uniforms.uTexture.value = causticsComputeRenderTarget.texture;
    causticsPlane.current.material.uniforms.uAberration.value = chromaticAberration;

    gl.setRenderTarget(null);

    // spotlightRef.current.position.set(light.x, light.y, light.z);
    // spotlightRef.current.distance = Math.sqrt(
    //   Math.pow(spotlightRef.current.position.x - causticsPlane.current.position.x, 2) +
    //     Math.pow(spotlightRef.current.position.y - causticsPlane.current.position.y, 2) +
    //     Math.pow(spotlightRef.current.position.z - causticsPlane.current.position.z, 2)
    // );
  });

  return (
    <>
      {/* <SpotLight
        castShadow
        ref={spotlightRef}
        penumbra={8}
        distance={25}
        angle={0.95}
        attenuation={20}
        anglePower={1}
        intensity={0.1}
        color='#fff'
        // target={causticsPlane.current}
      /> */}
      <TorusGeometry ref={mesh} />
      {/* <TorusknotGeometry ref={mesh} /> */}
      {/* <TetrahedronGeo ref={mesh}/> */}
      <mesh ref={causticsPlane} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        {/* <planeGeometry /> */}
      </mesh>
      {/* <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, -0.2]}>
        <planeGeometry args={[50, 50]} />
        <meshPhongMaterial transparent blending={THREE.CustomBlending} blendSrc={THREE.OneFactor} blendDst={THREE.SrcAlphaFactor} />
      </mesh> */}
    </>
  );
};

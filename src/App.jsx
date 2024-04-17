import React, { useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  Box,
  OrbitControls,
  Environment,
  Tetrahedron,
  MeshRefractionMaterial,
  MeshTransmissionMaterial,
  Caustics,
  AccumulativeShadows,
  RandomizedLight,
} from "@react-three/drei";
import { RGBELoader } from "three-stdlib";
const Scene = () => {
  // const boxRef = useRef();
  // useFrame((state, delta) => {
  //   boxRef.current.rotation.y += 0.02;
  // });

  let properties = {
    samples: 6,
    resolution: 64,
    backside: true,
    backsideThickness: 0.3,
    transmission: 1,
    roughness: 0,
    thickness: 0.2,
    chromaticAberration: 1,
    ior: 2,
    anisotropy: 0.3,
    clearcoat: 0,
    clearcoatRoughness: 0.0,
    distortion: 4,
    distortionScale: 1,
    temporalDistortion: 0.2,
  };

  const texture = useLoader(RGBELoader, 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr')
 

  return (
    <>
      {/* <Box ref={boxRef} args={[1, 1, 1]} rotation={[0.5, 0, 0]}>
        <meshNormalMaterial />
      </Box> */}
      {/* <Tetrahedron args={[1 , 0]} rotation={[0.5, 0, 0]}>
      <MeshRefractionMaterial  />
      </Tetrahedron> */}

      <Caustics
        color='#FF8F20'
        position={[0, -0.5, 0]}
        lightSource={[2, 2, -4]}
        worldRadius={0.01}
        ior={1.2}
        intensity={0.005}
        backfaces
        backfaceIor={1.1}
      >
        <Tetrahedron
          args={[1.5, 0]}
          rotation={[(Math.PI / 180) * 125, (Math.PI / 180) * 45, 0]}
          position={[0, 0.7, 0]}
          castShadow
          receiveShadow
        >
          {/* <MeshRefractionMaterial
            color='#FF8F20'
            bounces={8}
            aberrationStrength={2}
            ior={1.8}
            fresnel={1}
            fastChroma
            
            envMap={texture}
          /> */}
          
          <MeshTransmissionMaterial  color="#FF8F20"  {...properties} />

        </Tetrahedron>
      </Caustics>

      <spotLight decay={0} position={[0, 3, 3]} angle={0.15} penumbra={1} intensity={3} />
      <pointLight decay={0} position={[-2, -2, -2]} />
      <AccumulativeShadows
        temporal
        frames={100}
        color='orange'
        colorBlend={2}
        toneMapped={true}
        alphaTest={0.7}
        opacity={1}
        scale={12}
        position={[0, -0.5, 0]}
      >
        <RandomizedLight amount={8} radius={10} ambient={0.5} position={[5, 5, -10]} bias={0.001} />
      </AccumulativeShadows>
      <Environment files='https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr' />

      <ambientLight intensity={4} />
    </>
  );
};

const App = () => {
  return (
    <Canvas shadows camera={{ fov: 70, position: [0, 0, 3] }}>
      <color attach='background' args={["#f0f0f0"]} />
      <OrbitControls />
      <Scene />
    </Canvas>
  );
};

export default App;

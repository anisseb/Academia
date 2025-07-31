import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Group, Mesh } from 'three';

interface AvatarProps {
  animation?: 'idle' | 'smile' | 'wave' | 'crossArms';
  onAnimationChange?: (animation: string) => void;
}

const CartoonAvatar: React.FC<AvatarProps> = ({ animation = 'idle', onAnimationChange }) => {
  const groupRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const mouthRef = useRef<Mesh>(null);
  const [time, setTime] = useState(0);

  useFrame((state, delta) => {
    setTime(time + delta);

    if (!groupRef.current) return;

    // Idle animation - subtle floating
    groupRef.current.position.y = Math.sin(time * 2) * 0.05;

    // Animation states
    switch (animation) {
      case 'wave':
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = Math.sin(time * 5) * 0.5 + 1.2;
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.4;
        }
        break;
      
      case 'crossArms':
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = -1.2;
          leftArmRef.current.rotation.y = 0.3;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = 1.2;
          rightArmRef.current.rotation.y = -0.3;
        }
        break;
      
      case 'smile':
        if (mouthRef.current) {
          mouthRef.current.scale.y = 1.5;
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.4;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.4;
        }
        break;
      
      default: // idle
        if (leftArmRef.current) {
          leftArmRef.current.rotation.z = 0.4;
          leftArmRef.current.rotation.y = 0;
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.z = -0.4;
          rightArmRef.current.rotation.y = 0;
        }
        if (mouthRef.current) {
          mouthRef.current.scale.y = 1;
        }
        break;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.8, 1.5, 8, 16]} />
        <meshStandardMaterial color="#4F46E5" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#FBBF24" />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.3, 1.9, 0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.3, 1.9, 0.6]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, 1.5, 0.7]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.2, 0.05, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.9, 0.5, 0]}>
        <mesh position={[0, -0.5, 0]}>
          <capsuleGeometry args={[0.2, 1, 8, 16]} />
          <meshStandardMaterial color="#FBBF24" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -1.2, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#FBBF24" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.9, 0.5, 0]}>
        <mesh position={[0, -0.5, 0]}>
          <capsuleGeometry args={[0.2, 1, 8, 16]} />
          <meshStandardMaterial color="#FBBF24" />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -1.2, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#FBBF24" />
        </mesh>
      </group>

      {/* Left Leg */}
      <mesh position={[-0.3, -1.5, 0]}>
        <capsuleGeometry args={[0.25, 1, 8, 16]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>
      {/* Foot */}
      <mesh position={[-0.3, -2.3, 0.2]}>
        <boxGeometry args={[0.3, 0.2, 0.5]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>

      {/* Right Leg */}
      <mesh position={[0.3, -1.5, 0]}>
        <capsuleGeometry args={[0.25, 1, 8, 16]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>
      {/* Foot */}
      <mesh position={[0.3, -2.3, 0.2]}>
        <boxGeometry args={[0.3, 0.2, 0.5]} />
        <meshStandardMaterial color="#1F2937" />
      </mesh>
    </group>
  );
};

interface Avatar3DProps {
  animation?: 'idle' | 'smile' | 'wave' | 'crossArms';
  onAnimationChange?: (animation: string) => void;
  style?: any;
}

const Avatar3D: React.FC<Avatar3DProps> = ({ animation = 'idle', onAnimationChange, style }) => {
  return (
    <Canvas style={style}>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        minDistance={5} 
        maxDistance={15}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
      />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />
      <CartoonAvatar animation={animation} onAnimationChange={onAnimationChange} />
    </Canvas>
  );
};

export default Avatar3D;
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface MarkerProps {
  position: [number, number, number];
  text?: string;
}

export default function Marker({ position, text = "YOU ARE HERE" }: MarkerProps) {
  const markerRef = useRef<THREE.Group>(null);

  // Bobbing animation
  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <group ref={markerRef} position={position}>
      {/* Outer Glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#166534" transparent opacity={0.4} />
      </mesh>

      {/* Inner Pin */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.3, 0.8, 16]} />
        <meshBasicMaterial color="#14532d" />
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#14532d" />
        </mesh>
        <mesh position={[0, 0.4, 0.1]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </mesh>

      {/* Text Label */}
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.4}
        color="#14532d"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {text}
      </Text>
    </group>
  );
}

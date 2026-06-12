import React from 'react';
import { Text } from '@react-three/drei';

interface ElevatorProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export default function Elevator({ position, rotation = [0, 0, 0] }: ElevatorProps) {
  const wallColor = '#a8e0cb';
  
  return (
    <group position={position} rotation={rotation}>
      {/* Elevator Frame/Shaft */}
      <mesh position={[0, 1.5, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[4, 3, 1]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      
      {/* Elevator Doors */}
      <mesh position={[-0.85, 1.25, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 2.5, 0.1]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.85, 1.25, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 2.5, 0.1]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Frame border around doors */}
      <mesh position={[0, 1.25, 0.02]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 2.7, 0.1]} />
        <meshStandardMaterial color="#6b7280" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Elevator Sign Background */}
      <mesh position={[0, 2.8, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.4, 0.05]} />
        <meshStandardMaterial color="#f3f4f6" />
      </mesh>

      {/* Elevator Sign Text */}
      <Text
        position={[0, 2.8, 0.13]}
        fontSize={0.25}
        color="#374151"
        anchorX="center"
        anchorY="center"
        fontWeight="bold"
      >
        ELEVATOR
      </Text>
    </group>
  );
}

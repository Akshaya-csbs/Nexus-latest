import React, { useState, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface RoomProps {
  position: [number, number, number];
  roomNumber: string;
  width?: number;
  depth?: number;
  wallHeight?: number;
  doorPosition?: 'left' | 'right' | 'center';
  rotation?: [number, number, number];
  showMarker?: boolean;
  onClick?: () => void;
  isHovered?: boolean;
  doorFacing?: 'north' | 'south';
  isCrisis?: boolean;
}

export default function Room({
  position,
  roomNumber,
  width = 4,
  depth = 4,
  wallHeight = 2.5,
  doorPosition = 'center',
  rotation = [0, 0, 0],
  showMarker = false,
  onClick,
  doorFacing = 'south',
  isCrisis = false
}: RoomProps) {
  const [hovered, setHovered] = useState(false);
  const wallThickness = 0.6;
  
  // Determine colors based on crisis and hover state
  const baseWallColor = hovered ? '#e0f8e9' : '#cbf5dc'; // Bright whitish green
  const crisisWallColor = hovered ? '#f87171' : '#ef4444'; // Red for crisis
  const wallColor = isCrisis ? crisisWallColor : baseWallColor;
  
  const baseFloorColor = '#aee8c4';
  const crisisFloorColor = '#fca5a5';
  const floorColor = isCrisis ? crisisFloorColor : baseFloorColor;
  
  // Create an array of materials to color the top face white
  const materials = useMemo(() => {
    const sideMat = new THREE.MeshStandardMaterial({ color: wallColor });
    const topMat = new THREE.MeshStandardMaterial({ color: '#ffffff' }); // White shade for top
    return [
      sideMat, // right
      sideMat, // left
      topMat,  // top
      sideMat, // bottom
      sideMat, // front
      sideMat  // back
    ];
  }, [wallColor]);

  // Door gap
  const doorWidth = 1.2;
  
  return (
    <group 
      position={position} 
      rotation={rotation} 
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      cursor={onClick ? "pointer" : "auto"}
    >
      {/* Floor area inside room (optional, if we want a different color inside) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} />
      </mesh>

      {/* Solid Wall (opposite to door) */}
      <mesh position={[0, wallHeight / 2, doorFacing === 'north' ? depth / 2 : -depth / 2]} castShadow receiveShadow material={materials}>
        <boxGeometry args={[width + wallThickness, wallHeight, wallThickness]} />
      </mesh>

      {/* Left Wall */}
      <mesh position={[-width / 2, wallHeight / 2, 0]} castShadow receiveShadow material={materials}>
        <boxGeometry args={[wallThickness, wallHeight, depth + wallThickness]} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[width / 2, wallHeight / 2, 0]} castShadow receiveShadow material={materials}>
        <boxGeometry args={[wallThickness, wallHeight, depth + wallThickness]} />
      </mesh>

      {/* Wall with Door */}
      <group 
        position={[0, wallHeight / 2, doorFacing === 'north' ? -depth / 2 : depth / 2]}
        rotation={[0, doorFacing === 'north' ? Math.PI : 0, 0]}
      >
        {/* Left piece of front wall */}
        <mesh position={[- (width / 2 - doorWidth / 2 + wallThickness) / 2 - doorWidth / 2, 0, 0]} castShadow receiveShadow material={materials}>
          <boxGeometry args={[(width - doorWidth) / 2 + wallThickness, wallHeight, wallThickness]} />
        </mesh>
        
        {/* Right piece of front wall */}
        <mesh position={[(width / 2 - doorWidth / 2 + wallThickness) / 2 + doorWidth / 2, 0, 0]} castShadow receiveShadow material={materials}>
          <boxGeometry args={[(width - doorWidth) / 2 + wallThickness, wallHeight, wallThickness]} />
        </mesh>
        
        {/* Door */}
        <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[doorWidth - 0.1, wallHeight - 0.4, 0.05]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Top piece above door */}
        <mesh position={[0, wallHeight / 2 - 0.2, 0]} castShadow receiveShadow material={materials}>
          <boxGeometry args={[doorWidth, 0.4, wallThickness]} />
        </mesh>

        {/* Small glowing arrow marker on the floor in front of the door */}
        <mesh position={[0, -wallHeight / 2 + 0.02, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.8} />
          {/* Arrow shape via text for simplicity, or just a small glow */}
        </mesh>
        <Text
          position={[0, -wallHeight / 2 + 0.03, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.4}
          color="#4ade80"
          anchorX="center"
          anchorY="center"
        >
          ^
        </Text>
      </group>

      {/* Room Number floating above */}
      <Text
        position={[0, wallHeight + 1.0, 0]}
        rotation={[-Math.PI / 4, 0, 0]}
        fontSize={1.2}
        color="#000000"
        anchorX="center"
        anchorY="center"
        fontWeight="bold"
      >
        {roomNumber}
      </Text>
    </group>
  );
}

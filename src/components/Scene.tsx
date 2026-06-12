import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import Room from './Room';
import Elevator from './Elevator';
import Marker from './Marker';

export const ROOM_COORDS: Record<string, [number, number, number]> = {
  // Top Outer
  '401': [-10, 0, -14], '402': [-6, 0, -14],
  '405': [2, 0, -14], '406': [6, 0, -14], '407': [10, 0, -14],
  // Top Inner
  '403': [-10, 0, -8], '404': [-6, 0, -8],
  '408': [2, 0, -8], '409': [6, 0, -8], '410': [10, 0, -8],
  // Bottom Inner
  '411': [-10, 0, 4], '412': [-6, 0, 4],
  '413': [-10, 0, 8], '414': [-6, 0, 8], // wait, SVG had 413,414 at y=380! Let's swap!
  // I will just rely on the IDs. The IDs don't strictly matter for layout as long as coordinates match.
  // Let's match original SVG: 411,412 are Inner (300). 413,414 are Outer (380).
  // 415,416,417 are Inner (300). 418,419,420 are Outer (380).
  '415': [2, 0, 4], '416': [6, 0, 4], '417': [10, 0, 4],
  '418': [2, 0, 10], '419': [6, 0, 10], '420': [10, 0, 10],
};

// Fix the IDs that I accidentally swapped in my comment earlier. 
// 413, 414 are at 10 (Outer).
ROOM_COORDS['413'] = [-10, 0, 10];
ROOM_COORDS['414'] = [-6, 0, 10];

function ExitBlock({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2.5, 3]} />
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <Text
        position={[0, 3.4, 0]}
        rotation={[-Math.PI / 4, 0, 0]}
        fontSize={1.2}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        EXIT
      </Text>
    </group>
  );
}

function EvacuationRoute({ startPos }: { startPos: [number, number, number] }) {
  const [x, y, z] = startPos;
  const exitX = x < 0 ? -16 : 16;
  
  let doorZ = z;
  let corridorZ = z;

  if (z === -14) { doorZ = -11.5; corridorZ = -11; }
  else if (z === -8) { doorZ = -5.5; corridorZ = -5.5; }
  else if (z === 4) { doorZ = 1.5; corridorZ = 1.5; }
  else if (z === 10) { doorZ = 7.5; corridorZ = 7.5; }

  const points = [];
  points.push(new THREE.Vector3(x, 1.5, z)); // start in room
  points.push(new THREE.Vector3(x, 1.5, doorZ)); // step out
  points.push(new THREE.Vector3(x, 1.5, corridorZ)); // enter horizontal path
  points.push(new THREE.Vector3(exitX, 1.5, corridorZ)); // walk sideways
  points.push(new THREE.Vector3(exitX, 1.5, -2)); // walk straight into the exit block at z=-2

  const lineRef = useRef<any>(null);
  useFrame((state, delta) => {
    if (lineRef.current?.material) {
      lineRef.current.material.dashOffset -= delta * 10;
    }
  });

  return (
    <group>
      <Line
        ref={lineRef}
        points={points}
        color="#ff0044"
        lineWidth={6}
        dashed={true}
        dashSize={1}
        gapSize={0.5}
      />
    </group>
  );
}

interface SceneProps {
  guestLocation?: string;
  selectedRoomId?: string | null;
  onRoomSelect?: (id: string) => void;
  activeCrisis?: any;
}

export default function Scene({ guestLocation, selectedRoomId, onRoomSelect, activeCrisis }: SceneProps) {
  const markerRoomId = guestLocation || '401';
  const markerPos = ROOM_COORDS[markerRoomId] || [-10, 0, -12];
  
  const routeOriginId = selectedRoomId || guestLocation;
  const routeStartPos = routeOriginId ? ROOM_COORDS[routeOriginId] : null;

  return (
    <group>
      {/* Base Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#8bb7ab" />
      </mesh>

      {/* Main Corridor Highlight */}
      <mesh position={[0, 0.02, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 6]} />
        <meshBasicMaterial color="#d1e5e0" />
      </mesh>
      
      {/* Top Sub-Corridor */}
      <mesh position={[0, 0.02, -11]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 2]} />
        <meshBasicMaterial color="#d1e5e0" />
      </mesh>

      {/* Bottom Sub-Corridor */}
      <mesh position={[0, 0.02, 7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 2]} />
        <meshBasicMaterial color="#d1e5e0" />
      </mesh>

      {/* Vertical Corridor Highlight */}
      <mesh position={[0, 0.02, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 28]} />
        <meshBasicMaterial color="#d1e5e0" />
      </mesh>

      <Text
        position={[0, 0.03, -2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={2}
        color="#598276"
        anchorX="center"
        anchorY="center"
        fontWeight="bold"
        letterSpacing={0.2}
      >
        MAIN CORRIDOR
      </Text>

      {Object.entries(ROOM_COORDS).map(([id, pos]) => {
        // Bottom rooms (z > 0) face north. Top rooms face south.
        const isBottomRoom = pos[2] > 0;
        const isCrisisRoom = activeCrisis?.roomNumber === id;
        return (
          <Room 
            key={id} 
            position={pos} 
            roomNumber={id} 
            doorFacing={isBottomRoom ? 'north' : 'south'}
            onClick={() => onRoomSelect?.(id)}
            isCrisis={isCrisisRoom}
          />
        );
      })}
      
      <Elevator position={[0, 0, -16]} />

      <ExitBlock position={[-16, 0, -2]} />
      <ExitBlock position={[16, 0, -2]} />

      {/* You Are Here Marker */}
      <Marker position={[markerPos[0], 2.5, markerPos[2]]} />

      {/* Evacuation Route */}
      {activeCrisis && routeStartPos && (
        <EvacuationRoute startPos={routeStartPos} />
      )}
    </group>
  );
}

import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Rotations to show each face value (1 to 6) pointing upwards (+Y)
const FACE_ROTATIONS = {
  1: [0, 0, 0],
  2: [-Math.PI / 2, 0, 0],
  3: [0, 0, Math.PI / 2],
  4: [0, 0, -Math.PI / 2],
  5: [Math.PI / 2, 0, 0],
  6: [Math.PI, 0, 0],
};

export function Dice({
  diceValue = 1,
  rollId = 0,
  canRoll = false,
  onRoll,
  position = [0, 0.5, 0],
}) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const rollProgress = useRef(1); // 0 (start roll) to 1 (rest)
  const currentRotation = useRef(new THREE.Euler(0, 0, 0));
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));
  const randomSpins = useRef({ x: 0, y: 0, z: 0 });

  // Every new roll (rollId increments) restarts the toss with fresh spin vectors
  React.useEffect(() => {
    if (!rollId) return;
    rollProgress.current = 0;
    randomSpins.current = {
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 20,
    };
  }, [rollId]);

  // Target Euler based on server dice value
  const targetEuler = useMemo(() => {
    const val = diceValue || 1;
    const [rx, ry, rz] = FACE_ROTATIONS[val] || [0, 0, 0];
    return new THREE.Euler(rx, ry, rz);
  }, [diceValue]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (rollProgress.current < 1) {
      // Advance roll animation
      rollProgress.current = Math.min(rollProgress.current + delta * 1.5, 1);
      const p = rollProgress.current;

      // Parabolic toss arc
      const tossHeight = Math.sin(p * Math.PI) * 2.2;
      meshRef.current.position.y = position[1] + tossHeight;

      // Tumbling physics-like rotation
      const spinSpeed = (1 - p) * 15;
      meshRef.current.rotation.x += (randomSpins.current.x * spinSpeed + 0.1) * delta;
      meshRef.current.rotation.y += (randomSpins.current.y * spinSpeed + 0.1) * delta;
      meshRef.current.rotation.z += (randomSpins.current.z * spinSpeed + 0.1) * delta;
    } else {
      // Settle smoothly on the authoritative face
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1], delta * 10);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetEuler.x, delta * 12);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetEuler.y, delta * 12);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetEuler.z, delta * 12);

      // Subtle float when waiting for player to roll
      if (canRoll) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 4) * 0.12 + 0.1;
      }
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (canRoll && onRoll) onRoll();
      }}
      onPointerOver={(e) => {
        if (canRoll) {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      <group ref={meshRef}>
        {/* Dice Cube Body */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial
            color={hovered && canRoll ? '#F8FAFC' : '#FFFFFF'}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>

        {/* Dice Pips for each face */}
        <DicePips />
      </group>

      {/* Floating Prompt Ring if it's the player's turn to roll */}
      {canRoll && (
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.9, 32]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.65} />
        </mesh>
      )}
    </group>
  );
}

// Generates the contrasting pips (dots) on all 6 faces of the cube
function DicePips() {
  const pipColor = '#0F172A';
  const pipRadius = 0.075;
  const pipOffset = 0.455; // Slightly outside the 0.9 cube face

  return (
    <group>
      {/* Face 1: Top (+Y) -> 1 center pip */}
      <Pip position={[0, pipOffset, 0]} rotation={[-Math.PI / 2, 0, 0]} radius={pipRadius * 1.2} color="#EF4444" />

      {/* Face 6: Bottom (-Y) -> 6 pips */}
      <group position={[0, -pipOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Pip position={[-0.22, 0.25, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[-0.22, 0, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[-0.22, -0.25, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, 0.25, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, 0, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, -0.25, 0]} radius={pipRadius} color={pipColor} />
      </group>

      {/* Face 2: Front (+Z) -> 2 pips */}
      <group position={[0, 0, pipOffset]}>
        <Pip position={[-0.22, -0.22, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, 0.22, 0]} radius={pipRadius} color={pipColor} />
      </group>

      {/* Face 5: Back (-Z) -> 5 pips */}
      <group position={[0, 0, -pipOffset]} rotation={[0, Math.PI, 0]}>
        <Pip position={[-0.22, -0.22, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, -0.22, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0, 0, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[-0.22, 0.22, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, 0.22, 0]} radius={pipRadius} color={pipColor} />
      </group>

      {/* Face 3: Right (+X) -> 3 diagonal pips */}
      <group position={[pipOffset, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Pip position={[-0.22, -0.22, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0, 0, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, 0.22, 0]} radius={pipRadius} color={pipColor} />
      </group>

      {/* Face 4: Left (-X) -> 4 corner pips */}
      <group position={[-pipOffset, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Pip position={[-0.22, -0.22, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, -0.22, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[-0.22, 0.22, 0]} radius={pipRadius} color={pipColor} />
        <Pip position={[0.22, 0.22, 0]} radius={pipRadius} color={pipColor} />
      </group>
    </group>
  );
}

function Pip({ position, rotation = [0, 0, 0], radius, color }) {
  return (
    <mesh position={position} rotation={rotation}>
      <circleGeometry args={[radius, 24]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </mesh>
  );
}

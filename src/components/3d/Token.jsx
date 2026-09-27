import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLOR_PALETTE, getToken3DPosition, TOKEN_HEIGHT_Y } from '../../constants/boardCoordinates';

export function Token({
  color,
  tokenIndex,
  step,
  isSelectable = false,
  isOwner = false,
  onSelect,
  stackOffset = [0, 0, 0],
  lastMoveEvent = null,
}) {
  const meshGroup = useRef();
  const ringRef = useRef();
  const beaconRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Active move flight tracking
  const activeMove = useRef(null);
  const lastProcessedMoveId = useRef(null);

  // Current interpolated position in 3D space
  const currentPos = useRef(new THREE.Vector3(...getToken3DPosition(color, tokenIndex, step)));
  const targetPos = useRef(new THREE.Vector3(...getToken3DPosition(color, tokenIndex, step)));

  // Update target position whenever step changes
  const [tx, ty, tz] = getToken3DPosition(color, tokenIndex, step);
  targetPos.current.set(tx + stackOffset[0], ty, tz + stackOffset[2]);

  // Detect when this specific pawn is picked up and moved
  if (
    lastMoveEvent &&
    lastMoveEvent.color === color &&
    lastMoveEvent.tokenIndex === tokenIndex &&
    lastMoveEvent.id !== lastProcessedMoveId.current
  ) {
    lastProcessedMoveId.current = lastMoveEvent.id;
    const [sx, sy, sz] = getToken3DPosition(
      color,
      tokenIndex,
      lastMoveEvent.previousStep ?? step
    );
    activeMove.current = {
      progress: 0,
      start: new THREE.Vector3(sx, sy, sz),
      target: new THREE.Vector3(tx + stackOffset[0], ty, tz + stackOffset[2]),
    };
    currentPos.current.copy(activeMove.current.start);
  }

  useFrame((state, delta) => {
    if (!meshGroup.current) return;

    let posX = currentPos.current.x;
    let posY = currentPos.current.y;
    let posZ = currentPos.current.z;

    if (activeMove.current) {
      // Advance synchronized with NPC hand (1.45s total duration)
      activeMove.current.progress = Math.min(
        activeMove.current.progress + delta * 0.69,
        1
      );
      const p = activeMove.current.progress;
      const { start, target } = activeMove.current;

      if (p < 0.22) {
        // Phase 1: NPC hand is reaching out; token stays at start position
        posX = start.x;
        posY = start.y;
        posZ = start.z;
      } else if (p < 0.78) {
        // Phase 2: NPC hand lifts pawn, carries it across the board in high arc
        const t2 = (p - 0.22) / 0.56;
        posX = THREE.MathUtils.lerp(start.x, target.x, t2);
        posZ = THREE.MathUtils.lerp(start.z, target.z, t2);
        // Parabolic arc lift matching hand height
        posY = THREE.MathUtils.lerp(start.y, target.y, t2) + Math.sin(t2 * Math.PI) * 1.8;
      } else if (p < 0.88) {
        // Phase 3: NPC hand lowers pawn onto target tile
        const t3 = (p - 0.78) / 0.1;
        posX = target.x;
        posZ = target.z;
        posY = target.y + (1 - t3) * 0.15;
      } else {
        // Phase 4: Placed firmly down; hand releases
        posX = target.x;
        posY = target.y;
        posZ = target.z;
        activeMove.current = null;
      }

      currentPos.current.set(posX, posY, posZ);
    } else {
      // Standard smooth glide to target tile
      const dist = currentPos.current.distanceTo(targetPos.current);
      const speed = dist > 2 ? 10 : 8;
      currentPos.current.lerp(targetPos.current, Math.min(delta * speed, 1));
      posX = currentPos.current.x;
      posY = currentPos.current.y;
      posZ = currentPos.current.z;

      if (dist > 0.05) {
        posY += Math.sin(Math.min(dist, 1) * Math.PI) * 0.45;
      }
    }

    // Gentle hovering idle animation if selectable
    let idleY = 0;
    if (isSelectable && !activeMove.current) {
      idleY = Math.sin(state.clock.getElapsedTime() * 4 + tokenIndex) * 0.08 + 0.08;
    }

    meshGroup.current.position.set(posX, posY + idleY, posZ);

    // Pulse selection halo ring
    if (ringRef.current && isSelectable) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 5) * 0.15;
      ringRef.current.scale.set(scale, scale, 1);
    }

    // Spin and float owner overhead diamond beacon
    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 2.5;
      beaconRef.current.position.y = 0.95 + Math.sin(state.clock.getElapsedTime() * 3 + tokenIndex) * 0.06;
    }
  });

  const theme = COLOR_PALETTE[color];

  return (
    <group
      ref={meshGroup}
      onClick={(e) => {
        e.stopPropagation();
        if (isSelectable && onSelect) {
          onSelect(tokenIndex);
        }
      }}
      onPointerOver={(e) => {
        if (isSelectable) {
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
      {/* 3D Pawn Geometry */}
      <group position={[0, 0, 0]}>
        {/* Local Player Distinctive Metallic Base Pedestal */}
        {isOwner && (
          <mesh position={[0, 0.015, 0]} castShadow>
            <cylinderGeometry args={[0.38, 0.42, 0.035, 32]} />
            <meshStandardMaterial
              color="#F8FAFC"
              metalness={0.85}
              roughness={0.15}
              emissive="#FFFFFF"
              emissiveIntensity={0.25}
            />
          </mesh>
        )}

        {/* Base Rim */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 0.1, 32]} />
          <meshStandardMaterial
            color={theme.primary}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>

        {/* Lower Body Curve */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.28, 0.25, 32]} />
          <meshStandardMaterial
            color={theme.primary}
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>

        {/* Neck Ring */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <torusGeometry args={[0.18, 0.04, 16, 32]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>

        {/* Spherical Crown */}
        <mesh position={[0, 0.54, 0]} castShadow>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial
            color={hovered && isSelectable ? theme.glow : theme.primary}
            roughness={0.15}
            metalness={0.3}
            emissive={isSelectable ? theme.primary : '#000000'}
            emissiveIntensity={isSelectable ? (hovered ? 0.8 : 0.4) : 0}
          />
        </mesh>
      </group>

      {/* Local Player "YOU" Overhead Floating Beacon */}
      {isOwner && (
        <group ref={beaconRef} position={[0, 0.92, 0]}>
          {/* Floating Diamond Indicator */}
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <octahedronGeometry args={[isSelectable ? 0.16 : 0.11, 0]} />
            <meshStandardMaterial
              color={isSelectable ? '#34D399' : theme.glow}
              emissive={isSelectable ? '#059669' : theme.primary}
              emissiveIntensity={isSelectable ? 1.6 : 0.7}
              metalness={0.5}
              roughness={0.2}
            />
          </mesh>

          {/* Bouncing pointer arrow when token is ready to move */}
          {isSelectable && (
            <group position={[0, 0.28, 0]}>
              <mesh rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.16, 0.28, 16]} />
                <meshStandardMaterial
                  color="#10B981"
                  emissive="#10B981"
                  emissiveIntensity={1.8}
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* Pulsing Selection Halo underneath Pawn */}
      {isSelectable && (
        <group position={[0, -TOKEN_HEIGHT_Y + 0.08, 0]}>
          <mesh
            ref={ringRef}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.42, 0.58, 32]} />
            <meshBasicMaterial
              color={theme.glow}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

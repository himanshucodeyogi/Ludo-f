import React from 'react';
import * as THREE from 'three';
import { COLOR_PALETTE } from '../../constants/boardCoordinates';

/**
 * 3D Ergonomic Armchair for a Player
 * @param {string} color - 'red' | 'green' | 'yellow' | 'blue'
 * @param {number[]} position - [x, y, z]
 * @param {number} rotationY - rotation in radians facing towards board center
 * @param {boolean} isCurrentTurn - whether this player currently has the turn
 */
export function Chair({ color, position = [0, 0, 0], rotationY = 0, isCurrentTurn = false }) {
  const theme = COLOR_PALETTE[color] || { primary: '#EF4444', glow: '#F87171' };

  const seatWidth = 3.6;
  const seatDepth = 3.4;
  const seatThickness = 0.55;
  const legHeight = 4.8;
  const legRadius = 0.16;
  const backHeight = 4.2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* ======================================================== */}
      {/* 1. Chair Cushion / Seat Base                             */}
      {/* ======================================================== */}
      {/* Wooden Seat Frame */}
      <mesh position={[0, legHeight + seatThickness / 2 - 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[seatWidth, 0.2, seatDepth]} />
        <meshStandardMaterial
          color="#1F120A"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Padded Player-Colored Leather Cushion */}
      <mesh position={[0, legHeight + seatThickness / 2 + 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[seatWidth * 0.94, seatThickness, seatDepth * 0.94]} />
        <meshStandardMaterial
          color={theme.primary}
          roughness={0.35}
          metalness={0.15}
          emissive={isCurrentTurn ? theme.primary : '#000000'}
          emissiveIntensity={isCurrentTurn ? 0.35 : 0}
        />
      </mesh>

      {/* Cushion Piping Trim */}
      <mesh position={[0, legHeight + seatThickness + 0.08, 0]}>
        <boxGeometry args={[seatWidth * 0.96, 0.04, seatDepth * 0.96]} />
        <meshStandardMaterial
          color="#FFFFFF"
          roughness={0.2}
          metalness={0.3}
          opacity={0.4}
          transparent
        />
      </mesh>

      {/* ======================================================== */}
      {/* 2. Chair Backrest                                        */}
      {/* ======================================================== */}
      {/* Backrest Wooden Uprights */}
      {[-seatWidth * 0.42, seatWidth * 0.42].map((x, i) => (
        <mesh key={`post-${i}`} position={[x, legHeight + backHeight / 2 + 0.2, -seatDepth * 0.44]} castShadow>
          <cylinderGeometry args={[0.14, 0.15, backHeight, 16]} />
          <meshStandardMaterial color="#24140B" roughness={0.3} metalness={0.1} />
        </mesh>
      ))}

      {/* Backrest Curved Top Rail */}
      <mesh position={[0, legHeight + backHeight + 0.15, -seatDepth * 0.44]} castShadow>
        <boxGeometry args={[seatWidth * 0.98, 0.45, 0.25]} />
        <meshStandardMaterial color="#1F120A" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Backrest Padded Cushion */}
      <mesh position={[0, legHeight + backHeight * 0.55, -seatDepth * 0.42]} castShadow receiveShadow>
        <boxGeometry args={[seatWidth * 0.8, backHeight * 0.65, 0.28]} />
        <meshStandardMaterial
          color={theme.primary}
          roughness={0.35}
          metalness={0.15}
          emissive={isCurrentTurn ? theme.primary : '#000000'}
          emissiveIntensity={isCurrentTurn ? 0.25 : 0}
        />
      </mesh>

      {/* Vertical Slats between cushion and seat */}
      {[-0.8, -0.27, 0.27, 0.8].map((sx, i) => (
        <mesh key={`slat-${i}`} position={[sx, legHeight + 0.8, -seatDepth * 0.44]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 1.2, 12]} />
          <meshStandardMaterial color="#24140B" roughness={0.3} />
        </mesh>
      ))}

      {/* ======================================================== */}
      {/* 3. Sleek Wooden Armrests                                 */}
      {/* ======================================================== */}
      {[-1, 1].map((dir, i) => (
        <group key={`armrest-${i}`} position={[dir * (seatWidth * 0.46), legHeight + 1.6, 0]}>
          {/* Horizontal Arm Rest Bar */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.24, 0.18, seatDepth * 0.8]} />
            <meshStandardMaterial color="#1F120A" roughness={0.3} metalness={0.1} />
          </mesh>
          {/* Front Support Pillar */}
          <mesh position={[0, -0.7, seatDepth * 0.32]} castShadow>
            <cylinderGeometry args={[0.1, 0.12, 1.2, 16]} />
            <meshStandardMaterial color="#24140B" roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* 4. Four Tapered Wooden Legs with Golden Brass Feet       */}
      {/* ======================================================== */}
      {[
        [-seatWidth * 0.4, -seatDepth * 0.4, 0.1, 0.1],
        [seatWidth * 0.4, -seatDepth * 0.4, -0.1, 0.1],
        [-seatWidth * 0.4, seatDepth * 0.4, 0.1, -0.1],
        [seatWidth * 0.4, seatDepth * 0.4, -0.1, -0.1],
      ].map(([lx, lz, tiltX, tiltZ], i) => (
        <group key={`chair-leg-${i}`} position={[lx, legHeight / 2, lz]} rotation={[tiltZ, 0, tiltX]}>
          {/* Main Wooden Leg */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[legRadius * 0.85, legRadius * 1.15, legHeight, 16]} />
            <meshStandardMaterial color="#1F120A" roughness={0.35} metalness={0.05} />
          </mesh>
          {/* Brass Foot Cap */}
          <mesh position={[0, -legHeight / 2 + 0.3, 0]}>
            <cylinderGeometry args={[legRadius * 1.18, legRadius * 1.22, 0.6, 16]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Turn Spotlight Aura on Floor underneath Chair */}
      {isCurrentTurn && (
        <pointLight
          position={[0, 0.5, 0]}
          intensity={0.8}
          distance={5}
          color={theme.glow}
        />
      )}
    </group>
  );
}

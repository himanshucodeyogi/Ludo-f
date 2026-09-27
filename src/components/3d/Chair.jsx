import React from 'react';
import * as THREE from 'three';
import { COLOR_PALETTE } from '../../constants/boardCoordinates';

/**
 * Luxury Modern Gaming Armchair for Players
 * Calibrated ergonomically to the new lounge gaming table
 */
export function Chair({ color, position = [0, 0, 0], rotationY = 0, isCurrentTurn = false }) {
  const theme = COLOR_PALETTE[color] || { primary: '#EF4444', glow: '#F87171' };

  const seatWidth = 3.6;
  const seatDepth = 3.4;
  const legHeight = 2.0;
  const seatCushionY = legHeight + 0.35; // 2.35
  const backHeight = 3.2;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* ======================================================== */}
      {/* 1. Curved Bucket Seat Shell & Cushion                    */}
      {/* ======================================================== */}
      {/* Ergonomic Molded Wooden Shell */}
      <mesh position={[0, seatCushionY - 0.15, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[seatWidth * 0.52, seatWidth * 0.48, 0.3, 32]} />
        <meshStandardMaterial
          color="#130B05"
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      {/* Deep Padded Player-Themed Leather Seat Cushion */}
      <mesh position={[0, seatCushionY + 0.05, 0.1]} castShadow receiveShadow>
        <cylinderGeometry args={[seatWidth * 0.48, seatWidth * 0.46, 0.4, 32]} />
        <meshStandardMaterial
          color={theme.primary}
          roughness={0.3}
          metalness={0.15}
          emissive={isCurrentTurn ? theme.primary : '#000000'}
          emissiveIntensity={isCurrentTurn ? 0.35 : 0}
        />
      </mesh>

      {/* Decorative Golden Inset Piping around Cushion */}
      <mesh position={[0, seatCushionY + 0.22, 0.1]}>
        <torusGeometry args={[seatWidth * 0.48, 0.04, 16, 32]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* ======================================================== */}
      {/* 2. Curved Ergonomic Backrest                             */}
      {/* ======================================================== */}
      <group position={[0, seatCushionY + backHeight * 0.5, -seatDepth * 0.38]}>
        {/* Curved Backrest Shell */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[seatWidth * 0.9, backHeight, 0.32]} />
          <meshStandardMaterial
            color={theme.primary}
            roughness={0.35}
            metalness={0.1}
            emissive={isCurrentTurn ? theme.primary : '#000000'}
            emissiveIntensity={isCurrentTurn ? 0.25 : 0}
          />
        </mesh>

        {/* Backrest Dark Outer Frame */}
        <mesh position={[0, 0, -0.16]}>
          <boxGeometry args={[seatWidth * 0.94, backHeight * 1.02, 0.06]} />
          <meshStandardMaterial color="#140C06" roughness={0.4} />
        </mesh>

        {/* Soft Headrest Cushion */}
        <mesh position={[0, backHeight * 0.38, 0.08]} castShadow>
          <boxGeometry args={[seatWidth * 0.6, 0.7, 0.2]} />
          <meshStandardMaterial color="#0A0F1D" roughness={0.5} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 3. Sleek Padded Armrests                                 */}
      {/* ======================================================== */}
      {[-1, 1].map((dir, i) => (
        <group key={`armrest-${i}`} position={[dir * (seatWidth * 0.52), seatCushionY + 0.85, 0.1]}>
          {/* Padded Armrest Bar */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.32, 0.16, seatDepth * 0.75]} />
            <meshStandardMaterial color="#140C06" roughness={0.4} />
          </mesh>
          {/* Leather Top Pad in Player Theme */}
          <mesh position={[0, 0.09, 0]}>
            <boxGeometry args={[0.26, 0.06, seatDepth * 0.72]} />
            <meshStandardMaterial color={theme.primary} roughness={0.3} />
          </mesh>
          {/* Vertical Armrest Support Post */}
          <mesh position={[0, -0.45, seatDepth * 0.22]} castShadow>
            <cylinderGeometry args={[0.08, 0.1, 0.8, 16]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* 4. Modern Star Swivel Base with Brass Glides             */}
      {/* ======================================================== */}
      {/* Center Swivel Pillar */}
      <mesh position={[0, legHeight * 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.28, legHeight * 0.8, 24]} />
        <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* 4 Splayed Metal Legs */}
      {[
        [-1.3, -1.3, 0.2, 0.2],
        [1.3, -1.3, -0.2, 0.2],
        [-1.3, 1.3, 0.2, -0.2],
        [1.3, 1.3, -0.2, -0.2],
      ].map(([lx, lz, rotZ, rotX], i) => (
        <group key={`chair-leg-${i}`} position={[lx * 0.55, legHeight * 0.25, lz * 0.55]} rotation={[rotX, 0, rotZ]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.1, 0.12, legHeight * 0.7, 16]} />
            <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Golden Brass Floor Glide */}
          <mesh position={[0, -legHeight * 0.35, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.85} />
          </mesh>
        </group>
      ))}

      {/* Floor Spotlight Aura when it's this player's turn */}
      {isCurrentTurn && (
        <pointLight
          position={[0, 0.8, 0]}
          intensity={1.2}
          distance={4.5}
          color={theme.glow}
        />
      )}
    </group>
  );
}

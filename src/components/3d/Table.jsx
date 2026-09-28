import React from 'react';
import * as THREE from 'three';

export const TABLE_FLOOR_Y = -4.5;

/**
 * Luxury 3D Board Game Lounge Table
 * Ergonomically calibrated so players sit naturally at the table
 */
export function Table({ boardBottomY = -0.05, floorY = TABLE_FLOOR_Y }) {
  const tableTopThickness = 0.55;
  const tableTopY = boardBottomY - tableTopThickness / 2;
  const legHeight = Math.abs(boardBottomY - tableTopThickness - floorY); // 3.9
  const legTopRadius = 0.55;
  const legBottomRadius = 0.35;
  const legY = boardBottomY - tableTopThickness - legHeight / 2;
  const legSpread = 5.8;

  return (
    <group>
      {/* ======================================================== */}
      {/* 1. Main Luxury Tabletop (Chamfered Beveled Edges)        */}
      {/* ======================================================== */}
      {/* Primary Rich Walnut Wood Tabletop */}
      <mesh position={[0, tableTopY, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[10.6, 10.8, tableTopThickness, 8]} />
        <meshStandardMaterial
          color="#1C1008" // Deep espresso walnut
          roughness={0.25}
          metalness={0.08}
        />
      </mesh>

      {/* Decorative Beveled Wooden Tabletop Edge Profile */}
      <mesh position={[0, tableTopY - 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[11.0, 10.7, tableTopThickness * 0.8, 8]} />
        <meshStandardMaterial
          color="#130B05"
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* Recessed Gaming Felt Mat around Board */}
      <mesh position={[0, boardBottomY + 0.002, 0]} receiveShadow>
        <cylinderGeometry args={[8.8, 8.8, 0.02, 32]} />
        <meshStandardMaterial
          color="#061A14" // Deep luxurious emerald gaming felt
          roughness={0.8}
          metalness={0.0}
        />
      </mesh>

      {/* Brushed Golden Brass Inlay Trim Ring */}
      <mesh position={[0, boardBottomY + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[8.7, 8.85, 64]} />
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.25}
          metalness={0.85}
        />
      </mesh>

      {/* 4 Golden Brass Corner Coasters / Token Trays */}
      {[
        [-7.5, -7.5],
        [7.5, -7.5],
        [7.5, 7.5],
        [-7.5, 7.5],
      ].map(([cx, cz], i) => (
        <group key={`coaster-${i}`} position={[cx, boardBottomY + 0.008, cz]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[1.1, 1.15, 0.04, 24]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.85} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.95, 0.95, 0.02, 24]} />
            <meshStandardMaterial color="#0A0F1D" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Under-table Support Apron */}
      <mesh position={[0, boardBottomY - tableTopThickness - 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[8.8, 9.2, 0.4, 8]} />
        <meshStandardMaterial
          color="#140C06"
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      {/* ======================================================== */}
      {/* 2. Four Angled Mid-Century Legs with Brass Glides        */}
      {/* ======================================================== */}
      {[
        [-legSpread, -legSpread, 0.08, 0.08],
        [legSpread, -legSpread, -0.08, 0.08],
        [-legSpread, legSpread, 0.08, -0.08],
        [legSpread, legSpread, -0.08, -0.08],
      ].map(([lx, lz, rotZ, rotX], i) => (
        <group key={`table-leg-${i}`} position={[lx, legY, lz]} rotation={[rotX, 0, rotZ]}>
          {/* Tapered Wood Leg */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[legTopRadius, legBottomRadius, legHeight, 24]} />
            <meshStandardMaterial
              color="#1C1008"
              roughness={0.3}
              metalness={0.05}
            />
          </mesh>

          {/* Golden Brass Top Collar */}
          <mesh position={[0, legHeight / 2 - 0.15, 0]}>
            <cylinderGeometry args={[legTopRadius * 1.1, legTopRadius * 1.05, 0.35, 24]} />
            <meshStandardMaterial
              color="#D4AF37"
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>

          {/* Golden Brass Bottom Foot Cap */}
          <mesh position={[0, -legHeight / 2 + 0.35, 0]}>
            <cylinderGeometry args={[legBottomRadius * 1.05, legBottomRadius * 1.2, 0.7, 24]} />
            <meshStandardMaterial
              color="#D4AF37"
              roughness={0.2}
              metalness={0.85}
            />
          </mesh>
        </group>
      ))}

      {/* Cross-stretcher bars between legs (cylinders are vertical by default, so lay them along X and Z) */}
      <mesh position={[0, legY - 0.4, 0]} rotation={[0, 0, Math.PI / 2]} receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, legSpread * 2.1, 16]} />
        <meshStandardMaterial color="#140C06" roughness={0.4} />
      </mesh>
      <mesh position={[0, legY - 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, legSpread * 2.1, 16]} />
        <meshStandardMaterial color="#140C06" roughness={0.4} />
      </mesh>

      {/* ======================================================== */}
      {/* 3. Luxury Lounge Circular Rug on Floor                   */}
      {/* ======================================================== */}
      <mesh
        position={[0, floorY + 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <ringGeometry args={[0, 16.5, 64]} />
        <meshStandardMaterial
          color="#0B1322" // Dark slate lounge rug
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
      {/* Rug Gold Border */}
      <mesh
        position={[0, floorY + 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <ringGeometry args={[16.3, 16.5, 64]} />
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Room Floor Plane */}
      <mesh
        position={[0, floorY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          color="#030712"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

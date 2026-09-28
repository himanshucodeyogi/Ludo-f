import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  CIRCUIT_GRID,
  COLOR_PALETTE,
  gridToWorld,
  SAFE_CIRCUIT_TILES,
  START_TILES,
  CELL_SIZE
} from '../../constants/boardCoordinates';

// Star Shape for Safe Zone 3D geometry
function createStarShape(outerRadius = 0.32, innerRadius = 0.15, numPoints = 5) {
  const shape = new THREE.Shape();
  const step = Math.PI / numPoints;
  for (let i = 0; i < 2 * numPoints; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function Board({ localPlayerColor, activeColors }) {
  const starShape = useMemo(() => createStarShape(), []);
  const isColorActive = (color) => !activeColors || activeColors.length === 0 || activeColors.includes(color);

  return (
    <group position={[0, 0, 0]}>
      {/* Heavy Board Base / Frame */}
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[16.2, 0.5, 16.2]} />
        <meshStandardMaterial color="#1E293B" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Board Playing Surface Rim */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[15.2, 0.04, 15.2]} />
        <meshStandardMaterial color="#0F172A" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* 4 Quadrant Home Bases with Active/Inactive and Owner Highlight */}
      <BaseCorner color="red" centerCol={2.75} centerRow={2.75} isOwner={localPlayerColor === 'red'} isActive={isColorActive('red')} />
      <BaseCorner color="green" centerCol={11.25} centerRow={2.75} isOwner={localPlayerColor === 'green'} isActive={isColorActive('green')} />
      <BaseCorner color="yellow" centerCol={11.25} centerRow={11.25} isOwner={localPlayerColor === 'yellow'} isActive={isColorActive('yellow')} />
      <BaseCorner color="blue" centerCol={2.75} centerRow={11.25} isOwner={localPlayerColor === 'blue'} isActive={isColorActive('blue')} />

      {/* 52 Perimeter Circuit Tiles */}
      {CIRCUIT_GRID.map(([col, row], index) => {
        const [x, y, z] = gridToWorld(col, row, 0.05);
        const isSafe = SAFE_CIRCUIT_TILES.has(index);

        // Check if starting tile
        let tileColor = '#FFFFFF';
        if (index === START_TILES.red) tileColor = COLOR_PALETTE.red.primary;
        else if (index === START_TILES.green) tileColor = COLOR_PALETTE.green.primary;
        else if (index === START_TILES.yellow) tileColor = COLOR_PALETTE.yellow.primary;
        else if (index === START_TILES.blue) tileColor = COLOR_PALETTE.blue.primary;

        return (
          <group key={`circuit-${index}`} position={[x, y, z]}>
            <mesh receiveShadow>
              <boxGeometry args={[CELL_SIZE * 0.92, 0.06, CELL_SIZE * 0.92]} />
              <meshStandardMaterial
                color={tileColor}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>

            {/* Star Icon for Safe Zones */}
            {isSafe && (
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.035, 0]}
              >
                <shapeGeometry args={[starShape]} />
                <meshStandardMaterial
                  color="#FBBF24"
                  emissive="#D97706"
                  emissiveIntensity={0.6}
                  roughness={0.2}
                />
              </mesh>
            )}
          </group>
        );
      })}

      {/* Home Stretches (5 tiles each colored) */}
      <HomeStretch color="red" tiles={[[1,7],[2,7],[3,7],[4,7],[5,7]]} />
      <HomeStretch color="green" tiles={[[7,1],[7,2],[7,3],[7,4],[7,5]]} />
      <HomeStretch color="yellow" tiles={[[13,7],[12,7],[11,7],[10,7],[9,7]]} />
      <HomeStretch color="blue" tiles={[[7,13],[7,12],[7,11],[7,10],[7,9]]} />

      {/* Center Home Triangles */}
      <CenterHome />
    </group>
  );
}

// 4 Corner Bases with Inset Token Pits
function BaseCorner({ color, centerCol, centerRow, isOwner = false, isActive = true }) {
  const [bx, by, bz] = gridToWorld(centerCol, centerRow, 0.06);
  const theme = COLOR_PALETTE[color];

  return (
    <group position={[bx, by, bz]}>
      {/* Outer Colored Square */}
      <mesh receiveShadow>
        <boxGeometry args={[5.7, 0.08, 5.7]} />
        <meshStandardMaterial
          color={isActive ? theme.primary : '#1E293B'}
          roughness={0.45}
          metalness={0.1}
          opacity={isActive ? 1.0 : 0.5}
          transparent={!isActive}
        />
      </mesh>

      {/* If this is the local player's home base: Golden glowing perimeter rim */}
      {isOwner && (
        <group position={[0, 0.05, 0]}>
          <mesh>
            <boxGeometry args={[5.88, 0.04, 5.88]} />
            <meshStandardMaterial
              color="#FBBF24"
              emissive="#F59E0B"
              emissiveIntensity={0.8}
              wireframe
            />
          </mesh>
        </group>
      )}

      {/* Inner White Recessed Platform */}
      <mesh position={[0, 0.045, 0]} receiveShadow>
        <boxGeometry args={[4.4, 0.02, 4.4]} />
        <meshStandardMaterial
          color={isActive ? '#FFFFFF' : '#0F172A'}
          roughness={0.3}
          opacity={isActive ? 1.0 : 0.4}
          transparent={!isActive}
        />
      </mesh>

      {/* 4 Token Recessed Sockets */}
      {[
        [-1.0, -1.0],
        [1.0, -1.0],
        [-1.0, 1.0],
        [1.0, 1.0],
      ].map(([ox, oz], i) => (
        <group key={`socket-${i}`} position={[ox * 1.05, 0.058, oz * 1.05]}>
          <mesh receiveShadow>
            <cylinderGeometry args={[0.52, 0.52, 0.02, 32]} />
            <meshStandardMaterial
              color={isActive ? theme.primary : '#1E293B'}
              roughness={0.4}
            />
          </mesh>
          {isActive && (
            <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.35, 0.5, 32]} />
              <meshBasicMaterial color="#FFFFFF" opacity={0.6} transparent />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// 5-tile Home Run Path
function HomeStretch({ color, tiles }) {
  const theme = COLOR_PALETTE[color];
  return (
    <group>
      {tiles.map(([col, row], i) => {
        const [x, y, z] = gridToWorld(col, row, 0.055);
        return (
          <mesh key={`${color}-stretch-${i}`} position={[x, y, z]} receiveShadow>
            <boxGeometry args={[CELL_SIZE * 0.92, 0.07, CELL_SIZE * 0.92]} />
            <meshStandardMaterial
              color={theme.primary}
              roughness={0.25}
              metalness={0.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Central Home Finish (4 Triangles meeting in center)
function CenterHome() {
  const triangleGeo = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    // 3 vertices: Center (0, 0, 0), Top-Left, Top-Right
    const vertices = new Float32Array([
      0, 0.06, 0,
      -1.35, 0.06, -1.35,
      1.35, 0.06, -1.35
    ]);
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Central Center Podium */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.6, 0.8, 0.06, 32]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Red Home Triangle (Facing Left) */}
      <mesh geometry={triangleGeo} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color={COLOR_PALETTE.red.primary} roughness={0.3} />
      </mesh>

      {/* Green Home Triangle (Facing Top) */}
      <mesh geometry={triangleGeo} rotation={[0, 0, 0]}>
        <meshStandardMaterial color={COLOR_PALETTE.green.primary} roughness={0.3} />
      </mesh>

      {/* Yellow Home Triangle (Facing Right) */}
      <mesh geometry={triangleGeo} rotation={[0, -Math.PI / 2, 0]}>
        <meshStandardMaterial color={COLOR_PALETTE.yellow.primary} roughness={0.3} />
      </mesh>

      {/* Blue Home Triangle (Facing Bottom) */}
      <mesh geometry={triangleGeo} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial color={COLOR_PALETTE.blue.primary} roughness={0.3} />
      </mesh>
    </group>
  );
}

import React, { useMemo, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Board } from './Board';
import { Table, TABLE_FLOOR_Y } from './Table';
import { Chair } from './Chair';
import { HumanNPC } from './HumanNPC';
import { Token } from './Token';
import { Dice } from './Dice';
import { PLAYER_COLORS } from '../../constants/boardCoordinates';

// Camera viewpoints placing player's home base right in front
const CAMERA_PERSPECTIVES = {
  red: [-8.0, 11.5, -8.0],
  green: [8.0, 11.5, -8.0],
  yellow: [8.0, 11.5, 8.0],
  blue: [-8.0, 11.5, 8.0],
};

// Chairs arranged at 4 corners facing their respective home base and board center
const CHAIR_CONFIGS = {
  red: {
    position: [-8.8, TABLE_FLOOR_Y, -8.8],
    rotationY: Math.PI / 4, // Faces towards [0, 0, 0]
  },
  green: {
    position: [8.8, TABLE_FLOOR_Y, -8.8],
    rotationY: -Math.PI / 4,
  },
  yellow: {
    position: [8.8, TABLE_FLOOR_Y, 8.8],
    rotationY: -Math.PI * 0.75,
  },
  blue: {
    position: [-8.8, TABLE_FLOOR_Y, 8.8],
    rotationY: Math.PI * 0.75,
  },
};

// Overhead ceiling pendant lamp fixture
function PendantLamp() {
  return (
    <group position={[0, 11, 0]}>
      {/* Ceiling Hanging Cord */}
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 9, 12]} />
        <meshStandardMaterial color="#0F172A" roughness={0.4} />
      </mesh>

      {/* Modern Matte Black & Brass Lampshade */}
      <mesh position={[0, 0, 0]} castShadow>
        <coneGeometry args={[1.75, 1.25, 32, 1, true]} />
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.25}
          metalness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Glowing Warm Light Bulb */}
      <mesh position={[0, -0.22, 0]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#FDE047"
          emissiveIntensity={2.5}
        />
      </mesh>
    </group>
  );
}

function CameraController({ playerColor }) {
  const { camera } = useThree();
  const alignedColor = useRef(null);

  useEffect(() => {
    if (playerColor && CAMERA_PERSPECTIVES[playerColor] && alignedColor.current !== playerColor) {
      const [x, y, z] = CAMERA_PERSPECTIVES[playerColor];
      camera.position.set(x, y, z);
      camera.lookAt(0, 0, 0);
      alignedColor.current = playerColor;
    }
  }, [playerColor, camera]);

  return null;
}

export function Scene({
  roomState,
  localPlayer,
  isMyTurn,
  canRoll,
  isRolling,
  lastMoveEvent,
  onRollDice,
  onMoveToken,
}) {
  const { tokens, validMoves } = roomState;

  // Compute slight stacking offsets for tokens occupying the exact same position
  const stackOffsets = useMemo(() => {
    const offsets = {};
    const stepOccupancy = {};

    // Only stack offset active tokens on the circuit for colors in this match
    Object.keys(tokens).forEach((color) => {
      tokens[color]?.forEach((step, idx) => {
        // Only stack offset active tokens on the circuit (steps >= 0 && steps <= 50)
        if (step >= 0 && step <= 50) {
          const key = `${color}-${step}`;
          if (!stepOccupancy[key]) stepOccupancy[key] = [];
          stepOccupancy[key].push({ color, idx });
        }
      });
    });

    Object.values(stepOccupancy).forEach((group) => {
      if (group.length > 1) {
        group.forEach((item, i) => {
          const angle = (i / group.length) * Math.PI * 2;
          const rad = 0.22;
          offsets[`${item.color}-${item.idx}`] = [
            Math.cos(angle) * rad,
            0,
            Math.sin(angle) * rad,
          ];
        });
      }
    });

    return offsets;
  }, [tokens]);

  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        shadows
        camera={{ position: [0, 16, 12], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#090D16']} />

        {/* Adjust camera perspective to player's home quadrant */}
        <CameraController playerColor={localPlayer?.color} />

        {/* ======================================================== */}
        {/* Warm Studio / Lounge Atmospheric Lighting               */}
        {/* ======================================================== */}
        {/* Soft Ambient Fill */}
        <ambientLight intensity={0.42} color="#F1F5F9" />

        {/* Primary Warm Sun/Window Key Light */}
        <directionalLight
          position={[14, 24, 16]}
          intensity={1.15}
          color="#FFF7ED"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={60}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-bias={-0.0001}
        />

        {/* Cool Rim/Fill Light from opposite angle */}
        <directionalLight
          position={[-14, 18, -14]}
          intensity={0.45}
          color="#93C5FD"
        />

        {/* Hanging Pendant Lamp Fixture */}
        <PendantLamp />

        {/* Focused Warm Tabletop Spotlight */}
        <spotLight
          position={[0, 10.8, 0]}
          intensity={2.5}
          angle={0.75}
          penumbra={0.65}
          color="#FEF3C7"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        {/* Diffuse Center Point Light */}
        <pointLight position={[0, 9.8, 0]} intensity={1.2} distance={22} color="#FDE68A" />

        {/* Board Geometry with local player base highlight & active quadrants */}
        <Board localPlayerColor={localPlayer?.color} activeColors={Object.keys(tokens)} />

        {/* 3D Wooden Table Underneath the Ludo Board */}
        <Table boardBottomY={-0.05} />

        {/* 3D Chairs and Seated Human NPCs for active players around the table */}
        {Object.keys(tokens).map((color) => {
          const cfg = CHAIR_CONFIGS[color];
          if (!cfg) return null;
          const isTurn = roomState.currentTurnColor === color;
          return (
            <React.Fragment key={`player-station-${color}`}>
              <Chair
                color={color}
                position={cfg.position}
                rotationY={cfg.rotationY}
                isCurrentTurn={isTurn}
              />
              <HumanNPC
                color={color}
                chairPosition={cfg.position}
                chairRotationY={cfg.rotationY}
                isCurrentTurn={isTurn}
                moveAction={lastMoveEvent}
              />
            </React.Fragment>
          );
        })}

        {/* Render tokens ONLY for active colors in this match */}
        {Object.entries(tokens).map(([color, colorTokens]) => {
          if (!colorTokens || colorTokens.length === 0) return null;
          return colorTokens.map((step, idx) => {
            const isOwner = localPlayer?.color === color;
            const isSelectable =
              isMyTurn &&
              isOwner &&
              validMoves?.includes(idx);

            const offset = stackOffsets[`${color}-${idx}`] || [0, 0, 0];

            return (
              <Token
                key={`${color}-token-${idx}`}
                color={color}
                tokenIndex={idx}
                step={step}
                isSelectable={isSelectable}
                isOwner={isOwner}
                onSelect={onMoveToken}
                stackOffset={offset}
                lastMoveEvent={lastMoveEvent}
              />
            );
          });
        })}

        {/* Center 3D Interactive Dice */}
        <Dice
          position={[0, 0.5, 0]}
          diceValue={roomState.diceValue}
          isRolling={isRolling}
          canRoll={canRoll}
          onRoll={onRollDice}
        />

        {/* Realistic Contact Shadows on Tabletop Surface */}
        <ContactShadows
          position={[0, -0.49, 0]}
          opacity={0.7}
          scale={26}
          blur={1.6}
          far={8}
        />

        {/* Smooth OrbitControls with constrained polar angle */}
        <OrbitControls
          makeDefault
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2} // Prevent viewing from underneath
          minDistance={10}
          maxDistance={28}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}

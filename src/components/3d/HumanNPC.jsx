import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLOR_PALETTE, getToken3DPosition } from '../../constants/boardCoordinates';
import { TABLE_FLOOR_Y } from './Table';

/**
 * 2-Segment Inverse Kinematics helper
 * Computes exact elbow position E and orientations between Shoulder S and Target Hand H
 */
function solveIK(S, H, L1, L2, poleDir) {
  const toHand = new THREE.Vector3().subVectors(H, S);
  const dist = toHand.length();
  const dir = dist > 0.001 ? toHand.clone().divideScalar(dist) : new THREE.Vector3(0, 0, 1);

  if (dist >= L1 + L2) {
    // Fully extended towards target
    const E = S.clone().addScaledVector(dir, L1);
    return { E, L1Actual: L1, L2Actual: Math.max(L2, dist - L1), dir1: dir, dir2: dir };
  }

  // Law of Cosines for interior triangle angles
  const d1 = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const hSq = Math.max(0, L1 * L1 - d1 * d1);
  const h = Math.sqrt(hSq);

  // Perpendicular bend direction using pole vector (outward and slightly down)
  let perp = new THREE.Vector3().crossVectors(dir, poleDir);
  if (perp.lengthSq() < 0.001) {
    perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
  }
  const bendNorm = new THREE.Vector3().crossVectors(perp, dir).normalize();

  const E = S.clone().addScaledVector(dir, d1).addScaledVector(bendNorm, h);
  const dir1 = new THREE.Vector3().subVectors(E, S).normalize();
  const dir2 = new THREE.Vector3().subVectors(H, E).normalize();

  return { E, L1Actual: L1, L2Actual: L2, dir1, dir2 };
}

// Default upright vector for cylinder alignment
const UP_VEC = new THREE.Vector3(0, 1, 0);

/**
 * 3D Human Avatar (NPC) seated on chair
 * Reaches out with hand to pick up, carry, and place their pawn during turns
 */
export function HumanNPC({
  color,
  chairPosition,
  chairRotationY,
  isCurrentTurn = false,
  moveAction = null,
}) {
  const rootGroupRef = useRef();
  const spineGroupRef = useRef();
  const headRef = useRef();
  const eyeLeftRef = useRef();
  const eyeRightRef = useRef();

  // Arm IK meshes
  const upperArmMeshRef = useRef();
  const elbowSphereRef = useRef();
  const forearmMeshRef = useRef();
  const handGroupRef = useRef();
  const fingersRef = useRef([]);

  const theme = COLOR_PALETTE[color] || { primary: '#EF4444', glow: '#F87171' };

  // Animation timeline state: 0 (start reach) to 1 (finished placing and returned)
  const animTime = useRef(1);
  const currentAction = useRef(null);

  // Trigger pickup animation when moveAction changes for this color
  useEffect(() => {
    if (moveAction && moveAction.color === color) {
      currentAction.current = moveAction;
      animTime.current = 0; // Trigger animation
    }
  }, [moveAction, color]);

  // Seated dimensions relative to chair base (chairPosition)
  const seatSurfaceY = 5.35; // Top surface of chair cushion

  // Arm segment lengths
  const L1 = 3.2;
  const L2 = 3.0;

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Natural resting arm positions relative to character spine
    const restHand = new THREE.Vector3(1.3, seatSurfaceY + 1.6, 1.2);
    let targetHandLocal = restHand.clone();
    let reachFactor = 0;
    let fingerGrip = 0;

    if (animTime.current < 1) {
      // 1.45 seconds total duration for reach -> pick -> move -> place -> return
      animTime.current = Math.min(animTime.current + delta * 0.69, 1);
      const p = animTime.current;

      const prevStep = currentAction.current?.previousStep ?? -1;
      const newStep = currentAction.current?.newStep ?? 0;
      const tokenIdx = currentAction.current?.tokenIndex ?? 0;

      // World positions of start and destination pawns
      const [sx, sy, sz] = getToken3DPosition(color, tokenIdx, prevStep);
      const [tx, ty, tz] = getToken3DPosition(color, tokenIdx, newStep);

      // Convert world positions to NPC root local coordinate space
      const startLocal = new THREE.Vector3(sx, sy, sz);
      const targetLocal = new THREE.Vector3(tx, ty, tz);
      if (rootGroupRef.current) {
        rootGroupRef.current.updateWorldMatrix(true, false);
        rootGroupRef.current.worldToLocal(startLocal);
        rootGroupRef.current.worldToLocal(targetLocal);
      }

      // Height of pawn crown to grasp
      startLocal.y += 0.55;
      targetLocal.y += 0.55;

      if (p < 0.22) {
        // Phase 1: Torso leans forward, hand reaches to pawn crown
        const t1 = p / 0.22;
        reachFactor = Math.sin(t1 * Math.PI * 0.5);
        fingerGrip = 0; // Fingers open ready to grasp
        targetHandLocal.lerpVectors(restHand, startLocal, reachFactor);
      } else if (p < 0.78) {
        // Phase 2: Grasp pawn, lift up into parabolic arc, fly to target tile
        const t2 = (p - 0.22) / 0.56;
        reachFactor = 1;
        fingerGrip = 1; // Fingers tightly holding pawn crown
        targetHandLocal.lerpVectors(startLocal, targetLocal, t2);
        // High parabolic arc lift
        targetHandLocal.y += Math.sin(t2 * Math.PI) * 1.8;
      } else if (p < 0.88) {
        // Phase 3: Lower pawn gently onto destination tile and release
        const t3 = (p - 0.78) / 0.1;
        reachFactor = 1 - t3 * 0.3;
        fingerGrip = 1 - t3; // Fingers opening
        targetHandLocal.copy(targetLocal);
        targetHandLocal.y += (1 - t3) * 0.15;
      } else {
        // Phase 4: Torso leans back, hand returns to comfortable resting pose
        const t4 = (p - 0.88) / 0.12;
        reachFactor = 1 - t4;
        fingerGrip = 0;
        targetHandLocal.lerpVectors(targetLocal, restHand, t4);
      }
    } else {
      // Idle resting pose with subtle breathing
      const breath = Math.sin(time * 2.2 + (color === 'red' ? 0 : 1.5)) * 0.04;
      targetHandLocal.y += breath;
      reachFactor = 0;
      fingerGrip = 0;
    }

    // Dynamic Torso / Spine leaning
    const baseLean = isCurrentTurn ? 0.08 : 0;
    const idleBreath = Math.sin(time * 2.2) * 0.015;
    const spinePitch = baseLean + reachFactor * 0.42 + idleBreath;
    const spineZOffset = reachFactor * 1.5; // Lean forward across table

    if (spineGroupRef.current) {
      spineGroupRef.current.rotation.x = spinePitch;
      spineGroupRef.current.position.z = 0.2 + spineZOffset;
      spineGroupRef.current.position.y = seatSurfaceY;
    }

    // Shoulder anchor position in local root space
    const shoulderLocal = new THREE.Vector3(
      1.15,
      seatSurfaceY + 2.7 - reachFactor * 0.35,
      0.35 + spineZOffset + Math.sin(spinePitch) * 2.2
    );

    // Solve 2-Bone Arm IK
    const poleDir = new THREE.Vector3(0.8, -0.6, 0.2).normalize();
    const ik = solveIK(shoulderLocal, targetHandLocal, L1, L2, poleDir);

    // 1. Upper Arm Mesh between Shoulder S and Elbow E
    if (upperArmMeshRef.current) {
      const mid1 = new THREE.Vector3().addVectors(shoulderLocal, ik.E).multiplyScalar(0.5);
      upperArmMeshRef.current.position.copy(mid1);
      upperArmMeshRef.current.quaternion.setFromUnitVectors(UP_VEC, ik.dir1);
      upperArmMeshRef.current.scale.set(1, ik.L1Actual / L1, 1);
    }

    // 2. Elbow Joint Sphere
    if (elbowSphereRef.current) {
      elbowSphereRef.current.position.copy(ik.E);
    }

    // 3. Forearm Mesh between Elbow E and Hand H
    if (forearmMeshRef.current) {
      const mid2 = new THREE.Vector3().addVectors(ik.E, targetHandLocal).multiplyScalar(0.5);
      forearmMeshRef.current.position.copy(mid2);
      forearmMeshRef.current.quaternion.setFromUnitVectors(UP_VEC, ik.dir2);
      forearmMeshRef.current.scale.set(1, ik.L2Actual / L2, 1);
    }

    // 4. Hand Group at targetHandLocal
    if (handGroupRef.current) {
      handGroupRef.current.position.copy(targetHandLocal);
      handGroupRef.current.quaternion.setFromUnitVectors(UP_VEC, ik.dir2);
    }

    // 5. Fingers grasp / open animation
    fingersRef.current.forEach((fingerMesh) => {
      if (fingerMesh) {
        fingerMesh.rotation.x = 0.3 + fingerGrip * 0.7;
      }
    });

    // 6. Head and Eyes look at hand / board
    if (headRef.current) {
      if (reachFactor > 0.05) {
        headRef.current.rotation.x = 0.35 * reachFactor;
        headRef.current.rotation.y = (targetHandLocal.x > 0 ? 0.12 : -0.12) * reachFactor;
      } else {
        headRef.current.rotation.x = THREE.MathUtils.lerp(
          headRef.current.rotation.x,
          0.12 + Math.sin(time * 0.8) * 0.04,
          delta * 4
        );
        headRef.current.rotation.y = THREE.MathUtils.lerp(
          headRef.current.rotation.y,
          Math.sin(time * 0.6) * 0.06,
          delta * 4
        );
      }
    }
  });

  const skinColor = '#FBD8B5';
  const pantsColor = '#1E293B';
  const hairColor =
    color === 'yellow'
      ? '#451A03'
      : color === 'red'
      ? '#0F172A'
      : color === 'green'
      ? '#1E1B4B'
      : '#312E81';

  return (
    <group ref={rootGroupRef} position={chairPosition} rotation={[0, chairRotationY, 0]}>
      {/* ======================================================== */}
      {/* 1. Lower Body & Legs (Seated on Chair)                   */}
      {/* ======================================================== */}
      <group position={[0, seatSurfaceY, 0.2]}>
        {/* Hips / Pelvis */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[2.0, 0.7, 1.5]} />
          <meshStandardMaterial color={pantsColor} roughness={0.5} />
        </mesh>

        {/* Thighs extending horizontally forward resting on chair */}
        {[-0.58, 0.58].map((tx, i) => (
          <group key={`thigh-${i}`} position={[tx, 0.35, 0.85]}>
            {/* Horizontal Thigh */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.78, 0.65, 1.8]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Knee Joint */}
            <mesh position={[0, -0.05, 0.95]} castShadow>
              <sphereGeometry args={[0.38, 16, 16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Vertical Lower Leg / Shin going down to floor */}
            <mesh position={[0, -2.45, 0.95]} castShadow>
              <cylinderGeometry args={[0.34, 0.28, 4.6, 16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Sneaker / Shoe resting flat on the floor */}
            <group position={[0, -4.95, 1.25]}>
              <mesh castShadow>
                <boxGeometry args={[0.72, 0.5, 1.45]} />
                <meshStandardMaterial color={theme.primary} roughness={0.3} />
              </mesh>
              {/* White Rubber Sneaker Sole */}
              <mesh position={[0, -0.22, 0]}>
                <boxGeometry args={[0.76, 0.12, 1.5]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 2. Torso, Head & Left Resting Arm (Pivots at Spine)      */}
      {/* ======================================================== */}
      <group ref={spineGroupRef} position={[0, seatSurfaceY, 0.2]}>
        {/* Main Chest & Hoodie */}
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[2.2, 2.4, 1.4]} />
          <meshStandardMaterial
            color={theme.primary}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>

        {/* White Drawstrings / Zipper Detail */}
        <mesh position={[0, 1.45, 0.72]}>
          <boxGeometry args={[0.14, 1.6, 0.04]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>

        {/* Hoodie Collar Ring */}
        <mesh position={[0, 2.65, 0.1]} rotation={[Math.PI / 8, 0, 0]}>
          <torusGeometry args={[0.55, 0.16, 16, 24]} />
          <meshStandardMaterial color={theme.primary} roughness={0.4} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 2.85, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.28, 0.5, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>

        {/* ======================================================== */}
        {/* Head & Stylized Face                                     */}
        {/* ======================================================== */}
        <group ref={headRef} position={[0, 3.6, 0]}>
          {/* Head Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.72, 32, 32]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} />
          </mesh>

          {/* Stylized Modern Hair / Beanie Cap */}
          <mesh position={[0, 0.22, -0.06]} castShadow>
            <sphereGeometry args={[0.76, 24, 24]} />
            <meshStandardMaterial color={hairColor} roughness={0.4} />
          </mesh>

          {/* Two Expressive Stylized Eyes looking down towards board */}
          {[-0.25, 0.25].map((ex, i) => (
            <group key={`eye-${i}`} position={[ex, 0.08, 0.64]}>
              {/* White Sclera */}
              <mesh>
                <sphereGeometry args={[0.11, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
              </mesh>
              {/* Dark Pupil */}
              <mesh position={[0, -0.02, 0.07]}>
                <sphereGeometry args={[0.065, 16, 16]} />
                <meshStandardMaterial color="#0F172A" roughness={0.1} />
              </mesh>
              {/* Eye Specular Glimmer */}
              <mesh position={[0.02, 0.02, 0.12]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </group>
          ))}

          {/* Smile / Mouth */}
          <mesh position={[0, -0.24, 0.65]}>
            <boxGeometry args={[0.22, 0.04, 0.04]} />
            <meshStandardMaterial color="#7C2D12" roughness={0.3} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* Left Arm (Resting on Table / Armrest)                    */}
        {/* ======================================================== */}
        <group position={[-1.25, 2.3, 0]}>
          {/* Shoulder Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.36, 16, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          {/* Left Upper Arm */}
          <mesh position={[-0.1, -0.9, 0.25]} rotation={[0.4, 0, 0.15]} castShadow>
            <cylinderGeometry args={[0.26, 0.24, 1.7, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          {/* Left Forearm resting forward */}
          <mesh position={[-0.1, -1.6, 1.05]} rotation={[1.1, 0, 0.15]} castShadow>
            <cylinderGeometry args={[0.24, 0.22, 1.5, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          {/* Left Hand */}
          <mesh position={[-0.1, -1.9, 1.85]} castShadow>
            <boxGeometry args={[0.42, 0.2, 0.55]} />
            <meshStandardMaterial color={skinColor} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 3. Right Action Arm (Full Inverse Kinematics Chain)      */}
      {/* ======================================================== */}
      {/* Upper Arm Cylinder (between Shoulder and Elbow) */}
      <mesh ref={upperArmMeshRef} castShadow>
        <cylinderGeometry args={[0.26, 0.23, L1, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Elbow Joint Sphere */}
      <mesh ref={elbowSphereRef} castShadow>
        <sphereGeometry args={[0.27, 16, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Forearm Cylinder (between Elbow and Hand) */}
      <mesh ref={forearmMeshRef} castShadow>
        <cylinderGeometry args={[0.23, 0.20, L2, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Hand Group (Grip / Placing Hand) */}
      <group ref={handGroupRef}>
        {/* Palm Sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.3} />
        </mesh>
        {/* Grasping Fingers around Pawn Crown */}
        {[-0.12, 0, 0.12].map((fx, i) => (
          <mesh
            key={`finger-${i}`}
            ref={(el) => (fingersRef.current[i] = el)}
            position={[fx, -0.1, 0.14]}
            castShadow
          >
            <cylinderGeometry args={[0.065, 0.055, 0.35, 8]} />
            <meshStandardMaterial color={skinColor} roughness={0.3} />
          </mesh>
        ))}
        {/* Thumb */}
        <mesh position={[0.2, 0.02, -0.05]} rotation={[-0.4, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.065, 0.32, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

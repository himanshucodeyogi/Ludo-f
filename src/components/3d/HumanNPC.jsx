import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLOR_PALETTE, getToken3DPosition } from '../../constants/boardCoordinates';
import { TABLE_FLOOR_Y } from './Table';

/**
 * 2-Segment Inverse Kinematics with twist-free orthonormal orientation
 */
function solveIK(S, H, L1, L2, poleDir) {
  const toHand = new THREE.Vector3().subVectors(H, S);
  const dist = toHand.length();
  const dir = dist > 0.001 ? toHand.clone().divideScalar(dist) : new THREE.Vector3(0, 0, 1);

  if (dist >= L1 + L2) {
    // Fully extended towards target
    const E = S.clone().addScaledVector(dir, L1);
    return { E, L1Actual: L1, L2Actual: Math.max(L2, dist - L1), dir };
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
  return { E, L1Actual: L1, L2Actual: L2, dir };
}

/**
 * Positions and orients a cylinder between two points using a twist-free orthonormal frame
 */
const tmpMid = new THREE.Vector3();
const tmpDir = new THREE.Vector3();
const tmpSide = new THREE.Vector3();
const tmpNorm = new THREE.Vector3();
const tmpMatrix = new THREE.Matrix4();

function orientBone(mesh, pStart, pEnd, defaultLen, pole) {
  if (!mesh) return;
  tmpDir.subVectors(pEnd, pStart);
  const len = tmpDir.length();
  if (len < 0.001) return;
  tmpDir.divideScalar(len);

  // Midpoint
  tmpMid.addVectors(pStart, pEnd).multiplyScalar(0.5);
  mesh.position.copy(tmpMid);

  // Orthonormal basis with cylinder along Y axis
  tmpSide.crossVectors(tmpDir, pole).normalize();
  if (tmpSide.lengthSq() < 0.001) {
    tmpSide.set(1, 0, 0);
  }
  tmpNorm.crossVectors(tmpSide, tmpDir).normalize();

  tmpMatrix.makeBasis(tmpSide, tmpDir, tmpNorm);
  mesh.quaternion.setFromRotationMatrix(tmpMatrix);
  mesh.scale.set(1, len / defaultLen, 1);
}

/**
 * 3D Human Avatar (NPC) seated on chair
 * Large, expressive, athletic proportions with realistic overhand pawn pickup & placement
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

  // Arm IK meshes
  const rightShoulderRef = useRef();
  const upperArmMeshRef = useRef();
  const elbowSphereRef = useRef();
  const forearmMeshRef = useRef();
  const handGroupRef = useRef();
  const fingerMeshesRef = useRef([]);

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

  // Seated dimensions relative to chair base
  const seatSurfaceY = 5.4; // Top surface of chair cushion

  // Arm segment lengths (enlarged for substantial reach)
  const L1 = 3.6;
  const L2 = 3.2;

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Resting hand position on the table next to the board
    const restHand = new THREE.Vector3(1.5, seatSurfaceY + 2.0, 1.8);
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

      // Height of pawn crown to grasp from above (overhand grip)
      const pawnGripHeight = 0.65;
      startLocal.y += pawnGripHeight;
      targetLocal.y += pawnGripHeight;

      if (p < 0.22) {
        // Phase 1: Torso leans forward, hand glides down to pawn crown from above
        const t1 = p / 0.22;
        reachFactor = Math.sin(t1 * Math.PI * 0.5);
        fingerGrip = 0; // Fingers open ready to clasp
        // Hover slightly higher as approaching
        const approachPos = startLocal.clone();
        approachPos.y += (1 - t1) * 0.6;
        targetHandLocal.lerpVectors(restHand, approachPos, reachFactor);
      } else if (p < 0.78) {
        // Phase 2: Grasp pawn, lift up into parabolic arc, fly smoothly to target tile
        const t2 = (p - 0.22) / 0.56;
        reachFactor = 1;
        fingerGrip = 1; // Fingers firmly curled around pawn crown
        targetHandLocal.lerpVectors(startLocal, targetLocal, t2);
        // High parabolic arc lift
        targetHandLocal.y += Math.sin(t2 * Math.PI) * 1.6;
      } else if (p < 0.88) {
        // Phase 3: Lower pawn gently onto destination tile and release
        const t3 = (p - 0.78) / 0.1;
        reachFactor = 1 - t3 * 0.25;
        fingerGrip = 1 - t3; // Fingers releasing
        targetHandLocal.copy(targetLocal);
        targetHandLocal.y += (1 - t3) * 0.12;
      } else {
        // Phase 4: Torso leans back, hand returns to comfortable resting pose
        const t4 = (p - 0.88) / 0.12;
        reachFactor = 1 - t4;
        fingerGrip = 0;
        targetHandLocal.lerpVectors(targetLocal, restHand, t4);
      }
    } else {
      // Idle resting pose with subtle natural breathing
      const breath = Math.sin(time * 2.2 + (color === 'red' ? 0 : 1.5)) * 0.04;
      targetHandLocal.y += breath;
      reachFactor = 0;
      fingerGrip = 0;
    }

    // Dynamic Torso / Spine forward lean towards board
    const baseLean = isCurrentTurn ? 0.08 : 0;
    const idleBreath = Math.sin(time * 2.2) * 0.015;
    const spinePitch = baseLean + reachFactor * 0.38 + idleBreath;
    const spineZOffset = reachFactor * 1.6; // Shift forward towards table

    if (spineGroupRef.current) {
      spineGroupRef.current.rotation.x = spinePitch;
      spineGroupRef.current.position.z = 0.25 + spineZOffset;
      spineGroupRef.current.position.y = seatSurfaceY;
    }

    // Right Shoulder anchor position in root local coordinates
    const shoulderLocal = new THREE.Vector3(
      1.45,
      seatSurfaceY + 2.75 - reachFactor * 0.3,
      0.35 + spineZOffset + Math.sin(spinePitch) * 2.5
    );

    if (rightShoulderRef.current) {
      rightShoulderRef.current.position.copy(shoulderLocal);
    }

    // Solve 2-Bone Arm IK
    const poleDir = new THREE.Vector3(0.85, -0.4, -0.2).normalize();
    const ik = solveIK(shoulderLocal, targetHandLocal, L1, L2, poleDir);

    // 1. Upper Arm Bone (twist-free orientation)
    orientBone(upperArmMeshRef.current, shoulderLocal, ik.E, L1, poleDir);

    // 2. Elbow Joint Sphere
    if (elbowSphereRef.current) {
      elbowSphereRef.current.position.copy(ik.E);
    }

    // 3. Forearm Bone (twist-free orientation)
    orientBone(forearmMeshRef.current, ik.E, targetHandLocal, L2, poleDir);

    // 4. Overhand Grip Hand: Palm points DOWN towards the pawn crown
    if (handGroupRef.current) {
      handGroupRef.current.position.copy(targetHandLocal);
      // Hand natural overhand orientation (palm down facing pawn)
      const toTarget = new THREE.Vector3().subVectors(targetHandLocal, ik.E).normalize();
      const handRotY = Math.atan2(toTarget.x, toTarget.z);
      handGroupRef.current.rotation.set(0.2, handRotY, 0);
    }

    // 5. Animated Fingers clasp / uncurl around pawn
    fingerMeshesRef.current.forEach((finger) => {
      if (finger) {
        // Natural curl angle around the spherical goti crown
        finger.rotation.x = 0.4 + fingerGrip * 0.75;
      }
    });

    // 6. Head and Eyes look down towards hand and pawn
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
      {/* 1. Lower Body & Legs (Seated on Chair, Scaled 1.28x)     */}
      {/* ======================================================== */}
      <group position={[0, seatSurfaceY, 0.25]}>
        {/* Hips / Pelvis */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[2.5, 0.85, 1.8]} />
          <meshStandardMaterial color={pantsColor} roughness={0.5} />
        </mesh>

        {/* Thighs extending horizontally forward resting on chair */}
        {[-0.72, 0.72].map((tx, i) => (
          <group key={`thigh-${i}`} position={[tx, 0.45, 1.05]}>
            {/* Horizontal Thigh */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.95, 0.8, 2.1]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Knee Joint */}
            <mesh position={[0, -0.05, 1.1]} castShadow>
              <sphereGeometry args={[0.46, 16, 16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Vertical Lower Leg / Shin going down to floor */}
            <mesh position={[0, -2.45, 1.1]} castShadow>
              <cylinderGeometry args={[0.4, 0.34, 4.8, 16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Sneaker / Shoe resting flat on the floor */}
            <group position={[0, -4.95, 1.45]}>
              <mesh castShadow>
                <boxGeometry args={[0.88, 0.6, 1.7]} />
                <meshStandardMaterial color={theme.primary} roughness={0.3} />
              </mesh>
              {/* White Rubber Sneaker Sole */}
              <mesh position={[0, -0.26, 0]}>
                <boxGeometry args={[0.92, 0.14, 1.76]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 2. Torso, Head & Left Resting Arm (Pivots at Spine)      */}
      {/* ======================================================== */}
      <group ref={spineGroupRef} position={[0, seatSurfaceY, 0.25]}>
        {/* Main Chest & Athletic Hoodie */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[2.7, 2.7, 1.6]} />
          <meshStandardMaterial
            color={theme.primary}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>

        {/* White Drawstrings / Zipper Detail */}
        <mesh position={[0, 1.6, 0.82]}>
          <boxGeometry args={[0.16, 1.8, 0.05]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} />
        </mesh>

        {/* Hoodie Collar Ring */}
        <mesh position={[0, 2.95, 0.12]} rotation={[Math.PI / 8, 0, 0]}>
          <torusGeometry args={[0.65, 0.18, 16, 24]} />
          <meshStandardMaterial color={theme.primary} roughness={0.4} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 3.2, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.34, 0.6, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>

        {/* ======================================================== */}
        {/* Head & Stylized Face                                     */}
        {/* ======================================================== */}
        <group ref={headRef} position={[0, 4.1, 0]}>
          {/* Head Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.85, 32, 32]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} />
          </mesh>

          {/* Stylized Modern Hair / Beanie Cap */}
          <mesh position={[0, 0.26, -0.08]} castShadow>
            <sphereGeometry args={[0.9, 24, 24]} />
            <meshStandardMaterial color={hairColor} roughness={0.4} />
          </mesh>

          {/* Two Expressive Stylized Eyes looking down towards board */}
          {[-0.3, 0.3].map((ex, i) => (
            <group key={`eye-${i}`} position={[ex, 0.1, 0.76]}>
              {/* White Sclera */}
              <mesh>
                <sphereGeometry args={[0.13, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
              </mesh>
              {/* Dark Pupil */}
              <mesh position={[0, -0.02, 0.08]}>
                <sphereGeometry args={[0.075, 16, 16]} />
                <meshStandardMaterial color="#0F172A" roughness={0.1} />
              </mesh>
              {/* Eye Specular Glimmer */}
              <mesh position={[0.025, 0.025, 0.14]}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </group>
          ))}

          {/* Smile / Mouth */}
          <mesh position={[0, -0.28, 0.77]}>
            <boxGeometry args={[0.26, 0.05, 0.05]} />
            <meshStandardMaterial color="#7C2D12" roughness={0.3} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* Left Arm (Resting on Table / Armrest)                    */}
        {/* ======================================================== */}
        <group position={[-1.5, 2.5, 0]}>
          {/* Left Shoulder Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.44, 16, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          {/* Left Upper Arm */}
          <mesh position={[-0.12, -1.0, 0.3]} rotation={[0.4, 0, 0.15]} castShadow>
            <cylinderGeometry args={[0.32, 0.28, 2.0, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          {/* Left Forearm resting forward on table */}
          <mesh position={[-0.12, -1.8, 1.25]} rotation={[1.15, 0, 0.15]} castShadow>
            <cylinderGeometry args={[0.28, 0.25, 1.8, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          {/* Left Hand */}
          <mesh position={[-0.12, -2.15, 2.2]} castShadow>
            <boxGeometry args={[0.48, 0.24, 0.65]} />
            <meshStandardMaterial color={skinColor} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 3. Right Action Arm (Full Inverse Kinematics Chain)      */}
      {/* ======================================================== */}
      {/* Right Shoulder Socket Mesh */}
      <mesh ref={rightShoulderRef} castShadow>
        <sphereGeometry args={[0.44, 16, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Upper Arm Cylinder (between Shoulder and Elbow) */}
      <mesh ref={upperArmMeshRef} castShadow>
        <cylinderGeometry args={[0.32, 0.28, L1, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Elbow Joint Sphere */}
      <mesh ref={elbowSphereRef} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Forearm Cylinder (between Elbow and Hand) */}
      <mesh ref={forearmMeshRef} castShadow>
        <cylinderGeometry args={[0.28, 0.24, L2, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Overhand Grasping Hand: positioned directly over pawn crown */}
      <group ref={handGroupRef}>
        {/* Palm / Back of Hand */}
        <mesh position={[0, 0.08, 0]} castShadow>
          <sphereGeometry args={[0.34, 16, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.3} />
        </mesh>
        {/* White Wrist Sleeve Cuff */}
        <mesh position={[0, 0.24, -0.1]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.3, 0.08, 12, 24]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>

        {/* 4 Fingers wrapping downwards around the pawn crown */}
        {[-0.18, -0.06, 0.06, 0.18].map((fx, i) => (
          <group
            key={`finger-${i}`}
            ref={(el) => (fingerMeshesRef.current[i] = el)}
            position={[fx, -0.08, 0.16]}
          >
            <mesh position={[0, -0.18, 0.06]} castShadow>
              <cylinderGeometry args={[0.07, 0.055, 0.42, 8]} />
              <meshStandardMaterial color={skinColor} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Opposing Thumb on the side */}
        <mesh position={[0.26, -0.02, -0.04]} rotation={[-0.3, 0.4, -0.2]} castShadow>
          <cylinderGeometry args={[0.085, 0.075, 0.38, 8]} />
          <meshStandardMaterial color={skinColor} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLOR_PALETTE, getToken3DPosition } from '../../constants/boardCoordinates';
import { TABLE_FLOOR_Y } from './Table';

/**
 * 2-Segment Inverse Kinematics with twist-free orthonormal frame
 */
function solveIK(S, H, L1, L2, poleDir) {
  const toHand = new THREE.Vector3().subVectors(H, S);
  const dist = toHand.length();
  const dir = dist > 0.001 ? toHand.clone().divideScalar(dist) : new THREE.Vector3(0, 0, 1);

  if (dist >= L1 + L2) {
    const E = S.clone().addScaledVector(dir, L1);
    return { E, L1Actual: L1, L2Actual: Math.max(L2, dist - L1) };
  }

  // Law of Cosines
  const d1 = (L1 * L1 - L2 * L2 + dist * dist) / (2 * dist);
  const hSq = Math.max(0, L1 * L1 - d1 * d1);
  const h = Math.sqrt(hSq);

  let perp = new THREE.Vector3().crossVectors(dir, poleDir);
  if (perp.lengthSq() < 0.001) {
    perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0));
  }
  const bendNorm = new THREE.Vector3().crossVectors(perp, dir).normalize();

  const E = S.clone().addScaledVector(dir, d1).addScaledVector(bendNorm, h);
  return { E, L1Actual: L1, L2Actual: L2 };
}

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

  tmpMid.addVectors(pStart, pEnd).multiplyScalar(0.5);
  mesh.position.copy(tmpMid);

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
 * 3D Stylized Human Avatar (NPC)
 * Features modern streetwear, glowing esports gaming headset, animated face,
 * and high-polish overhand pawn pickup, flight, and placement.
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
  const headGroupRef = useRef();

  // Arm IK meshes
  const rightShoulderRef = useRef();
  const upperArmMeshRef = useRef();
  const elbowSphereRef = useRef();
  const forearmMeshRef = useRef();
  const handGroupRef = useRef();
  const fingerMeshesRef = useRef([]);

  const theme = COLOR_PALETTE[color] || { primary: '#EF4444', glow: '#F87171' };

  // Timeline state: 0 (start reach) to 1 (finished)
  const animTime = useRef(1);
  const currentAction = useRef(null);

  useEffect(() => {
    if (moveAction && moveAction.color === color) {
      currentAction.current = moveAction;
      animTime.current = 0; // Trigger animation
    }
  }, [moveAction, color]);

  // Seated dimensions relative to chair base
  const seatSurfaceY = 2.4; // Top surface of chair cushion

  // Arm segment lengths
  const L1 = 2.8;
  const L2 = 2.5;

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Resting hand pose on the table surface next to the player's home base
    const restHand = new THREE.Vector3(1.3, seatSurfaceY + 2.05, 1.4);
    let targetHandLocal = restHand.clone();
    let reachFactor = 0;
    let fingerGrip = 0;

    if (animTime.current < 1) {
      animTime.current = Math.min(animTime.current + delta * 0.72, 1);
      const p = animTime.current;

      const prevStep = currentAction.current?.previousStep ?? -1;
      const newStep = currentAction.current?.newStep ?? 0;
      const tokenIdx = currentAction.current?.tokenIndex ?? 0;

      const [sx, sy, sz] = getToken3DPosition(color, tokenIdx, prevStep);
      const [tx, ty, tz] = getToken3DPosition(color, tokenIdx, newStep);

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
        const ease = Math.sin(t1 * Math.PI * 0.5); // Smooth ease-out
        reachFactor = ease;
        fingerGrip = 0; // Open hand
        const approachPos = startLocal.clone();
        approachPos.y += (1 - t1) * 0.5; // Arrives from slightly above
        targetHandLocal.lerpVectors(restHand, approachPos, ease);
      } else if (p < 0.78) {
        // Phase 2: Grasp pawn, lift up into parabolic flight arc, carry to target tile
        const t2 = (p - 0.22) / 0.56;
        reachFactor = 1;
        fingerGrip = 1; // Clasp crown
        targetHandLocal.lerpVectors(startLocal, targetLocal, t2);
        // High parabolic arc lift
        targetHandLocal.y += Math.sin(t2 * Math.PI) * 1.5;
      } else if (p < 0.88) {
        // Phase 3: Lower pawn firmly onto destination tile and release
        const t3 = (p - 0.78) / 0.1;
        reachFactor = 1 - t3 * 0.2;
        fingerGrip = 1 - t3; // Unclasp fingers
        targetHandLocal.copy(targetLocal);
        // Small landing micro-bounce
        targetHandLocal.y += Math.sin(t3 * Math.PI) * 0.08;
      } else {
        // Phase 4: Torso leans back, hand smoothly returns to rest
        const t4 = (p - 0.88) / 0.12;
        const easeReturn = Math.sin(t4 * Math.PI * 0.5);
        reachFactor = 1 - easeReturn;
        fingerGrip = 0;
        targetHandLocal.lerpVectors(targetLocal, restHand, easeReturn);
      }
    } else {
      // Idle breathing and resting pose
      const breath = Math.sin(time * 2.5 + (color === 'red' ? 0 : 1.5)) * 0.03;
      targetHandLocal.y += breath;
      reachFactor = 0;
      fingerGrip = 0;
    }

    // Dynamic Torso / Spine forward lean towards board
    const baseLean = isCurrentTurn ? 0.08 : 0;
    const idleBreath = Math.sin(time * 2.5) * 0.015;
    const spinePitch = baseLean + reachFactor * 0.36 + idleBreath;
    const spineZOffset = reachFactor * 1.35; // Shift forward towards table

    if (spineGroupRef.current) {
      spineGroupRef.current.rotation.x = spinePitch;
      spineGroupRef.current.position.z = 0.2 + spineZOffset;
      spineGroupRef.current.position.y = seatSurfaceY;
    }

    // Right Shoulder anchor position in root local coordinates
    const shoulderLocal = new THREE.Vector3(
      1.25,
      seatSurfaceY + 2.4 - reachFactor * 0.25,
      0.3 + spineZOffset + Math.sin(spinePitch) * 2.1
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
      const toTarget = new THREE.Vector3().subVectors(targetHandLocal, ik.E).normalize();
      const handRotY = Math.atan2(toTarget.x, toTarget.z);
      handGroupRef.current.rotation.set(0.18, handRotY, 0);
    }

    // 5. Animated Fingers clasp / uncurl around pawn
    fingerMeshesRef.current.forEach((finger) => {
      if (finger) {
        finger.rotation.x = 0.35 + fingerGrip * 0.75;
      }
    });

    // 6. Head and Eyes look down towards hand and pawn
    if (headGroupRef.current) {
      if (reachFactor > 0.05) {
        headGroupRef.current.rotation.x = 0.32 * reachFactor;
        headGroupRef.current.rotation.y = (targetHandLocal.x > 0 ? 0.12 : -0.12) * reachFactor;
      } else {
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.x,
          0.1 + Math.sin(time * 0.8) * 0.04,
          delta * 4
        );
        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(
          headGroupRef.current.rotation.y,
          Math.sin(time * 0.6) * 0.06,
          delta * 4
        );
      }
    }
  });

  const skinColor = '#FAD7B5';
  const pantsColor = '#1E293B';
  const hairColor =
    color === 'yellow'
      ? '#3B1A04'
      : color === 'red'
      ? '#0F172A'
      : color === 'green'
      ? '#132A13'
      : '#1E1B4B';

  return (
    <group ref={rootGroupRef} position={chairPosition} rotation={[0, chairRotationY, 0]}>
      {/* ======================================================== */}
      {/* 1. Lower Body & Legs (Seated Ergonomically on Chair)     */}
      {/* ======================================================== */}
      <group position={[0, seatSurfaceY, 0.2]}>
        {/* Hips / Pelvis */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[2.2, 0.75, 1.6]} />
          <meshStandardMaterial color={pantsColor} roughness={0.5} />
        </mesh>

        {/* Thighs extending horizontally forward resting on cushion */}
        {[-0.65, 0.65].map((tx, i) => (
          <group key={`thigh-${i}`} position={[tx, 0.35, 0.9]}>
            {/* Horizontal Thigh */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.82, 0.7, 1.8]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Knee Joint */}
            <mesh position={[0, -0.05, 0.95]} castShadow>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Vertical Lower Leg / Shin going down to floor */}
            <mesh position={[0, -1.2, 0.95]} castShadow>
              <cylinderGeometry args={[0.34, 0.28, 2.3, 16]} />
              <meshStandardMaterial color={pantsColor} roughness={0.5} />
            </mesh>

            {/* Designer Sneaker resting flat on the floor */}
            <group position={[0, -2.45, 1.25]}>
              <mesh castShadow>
                <boxGeometry args={[0.76, 0.5, 1.5]} />
                <meshStandardMaterial color={theme.primary} roughness={0.3} />
              </mesh>
              {/* White Rubber Sneaker Sole */}
              <mesh position={[0, -0.22, 0]}>
                <boxGeometry args={[0.8, 0.12, 1.55]} />
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
        {/* Main Athletic Streetwear Hoodie */}
        <mesh position={[0, 1.35, 0]} castShadow>
          <boxGeometry args={[2.3, 2.3, 1.4]} />
          <meshStandardMaterial
            color={theme.primary}
            roughness={0.35}
            metalness={0.1}
          />
        </mesh>

        {/* Dark Contrast Side Panels */}
        {[-1.16, 1.16].map((sx, i) => (
          <mesh key={`panel-${i}`} position={[sx, 1.35, 0]}>
            <boxGeometry args={[0.04, 2.2, 1.3]} />
            <meshStandardMaterial color="#0F172A" roughness={0.4} />
          </mesh>
        ))}

        {/* White Center Zipper & Drawstring Aglets */}
        <mesh position={[0, 1.35, 0.72]}>
          <boxGeometry args={[0.12, 1.6, 0.04]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.2} metalness={0.5} />
        </mesh>

        {/* Hoodie Draped Collar */}
        <mesh position={[0, 2.5, 0.1]} rotation={[Math.PI / 8, 0, 0]}>
          <torusGeometry args={[0.55, 0.16, 16, 24]} />
          <meshStandardMaterial color={theme.primary} roughness={0.4} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 2.7, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.28, 0.5, 16]} />
          <meshStandardMaterial color={skinColor} roughness={0.4} />
        </mesh>

        {/* ======================================================== */}
        {/* Head with Stylized Hair & Esports Gaming Headset         */}
        {/* ======================================================== */}
        <group ref={headGroupRef} position={[0, 3.45, 0]}>
          {/* Head Sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.74, 32, 32]} />
            <meshStandardMaterial color={skinColor} roughness={0.35} />
          </mesh>

          {/* Stylized Modern Haircut */}
          <mesh position={[0, 0.24, -0.06]} castShadow>
            <sphereGeometry args={[0.78, 24, 24]} />
            <meshStandardMaterial color={hairColor} roughness={0.4} />
          </mesh>

          {/* Esports Gaming Headset Headband */}
          <mesh position={[0, 0.45, 0]}>
            <torusGeometry args={[0.76, 0.08, 12, 32]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Glowing Headset Earcups in Theme Color */}
          {[-0.78, 0.78].map((hx, i) => (
            <group key={`headset-cup-${i}`} position={[hx, 0.05, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.26, 0.26, 0.22, 24]} />
                <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.7} />
              </mesh>
              {/* Glowing Accent Ring */}
              <mesh position={[hx > 0 ? 0.12 : -0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <ringGeometry args={[0.15, 0.22, 24]} />
                <meshStandardMaterial
                  color={theme.primary}
                  emissive={theme.primary}
                  emissiveIntensity={2.0}
                />
              </mesh>
            </group>
          ))}

          {/* Two Expressive Anime/Pixar-Style Glossy Eyes */}
          {[-0.26, 0.26].map((ex, i) => (
            <group key={`eye-${i}`} position={[ex, 0.08, 0.65]}>
              {/* White Sclera */}
              <mesh>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
              </mesh>
              {/* Colored Iris */}
              <mesh position={[0, -0.02, 0.06]}>
                <sphereGeometry args={[0.075, 16, 16]} />
                <meshStandardMaterial color={theme.primary} roughness={0.1} />
              </mesh>
              {/* Dark Pupil */}
              <mesh position={[0, -0.02, 0.08]}>
                <sphereGeometry args={[0.045, 16, 16]} />
                <meshStandardMaterial color="#0A0F1D" roughness={0.1} />
              </mesh>
              {/* Glossy Specular Glimmer */}
              <mesh position={[0.025, 0.025, 0.12]}>
                <sphereGeometry args={[0.025, 8, 8]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            </group>
          ))}

          {/* Pleasant Confident Smile */}
          <mesh position={[0, -0.24, 0.66]}>
            <boxGeometry args={[0.22, 0.04, 0.04]} />
            <meshStandardMaterial color="#7C2D12" roughness={0.3} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* Left Arm (Resting on Table / Armrest)                    */}
        {/* ======================================================== */}
        <group position={[-1.3, 2.1, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.38, 16, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          <mesh position={[-0.1, -0.85, 0.25]} rotation={[0.4, 0, 0.15]} castShadow>
            <cylinderGeometry args={[0.26, 0.22, 1.6, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          <mesh position={[-0.1, -1.5, 0.95]} rotation={[1.1, 0, 0.15]} castShadow>
            <cylinderGeometry args={[0.23, 0.2, 1.4, 16]} />
            <meshStandardMaterial color={theme.primary} roughness={0.4} />
          </mesh>
          <mesh position={[-0.1, -1.75, 1.7]} castShadow>
            <boxGeometry args={[0.4, 0.2, 0.55]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 3. Right Action Arm (Full Inverse Kinematics Chain)      */}
      {/* ======================================================== */}
      {/* Right Shoulder Socket Mesh */}
      <mesh ref={rightShoulderRef} castShadow>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Upper Arm Cylinder */}
      <mesh ref={upperArmMeshRef} castShadow>
        <cylinderGeometry args={[0.26, 0.23, L1, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Elbow Joint Sphere */}
      <mesh ref={elbowSphereRef} castShadow>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Forearm Cylinder */}
      <mesh ref={forearmMeshRef} castShadow>
        <cylinderGeometry args={[0.23, 0.2, L2, 16]} />
        <meshStandardMaterial color={theme.primary} roughness={0.4} />
      </mesh>

      {/* Modern White Gamer Glove: Palm facing DOWN over the pawn crown */}
      <group ref={handGroupRef}>
        {/* Palm / Back of Glove */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
        </mesh>
        {/* Glove Player Theme Trim Band */}
        <mesh position={[0, 0.18, -0.08]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.26, 0.06, 12, 24]} />
          <meshStandardMaterial color={theme.primary} roughness={0.3} />
        </mesh>

        {/* 4 Fingers wrapping downwards around the pawn crown */}
        {[-0.14, -0.05, 0.05, 0.14].map((fx, i) => (
          <group
            key={`finger-${i}`}
            ref={(el) => (fingerMeshesRef.current[i] = el)}
            position={[fx, -0.06, 0.14]}
          >
            <mesh position={[0, -0.15, 0.05]} castShadow>
              <cylinderGeometry args={[0.06, 0.05, 0.36, 8]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Opposing Thumb */}
        <mesh position={[0.22, -0.02, -0.03]} rotation={[-0.3, 0.4, -0.2]} castShadow>
          <cylinderGeometry args={[0.075, 0.065, 0.32, 8]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

export const TABLE_FLOOR_Y = -8.7;

/**
 * 3D Wooden Table for the Ludo Board to rest on
 * Board base bottom sits at y = -0.5
 */
export function Table({ boardBottomY = -0.5, floorY = TABLE_FLOOR_Y }) {
  const tableTopThickness = 0.7;
  const tableTopY = boardBottomY - tableTopThickness / 2; // -0.85
  const legHeight = Math.abs(boardBottomY - tableTopThickness - floorY); // 7.5
  const legTopRadius = 0.72;
  const legBottomRadius = 0.52;
  const legY = boardBottomY - tableTopThickness - legHeight / 2;
  const legSpread = 6.8;

  return (
    <group>
      {/* ======================================================== */}
      {/* 1. Main Polished Wooden Tabletop                         */}
      {/* ======================================================== */}
      <mesh position={[0, tableTopY, 0]} receiveShadow castShadow>
        <boxGeometry args={[18, tableTopThickness, 18]} />
        <meshStandardMaterial
          color="#2A170E" // Deep rich mahogany / walnut wood
          roughness={0.28}
          metalness={0.05}
        />
      </mesh>

      {/* Decorative Beveled Wooden Tabletop Edge / Rim */}
      <mesh position={[0, tableTopY - 0.08, 0]} receiveShadow>
        <boxGeometry args={[18.5, tableTopThickness * 0.75, 18.5]} />
        <meshStandardMaterial
          color="#1A0D08" // Darker edge accent
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Tabletop Inlay Accent Stripe (Golden brass inlay line) */}
      <mesh position={[0, boardBottomY + 0.002, 0]} receiveShadow>
        <ringGeometry args={[8.0, 8.1, 64]} />
        <meshStandardMaterial
          color="#D4AF37"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Under-table Apron Frame */}
      <mesh position={[0, boardBottomY - tableTopThickness - 0.35, 0]} receiveShadow castShadow>
        <boxGeometry args={[15.5, 0.7, 15.5]} />
        <meshStandardMaterial
          color="#1E100A"
          roughness={0.5}
          metalness={0.05}
        />
      </mesh>

      {/* ======================================================== */}
      {/* 2. Four Sturdy Tapered Table Legs with Brass Caps        */}
      {/* ======================================================== */}
      {[
        [-legSpread, -legSpread],
        [legSpread, -legSpread],
        [-legSpread, legSpread],
        [legSpread, legSpread],
      ].map(([lx, lz], i) => (
        <group key={`table-leg-${i}`} position={[lx, legY, lz]}>
          {/* Wooden Tapered Leg Column */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[legTopRadius, legBottomRadius, legHeight, 32]} />
            <meshStandardMaterial
              color="#22120A"
              roughness={0.35}
              metalness={0.05}
            />
          </mesh>

          {/* Golden Brass Top Collar */}
          <mesh position={[0, legHeight / 2 - 0.25, 0]}>
            <cylinderGeometry args={[legTopRadius * 1.08, legTopRadius * 1.05, 0.5, 32]} />
            <meshStandardMaterial
              color="#D4AF37"
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* Golden Brass Bottom Foot Cap */}
          <mesh position={[0, -legHeight / 2 + 0.45, 0]}>
            <cylinderGeometry args={[legBottomRadius * 1.06, legBottomRadius * 1.15, 0.9, 32]} />
            <meshStandardMaterial
              color="#D4AF37"
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* ======================================================== */}
      {/* 3. Room Floor Below Table                                */}
      {/* ======================================================== */}
      <mesh
        position={[0, boardBottomY - tableTopThickness - legHeight, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          color="#060911"
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
}

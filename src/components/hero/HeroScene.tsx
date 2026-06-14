"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Icosahedron, Torus, Sphere, Cone } from "@react-three/drei";
import { useRef, useMemo } from "react";
import type { Group } from "three";

function FloatingObjects() {
  const group = useRef<Group>(null);

  // Gentle group rotation + mouse parallax
  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.12;
    const targetX = state.pointer.y * 0.18;
    const targetY = state.pointer.x * 0.4;
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.04;
    group.current.position.x += (targetY * 0.4 - group.current.position.x) * 0.04;
  });

  const items = useMemo(
    () => [
      { type: "box", pos: [0, 0.1, 0], color: "#f97316", scale: 1.35 },
      { type: "ico", pos: [-2.6, 0.9, -1], color: "#14b8a6", scale: 0.7 },
      { type: "torus", pos: [2.5, -0.6, -0.5], color: "#ffb800", scale: 0.7 },
      { type: "sphere", pos: [2.1, 1.4, -1.5], color: "#fb923c", scale: 0.55 },
      { type: "cone", pos: [-2.2, -1.2, -0.5], color: "#6366f1", scale: 0.7 },
      { type: "box", pos: [-1.1, 1.9, -1.5], color: "#ef4444", scale: 0.5 },
      { type: "sphere", pos: [0.4, -1.9, -0.5], color: "#22c55e", scale: 0.45 },
    ],
    []
  );

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <Float key={i} speed={2} rotationIntensity={1} floatIntensity={1.4}>
          <group position={it.pos as [number, number, number]} scale={it.scale}>
            {it.type === "box" && (
              <RoundedBox args={[1.4, 1.4, 1.4]} radius={0.18} smoothness={6}>
                <meshStandardMaterial color={it.color} metalness={0.35} roughness={0.25} />
              </RoundedBox>
            )}
            {it.type === "ico" && (
              <Icosahedron args={[1, 0]}>
                <meshStandardMaterial color={it.color} metalness={0.4} roughness={0.2} flatShading />
              </Icosahedron>
            )}
            {it.type === "torus" && (
              <Torus args={[0.8, 0.32, 24, 64]}>
                <meshStandardMaterial color={it.color} metalness={0.5} roughness={0.2} />
              </Torus>
            )}
            {it.type === "sphere" && (
              <Sphere args={[0.9, 48, 48]}>
                <meshStandardMaterial color={it.color} metalness={0.3} roughness={0.15} />
              </Sphere>
            )}
            {it.type === "cone" && (
              <Cone args={[0.9, 1.5, 32]}>
                <meshStandardMaterial color={it.color} metalness={0.35} roughness={0.3} />
              </Cone>
            )}
          </group>
        </Float>
      ))}
    </group>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 6, 5]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-6, -3, 2]} intensity={0.6} color="#ffd9a8" />
      <pointLight position={[0, 0, 4]} intensity={1.2} color="#ffb800" />
      <FloatingObjects />
    </Canvas>
  );
}

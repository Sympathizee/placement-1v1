import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Text3D, Float, Sparkles, Stars, Sky, Billboard, Text, Html } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

// --- 3D HEART COMPONENT ---
function Heart({ onClick, shattered }) {
  const heartRef = useRef()
  const materialRef = useRef()

  // Heartbeat animation
  useEffect(() => {
    if (!shattered && heartRef.current) {
      gsap.to(heartRef.current.scale, {
        x: 1.1,
        y: 1.1,
        z: 1.1,
        duration: 0.4,
        yoyo: true,
        repeat: -1,
        ease: "power1.inOut"
      })
    }
  }, [shattered])

  // Create heart shape
  const heartShape = useMemo(() => {
    const shape = new THREE.Shape()
    const x = 0, y = 0
    shape.moveTo(x + 2.5, y + 2.5)
    shape.bezierCurveTo(x + 2.5, y + 2.5, x + 2.0, y, x, y)
    shape.bezierCurveTo(x - 3.0, y, x - 3.0, y + 3.5, x - 3.0, y + 3.5)
    shape.bezierCurveTo(x - 3.0, y + 5.5, x - 1.0, y + 7.7, x + 2.5, y + 9.5)
    shape.bezierCurveTo(x + 6.0, y + 7.7, x + 8.0, y + 5.5, x + 8.0, y + 3.5)
    shape.bezierCurveTo(x + 8.0, y + 3.5, x + 8.0, y, x + 5.0, y)
    shape.bezierCurveTo(x + 3.5, y, x + 2.5, y + 2.5, x + 2.5, y + 2.5)
    return shape
  }, [])

  const extrudeSettings = { depth: 2, bevelEnabled: true, bevelSegments: 3, steps: 2, bevelSize: 0.5, bevelThickness: 0.5 }

  if (shattered) {
    return <Confetti />
  }

  return (
    <group position={[0, 0, 0]} rotation={[0, 0, Math.PI]} scale={0.2} ref={heartRef} onClick={onClick}>
      <mesh position={[-0.5, -4, -1]}>
        <extrudeGeometry args={[heartShape, extrudeSettings]} />
        <meshStandardMaterial 
          ref={materialRef}
          color="#ff00ff" 
          emissive="#ff00ff"
          emissiveIntensity={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  )
}

// --- CONFETTI COMPONENT ---
function Confetti() {
  const meshRef = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const particlesCount = 200

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < particlesCount; i++) {
      const x = (Math.random() - 0.5) * 5
      const y = (Math.random() - 0.5) * 5
      const z = (Math.random() - 0.5) * 5
      const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)
      temp.push({ x, y, z, velocity })
    }
    return temp
  }, [])

  useFrame(() => {
    particles.forEach((particle, i) => {
      particle.x += particle.velocity.x
      particle.y += particle.velocity.y
      particle.z += particle.velocity.z
      
      dummy.position.set(particle.x, particle.y, particle.z)
      dummy.rotation.x += 0.01
      dummy.rotation.y += 0.01
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, particlesCount]}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={1} />
    </instancedMesh>
  )
}

// --- BILLBOARD CAROUSEL ---
function Carousel() {
  const groupRef = useRef()
  
  useFrame((state, delta) => {
    groupRef.current.rotation.y += delta * 0.2
  })

  const messages = [
    "Benefit 1: D will be completely out of\nyour hair for at least 300 hours.",
    "Benefit 2: Guaranteed house chores\ncompletion during long loading screens.",
    "Benefit 3: You get full, undisputed control\nof the TV remote for the foreseeable future."
  ]

  const radius = 6

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {messages.map((msg, index) => {
        const angle = (index / messages.length) * Math.PI * 2
        const x = Math.sin(angle) * radius
        const z = Math.cos(angle) * radius
        return (
          <group key={index} position={[x, 0, z]} rotation={[0, angle, 0]}>
            <mesh position={[0, 0, -0.1]}>
              <planeGeometry args={[6, 3]} />
              <meshStandardMaterial color="#111" emissive="#0ff" emissiveIntensity={0.2} transparent opacity={0.8} />
            </mesh>
            <Text
              position={[0, 0, 0]}
              fontSize={0.25}
              color="#00ffff"
              maxWidth={5}
              textAlign="center"
              outlineWidth={0.01}
              outlineColor="#00ffff"
            >
              {msg}
            </Text>
          </group>
        )
      })}
    </group>
  )
}

// --- SWEET NOTHINGS ---
function SweetNothings() {
  const nothings = [
    { text: "You are the ultimate heist of my heart.", pos: [-4, 3, -2] },
    { text: "My love for you renders in real-time.", pos: [4, 4, -4] },
    { text: "I would pause an online game just for you.", pos: [0, 5, -6] }
  ]

  return (
    <group>
      {nothings.map((n, i) => (
        <Float key={i} speed={2} rotationIntensity={0.5} floatIntensity={2} position={n.pos}>
          <Text
            fontSize={0.3}
            color="#8a2be2"
            outlineWidth={0.02}
            outlineColor="#ff00ff"
            maxWidth={4}
            textAlign="center"
          >
            {n.text}
          </Text>
        </Float>
      ))}
    </group>
  )
}

// --- BACKGROUND & ENVIRONMENT ---
function SceneEnvironment() {
  return (
    <>
      <color attach="background" args={['#0d0221']} />
      <Sky distance={450000} sunPosition={[0, -0.1, -1]} inclination={0} azimuth={0.25} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ff00ff" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#00ffff" />
      
      {/* Glowing wireframe ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
        <planeGeometry args={[100, 100, 40, 40]} />
        <meshBasicMaterial color="#ff00ff" wireframe transparent opacity={0.15} />
      </mesh>
    </>
  )
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [shattered, setShattered] = useState(false)
  const [finaleActive, setFinaleActive] = useState(false)

  const handleHeartClick = () => {
    setShattered(true)
  }

  const handleCTAClick = () => {
    setFinaleActive(true)
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <SceneEnvironment />
        <Heart onClick={handleHeartClick} shattered={shattered} />
        <Carousel />
        <SweetNothings />
        <Sparkles count={100} scale={12} size={2} speed={0.4} color="#00ffff" />
      </Canvas>

      <div className="ui-overlay">
        <h1 className="title">Project: Vice City Romance</h1>
        <div className="cta-container">
          <button className="gta-button" onClick={handleCTAClick}>
            Authorize $100 GTA 6 Fund
          </button>
        </div>
      </div>

      <div className={`grand-finale ${finaleActive ? 'active' : ''}`}>
        <h1 className="finale-text">PROPOSAL ACCEPTED:<br/>BEST GIRLFRIEND EVER!</h1>
      </div>
    </div>
  )
}

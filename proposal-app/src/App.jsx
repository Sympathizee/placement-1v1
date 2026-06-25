// ============================================
// OPERATION: LEONIDA — GTA VI Proposal
// A Cinematic Scroll Experience
// ============================================

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles, Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ============================================
// MODULE-LEVEL SCROLL STATE
// (avoids React re-renders on every scroll tick)
// ============================================
let globalScrollY = 0
let globalScrollProgress = 0

// ============================================
// THREE.JS — SYNTHWAVE GRID
// ============================================
function SynthwaveGrid() {
  const meshRef = useRef()

  const shaderData = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      uniform float uTime;

      void main() {
        vec2 uv = vUv;
        // Scroll the grid toward the camera
        uv.y = uv.y + uTime * 0.06;

        // Grid lines
        vec2 gridUv = uv * vec2(30.0, 50.0);
        vec2 grid = abs(fract(gridUv) - 0.5);
        vec2 lineW = fwidth(gridUv) * 1.5;
        vec2 lines = smoothstep(lineW, vec2(0.0), grid);
        float line = max(lines.x, lines.y);

        // Fade: bright near camera (low Y in UV), fades to horizon
        float baseFade = (1.0 - vUv.y);
        float fade = pow(baseFade, 1.5) * smoothstep(0.0, 0.08, vUv.y);

        // Color gradient: pink near → cyan far
        vec3 pink  = vec3(1.0, 0.18, 0.58);
        vec3 cyan  = vec3(0.0, 1.0, 0.94);
        vec3 color = mix(cyan, pink, baseFade);

        float alpha = line * fade * 0.45;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  }), [])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2.3, 0, 0]}
      position={[0, -2.5, -8]}
    >
      <planeGeometry args={[80, 50, 1, 1]} />
      <shaderMaterial
        args={[shaderData]}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ============================================
// THREE.JS — NEON SUN
// ============================================
function NeonSun() {
  const meshRef = useRef()

  const sunShader = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      varying vec2 vUv;
      uniform float uTime;

      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center);

        // Circular gradient
        float circle = smoothstep(0.5, 0.0, dist);

        // Color: warm orange center → hot pink edge
        vec3 orange = vec3(1.0, 0.42, 0.0);
        vec3 pink   = vec3(1.0, 0.0, 0.5);
        vec3 purple = vec3(0.55, 0.0, 1.0);
        vec3 color  = mix(purple, mix(pink, orange, pow(circle, 0.8)), circle);

        // Horizontal bands for that retro-sun look
        float bands = step(0.0, sin(vUv.y * 60.0 - uTime * 0.3));
        float bandFade = smoothstep(0.5, 0.2, vUv.y);
        circle *= mix(1.0, bands * 0.6 + 0.4, bandFade * 0.8);

        float alpha = circle * 0.65;
        gl_FragColor = vec4(color, alpha);
      }
    `,
  }), [])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 2.5, -35]}>
      <circleGeometry args={[12, 64]} />
      <shaderMaterial
        args={[sunShader]}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

// ============================================
// THREE.JS — PALM SILHOUETTES
// ============================================
function PalmSilhouette({ position = [0, 0, 0], scaleVal = 1, swayOffset = 0 }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.4 + swayOffset) * 0.02
    }
  })

  const fronds = useMemo(() => {
    const arr = []
    const count = 7
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      arr.push({
        pos: [Math.sin(angle) * 0.6, 3.5, Math.cos(angle) * 0.3],
        rot: [Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.7 - 0.3],
      })
    }
    return arr
  }, [])

  return (
    <group ref={groupRef} position={position} scale={scaleVal}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 3.5, 5]} />
        <meshBasicMaterial color="#030008" />
      </mesh>
      {/* Fronds */}
      {fronds.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={f.rot}>
          <planeGeometry args={[0.25, 2.2]} />
          <meshBasicMaterial color="#030008" side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// THREE.JS — SCENE CAMERA (scroll-reactive)
// ============================================
function SceneCamera() {
  const { camera } = useThree()

  useFrame(() => {
    // Slowly shift camera up as user scrolls
    const targetY = -1.5 + globalScrollProgress * 4
    camera.position.y += (targetY - camera.position.y) * 0.03
    camera.lookAt(0, camera.position.y - 1, -20)
  })

  return null
}

// ============================================
// THREE.JS — COMPLETE SCENE
// ============================================
function Scene3D() {
  return (
    <Canvas
      camera={{ position: [0, -1.5, 6], fov: 70, near: 0.1, far: 100 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <color attach="background" args={['#05000f']} />

      {/* Ambient mood lighting */}
      <ambientLight intensity={0.15} />

      {/* Scene elements */}
      <NeonSun />
      <SynthwaveGrid />

      {/* Palm silhouettes */}
      <PalmSilhouette position={[-9, -2.5, -12]} scaleVal={1.2} swayOffset={0} />
      <PalmSilhouette position={[-6, -2.5, -18]} scaleVal={0.9} swayOffset={1.5} />
      <PalmSilhouette position={[8, -2.5, -14]} scaleVal={1.1} swayOffset={3} />
      <PalmSilhouette position={[11, -2.5, -20]} scaleVal={0.8} swayOffset={4.5} />
      <PalmSilhouette position={[5, -2.5, -25]} scaleVal={0.7} swayOffset={2} />

      {/* Sparkles */}
      <Sparkles
        count={80}
        scale={[20, 12, 20]}
        size={1.5}
        speed={0.3}
        color="#ff2d95"
        opacity={0.4}
      />
      <Stars radius={60} depth={40} count={2000} factor={3} fade speed={0.5} />

      {/* Scroll-reactive camera */}
      <SceneCamera />

      {/* Post-processing bloom for neon glow */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}

// ============================================
// LOADING SCREEN
// ============================================
function LoadingScreen({ onComplete }) {
  const containerRef = useRef()
  const barRef = useRef()
  const [text, setText] = useState('INITIATING SECURE CONNECTION...')

  useEffect(() => {
    const messages = [
      'INITIATING SECURE CONNECTION...',
      'LOADING MISSION BRIEFING...',
      'SYNCING HEART RATE MONITOR...',
      'CALCULATING RELATIONSHIP METRICS...',
      'CONNECTION ESTABLISHED.',
    ]

    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < messages.length) setText(messages[i])
    }, 700)

    // Progress bar
    gsap.to(barRef.current, {
      width: '100%',
      duration: 3.5,
      ease: 'power1.inOut',
    })

    // Fade out after loading
    const timer = setTimeout(() => {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.in',
        onComplete,
      })
    }, 4000)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [onComplete])

  return (
    <div ref={containerRef} className="loading-screen">
      <div className="loading-corner-tl">GTA VI // LEONIDA</div>
      <div className="loading-corner-br">■ CLASSIFIED</div>
      <div className="loading-content">
        <div className="loading-mission-label">■ MISSION BRIEFING</div>
        <div className="loading-text">{text}</div>
        <div className="loading-bar-track">
          <div ref={barRef} className="loading-bar-fill" />
        </div>
        <div className="loading-tip">
          TIP: &quot;In matters of the heart and heists, always trust your partner.&quot;
        </div>
      </div>
    </div>
  )
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
  const overlineRef = useRef()
  const titleRef = useRef()
  const subtitleRef = useRef()
  const scrollRef = useRef()

  useEffect(() => {
    const tl = gsap.timeline({ delay: 4.5 })
    tl.to(overlineRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' })
      .to(titleRef.current, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, '-=0.4')
      .to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.5')
      .to(scrollRef.current, { opacity: 0.5, duration: 1 }, '-=0.3')
  }, [])

  return (
    <section className="hero-section">
      <div
        ref={overlineRef}
        className="hero-overline"
        style={{ transform: 'translateY(20px)' }}
      >
        ■ ROCKSTAR GAMES PRESENTS
      </div>
      <h1
        ref={titleRef}
        className="hero-title"
        style={{ transform: 'translateY(30px)' }}
      >
        OPERATION:<br /><span className="pink">LEONIDA</span>
      </h1>
      <p
        ref={subtitleRef}
        className="hero-subtitle"
        style={{ transform: 'translateY(20px)' }}
      >
        A Proposal From D to J
      </p>
      <div ref={scrollRef} className="hero-scroll-hint">
        SCROLL TO BEGIN BRIEFING
        <div className="chevron" />
      </div>
    </section>
  )
}

// ============================================
// THE CASE SECTION
// ============================================
function CaseSection() {
  return (
    <section className="section">
      <div className="section-inner reveal">
        <div className="section-overline">SECTION 01 — INTEL REPORT</div>
        <h2 className="section-title">
          THIS ONLY<br />HAPPENS <span className="accent">ONCE</span>
        </h2>
        <p className="section-body">
          <strong>Grand Theft Auto VI</strong> releases <strong>November 19, 2026</strong>{' '}
          on PS5 and Xbox Series X|S. It is the first mainline GTA title since{' '}
          <strong>Grand Theft Auto V in 2013</strong> — that&#39;s a thirteen-year wait.
          <br /><br />
          This isn&#39;t just a game launch. It&#39;s a cultural event. The kind
          of moment people remember where they were for. Set in{' '}
          <strong>Vice City</strong>, in the fictional state of <strong>Leonida</strong>{' '}
          — a neon-soaked, modern-day homage to Miami — it is the most anticipated
          entertainment release of the decade.
          <br /><br />
          Missing this would be like skipping the moon landing because you didn&#39;t
          want to stay up late.
        </p>
        <div className="stats-grid">
          <div className="stat-card reveal">
            <div className="stat-number">13</div>
            <div className="stat-label">YEARS IN THE MAKING</div>
          </div>
          <div className="stat-card reveal">
            <div className="stat-number">2B+</div>
            <div className="stat-label">GTA V COPIES SOLD</div>
          </div>
          <div className="stat-card reveal">
            <div className="stat-number">#1</div>
            <div className="stat-label">MOST ANTICIPATED GAME</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// THE COUPLE PARALLEL SECTION
// ============================================
function CoupleSection() {
  return (
    <section className="section">
      <div className="section-inner reveal">
        <div className="section-overline">SECTION 02 — PARTNERS IN CRIME</div>
        <h2 className="section-title">
          EVERY GREAT HEIST<br />NEEDS <span className="accent">TWO</span>
        </h2>

        <div className="couple-grid">
          {/* Fiction side */}
          <div className="couple-card reveal">
            <div className="couple-card-label fiction">■ IN-GAME</div>
            <h3>LUCIA &amp; JASON</h3>
            <p>
              Lucia Caminos and Jason Duval — GTA VI&#39;s dual protagonists. A
              criminal couple with &#34;Bonnie and Clyde&#34; energy tearing through the
              neon streets of Vice City. You switch between them, just like GTA V,
              but this time the story is about <em>trust, loyalty, and pulling off
                the impossible together</em>.
            </p>
          </div>

          {/* Connector */}
          <div className="couple-connector">
            <div className="line" />
            <div className="icon">💜</div>
            <div className="line" />
          </div>

          {/* Reality side */}
          <div className="couple-card reveal">
            <div className="couple-card-label real">■ IN REAL LIFE</div>
            <h3>D &amp; J</h3>
            <p>
              Two people navigating something way more complex than a fictional
              heist — actual life, together. Different missions, same team.
              If Lucia and Jason can plan a billion-dollar score, we can handle
              a $99.99 budget line.
            </p>
          </div>
        </div>

        <div className="couple-pivot reveal">
          <p>
            Every great partnership is built on trust and the occasional
            unreasonable ask. This is mine. And I&#39;m asking because you&#39;re
            the only person whose opinion on my spending actually matters to me.
            That says something, doesn&#39;t it?
          </p>
          <span className="placeholder">
            This game is just like It Takes Two and Split Fiction. There's two main character, the only difference is I play alone. 💀
          </span>
        </div>
      </div>
    </section>
  )
}

// ============================================
// THE ASK SECTION
// ============================================
function AskSection() {
  return (
    <section className="section">
      <div className="section-inner reveal">
        <div className="section-overline">SECTION 03 — MISSION OBJECTIVE</div>
        <h2 className="section-title">
          THE <span className="accent">ASK</span>
        </h2>
        <p className="section-body">
          Full transparency. No hidden costs, no surprise DLC requests, no
          recurring subscriptions. One purchase. Here&#39;s exactly what we&#39;re
          looking at:
        </p>

        <div className="price-card reveal">
          <div className="price-card-badge">★ ULTIMATE EDITION</div>
          <div className="price-card-name">GRAND THEFT AUTO VI</div>
          <div className="price-card-game">
            ROCKSTAR GAMES — PS5 / XBOX SERIES X|S — NOV 19, 2026
          </div>
          <div className="price-amount">
            $99<span className="cents">.99</span>
          </div>

          <ul className="price-includes">
            <li>GTA VI Full Game — the complete Vice City / Leonida experience</li>
            <li>Premium Vehicle Collection — exclusive cars, bikes, and watercraft</li>
            <li>Exclusive Weapons Pack — firearms not available in Standard Edition</li>
            <li>Premium Apparel Collection — exclusive character outfits and accessories</li>
            <li>Story-Threaded Bonus Content — additional narrative missions</li>
            <li>Pre-Order Bonus: &quot;Vintage Vice City Pack&quot; (must purchase before Nov 20)</li>
            <li>Pre-Order Bonus: 1 Free Month of GTA+ Membership</li>
          </ul>

          <div className="price-compare">
            <div className="standard">
              Standard Edition: <s>$79.99</s>
            </div>
            <div className="vs">→</div>
            <div className="ultimate">
              Ultimate Edition: $99.99 (+$20 for all premium content)
            </div>
          </div>

          <p className="price-note">
            One-time purchase. Not a subscription. Not a recurring charge.
            Not a &quot;but wait, there&#39;s more&quot; situation. Just this. That&#39;s the whole ask.
          </p>
        </div>
      </div>
    </section>
  )
}

// ============================================
// THE DEAL SECTION
// ============================================
function DealSection() {
  const commitments = [
    'D shall actively initiate and engage in cooperative gaming operations featuring "Biped," ensuring maximum teamwork and mutual entertainment.',
    'A steadfast commitment to navigating the high-stress culinary crises of "Overcooked! 2" shall be maintained, with a focus on achieving three-star ratings while preserving domestic peace.',
    'A live digital broadcast shall be initiated during all solo gaming sessions, thereby granting J unrestricted spectatorship privileges to monitor, critique, and enjoy the gameplay in real-time.',
    'The procurement and consumption of sugar-sweetened beverages and liquid confectionery are hereby subject to a permanent and absolute ban, effective immediately, in pursuit of optimal health.',
    'A disciplined, rigorous, and highly consistent physical fitness regimen shall be established and strictly adhered to, elevating exercise from a casual suggestion to a mandatory lifestyle decree.'
  ]

  return (
    <section className="section">
      <div className="section-inner reveal">
        <div className="section-overline">SECTION 04 — THE CONTRACT</div>
        <h2 className="section-title">
          WHAT I&#39;M <span className="accent">GIVING BACK</span>
        </h2>
        <p className="section-body">
          Every proper heist has a contract. Below are my binding commitments —
          non-negotiable terms that take effect upon mission approval.
        </p>

        <div className="contract reveal">
          <div className="contract-header">
            LEONIDA PARTNERSHIP AGREEMENT // REF: GTA-VI-2026 // STATUS: PENDING
          </div>

          {commitments.map((text, i) => (
            <div key={i} className="contract-item">
              <div className="contract-check">✓</div>
              <div className="contract-text">
                <strong>§{i + 1}.</strong>{' '}
                {text.includes('[REPLACE THIS') ? (
                  <span className="editable">{text}</span>
                ) : (
                  text
                )}
              </div>
            </div>
          ))}

          <div className="contract-signature">
            <div className="contract-sig-line">OPERATOR D — SIGNATURE</div>
            <div className="contract-sig-line">OPERATOR J — AUTHORIZATION</div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================
// VOTE SECTION
// ============================================
function VoteSection({ onApprove, onAbort }) {
  return (
    <section className="section vote-section">
      <div className="section-inner reveal">
        <div className="section-overline" style={{ justifyContent: 'center' }}>
          SECTION 05 — MISSION AUTHORIZATION
        </div>
        <h2 className="section-title" style={{ textAlign: 'center' }}>
          YOUR <span className="accent">CALL</span>
        </h2>
        <p
          className="section-body"
          style={{ textAlign: 'center', margin: '0 auto 16px' }}
        >
          The briefing is complete. The intel is on the table. The terms are fair.
          <br />
          This mission requires your authorization to proceed.
        </p>

        <div className="vote-buttons">
          <button className="btn-approve" onClick={onApprove}>
            ✦ APPROVE MISSION ✦
          </button>
          <button className="btn-abort" onClick={onAbort}>
            ABORT MISSION
          </button>
        </div>
      </div>
    </section>
  )
}

// ============================================
// CELEBRATION OVERLAY
// ============================================
function CelebrationOverlay({ active }) {
  const titleRef = useRef()
  const subtitleRef = useRef()
  const heartRef = useRef()
  const flashRef = useRef()

  useEffect(() => {
    if (!active) return

    const tl = gsap.timeline()
    tl.to(flashRef.current, { opacity: 1, duration: 0.1 })
      .to(flashRef.current, { opacity: 0, duration: 0.5 })
      .to(titleRef.current, {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: 'elastic.out(1, 0.5)',
      }, '-=0.3')
      .to(subtitleRef.current, { opacity: 1, duration: 0.8 }, '-=0.5')
      .to(heartRef.current, { opacity: 1, duration: 0.6 }, '-=0.4')
  }, [active])

  // Generate confetti pieces
  const confetti = useMemo(() => {
    const colors = ['#ff2d95', '#00fff0', '#8b00ff', '#ff6b00', '#ffd700', '#ff69b4']
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2 + 's',
      duration: Math.random() * 2 + 2 + 's',
      size: Math.random() * 6 + 6 + 'px',
      rotation: Math.random() * 360 + 'deg',
    }))
  }, [])

  return (
    <>
      <div className={`celebration ${active ? 'active' : ''}`}>
        <div ref={flashRef} className="celebration-flash" />
        <h1 ref={titleRef} className="celebration-title">
          MISSION<br />APPROVED
        </h1>
        <p ref={subtitleRef} className="celebration-subtitle">
          BEST PARTNER IN CRIME — EVER 💜
        </p>
        <div ref={heartRef} className="celebration-heart">
          🌴
        </div>
      </div>

      {active && (
        <div className="confetti-container">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="confetti-piece"
              style={{
                left: c.left,
                width: c.size,
                height: c.size,
                background: c.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animation: `confettiFall ${c.duration} ${c.delay} ease-in forwards`,
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ============================================
// ABORT MODAL
// ============================================
function AbortModal({ active, onClose, onApprove }) {
  if (!active) return null

  return (
    <div className={`abort-modal ${active ? 'active' : ''}`}>
      <div className="abort-modal-backdrop" onClick={onClose} />
      <div className="abort-modal-content">
        <h3>WAIT, REALLY?</h3>
        <p>
          The streets of Leonida need us... 🥺
          <br /><br />
          Lucia wouldn&#39;t abort. Jason wouldn&#39;t abort. Are you sure you
          want to be the reason D can&#39;t experience the cultural event of the
          decade?
          <br /><br />
          <em>Think about it. The right button is right there.</em>
        </p>
        <div className="abort-modal-buttons">
          <button className="btn-approve" onClick={onApprove}>
            APPROVE INSTEAD
          </button>
          <button className="btn-abort" onClick={onClose}>
            I NEED TIME
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [celebration, setCelebration] = useState(false)
  const [abortModal, setAbortModal] = useState(false)
  const scrollContainerRef = useRef()

  const handleLoadComplete = useCallback(() => {
    setLoaded(true)
  }, [])

  // Track scroll position globally
  useEffect(() => {
    const onScroll = () => {
      globalScrollY = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      globalScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // GSAP ScrollTrigger animations
  useEffect(() => {
    if (!loaded) return

    // Wait a beat for DOM to be ready
    const timer = setTimeout(() => {
      // Reveal animations for all .reveal elements
      const reveals = document.querySelectorAll('.reveal')
      reveals.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 50 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )
      })

      ScrollTrigger.refresh()
    }, 200)

    return () => {
      clearTimeout(timer)
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [loaded])

  const handleApprove = () => {
    setAbortModal(false)
    setCelebration(true)
  }

  const handleAbort = () => {
    setAbortModal(true)
  }

  return (
    <>
      {/* Loading Screen */}
      {!loaded && <LoadingScreen onComplete={handleLoadComplete} />}

      {/* Scanlines overlay */}
      <div className="scanlines" />

      {/* Fixed Three.js background */}
      <div className="canvas-wrapper">
        <Scene3D />
      </div>

      {/* Scrollable content */}
      <div className="scroll-container" ref={scrollContainerRef}>
        <HeroSection />
        <div className="section-divider" />
        <CaseSection />
        <div className="section-divider" />
        <CoupleSection />
        <div className="section-divider" />
        <AskSection />
        <div className="section-divider" />
        <DealSection />
        <div className="section-divider" />
        <VoteSection onApprove={handleApprove} onAbort={handleAbort} />
      </div>

      {/* Celebration overlay */}
      <CelebrationOverlay active={celebration} />

      {/* Abort modal */}
      <AbortModal
        active={abortModal}
        onClose={() => setAbortModal(false)}
        onApprove={handleApprove}
      />
    </>
  )
}

import { ref, onMounted, onUnmounted, shallowRef, type Ref } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'

export function useThreeScene(canvasRef: Ref<HTMLCanvasElement | null>) {
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const backgroundMesh = shallowRef<THREE.Mesh | null>(null)
  const gamePlanes = shallowRef<THREE.Mesh[]>([])
  const pointLights = shallowRef<THREE.PointLight[]>([])
  
  const clock = new THREE.Clock()

  let animationFrameId = 0
  let currentRotation = { x: 0, y: 0 }
  let targetRotation = { x: 0, y: 0 }

  const init = () => {
    if (!canvasRef.value) return

    // Scene
    scene.value = new THREE.Scene()
    scene.value.fog = new THREE.FogExp2(0x0f0f11, 0.025)

    // Camera
    camera.value = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.value.position.set(0, 0, 40)

    // Renderer
    renderer.value = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.value.setSize(window.innerWidth, window.innerHeight)
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.value.setClearColor(0x050508, 1) // Solid deep midnight slate

    // Ambient Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.value.add(ambientLight)
    
    // Directional light for game cards
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    scene.value.add(directionalLight)

    // Minimalist Background 3D Aurora (Huge Soft Lights on a Dark Plane)
    // 1. The Canvas
    const bgGeometry = new THREE.PlaneGeometry(800, 400)
    const bgMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x050508,
      roughness: 1,
      metalness: 0
    })
    backgroundMesh.value = new THREE.Mesh(bgGeometry, bgMaterial)
    backgroundMesh.value.position.z = -100
    scene.value.add(backgroundMesh.value)

    // 2. The Soft Lights
    const colors = [0x1e3a8a, 0x4c1d95, 0x312e81] // Ocean, Purple, Indigo
    pointLights.value = colors.map(color => {
      // Very high intensity and large distance for a soft, diffused glow
      const light = new THREE.PointLight(color, 25000, 300) 
      scene.value.add(light)
      return light
    })

    // Classy Sci-Fi Flair: Slow rotating wireframe halos in the far background
    const rings = new THREE.Group()
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.05, wireframe: true })
    
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(120, 0.2, 16, 100), ringMat)
    ring1.rotation.x = Math.PI / 2
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(140, 0.2, 16, 100), ringMat)
    ring2.rotation.y = Math.PI / 3
    const ring3 = new THREE.Mesh(new THREE.TorusGeometry(160, 0.2, 16, 100), ringMat)
    ring3.rotation.z = Math.PI / 4

    rings.add(ring1, ring2, ring3)
    rings.position.z = -50
    scene.value.add(rings)
    backgroundMesh.value.userData.rings = rings

    // High-End Multi-Layer Parallax Dust
    const dustLayers = new THREE.Group()
    
    const createDustLayer = (count: number, size: number, opacity: number, zRange: [number, number]) => {
      const geo = new THREE.BufferGeometry()
      const pos = new Float32Array(count * 3)
      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 400
        pos[i+1] = (Math.random() - 0.5) * 400
        pos[i+2] = (Math.random() - 0.5) * (zRange[1] - zRange[0]) + zRange[0]
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const mat = new THREE.PointsMaterial({
        size, color: 0xffffff, transparent: true, opacity, blending: THREE.AdditiveBlending
      })
      return new THREE.Points(geo, mat)
    }

    // Layer 1: Dense, faint, distant pixels
    const dust1 = createDustLayer(5000, 0.05, 0.15, [-150, -50])
    // Layer 2: Medium density, slightly closer
    const dust2 = createDustLayer(2000, 0.1, 0.3, [-60, 10])
    // Layer 3: Sparse, larger glowing pixels, close to camera
    const dust3 = createDustLayer(500, 0.2, 0.5, [0, 40])

    dustLayers.add(dust1, dust2, dust3)
    scene.value.add(dustLayers)
    backgroundMesh.value.userData.dustLayers = dustLayers

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)

    animate()
  }

  const onResize = () => {
    if (!camera.value || !renderer.value) return
    camera.value.aspect = window.innerWidth / window.innerHeight
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(window.innerWidth, window.innerHeight)
  }

  const onMouseMove = (event: MouseEvent) => {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1
    
    // Limit rotation influence
    targetRotation.y = mouseX * 0.05
    targetRotation.x = mouseY * 0.05
  }

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate)

    const elapsedTime = clock.getElapsedTime()

    // Orbit the PointLights slowly across the background plane
    if (pointLights.value.length === 3) {
      pointLights.value[0].position.set(Math.sin(elapsedTime * 0.2) * 120, Math.cos(elapsedTime * 0.15) * 60, -80)
      pointLights.value[1].position.set(Math.sin(elapsedTime * 0.1 + Math.PI) * 140, Math.cos(elapsedTime * 0.2) * 80, -90)
      pointLights.value[2].position.set(Math.sin(elapsedTime * 0.15 + Math.PI/2) * 100, Math.sin(elapsedTime * 0.25) * 50, -85)
    }

    if (backgroundMesh.value) {
      // Rotate Rings
      if (backgroundMesh.value.userData.rings) {
        const rings = backgroundMesh.value.userData.rings
        rings.rotation.x = elapsedTime * 0.02
        rings.rotation.y = elapsedTime * 0.015
        rings.rotation.z = elapsedTime * 0.01
      }
      
      // Rotate Dust Layers (Parallax effect through different speeds)
      if (backgroundMesh.value.userData.dustLayers) {
        const dustLayers = backgroundMesh.value.userData.dustLayers
        // Rotate the whole group slowly
        dustLayers.rotation.y = elapsedTime * 0.01
        
        // Slightly rotate individual layers for complex parallax
        dustLayers.children[0].rotation.y = elapsedTime * 0.005
        dustLayers.children[1].rotation.y = elapsedTime * 0.01
        dustLayers.children[2].rotation.y = elapsedTime * 0.02
        dustLayers.children[2].rotation.x = Math.sin(elapsedTime * 0.5) * 0.05 // Gentle sway on closest dust
      }
    }

    // Smooth camera mouse look
    currentRotation.x += (targetRotation.x - currentRotation.x) * 0.05
    currentRotation.y += (targetRotation.y - currentRotation.y) * 0.05

    if (camera.value) {
      // Base rotation + mouse look
      camera.value.rotation.x = currentRotation.x
      camera.value.rotation.y = currentRotation.y
    }

    // Animate game planes floating
    const time = Date.now() * 0.001
    gamePlanes.value.forEach((plane, index) => {
      const baseY = plane.userData.baseY
      plane.position.y = baseY + Math.sin(time + index) * 1.5
    })

    if (renderer.value && scene.value && camera.value) {
      renderer.value.render(scene.value, camera.value)
    }
  }

  // Generate planes for games
  const addGamePlanes = (games: any[]) => {
    if (!scene.value) return
    
    // Clear old planes
    gamePlanes.value.forEach(p => scene.value?.remove(p))
    gamePlanes.value = []

    const textureLoader = new THREE.TextureLoader()

    games.forEach((game, index) => {
      const geometry = new THREE.PlaneGeometry(16, 9)
      
      let material
      if (game.image_url && game.image_url.startsWith('http')) {
        const texture = textureLoader.load(game.image_url)
        // Add anisotropic filtering for better quality
        if (renderer.value) {
          texture.anisotropy = renderer.value.capabilities.getMaxAnisotropy()
        }
        material = new THREE.MeshBasicMaterial({ 
          map: texture, 
          transparent: true, 
          opacity: 0.3,
          side: THREE.DoubleSide
        })
      } else {
        material = new THREE.MeshBasicMaterial({ 
          color: 0x111111, 
          transparent: true, 
          opacity: 0.2,
          side: THREE.DoubleSide,
          wireframe: true
        })
      }

      const plane = new THREE.Mesh(geometry, material)
      
      // Position planes in a wide arc or circle around the center
      const angle = (index / Math.max(games.length, 1)) * Math.PI * 0.8 - (Math.PI * 0.4) // Spread across arc
      const radius = 35
      
      plane.position.x = Math.sin(angle) * radius
      plane.position.y = (index % 2 === 0 ? 3 : -3) // Stagger Y slightly
      plane.position.z = -Math.cos(angle) * radius + 10 // Shift forward
      
      plane.lookAt(0, plane.position.y, 40) // Look roughly at center camera pos
      
      plane.userData = { 
        gameId: game.id, 
        index, 
        angle, 
        radius, 
        baseY: plane.position.y,
        baseX: plane.position.x,
        baseZ: plane.position.z
      }

      scene.value.add(plane)
      gamePlanes.value.push(plane)
    })
  }

  const flyToGame = (gameId: string) => {
    if (!camera.value) return

    const targetPlane = gamePlanes.value.find(p => p.userData.gameId === gameId)
    
    if (targetPlane) {
      // Calculate a position slightly in front of the plane
      const offset = 10
      // Vector from center to plane
      const angle = targetPlane.userData.angle
      const radius = targetPlane.userData.radius - offset
      
      const targetPos = {
        x: Math.sin(angle) * radius,
        y: targetPlane.userData.baseY,
        z: -Math.cos(angle) * radius + 10
      }

      // OVER THE TOP FLAIR
      const tl = gsap.timeline()

      // 1. Dramatic pullback and slight rotation
      tl.to(camera.value.position, {
        x: targetPos.x * 0.5,
        y: targetPos.y + 15,
        z: 45,
        duration: 0.6,
        ease: 'power2.in'
      })
      // 2. High-speed swoop into the target
      .to(camera.value.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.2,
        ease: 'power4.out'
      })

      // Make target plane pop out dynamically
      gamePlanes.value.forEach(p => {
        if (p === targetPlane) {
          gsap.to(p.material, { opacity: 1, duration: 1.8 })
          
          // Elastic pop
          gsap.fromTo(p.scale, 
            { x: 0.8, y: 0.8, z: 0.8 }, 
            { x: 1.15, y: 1.15, z: 1.15, duration: 1.5, ease: 'elastic.out(1, 0.4)' }
          )
          
          // Slight rotational flair
          gsap.fromTo(p.rotation,
            { z: Math.PI * 0.05 },
            { z: 0, duration: 1.5, ease: 'elastic.out(1, 0.4)' }
          )
          
        } else {
          // Push others away and fade
          gsap.to(p.material, { opacity: 0.05, duration: 0.8 })
          gsap.to(p.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 0.8 })
        }
      })
    }
  }

  const flyToOverview = () => {
    if (!camera.value) return

    gsap.to(camera.value.position, {
      x: 0,
      y: 0,
      z: 40,
      duration: 1.5,
      ease: 'power3.inOut'
    })

    gamePlanes.value.forEach(p => {
      gsap.to(p.material, { opacity: 0.3, duration: 1 })
      gsap.to(p.scale, { x: 1, y: 1, z: 1, duration: 1 })
    })
  }

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mousemove', onMouseMove)
    cancelAnimationFrame(animationFrameId)
    if (renderer.value) {
      renderer.value.dispose()
    }
  })

  return {
    init,
    addGamePlanes,
    flyToGame,
    flyToOverview
  }
}

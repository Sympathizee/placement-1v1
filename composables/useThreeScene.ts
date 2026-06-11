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

    // Minimalist Floating Dust
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 1000
    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 400
      posArray[i+1] = (Math.random() - 0.5) * 400
      posArray[i+2] = (Math.random() - 0.5) * 200 - 20
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      color: 0xffffff,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending
    })

    const dustParticles = new THREE.Points(particlesGeometry, particleMaterial)
    scene.value.add(dustParticles)
    // Store in backgroundMesh userData so we can rotate it in animate()
    backgroundMesh.value.userData.dust = dustParticles

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

    if (backgroundMesh.value && backgroundMesh.value.userData.dust) {
      const dust = backgroundMesh.value.userData.dust;
      dust.rotation.y = elapsedTime * 0.01;
      dust.rotation.x = elapsedTime * 0.005;
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

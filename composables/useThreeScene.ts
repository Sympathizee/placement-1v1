import { ref, onMounted, onUnmounted, shallowRef, type Ref } from 'vue'
import * as THREE from 'three'
import gsap from 'gsap'

export function useThreeScene(canvasRef: Ref<HTMLCanvasElement | null>) {
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const backgroundMesh = shallowRef<THREE.Mesh | null>(null)
  const gamePlanes = shallowRef<THREE.Mesh[]>([])
  
  const clock = new THREE.Clock()
  
  const uniforms = {
    u_time: { value: 0.0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_mouse: { value: new THREE.Vector2() },
    u_color1: { value: new THREE.Color(0x0a1a3a) }, // Deep Ocean Blue
    u_color2: { value: new THREE.Color(0x1a0b2e) }, // Cosmic Purple
    u_color3: { value: new THREE.Color(0x020205) }, // Void Black
  }

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
    renderer.value.setClearColor(0x0f0f11, 0) // Set alpha to 0 for transparency

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.value.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(10, 20, 10)
    scene.value.add(directionalLight)

    // Create Award-Winning Shader Background
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        // Bypass projection and view matrices to make this a perfect fullscreen quad
        gl_Position = vec4(position.xy, 0.99, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;
      uniform vec3 u_color1;
      uniform vec3 u_color2;
      uniform vec3 u_color3;
      varying vec2 vUv;

      // Simplex 2D noise
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1; i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;
        st.x *= u_resolution.x / u_resolution.y;

        vec2 mouse = u_mouse * 0.15; // Smooth subtle mouse interaction
        
        // Fluid domain warping
        vec2 q = vec2(0.);
        q.x = snoise(st + 0.05 * u_time);
        q.y = snoise(st + vec2(1.0));

        vec2 r = vec2(0.);
        r.x = snoise(st + 1.2 * q + vec2(1.7,9.2)+ 0.15 * u_time + mouse);
        r.y = snoise(st + 1.2 * q + vec2(8.3,2.8)+ 0.126 * u_time - mouse);

        float f = snoise(st + r);

        // Mix organic colors
        vec3 color = mix(u_color3, u_color2, clamp((f*f)*4.0, 0.0, 1.0));
        color = mix(color, u_color1, clamp(length(q), 0.0, 1.0));
        color = mix(color, u_color2, clamp(length(r.x), 0.0, 1.0));
        
        // Ethereal highlights
        color += vec3(0.2, 0.4, 0.8) * (f * f * f * 1.5);
        
        // Deep edge vignette
        vec2 p = gl_FragCoord.xy / u_resolution.xy - 0.5;
        float len = length(p);
        color *= smoothstep(0.85, 0.2, len);

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
      transparent: true,
    });

    const bgGeometry = new THREE.PlaneGeometry(2, 2);
    backgroundMesh.value = new THREE.Mesh(bgGeometry, shaderMaterial);
    backgroundMesh.value.frustumCulled = false;
    scene.value.add(backgroundMesh.value);

    // Floating Dust Particles for Depth
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 800
    const posArray = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 200 // x
      posArray[i+1] = (Math.random() - 0.5) * 200 // y
      posArray[i+2] = (Math.random() - 0.5) * 150 - 20 // z (pushed slightly back)
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    
    // Custom soft glowing particles using a radial gradient map generated in canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.8,
      color: 0x88bbff,
      transparent: true,
      opacity: 0.6,
      map: particleTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const dustParticles = new THREE.Points(particlesGeometry, particleMaterial)
    // Save to backgroundMesh userData to animate it
    backgroundMesh.value.userData.dust = dustParticles;
    scene.value.add(dustParticles)

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMouseMove)

    animate()
  }

  const onResize = () => {
    if (!camera.value || !renderer.value) return
    camera.value.aspect = window.innerWidth / window.innerHeight
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(window.innerWidth, window.innerHeight)
    uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight)
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

    // Update Shader Uniforms
    const elapsedTime = clock.getElapsedTime()
    uniforms.u_time.value = elapsedTime

    // Smoothly interpolate mouse for fluid reaction
    uniforms.u_mouse.value.x += (targetRotation.y - uniforms.u_mouse.value.x) * 0.05
    uniforms.u_mouse.value.y += (targetRotation.x - uniforms.u_mouse.value.y) * 0.05

    if (backgroundMesh.value && backgroundMesh.value.userData.dust) {
      const dust = backgroundMesh.value.userData.dust;
      dust.rotation.y = elapsedTime * 0.02;
      dust.rotation.x = elapsedTime * 0.01;
      // Slight gentle wave
      dust.position.y = Math.sin(elapsedTime * 0.5) * 2.0;
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

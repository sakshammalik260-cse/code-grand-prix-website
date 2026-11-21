import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import * as THREE from 'three'
import styles from './RacingUniverse.module.css'

interface UniverseProps { quality: 'high' | 'low'; onReady: () => void }
interface SceneProps { quality: 'high' | 'low'; progress: React.MutableRefObject<number>; pointer: React.MutableRefObject<{ x: number; y: number }> }

const trackCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-27, -1.72, 13), new THREE.Vector3(-11, -1.72, 27), new THREE.Vector3(20, -1.72, 21),
  new THREE.Vector3(34, -1.72, 1), new THREE.Vector3(24, -1.72, -25), new THREE.Vector3(-4, -1.72, -34),
  new THREE.Vector3(-31, -1.72, -19), new THREE.Vector3(-38, -1.72, 2),
], true, 'catmullrom', .18)

const cameraPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 43, 72), new THREE.Vector3(5, 35, 55), new THREE.Vector3(10, 23, 37),
  new THREE.Vector3(22, 14, 21), new THREE.Vector3(29, 8, 0), new THREE.Vector3(17, 5, -21),
  new THREE.Vector3(7, 4, -38), new THREE.Vector3(0, 3.2, -55), new THREE.Vector3(0, 3.4, -74),
  new THREE.Vector3(0, 10, -94), new THREE.Vector3(0, 38, -119),
], false, 'catmullrom', .3)

const lookPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 26, 42), new THREE.Vector3(0, 19, 30), new THREE.Vector3(2, 5, 10),
  new THREE.Vector3(8, 0, -7), new THREE.Vector3(15, -1, -17), new THREE.Vector3(3, 0, -36),
  new THREE.Vector3(0, 1, -51), new THREE.Vector3(0, 2, -68), new THREE.Vector3(0, 4, -88),
  new THREE.Vector3(0, 24, -114), new THREE.Vector3(0, 39, -145),
], false, 'catmullrom', .3)

const sceneStops = [
  { at: 0, label: 'ABOVE THE CLOUDS', short: 'SKY', href: '#home' },
  { at: .16, label: 'ATMOSPHERIC DESCENT', short: 'DESCENT', href: '#about' },
  { at: .3, label: 'THE CODE CIRCUIT', short: 'CIRCUIT', href: '#schedule' },
  { at: .47, label: 'PIT LANE CONTROL', short: 'PIT', href: '#access' },
  { at: .62, label: 'RACING GARAGE', short: 'GARAGE', href: '#rules' },
  { at: .77, label: 'STARTING GRID', short: 'GRID', href: '#classification' },
  { at: .91, label: 'INFINITE VELOCITY', short: 'LOOP', href: '#contact' },
] as const

const seeded = (value: number) => {
  const result = Math.sin(value * 91.3458) * 47453.5453
  return result - Math.floor(result)
}

function roadGeometry(samples: number, width: number) {
  const geometry = new THREE.BufferGeometry()
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const point = new THREE.Vector3(), tangent = new THREE.Vector3(), side = new THREE.Vector3()
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples
    trackCurve.getPointAt(t, point); trackCurve.getTangentAt(t, tangent)
    side.set(-tangent.z, 0, tangent.x).normalize().multiplyScalar(width / 2)
    positions.push(point.x + side.x, point.y, point.z + side.z, point.x - side.x, point.y, point.z - side.z)
    uvs.push(0, t * 12, 1, t * 12)
    if (index < samples) {
      const offset = index * 2
      indices.push(offset, offset + 2, offset + 1, offset + 2, offset + 3, offset + 1)
    }
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices); geometry.computeVertexNormals()
  return geometry
}

function CloudField({ quality }: { quality: 'high' | 'low' }) {
  const count = quality === 'high' ? 58 : 24
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const clouds = useMemo(() => Array.from({ length: count }, (_, index) => {
    const ending = index >= count * .58
    return {
      x: (seeded(index + 1) - .5) * (ending ? 95 : 105),
      y: ending ? 20 + seeded(index + 31) * 22 : 8 + seeded(index + 31) * 17,
      z: ending ? -94 - seeded(index + 73) * 52 : 28 + seeded(index + 91) * 68,
      scale: 1.7 + seeded(index + 111) * 4.4,
    }
  }), [count])
  useLayoutEffect(() => {
    if (!mesh.current) return
    const helper = new THREE.Object3D()
    clouds.forEach((cloud, index) => {
      helper.position.set(cloud.x, cloud.y, cloud.z)
      helper.scale.set(cloud.scale * 2.15, cloud.scale * .52, cloud.scale * 1.25)
      helper.rotation.set(seeded(index + 9) * .4, seeded(index + 12) * Math.PI, 0)
      helper.updateMatrix(); mesh.current?.setMatrixAt(index, helper.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  }, [clouds])
  useFrame(({ clock }) => { if (group.current) group.current.position.x = Math.sin(clock.elapsedTime * .055) * 1.8 })
  return <group ref={group}>
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshBasicMaterial color="#edf6f8" transparent opacity={quality === 'high' ? .105 : .08} depthWrite={false} />
    </instancedMesh>
  </group>
}

function MountainRange() {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const count = 14
  useLayoutEffect(() => {
    if (!mesh.current) return
    const helper = new THREE.Object3D()
    for (let index = 0; index < count; index += 1) {
      helper.position.set(-62 + index * 9.5, -2, 24 + seeded(index + 2) * 15)
      helper.scale.set(5 + seeded(index + 5) * 7, 12 + seeded(index + 8) * 19, 5 + seeded(index + 13) * 8)
      helper.rotation.y = seeded(index + 22) * Math.PI
      helper.updateMatrix(); mesh.current.setMatrixAt(index, helper.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [])
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
    <coneGeometry args={[1, 1, 5]} />
    <meshStandardMaterial color="#263642" roughness={1} />
  </instancedMesh>
}

function Curbs({ quality }: { quality: 'high' | 'low' }) {
  const count = quality === 'high' ? 112 : 56
  const left = useRef<THREE.InstancedMesh>(null), right = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const helper = new THREE.Object3D(), point = new THREE.Vector3(), tangent = new THREE.Vector3(), side = new THREE.Vector3()
    for (let index = 0; index < count; index += 1) {
      const t = index / count
      trackCurve.getPointAt(t, point); trackCurve.getTangentAt(t, tangent)
      side.set(-tangent.z, 0, tangent.x).normalize().multiplyScalar(4.5)
      helper.scale.set(.55, .14, 1.08); helper.rotation.y = Math.atan2(tangent.x, tangent.z)
      helper.position.copy(point).add(side); helper.position.y += .08; helper.updateMatrix(); left.current?.setMatrixAt(index, helper.matrix)
      helper.position.copy(point).sub(side); helper.position.y += .08; helper.updateMatrix(); right.current?.setMatrixAt(index, helper.matrix)
      const color = new THREE.Color(index % 2 ? '#f1f1f1' : '#d90c18')
      left.current?.setColorAt(index, color); right.current?.setColorAt(index, color)
    }
    for (const item of [left.current, right.current]) if (item) { item.instanceMatrix.needsUpdate = true; if (item.instanceColor) item.instanceColor.needsUpdate = true }
  }, [count])
  return <>
    <instancedMesh ref={left} args={[undefined, undefined, count]}><boxGeometry /><meshStandardMaterial vertexColors roughness={.78} /></instancedMesh>
    <instancedMesh ref={right} args={[undefined, undefined, count]}><boxGeometry /><meshStandardMaterial vertexColors roughness={.78} /></instancedMesh>
  </>
}

function Barriers({ quality }: { quality: 'high' | 'low' }) {
  const count = quality === 'high' ? 64 : 32
  const mesh = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    const helper = new THREE.Object3D(), point = new THREE.Vector3(), tangent = new THREE.Vector3(), side = new THREE.Vector3()
    for (let index = 0; index < count; index += 1) {
      const t = index / count
      trackCurve.getPointAt(t, point); trackCurve.getTangentAt(t, tangent)
      side.set(-tangent.z, 0, tangent.x).normalize().multiplyScalar(6.6)
      helper.position.copy(point).add(side); helper.position.y += .75
      helper.scale.set(.16, 1.35, 1.7); helper.rotation.y = Math.atan2(tangent.x, tangent.z); helper.updateMatrix()
      mesh.current.setMatrixAt(index, helper.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [count])
  return <instancedMesh ref={mesh} args={[undefined, undefined, count]}><boxGeometry /><meshStandardMaterial color="#707780" metalness={.55} roughness={.45} /></instancedMesh>
}

function RaceCar({ offset, color, progress }: { offset: number; color: string; progress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    const t = (offset + clock.elapsedTime * .018 + progress.current * .035) % 1
    const point = trackCurve.getPointAt(t), tangent = trackCurve.getTangentAt(t)
    group.current.position.copy(point); group.current.position.y += .45
    group.current.rotation.y = Math.atan2(tangent.x, tangent.z)
  })
  return <group ref={group} scale={.72}>
    <mesh castShadow><boxGeometry args={[1.55, .35, 3.2]} /><meshStandardMaterial color={color} metalness={.65} roughness={.25} /></mesh>
    <mesh position={[0, .25, -.25]}><boxGeometry args={[.75, .32, 1.15]} /><meshStandardMaterial color="#090b10" metalness={.8} roughness={.18} /></mesh>
    <mesh position={[0, .08, -1.9]}><boxGeometry args={[2.05, .1, .42]} /><meshStandardMaterial color={color} /></mesh>
    {[[-.92, -.12, 1.05], [.92, -.12, 1.05], [-.92, -.12, -1.02], [.92, -.12, -1.02]].map((position, index) => <mesh key={index} position={position as [number, number, number]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.28, .28, .2, 10]} /><meshStandardMaterial color="#050608" roughness={.8} /></mesh>)}
  </group>
}

function TextBoard({ text, position, rotation = [0, 0, 0] }: { text: string; position: [number, number, number]; rotation?: [number, number, number] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 192
    const context = canvas.getContext('2d')!
    context.fillStyle = '#090b10'; context.fillRect(0, 0, canvas.width, canvas.height)
    context.strokeStyle = '#f20d18'; context.lineWidth = 8; context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)
    context.fillStyle = '#f5f7fa'; context.font = '700 58px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(text, canvas.width / 2, canvas.height / 2)
    const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace; return result
  }, [text])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={position} rotation={rotation}><planeGeometry args={[8, 2]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
}

function CircuitWorld({ quality, progress }: { quality: 'high' | 'low'; progress: React.MutableRefObject<number> }) {
  const geometry = useMemo(() => roadGeometry(quality === 'high' ? 180 : 100, 8.3), [quality])
  useEffect(() => () => geometry.dispose(), [geometry])
  const stands = [[-42, 2, -3], [39, 2, -7], [-31, 2, -30], [32, 2, -28]] as const
  return <group>
    <mesh position={[0, -2.05, -10]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[190, 190]} /><meshStandardMaterial color="#0b1014" roughness={1} /></mesh>
    <mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#171b20" roughness={.88} metalness={.12} /></mesh>
    <mesh><tubeGeometry args={[trackCurve, quality === 'high' ? 220 : 110, .055, 4, true]} /><meshBasicMaterial color="#c9cdd2" /></mesh>
    <Curbs quality={quality} /><Barriers quality={quality} />
    {stands.map((position, index) => <group key={index} position={position as unknown as [number, number, number]} rotation={[0, index % 2 ? -.3 : .25, 0]}>
      <mesh><boxGeometry args={[16, 4, 6]} /><meshStandardMaterial color="#202832" metalness={.25} roughness={.7} /></mesh>
      <mesh position={[0, 2.5, -2]} rotation={[-.16, 0, 0]}><boxGeometry args={[17, .35, 5]} /><meshStandardMaterial color="#58616d" /></mesh>
    </group>)}
    <group position={[17, 1.5, -29]}>
      <mesh><boxGeometry args={[20, 6, 7]} /><meshStandardMaterial color="#131922" metalness={.55} roughness={.38} /></mesh>
      {[-7.5, -4.5, -1.5, 1.5, 4.5, 7.5].map(x => <mesh key={x} position={[x, .4, 3.52]}><planeGeometry args={[2.1, 1.45]} /><meshBasicMaterial color="#55dbea" toneMapped={false} /></mesh>)}
    </group>
    <TextBoard text="CODE // COMPILE" position={[-27, 5, -4]} rotation={[0, .55, 0]} />
    <TextBoard text="CPC RACE CONTROL" position={[27, 5, -18]} rotation={[0, -.55, 0]} />
    <RaceCar offset={.04} color="#f20d18" progress={progress} />
    {quality === 'high' && <><RaceCar offset={.34} color="#f5f5f7" progress={progress} /><RaceCar offset={.68} color="#36d9a0" progress={progress} /></>}
  </group>
}

function GarageWorld() {
  return <group position={[0, 0, -43]}>
    <mesh position={[-11, 2, 0]}><boxGeometry args={[18, 8, 12]} /><meshStandardMaterial color="#111720" metalness={.5} roughness={.42} /></mesh>
    <mesh position={[10, 1.5, 1]}><boxGeometry args={[16, 7, 10]} /><meshStandardMaterial color="#171c24" metalness={.42} roughness={.48} /></mesh>
    {[-16, -12, -8, 5, 9, 13].map((x, index) => <mesh key={x} position={[x, 2.2, 6.05]}><planeGeometry args={[2.6, 1.65]} /><meshBasicMaterial color={index % 2 ? '#f20d18' : '#59dce8'} toneMapped={false} /></mesh>)}
    <mesh position={[0, -1.6, 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[44, 22]} /><meshStandardMaterial color="#101319" roughness={.84} /></mesh>
    <TextBoard text="PIT WALL / TELEMETRY" position={[0, 7, -1]} />
  </group>
}

function StartingGrid({ progress }: { progress: React.MutableRefObject<number> }) {
  const materials = useRef<THREE.MeshBasicMaterial[]>([])
  useFrame(() => {
    const phase = THREE.MathUtils.clamp((progress.current - .7) / .105, 0, 1)
    const count = phase > .9 ? 0 : Math.floor(phase * 6)
    materials.current.forEach((material, index) => material.color.set(index < count ? '#f20d18' : '#28040a'))
  })
  return <group position={[0, 0, -56]}>
    <mesh position={[0, -1.85, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[18, 42]} /><meshStandardMaterial color="#16191e" roughness={.9} /></mesh>
    {Array.from({ length: 12 }, (_, index) => <mesh key={index} position={[index % 2 ? -3.2 : 3.2, -1.72, -15 + Math.floor(index / 2) * 5.2]}><boxGeometry args={[3.5, .03, .14]} /><meshBasicMaterial color="#eff1f3" /></mesh>)}
    <mesh position={[-6, 3, 0]}><boxGeometry args={[.35, 9, .35]} /><meshStandardMaterial color="#5e6671" metalness={.8} /></mesh>
    <mesh position={[6, 3, 0]}><boxGeometry args={[.35, 9, .35]} /><meshStandardMaterial color="#5e6671" metalness={.8} /></mesh>
    <mesh position={[0, 7.2, 0]}><boxGeometry args={[12.4, .45, .45]} /><meshStandardMaterial color="#5e6671" metalness={.8} /></mesh>
    {[-2.4, -1.2, 0, 1.2, 2.4].map((x, index) => <mesh key={x} position={[x, 6.7, -.2]}><sphereGeometry args={[.37, 12, 10]} /><meshBasicMaterial ref={material => { if (material) materials.current[index] = material }} color="#28040a" toneMapped={false} /></mesh>)}
    <TextBoard text="CODE GRAND PRIX / GRID" position={[0, 9, -.2]} />
  </group>
}

function VelocityTunnel() {
  return <group>
    {Array.from({ length: 17 }, (_, index) => <mesh key={index} position={[0, 3, -69 - index * 3.25]} scale={[1, .68, 1]}>
      <torusGeometry args={[6.2, .075, 5, 40]} />
      <meshBasicMaterial color={index % 3 === 0 ? '#64ddeb' : '#f20d18'} toneMapped={false} transparent opacity={.72} />
    </mesh>)}
    <mesh position={[0, -1.7, -94]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[13, 58]} /><meshStandardMaterial color="#080a0e" roughness={.72} metalness={.35} /></mesh>
  </group>
}

function AtmosphereParticles({ quality }: { quality: 'high' | 'low' }) {
  const group = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count = quality === 'high' ? 520 : 170
    const values = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      values[index * 3] = (seeded(index + 1) - .5) * 120; values[index * 3 + 1] = seeded(index + 17) * 65 - 5; values[index * 3 + 2] = 55 - seeded(index + 37) * 190
    }
    return values
  }, [quality])
  useFrame(({ clock }) => { if (group.current) group.current.rotation.y = clock.elapsedTime * .004 })
  return <points ref={group}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color="#d9f8ff" size={.12} transparent opacity={.35} depthWrite={false} /></points>
}

/* R3F frame callbacks intentionally mutate Three.js scene objects outside React's render cycle. */
function UniverseScene({ quality, progress, pointer }: SceneProps) {
  const { camera, scene } = useThree()
  const fog = useRef<THREE.Fog>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const smoothProgress = useRef(0)
  const cameraPosition = useMemo(() => new THREE.Vector3(), []), lookPosition = useMemo(() => new THREE.Vector3(), [])
  const sky = useMemo(() => new THREE.Color('#315f7d'), []), dusk = useMemo(() => new THREE.Color('#151d29'), []), night = useMemo(() => new THREE.Color('#05070b'), []), loopSky = useMemo(() => new THREE.Color('#315f7d'), []), mixed = useMemo(() => new THREE.Color(), [])
  useFrame((_, delta) => {
    smoothProgress.current = THREE.MathUtils.damp(smoothProgress.current, progress.current, quality === 'high' ? 4.2 : 5.5, delta)
    const value = THREE.MathUtils.clamp(smoothProgress.current, 0, 1)
    cameraPath.getPointAt(value, cameraPosition); lookPath.getPointAt(value, lookPosition)
    const pointerStrength = quality === 'high' ? 1 : .28
    cameraPosition.x += pointer.current.x * 1.4 * pointerStrength; cameraPosition.y += pointer.current.y * .8 * pointerStrength
    camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 5)); camera.lookAt(lookPosition)
    const desiredFov = 46 + Math.sin(value * Math.PI) * 4; if (Math.abs((camera as THREE.PerspectiveCamera).fov - desiredFov) > .03) { (camera as THREE.PerspectiveCamera).fov = desiredFov; (camera as THREE.PerspectiveCamera).updateProjectionMatrix() }
    if (value < .28) mixed.lerpColors(sky, dusk, value / .28); else if (value < .82) mixed.lerpColors(dusk, night, (value - .28) / .54); else mixed.lerpColors(night, loopSky, (value - .82) / .18)
    if (scene.background instanceof THREE.Color) scene.background.copy(mixed)
    if (fog.current) { fog.current.color.copy(mixed); fog.current.near = value > .82 ? 9 : 18; fog.current.far = value > .82 ? 72 : 125 }
    if (sun.current) sun.current.intensity = 1.2 + (1 - value) * 1.7
  })
  return <>
    <color attach="background" args={['#315f7d']} />
    <fog ref={fog} attach="fog" args={['#315f7d', 18, 125]} />
    <ambientLight intensity={1.15} color="#9ec6d8" />
    <directionalLight ref={sun} position={[35, 55, 30]} intensity={2.4} color="#ffe1ae" />
    <pointLight position={[0, 8, -45]} intensity={28} distance={48} color="#f20d18" />
    <pointLight position={[0, 8, -79]} intensity={20} distance={38} color="#55dbea" />
    <mesh position={[34, 48, 18]}><sphereGeometry args={[3.2, 20, 16]} /><meshBasicMaterial color="#ffe7b0" toneMapped={false} /></mesh>
    <Stars radius={95} depth={42} count={quality === 'high' ? 700 : 260} factor={3} saturation={.2} fade speed={.2} />
    <CloudField quality={quality} /><MountainRange /><AtmosphereParticles quality={quality} />
    <CircuitWorld quality={quality} progress={progress} /><GarageWorld /><StartingGrid progress={progress} /><VelocityTunnel />
  </>
}

export function RacingUniverse({ quality, onReady }: UniverseProps) {
  const progress = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })
  const progressBar = useRef<HTMLSpanElement>(null)
  const [sceneIndex, setSceneIndex] = useState(0)

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      invalidateOnRefresh: true,
      onUpdate: self => {
        progress.current = self.progress
        if (progressBar.current) progressBar.current.style.transform = `scaleX(${self.progress})`
        let next = 0
        sceneStops.forEach((stop, index) => { if (self.progress >= stop.at) next = index })
        setSceneIndex(current => current === next ? current : next)
      },
    })
    const pointerMove = (event: PointerEvent) => { pointer.current.x = event.clientX / window.innerWidth - .5; pointer.current.y = event.clientY / window.innerHeight - .5 }
    window.addEventListener('pointermove', pointerMove, { passive: true })
    requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => { trigger.kill(); window.removeEventListener('pointermove', pointerMove) }
  }, [])

  return <>
    <Canvas className={styles.canvas} dpr={quality === 'high' ? [1, 1.5] : 1} camera={{ position: [0, 43, 72], fov: 46, near: .1, far: 230 }} gl={{ antialias: quality === 'high', powerPreference: 'high-performance', alpha: false }} onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; onReady() }} fallback={<div className={styles.fallback} />}>
      <UniverseScene quality={quality} progress={progress} pointer={pointer} />
    </Canvas>
    <div className={styles.progress} aria-hidden="true"><span ref={progressBar} /></div>
    <aside className={styles.hud}>
      <div className={styles.readout} aria-hidden="true"><small>CAMERA PATH / 0{sceneIndex + 1}</small><strong>{sceneStops[sceneIndex].label}</strong></div>
      <nav className={styles.sceneNav} aria-label="Journey scenes">
        {sceneStops.map((scene, index) => <a key={scene.short} href={scene.href} data-active={sceneIndex === index || undefined}><span>{scene.short}</span></a>)}
      </nav>
    </aside>
  </>
}

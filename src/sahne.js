import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { fbm } from './gurultu.js'
import { dikilitas } from './dikilitas.js'
import { kok, pbrSeti, modelYukle, hdrYukle } from './varliklar.js'
import { tozOlustur } from './toz.js'

const GECE = 0x0b0907

export async function sahneKur(canvas) {
  // --- Render motoru ---
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(GECE, 1)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05

  const sahne = new THREE.Scene()
  sahne.background = new THREE.Color(GECE) // gece göğü: son işlemlerde de koyu kalsın
  sahne.fog = new THREE.Fog(GECE, 12, 38)
  const kamera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 200)

  // --- Gerçek gökyüzü ışığı (HDRI): taşa doğal ortam ışığı ve yansıma ---
  const hdr = await hdrYukle(`${kok}hdri/qwantani_moonrise_puresky_2k.hdr`)
  hdr.mapping = THREE.EquirectangularReflectionMapping
  const pmrem = new THREE.PMREMGenerator(renderer)
  sahne.environment = pmrem.fromEquirectangular(hdr).texture
  sahne.environmentIntensity = 0.35
  hdr.dispose()

  // --- Alçaktan vuran sıcak ışık: kabartmaların gölgesini belirginleştirir ---
  const anaIsik = new THREE.DirectionalLight(0xffc89a, 2.6)
  anaIsik.position.set(-7, 4.5, 5)
  anaIsik.castShadow = true
  anaIsik.shadow.mapSize.set(4096, 4096)
  Object.assign(anaIsik.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 })
  anaIsik.shadow.bias = -0.0003
  anaIsik.shadow.normalBias = 0.02
  sahne.add(anaIsik)

  // Soğuk gece kenar ışığı
  const arkaIsik = new THREE.DirectionalLight(0x8fb0ff, 0.9)
  arkaIsik.position.set(5, 6, -8)
  sahne.add(arkaIsik)

  // Kabartmaların üstünden geçecek meşale (başta kapalı)
  const mesale = new THREE.PointLight(0xff9a50, 0, 6, 1.8)
  mesale.position.set(-1.4, 2.4, 1.3)
  sahne.add(mesale)

  // --- Zemin: çatlak, taşlı kuru toprak (Poly Haven, CC0) ---
  const zeminGeo = new THREE.PlaneGeometry(90, 90, 220, 220)
  zeminGeo.rotateX(-Math.PI / 2)
  const p = zeminGeo.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i)
    p.setY(i, fbm(x / 7, z / 7, 2.2) * 0.4 + fbm(x * 0.8, z * 0.8, 5.1, 2) * 0.04 - 0.05)
  }
  zeminGeo.computeVertexNormals()
  const zemin = new THREE.Mesh(zeminGeo, new THREE.MeshStandardMaterial({
    ...pbrSeti('dry_ground_rocks', 30),
    normalScale: new THREE.Vector2(1.6, 1.6),
    color: 0xb8a48c,
  }))
  zemin.receiveShadow = true
  sahne.add(zemin)

  // --- Ortadaki iki dev ---
  const ana = dikilitas({ tohum: 1 })
  sahne.add(ana)
  const ikiz = dikilitas({ tohum: 7 })
  ikiz.position.set(2.7, 0, -2.4)
  ikiz.rotation.y = -0.12
  sahne.add(ikiz)

  // --- Halka: duvara gömülü on dikilitaş ---
  const halkaR = 8.6
  for (let i = 0; i < 10; i++) {
    const aci = (i / 10) * Math.PI * 2 + 0.3 + Math.PI / 10 // kameranın önü boş kalsın
    const tas = dikilitas({ tohum: 20 + i * 3, kabartmali: false })
    tas.scale.setScalar(0.72)
    tas.position.set(Math.cos(aci) * halkaR, 0, Math.sin(aci) * halkaR)
    tas.lookAt(0, 0, 0)
    tas.rotateY(Math.PI / 2)
    sahne.add(tas)
  }

  // --- Duvar: gerçek taş taramalarından örülür (Poly Haven, CC0) ---
  const model = await modelYukle(`${kok}modeller/namaqualand_stones_01/namaqualand_stones_01_1k.gltf`)
  const cesitler = []
  model.scene.traverse((o) => {
    if (o.isMesh) {
      o.geometry.center()
      cesitler.push(o)
    }
  })
  const sira = 3, sirada = 96
  const m = new THREE.Object3D()
  cesitler.forEach((tas, c) => {
    const adet = Math.ceil((sira * sirada) / cesitler.length)
    // Taramalardaki renkli çakıl tonlarını kireçtaşı-toprak rengine yaklaştır
    const malzeme = tas.material.clone()
    malzeme.color.setHex(0x9c9284)
    const ornek = new THREE.InstancedMesh(tas.geometry, malzeme, adet)
    let k = 0
    for (let i = c; i < sira * sirada; i += cesitler.length) {
      const s = Math.floor(i / sirada)
      const aci = ((i % sirada) + (s % 2) * 0.5) / sirada * Math.PI * 2
      const r = halkaR + 0.95 + fbm(i, 1, 1) * 0.25
      m.position.set(Math.cos(aci) * r, 0.18 + s * 0.36, Math.sin(aci) * r)
      m.rotation.set(fbm(i, 2, 3) * 0.5, -aci + fbm(i, 4, 1) * 0.8, fbm(i, 5, 2) * 0.4)
      m.scale.setScalar(6.5 + (fbm(i, 3, 3) + 0.5) * 3)
      m.updateMatrix()
      ornek.setMatrixAt(k++, m.matrix)
    }
    ornek.count = k
    ornek.castShadow = ornek.receiveShadow = true
    sahne.add(ornek)
  })

  // --- Havada süzülen, ışıldayan toz ---
  const toz = tozOlustur(renderer.getPixelRatio())
  sahne.add(toz.nokta)

  // --- Son işlemler: köşe gölgeleri (GTAO) + parlak noktalarda ışıma ---
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(sahne, kamera))
  const gtao = new GTAOPass(sahne, kamera, innerWidth, innerHeight)
  gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1, scale: 1.2 })
  gtao.blendIntensity = 0.9
  composer.addPass(gtao)
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.4, 0.55, 0.85))
  composer.addPass(new OutputPass())

  function boyutla() {
    kamera.aspect = innerWidth / innerHeight
    kamera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
    composer.setSize(innerWidth, innerHeight)
  }
  addEventListener('resize', boyutla)
  boyutla()

  // Meşale gücü kaydırmayla ayarlanır; titreme bunun üstüne eklenir
  let mesaleGucu = 0
  const mesaleKontrol = {
    get intensity() { return mesaleGucu },
    set intensity(v) { mesaleGucu = v },
  }

  function ciz(t) {
    toz.guncelle(t)
    mesale.intensity = mesaleGucu * (0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 29) * 0.07)
    composer.render()
  }

  return { renderer, sahne, kamera, anaIsik, mesale: mesaleKontrol, mesaleIsik: mesale, ciz }
}

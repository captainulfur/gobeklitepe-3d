import * as THREE from 'three'
import { gurultu, fbm } from './gurultu.js'
import { govdeKabartmasi, baslikKabartmasi } from './kabartmalar.js'
import { pbrSeti } from './varliklar.js'

// Taranmış gerçek kaya dokusu (Poly Haven, CC0)
const tasMalzeme = new THREE.MeshStandardMaterial({
  ...pbrSeti('rock_boulder_dry'),
  normalScale: new THREE.Vector2(1.4, 1.4),
  aoMapIntensity: 0.9,
  vertexColors: true,
})

// Kabartma tuvalini okuyucuya çevir: (u, v) noktasının yüksekliği 0–1
function yukseklikOkuyucu(tuval) {
  const { width: g, height: y } = tuval
  const veri = tuval.getContext('2d').getImageData(0, 0, g, y).data
  return (u, v) => {
    const px = Math.min(g - 1, Math.max(0, Math.round(u * (g - 1))))
    const py = Math.min(y - 1, Math.max(0, Math.round((1 - v) * (y - 1))))
    return veri[(py * g + px) * 4] / 255
  }
}
const govdeOkuyucu = yukseklikOkuyucu(govdeKabartmasi())
const baslikOkuyucu = yukseklikOkuyucu(baslikKabartmasi())

// Dokuyu taşa gerçek ölçüsünde sar (uzamasın). Orijinal UV kabartma için saklanır.
function kutuUV(geo, olcek, kayma) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv
  geo.setAttribute('uv1', uv.clone())
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i))
    const [a, b] = nx > 0.5 ? [p.getZ(i), p.getY(i)] : ny > 0.5 ? [p.getX(i), p.getZ(i)] : [p.getX(i), p.getY(i)]
    uv.setXY(i, a * olcek + kayma, b * olcek + kayma * 0.7)
  }
}

// Ön yüze kabartmayı oy: açık renkli çizimler taştan ~2,5 cm dışarı çıkar
function oy(geo, okuyucu, derinlik) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv1 = geo.attributes.uv1
  for (let i = 0; i < p.count; i++) {
    if (n.getZ(i) < 0.5) continue
    const h = okuyucu(uv1.getX(i), uv1.getY(i))
    p.setZ(i, p.getZ(i) + (h - 0.43) * derinlik)
  }
}

// Kenarları aşındır: aynı noktadaki köşeler aynı ofseti alır, dikiş açılmaz
function asindir(geo, guc, tohum) {
  const p = geo.attributes.position
  const f = 1.7
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    p.setXYZ(
      i,
      x + gurultu(x * f + tohum, y * f, z * f) * guc,
      y + gurultu(x * f, y * f + tohum, z * f) * guc * 0.5,
      z + gurultu(x * f, y * f, z * f + tohum) * guc,
    )
  }
}

// Doğal ton farkları ve dibe doğru toprak lekesi
function boya(geo, tohum) {
  const p = geo.attributes.position
  const renkler = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const ton = 0.88 + fbm(x * 0.7 + tohum, y * 0.7, z * 0.7, 3) * 0.22
    const toprak = Math.min(1, Math.max(0, y / 0.8))
    renkler.set([ton * (0.6 + 0.4 * toprak), ton * (0.52 + 0.48 * toprak), ton * (0.42 + 0.58 * toprak)], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(renkler, 3))
}

function parca(gen, yuk, der, seg, merkez, okuyucu, tohum) {
  const geo = new THREE.BoxGeometry(gen, yuk, der, ...seg)
  geo.translate(...merkez)
  kutuUV(geo, 1 / 1.6, tohum * 0.37)
  if (okuyucu) oy(geo, okuyucu, 0.055)
  asindir(geo, 0.03, tohum)
  geo.computeVertexNormals()
  boya(geo, tohum)
  const mesh = new THREE.Mesh(geo, tasMalzeme)
  mesh.castShadow = mesh.receiveShadow = true
  return mesh
}

// T biçimli dikilitaş. Kabartmalı olanlar yoğun ağ kullanır (oyma detayı için).
export function dikilitas({ tohum = 0, kabartmali = true } = {}) {
  const grup = new THREE.Group()
  const govdeSeg = kabartmali ? [150, 400, 6] : [14, 36, 4]
  const baslikSeg = kabartmali ? [260, 100, 6] : [24, 8, 4]
  grup.add(parca(1.3, 3.6, 0.42, govdeSeg, [0, 1.8, 0], kabartmali && govdeOkuyucu, tohum))
  grup.add(parca(2.2, 0.85, 0.52, baslikSeg, [0.3, 4.02, 0], kabartmali && baslikOkuyucu, tohum + 11))
  return grup
}

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'

// public/ klasörünün adresi (site alt klasörde yayınlansa da dosyalar bulunur)
export const kok = import.meta.env.BASE_URL

// Tüm dosyalar tek bir yöneticiden yüklenir: yükleme ekranı gerçek ilerlemeyi gösterir
export const yonetici = new THREE.LoadingManager()
export const ilerleme = { oran: 0 }
yonetici.onProgress = (_, yuklenen, toplam) => { ilerleme.oran = yuklenen / toplam }
const dokuYukleyici = new THREE.TextureLoader(yonetici)

export function doku(yol, { renk = false, tekrar = 1 } = {}) {
  const t = dokuYukleyici.load(yol)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(tekrar, tekrar)
  t.anisotropy = 8
  if (renk) t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Poly Haven'dan bir PBR doku seti: renk, yüzey, pürüzlülük, gölge
export function pbrSeti(ad, tekrar = 1) {
  const yol = `${kok}dokular/${ad}`
  return {
    map: doku(`${yol}/renk.jpg`, { renk: true, tekrar }),
    normalMap: doku(`${yol}/normal.jpg`, { tekrar }),
    roughnessMap: doku(`${yol}/puruz.jpg`, { tekrar }),
    aoMap: doku(`${yol}/ao.jpg`, { tekrar }),
  }
}

export const modelYukle = (yol) => new GLTFLoader(yonetici).loadAsync(yol)
export const hdrYukle = (yol) => new HDRLoader(yonetici).loadAsync(yol)

// Her şey yüklenince çözülür
export const hepsiYuklendi = new Promise((tamam) => {
  yonetici.onLoad = tamam
})

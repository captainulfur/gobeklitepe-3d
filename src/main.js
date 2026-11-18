import 'lenis/dist/lenis.css'
import './style.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { sahneKur } from './sahne.js'
import { ilerleme, hepsiYuklendi } from './varliklar.js'

gsap.registerPlugin(ScrollTrigger)

// --- Yükleme ekranı: dosyalar gerçekten yüklendikçe ilerler ---
const mesajlar = ['Taşlar diziliyor', 'Toz kalkıyor', 'Meşaleler yakılıyor', 'Halka tamamlanıyor']
const gosterilen = { v: 0 }
const yuklemeGoster = () => {
  gosterilen.v += (ilerleme.oran * 100 - gosterilen.v) * 0.08
  const v = Math.round(gosterilen.v)
  document.getElementById('yuklemeSayi').textContent = v
  document.getElementById('yuklemeCizgi').style.width = v + '%'
  document.getElementById('yuklemeMesaj').textContent = mesajlar[Math.min(3, Math.floor(v / 26))]
}
gsap.ticker.add(yuklemeGoster)

const s = await sahneKur(document.getElementById('sahne'))
await hepsiYuklendi

// --- Yumuşak kaydırma ---
const lenis = new Lenis({ lerp: 0.08 })
lenis.stop()
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)

// --- Kamera durakları: her bölüm için konum (k) ve bakılan nokta (b) ---
const duraklar = [
  { k: [0, 2.5, 8.2], b: [0, 2.45, 0] },    // giriş: taşın tamamı
  { k: [-4.8, 2.1, 5.2], b: [0, 2.2, 0] },  // 12.000 yıl
  { k: [0.9, 2.6, 3.0], b: [0.1, 2.4, 0] }, // kabartmalar: yakın plan
  { k: [-4.4, 3.9, 5.0], b: [0.4, 2.0, 0] },// zaman çizelgesi
  { k: [0.1, 17, 9], b: [0, 0, 0] },        // halka: tepeden
  { k: [0.6, 9, 7.4], b: [0, 1.0, 0] },     // son: yukarıdan, taşlar kadrajın altında
]
const kam = {
  kx: duraklar[0].k[0], ky: duraklar[0].k[1], kz: duraklar[0].k[2],
  bx: duraklar[0].b[0], by: duraklar[0].b[1], bz: duraklar[0].b[2],
}

const tl = gsap.timeline({
  scrollTrigger: { trigger: '#hikaye', start: 'top top', end: 'bottom bottom', scrub: 1.5 },
})
duraklar.slice(1).forEach((d, i) => {
  tl.to(kam, {
    kx: d.k[0], ky: d.k[1], kz: d.k[2], bx: d.b[0], by: d.b[1], bz: d.b[2],
    duration: 1, ease: 'power2.inOut',
  }, i)
})
// Kabartmalar bölümünde ana ışık kısılır, meşale taşın önünden geçer
tl.to(s.anaIsik, { intensity: 0.9, duration: 0.5 }, 1.2)
  .to(s.mesale, { intensity: 9, duration: 0.5 }, 1.2)
  .to(s.mesaleIsik.position, { x: 1.6, y: 2.9, duration: 1.1, ease: 'none' }, 1.3)
  .to(s.mesale, { intensity: 0, duration: 0.4 }, 2.4)
  .to(s.anaIsik, { intensity: 2.6, duration: 0.4 }, 2.4)

// Dev başlık giriş bölümünden çıkarken yukarı kayıp kaybolur
gsap.to('#devBaslik', {
  yPercent: -60, opacity: 0, ease: 'none',
  scrollTrigger: { trigger: '.bolum-giris', start: 'top top', end: 'bottom top', scrub: true },
})

// Son bölümde yazının arkası kararır
gsap.to('#karartma', {
  opacity: 1, ease: 'none',
  scrollTrigger: { trigger: '.bolum-son', start: 'top 80%', end: 'top 20%', scrub: true },
})

// --- Metinler: bölüme girince aşağıdan süzülür ---
document.querySelectorAll('.bolum:not(.bolum-giris)').forEach((bolum) => {
  gsap.from(bolum.children, {
    y: 50, opacity: 0, duration: 1, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: bolum, start: 'top 65%', toggleActions: 'play none none reverse' },
  })
})

// 12.000 sayacı
const sayac = document.querySelector('.sayac')
ScrollTrigger.create({
  trigger: sayac, start: 'top 75%', once: true,
  onEnter: () => {
    const hedef = { v: 0 }
    gsap.to(hedef, {
      v: +sayac.dataset.hedef, duration: 2.2, ease: 'power2.out',
      onUpdate: () => (sayac.textContent = Math.round(hedef.v).toLocaleString('tr-TR')),
    })
  },
})

// Zaman çizelgesi çubukları
gsap.from('.cizelge-satir i', {
  scaleX: 0, transformOrigin: 'left center', duration: 1.4, stagger: 0.15, ease: 'expo.out',
  scrollTrigger: { trigger: '.zaman-cizelgesi', start: 'top 75%', toggleActions: 'play none none reverse' },
})

// --- Fare: hafif kamera kayması + özel imleç ---
const fare = { x: 0, y: 0, yx: 0, yy: 0 }
const imlec = document.getElementById('imlec')
addEventListener('pointermove', (e) => {
  fare.x = e.clientX / innerWidth - 0.5
  fare.y = e.clientY / innerHeight - 0.5
  imlec.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
})

// --- Her kare ---
gsap.ticker.add((t) => {
  fare.yx += (fare.x - fare.yx) * 0.05
  fare.yy += (fare.y - fare.yy) * 0.05
  s.kamera.position.set(kam.kx + fare.yx * 0.6, kam.ky - fare.yy * 0.3, kam.kz)
  s.kamera.lookAt(kam.bx, kam.by, kam.bz)
  s.ciz(t)
})

// --- Yükleme bitti: sayaç 100'e tamamlanır, perde kalkar ---
ilerleme.oran = 1
gsap.to(gosterilen, {
  v: 100, duration: 0.6, ease: 'power2.out',
  onComplete: () => {
    gsap.ticker.remove(yuklemeGoster)
    document.getElementById('yuklemeSayi').textContent = 100
    document.getElementById('yuklemeCizgi').style.width = '100%'
    gsap.timeline({ delay: 0.3 })
      .to('#yukleme', { yPercent: -100, duration: 1.2, ease: 'expo.inOut' })
      .from('#devBaslik span', { yPercent: 110, opacity: 0, duration: 1.4, stagger: 0.05, ease: 'expo.out' }, '-=0.5')
      .from('.bolum-giris > *, .ust', { opacity: 0, y: 20, duration: 1, stagger: 0.1 }, '-=1')
      .add(() => lenis.start())
  },
})

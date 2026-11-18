// Kabartma haritası: açık renk yükselir, koyu renk çöker
function tuval(gen, yuk) {
  const c = document.createElement('canvas')
  c.width = gen
  c.height = yuk
  const g = c.getContext('2d')
  // Zemin: düz orta gri (0.43). Açık renkli şekiller taştan dışarı kabarır.
  g.fillStyle = '#6e6e6e'
  g.fillRect(0, 0, gen, yuk)
  g.fillStyle = g.strokeStyle = '#e8e8e8'
  g.lineCap = g.lineJoin = 'round'
  g.shadowColor = '#e8e8e8'
  g.shadowBlur = 10
  return { c, g }
}

// Gövdenin ön yüzü: kol, el, kemer, tilki ve yılanlar
export function govdeKabartmasi() {
  const { c, g } = tuval(512, 1400)

  // Sol kol: omuzdan aşağı iner, alt kısımda öne kıvrılır
  g.lineWidth = 46
  g.beginPath()
  g.moveTo(70, 120)
  g.bezierCurveTo(60, 500, 70, 820, 150, 960)
  g.lineTo(330, 985)
  g.stroke()
  // Parmaklar
  g.lineWidth = 12
  for (let i = 0; i < 5; i++) {
    g.beginPath()
    g.moveTo(330 + i * 4, 965 + i * 10)
    g.lineTo(430, 962 + i * 10)
    g.stroke()
  }

  // Kemer
  g.fillRect(20, 1050, 472, 42)
  g.lineWidth = 6
  for (let x = 40; x < 480; x += 36) {
    g.beginPath()
    g.arc(x, 1071, 9, 0, Math.PI * 2)
    g.stroke()
  }

  // Sıçrayan tilki
  g.save()
  g.translate(300, 300)
  g.rotate(-0.25)
  g.beginPath()
  g.ellipse(0, 0, 105, 34, 0, 0, Math.PI * 2) // gövde
  g.fill()
  g.beginPath() // kafa
  g.moveTo(90, -20)
  g.lineTo(175, -40)
  g.lineTo(110, 22)
  g.fill()
  g.beginPath() // kulaklar
  g.moveTo(112, -26)
  g.lineTo(125, -82)
  g.lineTo(142, -32)
  g.fill()
  g.lineWidth = 18 // bacaklar
  ;[[-60, 20, -110, 95], [-30, 25, -40, 110], [50, 25, 95, 105], [75, 20, 140, 80]].forEach(([a, b, x, y]) => {
    g.beginPath(); g.moveTo(a, b); g.lineTo(x, y); g.stroke()
  })
  g.lineWidth = 30 // kuyruk
  g.beginPath()
  g.moveTo(-95, -5)
  g.quadraticCurveTo(-190, -70, -230, 10)
  g.stroke()
  g.restore()

  // Yılanlar: yukarıdan aşağı süzülen üç dalgalı çizgi
  g.lineWidth = 16
  ;[210, 290, 370].forEach((x0, k) => {
    g.beginPath()
    for (let y = 520; y < 880; y += 6) {
      const x = x0 + Math.sin(y / 32 + k) * 22
      y === 520 ? g.moveTo(x, y) : g.lineTo(x, y)
    }
    g.stroke()
    g.beginPath()
    g.ellipse(x0 + Math.sin(880 / 32 + k) * 22, 892, 16, 22, 0, 0, Math.PI * 2)
    g.fill()
  })

  return haritaya(c)
}

// Başlık taşının ön yüzü: kanatlarını açmış akbaba ve bir daire
export function baslikKabartmasi() {
  const { c, g } = tuval(1024, 380)
  g.save()
  g.translate(512, 190)
  g.beginPath() // gövde
  g.ellipse(0, 20, 34, 70, 0, 0, Math.PI * 2)
  g.fill()
  g.beginPath() // baş
  g.arc(0, -62, 26, 0, Math.PI * 2)
  g.fill()
  g.beginPath() // gaga
  g.moveTo(18, -66)
  g.lineTo(52, -50)
  g.lineTo(16, -46)
  g.fill()
  // Kanatlar: kademeli tüyler
  ;[-1, 1].forEach((yon) => {
    for (let i = 0; i < 6; i++) {
      g.beginPath()
      g.moveTo(yon * 30, -10 + i * 6)
      g.lineTo(yon * (120 + i * 38), -70 + i * 22)
      g.lineTo(yon * (110 + i * 36), -40 + i * 24)
      g.closePath()
      g.fill()
    }
  })
  g.restore()
  // Akbabanın kanadı üstündeki daire
  g.lineWidth = 14
  g.beginPath()
  g.arc(830, 130, 44, 0, Math.PI * 2)
  g.stroke()
  return haritaya(c)
}

// Kabartma tuvali doğrudan döner; dikilitaş bu tuvaldeki yükseklikleri taşa oyar
function haritaya(c) {
  return c
}

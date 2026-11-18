// Küçük, tohumlu 3D gürültü: taş yüzeyi, zemin ve dokular için

function karistir(x, y, z) {
  let h = x * 374761393 + y * 668265263 + z * 2147483647
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

const yumusat = (t) => t * t * (3 - 2 * t)
const ara = (a, b, t) => a + (b - a) * t

// Değer gürültüsü: -1 ile 1 arası
export function gurultu(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = yumusat(x - xi), yf = yumusat(y - yi), zf = yumusat(z - zi)
  const k = (dx, dy, dz) => karistir(xi + dx, yi + dy, zi + dz)
  const x1 = ara(ara(k(0, 0, 0), k(1, 0, 0), xf), ara(k(0, 1, 0), k(1, 1, 0), xf), yf)
  const x2 = ara(ara(k(0, 0, 1), k(1, 0, 1), xf), ara(k(0, 1, 1), k(1, 1, 1), xf), yf)
  return ara(x1, x2, zf) * 2 - 1
}

// Katmanlı gürültü: büyük dalgalar + ince pürüzler
export function fbm(x, y, z, kat = 4) {
  let toplam = 0, genlik = 0.5, frekans = 1
  for (let i = 0; i < kat; i++) {
    toplam += gurultu(x * frekans, y * frekans, z * frekans) * genlik
    frekans *= 2.1
    genlik *= 0.5
  }
  return toplam
}

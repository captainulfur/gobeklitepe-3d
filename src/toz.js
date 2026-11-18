import * as THREE from 'three'

// Yuvarlak, yumuşak kenarlı, yavaşça parlayıp sönen toz zerreleri
export function tozOlustur(pikselOrani) {
  const adet = 1400
  const konum = new Float32Array(adet * 3)
  const boyut = new Float32Array(adet)
  const faz = new Float32Array(adet)
  for (let i = 0; i < adet; i++) {
    konum[i * 3] = (Math.random() - 0.5) * 20
    konum[i * 3 + 1] = Math.random() * 6.5
    konum[i * 3 + 2] = (Math.random() - 0.5) * 20
    boyut[i] = 0.5 + Math.pow(Math.random(), 3) * 1.6 // çoğu küçük, birkaçı iri
    faz[i] = Math.random() * Math.PI * 2
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(konum, 3))
  geo.setAttribute('boyut', new THREE.BufferAttribute(boyut, 1))
  geo.setAttribute('faz', new THREE.BufferAttribute(faz, 1))

  const malzeme = new THREE.ShaderMaterial({
    uniforms: {
      zaman: { value: 0 },
      piksel: { value: pikselOrani },
      renk: { value: new THREE.Color(0xffd6a0) },
    },
    vertexShader: /* glsl */ `
      attribute float boyut;
      attribute float faz;
      uniform float zaman;
      uniform float piksel;
      varying float parlaklik;
      void main() {
        vec3 p = position;
        // Havada yavaşça süzülme
        p.x += sin(zaman * 0.15 + faz) * 0.35;
        p.y += sin(zaman * 0.22 + faz * 1.7) * 0.25;
        p.z += cos(zaman * 0.12 + faz) * 0.35;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(boyut * piksel * (42.0 / -mv.z), 14.0 * piksel);
        // Işığı yakalayıp bırakır gibi parıldama
        parlaklik = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(zaman * 1.3 + faz * 3.0), 3.0);
        // Uzaktakiler sise karışır
        parlaklik *= smoothstep(30.0, 6.0, -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 renk;
      varying float parlaklik;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float yumusak = pow(1.0 - d, 2.2);      // yuvarlak, yumuşak hale
        float cekirdek = pow(1.0 - d, 8.0) * 1.6; // parlak merkez
        gl_FragColor = vec4(renk * (yumusak + cekirdek), (yumusak + cekirdek) * parlaklik);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  const nokta = new THREE.Points(geo, malzeme)
  return {
    nokta,
    guncelle(t) { malzeme.uniforms.zaman.value = t },
  }
}

// Diseño exterior adaptado de Sebasgvr/BlueHaven backend 83b55f5.
function crearAleatorioConSemilla(semilla) {
  let estado = semilla >>> 0;
  return function () {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function crearEntornoExterior() {
  if (!escena3D) return;

  const anchoMapa = MAPA_ANCHO * TAMAÑO_CELDA;
  const altoMapa = MAPA_ALTO * TAMAÑO_CELDA;

  // Piso grande debajo y alrededor del mapa. Queda apenas por debajo del piso
  // jugable para no pelear con las baldosas.
  const texturaSueloExterior = crearTexturaSueloExterior();
  texturaSueloExterior.repeat.set(78, 78);
  const materialSueloExterior = new THREE.MeshLambertMaterial({
    map: texturaSueloExterior,
    color: 0xffffff,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const pisoExterior = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    materialSueloExterior,
  );
  pisoExterior.rotation.x = -Math.PI / 2;
  pisoExterior.position.set(anchoMapa / 2, -2.0, altoMapa / 2);
  escena3D.add(pisoExterior);

  // Muro de bosque de fondo, detrás de la segunda fila de árboles.
  const margen = TAMAÑO_CELDA * 4;
  const alturaMuro = TAMAÑO_CELDA * 12;
  const anchoNorteSur = anchoMapa + margen * 2;
  const anchoEsteOeste = altoMapa + margen * 2;

  const texturaNS = crearTexturaMuroBosque();
  texturaNS.repeat.set(anchoNorteSur / (TAMAÑO_CELDA * 4), 1);
  const texturaEO = texturaNS.clone();
  texturaEO.needsUpdate = true;
  texturaEO.repeat.set(anchoEsteOeste / (TAMAÑO_CELDA * 4), 1);

  const materialNS = new THREE.MeshBasicMaterial({
    map: texturaNS,
    fog: true, transparent:true, depthWrite:false,
  });
  const materialEO = new THREE.MeshBasicMaterial({
    map: texturaEO,
    fog: true, transparent:true, depthWrite:false,
  });

  const muroNorte = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoNorteSur, alturaMuro),
    materialNS,
  );
  muroNorte.position.set(
    anchoMapa / 2,
    alturaMuro / 2 - 2.0,
    -margen,
  );
  escena3D.add(muroNorte);

  const muroSur = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoNorteSur, alturaMuro),
    materialNS,
  );
  muroSur.position.set(
    anchoMapa / 2,
    alturaMuro / 2 - 2.0,
    altoMapa + margen,
  );
  muroSur.rotation.y = Math.PI;
  escena3D.add(muroSur);

  const muroOeste = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoEsteOeste, alturaMuro),
    materialEO,
  );
  muroOeste.position.set(
    -margen,
    alturaMuro / 2 - 2.0,
    altoMapa / 2,
  );
  muroOeste.rotation.y = Math.PI / 2;
  escena3D.add(muroOeste);

  const muroEste = new THREE.Mesh(
    new THREE.PlaneGeometry(anchoEsteOeste, alturaMuro),
    materialEO,
  );
  muroEste.position.set(
    anchoMapa + margen,
    alturaMuro / 2 - 2.0,
    altoMapa / 2,
  );
  muroEste.rotation.y = -Math.PI / 2;
  escena3D.add(muroEste);
}

function crearTexturaSueloExterior() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2f4a2a";
  ctx.fillRect(0, 0, 64, 64);

  const azar = crearAleatorioConSemilla(20261115);
  for (let i = 0; i < 140; i++) {
    const x = azar() * 64;
    const y = azar() * 64;
    const radio = 1 + azar() * 3;
    ctx.fillStyle = azar() < 0.5 ? "#263f22" : "#3a5a32";
    ctx.beginPath();
    ctx.arc(x, y, radio, 0, Math.PI * 2);
    ctx.fill();
  }

  const textura = new THREE.CanvasTexture(canvas);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.RepeatWrapping;
  textura.magFilter = THREE.NearestFilter;
  textura.minFilter = THREE.NearestFilter;
  return textura;
}

function crearTexturaMuroBosque() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  // Arriba se funde con el color de la niebla/cielo; abajo es bosque oscuro.
  const gradiente = ctx.createLinearGradient(0, 0, 0, 256);
  gradiente.addColorStop(0, "rgba(200,232,248,0)");
  gradiente.addColorStop(0.28, "rgba(143,184,176,.45)");
  gradiente.addColorStop(0.58, "#4f7a55");
  gradiente.addColorStop(1, "#1f3a28");
  ctx.fillStyle = gradiente;
  ctx.fillRect(0, 0, 512, 256);

  const azar = crearAleatorioConSemilla(20261114);
  for (let i = 0; i < 100; i++) {
    const x = azar() * 512;
    const alto = 90 + azar() * 110;
    const ancho = 12 + azar() * 28;
    const base = 256;

    ctx.fillStyle = "rgba(18, 34, 22, 0.85)";
    ctx.fillRect(
      x - ancho * 0.14,
      base - alto * 0.55,
      ancho * 0.28,
      alto * 0.55,
    );

    for (let j = 0; j < 5; j++) {
      const cx = x + (azar() - 0.5) * ancho;
      const cy = base - alto * 0.55 - azar() * alto * 0.32;
      const radio = ancho * (0.45 + azar() * 0.65);
      ctx.fillStyle =
        azar() < 0.5 ? "rgba(35, 72, 44, 0.9)" : "rgba(27, 56, 35, 0.9)";
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        radio,
        radio * (0.7 + azar() * 0.4),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }

  const textura = new THREE.CanvasTexture(canvas);
  textura.wrapS = THREE.RepeatWrapping;
  textura.wrapT = THREE.ClampToEdgeWrapping;
  textura.magFilter = THREE.NearestFilter;
  textura.minFilter = THREE.NearestFilter;
  return textura;
}

// Misma composición del bosque original, con instancias para las tres capas.
const BOSQUE={grupos:[],troncos:new Map(),listo:false,interiores:[]};
const CELDA_BOSQUE=TAMAÑO_CELDA*2;
function claveBosque(x,z){return Math.floor(x/CELDA_BOSQUE)+','+Math.floor(z/CELDA_BOSQUE);}
function registrarTronco(x,z,radio){const clave=claveBosque(x,z);if(!BOSQUE.troncos.has(clave))BOSQUE.troncos.set(clave,[]);BOSQUE.troncos.get(clave).push({x,z,radio});}
function bosqueColisiona(pos,radio=10){
  const cx=Math.floor(pos.x/CELDA_BOSQUE),cz=Math.floor(pos.y/CELDA_BOSQUE);
  for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)for(const t of BOSQUE.troncos.get((cx+dx)+','+(cz+dz))||[]){if(Math.hypot(pos.x-t.x,pos.y-t.z)<radio+t.radio)return true;}
  return false;
}
function sitioLibreBosque(x,z,posiciones){
  const c=Math.floor(x/TAMAÑO_CELDA),f=Math.floor(z/TAMAÑO_CELDA);
  if(MAPA[f]?.[c]!==0||obtenerSuelo(f,c)===5)return false;
  // La orilla, la aparición y el acceso a la tienda quedan despejados.
  for(let df=-1;df<=1;df++)for(let dc=-1;dc<=1;dc++)if(esAgua(c+dc,f+df))return false;
  if(Math.hypot(x-TIENDA.posicion.x,z-TIENDA.posicion.y)<TAMAÑO_CELDA*5)return false;
  if(Math.hypot(x-TAMAÑO_CELDA*18.5,z-TAMAÑO_CELDA*27.5)<TAMAÑO_CELDA*3)return false;
  return posiciones.every(p=>Math.hypot(x-p.x,z-p.z)>TAMAÑO_CELDA*1.15);
}
function cargarArboles(){
  new THREE.OBJLoader().load('models/3D/Modelo_arbol.obj',modelo=>{
    modelo.updateMatrixWorld(true);
    const caja=new THREE.Box3().setFromObject(modelo),centro=caja.getCenter(new THREE.Vector3()),tam=caja.getSize(new THREE.Vector3());
    const piezas=[];let radioTronco=0;
    modelo.traverse(m=>{if(!m.isMesh)return;const b=new THREE.Box3().setFromObject(m),tronco=b.max.y<4.6;
      if(tronco)radioTronco=Math.max(radioTronco,(b.max.x-b.min.x)/2,(b.max.z-b.min.z)/2);
      piezas.push({geometria:m.geometry,matriz:m.matrixWorld.clone(),tronco});
    });
    const azar=crearAleatorioConSemilla(20261112),interiores=[];
    for(let i=0;i<8000&&interiores.length<90;i++){
      const x=(1.5+Math.floor(azar()*(MAPA_ANCHO-2))+(azar()-.5)*.5)*TAMAÑO_CELDA;
      const z=(1.5+Math.floor(azar()*(MAPA_ALTO-2))+(azar()-.5)*.5)*TAMAÑO_CELDA;
      if(sitioLibreBosque(x,z,interiores))interiores.push({x,z,alto:TAMAÑO_CELDA*5*(.92+azar()*.24),rotacion:azar()*Math.PI*2});
    }
    BOSQUE.interiores=interiores;
    const borde=[],exterior=[];
    for(let f=0;f<MAPA_ALTO;f++)for(let c=0;c<MAPA_ANCHO;c++)if(MAPA[f][c]===4)borde.push({x:(c+.5)*TAMAÑO_CELDA,z:(f+.5)*TAMAÑO_CELDA,alto:TAMAÑO_CELDA*5.5*(.95+azar()*.1),rotacion:azar()*Math.PI*2});
    const agregarExterior=(x,z)=>exterior.push({x,z,alto:TAMAÑO_CELDA*6.5*(.95+azar()*.15),rotacion:azar()*Math.PI*2});
    for(let c=0;c<=MAPA_ANCHO;c+=2){agregarExterior(c*TAMAÑO_CELDA,-2*TAMAÑO_CELDA);agregarExterior(c*TAMAÑO_CELDA,(MAPA_ALTO+2)*TAMAÑO_CELDA);}
    for(let f=1;f<MAPA_ALTO;f+=2){agregarExterior(-2*TAMAÑO_CELDA,f*TAMAÑO_CELDA);agregarExterior((MAPA_ANCHO+2)*TAMAÑO_CELDA,f*TAMAÑO_CELDA);}
    const corregir=new THREE.Matrix4().makeTranslation(-centro.x,-caja.min.y,-centro.z),temporal=new THREE.Object3D();
    for(const [capa,instancias] of [['interior',interiores],['borde',borde],['exterior',exterior]]){
      const corteza=new THREE.MeshLambertMaterial({color:0x8a6a4a}),hojas=new THREE.MeshLambertMaterial({color:0x75a84f,side:THREE.DoubleSide});
      if(capa==='exterior'){corteza.color.multiplyScalar(.72);hojas.color.multiplyScalar(.72);}
      for(const [indice,pieza] of piezas.entries()){
        const material=(pieza.tronco?corteza:hojas).clone();
        material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1-indice;
        const m=new THREE.InstancedMesh(pieza.geometria,material,instancias.length);m.name='bosque-'+capa;m.userData={capa,total:instancias.length};m.frustumCulled=false;
        instancias.forEach((p,i)=>{temporal.position.set(p.x,capa==='exterior'?-1.98:.02,p.z);temporal.rotation.set(0,p.rotacion,0);temporal.scale.setScalar(p.alto/tam.y);temporal.updateMatrix();const matriz=temporal.matrix.clone().multiply(corregir).multiply(pieza.matriz);m.setMatrixAt(i,matriz);});
        m.instanceMatrix.needsUpdate=true;escena3D.add(m);BOSQUE.grupos.push(m);
      }
      if(capa==='interior')instancias.forEach(p=>registrarTronco(p.x,p.z,Math.max(5,radioTronco*p.alto/tam.y)));
    }
    BOSQUE.listo=true;
  },undefined,e=>console.warn('No se pudo cargar el bosque',e));
}

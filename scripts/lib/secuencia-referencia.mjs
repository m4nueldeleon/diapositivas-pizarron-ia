// Referencias externas a 8 cps. Solo nombres e instantes; jamás cuadros del video.
import fs from 'node:fs';
import path from 'node:path';
export const RAFAGAS = [
  {nombre:'a_doctor',id:'r10',corte:4,fin:24,aparicion:true,
    regiones:{emoji:[.40,.16,.20,.30],texto:[.17,.51,.66,.22],trazo:[.26,.63,.50,.09]}},
  {nombre:'b_lista',id:'r95',corte:1,fin:24,aparicion:false,
    regiones:{texto:[.17,.12,.66,.28]}},
  {nombre:'d_123',id:'r115',corte:8,fin:24,aparicion:true,
    // Termina antes de la segunda tecla: su numeral y relieve no son cursor.
    regiones:{teclas:[.20,.25,.60,.20],texto:[.06,.66,.88,.10],nota:[.16,.78,.68,.08],movimiento:[.26,.35,.16,.20]}},
  // R17: el sello entra completo en el corte (6:44.9) y no se mueve; se mide en su paso (el último de la lámina).
  {nombre:'e_sello',id:'r403',paso:-1,corte:16,fin:24,aparicion:true,
    regiones:{sello:[.06,.28,.76,.52]}},
  // R19: el arco tachado y la tragamonedas entran juntos en el corte (1:44.5) y quedan quietos. La franja del arco evita
  // la alcancía rosa, que el detector de rojo confundiría con tinta.
  {nombre:'c_alcancia',id:'r103',paso:-1,corte:13,fin:24,aparicion:true,
    regiones:{trazo:[.30,.06,.45,.16],maquina:[.55,.2,.4,.55]}},
  // R19: el resaltado se sostiene 2.7 s sin moverse (0:38.5-0:41.1) hasta el corte seco a la lámina siguiente.
  {nombre:'k_underline',id:'r38',paso:-1,corte:1,fin:22,aparicion:true,
    regiones:{texto:[.1,.42,.8,.16]}},
  // R19: los cuadrantes quedan inmóviles 1.8 s (10:28.0-10:29.8) hasta el corte a «1 Partnership».
  {nombre:'g_partner',id:'r628',paso:-1,corte:1,fin:15,aparicion:true,
    regiones:{texto:[0,.22,1,.12],texto2:[0,.74,1,.12]}},
  // R19: la tabla-marcador vacía se sostiene 2.9 s sin moverse [5:28.0-5:30.9]
  {nombre:'j_table',id:'r328',paso:-1,corte:1,fin:24,aparicion:true,
    regiones:{texto:[0,0,.3,.95]}},
  // R19: la gráfica se sostiene quieta hasta el corte a la tabla con flechas que convergen [7:28.0-7:30.0]
  {nombre:'f_flechas',id:'r448',paso:-1,corte:1,fin:15,aparicion:true,
    regiones:{titulo:[.3,0,.4,.15],trazo:[.1,.25,.75,.65]}},
  // R19: la nota gris entra COMPLETA en el corte [11:08.2 → 11:08.4], bajo el mapa con manos que ya estaba
  {nombre:'l_stack',id:'r668',paso:-1,corte:4,fin:24,aparicion:true,
    regiones:{gris:[.1,.79,.8,.1]}},
  // R19: la pastilla del reparto entra sola en el corte [15:23.9] y queda quieta; las partes llegan después
  {nombre:'h_pill',id:'r922',paso:0,corte:16,fin:24,aparicion:true,
    regiones:{pastilla:[.2,.1,.6,.5]}},
  // R19: la segunda nota del calendario entra completa en el corte [29:00.5 → 29:00.6], abajo a la derecha
  {nombre:'i_calendario',id:'r1738',paso:-1,corte:21,fin:24,aparicion:true,
    regiones:{nota:[.72,.7,.28,.2]}},
];

// Caja de tinta por región; la tinta roja se aísla para comprobar su corte.
export function medirRegion(rgba,w,h,roi,rojo=false) {
  const [rx,ry,rw,rh]=roi;let n=0,x0=w,y0=h,x1=-1,y1=-1;
  for(let y=Math.floor(ry*h);y<Math.min(h,Math.ceil((ry+rh)*h));y++)for(let x=Math.floor(rx*w);x<Math.min(w,Math.ceil((rx+rw)*w));x++){
    const i=(y*w+x)*4,r=rgba[i],g=rgba[i+1],b=rgba[i+2];
    const tinta=rojo==='neutro' ? Math.max(r,g,b)-Math.min(r,g,b)<20&&Math.max(r,g,b)<210
      : rojo===true ? r>150&&g<110&&b<110 : .299*r+.587*g+.114*b<150;
    if(!tinta)continue;n++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
  }
  return {pixeles:n,caja:n?{x:x0/w,y:y0/h,w:(x1-x0+1)/w,h:(y1-y0+1)/h}:null};
}
export function estabilidad(muestras,region) {
  const cajas=muestras.map(m=>m.regiones[region]?.caja).filter(Boolean);
  if(cajas.length<2)return {estado:'sin-medidas',desplazamiento_pct:null};
  if(cajas.length!==muestras.length)return {estado:'revisar',desplazamiento_pct:null,motivo:'La región desaparece en una o más muestras.'};
  const a=cajas[0],delta=Math.max(...cajas.flatMap(b=>['x','y','w','h'].map(k=>Math.abs(a[k]-b[k]))))*100;
  return {estado:delta<=1?'estable':'revisar',desplazamiento_pct:+delta.toFixed(3)};
}
export function compararCronologia(referencia,replica,tolerancia=125) {
  if(!Number.isFinite(referencia)||!Number.isFinite(replica))return {estado:'sin-cobertura',referencia_ms:referencia??null,replica_ms:replica??null};
  const delta=replica-referencia;
  return {estado:Math.abs(delta)<=tolerancia?'coincide':'revisar',referencia_ms:referencia,replica_ms:replica,delta_ms:delta,tolerancia_ms:tolerancia};
}

// Tras asentarse el clic, observa el desplazamiento de tinta neutra de mano
// y ruta; no acredita una animación leyendo su data-retraso.
export function inicioMovimiento(muestras,lado) {
  const caja=m=>m[lado]?.regiones.movimiento?.caja;
  const base=muestras.find(m=>m.ms>=375&&caja(m));
  if(!base)return null;
  const b=caja(base);
  return muestras.find(m=>m.ms>base.ms && caja(m) && Math.abs(caja(m).x+caja(m).w-b.x-b.w)>.012)?.ms ?? null;
}

export async function compararSecuencia({dir,page,medir,ids,salida}) {
  if(!dir)return {estado:'sin-referencia-temporal',fps:8,casos:[]};
  await medir.addScriptTag({content:`window.medirRegion=${medirRegion.toString()}`});
  const casos=[];
  for(const cfg of RAFAGAS){
    const i=ids.indexOf(cfg.id),carpeta=path.join(dir,cfg.nombre);
    if(i<0||!fs.existsSync(carpeta)){casos.push({nombre:cfg.nombre,estado:'sin-referencia'});continue;}
    const muestras=[];
    for(let f=cfg.corte;f<=cfg.fin;f++){
      const archivo=path.join(carpeta,`r_${String(f).padStart(2,'0')}.jpg`);
      if(!fs.existsSync(archivo))break;
      const ms=(f-cfg.corte)*125;
      const dom=await page.evaluate(([i,ms,paso])=>{
        const l=window.PZ.lams[i];window.PZ.mostrar(l,paso<0?window.PZ.pasos(l)+paso:paso,ms);
        const cursor=l.querySelector('.cursor'),r=cursor?.getBoundingClientRect(),b=l.getBoundingClientRect();
        const rutas=[...l.querySelectorAll('[data-arrastre]')].map(p=>({retraso:+p.dataset.retraso||0,dash:getComputedStyle(p).strokeDashoffset}));
        return {cursor:r?{x:(r.x-b.x)/b.width,y:(r.y-b.y)/b.height,visible:getComputedStyle(cursor).visibility!=='hidden'&&+getComputedStyle(cursor).opacity>0}:null,rutas};
      },[i,ms,cfg.paso||0]);
      const png=await page.locator('section.lamina').nth(i).screenshot({type:'png'});
      const urls=['data:image/jpeg;base64,'+fs.readFileSync(archivo).toString('base64'),'data:image/png;base64,'+png.toString('base64')];
      const lados=await medir.evaluate(async ({urls,regiones})=>Promise.all(urls.map(async u=>{
        const im=new Image();im.src=u;await im.decode();const c=new OffscreenCanvas(480,270),g=c.getContext('2d');g.drawImage(im,0,0,480,270);
        const d=g.getImageData(0,0,480,270).data;
        return Object.fromEntries(Object.entries(regiones).map(([k,r])=>[k,window.medirRegion(d,480,270,r,k==='movimiento'||k.startsWith('gris')?'neutro':k==='trazo'||k==='sello')]));
      })),{urls,regiones:cfg.regiones});
      muestras.push({frame:f,ms,referencia:{regiones:lados[0]},replica:{regiones:lados[1]},dom});
      if([cfg.corte,cfg.corte+1,cfg.fin].includes(f)){
        fs.writeFileSync(path.join(salida,`secuencia-${cfg.nombre}-${f}-replica.png`),png);
      }
    }
    const fijo=Object.keys(cfg.regiones).filter(k=>k!=='movimiento'&&k!=='teclas');
    const estabilidadRegiones=Object.fromEntries(fijo.map(k=>[k,{referencia:estabilidad(muestras.map(m=>m.referencia),k),replica:estabilidad(muestras.map(m=>m.replica),k)}]));
    const arrastre=cfg.id==='r115'?{...compararCronologia(inicioMovimiento(muestras,'referencia'),inicioMovimiento(muestras,'replica')),
      metodo:'desplazamiento de tinta neutra de cursor y ruta; revisar trayectoria visual',configurado_ms:muestras.flatMap(m=>m.dom.rutas).find(r=>r.retraso>0)?.retraso??null}:null;
    const aparicion=cfg.aparicion?Object.fromEntries(fijo.map(k=>[k,{referencia:muestras[0]?.referencia.regiones[k]?.pixeles>0,replica:muestras[0]?.replica.regiones[k]?.pixeles>0}])):null;
    casos.push({nombre:cfg.nombre,id:cfg.id,corte_frame:cfg.corte,fps:8,aparicion,estabilidad:estabilidadRegiones,
      cursor:cfg.id==='r115'?{estado:'región compartida cursor/ruta medida en ambas; identidad y trayectoria requieren revisión visual',muestras:muestras.map(m=>({ms:m.ms,referencia:m.referencia.regiones.movimiento,replica:m.replica.regiones.movimiento,dom:m.dom.cursor}))}:null,
      ruta:arrastre,trazos:cfg.regiones.trazo?{estado:'presencia y estabilidad medidas; plenitud del trazo requiere revisión visual',region:'trazo',presente_en_corte:!!aparicion?.trazo.referencia&&!!aparicion?.trazo.replica}:null,muestras});
  }
  const cubiertos=casos.filter(c=>c.muestras?.length);
  return {estado:cubiertos.length?'medida-parcial':'sin-cobertura',fps:8,casos,cobertura:{aparicion:cubiertos.some(c=>c.aparicion),estabilidad:cubiertos.some(c=>c.muestras.length>1),cursor:cubiertos.some(c=>c.cursor),ruta:cubiertos.some(c=>c.ruta?.referencia_ms!=null&&c.ruta?.replica_ms!=null),trazos:cubiertos.some(c=>c.trazos)?'subrayado de r10, sello de r403 y arco tachado de r103':false},
    limite:'La ráfaga d_123 termina antes de completar la ruta. Presencia no certifica identidad del cursor; revisar capturas y métricas. No se acredita lo no cubierto.'};
}

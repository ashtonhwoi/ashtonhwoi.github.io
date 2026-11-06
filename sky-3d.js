/* Ray-marched cloud volume. The pointer moves a camera inside a 3D atmosphere. */
(() => {
  const scene = document.querySelector('.sky-scene');
  if (!scene) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'sky-volume'; canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return;
  const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision highp float;
uniform vec2 resolution; uniform vec2 camera; uniform float travel;
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float density(vec3 p){vec3 q=p*.38;float n=noise(q)*.57+noise(q*2.03)*.28+noise(q*4.01)*.15;
 float height=1.-smoothstep(.55,2.5,abs(p.y+1.8));
 return smoothstep(.40,.70,n)*height;}
void main(){vec2 uv=(gl_FragCoord.xy*2.-resolution)/resolution.y;
 vec3 ro=vec3(camera.x*2.2,1.7+camera.y*.65,travel*1.8);
 vec3 forward=normalize(vec3(camera.x*.16,camera.y*.10-.04,1.));
 vec3 right=normalize(cross(vec3(0,1,0),forward));vec3 up=cross(forward,right);
 vec3 rd=normalize(forward*1.55+right*uv.x+up*uv.y);
 vec3 sun=normalize(vec3(.85,.45,1.));float light=max(dot(rd,sun),0.);
 vec3 color=mix(vec3(.23,.35,.47),vec3(.025,.075,.15),smoothstep(-.16,.65,rd.y));
 color+=vec3(.42,.30,.17)*pow(light,24.)*.45;
 vec4 cloud=vec4(0.);float t=1.5;
 for(int i=0;i<56;i++){
  vec3 p=ro+rd*t;float d=density(p);
  if(d>.015){float shade=clamp((d-density(p+sun*.7))*1.8+.5,0.,1.);
   vec3 lit=mix(vec3(.14,.22,.32),vec3(.85,.79,.68),shade);
   lit=mix(lit,color,1.-exp(-t*.018));
   float alpha=1.-exp(-d*.45);cloud.rgb+=(1.-cloud.a)*lit*alpha;cloud.a+=(1.-cloud.a)*alpha;
   if(cloud.a>.985)break;}
  t+=.36+t*.028;
 }
 color=cloud.rgb+color*(1.-cloud.a);
 gl_FragColor=vec4(color,1.);
}`;
  function shader(type, source) {
    const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  try {
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment)); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const res = gl.getUniformLocation(program, 'resolution');
    const cam = gl.getUniformLocation(program, 'camera');
    const travel = gl.getUniformLocation(program, 'travel');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const fine = matchMedia('(hover: hover) and (pointer: fine)');
    let x=0,y=0,tx=0,ty=0,raf=0,visible=true,lost=false;
    function render() {
      raf=0;if(document.hidden||!visible||lost)return;
      if(reduced.matches){x=y=tx=ty=0;}else{x+=(tx-x)*.08;y+=(ty-y)*.08;}
      gl.uniform2f(cam,x,y);gl.uniform1f(travel,reduced.matches?0:Math.min(scrollY/innerHeight,1));
      gl.drawArrays(gl.TRIANGLES,0,6);
      canvas.dataset.camera = `${x.toFixed(3)},${y.toFixed(3)}`;
      if(Math.abs(x-tx)+Math.abs(y-ty)>.002)wake();
    }
    function wake(){if(!raf&&!lost)raf=requestAnimationFrame(render);}
    function resize(){const r=scene.getBoundingClientRect(),scale=Math.min(.65,960/r.width);
      canvas.width=Math.round(r.width*scale);canvas.height=Math.round(r.height*scale);
      gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(res,canvas.width,canvas.height);wake();}
    scene.prepend(canvas);resize();
    scene.classList.add('has-volume');
    addEventListener('pointermove',e=>{if(!fine.matches||reduced.matches)return;
      tx=e.clientX/innerWidth*2-1;ty=1-e.clientY/innerHeight*2;wake();},{passive:true});
    document.documentElement.addEventListener('pointerleave',()=>{tx=ty=0;wake();});
    addEventListener('scroll',wake,{passive:true});addEventListener('resize',resize);
    document.addEventListener('visibilitychange',wake);reduced.addEventListener('change',wake);
    fine.addEventListener('change',()=>{tx=ty=0;wake();});
    new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)wake();}).observe(scene);
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;scene.classList.remove('has-volume');});
    canvas.addEventListener('webglcontextrestored',()=>{canvas.remove();scene.classList.remove('has-volume');});
  } catch { canvas.remove(); scene.classList.remove('has-volume'); }
})();

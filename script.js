// Simple Battle Royale game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const countEl = document.getElementById('count');
const messageEl = document.getElementById('message');

let keys = {};
let entities = [];
let running = true;
let player;

function rand(min, max){ return Math.random()*(max-min)+min }

class Entity{
  constructor(x,y,size,color,isPlayer=false){
    this.x=x; this.y=y; this.size=size; this.color=color; this.isPlayer=isPlayer;
    this.vx=rand(-1,1); this.vy=rand(-1,1);
    this.alive=true;
  }
  update(){
    if(!this.alive) return;
    if(this.isPlayer){
      const speed = 2.5;
      let dx=0, dy=0;
      if(keys.ArrowLeft||keys.a) dx-=1;
      if(keys.ArrowRight||keys.d) dx+=1;
      if(keys.ArrowUp||keys.w) dy-=1;
      if(keys.ArrowDown||keys.s) dy+=1;
      if(dx||dy){
        const len = Math.hypot(dx,dy)||1;
        this.vx = (dx/len)*speed;
        this.vy = (dy/len)*speed;
      } else {
        // slight friction
        this.vx *= 0.9; this.vy *= 0.9;
      }
    } else {
      // simple AI: wander; occasionally change direction
      if(Math.random() < 0.02) {
        this.vx = rand(-1.2,1.2);
        this.vy = rand(-1.2,1.2);
      }
    }
    this.x += this.vx; this.y += this.vy;
    // bounds
    if(this.x<this.size) { this.x=this.size; this.vx = Math.abs(this.vx); }
    if(this.x>W-this.size) { this.x=W-this.size; this.vx = -Math.abs(this.vx); }
    if(this.y<this.size) { this.y=this.size; this.vy = Math.abs(this.vy); }
    if(this.y>H-this.size) { this.y=H-this.size; this.vy = -Math.abs(this.vy); }
  }
  draw(){
    if(!this.alive) return;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
    ctx.fill();
    if(this.isPlayer){
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    }
  }
}

function spawn(count=8){
  entities = [];
  // player
  player = new Entity(W/2,H/2,12,'#00ccff',true);
  entities.push(player);
  for(let i=0;i<count;i++){
    let sz = rand(8,18);
    let e = new Entity(rand(sz,W-sz), rand(sz,H-sz), sz, `hsl(${Math.random()*360} 70% 50%)`);
    entities.push(e);
  }
  updateCount();
  messageEl.classList.add('hidden');
  running = true;
}

function updateCount(){
  let alive = entities.filter(e=>e.alive).length;
  countEl.textContent = alive;
}

function handleCollisions(){
  for(let i=0;i<entities.length;i++){
    const a = entities[i]; if(!a.alive) continue;
    for(let j=i+1;j<entities.length;j++){
      const b = entities[j]; if(!b.alive) continue;
      const dx = a.x-b.x, dy = a.y-b.y;
      const dist = Math.hypot(dx,dy);
      if(dist < a.size + b.size){
        // larger eats smaller
        if(a.size > b.size * 0.95){
          a.size += b.size*0.2;
          b.alive=false;
        } else if(b.size > a.size * 0.95){
          b.size += a.size*0.2;
          a.alive=false;
        } else {
          // similar size: both bounce away
          const nx = dx/dist, ny = dy/dist;
          a.vx += nx; a.vy += ny;
          b.vx -= nx; b.vy -= ny;
        }
      }
    }
  }
}

function loop(){
  ctx.clearRect(0,0,W,H);
  entities.forEach(e=>e.update());
  handleCollisions();
  entities.forEach(e=>e.draw());
  updateCount();
  checkEnd();
  if(running) requestAnimationFrame(loop);
}

function checkEnd(){
  const alive = entities.filter(e=>e.alive);
  if(alive.length <= 1){
    running=false;
    const winner = alive[0];
    if(winner){
      if(winner.isPlayer){ showMessage('You win! Press R to play again ✅'); }
      else { showMessage('You were eliminated. Press R to try again ⚠️'); }
    } else showMessage('No winner. Press R to restart.');
  }
}

function showMessage(txt){
  messageEl.textContent = txt;
  messageEl.classList.remove('hidden');
}

// controls
window.addEventListener('keydown', e=>{
  keys[e.key] = true;
  if(e.key === 'r' || e.key === 'R') { spawn(10); }
});
window.addEventListener('keyup', e=>{ keys[e.key] = false; });

// focus canvas so it receives keyboard events
canvas.addEventListener('click', ()=>canvas.focus());
canvas.focus();

// start
spawn(10);
loop();
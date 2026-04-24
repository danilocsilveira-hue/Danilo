/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Play, RefreshCw, Trophy, Skull } from 'lucide-react';

// --- Sound Helpers ---
const playSound = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
};

// --- Procedural Texture Helpers ---

function createMosesTexture(scene: Phaser.Scene) {
  const canvas = scene.textures.createCanvas('moses', 32, 48);
  if (!canvas) return;
  const ctx = canvas.getContext();

  // Robe (beige/sand)
  ctx.fillStyle = '#d2b48c';
  ctx.fillRect(8, 16, 16, 28);
  
  // Outer cloak/wrap (brown)
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(8, 16, 4, 28);
  ctx.fillRect(20, 16, 4, 28);
  
  // Belt (dark brown)
  ctx.fillStyle = '#5d2e0c';
  ctx.fillRect(8, 28, 16, 2);

  // Head (tan skin tone)
  ctx.fillStyle = '#f5deb3';
  ctx.fillRect(10, 4, 12, 12);
  
  // Detailed Beard (white/grey)
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(10, 12, 12, 8); // Long beard
  ctx.fillStyle = '#d0d0d0';
  ctx.fillRect(12, 14, 8, 8); // Beard depth
  
  // Hair (white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(8, 4, 16, 4); // Top hair
  ctx.fillRect(8, 4, 4, 12); // Left side
  ctx.fillRect(20, 4, 4, 12); // Right side
  
  // Staff (brown wood with texture)
  ctx.fillStyle = '#5d2e0c';
  ctx.fillRect(24, 0, 4, 48);
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(25, 0, 2, 48);
  
  // Eyes
  ctx.fillStyle = '#000000';
  ctx.fillRect(13, 8, 2, 2);
  ctx.fillRect(17, 8, 2, 2);

  canvas.refresh();
}

function createSoldierTexture(scene: Phaser.Scene) {
  const canvas = scene.textures.createCanvas('soldier', 32, 48);
  if (!canvas) return;
  const ctx = canvas.getContext();

  // Tunic (white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(8, 16, 16, 24);
  
  // Bronze Armor/Breastplate
  ctx.fillStyle = '#cd7f32';
  ctx.fillRect(8, 16, 16, 12);
  ctx.fillStyle = '#b87333';
  ctx.fillRect(10, 18, 12, 8);
  
  // Head (brown skin tone)
  ctx.fillStyle = '#a0522d';
  ctx.fillRect(10, 4, 12, 12);
  
  // Nemes Headdress (blue/gold stripes)
  ctx.fillStyle = '#000080'; // Dark blue
  ctx.fillRect(6, 0, 20, 10);
  ctx.fillStyle = '#ffd700'; // Gold stripes
  ctx.fillRect(6, 0, 20, 2);
  ctx.fillRect(8, 4, 16, 2);
  ctx.fillRect(10, 8, 12, 2);
  
  // Shield (round bronze)
  ctx.fillStyle = '#b87333';
  ctx.beginPath();
  ctx.arc(4, 30, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Spear (iron tip)
  ctx.fillStyle = '#4a2c00';
  ctx.fillRect(26, 0, 2, 48);
  ctx.fillStyle = '#c0c0c0';
  ctx.beginPath();
  ctx.moveTo(27, -5);
  ctx.lineTo(31, 10);
  ctx.lineTo(23, 10);
  ctx.fill();

  canvas.refresh();
}

function createHorseTexture(scene: Phaser.Scene) {
  const canvas = scene.textures.createCanvas('horse', 64, 48);
  if (!canvas) return;
  const ctx = canvas.getContext();

  // Body (brown)
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(8, 16, 40, 20);
  
  // Head
  ctx.fillRect(40, 4, 12, 16);
  
  // Legs
  ctx.fillRect(12, 36, 6, 12);
  ctx.fillRect(38, 36, 6, 12);
  
  // Tail
  ctx.fillStyle = '#5d2e0c';
  ctx.fillRect(4, 18, 4, 12);

  canvas.refresh();
}

function createScrollTexture(scene: Phaser.Scene) {
  const canvas = scene.textures.createCanvas('scroll', 24, 24);
  if (!canvas) return;
  const ctx = canvas.getContext();

  ctx.fillStyle = '#fdf5e6';
  ctx.fillRect(4, 4, 16, 16);
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 16, 16);
  
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(6, 8, 12, 2);
  ctx.fillRect(6, 12, 12, 2);

  canvas.refresh();
}

function createGroundTexture(scene: Phaser.Scene) {
  const canvas = scene.textures.createCanvas('ground', 32, 32);
  if (!canvas) return;
  const ctx = canvas.getContext();

  ctx.fillStyle = '#edc9af'; // Sand
  ctx.fillRect(0, 0, 32, 32);
  
  // Texture details
  ctx.fillStyle = '#c19a6b';
  ctx.fillRect(5, 5, 4, 4);
  ctx.fillRect(20, 15, 6, 2);

  canvas.refresh();
}

// --- Game Logic ---

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(data: any) {
    // Save React state setters to registry
    this.registry.set('setScore', data.setScore);
    this.registry.set('setLives', data.setLives);
    this.registry.set('setGameState', data.setGameState);
    
    this.scene.start('GameScene');
  }
}

class GameScene extends Phaser.Scene {
  player!: Phaser.Physics.Arcade.Sprite;
  cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  spaceKey!: Phaser.Input.Keyboard.Key;
  enemies!: Phaser.Physics.Arcade.Group;
  scrolls!: Phaser.Physics.Arcade.Group;
  platforms!: Phaser.Physics.Arcade.StaticGroup;
  seaGroup!: Phaser.GameObjects.Container;
  score: number = 0;
  lives: number = 3;
  isMounted: boolean = false;
  seaParted: boolean = false;
  jumpCount: number = 0;
  
  // External state setters
  setScoreUI!: (s: number) => void;
  setLivesUI!: (l: number) => void;
  setGameState!: (s: string) => void;

  constructor() {
    super('GameScene');
  }

  init() {
    this.setScoreUI = this.registry.get('setScore');
    this.setLivesUI = this.registry.get('setLives');
    this.setGameState = this.registry.get('setGameState');
    this.score = 0;
    this.lives = 3;
    this.isMounted = false;
    this.seaParted = false;
  }

  preload() {
    createMosesTexture(this);
    createSoldierTexture(this);
    createHorseTexture(this);
    createScrollTexture(this);
    createGroundTexture(this);
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const worldWidth = 6000;

    this.physics.world.setBounds(0, 0, worldWidth, height);
    this.cameras.main.setBounds(0, 0, worldWidth, height);

    // Background Gradient (Desert Sky)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xffd700, 0xffd700, 0xffa500, 0xffa500, 1);
    bg.fillRect(0, 0, worldWidth, height);

    // Distant Pyramids (Simple Shapes)
    for (let i = 0; i < 15; i++) {
        const px = i * 600 + Phaser.Math.Between(-100, 100);
        const py = height - 120;
        const size = Phaser.Math.Between(150, 300);
        const p = this.add.graphics();
        p.fillStyle(0xc19a6b, 0.4);
        p.fillTriangle(px, py, px + size / 2, py - size, px + size, py);
    }

    // Platforms
    this.platforms = this.physics.add.staticGroup();
    
    // Main Floor
    for (let x = 0; x < worldWidth; x += 32) {
      if (x < 5000 || x > 5600) { // Gap for the "Sea" transition later if needed
          this.platforms.create(x, height - 16, 'ground');
      }
    }

    // Scattered Platforms
    const platformConfigs = [
        {x: 600, y: height - 150, w: 4},
        {x: 1000, y: height - 200, w: 3},
        {x: 1400, y: height - 180, w: 5},
        {x: 1800, y: height - 250, w: 3},
        {x: 2300, y: height - 150, w: 6},
        {x: 2800, y: height - 220, w: 4},
        {x: 3400, y: height - 180, w: 8},
        {x: 4000, y: height - 260, w: 4},
        {x: 4500, y: height - 150, w: 2},
    ];

    platformConfigs.forEach(p => {
        for(let i = 0; i < p.w; i++) {
            this.platforms.create(p.x + (i * 32), p.y, 'ground');
        }
    });

    // Red Sea Area
    const seaX = 5300;
    const seaY = height - 16;
    
    this.seaGroup = this.add.container(seaX, 0);
    const seaLeft = this.add.rectangle(-400, height/2, 800, height, 0x0000ff, 0.7);
    const seaRight = this.add.rectangle(400, height/2, 800, height, 0x0000ff, 0.7);
    this.seaGroup.add([seaLeft, seaRight]);

    // Player
    this.player = this.physics.add.sprite(100, height - 100, 'moses');
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.platforms);

    // Horse (Mount)
    const horse = this.physics.add.sprite(3200, height - 100, 'horse');
    this.physics.add.collider(horse, this.platforms);
    this.physics.add.overlap(this.player, horse, () => {
        if (!this.isMounted) {
            this.isMounted = true;
            horse.destroy();
            this.player.setTexture('horse');
            this.player.setScale(1.2);
            this.player.body?.setSize(64, 48);
        }
    });

    // Enemies
    this.enemies = this.physics.add.group();
    const enemyPositions = [1500, 2500, 3800, 4200, 4800, 5800];
    enemyPositions.forEach(ex => {
        const e = this.enemies.create(ex, height - 100, 'soldier');
        e.setCollideWorldBounds(true);
        this.physics.add.collider(e, this.platforms);
        e.setVelocityX(-100);
    });

    this.physics.add.overlap(this.player, this.enemies, (p, e) => {
        const player = p as Phaser.Physics.Arcade.Sprite;
        const enemy = e as Phaser.Physics.Arcade.Sprite;

        // Check if player is falling and hitting the enemy from above (jump on head)
        if (player.body && player.body.velocity.y > 0 && player.y < enemy.y - 15) {
            enemy.destroy();
            player.setVelocityY(-400); // Higher bounce for better feel
            this.score += 50;
            this.setScoreUI(this.score);
            playSound(600, 'square', 0.1); // Kill sound
            return;
        }

        if (this.spaceKey.isDown) { // Attacking with staff
            enemy.destroy();
            this.score += 50;
            this.setScoreUI(this.score);
            playSound(600, 'square', 0.1); // Attack sound
        } else {
            this.handleHit();
        }
    });

    // Scrolls
    this.scrolls = this.physics.add.group();
    for (let i = 0; i < 20; i++) {
        const sx = Phaser.Math.Between(500, 4800);
        const sy = Phaser.Math.Between(height - 400, height - 100);
        this.scrolls.create(sx, sy, 'scroll');
    }
    this.physics.add.collider(this.scrolls, this.platforms);
    this.physics.add.overlap(this.player, this.scrolls, (p, s) => {
        (s as Phaser.Physics.Arcade.Sprite).destroy();
        this.score += 100;
        this.setScoreUI(this.score);
    });

    // Set up Input early
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  handleHit() {
    if (this.player.alpha < 1) return; // Invulnerability frame
    this.lives--;
    this.setLivesUI(this.lives);
    this.player.setAlpha(0.5);
    playSound(150, 'sawtooth', 0.3); // Hit sound
    this.time.delayedCall(1000, () => this.player.setAlpha(1));
    
    if (this.lives <= 0) {
        this.setGameState('gameover');
        this.scene.pause();
    }
  }

  update() {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(this.isMounted ? -400 : -200);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.isMounted ? 400 : 200);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    const upJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.up);

    if (this.player.body?.touching.down) {
      this.jumpCount = 0;
    }

    if (upJustDown && (this.player.body?.touching.down || this.jumpCount < 2)) {
      this.player.setVelocityY(this.isMounted ? -500 : -450);
      this.jumpCount++;
      playSound(440 + (this.jumpCount * 50), 'sine', 0.1); // Jump sound with pitch shift for second jump
    }

    // Enemy movement logic
    this.enemies.getChildren().forEach((e: any) => {
        if (e.body?.blocked.left) e.setVelocityX(100);
        if (e.body?.blocked.right) e.setVelocityX(-100);
    });

    // Sea Parting Logic
    if (this.player.x > 5000 && !this.seaParted && this.seaGroup.length >= 2) {
        this.seaParted = true;
        playSound(100, 'sawtooth', 2.0); // Sea rumble
        // Animation of parting
        const leftSide = this.seaGroup.getAt(0) as Phaser.GameObjects.Rectangle;
        const rightSide = this.seaGroup.getAt(1) as Phaser.GameObjects.Rectangle;
        
        this.tweens.add({
            targets: leftSide,
            x: -800,
            duration: 2000,
            ease: 'Power2'
        });
        this.tweens.add({
            targets: rightSide,
            x: 800,
            duration: 2000,
            ease: 'Power2'
        });
    }

    // Victory Check
    if (this.player.x > 5900) {
        this.setGameState('won');
        this.scene.pause();
    }

    // Pitfall check
    if (this.player.y > this.scale.height + 50) {
        this.handleHit();
        this.player.setPosition(this.player.x - 200, this.scale.height - 200);
    }
  }
}

// --- React Wrapper ---

export default function App() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover' | 'won'>('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameState === 'playing' && !gameRef.current) {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 500,
        parent: gameContainerRef.current!,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 500,
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 1000, x: 0 },
            debug: false,
          },
        },
        scene: [BootScene, GameScene],
      };

      try {
        const game = new Phaser.Game(config);
        gameRef.current = game;
        (window as any).game = game; // Fix for potential "game is not defined" errors

        // Start BootScene with initial data
        game.scene.start('BootScene', { setScore, setLives, setGameState });

        console.log('Phaser Game Initialized');
      } catch (error) {
        console.error('Phaser Initialization Error:', error);
      }

      return () => {
        game.destroy(true);
        gameRef.current = null;
      };
    }
  }, [gameState]);

  const resetGame = () => {
    if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
    }
    setScore(0);
    setLives(3);
    setGameState('playing');
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-4 font-sans text-stone-100">
      <div className="w-full max-w-4xl relative aspect-[16/10] bg-stone-800 rounded-2xl overflow-hidden shadow-2xl border-4 border-stone-700">
        
        {/* UI Overlay */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Heart 
                  key={i} 
                  className={`w-8 h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-stone-600'}`} 
                />
              ))}
            </div>
            <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
              <span className="text-yellow-400 font-mono text-xl tracking-wider">PONTOS: {score.toString().padStart(6, '0')}</span>
            </div>
          </div>
        )}

        {/* Start Screen */}
        <AnimatePresence>
          {gameState === 'start' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-gradient-to-br from-orange-900 to-amber-800 flex flex-col items-center justify-center p-8 text-center"
            >
              <motion.h1 
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                className="text-6xl md:text-8xl font-black text-yellow-400 mb-4 drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] uppercase italic tracking-tighter"
              >
                A Fuga de Moisés
              </motion.h1>
              <p className="text-xl md:text-2xl text-amber-100 mb-12 max-w-lg leading-relaxed font-medium">
                Fuja dos soldados egípcios, colete pergaminhos sagrados e abra o Mar Vermelho para a liberdade!
              </p>
              <button 
                onClick={() => setGameState('playing')}
                className="group flex items-center gap-4 bg-yellow-500 hover:bg-yellow-400 text-stone-900 px-12 py-6 rounded-full text-3xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_8px_0_rgb(161,98,7)]"
              >
                <Play className="fill-current w-8 h-8" />
                INICIAR JORNADA
              </button>
              <div className="mt-16 grid grid-cols-2 gap-8 text-amber-200/60 uppercase text-xs tracking-widest font-bold">
                 <div className="flex flex-col gap-1">
                    <span>SETAS: MOVIMENTO</span>
                    <span>CIMA: PULAR</span>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span>ESPAÇO: ATACAR (CAJADO)</span>
                    <span>COLETA: PERGAMINHOS</span>
                 </div>
              </div>
            </motion.div>
          )}

          {/* Game Over Screen */}
          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-20 bg-black/90 flex flex-col items-center justify-center p-8 text-center"
            >
              <Skull className="w-24 h-24 text-red-600 mb-6" />
              <h2 className="text-6xl font-bold text-white mb-2">JORNADA INTERROMPIDA</h2>
              <p className="text-xl text-stone-400 mb-12">Os soldados capturaram Moisés...</p>
              <button 
                onClick={resetGame}
                className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-900 px-8 py-4 rounded-xl text-xl font-bold transition-transform hover:scale-105"
              >
                <RefreshCw /> TENTAR NOVAMENTE
              </button>
            </motion.div>
          )}

          {/* Victory Screen */}
          {gameState === 'won' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-20 bg-gradient-to-br from-blue-600 to-cyan-500 flex flex-col items-center justify-center p-8 text-center"
            >
              <Trophy className="w-32 h-32 text-yellow-300 mb-8 animate-bounce" />
              <h2 className="text-7xl font-black text-white mb-4 drop-shadow-xl uppercase">LIBERDADE!</h2>
              <p className="text-2xl text-blue-100 mb-2 font-medium">O Mar Vermelho se fechou sobre os perseguidores.</p>
              <p className="text-xl text-blue-200 mb-12">Você guiou o povo à terra prometida!</p>
              <div className="bg-white/20 backdrop-blur-md p-6 rounded-2xl border border-white/30 mb-8">
                <span className="block text-blue-50 text-sm uppercase tracking-widest mb-1">Pontuação Final</span>
                <span className="text-5xl font-mono font-bold text-yellow-300">{score}</span>
              </div>
              <button 
                onClick={resetGame}
                className="flex items-center gap-2 bg-white text-blue-600 px-10 py-5 rounded-full text-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Play className="fill-current" /> JOGAR DE NOVO
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phaser Game Container */}
        <div ref={gameContainerRef} className="w-full h-full" id="game-canvas" />
      </div>

      <div className="mt-8 text-stone-500 text-sm max-w-2xl text-center leading-relaxed">
        Controle Moisés usando as <strong>setas do teclado</strong>. Use <strong>Espaço</strong> para atacar soldados com o cajado. Encontre o <strong>cavalo</strong> para acelerar sua fuga. Ao chegar no mar, testemunhe o milagre da abertura das águas!
      </div>
    </div>
  );
}

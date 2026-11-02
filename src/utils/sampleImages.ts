export interface SampleImage {
  id: string;
  name: string;
  category: 'hardware' | 'photo' | 'graphic' | 'testcard';
  url?: string;
  generator?: (canvas: HTMLCanvasElement) => void;
  description: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'retro_pc',
    name: 'Vintage 1980s PC Workstation',
    category: 'hardware',
    url: '/src/assets/images/retro_vintage_computer_1793586888752.jpg',
    description: 'Classic IBM PC with CRT monitor, mechanical keyboard, and 5.25" disks',
  },
  {
    id: 'apollo_moon',
    name: 'Apollo Lunar Exploration',
    category: 'photo',
    url: '/src/assets/images/retro_apollo_moon_1793586899584.jpg',
    description: 'High-contrast Hasselblad archival photo of astronaut and lunar module',
  },
  {
    id: 'test_card',
    name: 'VGA 640x480 Test Pattern',
    category: 'testcard',
    description: 'Calibration grids, concentric circles, gradient zones, and resolution lines',
    generator: (canvas: HTMLCanvasElement) => {
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 640, 480);

      // Outer border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 632, 472);

      // Center crosshairs
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(320, 0);
      ctx.lineTo(320, 480);
      ctx.moveTo(0, 240);
      ctx.lineTo(640, 240);
      ctx.stroke();

      // Concentric circles
      for (let r = 30; r <= 180; r += 30) {
        ctx.beginPath();
        ctx.arc(320, 240, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Grayscale gradient strip
      for (let x = 80; x < 560; x++) {
        const shade = Math.floor(((x - 80) / 480) * 255);
        ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
        ctx.fillRect(x, 70, 1, 30);
      }
      ctx.strokeStyle = '#000000';
      ctx.strokeRect(80, 70, 480, 30);

      // High-frequency resolution lines
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#000000' : '#ffffff';
        ctx.fillRect(80 + i * 4, 380, 4, 30);
      }

      // Retro text labels
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('QUICKBASIC 640x480 CALIBRATION', 320, 140);
      ctx.font = '14px monospace';
      ctx.fillText('1-Bit Dither Evaluation Matrix (SCREEN 11 / 12)', 320, 165);
    },
  },
  {
    id: 'retro_arcade',
    name: 'Retro Spacecraft Vector Graphic',
    category: 'graphic',
    description: 'Crisp geometric starship vector line art',
    generator: (canvas: HTMLCanvasElement) => {
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = '#05070f';
      ctx.fillRect(0, 0, 640, 480);

      // Starfield background
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 150; i++) {
        const sx = (i * 137) % 640;
        const sy = (i * 283) % 480;
        const size = (i % 3) + 1;
        ctx.fillRect(sx, sy, size, size);
      }

      // Starship body
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#22283a';

      ctx.beginPath();
      ctx.moveTo(320, 100);
      ctx.lineTo(440, 360);
      ctx.lineTo(320, 320);
      ctx.lineTo(200, 360);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Wing fins
      ctx.beginPath();
      ctx.moveTo(320, 170);
      ctx.lineTo(380, 300);
      ctx.lineTo(320, 270);
      ctx.lineTo(260, 300);
      ctx.closePath();
      ctx.stroke();

      // Cockpit
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(320, 200, 18, 35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Exhaust glow rings
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      for (let r = 10; r <= 50; r += 12) {
        ctx.beginPath();
        ctx.arc(320, 370, r, 0, Math.PI);
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VGA BITPLANE GRAPHICS DEMO', 320, 450);
    },
  },
];

import { useEffect, useRef } from 'react';

// Посилання на оригінальні 3D WebP-зображення від Google (Android-стиль)
const ASSET_URLS = {
	thinking: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp', // 🤔
	eyebrow: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f928/512.webp',  // 🤨
	lightning: 'https://fonts.gstatic.com/s/e/notoemoji/latest/26a1/512.webp'   // ⚡
};

interface BackgroundParticle {
	x: number;
	y: number;
	size: number;
	img: HTMLImageElement;
	speedX: number;
	speedY: number;
	opacity: number;
	rotation: number;
	rotationSpeed: number;
	type: 'emoji' | 'star' | 'lightning'; // Розділяємо типи для різних ефектів
	twinkleSpeed?: number;                // Для мерехтіння зірок/блискавок
}

export function EmojiBackground() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		let animationFrameId: number;
		const particles: BackgroundParticle[] = [];

		// 1. Завантажуємо зображення
		const imgThinking = new Image(); imgThinking.src = ASSET_URLS.thinking;
		const imgEyebrow = new Image(); imgEyebrow.src = ASSET_URLS.eyebrow;
		const imgLightning = new Image(); imgLightning.src = ASSET_URLS.lightning;

		const emojis = [imgThinking, imgEyebrow];

		// Підганяємо розмір під екран
		const resizeCanvas = () => {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
		};
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		// 2. Створюємо елементи на фоні (всього 35 штук, щоб не перевантажувати екран)
		const totalParticles = 35;
		for (let i = 0; i < totalParticles; i++) {
			let img: HTMLImageElement;
			let type: 'emoji' | 'star' | 'lightning';
			let size: number;

			const rand = Math.random();

			if (rand < 0.4) {
				// 65% шансу — смайлики (🤔 або 🤨)
				img = emojis[Math.floor(Math.random() * emojis.length)];
				type = 'emoji';
				size = Math.random() * 25 + 25; // 45px - 70px
			} else {
				// 25% шансу — блискавки (⚡)
				img = imgLightning;
				type = 'lightning';
				size = Math.random() * 20 + 20; // 30px - 50px
			}

			particles.push({
				x: Math.random() * canvas.width,
				y: Math.random() * canvas.height,
				size: size,
				img: img,
				speedX: (Math.random() - 0.5) * 1.0,
				speedY: (Math.random() - 0.5) * 1.0 - 0.2, // Повільно пливуть догори
				opacity: Math.random() * 0.25 + 0.15, // Робимо легку прозорість, щоб не різало очі
				rotation: (Math.random() - 0.5) * 0.5,
				rotationSpeed: type === 'emoji' ? (Math.random() - 0.5) * 0.005 : (Math.random() - 0.5) * 0.02, // Зірочки й блискавки крутяться трохи швидше
				type: type,

			});
		}

		// 3. Головний цикл анімації
		const animate = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			particles.forEach((p) => {
				// Рух та обертання
				p.x += p.speedX;
				p.y += p.speedY;
				p.rotation += p.rotationSpeed;

				// Ефект мерехтіння для зірочок та блискавок
				if (p.type !== 'emoji' && p.twinkleSpeed) {
					p.opacity += p.twinkleSpeed;
					// Якщо стали занадто прозорими або яскравими — розвертаємо ефект мерехтіння
					if (p.opacity < 0.1 || p.opacity > 0.45) {
						p.twinkleSpeed *= -1;
					}
				}

				// Межі екрана: якщо вилетів — повертаємо з іншого боку
				if (p.x < -70) p.x = canvas.width + 70;
				if (p.x > canvas.width + 70) p.x = -70;
				if (p.y < -70) p.y = canvas.height + 70;
				if (p.y > canvas.height + 70) p.y = -70;

				// Малюємо об'єкт
				if (p.img.complete) {
					ctx.save();
					ctx.translate(p.x, p.y);
					ctx.rotate(p.rotation);
					ctx.globalAlpha = Math.max(0.05, Math.min(1, p.opacity)); // Захист від виходу за межі alpha [0,1]

					ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);

					ctx.restore();
				}
			});

			animationFrameId = requestAnimationFrame(animate);
		};

		animate();

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			cancelAnimationFrame(animationFrameId);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none',
				zIndex: 0,
			}}
		/>
	);
}
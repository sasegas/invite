import { useState } from 'react';
import './App.scss';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { EmojiBackground } from './EmojiBackground';
import confetti from 'canvas-confetti';




const noPhrases = [
	"Ні",
	"Ти впевнена?",
	"Точно-точно?",
	"Подумай ще раз!",
	"Ну будь ласка 🥺",
	"Я буду плакати...",
	"Добре, я здамся...",
	"Жартую, тисни ТАК!",
];

// Варіанти активностей
const activitiesList = [
	"Піти в кіно",
	"Попити чаю",
	"Просто прогулятись",
	"Сходити в сікрет місце"
];

const contentVariants: Variants = {
	initial: { scale: 1, opacity: 0 },
	animate: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
	exit: {
		scale: [1, 1.15, 0], // Збільшення -> різке стискання в 0
		opacity: [1, 1, 0],
		transition: {
			duration: 0.4,
			times: [0, 0.4, 1],
			ease: "easeInOut"
		}
	}
};

export function App() {
	const [noCount, setNoCount] = useState(0);
	const [accepted, setAccepted] = useState(false);
	const [activity, setActivity] = useState('');
	const [activityConfirmed, setActivityConfirmed] = useState(false);
	const [meetingDate, setMeetingDate] = useState<Date | null>(null);
	const [dateConfirmed, setDateConfirmed] = useState(false);

	const yesButtonSize = noCount * 20 + 16;

	const playSound = (soundPath: string) => {
		const audio = new Audio(soundPath);
		audio.volume = 0.5; // Гучність від 0.0 до 1.0 (зараз 50%)
		audio.play().catch((e) => console.log("Браузер заблокував автоплей до першої взаємодії:", e));
	};

	const handleNoClick = () => {
		setNoCount(noCount + 1);
		playSound('./sounds/sad.mp3');
		const currentNoText = noPhrases[Math.min(noCount + 1, noPhrases.length - 1)];
		const message = `Вона натиснула ні ${noCount + 1} разів. Текст: "${currentNoText}"`;
		sendTelegramMessage(message);

	};

	const handleYesClick = () => {
		setAccepted(true);
		playSound('./sounds/happy.mp3');
		sendTelegramMessage(`Вона натиснула так!`);
		confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
	};

	const getNoButtonText = () => {
		return noPhrases[Math.min(noCount, noPhrases.length - 1)];
	};

	const formatDateTime = (date: Date | null) => {
		if (!date) return '';
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${day}.${month}.${year} о ${hours}:${minutes}`;
	};


	const sendTelegramMessage = async (message: string) => {
		const token = import.meta.env.VITE_TG_BOT_TOKEN;
		const chatId = import.meta.env.VITE_TG_CHAT_ID;
		if (!token || !chatId) return;

		try {
			await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ chat_id: chatId, text: message }),
			});
		} catch (e) { console.error(e); }
	};

	return (
		// Головний контейнер (фон) тепер СТАТИЧНИЙ і не перемальовується
		<div className="container">
			<EmojiBackground />
			<AnimatePresence mode="wait">

				{/* 4. Фінальний екран */}
				{activityConfirmed && (
					<motion.div
						key="final"
						variants={contentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						className="con-main"
					>
						<h1>Ура! До зустрічі {formatDateTime(meetingDate)}!</h1>
						<p >
							План: <span >{activity}</span>
						</p>
					</motion.div>
				)}

				{/* 3. Екран вибору активності */}
				{!activityConfirmed && dateConfirmed && (
					<motion.div
						key="activity"
						variants={contentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						className="con-main"
					>
						<h1>Що ти хотіла б робити?</h1>
						<div className="activities-container">
							{activitiesList.map((act, index) => (
								<button
									key={index}
									className={`activity-button ${activity === act ? 'selected' : ''}`}
									onClick={() => { setActivity(act); playSound('./sounds/click.mp3'); }}
								>
									{act}
								</button>
							))}
						</div>
						{activity && (
							<button
								className="yes-button confirm-button"
								onClick={() => {
									setActivityConfirmed(true);
									sendTelegramMessage(`🎉 Вона сказала ТАК!\n\n📅 Дата та час: ${formatDateTime(meetingDate)}\n🎯 Що будемо робити: ${activity}`);
									confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
									playSound('./sounds/victory.mp3');
								}}
								style={{ marginTop: '20px' }}
							>
								Підтвердити
							</button>
						)}
					</motion.div>
				)}

				{/* 2. Екран вибору дати */}
				{!dateConfirmed && accepted && (
					<motion.div
						key="date"
						variants={contentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						className="con-main"
					>
						<h1>Коли тобі було б зручно зустрітись?</h1>
						<div className="date-selection">
							<DatePicker
								selected={meetingDate}
								onChange={(date: Date | null) => setMeetingDate(date)}
								showTimeSelect
								timeFormat="HH:mm"
								timeIntervals={15}
								timeCaption="Час"
								dateFormat="dd.MM.yyyy HH:mm"
								inline
								minDate={new Date()}
							/>
							{meetingDate && (
								<button
									className="yes-button confirm-button"
									onClick={() => {
										setDateConfirmed(true);
										playSound('./sounds/happy.mp3');
									}}
								>
									Далі
								</button>
							)}
						</div>
					</motion.div>
				)}

				{/* 1. Головний екран запрошення */}
				{!accepted && (
					<motion.div
						key="invite"
						variants={contentVariants}
						initial="initial"
						animate="animate"
						exit="exit"
						className="con-main"
					>
						<h1>Чи хотіла б ти зі мною прогулятись?</h1>
						<div className="buttons">
							<button
								className="yes-button"
								style={{ fontSize: `${yesButtonSize}px` }}
								onClick={handleYesClick}
							>
								Так
							</button>
							<button
								className="no-button"
								onClick={handleNoClick}
							>
								{getNoButtonText()}
							</button>
						</div>
					</motion.div>
				)}

			</AnimatePresence>
		</div>
	);
}

export default App;
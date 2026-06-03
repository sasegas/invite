import { useState } from 'react';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

function App() {
	const [noCount, setNoCount] = useState(0);
	const [accepted, setAccepted] = useState(false);

	// Нові стани для вибору активності
	const [activity, setActivity] = useState('');
	const [activityConfirmed, setActivityConfirmed] = useState(false);

	const yesButtonSize = noCount * 20 + 16;


	const handleNoClick = () => {
		setNoCount(noCount + 1);
		sendNotificationNo('no');
	};
	const handleYesClick = () => () => {
		setAccepted(true);
		sendNotificationNo('yes');
	}
	const getNoButtonText = () => {
		return noPhrases[Math.min(noCount, noPhrases.length - 1)];
	};

	const [meetingDate, setMeetingDate] = useState<Date | null>(null);
	const [dateConfirmed, setDateConfirmed] = useState(false);

	const formatDateTime = (date: Date | null) => {
		if (!date) return '';
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');

		return `${day}.${month}.${year} о ${hours}:${minutes}`;
	};

	// --- ФУНКЦІЯ ВІДПРАВКИ В TELEGRAM ---
	const sendNotification = async () => {
		const token = import.meta.env.VITE_TG_BOT_TOKEN;
		const chatId = import.meta.env.VITE_TG_CHAT_ID;

		if (!token || !chatId) {
			console.error("Немає ключів Telegram у файлі .env");
			return;
		}

		const message = `🎉 Вона сказала ТАК!\n\n📅 Дата та час: ${formatDateTime(meetingDate)}\n🎯 Що будемо робити: ${activity}`;
		const url = `https://api.telegram.org/bot${token}/sendMessage`;

		try {
			await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chat_id: chatId,
					text: message,
				}),
			});
		} catch (error) {
			console.error("Помилка відправки в Telegram", error);
		}
	};
	const sendNotificationNo = async (type: string) => {
		const token = import.meta.env.VITE_TG_BOT_TOKEN;
		const chatId = import.meta.env.VITE_TG_CHAT_ID;
		const currentNoText = noPhrases[Math.min(noCount + 1, noPhrases.length - 1)];
		const message = type === 'no' ? `Вона натснула ні ${noCount + 1} разів. Поточний текст кнопки: "${currentNoText}"` : `Вона натснула так!`;
		const url = `https://api.telegram.org/bot${token}/sendMessage`;
		if (!token || !chatId) {
			console.error("Немає ключів Telegram у файлі .env");
			return;
		}
		try {
			await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					chat_id: chatId,
					text: message,
				}),
			});
		} catch (error) {
			console.error("Помилка відправки в Telegram", error);
		}

	};

	const handleFinalConfirm = () => {
		setActivityConfirmed(true);
		sendNotification(); // Відправляємо повідомлення боту
	};
	// 4. Фінальний екран (після вибору активності)
	if (activityConfirmed) {
		return (
			<div className="container">
				<div className="con-main">
					<h1>Ура! До зустрічі {formatDateTime(meetingDate)}!</h1>
					<p style={{ color: 'white', fontSize: '1.2rem', marginTop: '10px' }}>
						План: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{activity}</span>
					</p>
				</div>
			</div>
		);
	}
	// 3. Екран вибору активності (після вибору дати)
	if (dateConfirmed) {
		return (
			<div className="container">
				<div className="con-main">
					<h1>Що ти хотіла б робити?</h1>
					<div className="activities-container">
						{activitiesList.map((act, index) => (
							<button
								key={index}
								className={`activity-button ${activity === act ? 'selected' : ''}`}
								onClick={() => setActivity(act)}
							>
								{act}
							</button>
						))}
					</div>
					{activity && (
						<button
							className="yes-button confirm-button"
							onClick={handleFinalConfirm}
							style={{ marginTop: '20px' }}
						>
							Підтвердити
						</button>
					)}
				</div>
			</div>
		);
	}

	// 2. Екран вибору дати та часу (після натискання "Так")
	if (accepted) {
		return (
			<div className="container">
				<div className="con-main">
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
							inline // Робить календар завжди відкритим
							minDate={new Date()} // Заборона минулих дат
						/>
						{meetingDate && (
							<button
								className="yes-button confirm-button"
								onClick={() => setDateConfirmed(true)}
							>
								Далі
							</button>
						)}
					</div>
				</div>
			</div>
		);
	}
	// 1. Головний екран запрошення
	return (
		<div className="container">
			<div className="con-main">
				<h1>Чи хотіла б ти зі мною прогулятись?</h1>
				<div className="buttons">
					<button
						className="yes-button"
						style={{ fontSize: `${yesButtonSize}px` }}
						onClick={handleYesClick()}
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
			</div>
		</div>
	);
}

export default App;
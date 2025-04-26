import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { questionsDota } from './questionsDota';
import catImage from './assets/cute-cat.jpg';
import errorSound from './assets/error.mp3';
import successSound from './assets/success.mp3';

function App() {
  const [score, setScore] = useState(0);
  const scoreRef = useRef(score); // Храним актуальный score
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [questionIndices, setQuestionIndices] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [nameError, setNameError] = useState('');

  const saveResultToGoogleSheets = useCallback(async (currentScore) => {
    const dateTime = new Date().toISOString();
    console.log('Отправка результата:', { name: userName, score: currentScore, dateTime });
    try {
      const response = await fetch('/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, score: currentScore, dateTime }),
      });
      const result = await response.json();
      console.log('Ответ сервера:', result);
      if (!result.success) {
        console.error('Ошибка сохранения результата:', result.error);
        setErrorMessage('Не удалось сохранить результат, милашка! 🐾');
      }
    } catch (error) {
      console.error('Ошибка отправки результата:', error);
      setErrorMessage('Ошибка связи с сервером, милашка! 🐾');
    }
  }, [userName, setErrorMessage]);

  useEffect(() => {
    console.log('useEffect: gameStarted=', gameStarted, 'gameOver=', gameOver, 'score=', score);
    if (gameStarted && !gameOver) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            console.log('Таймер истёк, завершаем квиз, score=', scoreRef.current);
            setGameOver(true);
            saveResultToGoogleSheets(scoreRef.current); // Используем scoreRef
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const heartInterval = setInterval(() => {
        const newHeart = {
          id: Math.random(),
          left: Math.random() * window.innerWidth,
          top: Math.random() * window.innerHeight,
        };
        setHearts((prev) => [...prev, newHeart].slice(-10));
      }, 2000);

      return () => {
        clearInterval(timer);
        clearInterval(heartInterval);
      };
    }
  }, [gameStarted, gameOver, saveResultToGoogleSheets]);

  useEffect(() => {
    scoreRef.current = score; // Обновляем scoreRef при изменении score
  }, [score]);

  const startGame = () => {
    if (!userName.trim()) {
      setNameError('Введи своё прекрасное имя, милашка! 😻');
      return;
    }
    setNameError('');
    const indices = [...Array(questionsDota.length).keys()];
    console.log('questionsDota.length:', questionsDota.length);
    console.log('questionIndices:', indices);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setQuestionIndices(indices);
    setScore(0);
    setGameStarted(true);
  };

  const handleAnswer = () => {
    console.log('handleAnswer вызван, вопрос:', currentQuestionIndex + 1, 'score=', score);
    console.log('questionsDota.length:', questionsDota.length);
    console.log('questionIndices:', questionIndices);
    const correctAnswers = questionsDota[questionIndices[currentQuestionIndex]].correct;
    const normalizedUserAnswer = userAnswer.toLowerCase().replace(/\s+/g, '');
    let newScore = score;
    if (correctAnswers.some(answer => answer.toLowerCase().replace(/\s+/g, '') === normalizedUserAnswer)) {
      console.log('Правильный ответ, увеличиваем score:', score + 1);
      newScore = score + 1;
      setScore(newScore);
      setErrorMessage('');
      try {
        const successAudio = new Audio(successSound);
        successAudio.play().catch((error) => {
          console.log('Ошибка воспроизведения звука успеха:', error);
        });
      } catch (error) {
        console.log('Ошибка загрузки звука успеха:', error);
      }
    } else {
      console.log('Неправильный ответ');
      setErrorMessage('Попробуй ещё, милашка! 🐾');
      try {
        const errorAudio = new Audio(errorSound);
        errorAudio.play().catch((error) => {
          console.log('Ошибка воспроизведения звука ошибки:', error);
        });
      } catch (error) {
        console.log('Ошибка загрузки звука ошибки:', error);
      }
    }
    setUserAnswer('');
    if (currentQuestionIndex + 1 < questionsDota.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      console.log('Переход к следующему вопросу:', currentQuestionIndex + 2);
    } else {
      console.log('Квиз завершён, вызов saveResultToGoogleSheets, score=', newScore);
      setGameOver(true);
      saveResultToGoogleSheets(newScore);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleAnswer();
    }
  };

  const handleNameKeyPress = (event) => {
    if (event.key === 'Enter') {
      startGame();
    }
  };

  const restartGame = () => {
    const indices = [...Array(questionsDota.length).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setQuestionIndices(indices);
    setScore(0);
    setCurrentQuestionIndex(0);
    setTimeLeft(60);
    setGameOver(false);
    setGameStarted(true);
    setUserAnswer('');
    setErrorMessage('');
  };

  return (
    <div className="quiz-container">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="heart"
          style={{ left: heart.left, top: heart.top }}
        >
          💖
        </div>
      ))}
      <h1 className="title">Bloodstone</h1>
      {!gameStarted ? (
        <div>
          <img src={catImage} alt="Милый котик" className="cat-image" />
          <p className="welcome-text">Добро пожаловать в няшный квиз! 🐾</p>
          <p className="welcome-text">Готова проверить, насколько ты кавайная? 😻</p>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyPress={handleNameKeyPress}
            className="answer-input"
            placeholder="Введи своё прекрасное имя! :3"
          />
          {nameError && <p className="error-message">{nameError}</p>}
          <button onClick={startGame} className="start-button">
            Начать игру! :3
          </button>
        </div>
      ) : gameOver ? (
        <div>
          <h2 className="result-text">Квиз пройден, {userName}! Моя няшечка!!! 🎉</h2>
          <p className="result-text">Твой счёт: {score}</p>
          <p className="result-text">
            {score >= 10
              ? "Ты мега-няшка и ультра-умняшка, столько правильных ответов! 😻"
              : score >= 5
              ? "Какая ты умничка, отличный результат! 💖"
              : "Милашка, не расстраивайся, давай попробуем ещё раз! 🐾"}
          </p>
          <button onClick={restartGame} className="restart-button">
            Сыграть снова
          </button>
        </div>
      ) : (
        <div>
          <p className="score">Счёт: {score}</p>
          <div className="timer-container">
            <p className="time">Время: {timeLeft} сек</p>
            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              ></div>
            </div>
          </div>
          <h2 className="question">{questionsDota[questionIndices[currentQuestionIndex]].question}</h2>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyPress={handleKeyPress}
            className="answer-input"
            placeholder="Введи ответ, милашка! :3"
          />
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          <button onClick={handleAnswer} className="submit-button">
            Отправить
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
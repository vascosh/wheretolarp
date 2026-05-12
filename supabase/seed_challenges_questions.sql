-- Replace all quiz questions with better ones
-- Run this after schema_challenges.sql

DELETE FROM challenges WHERE category = 'quiz' AND frequency = 'daily';

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order) VALUES

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'Which car model is famous for its built-in sauce holder for dipping chicken nuggets?',
'["Rolls-Royce Cullinan","Mercedes-Maybach GLS 600","Bentley Bentayga","Range Rover SV"]',
'Mercedes-Maybach GLS 600', 0),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'How many Cipriani restaurants exist worldwide?',
'["6","12","24","48"]',
'12', 1),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'How many Chrome Hearts flagship stores are there globally?',
'["8","16","24","42"]',
'24', 2),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'Harry''s Bar in Venice invented which cocktail?',
'["Negroni","Bellini","Aperol Spritz","Rossini"]',
'Bellini', 3),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'What is Ralph Lauren''s real birth name?',
'["Ralph Lipman","Ralph Lifshitz","Ralph Loren","Ralph Goldman"]',
'Ralph Lifshitz', 4),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'What year was Hermès founded?',
'["1821","1837","1854","1902"]',
'1837', 5),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'The Negroni cocktail was supposedly invented in which city?',
'["Rome","Venice","Florence","Milan"]',
'Florence', 6),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'What is Nobu''s full name?',
'["Nobu Matsuri","Nobuyuki Matsuhisa","Nobu Yamamoto","Nobu Tanaka"]',
'Nobuyuki Matsuhisa', 7),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'On which street is Claridge''s hotel in London located?',
'["Brook Street","Berkeley Square","Bond Street","Grosvenor Square"]',
'Brook Street', 8),

('Daily LARP Quiz', 'Answer today''s trivia question.', 'daily', 'quiz', 25, 1,
'What is the most iconic LARP anthem?',
'["Queen St by twentythree","Rich Girl by Gwen Stefani","Empire State of Mind","Money by Pink Floyd"]',
'Queen St by twentythree', 9);

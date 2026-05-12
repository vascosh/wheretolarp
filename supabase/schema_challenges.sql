-- ============================================================
-- Challenges / Battle-Pass schema
-- ============================================================

-- challenges: defines all challenges (seeded, not user-created)
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  category text NOT NULL CHECK (category IN ('social', 'quiz', 'activity')),
  points integer NOT NULL,
  target_count integer NOT NULL DEFAULT 1,
  quiz_question text,
  quiz_options jsonb,   -- array of strings for multiple choice
  quiz_answer text,     -- correct answer
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- user progress per challenge per period
CREATE TABLE IF NOT EXISTS user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  period_key text NOT NULL,  -- e.g. "2026-05-05" for daily, "2026-W18" for weekly, "2026-05" for monthly
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_ucp_user_period ON user_challenge_progress(user_id, period_key);

-- ============================================================
-- SEED DATA
-- ============================================================

-- ---- Daily challenges ----

-- 1. Daily LARP Quiz (sort_order = 0, the "main" daily quiz)
INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'What is the most iconic LARP anthem?',
  '["Queen St by twentythree","Rich Girl by Gwen Stefani","Empire State of Mind","Money by Pink Floyd"]',
  'Queen St by twentythree',
  0
);

-- Extra daily quiz challenges (sort_order 1-9)
INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'Which neighborhood is considered the most aspirational in London?',
  '["Mayfair","Shoreditch","Brixton","Camden"]',
  'Mayfair',
  1
);

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'What designer defines the old money aesthetic?',
  '["Ralph Lauren","Balenciaga","Off-White","Supreme"]',
  'Ralph Lauren',
  2
);

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'The Plaza Hotel sits on which famous NYC landmark?',
  '["Central Park","Times Square","Grand Army Plaza","Bryant Park"]',
  'Grand Army Plaza',
  3
);

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'Which hotel bar is considered London''s most legendary?',
  '["The American Bar at The Savoy","The Connaught Bar","Dukes Bar","The Ritz"]',
  'The Connaught Bar',
  4
);

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'What does LARP stand for in the traditional sense?',
  '["Live Action Role Play","Lifestyle And Rich People","Live Aspirational Role Performance","Luxury Aesthetic Recreation Plan"]',
  'Live Action Role Play',
  5
);

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'Claridge''s hotel is located in which London neighbourhood?',
  '["Mayfair","Knightsbridge","Chelsea","Belgravia"]',
  'Mayfair',
  6
);

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'Which NYC institution is known for its famous chicken?',
  '["Cipriani","Balthazar","Pastis","The Grill"]',
  'Cipriani',
  7
);

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'Scott''s restaurant in London is famous for which dish?',
  '["Oysters and Champagne","Fish & Chips","Beef Wellington","Lobster Bisque"]',
  'Oysters and Champagne',
  8
);

INSERT INTO challenges (title, description, frequency, category, points, target_count, quiz_question, quiz_options, quiz_answer, sort_order)
VALUES (
  'Daily LARP Quiz',
  'Answer today''s trivia question.',
  'daily', 'quiz', 25, 1,
  'Which borough is DUMBO located in?',
  '["Brooklyn","Manhattan","Queens","The Bronx"]',
  'Brooklyn',
  9
);

-- 2. First Move
INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('First Move', 'Send a friend request today.', 'daily', 'social', 10, 1, 10);

-- 3. Plan Something
INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Plan Something', 'Create a LARP plan today.', 'daily', 'activity', 15, 1, 11);

-- 4. Scout the Board
INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Scout the Board', 'Visit the leaderboard today.', 'daily', 'activity', 5, 1, 12);


-- ---- Weekly challenges ----

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Social Butterfly', 'Send 3 friend requests this week.', 'weekly', 'social', 40, 3, 0);

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Five-Plan Week', 'Make 5 plans this week.', 'weekly', 'activity', 60, 5, 1);

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Spot Hunter', 'Submit a spot for review.', 'weekly', 'activity', 50, 1, 2);

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Quiz Run', 'Answer 5 quiz questions correctly this week.', 'weekly', 'quiz', 75, 5, 3);

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Neighborhood Explorer', 'Plan visits to 3 different neighborhoods this week.', 'weekly', 'activity', 55, 3, 4);


-- ---- Monthly challenges ----

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Social Season', 'Send 15 friend requests this month.', 'monthly', 'social', 150, 15, 0);

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('LARP Legend', 'Make 20 plans this month.', 'monthly', 'activity', 200, 20, 1);

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Curator', 'Submit 3 spots for review.', 'monthly', 'activity', 175, 3, 2);

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Quiz Master', 'Answer 20 quiz questions correctly this month.', 'monthly', 'quiz', 250, 20, 3);

INSERT INTO challenges (title, description, frequency, category, points, target_count, sort_order)
VALUES ('Rising Star', 'Gain 5 followers this month.', 'monthly', 'social', 120, 5, 4);

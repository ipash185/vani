import { endOfDay, isBefore } from "date-fns";
import { CORE_WORDS } from "../data/phonemes";

const CHALLENGE_KEY = "dailyChallenge";

// Helper to get all phonemes from CORE_WORDS
const getAllPhonemes = () => {
  return ["h", "l", "eh", "p"];
};

const generateNewChallenge = () => {
  const challengeTypes = ["phoneme", "word"];
  const type =
    challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

  let target;
  let link;
  let description;
  let targetId;

  if (type === "phoneme") {
    const allPhonemes = getAllPhonemes();
    target = allPhonemes[Math.floor(Math.random() * allPhonemes.length)];
    description = `Practice the phoneme /${target}/ 5 times today to earn bonus points!`;
    link = `/phoneme/${target}`;
    targetId = target;
  } else {
    // word
    const word = CORE_WORDS[Math.floor(Math.random() * CORE_WORDS.length)];
    target = word.word;
    description = `Practice the word "${target}" 3 times today to earn bonus points!`;
    link = `/word/${word.id}`;
    targetId = word.id;
  }

  const newChallenge = {
    id: new Date().toISOString(),
    type,
    target,
    targetId,
    description,
    link,
    requiredCount: type === "phoneme" ? 5 : 3,
    currentCount: 0,
    isCompleted: false,
    expiresAt: endOfDay(new Date()).toISOString(),
    bonusPoints: 50,
  };

  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(newChallenge));
  return newChallenge;
};

const getDailyChallenge = () => {
  const storedChallenge = localStorage.getItem(CHALLENGE_KEY);
  if (!storedChallenge) {
    return generateNewChallenge();
  }

  const challenge = JSON.parse(storedChallenge);

  if (isBefore(new Date(challenge.expiresAt), new Date())) {
    return generateNewChallenge();
  }

  // Validate that the stored challenge is still valid
  if (challenge.type === "phoneme") {
    const allowedPhonemes = getAllPhonemes();
    if (!allowedPhonemes.includes(challenge.target)) {
      return generateNewChallenge();
    }
  }

  return challenge;
};
const updateDailyChallengeProgress = (type, targetId) => {
  const challenge = getDailyChallenge();
  if (
    challenge.isCompleted ||
    challenge.type !== type ||
    (challenge.target !== targetId && challenge.targetId !== targetId)
  ) {
    return challenge;
  }

  challenge.currentCount += 1;

  if (challenge.currentCount >= challenge.requiredCount) {
    challenge.isCompleted = true;
    // Here you might want to add points to the user's total score
    // This part is left for the main progress service to handle
  }

  localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
  return challenge;
};

const dailyChallengeService = {
  getDailyChallenge,
  updateDailyChallengeProgress,
};

export default dailyChallengeService;

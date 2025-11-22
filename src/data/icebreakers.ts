export const icebreakers = [
  "What's your favorite way to spend a weekend?",
  "If you could travel anywhere right now, where would you go?",
  "What's the best concert or live event you've ever been to?",
  "Coffee or tea? ☕",
  "What's a skill you'd love to learn?",
  "Beach vacation or mountain getaway?",
  "What's your go-to comfort food?",
  "Early bird or night owl? 🦉",
  "What's the last show you binge-watched?",
  "Dogs or cats? 🐕🐈",
  "What's your hidden talent?",
  "If you could have dinner with anyone, dead or alive, who would it be?",
  "What's your favorite season and why?",
  "What's the most adventurous thing you've ever done?",
  "Indoor person or outdoor enthusiast?",
  "What's your favorite type of cuisine?",
  "Books or movies? 📚🎬",
  "What's something that always makes you laugh?",
  "What's your dream job?",
  "Morning person or night person?",
  "What's the best advice you've ever received?",
  "Spontaneous plans or carefully scheduled?",
  "What's your favorite thing about your hometown?",
  "If you could master any instrument, which would it be?",
  "What's your guilty pleasure?",
  "City life or countryside living?",
  "What's the most interesting place you've visited?",
  "Are you more of an introvert or extrovert?",
  "What's your favorite way to stay active?",
  "Sweet or savory? 🍰🍕",
];

export const getRandomIcebreaker = (): string => {
  return icebreakers[Math.floor(Math.random() * icebreakers.length)];
};

export const getRandomIcebreakers = (count: number): string[] => {
  const shuffled = [...icebreakers].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

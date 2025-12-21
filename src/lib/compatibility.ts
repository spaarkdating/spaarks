interface Profile {
  interests?: string[];
  gender?: string;
  looking_for?: string;
  location?: string;
  date_of_birth?: string;
}

export const calculateCompatibilityScore = (
  userProfile: Profile,
  otherProfile: Profile
): number => {
  let score = 0;
  let maxScore = 0;

  // Interest compatibility (40% weight)
  if (userProfile.interests && otherProfile.interests) {
    const userInterests = new Set(userProfile.interests);
    const otherInterests = new Set(otherProfile.interests);
    const commonInterests = [...userInterests].filter(x => otherInterests.has(x));
    
    const interestScore = commonInterests.length / Math.max(userInterests.size, otherInterests.size);
    score += interestScore * 40;
    maxScore += 40;
  }

  // Gender preference compatibility (30% weight)
  if (userProfile.looking_for && otherProfile.gender) {
    // Normalize gender values for comparison
    let lookingFor = userProfile.looking_for.toLowerCase();
    let otherGender = otherProfile.gender.toLowerCase();
    
    // Map variations to standard values
    if (lookingFor === 'men' || lookingFor === 'male') lookingFor = 'man';
    if (lookingFor === 'women' || lookingFor === 'female') lookingFor = 'woman';
    if (otherGender === 'men' || otherGender === 'male') otherGender = 'man';
    if (otherGender === 'women' || otherGender === 'female') otherGender = 'woman';
    
    if (
      lookingFor === "everyone" ||
      lookingFor === otherGender
    ) {
      score += 30;
    }
    maxScore += 30;
  }

  // Location proximity (20% weight)
  if (userProfile.location && otherProfile.location) {
    const sameLocation = userProfile.location.toLowerCase() === otherProfile.location.toLowerCase();
    if (sameLocation) {
      score += 20;
    } else {
      score += 10; // Partial points for having a location
    }
    maxScore += 20;
  }

  // Age compatibility (10% weight)
  if (userProfile.date_of_birth && otherProfile.date_of_birth) {
    const userAge = calculateAge(userProfile.date_of_birth);
    const otherAge = calculateAge(otherProfile.date_of_birth);
    const ageDiff = Math.abs(userAge - otherAge);
    
    if (ageDiff <= 5) {
      score += 10;
    } else if (ageDiff <= 10) {
      score += 5;
    }
    maxScore += 10;
  }

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 50;
};

const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getCompatibilityLabel = (score: number): string => {
  if (score >= 90) return "Perfect Match!";
  if (score >= 80) return "Excellent Match";
  if (score >= 70) return "Great Match";
  if (score >= 60) return "Good Match";
  if (score >= 50) return "Fair Match";
  return "Low Match";
};

export const getCompatibilityColor = (score: number): string => {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-accent";
  if (score >= 50) return "text-secondary";
  return "text-muted-foreground";
};

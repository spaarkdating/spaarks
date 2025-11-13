import { Sparkles, Heart, MessageCircle, Users } from "lucide-react";

interface WelcomeStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="space-y-6 text-center animate-fade-in">
      <div className="flex justify-center">
        <div className="relative">
          <Heart className="h-24 w-24 text-primary fill-primary animate-pulse" />
          <Sparkles className="h-8 w-8 text-secondary absolute -top-2 -right-2 animate-bounce" />
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome to Spaark!</h2>
        <p className="text-muted-foreground text-lg">
          Let's set up your profile to find your perfect match
        </p>
      </div>

      <div className="grid gap-4 text-left max-w-md mx-auto pt-4">
        <div className="flex gap-3 items-start">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Find Your Match</h3>
            <p className="text-sm text-muted-foreground">
              Swipe through profiles and connect with people you like
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <div className="bg-secondary/10 p-2 rounded-lg">
            <MessageCircle className="h-5 w-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">Start Conversations</h3>
            <p className="text-sm text-muted-foreground">
              Chat with your matches and get to know each other
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <div className="bg-accent/10 p-2 rounded-lg">
            <Users className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">Build Connections</h3>
            <p className="text-sm text-muted-foreground">
              Create meaningful relationships with like-minded people
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

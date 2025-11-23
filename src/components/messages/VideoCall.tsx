import { useEffect, useRef, useState } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2 } from "lucide-react";

interface VideoCallProps {
  roomUrl: string;
  onClose: () => void;
}

export const VideoCall = ({ roomUrl, onClose }: VideoCallProps) => {
  const callFrameRef = useRef<DailyCall | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callState, setCallState] = useState<string>("loading");

  useEffect(() => {
    if (!containerRef.current) return;

    console.log("Initializing video call:", roomUrl);

    const callFrame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      showFullscreenButton: true,
      iframeStyle: {
        width: "100%",
        height: "100%",
        border: "0",
        borderRadius: "12px",
      },
    });

    callFrameRef.current = callFrame;

    callFrame
      .on("loaded", () => {
        console.log("Daily iframe loaded");
        setCallState("loaded");
      })
      .on("joined-meeting", () => {
        console.log("Joined video call");
        setCallState("joined");
      })
      .on("left-meeting", () => {
        console.log("Left video call");
        setCallState("left");
        onClose();
      })
      .on("error", (error) => {
        console.error("Video call error:", error);
        setCallState("error");
      });

    callFrame.join({ url: roomUrl });

    return () => {
      if (callFrame) {
        callFrame.destroy();
      }
    };
  }, [roomUrl, onClose]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLeave = () => {
    callFrameRef.current?.leave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-6xl h-[80vh] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-background/80 to-transparent flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-online animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {callState === "joined" ? "In Call" : "Connecting..."}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="bg-background/50 hover:bg-background/80 backdrop-blur-sm"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLeave}
              className="bg-background/50 hover:bg-destructive/80 backdrop-blur-sm"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Video Container */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Loading State */}
        {callState === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Connecting to video call...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {callState === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-sm text-destructive mb-4">Failed to connect to video call</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

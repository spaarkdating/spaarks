import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoStepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
}

export const PhotoStep = ({ data, updateData }: PhotoStepProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const photos = data.photos || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > 6) {
      toast({
        title: "Too many photos",
        description: "You can upload up to 6 photos",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("profile-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-photos").getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      updateData({ photos: [...photos, ...uploadedUrls] });

      toast({
        title: "Photos uploaded!",
        description: `${uploadedUrls.length} photo(s) added to your profile`,
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_: string, i: number) => i !== index);
    updateData({ photos: newPhotos });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <ImageIcon className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Add your best photos</h3>
        <p className="text-muted-foreground">Upload at least one photo. You can add up to 6 photos.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo: string, index: number) => (
          <div key={index} className="relative aspect-square group">
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border-2 border-border"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removePhoto(index)}
            >
              <X className="h-3 w-3" />
            </Button>
            {index === 0 && (
              <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                Primary
              </div>
            )}
          </div>
        ))}

        {photos.length < 6 && (
          <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground text-center px-2">
              {uploading ? "Uploading..." : "Add Photo"}
            </span>
          </label>
        )}
      </div>

      {photos.length === 0 && (
        <p className="text-sm text-center text-muted-foreground">Add at least two photo to continue</p>
      )}
    </div>
  );
};

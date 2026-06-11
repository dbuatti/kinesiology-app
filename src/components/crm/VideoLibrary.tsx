
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, ExternalLink, PlayCircle, User, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CURATED_VIDEOS = [
  {
    title: "My Study Videos",
    description: "Personal collection of kinesiology study materials and technique reviews.",
    url: "https://kin-videos.vercel.app/",
    type: "Study Portal",
    author: "Daniele",
    tags: ["Study", "Reference", "Techniques"],
    isPrimary: true
  },
  {
    title: "Nick Moss - Kinesiology Resources",
    description: "Curated kinesiology techniques, demonstrations, and clinical insights by Nick Moss.",
    url: "https://www.youtube.com/playlist?list=PL8gqJUYXI3EBvIhQ1fDVwtx8BnjlYu9K2_",
    type: "Playlist",
    author: "Nick Moss",
    tags: ["Techniques", "Clinical", "Demonstration"]
  }
];

const VideoLibrary = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {CURATED_VIDEOS.map((video) => (
          <Card key={video.url} className={cn(
            "border border-border shadow-sm rounded-xl bg-card hover:shadow-md transition-all group overflow-hidden",
            video.isPrimary && "ring-1 ring-primary/20"
          )}>
            <CardHeader className="p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    video.isPrimary ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {video.isPrimary ? <GraduationCap size={20} /> : <Youtube size={20} />}
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">{video.title}</CardTitle>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      <User size={10} />
                      <span>{video.isPrimary ? "Your Collection" : video.author}</span>
                      <span className="opacity-40">·</span>
                      <Badge className="text-[8px] font-semibold bg-muted text-muted-foreground border-none px-1.5 py-0 rounded">
                        {video.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">{video.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {video.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground border-none text-[9px] font-medium px-2 py-0.5 rounded-md">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Button 
                asChild
                size="sm"
                className={cn(
                  "w-full h-9 rounded-lg font-medium text-[10px] uppercase tracking-wider",
                  video.isPrimary ? "bg-primary hover:bg-primary/90" : "bg-foreground hover:bg-foreground/90"
                )}
              >
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  <PlayCircle size={14} className="mr-1.5" />
                  Open
                  <ExternalLink size={10} className="ml-1.5 opacity-50" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}

        <Card className="border-2 border-dashed border-border shadow-none rounded-xl bg-muted/30 flex flex-col items-center justify-center p-8 text-center hover:border-primary/30 hover:bg-primary/5 transition-all duration-500">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <Sparkles size={20} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Add More Resources</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1 max-w-[200px]">
            Keep track of other playlists or educational videos here.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default VideoLibrary;

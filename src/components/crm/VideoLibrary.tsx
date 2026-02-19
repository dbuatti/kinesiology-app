"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Youtube, ExternalLink, PlayCircle, Clock, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CURATED_VIDEOS = [
  {
    title: "Nick Moss - Kinesiology Resources",
    description: "A curated collection of kinesiology techniques, demonstrations, and clinical insights shared by Nick Moss.",
    url: "https://www.youtube.com/playlist?list=PL8gqJUYXI3EBvIhQ1fDVwtx8BnjlYu9K2_",
    type: "Playlist",
    author: "Nick Moss",
    tags: ["Techniques", "Clinical", "Demonstration"]
  }
];

const VideoLibrary = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CURATED_VIDEOS.map((video) => (
          <Card key={video.url} className="border-none shadow-lg rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
            <div className="aspect-video bg-slate-900 relative flex items-center justify-center group-hover:bg-slate-800 transition-colors">
              <Youtube size={64} className="text-rose-600 opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-500" />
              <div className="absolute top-4 right-4">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-none font-black text-[10px] uppercase tracking-widest">
                  {video.type}
                </Badge>
              </div>
            </div>
            <CardHeader className="p-8 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {video.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                    <User size={14} className="text-indigo-400" />
                    <span>Shared by {video.author}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <p className="text-slate-600 leading-relaxed font-medium">
                {video.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {video.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-slate-100 text-slate-600 border-none text-[10px] font-bold px-3 py-1 rounded-lg">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="pt-4">
                <Button 
                  asChild
                  className="w-full bg-slate-900 hover:bg-indigo-600 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all duration-500"
                >
                  <a href={video.url} target="_blank" rel="noopener noreferrer">
                    <PlayCircle size={18} className="mr-2" />
                    Open on YouTube
                    <ExternalLink size={14} className="ml-2 opacity-50" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Placeholder for adding more */}
        <Card className="border-2 border-dashed border-slate-200 shadow-none rounded-[2.5rem] bg-slate-50/50 flex flex-col items-center justify-center p-12 text-center group hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-500">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500 mb-4">
            <Sparkles size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-400 group-hover:text-indigo-900 transition-colors">Add More Resources</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-[200px]">Keep track of other playlists or educational videos here.</p>
        </Card>
      </div>
    </div>
  );
};

export default VideoLibrary;
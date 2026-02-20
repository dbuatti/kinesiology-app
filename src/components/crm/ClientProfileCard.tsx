"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { calculateAge, getStarSign } from "@/utils/crm-utils";
import { Client } from "@/types/crm";

interface ClientProfileCardProps {
  client: Client;
}

const ClientProfileCard = ({ client }: ClientProfileCardProps) => {
  return (
    <Card className="overflow-hidden border-none shadow-lg bg-white rounded-2xl">
      <div className="h-24 bg-gradient-to-r from-indigo-600 to-indigo-500 relative">
          <div className="absolute bottom-0 left-6 translate-y-1/2 p-1 bg-white rounded-full shadow-md">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600 border-2 border-indigo-100">
                {client.name.charAt(0)}
              </div>
          </div>
      </div>
      <CardContent className="pt-14 px-6 pb-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
          <p className="text-slate-500 font-medium">{client.pronouns || 'No pronouns set'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {client.born && (
            <>
              <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none px-3 py-1 rounded-full">
                {calculateAge(client.born)} years old
              </Badge>
              <Badge variant="outline" className="flex gap-1 items-center px-3 py-1 border-slate-200 rounded-full">
                <Star size={12} className="fill-amber-400 text-amber-400" />
                {getStarSign(client.born)}
              </Badge>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientProfileCard;
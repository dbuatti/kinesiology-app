
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
    <Card className="overflow-hidden border-none shadow-lg bg-card rounded-2xl">
      <div className="h-24 bg-gradient-to-r from-chart-primary to-chart-primary/70 relative">
          <div className="absolute bottom-0 left-6 translate-y-1/2 p-1 bg-card rounded-full shadow-md">
              <div className="w-20 h-20 bg-chart-primary/10 rounded-full flex items-center justify-center text-3xl font-bold text-chart-primary border-2 border-chart-primary/20">
                {client.name.charAt(0)}
              </div>
          </div>
      </div>
      <CardContent className="pt-14 px-6 pb-6 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{client.name}</h2>
          <p className="text-muted-foreground font-medium">{client.pronouns || 'No pronouns set'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {client.born && (
            <>
              <Badge className="bg-chart-primary/10 text-chart-primary hover:bg-chart-primary/20 border-none px-3 py-1 rounded-full">
                {calculateAge(client.born)} years old
              </Badge>
              <Badge variant="outline" className="flex gap-1 items-center px-3 py-1 border-border rounded-full">
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

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
    <Card className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      <div className="relative h-20 bg-[radial-gradient(120%_140%_at_0%_0%,hsl(var(--primary)/0.16),transparent_60%),radial-gradient(100%_120%_at_100%_0%,hsl(var(--chart-purple)/0.10),transparent_60%)]">
          <div className="absolute -bottom-8 left-6 rounded-full bg-card p-1 shadow-sm ring-1 ring-border/60">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-indigo-700 text-2xl font-semibold text-white">
                {client.name.charAt(0)}
              </div>
          </div>
      </div>
      <CardContent className="pt-12 px-6 pb-6 space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-[-0.02em] text-foreground">{client.name}</h2>
          <p className="text-sm text-muted-foreground">{client.pronouns || 'No pronouns set'}</p>
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
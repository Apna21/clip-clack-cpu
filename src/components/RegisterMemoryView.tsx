import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Register {
  name: string;
  value: string;
  decimal?: number;
  isHighlighted?: boolean;
}

interface MemoryCell {
  address: string;
  value: string;
  decimal?: number;
  isHighlighted?: boolean;
}

interface RegisterMemoryViewProps {
  registers: Register[];
  memory: MemoryCell[];
}

export const RegisterMemoryView = ({ registers, memory }: RegisterMemoryViewProps) => {
  return (
    <Card className="h-full flex flex-col shadow-lg">
      <Tabs defaultValue="registers" className="flex-1 flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registers">Registers</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="registers" className="flex-1 overflow-auto p-4 mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Register</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registers.map((reg, idx) => (
              <TableRow key={idx} className={reg.isHighlighted ? "bg-primary/10" : undefined}>
                <TableCell className="font-mono font-medium">{reg.name}</TableCell>
                <TableCell className="text-right font-mono">
                  <div className="text-foreground">{reg.value}</div>
                  {typeof reg.decimal === "number" && (
                    <div className="text-xs text-muted-foreground">{reg.decimal}</div>
                  )}
                </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="memory" className="flex-1 overflow-auto p-4 mt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memory.map((cell, idx) => (
              <TableRow key={idx} className={cell.isHighlighted ? "bg-success/10" : undefined}>
                <TableCell className="font-mono font-medium">{cell.address}</TableCell>
                <TableCell className="text-right font-mono">
                  <div className="text-foreground">{cell.value}</div>
                  {typeof cell.decimal === "number" && (
                    <div className="text-xs text-muted-foreground">{cell.decimal}</div>
                  )}
                </TableCell>
              </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

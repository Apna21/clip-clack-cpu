import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";

interface InstructionEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onLoadProgram: () => void;
}

export const InstructionEditor = ({ 
  code, 
  onCodeChange, 
  onLoadProgram 
}: InstructionEditorProps) => {
  return (
    <Card className="h-full flex flex-col shadow-lg">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-card-foreground">Instruction Editor</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Write MIPS-like assembly code
        </p>
      </div>
      
      <div className="flex-1 p-4">
        <Textarea
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="# Enter your instructions here&#10;ADD R1, R2, R3&#10;SUB R4, R1, R2&#10;LW R5, 0(R1)&#10;SW R5, 4(R1)&#10;BEQ R1, R2, LABEL"
          className="h-full font-mono text-sm resize-none"
        />
      </div>

      <div className="p-4 border-t">
        <Button 
          onClick={onLoadProgram}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Load Program
        </Button>
      </div>
    </Card>
  );
};

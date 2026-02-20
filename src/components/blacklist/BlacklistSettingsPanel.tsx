import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { getStoredThresholds, setStoredThresholds } from '@/hooks/useBlacklistRecommendations';

interface Props {
  onThresholdsChanged: () => void;
}

export default function BlacklistSettingsPanel({ onThresholdsChanged }: Props) {
  const stored = getStoredThresholds();
  const [minComplaints, setMinComplaints] = useState(stored.minComplaints);
  const [highAmount, setHighAmount] = useState(stored.highAmountThreshold);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    setStoredThresholds({ minComplaints, highAmountThreshold: highAmount });
    toast.success('Thresholds updated');
    onThresholdsChanged();
  };

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings2 className="h-4 w-4" />
          Recommendation Thresholds
          <span className="text-xs text-muted-foreground ml-auto">{open ? '▲' : '▼'}</span>
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Min. Complaints (different users)</label>
            <Input
              type="number"
              min={1}
              value={minComplaints}
              onChange={(e) => setMinComplaints(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">High Amount Threshold (BDT)</label>
            <Input
              type="number"
              min={1000}
              step={10000}
              value={highAmount}
              onChange={(e) => setHighAmount(Number(e.target.value))}
            />
          </div>
          <Button size="sm" onClick={handleSave} className="w-full">
            Save Thresholds
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

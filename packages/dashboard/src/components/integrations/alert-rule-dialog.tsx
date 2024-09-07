import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SimpleSelect } from "@/components/ui/select";

export function AlertRuleDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add alert rule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Alert rule</DialogTitle>
        </DialogHeader>
        <p className="text-sm mb-6">
          When a new
          <SimpleSelect
            className="inline-flex w-32 mx-2"
            placeholder="error"
            options={[
              { value: "error", label: "error" },
              { value: "invocation", label: "invocation" },
            ]}
          />
          occurs, notify
          <SimpleSelect
            className="inline-flex w-40 mx-2"
            placeholder="#errors"
            options={[
              { value: "#errors", label: "#errors" },
              { value: "#alerts", label: "#alerts" },
            ]}
          />
        </p>

        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Filter by function name
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Filter by tag
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Apply threshold
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Set maximum frequency
          </label>
        </div>

        <DialogFooter>
          <Button type="submit">Save alert rule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast";
import { authenticatedFetch, useData } from "@/lib/api";

export function DeleteUser({ id }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { mutate } = useData(`../users`);
  const { toast } = useToast();

  const submit = async (event) => {
    event.preventDefault();

    setLoading(true);
    try {
      await authenticatedFetch(`/users/${id}`, {
        method: "DELETE",
      });

      await mutate();
      setOpen(false);

      toast({ description: "User deleted" });
    } catch (error: any) {
      toast({
        title: "An error occurred",
        description: error.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex justify-end">
          <Button variant="outline" size="sm">
            <TrashIcon className="size-4 mr-2" />
            Remove
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this user? This action can't be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={loading}>
              Remove user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

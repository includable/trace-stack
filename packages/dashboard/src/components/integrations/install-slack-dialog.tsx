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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slack } from "lucide-react";

const json = {
  display_information: {
    name: "Trace Stack",
    description: "Alerts and notifications for your traced functions.",
    background_color: "#1e293b",
  },
  features: {
    bot_user: {
      display_name: "Tracer Template",
      always_online: false,
    },
  },
  oauth_config: {
    redirect_urls: [`https://${window.location.host}`],
    scopes: {
      bot: ["incoming-webhook", "channels:read"],
    },
  },
  settings: {
    org_deploy_enabled: false,
    socket_mode_enabled: false,
    token_rotation_enabled: false,
  },
};

const link = `https://api.slack.com/apps?new_app=1&manifest_json=${encodeURIComponent(JSON.stringify(json))}`;

export function InstallSlackDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Slack className="size-4 mr-2" />
          Add to Slack workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Slack</DialogTitle>
          <DialogDescription>
            Follow the steps to enable Slack notifications.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-4 py-4">
          <li className="flex gap-2">
            <span className="size-6 bg-muted-foreground text-background rounded-full flex items-center justify-center font-medium">
              1
            </span>
            <div className="flex-1">
              <p className="text-sm mb-3 leading-relaxed">
                <b className="font-semibold">
                  Create a Slack app in your workspace.
                </b>{" "}
                Click the link below to apply the default configuration
                parameters.
              </p>
              <Button asChild variant="outline" size="sm">
                <a href={link} target="_blank" rel="noopener noreferrer">
                  Create Slack app
                </a>
              </Button>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="size-6 bg-muted-foreground text-background rounded-full flex items-center justify-center font-medium">
              2
            </span>
            <div className="flex-1">
              <p className="text-sm leading-relaxed">
                <b className="font-semibold">Install to workspace.</b> Click
                'Install App' in the menu for your new app, and choose 'Install
                to workspace'.
              </p>
            </div>
          </li>
          <li className="flex gap-2">
            <span className="size-6 bg-muted-foreground text-background rounded-full flex items-center justify-center font-medium">
              2
            </span>
            <div className="flex-1">
              <p className="text-sm leading-relaxed mb-3">
                <b className="font-semibold">Enter your token.</b> Paste the
                shown 'Bot User OAuth Token' in the field below.
              </p>
              <Input placeholder="xoxb-000000000-000000000-abcdefgh" />
            </div>
          </li>
        </ul>
        <DialogFooter>
          <Button type="submit">Complete setup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

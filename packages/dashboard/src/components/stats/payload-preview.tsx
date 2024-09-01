import { useMemo, useState } from "react";
import { JSONTree } from "react-json-tree";

import { useTheme } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";
import { Clipboard, ClipboardCheck, Maximize2, Minimize2 } from "lucide-react";

const theme = {
  scheme: "monokai",
  base00: "transparent",
  base01: "#383830",
  base02: "#49483e",
  base03: "#75715e",
  base04: "#a59f85",
  base05: "#f8f8f2",
  base06: "#f5f4f1",
  base07: "#f9f8f5",
  base08: "#f92672",
  base09: "#fd971f",
  base0A: "#f4bf75",
  base0B: "#a6e22e",
  base0C: "#a1efe4",
  base0D: "#66d9ef",
  base0E: "#ae81ff",
  base0F: "#cc6633",
};

const expandRootNode = (keyPath, data, level) => level === 0;

const PayloadPreviewValue = ({ value }) => {
  const { value: themeValue } = useTheme();
  const [expandAll, setExpandAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(
      typeof value === "string" ? value : JSON.stringify(value, null, 2),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (typeof value === "string") {
    return (
      <div className="group relative">
        <div className="absolute top-3 right-3 gap-2 hidden group-hover:flex">
          <Button variant="outline" size="miniIcon" onClick={() => copy()}>
            {copied ? (
              <ClipboardCheck className="size-3" />
            ) : (
              <Clipboard className="size-3" />
            )}
          </Button>
        </div>
        <pre className="font-mono text-sm p-4 px-5">{value}</pre>
      </div>
    );
  }

  return (
    <div className="mt-4 mr-5 ml-3 pb-5 font-mono text-sm group relative">
      <div className="absolute -top-1 -right-2 gap-2 hidden group-hover:flex">
        <Button variant="outline" size="miniIcon" onClick={() => copy()}>
          {copied ? (
            <ClipboardCheck className="size-3" />
          ) : (
            <Clipboard className="size-3" />
          )}
        </Button>
        <Button
          variant="outline"
          size="miniIcon"
          onClick={() => setExpandAll(!expandAll)}
        >
          {expandAll ? (
            <Minimize2 className="size-3" />
          ) : (
            <Maximize2 className="size-3" />
          )}
        </Button>
      </div>
      <JSONTree
        data={value}
        theme={theme}
        hideRoot
        key={expandAll}
        invertTheme={themeValue === "light"}
        shouldExpandNodeInitially={expandAll ? Boolean : expandRootNode}
      />
    </div>
  );
};

const PayloadPreview = ({ title = "", value }) => {
  const truncated =
    typeof value === "string" && value?.includes("...[too long]");

  const displayValue = useMemo(() => {
    try {
      return JSON.parse(value.replace("...[too long]", ""));
    } catch (e) {
      return value;
    }
  }, [value]);

  if (
    displayValue === "" ||
    displayValue === null ||
    displayValue === undefined
  ) {
    return null;
  }

  return (
    <div>
      {title && (
        <h4 className="text-sm font-medium mb-3">
          {title}
          {truncated ? (
            <span className="text-muted-foreground"> (truncated)</span>
          ) : null}
        </h4>
      )}
      <div className="rounded-md border overflow-auto max-h-[30rem]">
        <PayloadPreviewValue value={displayValue} />
      </div>
    </div>
  );
};

export default PayloadPreview;

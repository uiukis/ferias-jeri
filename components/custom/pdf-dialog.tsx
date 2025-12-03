"use client";
import { AlertDialog } from "@/components/ui/alert-dialog";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  loading?: boolean;
  blobUrl?: string | null;
};

export default function PdfDialog({
  open,
  onOpenChange,
  loading = false,
  blobUrl,
}: Props) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v && blobUrl) {
          URL.revokeObjectURL(blobUrl);
        }
        onOpenChange(v);
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          onClick={() => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
            onOpenChange(false);
          }}
        />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 grid w-[95%] max-w-4xl -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-0 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95">
          <div className="flex items-center justify-center">
            {loading && (
              <div className="p-6 text-sm text-muted-foreground">
                Gerando...
              </div>
            )}
            {!loading && blobUrl && (
              <iframe src={blobUrl} className="h-[80vh] w-full rounded-md" />
            )}
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialog>
  );
}

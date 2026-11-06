import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { methodLabel, peso } from "@/lib/payments";

const BUSINESS = {
    name: "Your Restaurant Name",
    lines: ["123 Sample Street, City", "Tel. 0900 000 0000"],
    footer: "Thank you! Please come again.",
};

export interface ReceiptData {
    orderId: number;
    orderedAt?: string | null;
    waiter: string;
    items: { id: number | string; name: string; quantity: number; price?: number | null }[];
    total: number;
    amountPaid: number;
    method: Parameters<typeof methodLabel>[0];
    reference?: string | null;
    cashier: string;
    paidAt: string;
}

const dateTimeFmt = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={`flex justify-between gap-3 ${bold ? "font-semibold" : ""}`}>
            <span>{label}</span>
            <span className="text-right tabular-nums">{value}</span>
        </div>
    );
}

function Divider() {
    return <div className="my-2 border-t border-dashed border-neutral-400" />;
}

function ReceiptBody({ data }: { data: ReceiptData }) {
    const change = Math.max(0, data.amountPaid - data.total);

    return (
        <div className="w-full bg-white font-mono text-[12px] leading-5 text-black">
            <div className="text-center">
                <p className="text-sm font-bold">{BUSINESS.name}</p>
                {BUSINESS.lines.map((l) => (
                    <p key={l}>{l}</p>
                ))}
            </div>

            <Divider />

            <Row label="Paid" value={dateTimeFmt.format(new Date(data.paidAt))} />
            <Row label="Waiter" value={data.waiter} />
            <Row label="Cashier" value={data.cashier} />

            <Divider />

            {data.items.length > 0 ? (
                data.items.map((item) => (
                    <div key={item.id} className="flex gap-2">
                        <span className="shrink-0 tabular-nums">{item.quantity}×</span>
                        <span className="min-w-0 flex-1 wrap-break-word">{item.name}</span>
                        {item.price != null && (
                            <span className="shrink-0 tabular-nums">
                                {peso.format(item.price * item.quantity)}
                            </span>
                        )}
                    </div>
                ))
            ) : (
                <p className="text-center text-neutral-500">Item details unavailable</p>
            )}

            <Divider />

            <Row label="TOTAL" value={peso.format(data.total)} bold />
            <Row label={methodLabel(data.method)} value={peso.format(data.amountPaid)} />
            {change > 0 && <Row label="Change" value={peso.format(change)} />}
            {data.reference && <Row label="Ref." value={data.reference} />}

            <Divider />

            <p className="text-center">{BUSINESS.footer}</p>
        </div>
    );
}

export function ReceiptDialog({
    receipt,
    onClose,
}: {
    receipt: ReceiptData | null;
    onClose: () => void;
}) {
    return (
        <>
            <Dialog open={receipt !== null} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Receipt</DialogTitle>
                        <DialogDescription>
                            {receipt && receipt.items.length > 0
                                ? receipt.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")
                                : "Payment receipt"}
                        </DialogDescription>
                    </DialogHeader>

                    {receipt && (
                        <div className="rounded-md border bg-white p-4 shadow-inner">
                            <ReceiptBody data={receipt} />
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                        <Button onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {receipt &&
                createPortal(
                    <div id="receipt-root" className="hidden print:block">
                        <style>{`
                            @page { size: 80mm auto; margin: 4mm; }
                            @media print {
                                body > *:not(#receipt-root) { display: none !important; }
                                #receipt-root { width: 72mm; }
                            }
                        `}</style>
                        <ReceiptBody data={receipt} />
                    </div>,
                    document.body
                )}
        </>
    );
}
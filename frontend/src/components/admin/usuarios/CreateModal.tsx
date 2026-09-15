import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parseAmount, formatCurrency, type Invoice } from "./data-table-features";

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedId?: string;
  onCreate: (newInvoice: Invoice) => void;
}

export function CreateModal({
  isOpen,
  onClose,
  suggestedId = "INV008",
  onCreate,
}: CreateModalProps) {
  const [invoiceCode, setInvoiceCode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [totalAmount, setTotalAmount] = useState("");
  const [errors, setErrors] = useState<{ invoice?: string; totalAmount?: string }>({});

  useEffect(() => {
    if (isOpen) {
      setInvoiceCode(suggestedId);
      setPaymentStatus("Paid");
      setPaymentMethod("Credit Card");
      setTotalAmount("$100.00");
      setErrors({});
    }
  }, [isOpen, suggestedId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { invoice?: string; totalAmount?: string } = {};

    if (!invoiceCode.trim()) {
      newErrors.invoice = "El código de factura es obligatorio.";
    }

    const numAmount = parseAmount(totalAmount);
    if (!totalAmount.trim() || isNaN(numAmount) || numAmount < 0) {
      newErrors.totalAmount = "Ingresa un monto válido mayor o igual a 0.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formattedAmount = totalAmount.startsWith("$")
      ? totalAmount
      : formatCurrency(numAmount);

    onCreate({
      invoice: invoiceCode.trim(),
      paymentStatus,
      paymentMethod,
      totalAmount: formattedAmount,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-slate-900 font-bold">Nueva Factura</DialogTitle>
          <DialogDescription className="text-slate-500">
            Ingresa los datos para registrar una nueva factura en la tabla.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="create-invoice-code">Código de Factura</FieldLabel>
              <Input
                id="create-invoice-code"
                value={invoiceCode}
                onChange={(e) => {
                  setInvoiceCode(e.target.value);
                  if (errors.invoice) setErrors((prev) => ({ ...prev, invoice: undefined }));
                }}
                placeholder="ej. INV008"
                className="bg-white"
              />
              {errors.invoice && <FieldError>{errors.invoice}</FieldError>}
              <FieldDescription>Identificador único con formato INV###.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="create-status">Estado de Pago</FieldLabel>
              <select
                id="create-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-white px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="Paid">Paid (Pagado)</option>
                <option value="Pending">Pending (Pendiente)</option>
                <option value="Unpaid">Unpaid (No Pagado)</option>
              </select>
              <FieldDescription>Estado inicial del registro.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="create-method">Método de Pago</FieldLabel>
              <select
                id="create-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-white px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="PayPal">PayPal</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
              <FieldDescription>Medio seleccionado para la transacción.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="create-amount">Monto Total</FieldLabel>
              <Input
                id="create-amount"
                value={totalAmount}
                onChange={(e) => {
                  setTotalAmount(e.target.value);
                  if (errors.totalAmount) setErrors((prev) => ({ ...prev, totalAmount: undefined }));
                }}
                placeholder="ej. $150.00"
                className="bg-white"
              />
              {errors.totalAmount && <FieldError>{errors.totalAmount}</FieldError>}
              <FieldDescription>Valor monetario a registrar en USD.</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4 pt-2 border-t border-slate-100 sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear Factura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

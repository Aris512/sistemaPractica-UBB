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

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSave: (originalInvoiceId: string, updatedInvoice: Invoice) => void;
}

export function EditModal({ isOpen, onClose, invoice, onSave }: EditModalProps) {
  const [invoiceCode, setInvoiceCode] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("Paid");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [totalAmount, setTotalAmount] = useState("");
  const [errors, setErrors] = useState<{ invoice?: string; totalAmount?: string }>({});

  useEffect(() => {
    if (invoice) {
      setInvoiceCode(invoice.invoice);
      setPaymentStatus(invoice.paymentStatus);
      setPaymentMethod(invoice.paymentMethod);
      setTotalAmount(invoice.totalAmount);
      setErrors({});
    }
  }, [invoice]);

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

    if (!invoice) return;

    const formattedAmount = totalAmount.startsWith("$")
      ? totalAmount
      : formatCurrency(numAmount);

    onSave(invoice.invoice, {
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
          <DialogTitle className="text-slate-900 font-bold">Editar Factura</DialogTitle>
          <DialogDescription className="text-slate-500">
            Modifica los detalles del registro seleccionado en tiempo real.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="edit-invoice-code">Código de Factura</FieldLabel>
              <Input
                id="edit-invoice-code"
                value={invoiceCode}
                onChange={(e) => {
                  setInvoiceCode(e.target.value);
                  if (errors.invoice) setErrors((prev) => ({ ...prev, invoice: undefined }));
                }}
                placeholder="ej. INV001"
                className="bg-white"
              />
              {errors.invoice && <FieldError>{errors.invoice}</FieldError>}
              <FieldDescription>Identificador único de la factura.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-status">Estado de Pago</FieldLabel>
              <select
                id="edit-status"
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-white px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="Paid">Paid (Pagado)</option>
                <option value="Pending">Pending (Pendiente)</option>
                <option value="Unpaid">Unpaid (No Pagado)</option>
              </select>
              <FieldDescription>Estado actual del procesamiento de cobro.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-method">Método de Pago</FieldLabel>
              <select
                id="edit-method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-white px-2.5 py-1 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="PayPal">PayPal</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
              <FieldDescription>Canal registrado para la transacción.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-amount">Monto Total</FieldLabel>
              <Input
                id="edit-amount"
                value={totalAmount}
                onChange={(e) => {
                  setTotalAmount(e.target.value);
                  if (errors.totalAmount) setErrors((prev) => ({ ...prev, totalAmount: undefined }));
                }}
                placeholder="ej. $250.00"
                className="bg-white"
              />
              {errors.totalAmount && <FieldError>{errors.totalAmount}</FieldError>}
              <FieldDescription>Valor monetario de la factura en USD.</FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-4 pt-2 border-t border-slate-100 sm:justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

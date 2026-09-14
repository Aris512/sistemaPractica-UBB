import { useState, useMemo, useEffect } from "react";

export interface Invoice {
  invoice: string;
  paymentStatus: "Paid" | "Pending" | "Unpaid" | string;
  totalAmount: string;
  paymentMethod: string;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  column: keyof Invoice | null;
  direction: SortDirection;
}

export const initialInvoices: Invoice[] = [
  {
    invoice: "INV001",
    paymentStatus: "Paid",
    totalAmount: "$250.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV002",
    paymentStatus: "Pending",
    totalAmount: "$150.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV003",
    paymentStatus: "Unpaid",
    totalAmount: "$350.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV004",
    paymentStatus: "Paid",
    totalAmount: "$450.00",
    paymentMethod: "Credit Card",
  },
  {
    invoice: "INV005",
    paymentStatus: "Paid",
    totalAmount: "$550.00",
    paymentMethod: "PayPal",
  },
  {
    invoice: "INV006",
    paymentStatus: "Pending",
    totalAmount: "$200.00",
    paymentMethod: "Bank Transfer",
  },
  {
    invoice: "INV007",
    paymentStatus: "Unpaid",
    totalAmount: "$300.00",
    paymentMethod: "Credit Card",
  },
];

export const PAYMENT_METHODS = ["ALL", "Credit Card", "PayPal", "Bank Transfer"] as const;
export const PAYMENT_STATUSES = ["ALL", "Paid", "Pending", "Unpaid"] as const;

export function parseAmount(amountStr: string): number {
  const numeric = amountStr.replace(/[^0-9.-]+/g, "");
  return parseFloat(numeric) || 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function calculateTotalAmount(items: Invoice[]): string {
  const total = items.reduce((sum, item) => sum + parseAmount(item.totalAmount), 0);
  return formatCurrency(total);
}

export function sortInvoices(
  items: Invoice[],
  column: keyof Invoice | null,
  direction: SortDirection
): Invoice[] {
  if (!column || !direction) return items;

  return [...items].sort((a, b) => {
    let comparison = 0;
    if (column === "totalAmount") {
      comparison = parseAmount(a.totalAmount) - parseAmount(b.totalAmount);
    } else {
      comparison = String(a[column]).localeCompare(String(b[column]));
    }
    return direction === "asc" ? comparison : -comparison;
  });
}

export function filterInvoices(
  items: Invoice[],
  searchQuery: string,
  statusFilter: string = "ALL",
  methodFilter: string = "ALL"
): Invoice[] {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      item.paymentStatus.toLowerCase() === statusFilter.toLowerCase();

    const matchesMethod =
      methodFilter === "ALL" ||
      item.paymentMethod.toLowerCase() === methodFilter.toLowerCase();

    if (!matchesStatus || !matchesMethod) return false;
    if (!query) return true;

    return (
      item.invoice.toLowerCase().includes(query) ||
      item.paymentMethod.toLowerCase().includes(query) ||
      item.paymentStatus.toLowerCase().includes(query) ||
      item.totalAmount.toLowerCase().includes(query)
    );
  });
}

export function useDataTableFeatures(
  initialData: Invoice[] = initialInvoices,
  defaultPageSize: number = 5
) {
  const [data, setData] = useState<Invoice[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });

  // Reset to first page whenever real-time filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, methodFilter]);

  const handleSort = (column: keyof Invoice) => {
    setSortState((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  };

  const filteredAndSortedData = useMemo(() => {
    const filtered = filterInvoices(data, searchQuery, statusFilter, methodFilter);
    return sortInvoices(filtered, sortState.column, sortState.direction);
  }, [data, searchQuery, statusFilter, methodFilter, sortState]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedData.length / pageSize));
  }, [filteredAndSortedData.length, pageSize]);

  // Ensure current page does not exceed totalPages
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSortedData.slice(start, start + pageSize);
  }, [filteredAndSortedData, page, pageSize]);

  const totalAmount = useMemo(() => {
    return calculateTotalAmount(filteredAndSortedData);
  }, [filteredAndSortedData]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      searchQuery.trim() !== "" || statusFilter !== "ALL" || methodFilter !== "ALL"
    );
  }, [searchQuery, statusFilter, methodFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setMethodFilter("ALL");
    setPage(1);
  };

  const createInvoice = (newInvoice: Invoice) => {
    setData((prev) => [newInvoice, ...prev]);
  };

  const updateInvoice = (originalInvoiceId: string, updatedInvoice: Invoice) => {
    setData((prev) =>
      prev.map((item) =>
        item.invoice === originalInvoiceId ? updatedInvoice : item
      )
    );
  };

  const deleteInvoice = (invoiceId: string) => {
    setData((prev) => prev.filter((item) => item.invoice !== invoiceId));
  };

  const duplicateInvoice = (invoiceId: string) => {
    setData((prev) => {
      const item = prev.find((i) => i.invoice === invoiceId);
      if (!item) return prev;
      const count = prev.filter((i) => i.invoice.startsWith(item.invoice)).length;
      const newInvoice: Invoice = {
        ...item,
        invoice: `${item.invoice}-C${count}`,
      };
      return [newInvoice, ...prev];
    });
  };

  return {
    data,
    setData,
    filteredAndSortedData,
    paginatedData,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems: filteredAndSortedData.length,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    hasActiveFilters,
    clearFilters,
    sortState,
    handleSort,
    totalAmount,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
  };
}

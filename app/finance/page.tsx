"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { ExpenseBreakdownChart } from "@/components/finance/expense-breakdown-chart";
import { IncomeExpenseChart } from "@/components/finance/income-expense-chart";
import { QuickAddTransactionDialog } from "@/components/finance/quick-add-transaction-dialog";
import { TransactionsTable } from "@/components/finance/transactions-table";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_MONTHS_VALUE,
  filterTransactionsByMonth,
  getAvailableMonthOptions,
  getExpenseBreakdown,
  getIncomeExpenseTrend,
} from "@/lib/dashboard-metrics";
import type { FinanceTransaction, TransactionFormInput, TransactionType } from "@/lib/types";

const ALL_TYPE_FILTER = "all";
const ALL_CATEGORY_FILTER = "all";

type TypeFilterValue = TransactionType | typeof ALL_TYPE_FILTER;

export default function FinancePage() {
  const {
    finances,
    students,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    toggleTransactionStatus,
  } = useAppData();

  const [selectedMonth, setSelectedMonth] = React.useState(ALL_MONTHS_VALUE);
  const [selectedType, setSelectedType] = React.useState<TypeFilterValue>(ALL_TYPE_FILTER);
  const [selectedCategory, setSelectedCategory] = React.useState(ALL_CATEGORY_FILTER);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<FinanceTransaction | null>(
    null,
  );

  const monthOptions = React.useMemo(() => getAvailableMonthOptions(finances), [finances]);

  React.useEffect(() => {
    if (!monthOptions.some((option) => option.value === selectedMonth)) {
      setSelectedMonth(monthOptions[0]?.value ?? ALL_MONTHS_VALUE);
    }
  }, [monthOptions, selectedMonth]);

  const monthScopedTransactions = React.useMemo(
    () => filterTransactionsByMonth(finances, selectedMonth),
    [finances, selectedMonth],
  );

  const typeFilteredTransactions = React.useMemo(
    () =>
      selectedType === ALL_TYPE_FILTER
        ? monthScopedTransactions
        : monthScopedTransactions.filter((item) => item.type === selectedType),
    [monthScopedTransactions, selectedType],
  );

  const categoryOptions = React.useMemo(
    () =>
      Array.from(new Set(typeFilteredTransactions.map((item) => item.category)))
        .sort((left, right) => left.localeCompare(right))
        .map((category) => ({ value: category, label: category })),
    [typeFilteredTransactions],
  );

  React.useEffect(() => {
    if (!categoryOptions.some((option) => option.value === selectedCategory)) {
      setSelectedCategory(ALL_CATEGORY_FILTER);
    }
  }, [categoryOptions, selectedCategory]);

  const filteredTransactions = React.useMemo(
    () =>
      selectedCategory === ALL_CATEGORY_FILTER
        ? typeFilteredTransactions
        : typeFilteredTransactions.filter((item) => item.category === selectedCategory),
    [typeFilteredTransactions, selectedCategory],
  );

  const trendData = React.useMemo(
    () => getIncomeExpenseTrend(filteredTransactions, selectedMonth),
    [filteredTransactions, selectedMonth],
  );

  const expenseBreakdown = React.useMemo(
    () => getExpenseBreakdown(filteredTransactions, selectedMonth),
    [filteredTransactions, selectedMonth],
  );

  const monthTransactions = React.useMemo(
    () => [...filteredTransactions].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate)),
    [filteredTransactions],
  );

  async function handleDialogSubmit(input: TransactionFormInput) {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, input);
      setEditingTransaction(null);
      return;
    }
    await addTransaction(input);
  }

  function handleEdit(item: FinanceTransaction) {
    setEditingTransaction(item);
    setDialogOpen(true);
  }

  function openCreateDialog() {
    setEditingTransaction(null);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading finance data...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-7">
      <div>
        <h1 className="page-title">Finance</h1>
        <p className="page-subtitle">Track monthly performance and transactions.</p>
      </div>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-3xl lg:grid-cols-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((monthOption) => (
                <SelectItem key={monthOption.value} value={monthOption.value}>
                  {monthOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as TypeFilterValue)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPE_FILTER}>All Sources</SelectItem>
              <SelectItem value="income">Income Sources</SelectItem>
              <SelectItem value="expense">Expense Sources</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select source category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CATEGORY_FILTER}>All Categories</SelectItem>
              {categoryOptions.map((categoryOption) => (
                <SelectItem key={categoryOption.value} value={categoryOption.value}>
                  {categoryOption.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={openCreateDialog} className="sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Quick Add Transaction
        </Button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <IncomeExpenseChart data={trendData} />
        <ExpenseBreakdownChart data={expenseBreakdown} />
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionsTable
              transactions={monthTransactions}
              students={students}
              onEdit={handleEdit}
              onDelete={deleteTransaction}
              onToggleStatus={toggleTransactionStatus}
            />
          </CardContent>
        </Card>
      </section>

      <QuickAddTransactionDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingTransaction(null);
          }
        }}
        students={students}
        onSubmit={handleDialogSubmit}
        initialData={editingTransaction}
      />
    </div>
  );
}

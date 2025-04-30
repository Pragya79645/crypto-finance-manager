"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { DashboardNav } from "@/components/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, Gift, Search, ArrowUpDown, ExternalLink } from "lucide-react"
import { deskreeClient } from "@/lib/deskree"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

type Transaction = {
  id: string
  amount: number
  type: "deposit" | "donation"
  goalId: string
  goalTitle: string
  userId: string
  timestamp: string
  txHash?: string
  sender?: string
  message?: string
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const { toast } = useToast()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await deskreeClient.database.getAll("transactions")
        const userTransactions = response.data.filter((transaction: any) => transaction.userId === user?.id)
        setTransactions(userTransactions)
      } catch (error) {
        console.error("Error fetching transactions:", error)
        toast({
          variant: "destructive",
          title: "Error loading transactions",
          description: "Could not load your transaction history. Please try again later.",
        })
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchTransactions()
    }
  }, [user, toast])

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter((transaction) => {
      // Apply type filter
      if (filter !== "all" && transaction.type !== filter) {
        return false
      }

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          transaction.goalTitle.toLowerCase().includes(searchLower) ||
          transaction.id.toLowerCase().includes(searchLower) ||
          (transaction.message && transaction.message.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime()
      const dateB = new Date(b.timestamp).getTime()
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    })

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardNav />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">Transaction History</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="deposit">Deposits</SelectItem>
                <SelectItem value="donation">Donations</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title={`Sort by date ${sortOrder === "asc" ? "newest first" : "oldest first"}`}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-5 bg-muted rounded w-1/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {transaction.type === "deposit" ? (
                          <Wallet className="mr-2 h-5 w-5 text-green-500" />
                        ) : (
                          <Gift className="mr-2 h-5 w-5 text-blue-500" />
                        )}
                        {transaction.type === "deposit" ? "Deposit" : "Donation"} to {transaction.goalTitle}
                      </CardTitle>
                      <CardDescription>{new Date(transaction.timestamp).toLocaleString()}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        +{transaction.amount} {transaction.type === "deposit" ? "Tokens" : "XLM"}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Transaction ID</Label>
                      <div className="text-sm font-mono truncate">{transaction.id}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Goal</Label>
                      <div className="text-sm">
                        <Link href={`/goals/${transaction.goalId}`} className="hover:underline flex items-center">
                          {transaction.goalTitle}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                    {transaction.txHash && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Blockchain Transaction</Label>
                        <div className="text-sm font-mono truncate">{transaction.txHash}</div>
                      </div>
                    )}
                    {transaction.sender && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Sender</Label>
                        <div className="text-sm font-mono truncate">{transaction.sender}</div>
                      </div>
                    )}
                    {transaction.message && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Message</Label>
                        <div className="text-sm">{transaction.message}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
            <div className="rounded-full bg-muted p-3 mb-4">
              {filter === "deposit" ? (
                <Wallet className="h-6 w-6 text-muted-foreground" />
              ) : filter === "donation" ? (
                <Gift className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Search className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-medium mb-2">No transactions found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {search
                ? "No transactions match your search criteria."
                : filter !== "all"
                  ? `You don't have any ${filter}s yet.`
                  : "You haven't made any transactions yet."}
            </p>
            {search && (
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
